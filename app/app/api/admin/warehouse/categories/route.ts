import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

function adminOnly() {
  return (session: { user?: { role?: string } } | null) => {
    if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    return null
  }
}

/** GET /api/admin/warehouse/categories — список категорий витрины */
export async function GET() {
  const session = await auth()
  const err = adminOnly()(session)
  if (err) return err

  const categories = await prisma.storeCategory.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
  })
  return NextResponse.json({
    categories: categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      order: c.order,
      parentId: c.parentId,
    })),
  })
}

/** POST /api/admin/warehouse/categories — создать категорию */
export async function POST(request: Request) {
  const session = await auth()
  const err = adminOnly()(session)
  if (err) return err

  const body = await request.json() as { name: string; slug?: string; order?: number; parentId?: string }
  const name = (body.name ?? "").trim()
  if (!name) {
    return NextResponse.json({ error: "Название обязательно" }, { status: 400 })
  }

  const { generateSlug } = await import("@/lib/utils")
  const slug = body.slug?.trim() || generateSlug(name)
  if (!slug) {
    return NextResponse.json({ error: "Невозможно сгенерировать slug" }, { status: 400 })
  }

  const category = await prisma.storeCategory.create({
    data: {
      name,
      slug,
      order: typeof body.order === "number" ? body.order : 0,
      parentId: body.parentId?.trim() || null,
    },
  })
  return NextResponse.json({
    category: {
      id: category.id,
      name: category.name,
      slug: category.slug,
      order: category.order,
      parentId: category.parentId,
    },
  })
}
