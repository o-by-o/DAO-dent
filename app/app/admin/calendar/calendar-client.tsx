"use client"

import { useEffect, useState, useCallback } from "react"
import { ChevronLeft, ChevronRight, Phone, Cake, ExternalLink } from "lucide-react"

interface CalendarEvent {
  id: string
  type: "call" | "birthday"
  title: string
  clientName: string
  clientId: string
  date: string
  note?: string
}

const MONTH_NAMES = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
]

const DAY_NAMES = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]

export function CalendarClient() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    const m = `${year}-${String(month + 1).padStart(2, "0")}`
    const res = await fetch(`/api/admin/calendar?month=${m}`)
    if (res.ok) {
      const data = await res.json()
      setEvents(data.events)
    }
    setLoading(false)
  }, [year, month])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(year - 1) }
    else setMonth(month - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(year + 1) }
    else setMonth(month + 1)
  }

  // Build calendar grid
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startWeekday = (firstDay.getDay() + 6) % 7 // Monday = 0
  const totalDays = lastDay.getDate()

  const days: (number | null)[] = []
  for (let i = 0; i < startWeekday; i++) days.push(null)
  for (let d = 1; d <= totalDays; d++) days.push(d)
  while (days.length % 7 !== 0) days.push(null)

  const getEventsForDay = (day: number) => {
    return events.filter((e) => {
      const d = new Date(e.date)
      return d.getDate() === day
    })
  }

  const today = now.getDate()
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() === month

  // Upcoming events (next 7 days from today)
  const upcoming = events.filter((e) => {
    const d = new Date(e.date)
    const diff = d.getTime() - now.getTime()
    return diff >= 0 && diff < 7 * 24 * 60 * 60 * 1000
  })

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold">Календарь</h1>
      <p className="mb-6 text-sm text-muted-foreground">Звонки, напоминания и дни рождения клиентов</p>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar grid */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-border/50 bg-card p-4 shadow-[var(--shadow-card)]">
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
              <button onClick={prevMonth} className="rounded-lg p-2 boty-transition hover:bg-muted">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h2 className="text-lg font-semibold">
                {MONTH_NAMES[month]} {year}
              </h2>
              <button onClick={nextMonth} className="rounded-lg p-2 boty-transition hover:bg-muted">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* Day names */}
            <div className="grid grid-cols-7 gap-px">
              {DAY_NAMES.map((d) => (
                <div key={d} className="py-2 text-center text-xs font-medium text-muted-foreground">
                  {d}
                </div>
              ))}
            </div>

            {/* Days */}
            <div className="grid grid-cols-7 gap-px">
              {days.map((day, i) => {
                if (day === null) return <div key={`empty-${i}`} className="min-h-[72px]" />

                const dayEvents = getEventsForDay(day)
                const isToday = isCurrentMonth && day === today

                return (
                  <div
                    key={day}
                    className={`min-h-[72px] rounded-lg p-1.5 boty-transition ${
                      isToday ? "bg-primary/5 ring-1 ring-primary/30" : "hover:bg-muted/50"
                    }`}
                  >
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                        isToday ? "bg-primary font-bold text-primary-foreground" : ""
                      }`}
                    >
                      {day}
                    </span>
                    <div className="mt-0.5 space-y-0.5">
                      {dayEvents.slice(0, 2).map((e) => (
                        <a
                          key={e.id}
                          href={`/admin/clients/${e.clientId}`}
                          className={`block truncate rounded px-1 py-0.5 text-[10px] font-medium boty-transition ${
                            e.type === "call"
                              ? "bg-chart-2/10 text-chart-2 hover:bg-chart-2/20"
                              : "bg-primary/10 text-primary hover:bg-primary/20"
                          }`}
                        >
                          {e.type === "call" ? "📞" : "🎂"} {e.clientName}
                        </a>
                      ))}
                      {dayEvents.length > 2 && (
                        <span className="block text-[10px] text-muted-foreground">
                          +{dayEvents.length - 2}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Sidebar: upcoming events */}
        <div>
          <div className="rounded-xl border border-border/50 bg-card p-4 shadow-[var(--shadow-card)]">
            <h3 className="mb-3 text-sm font-semibold">Ближайшие 7 дней</h3>
            {loading ? (
              <p className="text-xs text-muted-foreground">Загрузка...</p>
            ) : upcoming.length > 0 ? (
              <ul className="space-y-3">
                {upcoming.map((e) => (
                  <li key={e.id} className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                        e.type === "call" ? "bg-chart-2/10" : "bg-primary/10"
                      }`}
                    >
                      {e.type === "call" ? (
                        <Phone className="h-3.5 w-3.5 text-chart-2" />
                      ) : (
                        <Cake className="h-3.5 w-3.5 text-primary" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{e.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(e.date).toLocaleDateString("ru-RU", {
                          day: "numeric",
                          month: "short",
                          hour: e.type === "call" ? "2-digit" : undefined,
                          minute: e.type === "call" ? "2-digit" : undefined,
                        })}
                      </p>
                      {e.note && (
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">{e.note}</p>
                      )}
                    </div>
                    <a
                      href={`/admin/clients/${e.clientId}`}
                      className="shrink-0 text-muted-foreground boty-transition hover:text-primary"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">Нет событий на ближайшую неделю</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
