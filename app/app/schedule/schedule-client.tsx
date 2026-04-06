"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { ChevronLeft, ChevronRight, Plus, X, Trash2, MousePointerClick } from "lucide-react"
import type { ScheduleEvent } from "@/app/api/schedule/route"

type View = "day" | "week" | "month"

interface PopoverState {
  date: Date
  hour: number
  x: number
  y: number
}

const HOURS = Array.from({ length: 15 }, (_, i) => i + 7) // 07:00–21:00
const DAY_NAMES_SHORT = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]
const DAY_NAMES_FULL = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"]
const MONTH_NAMES = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"]
const MONTH_NAMES_SHORT = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"]

const EVENT_ICONS: Record<string, string> = {
  call: "📞",
  birthday: "🎂",
  stock: "📦",
  expiry: "⚠️",
  order: "🛒",
  note: "📝",
}

const NOTE_COLORS = [
  { value: "#3b82f6", label: "Синий" },
  { value: "#22c55e", label: "Зелёный" },
  { value: "#f97316", label: "Оранжевый" },
  { value: "#ec4899", label: "Розовый" },
  { value: "#8b5cf6", label: "Фиолетовый" },
  { value: "#6b7280", label: "Серый" },
]

function pad(n: number) { return String(n).padStart(2, "0") }
function fmtDate(d: Date) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` }
function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}
function getWeekStart(d: Date) {
  const day = (d.getDay() + 6) % 7
  const start = new Date(d)
  start.setDate(start.getDate() - day)
  return start
}

export function ScheduleClient() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const dateParam = searchParams.get("date")

  const [view, setView] = useState<View>("week")
  const [selectedDate, setSelectedDate] = useState(() => {
    if (dateParam) return new Date(dateParam)
    return new Date()
  })
  const [events, setEvents] = useState<ScheduleEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [popover, setPopover] = useState<PopoverState | null>(null)
  const [showHint, setShowHint] = useState(true)

  useEffect(() => {
    if (localStorage.getItem("schedule-hint-dismissed")) {
      setShowHint(false)
    }
  }, [])

  const fetchEvents = useCallback(async (date: Date) => {
    setLoading(true)
    const month = `${date.getFullYear()}-${pad(date.getMonth() + 1)}`
    try {
      const res = await fetch(`/api/schedule?month=${month}`)
      if (res.ok) {
        const data = await res.json()
        setEvents(data.events)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchEvents(selectedDate) }, [selectedDate, fetchEvents])

  useEffect(() => {
    if (dateParam) {
      const d = new Date(dateParam)
      if (!isNaN(d.getTime())) setSelectedDate(d)
    }
  }, [dateParam])

  const goToday = () => {
    setSelectedDate(new Date())
    router.replace("/schedule")
  }

  const goPrev = () => {
    const d = new Date(selectedDate)
    if (view === "day") d.setDate(d.getDate() - 1)
    else if (view === "week") d.setDate(d.getDate() - 7)
    else d.setMonth(d.getMonth() - 1)
    setSelectedDate(d)
  }

  const goNext = () => {
    const d = new Date(selectedDate)
    if (view === "day") d.setDate(d.getDate() + 1)
    else if (view === "week") d.setDate(d.getDate() + 7)
    else d.setMonth(d.getMonth() + 1)
    setSelectedDate(d)
  }

  const eventsForDay = (date: Date) =>
    events.filter((e) => isSameDay(new Date(e.date), date))

  const openPopover = (date: Date, hour: number, e: React.MouseEvent) => {
    setPopover({ date, hour, x: e.clientX, y: e.clientY })
    setShowHint(false)
  }

  const openPopoverToolbar = () => {
    const now = new Date()
    setPopover({ date: selectedDate, hour: now.getHours(), x: window.innerWidth / 2, y: 200 })
  }

  const handleSaved = () => {
    setPopover(null)
    fetchEvents(selectedDate)
  }

  const handleDelete = async (noteId: string) => {
    await fetch(`/api/schedule?id=${noteId}`, { method: "DELETE" })
    fetchEvents(selectedDate)
  }

  const headerTitle = () => {
    if (view === "day") {
      const wd = (selectedDate.getDay() + 6) % 7
      return `${DAY_NAMES_FULL[wd]}, ${selectedDate.getDate()} ${MONTH_NAMES[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`
    }
    if (view === "week") {
      const ws = getWeekStart(selectedDate)
      const we = new Date(ws)
      we.setDate(we.getDate() + 6)
      if (ws.getMonth() === we.getMonth()) {
        return `${ws.getDate()}–${we.getDate()} ${MONTH_NAMES[ws.getMonth()]} ${ws.getFullYear()}`
      }
      return `${ws.getDate()} ${MONTH_NAMES[ws.getMonth()]} – ${we.getDate()} ${MONTH_NAMES[we.getMonth()]} ${ws.getFullYear()}`
    }
    return `${MONTH_NAMES[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`
  }

  return (
    <DashboardLayout activePath="/schedule">
      <div className="flex h-[calc(100vh-7rem)] flex-col">
        {/* Toolbar */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button onClick={goPrev} className="rounded-lg border border-border p-1.5 boty-transition hover:bg-muted">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={goNext} className="rounded-lg border border-border p-1.5 boty-transition hover:bg-muted">
              <ChevronRight className="h-4 w-4" />
            </button>
            <button onClick={goToday} className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium boty-transition hover:bg-muted">
              Сегодня
            </button>
            <h1 className="ml-2 text-lg font-semibold">{headerTitle()}</h1>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-border">
              {(["day", "week", "month"] as View[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-3 py-1.5 text-xs font-medium boty-transition ${
                    view === v ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  } ${v === "day" ? "rounded-l-lg" : v === "month" ? "rounded-r-lg" : ""}`}
                >
                  {v === "day" ? "День" : v === "week" ? "Неделя" : "Месяц"}
                </button>
              ))}
            </div>
            <button
              onClick={openPopoverToolbar}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground boty-transition hover:bg-primary/90"
            >
              <Plus className="h-3.5 w-3.5" /> Заметка
            </button>
          </div>
        </div>

        {/* Hint */}
        {showHint && (view === "day" || view === "week") && (
          <div className="mb-2 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
            <MousePointerClick className="h-4 w-4 shrink-0 text-primary" />
            <span className="text-xs text-muted-foreground">
              Дважды кликните по ячейке, чтобы создать событие
            </span>
            <button onClick={() => { setShowHint(false); localStorage.setItem("schedule-hint-dismissed", "1") }} className="ml-auto rounded p-0.5 text-muted-foreground/60 hover:text-foreground">
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="relative flex-1 overflow-hidden rounded-xl border border-border/50 bg-card shadow-[var(--shadow-card)]">
          {loading ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Загрузка...</div>
          ) : view === "day" ? (
            <DayView
              date={selectedDate}
              events={eventsForDay(selectedDate)}
              onCellDoubleClick={openPopover}
              onDelete={handleDelete}
            />
          ) : view === "week" ? (
            <WeekView
              startDate={getWeekStart(selectedDate)}
              events={events}
              onDayClick={(d) => { setSelectedDate(d); setView("day") }}
              onCellDoubleClick={openPopover}
            />
          ) : (
            <MonthView
              year={selectedDate.getFullYear()}
              month={selectedDate.getMonth()}
              events={events}
              selectedDate={selectedDate}
              onDayClick={(d) => { setSelectedDate(d); setView("day") }}
            />
          )}
        </div>

        {/* Inline popover */}
        {popover && (
          <InlineEventPopover
            date={popover.date}
            hour={popover.hour}
            anchorX={popover.x}
            anchorY={popover.y}
            onClose={() => setPopover(null)}
            onSaved={handleSaved}
          />
        )}
      </div>
    </DashboardLayout>
  )
}

