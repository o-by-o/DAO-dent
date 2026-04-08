/**
 * POST /api/admin/warehouse/quick-operation
 * Быстрая складская операция: продажа, приход, списание
 */

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { nextDocumentNumber, postStockDocument } from "@/lib/warehouse"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { type, productId, quantity, clientId, comment } = (await req.json()) as {
    type: "RECEIPT" | "WRITE_OFF"
    productId: string
    quantity: number
    clientId?: string
    comment?: string
  }

  if (!productId || !quantity || quantity <= 0) {
    return NextResponse.json({ error: "Укажите товар и количество" }, { status: 400 })
  }

  // Найдём дефолтный склад (или первый доступный)
  let warehouse = await prisma.warehouse.findFirst({ where: { type: "MAIN" } })
  if (!warehouse) {
    warehouse = await prisma.warehouse.findFirst()
  }
  if (!warehouse) {
    // Создадим основной склад автоматически
    warehouse = await prisma.warehouse.create({
      data: { name: "Основной склад", type: "MAIN" },
    })
  }

  const docNumber = await nextDocumentNumber(type)
  const movementType = type === "RECEIPT" ? "RECEIPT" : "SHIPMENT"
  const qty = type === "RECEIPT" ? quantity : -quantity

  // Собираем комментарий
  const parts: string[] = []
  if (clientId) {
    const patient = await prisma.patient.findUnique({
      where: { id: clientId },
      select: { firstName: true, lastName: true },
    })
    if (patient) parts.push(`Пациент: ${patient.lastName} ${patient.firstName}`)
  }
  if (comment) parts.push(comment)

  const doc = await prisma.stockDocument.create({
    data: {
      type,
      number: docNumber,
      status: "DRAFT",
      comment: parts.join(". ") || null,
      createdById: session.user.id,
      movements: {
        create: {
          type: movementType,
          productId,
          warehouseId: warehouse.id,
          quantity: qty,
        },
      },
    },
  })

  // Сразу проводим документ
  await postStockDocument(doc.id)

  return NextResponse.json({ ok: true, documentId: doc.id, number: docNumber })
}
