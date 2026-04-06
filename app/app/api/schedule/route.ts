import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export interface ScheduleEvent {
  id: string
  type: "call" | "birthday" | "stock" | "expiry" | "order" | "note"
  title: string
  date: string      // ISO
  time?: string     // "HH:mm"
  color: string
  meta?: {
    clientId?: string
    clientName?: string
    noteText?: string
    noteId?: string
    orderId?: string
    documentNumber?: string
    productName?: string
  }
}

/** GET /api/schedule?month=2026-04 */
export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id
  const isAdmin = (session.user as { role?: string }).role === "ADMIN"
  const { searchParams } = new URL(req.url)
  const monthParam = searchParams.get("month") // "2026-04"
  const now = new Date()
  const year = monthParam ? parseInt(monthParam.split("-")[0]) : now.getFullYear()
  const month = monthParam ? parseInt(monthParam.split("-")[1]) - 1 : now.getMonth()

  const start = new Date(year, month, 1)
  const end = new Date(year, month + 1, 0, 23, 59, 59)

  const events: ScheduleEvent[] = []

  // 1. Personal planner notes
  const plannerNotes = await prisma.plannerNote.findMany({
    where: {
      userId,
      date: { gte: start, lte: end },
    },
    orderBy: { date: "asc" },
  })
  for (const n of plannerNotes) {
    events.push({
      id: `pn-${n.id}`,
      type: "note",
      title: n.title,
      date: n.date.toISOString(),
      time: n.time ?? undefined,
      color: n.color ?? "#6b7280",
      meta: { noteId: n.id, noteText: n.text ?? undefined },
    })
  }

  // 2. Call reminders (own clients for STUDENT, all for ADMIN)
  const noteWhere = isAdmin
    ? { callAt: { gte: start, lte: end } }
    : { callAt: { gte: start, lte: end }, client: { ownerId: userId } }

  const clientNotes = await prisma.clientNote.findMany({
    where: noteWhere,
    include: { client: { select: { id: true, name: true } } },
    orderBy: { callAt: "asc" },
  })
  for (const n of clientNotes) {
    const t = n.callAt!
    events.push({
      id: `call-${n.id}`,
      type: "call",
      title: `Звонок: ${n.client.name}`,
      date: t.toISOString(),
      time: `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`,
      color: "#3b82f6",
      meta: { clientId: n.client.id, clientName: n.client.name, noteText: n.text },
    })
  }

  // 3. Birthdays
  const clientWhere = isAdmin
    ? { birthDate: { not: null } }
    : { ownerId: userId, birthDate: { not: null } }

  const clients = await prisma.client.findMany({
    where: clientWhere,
    select: { id: true, name: true, birthDate: true },
  })
  for (const c of clients) {
    if (!c.birthDate) continue
    if (c.birthDate.getMonth() === month) {
      const bd = new Date(year, month, c.birthDate.getDate())
      events.push({
        id: `bday-${c.id}`,
        type: "birthday",
        title: `ДР: ${c.name}`,
        date: bd.toISOString(),
        color: "#ec4899",
        meta: { clientId: c.id, clientName: c.name },
      })
    }
  }

  // 4. Stock documents (own for STUDENT, all for ADMIN)
  const stockWhere = isAdmin
    ? { documentDate: { gte: start, lte: end } }
    : { documentDate: { gte: start, lte: end }, createdById: userId }

  const stockDocs = await prisma.stockDocument.findMany({
    where: stockWhere,
    select: { id: true, type: true, number: true, documentDate: true },
    orderBy: { documentDate: "asc" },
  })
  const stockTypeLabels: Record<string, string> = {
    RECEIPT: "Приёмка",
    WRITE_OFF: "Списание",
    SALE: "Продажа",
    TRANSFER: "Перемещение",
    INVENTORY: "Инвентаризация",
  }
  for (const d of stockDocs) {
    events.push({
      id: `stock-${d.id}`,
      type: "stock",
      title: `${stockTypeLabels[d.type] ?? d.type}: ${d.number}`,
      date: d.documentDate.toISOString(),
      color: "#22c55e",
      meta: { documentNumber: d.number },
    })
  }

  // 5. Batch expiries this month
  const batches = await prisma.batch.findMany({
    where: { expiryDate: { gte: start, lte: end } },
    include: { product: { select: { name: true } } },
    orderBy: { expiryDate: "asc" },
  })
  for (const b of batches) {
    events.push({
      id: `exp-${b.id}`,
      type: "expiry",
      title: `Срок: ${b.product.name}`,
      date: b.expiryDate!.toISOString(),
      color: "#f97316",
      meta: { productName: b.product.name },
    })
  }

  // 6. Orders this month
  const orderWhere = isAdmin
    ? { createdAt: { gte: start, lte: end } }
    : { userId, createdAt: { gte: start, lte: end } }

  const orders = await prisma.order.findMany({
    where: orderWhere,
    select: { id: true, orderNumber: true, totalAmount: true, createdAt: true, status: true },
    orderBy: { createdAt: "asc" },
  })
  for (const o of orders) {
    events.push({
      id: `order-${o.id}`,
      type: "order",
      title: `Заказ ${o.orderNumber}`,
      date: o.createdAt.toISOString(),
      color: "#8b5cf6",
      meta: { orderId: o.id },
    })
  }

  events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  return NextResponse.json({ events })
}

/** POST /api/schedule — create PlannerNote */
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { date, time, title, text, color } = body as {
    date: string
    time?: string
    title: string
    text?: string
    color?: string
  }

  if (!date || !title?.trim()) {
    return NextResponse.json({ error: "date and title required" }, { status: 400 })
  }

  try {
    const note = await prisma.plannerNote.create({
      data: {
        userId: session.user.id,
        date: new Date(date),
        time: time || null,
        title: title.trim(),
        text: text?.trim() || null,
        color: color || null,
      },
    })

    return NextResponse.json({ note })
  } catch (err) {
    console.error("[schedule POST]", err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

/** PATCH /api/schedule — update PlannerNote */
export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { id, title, text, time, color } = body as {
    id: string
    title?: string
    text?: string
    time?: string
    color?: string
  }

  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 })
  }

  const existing = await prisma.plannerNote.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const note = await prisma.plannerNote.update({
    where: { id },
    data: {
      ...(title !== undefined && { title: title.trim() }),
      ...(text !== undefined && { text: text.trim() || null }),
      ...(time !== undefined && { time: time || null }),
      ...(color !== undefined && { color: color || null }),
    },
  })

  return NextResponse.json({ note })
}

/** DELETE /api/schedule?id=xxx — delete PlannerNote */
export async function DELETE(req: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 })
  }

  const existing = await prisma.plannerNote.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  await prisma.plannerNote.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}
