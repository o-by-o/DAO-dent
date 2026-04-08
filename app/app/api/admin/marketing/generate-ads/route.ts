import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateAdsForService } from "@/lib/yandex-direct"

/**
 * POST /api/admin/marketing/generate-ads
 * AI-генерация рекламных объявлений на основе услуг клиники
 */
export async function POST() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 })

  const role = (session.user as { role: string }).role
  if (role !== "OWNER") return NextResponse.json({ error: "Только владелец" }, { status: 403 })

  try {
    // Получаем все опубликованные услуги
    const services = await prisma.service.findMany({
      where: { published: true },
      include: { category: { select: { name: true } } },
    })

    // Генерируем объявления для каждой услуги
    const allAds = services.flatMap((s) =>
      generateAdsForService({
        name: s.name,
        price: Number(s.price),
        category: s.category.name,
        slug: s.slug,
      }),
    )

    return NextResponse.json({
      totalServices: services.length,
      totalAds: allAds.length,
      ads: allAds,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ошибка генерации" },
      { status: 500 },
    )
  }
}
