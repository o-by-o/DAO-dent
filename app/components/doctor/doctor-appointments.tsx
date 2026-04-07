"use client"

import Link from "next/link"
import { Clock, User, MapPin, AlertTriangle, Stethoscope } from "lucide-react"

const TYPE_LABELS: Record<string, string> = {
  INITIAL_CONSULTATION: "Первичная консультация",
  TREATMENT: "Лечебный приём",
  FOLLOW_UP: "Контрольный визит",
  EMERGENCY: "Экстренный",
  PREVENTION: "Профилактика",
}

const STATUS_BADGES: Record<string, { label: string; color: string }> = {
  SCHEDULED: { label: "Запланирован", color: "bg-blue-100 text-blue-700" },
  CONFIRMED: { label: "Подтверждён", color: "bg-green-100 text-green-700" },
  IN_PROGRESS: { label: "Идёт приём", color: "bg-amber-100 text-amber-700" },
  COMPLETED: { label: "Завершён", color: "bg-gray-100 text-gray-600" },
  CANCELLED: { label: "Отменён", color: "bg-red-100 text-red-600" },
  NO_SHOW: { label: "Не явился", color: "bg-red-50 text-red-500" },
}

type AppointmentRow = {
  id: string
  date: Date | string
  startTime: string
  endTime: string
  type: string
  status: string
  notes: string | null
  patient: {
    id: string
    firstName: string
    lastName: string
    phone: string
    allergies: string | null
  }
  service: { name: string; price: { toString(): string } } | null
  cabinet: { name: string; number: number } | null
}

export function DoctorAppointmentsPage({
  appointments,
}: {
  appointments: AppointmentRow[]
}) {
  const today = new Date().toISOString().split("T")[0]

  const todayAppts = appointments.filter(
    (a) => new Date(a.date).toISOString().split("T")[0] === today,
  )
  const futureAppts = appointments.filter(
    (a) => new Date(a.date).toISOString().split("T")[0]! > today!,
  )

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Мои приёмы</h1>
        <p className="text-sm text-gray-500">
          Сегодня: {todayAppts.length} приёмов, Предстоящие: {futureAppts.length}
        </p>
      </div>

      {/* Сегодня */}
      <section>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
          <Stethoscope className="h-5 w-5 text-blue-600" />
          Сегодня, {new Date().toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}
        </h2>
        <div className="space-y-3">
          {todayAppts.length === 0 && (
            <p className="rounded-xl bg-gray-50 p-6 text-center text-sm text-gray-400">
              На сегодня приёмов нет
            </p>
          )}
          {todayAppts.map((appt) => (
            <AppointmentCard key={appt.id} appointment={appt} />
          ))}
        </div>
      </section>

      {/* Предстоящие */}
      {futureAppts.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Предстоящие</h2>
          <div className="space-y-3">
            {futureAppts.map((appt) => (
              <AppointmentCard key={appt.id} appointment={appt} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function AppointmentCard({ appointment }: { appointment: AppointmentRow }) {
  const status = STATUS_BADGES[appointment.status] || {
    label: appointment.status,
    color: "bg-gray-100 text-gray-600",
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-lg font-bold text-blue-600">
              <Clock className="h-4 w-4" />
              {appointment.startTime}–{appointment.endTime}
            </span>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${status.color}`}>
              {status.label}
            </span>
            <span className="text-xs text-gray-400">
              {TYPE_LABELS[appointment.type] || appointment.type}
            </span>
          </div>

          <div className="mt-2 flex items-center gap-2">
            <User className="h-4 w-4 text-gray-400" />
            <Link
              href={`/admin/patients/${appointment.patient.id}`}
              className="font-medium text-gray-900 hover:text-blue-600"
            >
              {appointment.patient.lastName} {appointment.patient.firstName}
            </Link>
            <span className="text-sm text-gray-400">{appointment.patient.phone}</span>
          </div>

          {appointment.patient.allergies && (
            <div className="mt-2 flex items-center gap-1 text-xs text-red-600">
              <AlertTriangle className="h-3 w-3" />
              Аллергии: {appointment.patient.allergies}
            </div>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-500">
            {appointment.service && (
              <span>{appointment.service.name}</span>
            )}
            {appointment.cabinet && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {appointment.cabinet.name}
              </span>
            )}
          </div>

          {appointment.notes && (
            <p className="mt-2 text-xs text-gray-400">{appointment.notes}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <button className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-100">
            Начать приём
          </button>
          <button className="rounded-lg bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-100">
            Карточка
          </button>
        </div>
      </div>
    </div>
  )
}
