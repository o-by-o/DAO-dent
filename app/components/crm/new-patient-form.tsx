"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, CheckCircle } from "lucide-react"
import Link from "next/link"

const SOURCES = [
  { value: "WEBSITE", label: "Сайт" },
  { value: "PHONE", label: "Звонок" },
  { value: "WALK_IN", label: "Пришёл сам" },
  { value: "REFERRAL", label: "По рекомендации" },
  { value: "SOCIAL_MEDIA", label: "Соцсети" },
  { value: "YANDEX_DIRECT", label: "Яндекс.Директ" },
  { value: "YANDEX_MAPS", label: "Яндекс.Карты" },
  { value: "TWO_GIS", label: "2ГИС" },
  { value: "MESSENGER", label: "Мессенджер" },
  { value: "OTHER", label: "Другое" },
]

type Doctor = { id: string; name: string | null; specialization: string | null }

export function NewPatientForm({ doctors }: { doctors: Doctor[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const fd = new FormData(e.currentTarget)
    const data = {
      firstName: fd.get("firstName"),
      lastName: fd.get("lastName"),
      middleName: fd.get("middleName") || null,
      phone: fd.get("phone"),
      email: fd.get("email") || null,
      birthDate: fd.get("birthDate") || null,
      gender: fd.get("gender") || null,
      address: fd.get("address") || null,
      source: fd.get("source") || "OTHER",
      doctorId: fd.get("doctorId") || null,
      allergies: fd.get("allergies") || null,
      chronicDiseases: fd.get("chronicDiseases") || null,
    }

    try {
      const res = await fetch("/api/admin/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Ошибка создания")
      }

      const patient = await res.json()
      setSuccess(true)
      setTimeout(() => router.push(`/admin/patients/${patient.id}`), 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <CheckCircle className="mb-4 h-16 w-16 text-green-500" />
        <h2 className="text-xl font-bold text-gray-900">Пациент создан</h2>
        <p className="mt-2 text-sm text-gray-500">Перенаправление в карточку...</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href="/admin/patients"
          className="mb-2 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600"
        >
          <ArrowLeft className="h-4 w-4" /> Все пациенты
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Новый пациент</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ФИО */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-semibold text-gray-900">Основные данные</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Фамилия *</label>
              <input name="lastName" required className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Имя *</label>
              <input name="firstName" required className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Отчество</label>
              <input name="middleName" className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Пол</label>
              <select name="gender" className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-blue-500">
                <option value="">Не указан</option>
                <option value="М">Мужской</option>
                <option value="Ж">Женский</option>
              </select>
            </div>
          </div>
        </div>

        {/* Контакты */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-semibold text-gray-900">Контакты</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Телефон *</label>
              <input name="phone" type="tel" required placeholder="+7 (___) ___-__-__" className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
              <input name="email" type="email" className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Дата рождения</label>
              <input name="birthDate" type="date" className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Адрес</label>
              <input name="address" className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
            </div>
          </div>
        </div>

        {/* Врач и источник */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-semibold text-gray-900">Привязка</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Лечащий врач</label>
              <select name="doctorId" className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-blue-500">
                <option value="">Не назначен</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.specialization})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Источник</label>
              <select name="source" className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-blue-500">
                {SOURCES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Мед. данные */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-semibold text-gray-900">Медицинские данные</h3>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Аллергии</label>
              <textarea name="allergies" rows={2} placeholder="Например: лидокаин, латекс" className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Хронические заболевания</label>
              <textarea name="chronicDiseases" rows={2} placeholder="Например: сахарный диабет, гипертония" className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Сохранение..." : "Создать пациента"}
          </button>
          <Link
            href="/admin/patients"
            className="rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
          >
            Отмена
          </Link>
        </div>
      </form>
    </div>
  )
}
