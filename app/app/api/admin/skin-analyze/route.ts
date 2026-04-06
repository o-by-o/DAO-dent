/**
 * POST /api/admin/skin-analyze
 * Анализ фото кожи через Vision API
 */

import { auth } from "@/lib/auth"
import { analyzeSkin } from "@/lib/skin-analysis"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  const { imageUrl } = body

  if (!imageUrl) {
    return NextResponse.json({ error: "imageUrl обязателен" }, { status: 400 })
  }

  try {
    const result = await analyzeSkin(imageUrl, session.user.id)
    return NextResponse.json(result)
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ошибка анализа"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
