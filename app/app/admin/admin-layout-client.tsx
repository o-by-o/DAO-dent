"use client"

import { usePathname } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"

export function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <DashboardLayout activePath={pathname} role="OWNER">
      {children}
    </DashboardLayout>
  )
}
