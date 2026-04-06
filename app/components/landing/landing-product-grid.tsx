"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Sparkles } from "lucide-react"
import {
  landingCollectionCourseArt,
  landingCollectionProductArt,
} from "@/lib/dib-interfarm-content"
import type {
  LandingCourseTeaser,
  LandingDiagnosticsTeaser,
  LandingProductTeaser,
} from "./landing-types"

/** На главной всегда показываем сгенерированные иллюстрации, даже если в пропсах остались URL с витрины. */
function pickLandingProductVisual(url: string | null | undefined, index: number): string {
  const u = url?.trim() ?? ""
  if (u.startsWith("/images/landing/")) return u
  return landingCollectionProductArt[index % landingCollectionProductArt.length] ?? ""
}

function pickLandingCourseVisual(url: string | null | undefined, index: number): string {
  const u = url?.trim() ?? ""
  if (u.startsWith("/images/landing/")) return u
  return landingCollectionCourseArt[index % landingCollectionCourseArt.length] ?? ""
}

type Category = "cosmetics" | "courses" | "diagnostics"

const categories: { value: Category; label: string }[] = [
  { value: "cosmetics", label: "Косметика" },
  { value: "courses", label: "Курсы" },
  { value: "diagnostics", label: "Диагностика" },
]

type Props = {
  products: LandingProductTeaser[]
  courses: LandingCourseTeaser[]
  /** История AI-диагностик из БД (только для авторизованных) */
  personalDiagnostics?: LandingDiagnosticsTeaser[]
  shopHref: string
  catalogHref: string
  diagnosticsHref: string
  cabinetHref: string
  isLoggedIn: boolean
}

