import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { nextDocumentNumber, postStockDocument } from "@/lib/warehouse"
import { NextResponse } from "next/server"

/** GET — мои складские операции */
export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const documents = await prisma.stockDocument.findMany({
    where: { createdById: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      movements: {
        include: { product: { select: { name: true, sku: true, unit: true } } },
      },
    },
  })

  return NextResponse.json(
    documents.map((d) => ({
      id: d.id,
      number: d.number,
      type: d.type,
      status: d.status,
      comment: d.comment,
      date: d.documentDate.toISOString(),
      items: d.movements.map((m) => ({
        product: m.product.name,
        sku: m.product.sku,
        quantity: Number(m.quantity),
        unit: m.product.unit,
      })),
    })),
  )
}

/** POST — быстрая складская операция */
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

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

  let warehouse = await prisma.warehouse.findFirst({ where: { type: "MAIN" } })
  if (!warehouse) {
    warehouse = await prisma.warehouse.create({ data: { name: "Основной склад", type: "MAIN" } })
  }

  const docNumber = await nextDocumentNumber(type)
  const movementType = type === "RECEIPT" ? "RECEIPT" : "SHIPMENT"
  const qty = type === "RECEIPT" ? quantity : -quantity

  const parts: string[] = []
  if (clientId) {
    const client = await prisma.client.findUnique({ where: { id: clientId }, select: { name: true } })
    if (client) parts.push(`Клиент: ${client.name}`)
  }
  if (comment) parts.push(comment)

  try {
    const doc = await prisma.stockDocument.create({
      data: {
        type,
        number: docNumber,
        status: "DRAFT",
        comment: parts.join(". ") || null,
        createdById: session.user.id,
        movements: {
          create: { type: movementType, productId, warehouseId: warehouse.id, quantity: qty },
        },
      },
    })

    await postStockDocument(doc.id)
    return NextResponse.json({ ok: true, documentId: doc.id })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ошибка при создании документа"
    console.error("[my-warehouse POST]", err)
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
