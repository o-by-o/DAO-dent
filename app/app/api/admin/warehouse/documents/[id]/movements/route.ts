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

/** POST /api/admin/warehouse/documents/[id]/movements — добавить строку движения (только DRAFT) */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  const err = adminOnly()(session)
  if (err) return err

  const { id: documentId } = await params
  const doc = await prisma.stockDocument.findUnique({ where: { id: documentId } })
  if (!doc) return NextResponse.json({ error: "Документ не найден" }, { status: 404 })
  if (doc.status !== "DRAFT") {
    return NextResponse.json({ error: "Можно добавлять строки только в черновик" }, { status: 400 })
  }

  const body = await request.json() as {
    type: string
    productId: string
    warehouseId: string
    batchId?: string | null
    quantity: number
  }
  const { type, productId, warehouseId, batchId, quantity } = body
  if (!["RECEIPT", "SHIPMENT", "TRANSFER", "ADJUSTMENT"].includes(type)) {
    return NextResponse.json({ error: "Недопустимый тип движения" }, { status: 400 })
  }
  if (!productId || !warehouseId || typeof quantity !== "number") {
    return NextResponse.json({ error: "Укажите товар, склад и количество" }, { status: 400 })
  }

  const mov = await prisma.stockMovement.create({
    data: {
      documentId,
      type: type as "RECEIPT" | "SHIPMENT" | "TRANSFER" | "ADJUSTMENT",
      productId,
      warehouseId,
      batchId: batchId || null,
      quantity,
    },
    include: {
      product: { select: { id: true, sku: true, name: true, unit: true } },
      warehouse: { select: { id: true, name: true } },
      batch: { select: { id: true, batchNumber: true, expiryDate: true } },
    },
  })

  return NextResponse.json({
    movement: {
      id: mov.id,
      type: mov.type,
      product: mov.product,
      warehouse: mov.warehouse,
      batch: mov.batch,
      quantity: Number(mov.quantity),
    },
  })
}
