"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Play,
  Square,
  Save,
  AlertTriangle,
  Clock,
  User,
  MapPin,
  Stethoscope,
} from "lucide-react"
import { DentalChart } from "@/components/dental/dental-chart"

type AppointmentFull = {
  id: string
  date: Date | string
  startTime: string
  endTime: string
  type: string
  status: string
  notes: string | null
  diagnosis: string | null
  treatment: string | null
  materials: string | null
  recommendations: string | null
  patient: {
    id: string
    firstName: string
    lastName: string
    middleName: string | null
    phone: string
    allergies: string | null
    chronicDiseases: string | null
    dentalChart: Array<{ toothNumber: number; status: string; notes: string | null }>
    treatmentPlans: Array<{
      id: string
      title: string
      steps: Array<{
        id: string
        description: string
        toothNumber: number | null
        completed: boolean
      }>
    }>
  }
  service: { id: string; name: string; price: { toString(): string } } | null
  cabinet: { name: string; number: number } | null
}

const TYPE_LABELS: Record<string, string> = {
  INITIAL_CONSULTATION: "Первичная консультация",
  TREATMENT: "Лечебный приём",
  FOLLOW_UP: "Контрольный визит",
  EMERGENCY: "Экстренный приём",
  PREVENTION: "Профилактика",
}

export function AppointmentSessionPage({ appointment }: { appointment: AppointmentFull }) {
  const router = useRouter()
  const [status, setStatus] = useState(appointment.status)
  const [diagnosis, setDiagnosis] = useState(appointment.diagnosis || "")
  const [treatmentText, setTreatmentText] = useState(appointment.treatment || "")
  const [materials, setMaterials] = useState(appointment.materials || "")
  const [recommendations, setRecommendations] = useState(appointment.recommendations || "")
  const [saving, setSaving] = useState(false)

  const isActive = status === "IN_PROGRESS"
  const isCompleted = status === "COMPLETED"
  const patient = appointment.patient

  async function startAppointment() {
    const res = await fetch(`/api/admin/appointments/${appointment.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "IN_PROGRESS" }),
    })
    if (res.ok) setStatus("IN_PROGRESS")
  }

  async function saveAndComplete() {
    setSaving(true)
    const res = await fetch(`/api/admin/appointments/${appointment.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "COMPLETED",
        diagnosis,
        treatment: treatmentText,
        materials,
        recommendations,
      }),
    })
    setSaving(false)
    if (res.ok) {
      setStatus("COMPLETED")
      router.refresh()
    }
  }

  async function saveProgress() {
    setSaving(true)
    await fetch(`/api/admin/appointments/${appointment.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ diagnosis, treatment: treatmentText, materials, recommendations }),
    })
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      {/* Шапка */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/doctor/appointments"
            className="mb-2 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600"
          >
            <ArrowLeft className="h-4 w-4" /> Мои приёмы
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            {patient.lastName} {patient.firstName} {patient.middleName || ""}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {appointment.startTime}–{appointment.endTime}
            </span>
            <span>{TYPE_LABELS[appointment.type] || appointment.type}</span>
            {appointment.service && <span className="text-blue-600">{appointment.service.name}</span>}
            {appointment.cabinet && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {appointment.cabinet.name}
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {status === "SCHEDULED" || status === "CONFIRMED" ? (
            <button
              onClick={startAppointment}
              className="flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-green-700"
            >
              <Play className="h-4 w-4" /> Начать приём
            </button>
          ) : isActive ? (
            <>
              <button
                onClick={saveProgress}
                disabled={saving}
                className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
              >
                <Save className="h-4 w-4" /> Сохранить
              </button>
              <button
                onClick={saveAndComplete}
                disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
              >
                <Square className="h-4 w-4" /> Завершить приём
              </button>
            </>
          ) : isCompleted ? (
            <span className="rounded-full bg-green-100 px-4 py-2 text-sm font-medium text-green-700">
              Приём завершён
            </span>
          ) : null}
        </div>
      </div>

      {/* Предупреждения */}
      {(patient.allergies || patient.chronicDiseases) && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-red-800">
            <AlertTriangle className="h-4 w-4" /> Внимание
          </div>
          <div className="mt-2 space-y-1 text-sm text-red-700">
            {patient.allergies && <p><strong>Аллергии:</strong> {patient.allergies}</p>}
            {patient.chronicDiseases && <p><strong>Хронические:</strong> {patient.chronicDiseases}</p>}
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Левая колонка — форма приёма */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
              <Stethoscope className="h-4 w-4 text-blue-600" /> Протокол приёма
            </h3>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Диагноз</label>
                <textarea
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  disabled={!isActive && !isCompleted}
                  rows={3}
                  placeholder="Например: К02.1 Кариес дентина, зуб 36"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Проведённое лечение</label>
                <textarea
                  value={treatmentText}
                  onChange={(e) => setTreatmentText(e.target.value)}
                  disabled={!isActive && !isCompleted}
                  rows={3}
                  placeholder="Например: Анестезия, препарирование кариозной полости, пломбирование..."
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Использованные материалы</label>
                <textarea
                  value={materials}
                  onChange={(e) => setMaterials(e.target.value)}
                  disabled={!isActive && !isCompleted}
                  rows={2}
                  placeholder="Например: Ультракаин 1.7мл, Filtek Ultimate A2"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Рекомендации пациенту</label>
                <textarea
                  value={recommendations}
                  onChange={(e) => setRecommendations(e.target.value)}
                  disabled={!isActive && !isCompleted}
                  rows={2}
                  placeholder="Например: Не принимать пищу 2 часа, контрольный визит через 7 дней"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          {/* Текущий план лечения */}
          {patient.treatmentPlans.length > 0 && (
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h3 className="mb-3 font-semibold text-gray-900">Активный план лечения</h3>
              {patient.treatmentPlans.map((plan) => (
                <div key={plan.id}>
                  <p className="text-sm font-medium text-blue-600">{plan.title}</p>
                  <div className="mt-2 space-y-1">
                    {plan.steps.map((step) => (
                      <div
                        key={step.id}
                        className={`flex items-center gap-2 text-sm ${
                          step.completed ? "text-gray-400 line-through" : "text-gray-700"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={step.completed}
                          readOnly
                          className="h-4 w-4 rounded border-gray-300 text-blue-600"
                        />
                        {step.toothNumber ? `[${step.toothNumber}] ` : ""}
                        {step.description}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Правая колонка — зубная формула */}
        <div>
          <DentalChart
            teeth={patient.dentalChart.map((t) => ({
              toothNumber: t.toothNumber,
              status: t.status as "HEALTHY",
              notes: t.notes,
            }))}
            editable={isActive}
          />
        </div>
      </div>
    </div>
  )
}
