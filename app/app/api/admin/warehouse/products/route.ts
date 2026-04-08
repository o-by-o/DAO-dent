import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/** GET /api/admin/warehouse/products — список товаров (стоматологические материалы) */
export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 })

  const products = await prisma.product.findMany({
    orderBy: { name: "asc" },
  })

  return NextResponse.json(
    products.map((p) => ({
      id: p.id,
      sku: p.sku,
      name: p.name,
      unit: p.unit,
      trackBatch: p.trackBatch,
      minQuantity: p.minQuantity ? Number(p.minQuantity) : null,
    })),
  )
}

/** POST /api/admin/warehouse/products — создать товар */
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 })

  const body = await request.json()
  const { sku, name, unit, trackBatch, minQuantity } = body

  if (!sku?.trim() || !name?.trim()) {
    return NextResponse.json({ error: "SKU и название обязательны" }, { status: 400 })
  }

  const product = await prisma.product.create({
    data: {
      sku: sku.trim(),
      name: name.trim(),
      unit: unit || "PCS",
      trackBatch: !!trackBatch,
      minQuantity: minQuantity != null ? minQuantity : null,
    },
  })

  return NextResponse.json({
    id: product.id,
    sku: product.sku,
    name: product.name,
    unit: product.unit,
    trackBatch: product.trackBatch,
  })
}
