import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { SiteHeader } from "@/components/boty/site-header"
import { SiteFooter } from "@/components/boty/site-footer"
import { BotyAiChat } from "@/components/boty/boty-ai-chat"
import { LandingHero } from "./landing-hero"
import { LandingProductGrid } from "./landing-product-grid"
import { LandingFeatureSection } from "./landing-feature-section"
import { LandingTestimonials, type LandingReview } from "./landing-testimonials"
import type { LandingPageProps as LP } from "./landing-types"

export type LandingProductTeaser = import("./landing-types").LandingProductTeaser
export type LandingCourseTeaser = import("./landing-types").LandingCourseTeaser
export type LandingDiagnosticsTeaser = import("./landing-types").LandingDiagnosticsTeaser
export type LandingPageProps = LP

function loginHref(path: string) {
  return `/login?callbackUrl=${encodeURIComponent(path)}`
}

const REVIEWS: LandingReview[] = [
  { name: "Светлана", text: "Уход подобрали идеальный. Спасибо за быструю бесплатную доставку!", tag: "Магазин" },
  { name: "Ольга", text: "Практика, теория, поддержка. Про косметику молчу — это искусство!", tag: "Курсы" },
  { name: "Александр", text: "Жена довольна и я доволен. Онлайн-консультация — это топ.", tag: "Диагностика" },
]

export function LandingPage({
  heroTitle: _heroTitle,
  heroSubtitle,
  missionIntro,
  shopTitle,
  shopSubtitle: _shopSubtitle,
  products,
  courses,
  personalDiagnostics,
  coursesSpotlightUrl,
  diagnosticsVisualUrl: _diagnosticsVisualUrl,
  footerPhone,
  footerPhone2,
  footerAddress,
  footerEmail,
  isLoggedIn,
}: LandingPageProps) {
  void _heroTitle
  void _shopSubtitle
  void _diagnosticsVisualUrl

  const shopHref = isLoggedIn ? "/shop" : loginHref("/shop")
  const catalogHref = isLoggedIn ? "/catalog" : loginHref("/catalog")
  const diagnosticsHref = isLoggedIn ? "/diagnostics" : loginHref("/diagnostics")
  const cabinetHref = isLoggedIn ? "/home" : loginHref("/home")

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <SiteHeader
        shopHref={shopHref}
        catalogHref={catalogHref}
        diagnosticsHref={diagnosticsHref}
        cabinetHref={cabinetHref}
        isLoggedIn={isLoggedIn}
      />

      <main>
        <LandingHero
          shopTitle={shopTitle}
          heroSubtitle={heroSubtitle}
          shopHref={shopHref}
        />

        <LandingProductGrid
          products={products}
          courses={courses}
          personalDiagnostics={personalDiagnostics}
          shopHref={shopHref}
          catalogHref={catalogHref}
          diagnosticsHref={diagnosticsHref}
          cabinetHref={cabinetHref}
          isLoggedIn={isLoggedIn}
        />

        <LandingFeatureSection coursesSpotlightUrl={coursesSpotlightUrl} />

        <LandingTestimonials reviews={REVIEWS} />

        <section className="bg-primary py-20 text-primary-foreground md:py-28">
          <div className="mx-auto max-w-2xl px-6 text-center lg:px-8">
            <h2 className="text-balance font-serif text-3xl leading-tight md:text-5xl lg:text-6xl">
              Зарегистрируйтесь — откройте весь портал
            </h2>
            <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-primary-foreground/85 md:text-lg">
              {missionIntro}
            </p>
            <p className="mt-4 text-sm text-primary-foreground/70">
              Три бесплатные AI-диагностики после регистрации по номеру телефона
            </p>
            <div className="mt-10">
              <Link
                href={cabinetHref}
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-primary-foreground px-8 py-4 text-sm font-medium tracking-wide text-primary boty-transition hover:bg-primary-foreground/95"
              >
                {isLoggedIn ? "Личный кабинет" : "Зарегистрироваться"}
                <ArrowRight className="h-4 w-4 boty-transition group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </section>

        <SiteFooter
          footerPhone={footerPhone}
          footerPhone2={footerPhone2}
          footerAddress={footerAddress}
          footerEmail={footerEmail}
          shopHref={shopHref}
          catalogHref={catalogHref}
          diagnosticsHref={diagnosticsHref}
        />
      </main>

      <BotyAiChat />
    </div>
  )
}
