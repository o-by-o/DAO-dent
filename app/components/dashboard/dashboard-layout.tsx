"use client"

import React from "react"

import { useState, useCallback, useEffect } from "react"
import type { Session } from "next-auth"
import { useSession, SessionProvider } from "next-auth/react"
import { usePathname } from "next/navigation"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { MobileNavCard } from "@/components/dashboard/mobile-nav-card"
import { CartProvider } from "@/lib/cart"

interface DashboardLayoutProps {
  children: React.ReactNode
  activePath?: string
  /** Показывать пункт «Управление пользователями» в сайдбаре (если не задано — берётся из сессии по role === ADMIN) */
  isAdmin?: boolean
  /** Сессия с сервера — убирает лишний запрос getSession на клиенте */
  session?: Session | null
}

/** Оборачивает в SessionProvider, чтобы useSession работал при любом порядке гидрации корневого layout */
export function DashboardLayout(props: DashboardLayoutProps) {
  const { session, ...rest } = props
  return (
    <SessionProvider session={session ?? undefined}>
      <CartProvider>
        <DashboardLayoutInner {...rest} />
      </CartProvider>
    </SessionProvider>
  )
}

function DashboardLayoutInner({
  children,
  activePath = "/home",
  isAdmin: isAdminProp,
}: DashboardLayoutProps) {
  const { data: session, status } = useSession()
  // Показывать админ-пункты только при явной роли ADMIN и только после загрузки сессии
  const isAdmin =
    isAdminProp ??
    (status === "authenticated" &&
      !!session?.user &&
      (session.user as { role?: string }).role === "ADMIN")
  const [collapsed, setCollapsed] = useState(false)
  const toggleCollapse = useCallback(() => setCollapsed((c) => !c), [])

  const [mobileOpen, setMobileOpen] = useState(false)
  const openMobile = useCallback(() => setMobileOpen(true), [])

  // Рендерим Sheet только после гидратации — портал Radix Dialog
  // создаёт разное дерево при SSR и на клиенте, что сдвигает useId()
  const [mounted, setMounted] = useState(false)

  // Закрываем мобильное меню при навигации
  const pathname = usePathname()
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // Закрываем мобильное меню при переходе на десктопный размер экрана
  useEffect(() => {
    setMounted(true)
    const mq = window.matchMedia("(min-width: 768px)")
    const handler = (e: MediaQueryListEvent) => {
      if (e.matches) setMobileOpen(false)
    }
    mq.addEventListener("change", handler)
    // Закрыть сразу, если сейчас десктоп
    if (mq.matches) setMobileOpen(false)
    return () => mq.removeEventListener("change", handler)
  }, [])

  useEffect(() => {
    try {
      const raw = localStorage.getItem("dashboard-sidebar-collapsed")
      if (raw === "1") setCollapsed(true)
      if (raw === "0") setCollapsed(false)
    } catch {
      // ignore storage errors
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem("dashboard-sidebar-collapsed", collapsed ? "1" : "0")
    } catch {
      // ignore storage errors
    }
  }, [collapsed])

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <div className="hidden h-full md:block">
        <Sidebar
          activePath={activePath}
          collapsed={collapsed}
          onToggleCollapse={toggleCollapse}
          isAdmin={isAdmin}
        />
      </div>

      {/* Mobile menu — card-style modal (same style as login page) */}
      {mounted && (
        <MobileNavCard
          open={mobileOpen}
          onOpenChange={setMobileOpen}
          activePath={activePath}
          isAdmin={isAdmin}
        />
      )}

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          activePath={activePath}
          onMobileMenuOpen={openMobile}
          userName={session?.user?.name ?? null}
        />
        <main className="flex-1 overflow-y-auto px-4 pb-6 pt-4 md:px-6 md:pb-8 md:pt-5 lg:px-10 lg:pb-10 lg:pt-6">
          <div className="mx-auto w-full max-w-6xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
