import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST /api/admin/patients/[id]/notes — добавить заметку
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { text, callAt } = body

  if (!text?.trim()) {
    return NextResponse.json({ error: "Текст заметки обязателен" }, { status: 400 })
  }

  const note = await prisma.patientNote.create({
    data: {
      patientId: id,
      text: text.trim(),
      callAt: callAt ? new Date(callAt) : null,
    },
  })

  return NextResponse.json(note)
}
