"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { ArrowRight, Phone } from "lucide-react"

const HERO_LINES: { top: string; bottom: string; label: string }[] = [
  { top: "Здоровая улыбка.", bottom: "Каждый день.", label: "Лечение зубов" },
  { top: "Безболезненно.", bottom: "Современно.", label: "Имплантация" },
  { top: "Вся семья.", bottom: "Один врач.", label: "Семейная стоматология" },
  { top: "5 минут пешком.", bottom: "От метро.", label: "м. Семёновская" },
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
        if (topText.length < line.top.length) setTopText(line.top.slice(0, topText.length + 1))
        else setPhase("typing-bottom")
        break
      case "typing-bottom":
        if (bottomText.length < line.bottom.length) setBottomText(line.bottom.slice(0, bottomText.length + 1))
        else setPhase("visible")
        break
      case "visible":
        setPhase("erasing-bottom")
        break
      case "erasing-bottom":
        if (bottomText.length > 0) setBottomText(bottomText.slice(0, -1))
        else setPhase("erasing-top")
        break
      case "erasing-top":
        if (topText.length > 0) setTopText(topText.slice(0, -1))
        else { setIndex((index + 1) % lines.length); setPhase("typing-top") }
        break
    }
  }, [phase, topText, bottomText, index, lines])

  useEffect(() => {
    const delay = phase === "visible" ? PAUSE_MS : phase === "erasing-bottom" || phase === "erasing-top" ? ERASE_MS : TYPING_MS
    timer.current = setTimeout(tick, delay)
    return () => clearTimeout(timer.current)
  }, [tick, phase])

  useEffect(() => {
    const id = setInterval(() => setShowCursor((v) => !v), 530)
    return () => clearInterval(id)
  }, [])

  return { topText, bottomText, label: lines[index]!.label, showCursor, phase }
}

export function LandingHero() {
  const { topText, bottomText, label, showCursor, phase } = useTypewriter(HERO_LINES)
  const cursorAfterTop = phase === "typing-top" || phase === "erasing-top"

  return (
    <section className="relative flex min-h-screen items-center overflow-hidden bg-gradient-to-br from-blue-50 via-white to-sky-50">
      {/* Декоративный фон */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-[600px] w-[600px] rounded-full bg-blue-100/40 blur-3xl" />
        <div className="absolute -left-20 bottom-20 h-[400px] w-[400px] rounded-full bg-sky-100/30 blur-3xl" />
      </div>

      <div className="relative z-10 w-full pt-28 pb-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto w-full text-center lg:mx-0 lg:max-w-2xl lg:text-left">
            <span
              className="mb-4 inline-block rounded-full bg-blue-100 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-blue-700 opacity-0 animate-blur-in"
              style={{ animationDelay: "0.2s", animationFillMode: "forwards" }}
            >
              {label}
            </span>

            <h1 className="font-serif text-5xl font-semibold leading-[1.1] text-gray-900 md:text-6xl lg:text-7xl">
              <span className="block min-h-[1.2em]">
                {topText}
                {cursorAfterTop && (
                  <span
                    className="ml-0.5 inline-block w-[3px] align-text-bottom bg-blue-600"
                    style={{ height: "0.95em", opacity: showCursor ? 1 : 0 }}
                  />
                )}
              </span>
              <span className="block min-h-[1.2em] whitespace-nowrap text-blue-600">
                {bottomText}
                {!cursorAfterTop && (
                  <span
                    className="ml-0.5 inline-block w-[3px] align-text-bottom bg-blue-600"
                    style={{ height: "0.95em", opacity: showCursor ? 1 : 0 }}
                  />
                )}
              </span>
            </h1>

            <p
              className="mx-auto mb-8 mt-6 max-w-lg text-lg leading-relaxed text-gray-600 opacity-0 animate-blur-in lg:mx-0"
              style={{ animationDelay: "0.8s", animationFillMode: "forwards" }}
            >
              Семейная стоматология у метро Семёновская. Безболезненное лечение,
              современное оборудование, опытные врачи. Запишитесь онлайн прямо сейчас.
            </p>

            <div
              className="flex flex-col justify-center gap-4 opacity-0 animate-blur-in sm:flex-row lg:justify-start"
              style={{ animationDelay: "1s", animationFillMode: "forwards" }}
            >
              <a
                href="#appointment"
                className="group inline-flex items-center justify-center gap-3 rounded-full bg-blue-600 px-8 py-4 text-sm font-medium tracking-wide text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700"
              >
                Записаться на приём
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </a>
              <a
                href="tel:+74950000000"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-8 py-4 text-sm font-medium tracking-wide text-gray-700 transition hover:bg-gray-50"
              >
                <Phone className="h-4 w-4" />
                Позвонить
              </a>
            </div>

            {/* Преимущества */}
            <div
              className="mt-12 flex flex-wrap justify-center gap-6 opacity-0 animate-blur-in lg:justify-start"
              style={{ animationDelay: "1.3s", animationFillMode: "forwards" }}
            >
              {[
                { value: "15+", label: "лет опыта" },
                { value: "3", label: "кабинета" },
                { value: "5 мин", label: "от метро" },
                { value: "0%", label: "рассрочка" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stat.value}</div>
                  <div className="text-xs text-gray-500">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-widest text-gray-400">Листать</span>
        <div className="relative h-12 w-px overflow-hidden bg-gray-200">
          <div className="absolute left-0 top-0 h-1/2 w-full animate-pulse bg-blue-400" />
        </div>
      </div>
    </section>
  )
}
