"use client"

import { Bell, Menu } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { BreadcrumbNav } from "@/components/dashboard/breadcrumb-nav"

function getInitials(name: string | null | undefined): string {
  if (!name) return "?"
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

function getShortName(name: string | null | undefined): string {
  if (!name) return "Пользователь"
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return `${parts[0]} ${parts[1][0]}.`
  }
  return parts[0]
}

interface HeaderProps {
  activePath?: string
  onMobileMenuOpen: () => void
  userName?: string | null
}

export function Header({
  activePath = "/home",
  onMobileMenuOpen,
  userName,
}: HeaderProps) {
  const initials = getInitials(userName)
  const shortName = getShortName(userName)

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-gray-200/60 bg-white/80 px-4 backdrop-blur-md md:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMobileMenuOpen}
          aria-label="Открыть меню"
          className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <BreadcrumbNav activePath={activePath} />
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          aria-label="Уведомления"
          className="relative flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white">
            0
          </span>
        </button>

        <div className="flex items-center gap-2.5">
          <Avatar className="h-8 w-8 border-2 border-blue-100">
            <AvatarFallback className="bg-blue-600 text-sm font-semibold text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="hidden text-sm font-medium text-gray-900 md:block">
            {shortName}
          </span>
        </div>
      </div>
    </header>
  )
}
