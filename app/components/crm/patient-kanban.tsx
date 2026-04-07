"use client"

import Link from "next/link"
import { Phone, User, ArrowRight } from "lucide-react"

const COLUMNS = [
  { status: "NEW_LEAD", label: "Новые лиды", color: "border-blue-400", bg: "bg-blue-50" },
  { status: "CONTACTED", label: "Контакт", color: "border-yellow-400", bg: "bg-yellow-50" },
  { status: "APPOINTMENT_SCHEDULED", label: "Записаны", color: "border-purple-400", bg: "bg-purple-50" },
  { status: "VISITED", label: "Были на приёме", color: "border-cyan-400", bg: "bg-cyan-50" },
  { status: "TREATMENT_PLAN", label: "План лечения", color: "border-orange-400", bg: "bg-orange-50" },
  { status: "IN_TREATMENT", label: "На лечении", color: "border-green-400", bg: "bg-green-50" },
  { status: "TREATMENT_COMPLETED", label: "Завершили", color: "border-emerald-400", bg: "bg-emerald-50" },
]

type PatientRow = {
  id: string
  firstName: string
  lastName: string
  phone: string
  status: string
  doctor: { name: string | null } | null
  updatedAt: Date | string
}

async function movePatient(patientId: string, newStatus: string) {
  await fetch(`/api/admin/patients/${patientId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: newStatus }),
  })
}

export function PatientKanban({ patients }: { patients: PatientRow[] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Воронка пациентов</h1>
          <p className="text-sm text-gray-500">{patients.length} пациентов</p>
        </div>
        <Link
          href="/admin/patients"
          className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-200"
        >
          Таблица
        </Link>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4">
        {COLUMNS.map((col) => {
          const items = patients.filter((p) => p.status === col.status)
          return (
            <div key={col.status} className="w-[260px] shrink-0">
              {/* Заголовок колонки */}
              <div className={`mb-3 rounded-xl border-l-4 ${col.color} ${col.bg} px-4 py-2.5`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-900">{col.label}</span>
                  <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-bold text-gray-600">
                    {items.length}
                  </span>
                </div>
              </div>

              {/* Карточки */}
              <div className="space-y-2">
                {items.map((patient) => (
                  <div
                    key={patient.id}
                    className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm transition hover:shadow-md"
                  >
                    <Link
                      href={`/admin/patients/${patient.id}`}
                      className="text-sm font-medium text-gray-900 hover:text-blue-600"
                    >
                      {patient.lastName} {patient.firstName}
                    </Link>
                    <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
                      <Phone className="h-3 w-3" />
                      {patient.phone}
                    </div>
                    {patient.doctor && (
                      <div className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                        <User className="h-3 w-3" />
                        {patient.doctor.name}
                      </div>
                    )}

                    {/* Быстрое перемещение на след. этап */}
                    {col.status !== "TREATMENT_COMPLETED" && (
                      <button
                        type="button"
                        onClick={async () => {
                          const nextIdx = COLUMNS.findIndex((c) => c.status === col.status) + 1
                          if (nextIdx < COLUMNS.length) {
                            await movePatient(patient.id, COLUMNS[nextIdx].status)
                            window.location.reload()
                          }
                        }}
                        className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg bg-gray-50 py-1.5 text-[10px] font-medium text-gray-500 transition hover:bg-blue-50 hover:text-blue-600"
                      >
                        Далее <ArrowRight className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}

                {items.length === 0 && (
                  <div className="rounded-xl border border-dashed border-gray-200 py-8 text-center text-xs text-gray-400">
                    Пусто
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
