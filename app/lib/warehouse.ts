/**
 * Складские утилиты — минимальная версия для стоматологической клиники
 */
import { prisma } from "@/lib/prisma"

/**
 * Генерация следующего номера документа
 */
export async function nextDocumentNumber(type: string): Promise<string> {
  const prefix = type.slice(0, 3).toUpperCase()
  const year = new Date().getFullYear()

  const count = await prisma.stockDocument.count({
    where: {
      number: { startsWith: `${prefix}-${year}` },
    },
  })

  return `${prefix}-${year}-${String(count + 1).padStart(4, "0")}`
}

/**
 * Проведение складского документа — применение движений к остаткам
 */
export async function postStockDocument(documentId: string) {
  const doc = await prisma.stockDocument.findUnique({
    where: { id: documentId },
    include: { movements: true },
  })

  if (!doc) throw new Error("Документ не найден")
  if (doc.status === "POSTED") throw new Error("Документ уже проведён")

  // Применяем каждое движение
  for (const mov of doc.movements) {
    await prisma.stock.upsert({
      where: {
        productId_warehouseId_batchId: {
          productId: mov.productId,
          warehouseId: mov.warehouseId,
          batchId: mov.batchId ?? "",
        },
      },
      update: {
        quantity: { increment: mov.quantity },
      },
      create: {
        productId: mov.productId,
        warehouseId: mov.warehouseId,
        batchId: mov.batchId,
        quantity: mov.quantity,
      },
    })
  }

  // Меняем статус
  await prisma.stockDocument.update({
    where: { id: documentId },
    data: { status: "POSTED" },
  })
}
