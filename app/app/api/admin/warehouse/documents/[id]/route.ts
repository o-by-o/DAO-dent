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

/** GET /api/admin/warehouse/documents/[id] — документ с движениями */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  const err = adminOnly()(session)
  if (err) return err

  const { id } = await params
  const doc = await prisma.stockDocument.findUnique({
    where: { id },
    include: {
      movements: {
        include: {
          product: { select: { id: true, sku: true, name: true, unit: true } },
          warehouse: { select: { id: true, name: true } },
          batch: { select: { id: true, batchNumber: true, expiryDate: true } },
        },
      },
    },
  })
  if (!doc) return NextResponse.json({ error: "Документ не найден" }, { status: 404 })

  return NextResponse.json({
    document: {
      id: doc.id,
      type: doc.type,
      number: doc.number,
      documentDate: doc.documentDate.toISOString(),
      status: doc.status,
      comment: doc.comment,
      createdAt: doc.createdAt.toISOString(),
      movements: doc.movements.map((m) => ({
        id: m.id,
        type: m.type,
        productId: m.productId,
        product: m.product,
        warehouseId: m.warehouseId,
        warehouse: m.warehouse,
        batchId: m.batchId,
        batch: m.batch,
        quantity: Number(m.quantity),
      })),
    },
  })
}

/** PATCH /api/admin/warehouse/documents/[id] — обновить комментарий (только DRAFT) */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  const err = adminOnly()(session)
  if (err) return err

  const { id } = await params
  const doc = await prisma.stockDocument.findUnique({ where: { id } })
  if (!doc) return NextResponse.json({ error: "Документ не найден" }, { status: 404 })
  if (doc.status !== "DRAFT") {
    return NextResponse.json({ error: "Можно редактировать только черновик" }, { status: 400 })
  }

  const body = await request.json() as { comment?: string; documentDate?: string }
  const data: { comment?: string | null; documentDate?: Date } = {}
  if ("comment" in body) data.comment = body.comment?.trim() || null
  if (body.documentDate) data.documentDate = new Date(body.documentDate)

  const updated = await prisma.stockDocument.update({ where: { id }, data })
  return NextResponse.json({
    document: {
      id: updated.id,
      comment: updated.comment,
      documentDate: updated.documentDate.toISOString(),
    },
  })
}
