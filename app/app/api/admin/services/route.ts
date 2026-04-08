import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/admin/services — список услуг с категориями
export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 })

  const categories = await prisma.serviceCategory.findMany({
    orderBy: { order: "asc" },
    include: {
      services: {
        orderBy: { order: "asc" },
      },
    },
  })

  return NextResponse.json(categories)
}

// POST /api/admin/services — создание услуги
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 })

  const role = (session.user as { role: string }).role
  if (role !== "OWNER" && role !== "MANAGER") {
    return NextResponse.json({ error: "Недостаточно прав" }, { status: 403 })
  }

  const body = await req.json()
  const { name, slug, description, categoryId, price, priceMax, durationMin, published } = body

  if (!name || !slug || !categoryId || price == null) {
    return NextResponse.json({ error: "name, slug, categoryId и price обязательны" }, { status: 400 })
  }

  const service = await prisma.service.create({
    data: {
      name,
      slug,
      description: description || null,
      categoryId,
      price,
      priceMax: priceMax || null,
      durationMin: durationMin || 30,
      published: published !== false,
    },
  })

  return NextResponse.json(service)
}
