import type { Metadata } from "next"
import { auth } from "@/lib/auth"
import {
  dibInterfarmCoursesSpotlightUrl,
  dibInterfarmHeroBackdropUrl,
  dibInterfarmPhoneSecondary,
  dibInterfarmFallbackProducts,
  dibInterfarmFallbackCourses,
  landingCollectionProductArt,
  landingCollectionCourseArt,
  dibInterfarmAddress,
} from "@/lib/dib-interfarm-content"
import { prisma } from "@/lib/prisma"
import { getSiteContent } from "@/lib/site-content"
import { getRecentSkinAnalysesForUser, getUserCourses } from "@/lib/queries"
import {
  LandingPage,
  type LandingCourseTeaser,
  type LandingDiagnosticsTeaser,
  type LandingProductTeaser,
} from "@/components/landing/landing-page"

export const metadata: Metadata = {
  title: "DIB Academy — портал в мир качественной косметики",
  description:
    "Профессиональная корейская косметика, обучение косметологов и AI-диагностика кожи. DIB-INTERFARM — ваш проводник в индустрию красоты.",
}

export default async function LandingRoute() {
  const session = await auth()

  const [heroTitle, heroSubtitle, missionIntro, shopTitle, shopSubtitle, footerPhone, footerEmail] =
    await Promise.all([
      getSiteContent("hero_title"),
      getSiteContent("hero_subtitle"),
      getSiteContent("about_text"),
      getSiteContent("shop_title"),
      getSiteContent("shop_subtitle"),
      getSiteContent("footer_phone"),
      getSiteContent("footer_email"),
    ])

  let rawProducts: Array<{
    id: string
    name: string
    imageUrl: string | null
    price: { toString(): string } | null
    brand: string | null
  }> = []
  let rawCourses: Array<{
    id: string
    title: string
    description: string | null
    thumbnailUrl: string | null
    slug: string
    _count: { modules: number }
  }> = []

  try {
    ;[rawProducts, rawCourses] = await Promise.all([
      prisma.product.findMany({
        where: { published: true },
        orderBy: [{ order: "asc" }, { name: "asc" }],
        take: 4,
        select: {
          id: true,
          name: true,
          imageUrl: true,
          price: true,
          brand: true,
        },
      }),
      prisma.course.findMany({
        where: { published: true },
        orderBy: { createdAt: "desc" },
        take: 3,
        select: {
          id: true,
          title: true,
          description: true,
          thumbnailUrl: true,
          slug: true,
          _count: { select: { modules: true } },
        },
      }),
    ])
  } catch {
    // Локально без Docker/Postgres лендинг всё равно открывается (тизеры из БД пустые).
  }

  const products: LandingProductTeaser[] =
    rawProducts.length > 0
      ? rawProducts.map((p, i) => ({
          id: p.id,
          name: p.name,
          imageUrl: landingCollectionProductArt[i % landingCollectionProductArt.length],
          fallbackImageUrl: null,
          brand: p.brand,
          priceLabel:
            p.price != null
              ? `${Number(p.price).toLocaleString("ru-RU", { maximumFractionDigits: 0 })} ₽`
              : null,
        }))
      : dibInterfarmFallbackProducts.map((p) => ({
          id: p.id,
          name: p.name,
          imageUrl: p.imageUrl,
          fallbackImageUrl: null,
          brand: p.brand,
          priceLabel: p.priceLabel,
        }))

  const coursesCatalog: LandingCourseTeaser[] =
    rawCourses.length > 0
      ? rawCourses.map((c, i) => ({
          id: c.id,
          title: c.title,
          description: c.description,
          thumbnailUrl: landingCollectionCourseArt[i % landingCollectionCourseArt.length],
          slug: c.slug,
          moduleCount: c._count.modules,
        }))
      : dibInterfarmFallbackCourses.map((c) => ({
          id: c.id,
          title: c.title,
          description: c.description,
          thumbnailUrl: c.thumbnailUrl,
          slug: c.slug,
          moduleCount: c.moduleCount,
        }))

  let coursesForLanding = coursesCatalog
  let personalDiagnostics: LandingDiagnosticsTeaser[] | undefined

  if (session?.user?.id) {
    try {
      const skinRows = await getRecentSkinAnalysesForUser(session.user.id, 4)
      if (skinRows.length > 0) {
        personalDiagnostics = skinRows.map((row) => {
          const r = row.result as { skinType?: string; summary?: string }
          const summary = (r?.summary ?? "").trim()
          const desc =
            summary.length > 100 ? `${summary.slice(0, 100)}…` : summary || "Результат сохранён в вашем аккаунте"
          return {
            id: row.id,
            title: r?.skinType ?? "Диагностика лица",
            desc,
            badge: row.createdAt.toLocaleDateString("ru-RU", {
              day: "numeric",
              month: "short",
              year: "numeric",
            }),
            href: "/diagnostics",
            imageUrl: row.imageUrl,
          }
        })
      }
    } catch {
      // при ошибке — показываем гостевые тизеры
    }

    try {
      const userCourses = await getUserCourses(session.user.id)
      if (userCourses.length > 0) {
        coursesForLanding = userCourses.slice(0, 4).map((c, i) => ({
          id: c.id,
          title: c.title,
          description: c.description,
          thumbnailUrl: landingCollectionCourseArt[i % landingCollectionCourseArt.length],
          slug: c.slug,
          moduleCount: c.totalModules,
          progress: c.progress,
          continueHref:
            c.progress > 0 && c.progress < 100 && c.currentLesson
              ? `/course/${c.slug}/${c.currentLesson.id}`
              : null,
        }))
      }
    } catch {
      // остаётся каталог опубликованных курсов
    }
  }

  return (
    <LandingPage
      heroTitle={heroTitle}
      heroSubtitle={heroSubtitle}
      missionIntro={missionIntro}
      shopTitle={shopTitle}
      shopSubtitle={shopSubtitle}
      products={products}
      courses={coursesForLanding}
      personalDiagnostics={personalDiagnostics}
      coursesSpotlightUrl={dibInterfarmCoursesSpotlightUrl}
      diagnosticsVisualUrl={dibInterfarmHeroBackdropUrl}
      footerPhone={footerPhone}
      footerPhone2={dibInterfarmPhoneSecondary}
      footerAddress={dibInterfarmAddress}
      footerEmail={footerEmail}
      isLoggedIn={!!session?.user}
    />
  )
}
