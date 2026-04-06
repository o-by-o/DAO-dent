import { NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"
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

/** GET /api/admin/warehouse/stock — остатки по складам (и по партиям при необходимости) */
export async function GET(request: Request) {
  const session = await auth()
  const err = adminOnly()(session)
  if (err) return err

  const { searchParams } = new URL(request.url)
  const warehouseId = searchParams.get("warehouseId") ?? ""

  const where: Prisma.StockWhereInput = {}
  if (warehouseId) where.warehouseId = warehouseId

  const stocks = await prisma.stock.findMany({
    where,
    include: {
      product: { select: { id: true, sku: true, name: true, unit: true } },
      warehouse: { select: { id: true, name: true } },
      batch: { select: { id: true, batchNumber: true, expiryDate: true } },
    },
    orderBy: [{ warehouse: { name: "asc" } }, { product: { name: "asc" } }],
  })

  const list = stocks
    .filter((s) => Number(s.quantity) !== 0)
    .map((s) => ({
      id: s.id,
      productId: s.productId,
      product: s.product,
      warehouseId: s.warehouseId,
      warehouse: s.warehouse,
      batchId: s.batchId,
      batch: s.batch
        ? {
            id: s.batch.id,
            batchNumber: s.batch.batchNumber,
            expiryDate: s.batch.expiryDate?.toISOString() ?? null,
          }
        : null,
      quantity: Number(s.quantity),
    }))

  return NextResponse.json({ stock: list })
}
