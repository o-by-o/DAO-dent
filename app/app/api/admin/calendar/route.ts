import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export interface CalendarEvent {
  id: string
  type: "call" | "birthday"
  title: string
  clientName: string
  clientId: string
  date: string
  note?: string
}

/** GET /api/admin/calendar?month=2026-04 */
export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const monthParam = searchParams.get("month") // "2026-04"
  const now = new Date()
  const year = monthParam ? parseInt(monthParam.split("-")[0]) : now.getFullYear()
  const month = monthParam ? parseInt(monthParam.split("-")[1]) - 1 : now.getMonth()

  const start = new Date(year, month, 1)
  const end = new Date(year, month + 1, 0, 23, 59, 59)

  const events: CalendarEvent[] = []

  // 1. Call reminders from notes
  const notes = await prisma.clientNote.findMany({
    where: {
      callAt: { gte: start, lte: end },
    },
    include: {
      client: { select: { id: true, name: true } },
    },
    orderBy: { callAt: "asc" },
  })

  for (const n of notes) {
    events.push({
      id: `note-${n.id}`,
      type: "call",
      title: `Звонок: ${n.client.name}`,
      clientName: n.client.name,
      clientId: n.client.id,
      date: n.callAt!.toISOString(),
      note: n.text,
    })
  }

  // 2. Birthdays this month
  const clients = await prisma.client.findMany({
    where: { birthDate: { not: null } },
    select: { id: true, name: true, birthDate: true },
  })

  for (const c of clients) {
    if (!c.birthDate) continue
    const bd = c.birthDate
    if (bd.getMonth() === month) {
      const bdThisYear = new Date(year, month, bd.getDate())
      events.push({
        id: `bday-${c.id}`,
        type: "birthday",
        title: `День рождения: ${c.name}`,
        clientName: c.name,
        clientId: c.id,
        date: bdThisYear.toISOString(),
      })
    }
  }

  events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  return NextResponse.json({ events })
}
