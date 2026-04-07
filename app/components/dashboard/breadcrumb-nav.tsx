"use client"

import { ChevronRight, Home } from "lucide-react"

const pathLabels: Array<{ prefix: string; label: string }> = [
  // Владелец / Управляющий
  { prefix: "/owner/analytics", label: "Аналитика" },
  { prefix: "/owner/cabinets", label: "Кабинеты" },
  { prefix: "/owner/payments", label: "Оплаты" },
  { prefix: "/owner/marketing", label: "Маркетинг" },
  // Врач
  { prefix: "/doctor/appointments", label: "Мои приёмы" },
  { prefix: "/doctor/patients", label: "Мои пациенты" },
  // Администрирование
  { prefix: "/admin/agent", label: "AI-агент" },
  { prefix: "/admin/services", label: "Услуги" },
  { prefix: "/admin/users", label: "Пользователи" },
  { prefix: "/admin/patients", label: "Пациенты" },
  { prefix: "/admin/warehouse", label: "Склад" },
  // Общие
  { prefix: "/patients", label: "Пациенты" },
  { prefix: "/leads", label: "Заявки" },
  { prefix: "/schedule", label: "Расписание" },
  { prefix: "/settings", label: "Настройки" },
  { prefix: "/support", label: "Поддержка" },
  { prefix: "/home", label: "Главная" },
]

interface BreadcrumbNavProps {
  activePath?: string
}

export function BreadcrumbNav({ activePath = "/home" }: BreadcrumbNavProps) {
  const currentLabel =
    pathLabels.find((item) => activePath === item.prefix || activePath.startsWith(item.prefix))
      ?.label ?? "Страница"

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
      <a
        href="/home"
        className="flex items-center gap-1 text-gray-400 transition hover:text-gray-700"
      >
        <Home className="h-3.5 w-3.5" />
        <span className="sr-only">Главная</span>
      </a>

      <ChevronRight className="h-3.5 w-3.5 text-gray-300" />
      <span className="font-medium text-gray-900">{currentLabel}</span>
    </nav>
  )
}