export function LandingProductGrid({
  products,
  courses,
  personalDiagnostics,
  shopHref,
  catalogHref,
  diagnosticsHref,
  cabinetHref,
  isLoggedIn,
}: Props) {
  const [selected, setSelected] = useState<Category>("cosmetics")
  const [transitioning, setTransitioning] = useState(false)
  const [visible, setVisible] = useState(false)
  const [headerVisible, setHeaderVisible] = useState(false)
  const gridRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)

  const changeTab = (c: Category) => {
    if (c === selected) return
    setTransitioning(true)
    setTimeout(() => {
      setSelected(c)
      setTimeout(() => setTransitioning(false), 50)
    }, 280)
  }

  useEffect(() => {
    const obs = (el: HTMLElement | null, fn: (v: boolean) => void) => {
      if (!el) return
      const o = new IntersectionObserver(([e]) => e.isIntersecting && fn(true), { threshold: 0.12 })
      o.observe(el)
      return o
    }
    const g = obs(gridRef.current, setVisible)
    const h = obs(headerRef.current, setHeaderVisible)
    return () => {
      g?.disconnect()
      h?.disconnect()
    }
  }, [])

  const tabIndex = categories.findIndex((c) => c.value === selected)

  const defaultDiagnostics: LandingDiagnosticsTeaser[] = [
    {
      id: "d1",
      title: "AI-диагностика лица",
      desc: "Загрузите фото — нейросеть определит тип кожи, проблемные зоны и подберёт уход",
      badge: "Бесплатно",
      href: diagnosticsHref,
      imageUrl: "/images/landing/landing-diag-ai.png",
    },
    {
      id: "d2",
      title: "Персональные рекомендации",
      desc: "Получите подбор средств Dr.PaceLeader и DERMACHIC на основе AI-анализа вашей кожи",
      badge: null,
      href: diagnosticsHref,
      imageUrl: "/images/landing/landing-diag-reco.png",
    },
    {
      id: "d3",
      title: "Личный кабинет",
      desc: "Магазин, курсы, история диагностик и сертификаты — всё в одном месте",
      badge: null,
      href: cabinetHref,
      imageUrl: "/images/landing/landing-diag-portal.png",
    },
  ]

  const diagnosticsItems: LandingDiagnosticsTeaser[] =
    personalDiagnostics && personalDiagnostics.length > 0
      ? [
          ...personalDiagnostics.slice(0, 3),
          {
            id: "new-diagnostics",
            title: "Новая диагностика",
            desc: "Загрузите фото — получите AI-анализ и рекомендации",
            badge: null,
            href: diagnosticsHref,
            imageUrl: "/images/landing/landing-diag-ai.png",
          },
        ]
      : defaultDiagnostics

  return (
    <section id="collection" className="scroll-mt-24 bg-card py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div ref={headerRef} className="mb-16 text-center">
          <span
            className={`mb-4 block text-sm uppercase tracking-[0.3em] text-primary ${
              headerVisible ? "animate-blur-in opacity-0" : "opacity-0"
            }`}
            style={headerVisible ? { animationDelay: "0.2s", animationFillMode: "forwards" } : {}}
          >
            Наша коллекция
          </span>
          <h2
            className={`mb-4 text-balance font-serif text-4xl leading-tight text-foreground md:text-6xl lg:text-7xl ${
              headerVisible ? "animate-blur-in opacity-0" : "opacity-0"
            }`}
            style={headerVisible ? { animationDelay: "0.4s", animationFillMode: "forwards" } : {}}
          >
            Всё для красоты
          </h2>
          <p
            className={`mx-auto max-w-md text-lg text-muted-foreground ${
              headerVisible ? "animate-blur-in opacity-0" : "opacity-0"
            }`}
            style={headerVisible ? { animationDelay: "0.6s", animationFillMode: "forwards" } : {}}
          >
            Профессиональная косметика, обучение и AI-диагностика в одном месте
          </p>
        </div>

        <div className="mb-12 flex justify-center">
          <div className="relative inline-flex gap-1 rounded-full bg-background p-1">
            <div
              className="absolute top-1 bottom-1 rounded-full bg-foreground shadow-sm transition-all duration-300 ease-out"
              style={{
                left: `calc(${tabIndex * 33.333}% + 4px)`,
                width: "calc(33.333% - 8px)",
              }}
            />
            {categories.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => changeTab(c.value)}
                className={`relative z-10 rounded-full px-6 py-2.5 text-sm font-medium transition-all duration-300 ${
                  selected === c.value ? "text-background" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div ref={gridRef} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {selected === "cosmetics" &&
            (products.length === 0 ? (
              <div className="col-span-full rounded-3xl border border-dashed border-border/60 bg-background/80 py-16 text-center">
                <p className="text-muted-foreground">Каталог обновляется — загляните в магазин.</p>
                <Link
                  href={shopHref}
                  className="mt-4 inline-block rounded-full bg-primary px-6 py-3 text-sm text-primary-foreground boty-transition hover:bg-primary/90"
                >
                  В магазин
                </Link>
              </div>
            ) : (
              products.map((p, index) => {
                const src = pickLandingProductVisual(p.imageUrl ?? p.fallbackImageUrl, index)
                return (
                  <Link
                    key={p.id}
                    href={shopHref}
                    className={`group transition-all duration-500 ease-out ${
                      visible && !transitioning ? "scale-100 opacity-100" : "scale-95 opacity-0"
                    }`}
                    style={{ transitionDelay: transitioning ? "0ms" : `${index * 80}ms` }}
                  >
                    <div className="overflow-hidden rounded-3xl bg-background boty-shadow boty-transition group-hover:scale-[1.02]">
                      <div className="relative aspect-square overflow-hidden bg-muted">
                        {src ? (
                          // eslint-disable-next-line @next/next/no-img-element -- remote shop URLs may be arbitrary hosts
                          <img
                            src={src}
                            alt=""
                            className="absolute inset-0 h-full w-full object-cover boty-transition group-hover:scale-105"
                          />
                        ) : (
                          <div className="h-full w-full bg-gradient-to-br from-muted to-border" />
                        )}
                        {p.brand && (
                          <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-xs tracking-wide text-foreground shadow-sm">
                            {p.brand}
                          </span>
                        )}
                      </div>
                      <div className="p-5">
                        <h3 className="mb-1 font-serif text-lg text-foreground">{p.name}</h3>
                        <p className="mb-3 text-sm text-muted-foreground line-clamp-2">
                          {p.brand ? `${p.brand} · ` : ""}
                          в каталоге магазина
                        </p>
                        <span className="font-medium text-foreground">
                          {p.priceLabel ?? "Цена в каталоге"}
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })
            ))}

          {selected === "courses" &&
            (courses.length === 0 ? (
              <div className="col-span-full rounded-3xl border border-dashed border-border/60 py-16 text-center">
                <p className="text-muted-foreground">Курсы появятся здесь после публикации.</p>
                <Link href={catalogHref} className="mt-4 inline-block text-primary underline">
                  Каталог курсов
                </Link>
              </div>
            ) : (
              courses.map((c, index) => {
                const courseHref =
                  c.continueHref && c.progress !== undefined && c.progress > 0 && c.progress < 100
                    ? c.continueHref
                    : `/course/${c.slug}`
                const thumb = pickLandingCourseVisual(c.thumbnailUrl, index)
                return (
                  <Link
                    key={c.id}
                    href={courseHref}
                    className={`group transition-all duration-500 ease-out ${
                      visible && !transitioning ? "scale-100 opacity-100" : "scale-95 opacity-0"
                    }`}
                    style={{ transitionDelay: transitioning ? "0ms" : `${index * 80}ms` }}
                  >
                    <div className="overflow-hidden rounded-3xl bg-background boty-shadow boty-transition group-hover:scale-[1.02]">
                      <div className="relative aspect-square overflow-hidden bg-muted">
                        {thumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={thumb}
                            alt=""
                            className="absolute inset-0 h-full w-full object-cover boty-transition group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/15 to-muted">
                            <span className="font-serif text-2xl text-primary/40">DIB</span>
                          </div>
                        )}
                        <span className="absolute left-4 top-4 rounded-full bg-primary/90 px-3 py-1 text-xs text-primary-foreground">
                          {c.moduleCount} модулей
                        </span>
                      </div>
                      <div className="p-5">
                        <h3 className="mb-1 font-serif text-lg text-foreground line-clamp-2">{c.title}</h3>
                        <p className="line-clamp-2 text-sm text-muted-foreground">
                          {c.description ?? "Курс для специалистов"}
                        </p>
                        {c.progress !== undefined ? (
                          <div className="mt-3">
                            <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                              <span>Ваш прогресс</span>
                              <span>{c.progress}%</span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-primary boty-transition"
                                style={{ width: `${c.progress}%` }}
                              />
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </Link>
                )
              })
            ))}

          {selected === "diagnostics" &&
            diagnosticsItems.map((d, index) => (
              <Link
                key={d.id}
                href={d.href}
                className={`group transition-all duration-500 ease-out ${
                  visible && !transitioning ? "scale-100 opacity-100" : "scale-95 opacity-0"
                }`}
                style={{ transitionDelay: transitioning ? "0ms" : `${index * 80}ms` }}
              >
                <div className="relative overflow-hidden rounded-3xl bg-background boty-shadow boty-transition group-hover:scale-[1.02]">
                  <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-gradient-to-br from-secondary/20 to-muted">
                    {d.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- URL из сохранённого анализа
                      <img
                        src={d.imageUrl}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover boty-transition group-hover:scale-105"
                      />
                    ) : (
                      <Sparkles className="relative z-[1] h-14 w-14 text-primary" strokeWidth={1.25} />
                    )}
                    {d.badge && (
                      <span className="absolute left-4 top-4 z-[2] rounded-full bg-primary px-3 py-1 text-xs text-primary-foreground">
                        {d.badge}
                      </span>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="mb-1 font-serif text-lg text-foreground">{d.title}</h3>
                    <p className="text-sm text-muted-foreground">{d.desc}</p>
                  </div>
                </div>
              </Link>
            ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href={
              selected === "courses"
                ? catalogHref
                : selected === "diagnostics"
                  ? diagnosticsHref
                  : shopHref
            }
            className="inline-flex items-center justify-center gap-2 rounded-full border border-foreground/20 px-8 py-4 text-sm tracking-wide text-foreground boty-transition hover:bg-foreground/5"
          >
            Смотреть все
          </Link>
        </div>
      </div>
    </section>
  )
}
