"use client"

import { useState } from "react"
import Link from "next/link"
import { Search, Plus, Phone, Mail, Calendar } from "lucide-react"

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

type PatientRow = {
  id: string
  firstName: string
  lastName: string
  middleName: string | null
  phone: string
  email: string | null
  status: string
  source: string
  createdAt: Date | string
  doctor: { name: string | null } | null
  _count: { appointments: number }
}

export function PatientsListPage({ patients }: { patients: PatientRow[] }) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")

  const filtered = patients.filter((p) => {
    const matchSearch =
      !search ||
      `${p.firstName} ${p.lastName} ${p.phone}`.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !statusFilter || p.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Пациенты</h1>
          <p className="text-sm text-gray-500">{patients.length} пациентов в базе</p>
        </div>
        <Link
          href="/admin/patients/new"
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Добавить пациента
        </Link>
      </div>

      {/* Фильтры */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Поиск по ФИО или телефону..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500"
        >
          <option value="">Все статусы</option>
          {Object.entries(STATUS_LABELS).map(([key, { label }]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* Таблица */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr>
              <th className="px-6 py-3 font-medium text-gray-500">Пациент</th>
              <th className="px-6 py-3 font-medium text-gray-500">Контакты</th>
              <th className="px-6 py-3 font-medium text-gray-500">Статус</th>
              <th className="px-6 py-3 font-medium text-gray-500">Врач</th>
              <th className="px-6 py-3 font-medium text-gray-500">Приёмы</th>
              <th className="px-6 py-3 font-medium text-gray-500">Дата</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((patient) => {
              const status = STATUS_LABELS[patient.status] || { label: patient.status, color: "bg-gray-100 text-gray-600" }
              return (
                <tr key={patient.id} className="transition hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <Link href={`/admin/patients/${patient.id}`} className="font-medium text-gray-900 hover:text-blue-600">
                      {patient.lastName} {patient.firstName} {patient.middleName || ""}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="flex items-center gap-1 text-gray-600">
                        <Phone className="h-3 w-3" /> {patient.phone}
                      </span>
                      {patient.email && (
                        <span className="flex items-center gap-1 text-gray-400">
                          <Mail className="h-3 w-3" /> {patient.email}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${status.color}`}>
                      {status.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {patient.doctor?.name || "—"}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {patient._count.appointments}
                  </td>
                  <td className="px-6 py-4 text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(patient.createdAt).toLocaleDateString("ru-RU")}
                    </span>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                  Пациенты не найдены
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
