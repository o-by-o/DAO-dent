import { prisma } from "@/lib/prisma"
import type { StockDocumentType } from "@prisma/client"
import { Decimal } from "@prisma/client/runtime/library"

/**
 * Проводит документ: обновляет остатки Stock по движениям.
 * RECEIPT: положительные количества — приход на склад.
 * WRITE_OFF / SHIPMENT: отрицательные — списание.
 * TRANSFER: пары движений (минус с одного склада, плюс на другой).
 * INVENTORY: движения ADJUSTMENT с разницей факт−учёт.
 */
export async function postStockDocument(documentId: string): Promise<void> {
  const doc = await prisma.stockDocument.findUnique({
    where: { id: documentId },
    include: { movements: true },
  })
  if (!doc) throw new Error("Документ не найден")
  if (doc.status === "POSTED") throw new Error("Документ уже проведён")

  await prisma.$transaction(async (tx) => {
    for (const mov of doc.movements) {
      const qty = new Decimal(mov.quantity)
      const productId = mov.productId
      const warehouseId = mov.warehouseId
      const batchId = mov.batchId ?? null

      const current = await tx.stock.findFirst({
        where: {
          productId,
          warehouseId,
          ...(batchId ? { batchId } : { batchId: null }),
        },
      })

      const currentQty = current ? new Decimal(current.quantity) : new Decimal(0)
      const newQty = currentQty.plus(qty)

      if (newQty.lessThan(0)) {
        throw new Error(
          `Недостаточно остатка по товару ${mov.productId} на складе ${mov.warehouseId}`
        )
      }

      if (current) {
        await tx.stock.update({
          where: { id: current.id },
          data: { quantity: newQty },
        })
      } else {
        if (newQty.lessThanOrEqualTo(0)) continue
        await tx.stock.create({
          data: {
            productId,
            warehouseId,
            batchId,
            quantity: newQty,
          },
        })
      }
    }

    await tx.stockDocument.update({
      where: { id: documentId },
      data: { status: "POSTED" },
    })
  })
}

const DOC_PREFIX: Record<StockDocumentType, string> = {
  RECEIPT: "REC",
  WRITE_OFF: "WO",
  TRANSFER: "TR",
  INVENTORY: "INV",
}

/** Генерирует следующий номер документа по типу (например REC-00001). */
export async function nextDocumentNumber(
  type: StockDocumentType
): Promise<string> {
  const prefix = DOC_PREFIX[type] + "-"
  const last = await prisma.stockDocument.findFirst({
    where: { number: { startsWith: prefix } },
    orderBy: { number: "desc" },
    select: { number: true },
  })
  const num = last
    ? parseInt(last.number.slice(prefix.length), 10) + 1
    : 1
  return `${prefix}${String(num).padStart(5, "0")}`
}
