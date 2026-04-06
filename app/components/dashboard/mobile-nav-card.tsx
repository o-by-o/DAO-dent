"use client"

import Link from "next/link"
import { signOut } from "next-auth/react"
import { LogOut } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { BrandLogo } from "@/components/brand-logo"
import { getMainNavItems, navItemsBottom } from "@/lib/dashboard-nav"
import { cn } from "@/lib/utils"

interface MobileNavCardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  activePath?: string
  isAdmin?: boolean
}

export function MobileNavCard({
  open,
  onOpenChange,
  activePath = "/home",
  isAdmin = false,
}: MobileNavCardProps) {
  const mainItems = getMainNavItems(isAdmin)

  const renderLink = (item: (typeof mainItems)[number] | (typeof navItemsBottom)[number]) => {
    const Icon = item.icon
    const isActive =
      activePath === item.href ||
      (item.href !== "/home" && activePath.startsWith(item.href))
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => onOpenChange(false)}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium boty-transition",
          isActive
            ? "bg-primary/10 text-primary boty-shadow"
            : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
        )}
      >
        <Icon className="h-5 w-5 shrink-0" />
        <span>{item.label}</span>
      </Link>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[400px] w-[calc(100vw-2rem)] border-[rgba(255,255,255,0.32)] bg-[rgba(255,255,255,0.65)] backdrop-blur-xl p-0 gap-0 overflow-hidden rounded-2xl shadow-[var(--shadow-card-hover)]"
        aria-describedby={undefined}
      >
        <DialogTitle className="sr-only">Навигация</DialogTitle>
        <div className="p-8 pt-12 space-y-6">
          <div className="mx-auto h-px w-12 rounded-full bg-border" />

          {/* Logo */}
          <div className="flex flex-col items-center gap-2">
            <BrandLogo withBackground className="h-auto w-[200px]" />
            <p className="text-sm text-muted-foreground">Меню</p>
          </div>

          {/* Main nav */}
          <nav className="flex flex-col gap-1" aria-label="Основная навигация">
            {mainItems.map(renderLink)}
          </nav>

          {/* Bottom nav */}
          <nav className="flex flex-col gap-1 pt-2 border-t border-border/30" aria-label="Настройки">
            {navItemsBottom.map(renderLink)}
          </nav>

          {/* Logout */}
          <button
            type="button"
            onClick={() => {
              onOpenChange(false)
              signOut({ callbackUrl: "/login" })
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-border/30 bg-foreground/5 px-4 py-3 text-sm font-medium text-foreground/80 boty-transition hover:bg-foreground/10 hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Выход
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
