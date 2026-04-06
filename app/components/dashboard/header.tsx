"use client"

import { Bell, Menu, ShoppingBag } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { BreadcrumbNav } from "@/components/dashboard/breadcrumb-nav"
import { useCart } from "@/lib/cart"

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

/** Build initials from a full name, e.g. "Мария Иванова" → "МИ" */
function getInitials(name: string | null | undefined): string {
  if (!name) return "?"
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

/** Shorten name for display, e.g. "Мария Иванова" → "Мария И." */
function getShortName(name: string | null | undefined): string {
  if (!name) return "Пользователь"
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return `${parts[0]} ${parts[1][0]}.`
  }
  return parts[0]
}

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface HeaderProps {
  /** Currently active path -- passed to breadcrumb */
  activePath?: string
  /** Open mobile menu (card-style modal) */
  onMobileMenuOpen: () => void
  /** User's full name from session */
  userName?: string | null
}

/* ------------------------------------------------------------------ */
/*  Header component                                                   */
/* ------------------------------------------------------------------ */

export function Header({
  activePath = "/home",
  onMobileMenuOpen,
  userName,
}: HeaderProps) {
  const initials = getInitials(userName)
  const shortName = getShortName(userName)
  const { totalItems } = useCart()

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[rgba(255,255,255,0.32)] bg-[rgba(255,255,255,0.4)] px-4 backdrop-blur-md md:px-6">
      {/* Left: hamburger (mobile) + breadcrumb */}
      <div className="flex items-center gap-3">
        {/* Hamburger -- visible only on mobile */}
        <button
          type="button"
          onClick={onMobileMenuOpen}
          aria-label="Открыть меню"
          className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground boty-transition hover:bg-foreground/5 hover:text-foreground md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <BreadcrumbNav activePath={activePath} />
      </div>

      {/* Right: cart + notification bell + user avatar */}
      <div className="flex items-center gap-4">
        {/* Cart */}
        <a
          href="/shop/checkout"
          aria-label="Корзина"
          className="relative flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground boty-transition hover:bg-foreground/5 hover:text-foreground"
        >
          <ShoppingBag className="h-5 w-5" />
          {totalItems > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {totalItems}
            </span>
          )}
        </a>

        {/* Notification bell with badge */}
        <button
          type="button"
          aria-label="Уведомления"
          className="relative flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground boty-transition hover:bg-foreground/5 hover:text-foreground"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
            3
          </span>
        </button>

        {/* User info */}
        <div className="flex items-center gap-2.5">
          <Avatar className="h-8 w-8 border-2 border-primary/20 boty-shadow">
            <AvatarFallback className="bg-primary text-sm font-semibold text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="hidden text-sm font-medium text-foreground md:block">
            {shortName}
          </span>
        </div>
      </div>
    </header>
  )
}
