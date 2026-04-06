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

/** GET /api/admin/warehouse/products */
export async function GET() {
  const session = await auth()
  const err = adminOnly()(session)
  if (err) return err

  const products = await prisma.product.findMany({
    include: { category: { select: { id: true, name: true, slug: true } } },
    orderBy: [{ order: "asc" }, { name: "asc" }],
  })
  return NextResponse.json({
    products: products.map((p) => ({
      id: p.id,
      sku: p.sku,
      name: p.name,
      unit: p.unit,
      trackBatch: p.trackBatch,
      description: p.description,
      price: p.price ? Number(p.price) : null,
      imageUrl: p.imageUrl,
      slug: p.slug,
      published: p.published,
      order: p.order,
      categoryId: p.categoryId,
      category: p.category,
      brand: p.brand,
      createdAt: p.createdAt.toISOString(),
    })),
  })
}

/** POST /api/admin/warehouse/products */
export async function POST(request: Request) {
  const session = await auth()
  const err = adminOnly()(session)
  if (err) return err

  const body = await request.json() as {
    sku: string
    name: string
    unit?: string
    trackBatch?: boolean
    description?: string
    price?: number
    imageUrl?: string
    slug?: string
    published?: boolean
    order?: number
    categoryId?: string
    brand?: string
  }
  const sku = (body.sku ?? "").trim()
  const name = (body.name ?? "").trim()
  if (!sku || !name) {
    return NextResponse.json({ error: "SKU и название обязательны" }, { status: 400 })
  }

  const unit = ["PCS", "PACK", "ML", "G", "L", "KG"].includes(body.unit ?? "")
    ? (body.unit as "PCS" | "PACK" | "ML" | "G" | "L" | "KG")
    : "PCS"

  const { generateSlug } = await import("@/lib/utils")
  const slug =
    typeof body.slug === "string" && body.slug.trim()
      ? body.slug.trim()
      : generateSlug(name) || null

  const product = await prisma.product.create({
    data: {
      sku,
      name,
      unit,
      trackBatch: !!body.trackBatch,
      description: body.description?.trim() || null,
      price: typeof body.price === "number" && body.price >= 0 ? body.price : null,
      imageUrl: body.imageUrl?.trim() || null,
      slug: (slug && slug.length > 0) ? slug : null,
      published: !!body.published,
      order: typeof body.order === "number" ? body.order : 0,
      categoryId: body.categoryId?.trim() || null,
      brand: typeof body.brand === "string" ? body.brand.trim() || null : null,
    },
  })
  return NextResponse.json({
    product: {
      id: product.id,
      sku: product.sku,
      name: product.name,
      unit: product.unit,
      trackBatch: product.trackBatch,
      description: product.description,
      price: product.price ? Number(product.price) : null,
      imageUrl: product.imageUrl,
      slug: product.slug,
      published: product.published,
      order: product.order,
      categoryId: product.categoryId,
      brand: product.brand,
    },
  })
}
