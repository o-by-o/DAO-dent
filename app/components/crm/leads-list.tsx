"use client"

import { useState } from "react"
import { Search, Phone, MessageSquare, Globe, Bot, AlertCircle } from "lucide-react"

const CHANNEL_LABELS: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  WEBSITE_FORM: { label: "Сайт", icon: Globe, color: "text-blue-600" },
  CALLBACK: { label: "Обратный звонок", icon: Phone, color: "text-green-600" },
  PHONE_CALL: { label: "Звонок", icon: Phone, color: "text-emerald-600" },
  WHATSAPP: { label: "WhatsApp", icon: MessageSquare, color: "text-green-500" },
  TELEGRAM: { label: "Telegram", icon: MessageSquare, color: "text-sky-500" },
  VK: { label: "ВК", icon: MessageSquare, color: "text-blue-500" },
  QUIZ: { label: "Квиз", icon: AlertCircle, color: "text-purple-600" },
  AI_CHAT: { label: "AI-чат", icon: Bot, color: "text-violet-600" },
  OTHER: { label: "Другое", icon: MessageSquare, color: "text-gray-500" },
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  NEW: { label: "Новая", color: "bg-red-100 text-red-700" },
  PROCESSING: { label: "В работе", color: "bg-yellow-100 text-yellow-700" },
  CONVERTED: { label: "Конвертирована", color: "bg-green-100 text-green-700" },
  CLOSED: { label: "Закрыта", color: "bg-gray-100 text-gray-600" },
}

type LeadRow = {
  id: string
  name: string | null
  phone: string | null
  email: string | null
  channel: string
  service: string | null
  message: string | null
  status: string
  createdAt: Date | string
  patient: { id: string; firstName: string; lastName: string } | null
}

export function LeadsListPage({ leads }: { leads: LeadRow[] }) {
  const [statusFilter, setStatusFilter] = useState("")

  const filtered = leads.filter((l) => !statusFilter || l.status === statusFilter)

  const newCount = leads.filter((l) => l.status === "NEW").length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Заявки</h1>
          <p className="text-sm text-gray-500">
            {leads.length} заявок, {newCount} новых
          </p>
        </div>
      </div>

      {/* Фильтры */}
      <div className="flex gap-2">
        <button
          onClick={() => setStatusFilter("")}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            !statusFilter ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Все ({leads.length})
        </button>
        {Object.entries(STATUS_LABELS).map(([key, { label }]) => {
          const count = leads.filter((l) => l.status === key).length
          return (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                statusFilter === key ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {label} ({count})
            </button>
          )
        })}
      </div>

      {/* Список заявок */}
      <div className="space-y-3">
        {filtered.map((lead) => {
          const channel = CHANNEL_LABELS[lead.channel] || CHANNEL_LABELS["OTHER"]!
          const status = STATUS_LABELS[lead.status] || { label: lead.status, color: "bg-gray-100 text-gray-600" }
          const ChannelIcon = channel.icon
          const timeAgo = getTimeAgo(new Date(lead.createdAt))

          return (
            <div
              key={lead.id}
              className={`rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md ${
                lead.status === "NEW" ? "border-red-200" : "border-gray-100"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <ChannelIcon className={`h-4 w-4 ${channel.color}`} />
                    <span className="text-sm font-medium text-gray-900">
                      {lead.name || "Без имени"}
                    </span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${status.color}`}>
                      {status.label}
                    </span>
                    <span className="text-xs text-gray-400">{timeAgo}</span>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-500">
                    {lead.phone && (
                      <a href={`tel:${lead.phone}`} className="flex items-center gap-1 hover:text-blue-600">
                        <Phone className="h-3 w-3" /> {lead.phone}
                      </a>
                    )}
                    {lead.service && (
                      <span className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-600">
                        {lead.service}
                      </span>
                    )}
                    <span className="text-xs text-gray-400">{channel.label}</span>
                  </div>

                  {lead.message && (
                    <p className="mt-2 text-sm text-gray-500">{lead.message}</p>
                  )}
                </div>

                <div className="flex gap-2">
                  {lead.status === "NEW" && (
                    <button className="rounded-lg bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 transition hover:bg-green-100">
                      Обработать
                    </button>
                  )}
                  <button className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-100">
                    Создать пациента
                  </button>
                </div>
              </div>
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div className="rounded-2xl bg-gray-50 p-12 text-center text-gray-400">
            Заявок не найдено
          </div>
        )}
      </div>
    </div>
  )
}

function getTimeAgo(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return "только что"
  if (minutes < 60) return `${minutes} мин назад`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} ч назад`
  const days = Math.floor(hours / 24)
  return `${days} дн назад`
}