/* ================================================================ */
/*  INLINE EVENT POPOVER (Apple Calendar style)                      */
/* ================================================================ */

function InlineEventPopover({
  date, hour, anchorX, anchorY, onClose, onSaved,
}: {
  date: Date
  hour: number
  anchorX: number
  anchorY: number
  onClose: () => void
  onSaved: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [title, setTitle] = useState("")
  const [timeStart, setTimeStart] = useState(`${pad(hour)}:00`)
  const [timeEnd, setTimeEnd] = useState(`${pad(hour + 1)}:00`)
  const [text, setText] = useState("")
  const [color, setColor] = useState("#3b82f6")
  const [saving, setSaving] = useState(false)

  // Position popover, adjust if it goes off-screen
  const [pos, setPos] = useState({ top: anchorY, left: anchorX })

  useEffect(() => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    let top = anchorY
    let left = anchorX

    // Keep within viewport
    if (left + rect.width > window.innerWidth - 16) {
      left = anchorX - rect.width
    }
    if (top + rect.height > window.innerHeight - 16) {
      top = window.innerHeight - rect.height - 16
    }
    if (top < 16) top = 16
    if (left < 16) left = 16

    setPos({ top, left })
  }, [anchorX, anchorY])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [onClose])

  const handleSave = async () => {
    if (!title.trim()) return
    setSaving(true)
    try {
      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: fmtDate(date),
          time: timeStart || undefined,
          title: title.trim(),
          text: text.trim() || undefined,
          color,
        }),
      })
      if (res.ok) {
        onSaved()
      } else {
        const err = await res.json().catch(() => ({}))
        console.error("[schedule] save error:", res.status, err)
      }
    } finally {
      setSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && title.trim()) {
      e.preventDefault()
      handleSave()
    }
  }

  const dateLabel = `${date.getDate()} ${MONTH_NAMES_SHORT[date.getMonth()]} ${date.getFullYear()}  ${timeStart} – ${timeEnd}`

  return (
    <>
      {/* Backdrop — click outside to close */}
      <div className="fixed inset-0 z-40" onMouseDown={onClose} />

      {/* Popover card */}
      <div
        ref={ref}
        className="fixed z-50 w-80 animate-in fade-in zoom-in-95 rounded-xl border border-border/60 bg-card p-0 shadow-2xl"
        style={{ top: pos.top, left: pos.left }}
      >
        {/* Title input — large, like Apple Calendar "New Event" */}
        <div className="flex items-center gap-2 border-b border-border/30 px-4 py-3">
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Новое событие"
            className="flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-muted-foreground/60"
          />
          {/* Color dot selector */}
          <div className="relative group/color">
            <button
              className="h-4 w-4 rounded-full ring-1 ring-border/40"
              style={{ backgroundColor: color }}
            />
            <div className="absolute right-0 top-6 z-10 hidden flex-col gap-1 rounded-lg border border-border bg-card p-1.5 shadow-lg group-hover/color:flex">
              {NOTE_COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setColor(c.value)}
                  className={`h-5 w-5 rounded-full boty-transition hover:scale-110 ${color === c.value ? "ring-2 ring-offset-1 ring-offset-card" : ""}`}
                  style={{ backgroundColor: c.value }}
                  title={c.label}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Date & time row */}
        <div className="border-b border-border/30 px-4 py-2.5">
          <div className="flex items-center gap-2 text-sm text-foreground/80">
            <span>{date.getDate()} {MONTH_NAMES_SHORT[date.getMonth()]} {date.getFullYear()}</span>
            <input
              type="time"
              value={timeStart}
              onChange={(e) => setTimeStart(e.target.value)}
              className="w-20 rounded bg-muted/60 px-1.5 py-0.5 text-xs outline-none focus:bg-muted"
            />
            <span className="text-muted-foreground">–</span>
            <input
              type="time"
              value={timeEnd}
              onChange={(e) => setTimeEnd(e.target.value)}
              className="w-20 rounded bg-muted/60 px-1.5 py-0.5 text-xs outline-none focus:bg-muted"
            />
          </div>
        </div>

        {/* Notes */}
        <div className="border-b border-border/30 px-4 py-2.5">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Добавить заметки..."
            rows={2}
            className="w-full resize-none bg-transparent text-xs text-foreground/80 outline-none placeholder:text-muted-foreground/50"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 px-4 py-2.5">
          <button
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-xs text-muted-foreground boty-transition hover:bg-muted hover:text-foreground"
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim() || saving}
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground boty-transition hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? "..." : "Сохранить"}
          </button>
        </div>
      </div>
    </>
  )
}

