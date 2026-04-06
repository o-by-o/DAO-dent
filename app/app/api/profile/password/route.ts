import bcrypt from "bcryptjs"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * PATCH /api/profile/password
 * Body: { currentPassword: string, newPassword: string }
 */
export async function PATCH(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const currentPassword = body?.currentPassword as string | undefined
  const newPassword = body?.newPassword as string | undefined

  if (!currentPassword || !newPassword) {
    return NextResponse.json(
      { error: "Текущий и новый пароль обязательны" },
      { status: 400 },
    )
  }
  if (newPassword.length < 8) {
    return NextResponse.json(
      { error: "Новый пароль должен быть не короче 8 символов" },
      { status: 400 },
    )
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, hashedPassword: true },
  })
  if (!user) {
    return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 })
  }

  const isValid = await bcrypt.compare(currentPassword, user.hashedPassword)
  if (!isValid) {
    return NextResponse.json({ error: "Текущий пароль неверный" }, { status: 400 })
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12)
  await prisma.user.update({
    where: { id: user.id },
    data: { hashedPassword },
  })

  return NextResponse.json({
    ok: true,
    message: "Пароль успешно изменён",
  })
}
