import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getSiteContentMap } from "@/lib/site-content"

/**
 * GET /api/admin/ai-chat/content-check
 * Возвращает текущий контент сайта (то же, что видит OpenClaw через content_list).
 * Используй для проверки: попроси в чате изменить контент → обнови этот endpoint → убедись, что значение изменилось.
 */
export async function GET() {
  const session = await auth()
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const map = await getSiteContentMap()
  const content = Array.from(map.entries()).map(([key, value]) => ({ key, value }))

  return NextResponse.json({
    content,
    hint: "В чате скажи: «Покажи контент сайта» (content_list) или «Измени shop_subtitle на …» (content_update). Затем обнови эту страницу — значения должны совпадать с тем, что в БД.",
  })
}
