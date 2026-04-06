import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createPasswordResetToken } from "@/lib/password-reset"
import { sendPasswordResetEmail } from "@/lib/email"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"

function getBaseUrl(request: Request): string {
  const configured = process.env.NEXTAUTH_URL
  if (configured) return configured.replace(/\/$/, "")
  return new URL(request.url).origin
}

/**
 * POST /api/auth/forgot-password
 * Body: { email: string }
 */
export async function POST(request: Request) {
  // Rate limit: 5 попыток за 15 минут на IP
  const ip = getClientIp(request)
  const rl = checkRateLimit(`forgot-password:${ip}`, { limit: 5, windowSec: 900 })
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Слишком много попыток. Попробуйте позже." },
      { status: 429 },
    )
  }

  const body = await request.json().catch(() => ({}))
  const email = (body?.email as string | undefined)?.trim().toLowerCase()

  if (!email) {
    return NextResponse.json(
      { error: "Укажите email" },
      { status: 400 },
    )
  }

  const genericResponse = {
    ok: true,
    message:
      "Если такой email зарегистрирован, мы отправили ссылку для восстановления пароля.",
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, hashedPassword: true },
  })

  if (!user) {
    return NextResponse.json(genericResponse)
  }

  const token = createPasswordResetToken({
    userId: user.id,
    email: user.email,
    hashedPassword: user.hashedPassword,
  })

  const resetUrl = `${getBaseUrl(request)}/reset-password?token=${encodeURIComponent(token)}`
  const emailResult = await sendPasswordResetEmail({
    to: user.email,
    name: user.name,
    resetUrl,
  })

  if (!emailResult.sent) {
    console.error(`[ForgotPassword] Failed to send email to ${user.email}:`, emailResult.reason)
  }

  return NextResponse.json(genericResponse)
}
