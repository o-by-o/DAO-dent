"use client"

import { useState } from "react"
import { X, Calendar, Clock, User, Stethoscope } from "lucide-react"

type Doctor = { id: string; name: string | null; specialization: string | null }
type Service = { id: string; name: string; durationMin: number; price: { toString(): string } }

type Props = {
  patientId: string
  patientName: string
  doctors: Doctor[]
  services: Service[]
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => {
  const h = Math.floor(i / 2) + 9
  const m = i % 2 === 0 ? "00" : "30"
  return `${String(h).padStart(2, "0")}:${m}`
}).filter((t) => t < "21:00")

export function AppointmentModal({
  patientId,
  patientName,
  doctors,
  services,
  open,
  onClose,
  onSuccess,
}: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  if (!open) return null

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const fd = new FormData(e.currentTarget)
    const doctorId = fd.get("doctorId") as string
    const serviceId = fd.get("serviceId") as string
    const date = fd.get("date") as string
    const startTime = fd.get("startTime") as string
    const type = fd.get("type") as string

    const service = services.find((s) => s.id === serviceId)
    const duration = service?.durationMin || 30
    const [h, m] = startTime.split(":").map(Number)
    const endMinutes = h * 60 + m + duration
    const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`

    try {
      const res = await fetch("/api/admin/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId,
          doctorId,
          serviceId: serviceId || null,
          date,
          startTime,
          endTime,
          duration,
          type,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Ошибка")
      }

      onClose()
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Записать на приём</h2>
            <p className="text-sm text-gray-500">{patientName}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 flex items-center gap-1 text-sm font-medium text-gray-700">
                <User className="h-3.5 w-3.5" /> Врач *
              </label>
              <select name="doctorId" required className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-blue-500">
                <option value="">Выберите врача</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.specialization})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 flex items-center gap-1 text-sm font-medium text-gray-700">
                <Stethoscope className="h-3.5 w-3.5" /> Услуга
              </label>
              <select name="serviceId" className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-blue-500">
                <option value="">Не выбрана</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.durationMin} мин)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 flex items-center gap-1 text-sm font-medium text-gray-700">
                <Calendar className="h-3.5 w-3.5" /> Дата *
              </label>
              <input
                name="date"
                type="date"
                required
                min={new Date().toISOString().split("T")[0]}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 flex items-center gap-1 text-sm font-medium text-gray-700">
                <Clock className="h-3.5 w-3.5" /> Время *
              </label>
              <select name="startTime" required className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-blue-500">
                <option value="">Выберите время</option>
                {TIME_SLOTS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 text-sm font-medium text-gray-700">Тип приёма</label>
            <select name="type" className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-blue-500">
              <option value="INITIAL_CONSULTATION">Первичная консультация</option>
              <option value="TREATMENT">Лечебный приём</option>
              <option value="FOLLOW_UP">Контрольный визит</option>
              <option value="EMERGENCY">Экстренный приём</option>
              <option value="PREVENTION">Профилактика / гигиена</option>
            </select>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Запись..." : "Записать на приём"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 px-6 py-3 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
