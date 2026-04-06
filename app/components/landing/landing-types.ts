export type LandingProductTeaser = {
  id: string
  name: string
  imageUrl: string | null
  fallbackImageUrl?: string | null
  priceLabel: string | null
  brand: string | null
}

export type LandingCourseTeaser = {
  id: string
  title: string
  description: string | null
  thumbnailUrl: string | null
  moduleCount: number
  slug: string
  /** Прогресс из личного кабинета (записанные курсы), 0–100 */
  progress?: number
  /** Продолжить с текущего урока (если задан — ведёт в плеер) */
  continueHref?: string | null
}

export type LandingDiagnosticsTeaser = {
  id: string
  title: string
  desc: string
  badge: string | null
  href: string
  imageUrl: string | null
}

export type LandingPageProps = {
  heroTitle: string
  heroSubtitle: string
  missionIntro: string
  shopTitle: string
  shopSubtitle: string
  products: LandingProductTeaser[]
  courses: LandingCourseTeaser[]
  /** Карточки диагностики из БД (только для авторизованных); иначе на лендинге — статичные тизеры */
  personalDiagnostics?: LandingDiagnosticsTeaser[]
  coursesSpotlightUrl: string
  diagnosticsVisualUrl: string
  footerPhone: string
  footerPhone2: string
  footerAddress: string
  footerEmail: string
  isLoggedIn: boolean
}
