import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/** GET /api/admin/patients/[id]/medical-records — история ЭМК */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 })

  const { id } = await params

  const records = await prisma.medicalRecord.findMany({
    where: { patientId: id },
    orderBy: { date: "desc" },
  })

  return NextResponse.json(records)
}

/** POST /api/admin/patients/[id]/medical-records — добавить запись в ЭМК */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 })

  const role = (session.user as { role: string }).role
  if (!["OWNER", "MANAGER", "DOCTOR"].includes(role)) {
    return NextResponse.json({ error: "Только врач может вести ЭМК" }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()
  const { type, content, date, attachments } = body

  if (!type || !content?.trim()) {
    return NextResponse.json({ error: "Тип и содержание обязательны" }, { status: 400 })
  }

  const record = await prisma.medicalRecord.create({
    data: {
      patientId: id,
      type,
      content: content.trim(),
      date: date ? new Date(date) : new Date(),
      attachments: attachments || null,
    },
  })

  return NextResponse.json(record)
}
