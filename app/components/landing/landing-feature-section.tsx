"use client"

import { useEffect, useRef, useState } from "react"
import { Users, Sparkles, BookOpen, ShieldCheck } from "lucide-react"
import {
  BOTY_FEATURE_VIDEO_LARGE_URL,
  BOTY_FEATURE_VIDEO_PORTRAIT_URL,
  BOTY_FEATURE_VIDEO_STRIP_URL,
} from "@/lib/boty-media"

const features = [
  {
    icon: Sparkles,
    title: "AI-диагностика лица",
    description: "Анализ и подбор ухода",
  },
  {
    icon: BookOpen,
    title: "Курсы для косметологов",
    description: "Базовые и продвинутые программы",
  },
  {
    icon: Users,
    title: "Партнёрская программа",
    description: "Рекомендуйте продукцию коллегам",
  },
  {
    icon: ShieldCheck,
    title: "Проверенные бренды",
    description: "Сертифицированная косметика",
  },
]

type Props = {
  coursesSpotlightUrl: string
}

export function LandingFeatureSection({ coursesSpotlightUrl }: Props) {
  const [bentoVisible, setBentoVisible] = useState(false)
  const [videoVisible, setVideoVisible] = useState(false)
  const [headerVisible, setHeaderVisible] = useState(false)
  const bentoRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mk = (el: HTMLElement | null, set: (v: boolean) => void) => {
      if (!el) return
      const o = new IntersectionObserver(([e]) => e.isIntersecting && set(true), { threshold: 0.1 })
      o.observe(el)
      return o
    }
    const a = mk(bentoRef.current, setBentoVisible)
    const b = mk(videoRef.current, setVideoVisible)
    const c = mk(headerRef.current, setHeaderVisible)
    return () => {
      a?.disconnect()
      b?.disconnect()
      c?.disconnect()
    }
  }, [])

  return (
    <section className="bg-background py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div ref={bentoRef} className="mb-20 grid gap-6 md:grid-cols-4 md:grid-rows-[300px_300px]">
          <div
            className={`relative h-[500px] overflow-hidden rounded-3xl md:col-span-2 md:row-span-2 md:h-auto ${
              bentoVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
            } transition-all duration-700 ease-out`}
          >
            <video autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover">
              <source src={BOTY_FEATURE_VIDEO_LARGE_URL} type="video/mp4" />
            </video>
            <div className="absolute bottom-8 left-8 right-8 rounded-xl bg-white p-6 shadow-lg">
              <h3 className="mb-2 text-xl font-medium text-foreground">
                Экосистема <span className="text-primary">DIB Academy</span>
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Каталог, обучение и диагностика — единый портал для косметологов.
              </p>
            </div>
          </div>

          <div
            className={`relative flex min-h-[280px] flex-col justify-center overflow-hidden rounded-3xl p-6 md:col-span-2 md:p-8 ${
              bentoVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
            } transition-all delay-100 duration-700 ease-out`}
          >
            {coursesSpotlightUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coursesSpotlightUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-muted" />
            )}
            <div className="absolute inset-0 bg-black/35" />
            <div className="relative z-10">
              <h3 className="mb-2 text-3xl text-white md:text-4xl">Профессионалам</h3>
              <h3 className="mb-4 text-2xl text-white/80 md:text-3xl">и салонам</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-white/90">
                  <Sparkles className="h-4 w-4 shrink-0" />
                  <span>AI-диагностика лица</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-white/90">
                  <BookOpen className="h-4 w-4 shrink-0" />
                  <span>Курсы и повышение квалификации</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-white/90">
                  <Users className="h-4 w-4 shrink-0" />
                  <span>Партнёрские возможности</span>
                </div>
              </div>
            </div>
          </div>

          <div
            className={`relative flex min-h-[220px] flex-col justify-center overflow-hidden rounded-3xl p-6 md:col-span-2 md:p-8 ${
              bentoVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
            } transition-all delay-200 duration-700 ease-out`}
          >
            <video
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 h-full w-full scale-[1.02] object-cover"
            >
              <source src={BOTY_FEATURE_VIDEO_STRIP_URL} type="video/mp4" />
            </video>
            <div className="relative z-10 flex h-full flex-col items-start justify-center text-left">
              <ShieldCheck className="mb-3 h-8 w-8 text-white drop-shadow-md" />
              <h3 className="mb-1 text-base text-white drop-shadow-sm">Сертифицированная</h3>
              <h3 className="text-2xl text-white drop-shadow-sm md:text-3xl">косметика</h3>
            </div>
          </div>
        </div>

        <div ref={videoRef} className="grid items-center gap-12 py-20 lg:grid-cols-2 lg:gap-20">
          <div
            className={`relative aspect-[4/5] overflow-hidden rounded-3xl boty-shadow ${
              videoVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
            } transition-all duration-700 ease-out`}
          >
            <video autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover">
              <source src={BOTY_FEATURE_VIDEO_PORTRAIT_URL} type="video/mp4" />
            </video>
          </div>

          <div
            ref={headerRef}
            className={`transition-all duration-700 ease-out ${
              videoVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}
            style={{ transitionDelay: "100ms" }}
          >
            <span
              className={`mb-4 block text-sm uppercase tracking-[0.3em] text-primary ${
                headerVisible ? "animate-blur-in opacity-0" : "opacity-0"
              }`}
              style={headerVisible ? { animationDelay: "0.2s", animationFillMode: "forwards" } : {}}
            >
              Почему DIB-INTERFARM
            </span>
            <h2
              className={`mb-6 text-balance font-serif text-4xl leading-tight text-foreground md:text-6xl lg:text-7xl ${
                headerVisible ? "animate-blur-in opacity-0" : "opacity-0"
              }`}
              style={headerVisible ? { animationDelay: "0.4s", animationFillMode: "forwards" } : {}}
            >
              Забота о вашем бизнесе.
            </h2>
            <p
              className={`mb-10 max-w-md text-lg leading-relaxed text-muted-foreground ${
                headerVisible ? "animate-blur-in opacity-0" : "opacity-0"
              }`}
              style={headerVisible ? { animationDelay: "0.6s", animationFillMode: "forwards" } : {}}
            >
              Экосистема для косметологов: профессиональная косметика, обучение и AI-диагностика — всё на
              одной площадке.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="group rounded-xl bg-card p-5 boty-transition hover:scale-[1.02]"
                >
                  <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-muted boty-transition group-hover:bg-primary/15">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="mb-1 font-medium text-foreground">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
