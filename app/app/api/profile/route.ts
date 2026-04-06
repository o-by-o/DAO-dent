import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * PATCH /api/profile — обновить профиль текущего пользователя
 */
export async function PATCH(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { name } = body as { name?: string | null }

  // Валидация длины имени
  if (name && name.trim().length > 100) {
    return NextResponse.json({ error: "Имя слишком длинное (максимум 100 символов)" }, { status: 400 })
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: name !== undefined ? (name?.trim() || null) : undefined,
    },
    select: { id: true, name: true, email: true },
  })

  return NextResponse.json({ user: updated })
}
