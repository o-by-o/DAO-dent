"use client"

import React from "react"

import { useState, useCallback, useEffect } from "react"
import type { Session } from "next-auth"
import { useSession, SessionProvider } from "next-auth/react"
import { usePathname } from "next/navigation"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { MobileNavCard } from "@/components/dashboard/mobile-nav-card"

interface DashboardLayoutProps {
  children: React.ReactNode
  activePath?: string
  role?: string
  session?: Session | null
}

export function DashboardLayout(props: DashboardLayoutProps) {
  const { session, ...rest } = props
  return (
    <SessionProvider session={session ?? undefined}>
      <DashboardLayoutInner {...rest} />
    </SessionProvider>
  )
}

function DashboardLayoutInner({
  children,
  activePath = "/home",
  role: roleProp,
}: DashboardLayoutProps) {
  const { data: session, status } = useSession()
  const role =
    roleProp ??
    (status === "authenticated" && session?.user
      ? (session.user as { role?: string }).role || "ADMIN"
      : "ADMIN")

  const [collapsed, setCollapsed] = useState(false)
  const toggleCollapse = useCallback(() => setCollapsed((c) => !c), [])

  const [mobileOpen, setMobileOpen] = useState(false)
  const openMobile = useCallback(() => setMobileOpen(true), [])

  const [mounted, setMounted] = useState(false)

  const pathname = usePathname()
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    setMounted(true)
    const mq = window.matchMedia("(min-width: 768px)")
    const handler = (e: MediaQueryListEvent) => {
      if (e.matches) setMobileOpen(false)
    }
    mq.addEventListener("change", handler)
    if (mq.matches) setMobileOpen(false)
    return () => mq.removeEventListener("change", handler)
  }, [])

  useEffect(() => {
    try {
      const raw = localStorage.getItem("dashboard-sidebar-collapsed")
      if (raw === "1") setCollapsed(true)
      if (raw === "0") setCollapsed(false)
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem("dashboard-sidebar-collapsed", collapsed ? "1" : "0")
    } catch {
      // ignore
    }
  }, [collapsed])

  return (
    <div className="flex h-dvh overflow-hidden bg-gray-50">
      {/* Desktop sidebar */}
      <div className="hidden h-full md:block">
        <Sidebar
          activePath={activePath}
          collapsed={collapsed}
          onToggleCollapse={toggleCollapse}
          role={role}
        />
      </div>

      {/* Mobile menu */}
      {mounted && (
        <MobileNavCard
          open={mobileOpen}
          onOpenChange={setMobileOpen}
          activePath={activePath}
          role={role}
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
          <div className="mx-auto w-full max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
