"use client"

import { useState } from "react"
import Link from "next/link"
import { CreditCard, TrendingUp, Clock, DollarSign, Calendar } from "lucide-react"

const METHOD_LABELS: Record<string, string> = {
  CASH: "Наличные",
  CARD: "Карта",
  TRANSFER: "Перевод",
  INSTALLMENT: "Рассрочка",
}

const STATUS_BADGES: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Ожидает", color: "bg-yellow-100 text-yellow-700" },
  PAID: { label: "Оплачено", color: "bg-green-100 text-green-700" },
  PARTIAL: { label: "Частично", color: "bg-blue-100 text-blue-700" },
  REFUNDED: { label: "Возврат", color: "bg-red-100 text-red-700" },
  CANCELLED: { label: "Отменено", color: "bg-gray-100 text-gray-600" },
}

type PaymentRow = {
  id: string
  amount: { toString(): string }
  method: string
  status: string
  description: string | null
  createdAt: Date | string
  patient: { id: string; firstName: string; lastName: string }
  appointment: {
    id: string
    date: Date | string
    startTime: string
    service: { name: string } | null
  } | null
}

type Stats = {
  totalRevenue: number
  monthRevenue: number
  pendingAmount: number
  paymentCount: number
}

function fmt(n: number) {
  return n.toLocaleString("ru-RU", { maximumFractionDigits: 0 })
}

export function PaymentsPage({ payments, stats }: { payments: PaymentRow[]; stats: Stats }) {
  const [statusFilter, setStatusFilter] = useState("")

  const filtered = payments.filter((p) => !statusFilter || p.status === statusFilter)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Оплаты</h1>

      {/* Карточки статистики */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Выручка за всё время</p>
              <p className="text-xl font-bold text-gray-900">{fmt(stats.totalRevenue)} &#8381;</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Выручка за месяц</p>
              <p className="text-xl font-bold text-gray-900">{fmt(stats.monthRevenue)} &#8381;</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Ожидает оплаты</p>
              <p className="text-xl font-bold text-gray-900">{fmt(stats.pendingAmount)} &#8381;</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Всего операций</p>
              <p className="text-xl font-bold text-gray-900">{stats.paymentCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Фильтры */}
      <div className="flex gap-2">
        {[
          { key: "", label: "Все" },
          { key: "PAID", label: "Оплачено" },
          { key: "PENDING", label: "Ожидает" },
          { key: "REFUNDED", label: "Возвраты" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              statusFilter === f.key ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Таблица */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr>
              <th className="px-6 py-3 font-medium text-gray-500">Дата</th>
              <th className="px-6 py-3 font-medium text-gray-500">Пациент</th>
              <th className="px-6 py-3 font-medium text-gray-500">Услуга</th>
              <th className="px-6 py-3 font-medium text-gray-500">Сумма</th>
              <th className="px-6 py-3 font-medium text-gray-500">Способ</th>
              <th className="px-6 py-3 font-medium text-gray-500">Статус</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((p) => {
              const badge = STATUS_BADGES[p.status] || { label: p.status, color: "bg-gray-100 text-gray-600" }
              return (
                <tr key={p.id} className="transition hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-500">
                    {new Date(p.createdAt).toLocaleDateString("ru-RU")}
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/patients/${p.patient.id}`}
                      className="font-medium text-gray-900 hover:text-blue-600"
                    >
                      {p.patient.lastName} {p.patient.firstName}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {p.appointment?.service?.name || p.description || "—"}
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-900">
                    {fmt(Number(p.amount))} &#8381;
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {METHOD_LABELS[p.method] || p.method}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${badge.color}`}>
                      {badge.label}
                    </span>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                  Оплат не найдено
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
