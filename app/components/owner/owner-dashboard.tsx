"use client"

import {
  Users,
  CalendarDays,
  ClipboardList,
  Activity,
  Building2,
  TrendingUp,
  Stethoscope,
} from "lucide-react"

type CabinetInfo = {
  id: string
  name: string
  number: number
  status: string
}

type DoctorWorkload = {
  name: string | null
  count: number
}

type DashboardStats = {
  todayAppointments: number
  weekAppointments: number
  monthAppointments: number
  totalPatients: number
  newLeadsToday: number
  newLeadsWeek: number
  patientsInTreatment: number
  cabinets: CabinetInfo[]
  doctorWorkload: DoctorWorkload[]
}

const CABINET_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  FREE: { label: "Свободен", color: "bg-green-100 text-green-700" },
  IN_SESSION: { label: "Приём", color: "bg-blue-100 text-blue-700" },
  BREAK: { label: "Перерыв", color: "bg-yellow-100 text-yellow-700" },
  STERILIZATION: { label: "Стерилизация", color: "bg-purple-100 text-purple-700" },
}

function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
  color = "blue",
}: {
  icon: React.ElementType
  label: string
  value: number | string
  subtext?: string
  color?: string
}) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    amber: "bg-amber-50 text-amber-600",
    purple: "bg-purple-50 text-purple-600",
    red: "bg-red-50 text-red-600",
    cyan: "bg-cyan-50 text-cyan-600",
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colorMap[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtext && <p className="text-xs text-gray-400">{subtext}</p>}
        </div>
      </div>
    </div>
  )
}

export function OwnerDashboard({ stats }: { stats: DashboardStats }) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Панель управления</h1>
        <p className="text-sm text-gray-500">
          {new Date().toLocaleDateString("ru-RU", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      {/* Основные показатели */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={CalendarDays}
          label="Приёмов сегодня"
          value={stats.todayAppointments}
          subtext={`За неделю: ${stats.weekAppointments}`}
          color="blue"
        />
        <StatCard
          icon={ClipboardList}
          label="Новых заявок"
          value={stats.newLeadsToday}
          subtext={`За неделю: ${stats.newLeadsWeek}`}
          color="amber"
        />
        <StatCard
          icon={Users}
          label="Всего пациентов"
          value={stats.totalPatients}
          subtext={`На лечении: ${stats.patientsInTreatment}`}
          color="green"
        />
        <StatCard
          icon={TrendingUp}
          label="Приёмов за месяц"
          value={stats.monthAppointments}
          color="purple"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Статус кабинетов */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Building2 className="h-5 w-5 text-blue-600" />
            Кабинеты
          </h2>
          <div className="space-y-3">
            {stats.cabinets.length === 0 && (
              <p className="text-sm text-gray-400">Кабинеты не настроены</p>
            )}
            {stats.cabinets.map((cab) => {
              const st = CABINET_STATUS_LABELS[cab.status] || {
                label: cab.status,
                color: "bg-gray-100 text-gray-600",
              }
              return (
                <div
                  key={cab.id}
                  className="flex items-center justify-between rounded-xl bg-gray-50 p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-sm font-bold text-blue-700">
                      {cab.number}
                    </div>
                    <span className="font-medium text-gray-900">{cab.name}</span>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${st.color}`}>
                    {st.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Загруженность врачей */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Stethoscope className="h-5 w-5 text-blue-600" />
            Загруженность врачей (неделя)
          </h2>
          <div className="space-y-3">
            {stats.doctorWorkload.length === 0 && (
              <p className="text-sm text-gray-400">Врачи не добавлены</p>
            )}
            {stats.doctorWorkload.map((doc, i) => {
              const maxCount = Math.max(...stats.doctorWorkload.map((d) => d.count), 1)
              const pct = (doc.count / maxCount) * 100
              return (
                <div key={i}>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-900">{doc.name || "Без имени"}</span>
                    <span className="text-gray-500">{doc.count} приёмов</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Воронка конверсий */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
          <Activity className="h-5 w-5 text-blue-600" />
          Быстрые действия
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <a
            href="/leads"
            className="rounded-xl bg-amber-50 p-4 text-center transition hover:bg-amber-100"
          >
            <p className="text-2xl font-bold text-amber-700">{stats.newLeadsToday}</p>
            <p className="text-sm text-amber-600">Необработанных заявок</p>
          </a>
          <a
            href="/admin/patients"
            className="rounded-xl bg-blue-50 p-4 text-center transition hover:bg-blue-100"
          >
            <p className="text-2xl font-bold text-blue-700">{stats.totalPatients}</p>
            <p className="text-sm text-blue-600">Пациентов в базе</p>
          </a>
          <a
            href="/schedule"
            className="rounded-xl bg-green-50 p-4 text-center transition hover:bg-green-100"
          >
            <p className="text-2xl font-bold text-green-700">{stats.todayAppointments}</p>
            <p className="text-sm text-green-600">Приёмов сегодня</p>
          </a>
          <a
            href="/admin/warehouse"
            className="rounded-xl bg-purple-50 p-4 text-center transition hover:bg-purple-100"
          >
            <p className="text-2xl font-bold text-purple-700">0</p>
            <p className="text-sm text-purple-600">Алертов по складу</p>
          </a>
        </div>
      </div>
    </div>
  )
}
