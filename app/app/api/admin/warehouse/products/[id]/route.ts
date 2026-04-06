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

/** GET /api/admin/warehouse/products/[id] */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  const err = adminOnly()(session)
  if (err) return err

  const { id } = await params
  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: { select: { id: true, name: true, slug: true } } },
  })
  if (!product) return NextResponse.json({ error: "Товар не найден" }, { status: 404 })
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
      category: product.category,
      brand: product.brand,
    },
  })
}

/** PATCH /api/admin/warehouse/products/[id] */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  const err = adminOnly()(session)
  if (err) return err

  const { id } = await params
  const body = await request.json() as {
    sku?: string
    name?: string
    unit?: string
    trackBatch?: boolean
    description?: string
    price?: number
    imageUrl?: string
    slug?: string
    published?: boolean
    order?: number
    categoryId?: string | null
    brand?: string | null
  }
  const data: Record<string, unknown> = {}
  if (typeof body.sku === "string" && body.sku.trim()) data.sku = body.sku.trim()
  if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim()
  if (["PCS", "PACK", "ML", "G", "L", "KG"].includes(body.unit ?? "")) data.unit = body.unit
  if (typeof body.trackBatch === "boolean") data.trackBatch = body.trackBatch
  if (body.description !== undefined) data.description = body.description?.trim() || null
  if (body.price !== undefined) data.price = typeof body.price === "number" && body.price >= 0 ? body.price : null
  if (body.imageUrl !== undefined) data.imageUrl = body.imageUrl?.trim() || null
  if (body.slug !== undefined) data.slug = body.slug?.trim() || null
  if (typeof body.published === "boolean") data.published = body.published
  if (typeof body.order === "number") data.order = body.order
  if (body.categoryId !== undefined) data.categoryId = body.categoryId?.trim() || null
  if (body.brand !== undefined) data.brand = body.brand?.trim() || null

  const product = await prisma.product.update({ where: { id }, data })
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
    },
  })
}

/** DELETE /api/admin/warehouse/products/[id] */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  const err = adminOnly()(session)
  if (err) return err

  const { id } = await params
  await prisma.product.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
