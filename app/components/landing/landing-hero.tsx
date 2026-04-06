"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { BOTY_HERO_VIDEO_URL } from "@/lib/boty-media"

const HERO_LINES: { top: string; bottom: string; label: string }[] = [
  { top: "Учись у лучших.", bottom: "Стань профи.", label: "Курсы косметологии" },
  { top: "Сияй естественно.", bottom: "Будь собой.", label: "Магазин косметики" },
  { top: "Узнай свою кожу.", bottom: "AI-диагностика.", label: "Диагностика лица" },
]

const TYPING_MS = 55
const PAUSE_MS = 3200
const ERASE_MS = 30

type Phase = "typing-top" | "typing-bottom" | "visible" | "erasing-bottom" | "erasing-top"

function useTypewriter(lines: typeof HERO_LINES) {
  const [index, setIndex] = useState(0)
  const [topText, setTopText] = useState("")
  const [bottomText, setBottomText] = useState("")
  const [phase, setPhase] = useState<Phase>("typing-top")
  const [showCursor, setShowCursor] = useState(true)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const tick = useCallback(() => {
    const line = lines[index]!

    switch (phase) {
      case "typing-top":
        if (topText.length < line.top.length) {
          setTopText(line.top.slice(0, topText.length + 1))
        } else {
          setPhase("typing-bottom")
        }
        break
      case "typing-bottom":
        if (bottomText.length < line.bottom.length) {
          setBottomText(line.bottom.slice(0, bottomText.length + 1))
        } else {
          setPhase("visible")
        }
        break
      case "visible":
        setPhase("erasing-bottom")
        break
      case "erasing-bottom":
        if (bottomText.length > 0) {
          setBottomText(bottomText.slice(0, -1))
        } else {
          setPhase("erasing-top")
        }
        break
      case "erasing-top":
        if (topText.length > 0) {
          setTopText(topText.slice(0, -1))
        } else {
          setIndex((index + 1) % lines.length)
          setPhase("typing-top")
        }
        break
    }
  }, [phase, topText, bottomText, index, lines])

  useEffect(() => {
    const delay =
      phase === "visible"
        ? PAUSE_MS
        : phase === "erasing-bottom" || phase === "erasing-top"
          ? ERASE_MS
          : TYPING_MS

    timer.current = setTimeout(tick, delay)
    return () => clearTimeout(timer.current)
  }, [tick, phase])

  useEffect(() => {
    const id = setInterval(() => setShowCursor((v) => !v), 530)
    return () => clearInterval(id)
  }, [])

  return { topText, bottomText, label: lines[index]!.label, showCursor, phase }
}

type Props = {
  shopTitle: string
  heroSubtitle: string
  shopHref: string
  posterUrl?: string
}

export function LandingHero({ heroSubtitle, shopHref, posterUrl }: Props) {
  const { topText, bottomText, label, showCursor, phase } = useTypewriter(HERO_LINES)

  const cursorAfterTop = phase === "typing-top" || phase === "erasing-top"

  return (
    <section
      className="relative flex min-h-screen items-center overflow-hidden"
      style={{ backgroundColor: "#e3e1e2" }}
    >
      <div className="absolute inset-0 border-b border-border/50" style={{ backgroundColor: "#e3e1e2" }}>
        {/* Hero video: лёгкий warm grade (клиника часто даёт холодный свет) + тёплый оверлей под бренд */}
        <div className="absolute inset-0 overflow-hidden">
          <video
            autoPlay
            muted
            loop
            playsInline
            poster={posterUrl}
            className="absolute left-1/2 top-1/2 min-h-full min-w-full -translate-x-1/2 -translate-y-1/2 scale-[1.02] object-cover"
            style={{
              filter:
                "brightness(1.05) contrast(1.04) saturate(1.12) sepia(0.14) hue-rotate(-10deg)",
            }}
          >
            <source src={BOTY_HERO_VIDEO_URL} type="video/mp4" />
          </video>
        </div>
        {/* Тёплый «плёнка» поверх — согласует с кремовым UI, не перекрывает контент */}
        <div
          className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-br from-amber-50/30 via-orange-50/10 to-amber-950/15 mix-blend-soft-light"
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(ellipse_at_30%_20%,rgba(255,237,213,0.35),transparent_55%)]" aria-hidden />
        <div className="absolute bottom-0 left-0 right-0 z-[2] h-[60%] bg-gradient-to-t from-[#f7f4ef] via-[#f7f4ef]/55 to-transparent" />
      </div>

      <div className="relative z-10 mr-14 w-full pt-24 lg:mr-0">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto w-full text-center lg:mx-0 lg:max-w-xl lg:text-left">
            <span
              className="mb-6 block text-sm uppercase tracking-normal text-black opacity-0 animate-blur-in"
              style={{ animationDelay: "0.2s", animationFillMode: "forwards" }}
            >
              {label}
            </span>

            <h1 className="font-serif text-5xl font-semibold leading-[1.1] text-black md:text-6xl lg:text-7xl">
              <span className="block min-h-[1.2em]">
                {topText}
                {cursorAfterTop && (
                  <span
                    className="ml-0.5 inline-block w-[3px] align-text-bottom bg-primary"
                    style={{ height: "0.95em", opacity: showCursor ? 1 : 0 }}
                  />
                )}
              </span>
              <span className="block min-h-[1.2em] whitespace-nowrap leading-none text-7xl font-semibold xl:text-9xl">
                {bottomText}
                {!cursorAfterTop && (
                  <span
                    className="ml-0.5 inline-block w-[3px] align-text-bottom bg-primary"
                    style={{ height: "0.95em", opacity: showCursor ? 1 : 0 }}
                  />
                )}
              </span>
            </h1>

            <p
              className="mx-auto mb-10 mt-6 max-w-md text-lg leading-relaxed text-black opacity-0 animate-blur-in lg:mx-0"
              style={{ animationDelay: "0.8s", animationFillMode: "forwards" }}
            >
              {heroSubtitle}
            </p>
            <div
              className="flex flex-col justify-center gap-4 opacity-0 animate-blur-in sm:flex-row lg:justify-start"
              style={{ animationDelay: "1s", animationFillMode: "forwards" }}
            >
              <Link
                href={shopHref}
                className="group inline-flex items-center justify-center gap-3 rounded-full bg-primary px-8 py-4 text-sm tracking-wide text-primary-foreground boty-shadow boty-transition hover:bg-primary/90"
              >
                Смотреть каталог
                <ArrowRight className="h-4 w-4 boty-transition group-hover:translate-x-1" />
              </Link>
              <Link
                href="/diagnostics"
                className="inline-flex items-center justify-center rounded-full border border-foreground/20 px-8 py-4 text-sm tracking-wide text-foreground boty-transition hover:bg-foreground/5"
              >
                Диагностика лица
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-black">
        <span className="text-xs font-bold uppercase tracking-widest">Листать</span>
        <div className="relative h-12 w-px overflow-hidden bg-foreground/20">
          <div className="absolute left-0 top-0 h-1/2 w-full animate-pulse bg-foreground/60" />
        </div>
      </div>
    </section>
  )
}
