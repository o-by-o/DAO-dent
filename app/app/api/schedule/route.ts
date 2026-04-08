import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export interface ScheduleEvent {
  id: string
  type: "call" | "birthday" | "stock" | "expiry" | "note"
  title: string
  date: string      // ISO
  time?: string     // "HH:mm"
  color: string
  meta?: {
    patientId?: string
    patientName?: string
    noteText?: string
    noteId?: string
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
  const role = (session.user as { role?: string }).role
  const isAdmin = role === "OWNER" || role === "MANAGER" || role === "ADMIN"
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

  // 2. Call reminders (patient notes with callAt)
  const noteWhere = isAdmin
    ? { callAt: { gte: start, lte: end } }
    : { callAt: { gte: start, lte: end }, patient: { doctorId: userId } }

  const patientNotes = await prisma.patientNote.findMany({
    where: noteWhere,
    include: { patient: { select: { id: true, firstName: true, lastName: true } } },
    orderBy: { callAt: "asc" },
  })
  for (const n of patientNotes) {
    const t = n.callAt!
    events.push({
      id: `call-${n.id}`,
      type: "call",
      title: `Звонок: ${n.patient.lastName} ${n.patient.firstName}`,
      date: t.toISOString(),
      time: `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`,
      color: "#3b82f6",
      meta: { patientId: n.patient.id, patientName: `${n.patient.lastName} ${n.patient.firstName}`, noteText: n.text },
    })
  }

  // 3. Patient birthdays
  const patientBdayWhere = isAdmin
    ? { birthDate: { not: null } }
    : { doctorId: userId, birthDate: { not: null } }

  const patients = await prisma.patient.findMany({
    where: patientBdayWhere as Record<string, unknown>,
    select: { id: true, firstName: true, lastName: true, birthDate: true },
  })
  for (const p of patients) {
    if (!p.birthDate) continue
    if (p.birthDate.getMonth() === month) {
      const bd = new Date(year, month, p.birthDate.getDate())
      events.push({
        id: `bday-${p.id}`,
        type: "birthday",
        title: `ДР: ${p.lastName} ${p.firstName}`,
        date: bd.toISOString(),
        color: "#ec4899",
        meta: { patientId: p.id },
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
