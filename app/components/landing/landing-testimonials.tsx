"use client"

import { useEffect, useRef, useState } from "react"

export type LandingReview = { name: string; text: string; tag?: string }

function triple<T>(arr: T[]): T[] {
  return [...arr, ...arr, ...arr]
}

function TestimonialCard({ review }: { review: LandingReview }) {
  return (
    <div
      className="mb-4 flex-shrink-0 rounded-3xl bg-white p-6"
      style={{
        boxShadow:
          "rgba(14, 63, 126, 0.04) 0px 0px 0px 1px, rgba(42, 51, 69, 0.04) 0px 1px 1px -0.5px, rgba(42, 51, 70, 0.04) 0px 3px 3px -1.5px, rgba(42, 51, 70, 0.04) 0px 6px 6px -3px, rgba(14, 63, 126, 0.04) 0px 12px 12px -6px, rgba(14, 63, 126, 0.04) 0px 24px 24px -12px",
      }}
    >
      <p className="mb-4 text-pretty font-serif text-xl font-medium leading-relaxed tracking-wide text-foreground/85">
        &ldquo;{review.text}&rdquo;
      </p>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-foreground">{review.name}</p>
          <p className="text-xs text-muted-foreground">Клиент DIB Academy</p>
        </div>
        {review.tag && (
          <span className="whitespace-nowrap rounded-full bg-primary/5 px-2 py-1 text-xs tracking-wide text-primary/80">
            {review.tag}
          </span>
        )}
      </div>
    </div>
  )
}

type Props = {
  reviews: LandingReview[]
}

export function LandingTestimonials({ reviews }: Props) {
  const [headerVisible, setHeaderVisible] = useState(false)
  const headerRef = useRef<HTMLDivElement>(null)

  const extended = triple(reviews)
  const column1 = [extended[0], extended[3], extended[6]].filter(Boolean)
  const column2 = [extended[1], extended[4], extended[7]].filter(Boolean)
  const column3 = [extended[2], extended[5], extended[8]].filter(Boolean)

  const loop = (col: LandingReview[]) => [...col, ...col]

  useEffect(() => {
    if (!headerRef.current) return
    const o = new IntersectionObserver(([e]) => e.isIntersecting && setHeaderVisible(true), {
      threshold: 0.1,
    })
    o.observe(headerRef.current)
    return () => o.disconnect()
  }, [])

  return (
    <section className="overflow-hidden bg-background pb-24 pt-12">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div ref={headerRef} className="mb-16 text-center">
          <span
            className={`mb-4 block text-sm uppercase tracking-[0.3em] text-primary ${
              headerVisible ? "animate-blur-in opacity-0" : "opacity-0"
            }`}
            style={headerVisible ? { animationDelay: "0.2s", animationFillMode: "forwards" } : {}}
          >
            Отзывы
          </span>
          <h2
            className={`text-balance font-serif text-4xl leading-tight text-foreground md:text-6xl lg:text-7xl ${
              headerVisible ? "animate-blur-in opacity-0" : "opacity-0"
            }`}
            style={headerVisible ? { animationDelay: "0.4s", animationFillMode: "forwards" } : {}}
          >
            Нам доверяют
          </h2>
        </div>

        <div className="relative">
          <div className="pointer-events-none absolute left-0 right-0 top-0 z-10 h-24 bg-gradient-to-b from-background to-transparent" />
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-24 bg-gradient-to-t from-background to-transparent" />

          <div className="h-[560px] md:hidden">
            <div className="relative h-full overflow-hidden">
              <div className="boty-animate-scroll-down">
                {loop(reviews.length ? reviews : extended.slice(0, 3)).map((r, i) => (
                  <TestimonialCard key={`m-${i}-${r.name}`} review={r} />
                ))}
              </div>
            </div>
          </div>

          <div className="hidden h-[560px] grid-cols-3 gap-4 md:grid">
            <div className="relative overflow-hidden">
              <div className="boty-animate-scroll-down">
                {loop(column1.length ? column1 : reviews).map((r, i) => (
                  <TestimonialCard key={`c1-${i}`} review={r} />
                ))}
              </div>
            </div>
            <div className="relative overflow-hidden">
              <div className="boty-animate-scroll-up">
                {loop(column2.length ? column2 : reviews).map((r, i) => (
                  <TestimonialCard key={`c2-${i}`} review={r} />
                ))}
              </div>
            </div>
            <div className="relative overflow-hidden">
              <div className="boty-animate-scroll-down">
                {loop(column3.length ? column3 : reviews).map((r, i) => (
                  <TestimonialCard key={`c3-${i}`} review={r} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
