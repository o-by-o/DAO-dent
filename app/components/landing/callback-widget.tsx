"use client"

import { useState } from "react"
import { Phone, X, CheckCircle, Clock } from "lucide-react"

export function CallbackWidget() {
  const [open, setOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(30)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)

    await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fd.get("name"),
        phone: fd.get("phone"),
        channel: "CALLBACK",
        message: "Обратный звонок",
      }),
    })

    setLoading(false)
    setSubmitted(true)

    // Обратный отсчёт
    let c = 30
    const timer = setInterval(() => {
      c--
      setCountdown(c)
      if (c <= 0) clearInterval(timer)
    }, 1000)
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 left-6 z-40 flex items-center gap-2 rounded-full bg-green-500 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-green-500/25 transition hover:bg-green-600 hover:scale-105"
      >
        <Phone className="h-4 w-4 animate-pulse" />
        <span className="hidden sm:inline">Перезвоним за 30 сек</span>
      </button>
    )
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm sm:hidden" onClick={() => setOpen(false)} />
      <div className="fixed bottom-6 left-6 z-50 w-[calc(100vw-3rem)] max-w-sm rounded-2xl bg-white p-6 shadow-2xl sm:w-auto">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
              <Phone className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Обратный звонок</p>
              <p className="text-xs text-gray-500">Перезвоним за 30 секунд</p>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        {submitted ? (
          <div className="text-center py-4">
            <CheckCircle className="mx-auto mb-3 h-12 w-12 text-green-500" />
            <p className="font-semibold text-gray-900">Заявка принята!</p>
            <div className="mt-3 flex items-center justify-center gap-2 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              <span>Перезвоним через {countdown > 0 ? `${countdown} сек` : "мгновение"}</span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              name="name"
              required
              placeholder="Ваше имя"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
            />
            <input
              name="phone"
              type="tel"
              required
              placeholder="+7 (___) ___-__-__"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-green-500 py-2.5 text-sm font-semibold text-white transition hover:bg-green-600 disabled:opacity-50"
            >
              {loading ? "Отправка..." : "Перезвоните мне"}
            </button>
            <p className="text-center text-[10px] text-gray-400">
              Бесплатно. Пн–Пт 9–21, Сб 10–18
            </p>
          </form>
        )}
      </div>
    </>
  )
}
