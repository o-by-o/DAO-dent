"use client"

import { useState } from "react"
import { Phone, Calendar, Clock, CheckCircle } from "lucide-react"

const SERVICES = [
  "Консультация",
  "Лечение кариеса",
  "Профессиональная гигиена",
  "Имплантация",
  "Протезирование",
  "Удаление зуба",
  "Детская стоматология",
  "Ортодонтия",
  "Другое",
]

export function LandingAppointmentForm() {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const form = e.currentTarget
    const data = new FormData(form)

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          phone: data.get("phone"),
          service: data.get("service"),
          message: data.get("message"),
          channel: "WEBSITE_FORM",
        }),
      })

      if (res.ok) {
        setSubmitted(true)
      }
    } catch {
      // Ошибка — можно показать toast
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <section id="appointment" className="bg-blue-600 py-20 md:py-28">
        <div className="mx-auto max-w-2xl px-6 text-center lg:px-8">
          <CheckCircle className="mx-auto mb-6 h-16 w-16 text-white" />
          <h2 className="font-serif text-3xl font-semibold text-white md:text-4xl">
            Заявка отправлена!
          </h2>
          <p className="mt-4 text-lg text-blue-100">
            Мы перезвоним вам в течение 30 минут для подтверждения записи.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section id="appointment" className="bg-blue-600 py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          {/* Левая часть — текст */}
          <div>
            <span className="mb-4 inline-block rounded-full bg-white/20 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-white">
              Запись на приём
            </span>
            <h2 className="font-serif text-3xl font-semibold text-white md:text-4xl">
              Запишитесь на приём онлайн
            </h2>
            <p className="mt-4 text-lg text-blue-100">
              Оставьте заявку, и мы перезвоним вам в течение 30 минут для подтверждения
              удобного времени.
            </p>

            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-3 text-blue-100">
                <Phone className="h-5 w-5 shrink-0" />
                <a href="tel:+74950000000" className="text-lg font-medium text-white hover:underline">
                  +7 (495) 000-00-00
                </a>
              </div>
              <div className="flex items-center gap-3 text-blue-100">
                <Calendar className="h-5 w-5 shrink-0" />
                <span>Пн–Пт: 9:00–21:00, Сб: 10:00–18:00</span>
              </div>
              <div className="flex items-center gap-3 text-blue-100">
                <Clock className="h-5 w-5 shrink-0" />
                <span>Перезвоним за 30 минут</span>
              </div>
            </div>
          </div>

          {/* Правая часть — форма */}
          <div className="rounded-2xl bg-white p-8 shadow-xl">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Ваше имя *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  placeholder="Иван Иванов"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Телефон *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  required
                  placeholder="+7 (___) ___-__-__"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label htmlFor="service" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Услуга
                </label>
                <select
                  id="service"
                  name="service"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">Выберите услугу</option>
                  {SERVICES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="message" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Комментарий
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={3}
                  placeholder="Опишите вашу ситуацию или пожелания"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-medium text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Отправка..." : "Записаться на приём"}
              </button>
              <p className="text-center text-xs text-gray-400">
                Нажимая кнопку, вы соглашаетесь с обработкой персональных данных
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}
