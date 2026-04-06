"use client"

import React from "react"

import { useCallback } from "react"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { LogOut, PanelLeftClose, PanelLeftOpen, CalendarDays } from "lucide-react"
import { BrandLogo } from "@/components/brand-logo"
import { SidebarCalendar } from "@/components/dashboard/sidebar-calendar"
import { getMainNavItems, navItemsBottom } from "@/lib/dashboard-nav"

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface SidebarProps {
  /** Currently active path -- determines highlight state */
  activePath?: string
  /** Whether sidebar is collapsed (icons only) */
  collapsed: boolean
  /** Toggle collapsed state */
  onToggleCollapse: () => void
  /** Show admin link (Управление пользователями) */
  isAdmin?: boolean
}

/* ------------------------------------------------------------------ */
/*  Sidebar component                                                  */
/* ------------------------------------------------------------------ */

export function Sidebar({
  activePath = "/home",
  collapsed,
  onToggleCollapse,
  isAdmin = false,
}: SidebarProps) {
  const navItems = getMainNavItems(isAdmin)
  const handleLogout = useCallback(() => {
    signOut({ callbackUrl: "/login" })
  }, [])

  /** Render a single nav link row */
  const renderItem = useCallback(
    (item: { label: string; icon: React.ElementType; href: string }) => {
      const Icon = item.icon
      const isActive =
        activePath === item.href ||
        (item.href !== "/home" && activePath.startsWith(item.href))

      const link = (
        <a
          href={item.href}
          aria-current={isActive ? "page" : undefined}
          className={cn(
            "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium boty-transition",
            isActive
              ? "bg-primary/10 text-primary boty-shadow relative before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-[2px] before:rounded-full before:bg-primary"
              : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
            collapsed && "justify-center px-2",
          )}
        >
          <Icon
            className={cn(
              "h-5 w-5 shrink-0 boty-transition",
              isActive
                ? "text-primary"
                : "text-muted-foreground/80 group-hover:text-primary",
            )}
          />
          {/* Label -- hidden when collapsed */}
          {!collapsed && <span className="truncate">{item.label}</span>}
        </a>
      )

      /* When collapsed, wrap in a tooltip so users know what each icon is */
      if (collapsed) {
        return (
          <Tooltip key={item.href}>
            <TooltipTrigger asChild>{link}</TooltipTrigger>
            <TooltipContent side="right" className="font-medium">
              {item.label}
            </TooltipContent>
          </Tooltip>
        )
      }

      return <div key={item.href}>{link}</div>
    },
    [activePath, collapsed],
  )

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "group/sidebar relative flex h-full flex-col border-r border-[rgba(255,255,255,0.32)] bg-[rgba(255,255,255,0.4)] backdrop-blur-md transition-[width] duration-300 ease-in-out",
          collapsed ? "w-[72px]" : "w-[240px]",
        )}
      >
        {/* ---- Logo + collapse toggle ---- */}
        <div className="relative flex items-center overflow-hidden px-3 pt-5 pb-4">
          {collapsed ? (
            <a href="/home" className="mx-auto shrink-0">
              <BrandLogo variant="collapsed" className="block h-auto w-[50px]" />
            </a>
          ) : (
            <a href="/home" className="shrink-0 boty-transition hover:opacity-80">
              <BrandLogo showTagline className="block h-auto w-[180px]" />
            </a>
          )}

          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Показать боковую панель" : "Скрыть боковую панель"}
            className="absolute right-2 top-1/2 z-20 hidden h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground/60 opacity-0 boty-transition hover:text-foreground group-hover/sidebar:opacity-100 md:flex"
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Accent line */}
        <div className="mx-4 mb-2 h-px bg-border/30" />

        {/* ---- Main nav ---- */}
        <nav className="flex flex-1 flex-col gap-0.5 px-2" aria-label="Main">
          {navItems.map(renderItem)}

          <div className="mt-auto" />
          {collapsed ? (
            <div className="flex justify-center px-2 py-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <a
                    href="/schedule"
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground boty-transition hover:bg-foreground/5 hover:text-foreground"
                  >
                    <CalendarDays className="h-5 w-5" />
                  </a>
                </TooltipTrigger>
                <TooltipContent side="right" className="font-medium">Календарь</TooltipContent>
              </Tooltip>
            </div>
          ) : (
            <SidebarCalendar />
          )}
          <Separator className="my-2 bg-border/30" />
          {navItemsBottom.map(renderItem)}
        </nav>

        {/* ---- Logout ---- */}
        <div className="flex flex-col gap-0.5 border-t border-border/30 px-2 py-3">
          {/* Logout button */}
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center justify-center rounded-xl px-2 py-2.5 text-sm font-medium text-muted-foreground boty-transition hover:bg-foreground/5 hover:text-foreground"
                >
                  <LogOut className="h-5 w-5 shrink-0" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-medium">
                Выход
              </TooltipContent>
            </Tooltip>
          ) : (
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground boty-transition hover:bg-foreground/5 hover:text-foreground"
            >
              <LogOut className="h-5 w-5 shrink-0" />
              <span>Выход</span>
            </button>
          )}
        </div>
      </aside>
    </TooltipProvider>
  )
}
