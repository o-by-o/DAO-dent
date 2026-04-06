"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"

const MONTH_SHORT = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"]
const DAY_NAMES = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]

function pad(n: number) { return String(n).padStart(2, "0") }

export function SidebarCalendar() {
  const router = useRouter()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [eventDays, setEventDays] = useState<Set<number>>(new Set())

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(year - 1) } else setMonth(month - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(year + 1) } else setMonth(month + 1)
  }

  // Fetch event days for current month
  const fetchEventDays = useCallback(async () => {
    try {
      const res = await fetch(`/api/schedule?month=${year}-${pad(month + 1)}`)
      if (res.ok) {
        const data = await res.json()
        const days = new Set<number>()
        for (const e of data.events) {
          const d = new Date(e.date)
          if (d.getMonth() === month && d.getFullYear() === year) {
            days.add(d.getDate())
          }
        }
        setEventDays(days)
      }
    } catch {
      // silent
    }
  }, [year, month])

  useEffect(() => { fetchEventDays() }, [fetchEventDays])

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startWeekday = (firstDay.getDay() + 6) % 7
  const totalDays = lastDay.getDate()

  const days: (number | null)[] = []
  for (let i = 0; i < startWeekday; i++) days.push(null)
  for (let d = 1; d <= totalDays; d++) days.push(d)
  while (days.length % 7 !== 0) days.push(null)

  const today = now.getDate()
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() === month

  const handleDayClick = (day: number) => {
    const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`
    router.push(`/schedule?date=${dateStr}`)
  }

  return (
    <div className="px-2">
      <div className="rounded-xl border border-border/30 bg-background/50 p-2">
        {/* Header */}
        <div className="mb-1 flex items-center justify-between">
          <button onClick={prevMonth} className="rounded p-0.5 boty-transition hover:bg-muted">
            <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <span className="text-[11px] font-medium">
            {MONTH_SHORT[month]} {year}
          </span>
          <button onClick={nextMonth} className="rounded p-0.5 boty-transition hover:bg-muted">
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>

        {/* Day names */}
        <div className="grid grid-cols-7 gap-0">
          {DAY_NAMES.map((d) => (
            <div key={d} className="py-0.5 text-center text-[9px] text-muted-foreground/70">
              {d}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-0">
          {days.map((day, i) => {
            if (day === null) return <div key={`e-${i}`} className="h-6" />
            const isToday = isCurrentMonth && day === today
            const hasEvents = eventDays.has(day)
            return (
              <button
                key={day}
                onClick={() => handleDayClick(day)}
                className={`relative flex h-6 items-center justify-center rounded text-[10px] boty-transition hover:bg-muted/60 ${
                  isToday
                    ? "bg-primary font-bold text-primary-foreground hover:bg-primary/90"
                    : "text-foreground/80"
                }`}
              >
                {day}
                {hasEvents && (
                  <span className={`absolute bottom-0 h-1 w-1 rounded-full ${
                    isToday ? "bg-primary-foreground" : "bg-primary"
                  }`} />
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
