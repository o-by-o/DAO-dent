import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/** GET /api/admin/warehouse/products/[id] */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 })

  const { id } = await params
  const product = await prisma.product.findUnique({ where: { id } })
  if (!product) return NextResponse.json({ error: "Товар не найден" }, { status: 404 })
  return NextResponse.json({ product })
}

/** PATCH /api/admin/warehouse/products/[id] */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const data: Record<string, unknown> = {}

  if (typeof body.sku === "string" && body.sku.trim()) data.sku = body.sku.trim()
  if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim()
  if (["PCS", "PACK", "ML", "G", "L", "KG"].includes(body.unit ?? "")) data.unit = body.unit
  if (typeof body.trackBatch === "boolean") data.trackBatch = body.trackBatch

  const product = await prisma.product.update({ where: { id }, data })
  return NextResponse.json({ product })
}

/** DELETE /api/admin/warehouse/products/[id] */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 })

  const { id } = await params
  await prisma.product.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
