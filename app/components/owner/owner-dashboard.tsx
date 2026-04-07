"use client"

import {
  Users,
  CalendarDays,
  ClipboardList,
  Activity,
  Building2,
  TrendingUp,
  Stethoscope,
  DollarSign,
  Clock,
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

type DashboardStats = {
  todayAppointments: number
  weekAppointments: number
  monthAppointments: number
  totalPatients: number
  newLeadsToday: number
  newLeadsWeek: number
  patientsInTreatment: number
  cabinets: Array<{ id: string; name: string; number: number; status: string }>
  doctorWorkload: Array<{ name: string | null; count: number }>
  funnel: { leads: number; scheduled: number; visited: number; inTreatment: number; completed: number }
  monthRevenue: number
  totalRevenue: number
  pendingPayments: number
}

const CABINET_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  FREE: { label: "Свободен", color: "bg-green-100 text-green-700" },
  IN_SESSION: { label: "Приём", color: "bg-blue-100 text-blue-700" },
  BREAK: { label: "Перерыв", color: "bg-yellow-100 text-yellow-700" },
  STERILIZATION: { label: "Стерилизация", color: "bg-purple-100 text-purple-700" },
}

function fmt(n: number) {
  return n.toLocaleString("ru-RU", { maximumFractionDigits: 0 })
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
  const colors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    amber: "bg-amber-50 text-amber-600",
    purple: "bg-purple-50 text-purple-600",
  }
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors[color]}`}>
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
  const funnelData = [
    { name: "Лиды", value: stats.funnel.leads, fill: "#3b82f6" },
    { name: "Записаны", value: stats.funnel.scheduled, fill: "#8b5cf6" },
    { name: "Визит", value: stats.funnel.visited, fill: "#06b6d4" },
    { name: "Лечение", value: stats.funnel.inTreatment, fill: "#22c55e" },
    { name: "Завершили", value: stats.funnel.completed, fill: "#10b981" },
  ]

  const doctorData = stats.doctorWorkload.map((d) => ({
    name: d.name?.split(" ").slice(0, 2).join(" ") || "—",
    appointments: d.count,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Панель управления</h1>
        <p className="text-sm text-gray-500">
          {new Date().toLocaleDateString("ru-RU", {
            weekday: "long", day: "numeric", month: "long", year: "numeric",
          })}
        </p>
      </div>

      {/* KPI */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={CalendarDays} label="Приёмов сегодня" value={stats.todayAppointments} subtext={`За неделю: ${stats.weekAppointments}`} color="blue" />
        <StatCard icon={ClipboardList} label="Новых заявок" value={stats.newLeadsToday} subtext={`За неделю: ${stats.newLeadsWeek}`} color="amber" />
        <StatCard icon={Users} label="Всего пациентов" value={stats.totalPatients} subtext={`На лечении: ${stats.patientsInTreatment}`} color="green" />
        <StatCard icon={DollarSign} label="Выручка за месяц" value={`${fmt(stats.monthRevenue)} ₽`} subtext={`Всего: ${fmt(stats.totalRevenue)} ₽`} color="purple" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Воронка конверсий */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Activity className="h-5 w-5 text-blue-600" />
            Воронка пациентов
          </h2>
          <div className="space-y-3">
            {funnelData.map((step, i) => {
              const maxVal = Math.max(...funnelData.map((d) => d.value), 1)
              const pct = (step.value / maxVal) * 100
              return (
                <div key={step.name}>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">{step.name}</span>
                    <span className="font-semibold text-gray-900">{step.value}</span>
                  </div>
                  <div className="mt-1 h-3 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: step.fill }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Загрузка врачей — Recharts */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Stethoscope className="h-5 w-5 text-blue-600" />
            Загруженность врачей (неделя)
          </h2>
          {doctorData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={doctorData} layout="vertical" margin={{ left: 0, right: 20 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value: number) => [`${value} приёмов`, "Приёмы"]}
                  contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}
                />
                <Bar dataKey="appointments" fill="#3b82f6" radius={[0, 8, 8, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-400">Врачи не добавлены</p>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Кабинеты */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Building2 className="h-5 w-5 text-blue-600" />
            Кабинеты
          </h2>
          <div className="space-y-3">
            {stats.cabinets.length === 0 && <p className="text-sm text-gray-400">Кабинеты не настроены</p>}
            {stats.cabinets.map((cab) => {
              const st = CABINET_STATUS_LABELS[cab.status] || { label: cab.status, color: "bg-gray-100 text-gray-600" }
              return (
                <div key={cab.id} className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-sm font-bold text-blue-700">
                      {cab.number}
                    </div>
                    <span className="font-medium text-gray-900">{cab.name}</span>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${st.color}`}>{st.label}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Финансы */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Финансы
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-green-50 p-4">
              <span className="text-sm text-green-700">Выручка за месяц</span>
              <span className="text-lg font-bold text-green-700">{fmt(stats.monthRevenue)} &#8381;</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-blue-50 p-4">
              <span className="text-sm text-blue-700">Выручка за всё время</span>
              <span className="text-lg font-bold text-blue-700">{fmt(stats.totalRevenue)} &#8381;</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-amber-50 p-4">
              <span className="text-sm text-amber-700">Ожидает оплаты</span>
              <span className="text-lg font-bold text-amber-700">{fmt(stats.pendingPayments)} &#8381;</span>
            </div>
            <a
              href="/owner/payments"
              className="block rounded-xl bg-gray-50 py-3 text-center text-sm font-medium text-blue-600 transition hover:bg-blue-50"
            >
              Все оплаты &rarr;
            </a>
          </div>
        </div>
      </div>

      {/* Быстрые действия */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Быстрые действия</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <a href="/leads" className="rounded-xl bg-amber-50 p-4 text-center transition hover:bg-amber-100">
            <p className="text-2xl font-bold text-amber-700">{stats.newLeadsToday}</p>
            <p className="text-sm text-amber-600">Новых заявок</p>
          </a>
          <a href="/admin/patients" className="rounded-xl bg-blue-50 p-4 text-center transition hover:bg-blue-100">
            <p className="text-2xl font-bold text-blue-700">{stats.totalPatients}</p>
            <p className="text-sm text-blue-600">Пациентов</p>
          </a>
          <a href="/schedule" className="rounded-xl bg-green-50 p-4 text-center transition hover:bg-green-100">
            <p className="text-2xl font-bold text-green-700">{stats.todayAppointments}</p>
            <p className="text-sm text-green-600">Приёмов сегодня</p>
          </a>
          <a href="/owner/payments" className="rounded-xl bg-purple-50 p-4 text-center transition hover:bg-purple-100">
            <p className="text-2xl font-bold text-purple-700">{fmt(stats.pendingPayments)} &#8381;</p>
            <p className="text-sm text-purple-600">Ожидают оплаты</p>
          </a>
        </div>
      </div>
    </div>
  )
}
