/**
 * POST /api/skin-analyze
 * Анализ фото кожи — доступен всем авторизованным.
 * STUDENT: лимит 3 бесплатных анализа.
 * ADMIN: без лимита.
 */

import { auth } from "@/lib/auth"
import { analyzeSkin } from "@/lib/skin-analysis"
import { getSkinAnalysisCount } from "@/lib/queries"
import { NextResponse } from "next/server"

const FREE_LIMIT = 3

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const role = (session.user as { role?: string }).role

  // Проверяем лимит для студентов
  if (role !== "ADMIN") {
    const count = await getSkinAnalysisCount(session.user.id)
    if (count >= FREE_LIMIT) {
      return NextResponse.json(
        {
          error: "Лимит бесплатных анализов исчерпан",
          limit: FREE_LIMIT,
          used: count,
        },
        { status: 403 },
      )
    }
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
