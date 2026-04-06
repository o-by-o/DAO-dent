import bcrypt from "bcryptjs"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  passwordFingerprint,
  verifyPasswordResetToken,
} from "@/lib/password-reset"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"

/**
 * POST /api/auth/reset-password
 * Body: { token: string, password: string }
 */
export async function POST(request: Request) {
  // Rate limit: 10 попыток за 15 минут на IP
  const ip = getClientIp(request)
  const rl = checkRateLimit(`reset-password:${ip}`, { limit: 10, windowSec: 900 })
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Слишком много попыток. Попробуйте позже." },
      { status: 429 },
    )
  }

  const body = await request.json().catch(() => ({}))
  const token = body?.token as string | undefined
  const password = body?.password as string | undefined

  if (!token || !password) {
    return NextResponse.json(
      { error: "Токен и пароль обязательны" },
      { status: 400 },
    )
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Пароль должен быть не короче 8 символов" },
      { status: 400 },
    )
  }

  const payload = verifyPasswordResetToken(token)
  if (!payload) {
    return NextResponse.json(
      { error: "Ссылка недействительна или истекла" },
      { status: 400 },
    )
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, email: true, hashedPassword: true },
  })

  if (!user || user.email !== payload.email) {
    return NextResponse.json(
      { error: "Пользователь не найден" },
      { status: 400 },
    )
  }

  if (passwordFingerprint(user.hashedPassword) !== payload.pwd) {
    return NextResponse.json(
      { error: "Ссылка уже использована или устарела" },
      { status: 400 },
    )
  }

  const hashedPassword = await bcrypt.hash(password, 12)
  await prisma.user.update({
    where: { id: user.id },
    data: { hashedPassword },
  })

  return NextResponse.json({
    ok: true,
    message: "Пароль успешно обновлён",
  })
}
