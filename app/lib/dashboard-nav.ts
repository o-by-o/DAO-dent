import type { LucideIcon } from "lucide-react"
import {
  LayoutDashboard,
  CalendarDays,
  Settings,
  HelpCircle,
  Users,
  UserCircle,
  Package,
  Sparkles,
  Stethoscope,
  ClipboardList,
  CreditCard,
  Activity,
  Building2,
  BarChart3,
} from "lucide-react"

export interface DashboardNavItem {
  label: string
  icon: LucideIcon
  href: string
}

// Навигация для администратора ресепшна
export const navItemsBase: readonly DashboardNavItem[] = [
  { label: "Главная", icon: LayoutDashboard, href: "/home" },
  { label: "Расписание", icon: CalendarDays, href: "/schedule" },
  { label: "Пациенты", icon: UserCircle, href: "/patients" },
  { label: "Заявки", icon: ClipboardList, href: "/leads" },
] as const

// Навигация для врачей
export const navItemsDoctor: readonly DashboardNavItem[] = [
  { label: "Мои приёмы", icon: Stethoscope, href: "/doctor/appointments" },
  { label: "Мои пациенты", icon: UserCircle, href: "/doctor/patients" },
] as const

// Навигация для владельца / управляющего
export const navItemsOwner: readonly DashboardNavItem[] = [
  { label: "Аналитика", icon: BarChart3, href: "/owner/analytics" },
  { label: "Кабинеты", icon: Building2, href: "/owner/cabinets" },
  { label: "Оплаты", icon: CreditCard, href: "/owner/payments" },
  { label: "Маркетинг", icon: Activity, href: "/owner/marketing" },
] as const

// Админские функции (для OWNER и MANAGER)
export const navItemsAdmin: readonly DashboardNavItem[] = [
  { label: "AI-агент", icon: Sparkles, href: "/admin/agent" },
  { label: "Услуги", icon: ClipboardList, href: "/admin/services" },
  { label: "Пользователи", icon: Users, href: "/admin/users" },
  { label: "Пациенты", icon: UserCircle, href: "/admin/patients" },
  { label: "Склад", icon: Package, href: "/admin/warehouse" },
] as const

export const navItemsBottom: readonly DashboardNavItem[] = [
  { label: "Настройки", icon: Settings, href: "/settings" },
  { label: "Поддержка", icon: HelpCircle, href: "/support" },
] as const

export function getMainNavItems(role: string): DashboardNavItem[] {
  const items = [...navItemsBase]

  if (role === "DOCTOR") {
    items.push(...navItemsDoctor)
  }

  if (role === "OWNER" || role === "MANAGER") {
    items.push(...navItemsOwner)
    items.push(...navItemsAdmin)
  }

  if (role === "OWNER") {
    // Владелец видит всё
  }

  return items
}
