import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/**
 * In-memory rate limiter для middleware (edge runtime).
 */
const loginAttempts = new Map<string, { count: number; resetAt: number }>()

setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of loginAttempts) {
    if (entry.resetAt < now) loginAttempts.delete(key)
  }
}, 5 * 60 * 1000)

function getIp(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "unknown"
}

function isRateLimited(key: string, limit: number, windowSec: number): boolean {
  const now = Date.now()
  const entry = loginAttempts.get(key)

  if (!entry || entry.resetAt < now) {
    loginAttempts.set(key, { count: 1, resetAt: now + windowSec * 1000 })
    return false
  }

  entry.count++
  return entry.count > limit
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rate limit на login: 10 попыток за 15 минут
  if (pathname === "/api/auth/callback/credentials" && request.method === "POST") {
    const ip = getIp(request)
    if (isRateLimited(`login:${ip}`, 10, 900)) {
      return NextResponse.json(
        { error: "Слишком много попыток входа. Попробуйте через 15 минут." },
        { status: 429 },
      )
    }
  }

  // Rate limit на API заявок с лендинга: 5 заявок за 5 минут с одного IP
  if (pathname === "/api/leads" && request.method === "POST") {
    const ip = getIp(request)
    if (isRateLimited(`leads:${ip}`, 5, 300)) {
      return NextResponse.json(
        { error: "Слишком много заявок. Попробуйте позже." },
        { status: 429 },
      )
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/api/auth/callback/credentials",
    "/api/leads",
  ],
}
