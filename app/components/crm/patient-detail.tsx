"use client"

import Link from "next/link"
import {
  ArrowLeft,
  Phone,
  Mail,
  Calendar,
  MapPin,
  AlertTriangle,
  FileText,
  CreditCard,
  Stethoscope,
  ClipboardList,
} from "lucide-react"
import { DentalChart } from "@/components/dental/dental-chart"
import { AppointmentModal } from "@/components/crm/appointment-modal"
import { TreatmentPlanForm } from "@/components/doctor/treatment-plan-form"
import { useState } from "react"

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  NEW_LEAD: { label: "Новый", color: "bg-blue-100 text-blue-700" },
  CONTACTED: { label: "Контакт", color: "bg-yellow-100 text-yellow-700" },
  APPOINTMENT_SCHEDULED: { label: "Записан", color: "bg-purple-100 text-purple-700" },
  VISITED: { label: "Был на приёме", color: "bg-cyan-100 text-cyan-700" },
  TREATMENT_PLAN: { label: "План лечения", color: "bg-orange-100 text-orange-700" },
  IN_TREATMENT: { label: "На лечении", color: "bg-green-100 text-green-700" },
  TREATMENT_COMPLETED: { label: "Завершил", color: "bg-emerald-100 text-emerald-700" },
  LOST: { label: "Потерян", color: "bg-red-100 text-red-700" },
}

type PatientFull = {
  id: string
  firstName: string
  lastName: string
  middleName: string | null
  phone: string
  email: string | null
  birthDate: Date | string | null
  gender: string | null
  address: string | null
  status: string
  source: string
  allergies: string | null
  chronicDiseases: string | null
  contraindications: string | null
  consentSigned: boolean
  doctor: { id: string; name: string | null; specialization: string | null } | null
  appointments: Array<{
    id: string
    date: Date | string
    startTime: string
    type: string
    status: string
    doctor: { name: string | null }
    service: { name: string; price: { toString(): string } } | null
    cabinet: { name: string } | null
  }>
  treatmentPlans: Array<{
    id: string
    title: string
    status: string
    totalCost: { toString(): string }
    doctor: { name: string | null }
    steps: Array<{
      id: string
      description: string
      toothNumber: number | null
      completed: boolean
      cost: { toString(): string }
      service: { name: string } | null
    }>
  }>
  dentalChart: Array<{
    toothNumber: number
    status: string
    notes: string | null
  }>
  notes: Array<{
    id: string
    text: string
    createdAt: Date | string
  }>
  payments: Array<{
    id: string
    amount: { toString(): string }
    status: string
    method: string
    createdAt: Date | string
  }>
  documents: Array<{
    id: string
    name: string
    type: string
    fileUrl: string
  }>
  createdAt?: Date | string
}

type Doctor = { id: string; name: string | null; specialization: string | null }
type Service = { id: string; name: string; durationMin: number; price: { toString(): string } }

