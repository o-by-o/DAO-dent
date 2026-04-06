import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

/** POST — добавить заметку к клиенту */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const { text, callAt } = (await req.json()) as {
    text: string
    callAt?: string | null
  }

  if (!text?.trim()) {
    return NextResponse.json({ error: "Текст обязателен" }, { status: 400 })
  }

  const note = await prisma.clientNote.create({
    data: {
      clientId: id,
      text: text.trim(),
      callAt: callAt ? new Date(callAt) : null,
    },
  })

  return NextResponse.json({
    note: {
      id: note.id,
      text: note.text,
      callAt: note.callAt?.toISOString() ?? null,
      createdAt: note.createdAt.toISOString(),
    },
  })
}

/** DELETE — удалить заметку */
export async function DELETE(req: Request) {
  const session = await auth()
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const noteId = searchParams.get("noteId")
  if (!noteId) {
    return NextResponse.json({ error: "noteId required" }, { status: 400 })
  }

  await prisma.clientNote.delete({ where: { id: noteId } })
  return NextResponse.json({ ok: true })
}
