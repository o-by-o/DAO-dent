import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

/**
 * GET /api/admin/ai-chat/status
 * Возвращает режим чата: openclaw (через Gateway) или local (DeepSeek + локальные tools).
 */
export async function GET() {
  const session = await auth()
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const openclawUrl = process.env.OPENCLAW_GATEWAY_URL
  const openclawToken = process.env.OPENCLAW_GATEWAY_TOKEN
  const mode =
    openclawUrl && openclawToken ? "openclaw" : "local"

  return NextResponse.json({
    mode,
    openclawConfigured: !!(openclawUrl && openclawToken),
    contentCheckPath: "/api/admin/ai-chat/content-check",
  })
}