export function PatientDetailPage({
  patient,
  doctors = [],
  services = [],
}: {
  patient: PatientFull
  doctors?: Doctor[]
  services?: Service[]
}) {
  const [showAppointmentModal, setShowAppointmentModal] = useState(false)
  const [showTreatmentPlanForm, setShowTreatmentPlanForm] = useState(false)
  const status = STATUS_LABELS[patient.status] || { label: patient.status, color: "bg-gray-100 text-gray-600" }

  const totalPaid = patient.payments
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + Number(p.amount), 0)

  return (
    <div className="space-y-6">
      {/* Шапка */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/admin/patients"
            className="mb-2 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600"
          >
            <ArrowLeft className="h-4 w-4" /> Все пациенты
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            {patient.lastName} {patient.firstName} {patient.middleName || ""}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${status.color}`}>
              {status.label}
            </span>
            {patient.doctor && (
              <span className="flex items-center gap-1 text-sm text-gray-500">
                <Stethoscope className="h-3 w-3" />
                Врач: {patient.doctor.name}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {/* Печать документов */}
          <div className="relative group">
            <button className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50">
              Документы
            </button>
            <div className="absolute right-0 top-full z-20 mt-1 hidden w-56 rounded-xl border border-gray-100 bg-white p-1 shadow-lg group-hover:block">
              {[
                { type: "consent", label: "Согласие на лечение" },
                { type: "personal_data", label: "Согласие на обработку ПД" },
                { type: "extract", label: "Выписка из карты" },
                { type: "certificate", label: "Справка о лечении" },
              ].map((doc) => (
                <button
                  key={doc.type}
                  type="button"
                  onClick={async () => {
                    const res = await fetch(`/api/admin/patients/${patient.id}/documents`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ type: doc.type }),
                    })
                    const html = await res.text()
                    const win = window.open("", "_blank")
                    if (win) { win.document.write(html); win.document.close(); win.print() }
                  }}
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm text-gray-700 transition hover:bg-blue-50 hover:text-blue-700"
                >
                  {doc.label}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={() => setShowAppointmentModal(true)}
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            Записать на приём
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Левая колонка — инфо + медданные */}
        <div className="space-y-6 lg:col-span-1">
          {/* Контакты */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="mb-3 font-semibold text-gray-900">Контакты</h3>
            <div className="space-y-2 text-sm">
              <p className="flex items-center gap-2 text-gray-600">
                <Phone className="h-4 w-4 text-gray-400" />
                <a href={`tel:${patient.phone}`} className="hover:text-blue-600">{patient.phone}</a>
              </p>
              {patient.email && (
                <p className="flex items-center gap-2 text-gray-600">
                  <Mail className="h-4 w-4 text-gray-400" /> {patient.email}
                </p>
              )}
              {patient.birthDate && (
                <p className="flex items-center gap-2 text-gray-600">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  {new Date(patient.birthDate).toLocaleDateString("ru-RU")}
                  {patient.gender && ` (${patient.gender})`}
                </p>
              )}
              {patient.address && (
                <p className="flex items-center gap-2 text-gray-600">
                  <MapPin className="h-4 w-4 text-gray-400" /> {patient.address}
                </p>
              )}
            </div>
          </div>

          {/* Медданные */}
          {(patient.allergies || patient.chronicDiseases || patient.contraindications) && (
            <div className="rounded-2xl border border-red-100 bg-red-50 p-5">
              <h3 className="mb-3 flex items-center gap-2 font-semibold text-red-900">
                <AlertTriangle className="h-4 w-4" /> Медицинские данные
              </h3>
              <div className="space-y-2 text-sm text-red-800">
                {patient.allergies && <p><strong>Аллергии:</strong> {patient.allergies}</p>}
                {patient.chronicDiseases && <p><strong>Хронические:</strong> {patient.chronicDiseases}</p>}
                {patient.contraindications && <p><strong>Противопоказания:</strong> {patient.contraindications}</p>}
              </div>
            </div>
          )}

          {/* Финансы */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
              <CreditCard className="h-4 w-4 text-gray-400" /> Финансы
            </h3>
            <p className="text-2xl font-bold text-gray-900">
              {totalPaid.toLocaleString("ru-RU")} &#8381;
            </p>
            <p className="text-xs text-gray-400">Оплачено за всё время (LTV)</p>
            <div className="mt-3 space-y-1">
              {patient.payments.slice(0, 5).map((p) => (
                <div key={p.id} className="flex justify-between text-xs">
                  <span className="text-gray-500">
                    {new Date(p.createdAt).toLocaleDateString("ru-RU")}
                  </span>
                  <span className="font-medium text-gray-700">
                    {Number(p.amount).toLocaleString("ru-RU")} &#8381;
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Заметки */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
              <FileText className="h-4 w-4 text-gray-400" /> Заметки
            </h3>
            {/* Форма новой заметки */}
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                const fd = new FormData(e.currentTarget)
                const text = fd.get("noteText") as string
                if (!text?.trim()) return
                await fetch(`/api/admin/patients/${patient.id}/notes`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ text }),
                })
                e.currentTarget.reset()
                window.location.reload()
              }}
              className="mb-4 flex gap-2"
            >
              <input
                name="noteText"
                placeholder="Добавить заметку..."
                className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-blue-700"
              >
                Добавить
              </button>
            </form>
            {patient.notes.length === 0 ? (
              <p className="text-sm text-gray-400">Заметок пока нет</p>
            ) : (
              <div className="space-y-3">
                {patient.notes.map((note) => (
                  <div key={note.id} className="border-l-2 border-blue-200 pl-3">
                    <p className="text-sm text-gray-700">{note.text}</p>
                    <p className="mt-1 text-xs text-gray-400">
                      {new Date(note.createdAt).toLocaleDateString("ru-RU")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Правая колонка — зубная формула, приёмы, планы */}
        <div className="space-y-6 lg:col-span-2">
          {/* Зубная формула */}
          <DentalChart
            teeth={patient.dentalChart.map((t) => ({
              toothNumber: t.toothNumber,
              status: t.status as "HEALTHY",
              notes: t.notes,
            }))}
            editable
            patientId={patient.id}
            onStatusChange={() => window.location.reload()}
          />

          {/* Планы лечения */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-semibold text-gray-900">
                <ClipboardList className="h-4 w-4 text-blue-600" /> Планы лечения
              </h3>
              <button
                onClick={() => setShowTreatmentPlanForm(true)}
                className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-100"
              >
                + Создать план
              </button>
            </div>
            {patient.treatmentPlans.length === 0 ? (
              <p className="text-sm text-gray-400">Планов лечения нет</p>
            ) : (
              <div className="space-y-4">
                {patient.treatmentPlans.map((plan) => (
                  <div key={plan.id} className="rounded-xl bg-gray-50 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{plan.title}</h4>
                        <p className="text-xs text-gray-500">Врач: {plan.doctor.name}</p>
                      </div>
                      <span className="text-lg font-bold text-blue-600">
                        {Number(plan.totalCost).toLocaleString("ru-RU")} &#8381;
                      </span>
                    </div>
                    <div className="mt-3 space-y-1">
                      {plan.steps.map((step) => (
                        <div
                          key={step.id}
                          className={`flex items-center justify-between text-sm ${
                            step.completed ? "text-gray-400 line-through" : "text-gray-700"
                          }`}
                        >
                          <span>
                            {step.toothNumber ? `[${step.toothNumber}] ` : ""}
                            {step.description}
                          </span>
                          <span>{Number(step.cost).toLocaleString("ru-RU")} &#8381;</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* История приёмов */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
              <Calendar className="h-4 w-4 text-blue-600" /> История приёмов
            </h3>
            {patient.appointments.length === 0 ? (
              <p className="text-sm text-gray-400">Приёмов не было</p>
            ) : (
              <div className="space-y-2">
                {patient.appointments.map((appt) => (
                  <div
                    key={appt.id}
                    className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3"
                  >
                    <div>
                      <span className="text-sm font-medium text-gray-900">
                        {new Date(appt.date).toLocaleDateString("ru-RU")} {appt.startTime}
                      </span>
                      <span className="ml-2 text-sm text-gray-500">
                        {appt.service?.name || appt.type}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {appt.doctor.name}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Форма плана лечения */}
      <TreatmentPlanForm
        patientId={patient.id}
        patientName={`${patient.lastName} ${patient.firstName}`}
        services={services}
        open={showTreatmentPlanForm}
        onClose={() => setShowTreatmentPlanForm(false)}
        onSuccess={() => window.location.reload()}
      />

      {/* Модалка записи на приём */}
      <AppointmentModal
        patientId={patient.id}
        patientName={`${patient.lastName} ${patient.firstName}`}
        doctors={doctors}
        services={services}
        open={showAppointmentModal}
        onClose={() => setShowAppointmentModal(false)}
        onSuccess={() => window.location.reload()}
      />
    </div>
  )
}
