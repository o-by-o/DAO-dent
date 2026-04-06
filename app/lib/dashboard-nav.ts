import type { LucideIcon } from "lucide-react"
import {
  LayoutDashboard,
  BookOpen,
  Search,
  CalendarDays,
  Settings,
  HelpCircle,
  GraduationCap,
  Users,
  UserCircle,
  Package,
  ScanFace,
  Sparkles,
  ShoppingBag,
  Film,
  Contact,
} from "lucide-react"

export interface DashboardNavItem {
  label: string
  icon: LucideIcon
  href: string
}

export const navItemsBase: readonly DashboardNavItem[] = [
  { label: "Главная", icon: LayoutDashboard, href: "/home" },
  { label: "Мои курсы", icon: BookOpen, href: "/courses" },
  { label: "Каталог курсов", icon: Search, href: "/catalog" },
  { label: "Магазин", icon: ShoppingBag, href: "/shop" },
  { label: "Диагностика лица", icon: ScanFace, href: "/diagnostics" },
  { label: "Заказ товаров", icon: Sparkles, href: "/order-chat" },
  { label: "Мои клиенты", icon: Contact, href: "/my-clients" },
  { label: "Мой склад", icon: Package, href: "/my-warehouse" },
] as const

export const navItemsAdmin: readonly DashboardNavItem[] = [
  { label: "Агент", icon: Sparkles, href: "/admin/agent" },
  { label: "Управление курсами", icon: GraduationCap, href: "/admin/courses" },
  { label: "Управление пользователями", icon: Users, href: "/admin/users" },
  { label: "Клиентская база", icon: UserCircle, href: "/admin/clients" },
  { label: "Складские операции", icon: Package, href: "/admin/warehouse" },
  { label: "Медиатека", icon: Film, href: "/admin/media" },
  { label: "Календарь", icon: CalendarDays, href: "/admin/calendar" },
] as const

export const navItemsBottom: readonly DashboardNavItem[] = [
  { label: "Настройки", icon: Settings, href: "/settings" },
  { label: "Поддержка", icon: HelpCircle, href: "/support" },
] as const

export function getMainNavItems(isAdmin: boolean): DashboardNavItem[] {
  return [...navItemsBase, ...(isAdmin ? navItemsAdmin : [])]
}