/* ================================================================ */
/*  DAY VIEW                                                         */
/* ================================================================ */

function DayView({
  date, events, onCellDoubleClick, onDelete,
}: {
  date: Date
  events: ScheduleEvent[]
  onCellDoubleClick: (date: Date, hour: number, e: React.MouseEvent) => void
  onDelete: (id: string) => void
}) {
  const allDay = events.filter((e) => !e.time)
  const timed = events.filter((e) => e.time).sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""))

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      {/* All-day events */}
      {allDay.length > 0 && (
        <div className="border-b border-border/50 bg-muted/30 px-4 py-2">
          <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Весь день</div>
          <div className="flex flex-wrap gap-1.5">
            {allDay.map((e) => (
              <EventChip key={e.id} event={e} onDelete={e.type === "note" ? () => onDelete(e.meta?.noteId ?? "") : undefined} />
            ))}
          </div>
        </div>
      )}

      {/* Time grid */}
      <div className="flex-1">
        {HOURS.map((h) => {
          const hourEvents = timed.filter((e) => parseInt(e.time!.split(":")[0]) === h)
          return (
            <div
              key={h}
              className="group flex min-h-[3.5rem] cursor-pointer border-b border-border/20"
              onDoubleClick={(e) => onCellDoubleClick(date, h, e)}
            >
              <div className="w-16 shrink-0 border-r border-border/20 px-2 py-1 text-right text-[11px] text-muted-foreground">
                {pad(h)}:00
              </div>
              <div className="flex flex-1 flex-wrap items-start gap-1 px-2 py-1">
                {hourEvents.map((e) => (
                  <EventChip key={e.id} event={e} showTime onDelete={e.type === "note" ? () => onDelete(e.meta?.noteId ?? "") : undefined} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ================================================================ */
/*  WEEK VIEW                                                        */
/* ================================================================ */

function WeekView({
  startDate, events, onDayClick, onCellDoubleClick,
}: {
  startDate: Date
  events: ScheduleEvent[]
  onDayClick: (d: Date) => void
  onCellDoubleClick: (date: Date, hour: number, e: React.MouseEvent) => void
}) {
  const today = new Date()
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startDate)
    d.setDate(d.getDate() + i)
    return d
  })

  const eventsForDay = (d: Date) => events.filter((e) => isSameDay(new Date(e.date), d))

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header row */}
      <div className="grid grid-cols-[3.5rem_repeat(7,1fr)] border-b border-border/50">
        <div />
        {days.map((d, i) => {
          const isToday = isSameDay(d, today)
          return (
            <button
              key={i}
              onClick={() => onDayClick(d)}
              className="border-l border-border/20 px-1 py-2 text-center boty-transition hover:bg-muted/50"
            >
              <div className="text-[10px] text-muted-foreground">{DAY_NAMES_SHORT[i]}</div>
              <div className={`mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium ${
                isToday ? "bg-primary text-primary-foreground" : ""
              }`}>
                {d.getDate()}
              </div>
            </button>
          )
        })}
      </div>

      {/* All-day row */}
      <div className="grid grid-cols-[3.5rem_repeat(7,1fr)] border-b border-border/50 bg-muted/20">
        <div className="px-1 py-1 text-right text-[9px] text-muted-foreground">день</div>
        {days.map((d, i) => {
          const allDay = eventsForDay(d).filter((e) => !e.time)
          return (
            <div key={i} className="border-l border-border/20 px-0.5 py-1">
              {allDay.slice(0, 2).map((e) => (
                <div
                  key={e.id}
                  className="mb-0.5 truncate rounded px-1 py-0.5 text-[9px] text-white"
                  style={{ backgroundColor: e.color }}
                  title={e.title}
                >
                  {EVENT_ICONS[e.type]} {e.title}
                </div>
              ))}
              {allDay.length > 2 && (
                <div className="text-[9px] text-muted-foreground">+{allDay.length - 2}</div>
              )}
            </div>
          )
        })}
      </div>

      {/* Time grid */}
      <div className="flex-1 overflow-y-auto">
        {HOURS.map((h) => (
          <div key={h} className="grid grid-cols-[3.5rem_repeat(7,1fr)] border-b border-border/10">
            <div className="border-r border-border/20 px-1 py-1 text-right text-[10px] text-muted-foreground">
              {pad(h)}:00
            </div>
            {days.map((d, i) => {
              const hourEvents = eventsForDay(d).filter((e) => {
                if (!e.time) return false
                return parseInt(e.time.split(":")[0]) === h
              })
              return (
                <div
                  key={i}
                  className="min-h-[2.5rem] cursor-pointer border-l border-border/10 px-0.5 py-0.5 hover:bg-muted/30"
                  onDoubleClick={(e) => onCellDoubleClick(d, h, e)}
                >
                  {hourEvents.map((e) => (
                    <div
                      key={e.id}
                      className="mb-0.5 truncate rounded px-1 py-0.5 text-[9px] text-white"
                      style={{ backgroundColor: e.color }}
                      title={`${e.time} ${e.title}`}
                    >
                      {EVENT_ICONS[e.type]} {e.title}
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ================================================================ */
/*  MONTH VIEW                                                       */
/* ================================================================ */

function MonthView({
  year, month, events, selectedDate, onDayClick,
}: {
  year: number
  month: number
  events: ScheduleEvent[]
  selectedDate: Date
  onDayClick: (d: Date) => void
}) {
  const today = new Date()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startWeekday = (firstDay.getDay() + 6) % 7
  const totalDays = lastDay.getDate()

  const cells: (Date | null)[] = []
  for (let i = 0; i < startWeekday; i++) cells.push(null)
  for (let d = 1; d <= totalDays; d++) cells.push(new Date(year, month, d))
  while (cells.length % 7 !== 0) cells.push(null)

  const eventsForDay = (d: Date) => events.filter((e) => isSameDay(new Date(e.date), d))

  return (
    <div className="flex h-full flex-col">
      <div className="grid grid-cols-7 border-b border-border/50">
        {DAY_NAMES_SHORT.map((name) => (
          <div key={name} className="border-l border-border/20 px-2 py-1.5 text-center text-[10px] font-medium text-muted-foreground first:border-l-0">
            {name}
          </div>
        ))}
      </div>

      <div className="grid flex-1 grid-cols-7">
        {cells.map((date, i) => {
          if (!date) return <div key={`e-${i}`} className="border-b border-l border-border/10 bg-muted/20 first:border-l-0" />
          const dayEvents = eventsForDay(date)
          const isToday = isSameDay(date, today)
          const isSelected = isSameDay(date, selectedDate)
          return (
            <button
              key={fmtDate(date)}
              onClick={() => onDayClick(date)}
              className={`flex flex-col border-b border-l border-border/10 p-1 text-left boty-transition hover:bg-muted/50 first:border-l-0 ${
                isSelected ? "bg-primary/5" : ""
              }`}
            >
              <span className={`mb-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                isToday ? "bg-primary font-bold text-primary-foreground" : "text-foreground"
              }`}>
                {date.getDate()}
              </span>
              <div className="flex flex-col gap-0.5">
                {dayEvents.slice(0, 3).map((e) => (
                  <div
                    key={e.id}
                    className="truncate rounded px-1 py-0 text-[8px] leading-tight text-white"
                    style={{ backgroundColor: e.color }}
                  >
                    {EVENT_ICONS[e.type]} {e.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <span className="text-[8px] text-muted-foreground">+{dayEvents.length - 3}</span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ================================================================ */
/*  EVENT CHIP                                                       */
/* ================================================================ */

function EventChip({
  event, showTime, onDelete,
}: {
  event: ScheduleEvent
  showTime?: boolean
  onDelete?: () => void
}) {
  return (
    <div
      className="group/chip inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-white"
      style={{ backgroundColor: event.color }}
    >
      <span>{EVENT_ICONS[event.type]}</span>
      {showTime && event.time && <span className="font-medium">{event.time}</span>}
      <span className="truncate">{event.title}</span>
      {onDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          className="ml-1 hidden rounded p-0.5 hover:bg-white/20 group-hover/chip:inline-flex"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      )}
    </div>
  )
}
