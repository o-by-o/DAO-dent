"use client"

import { usePathname } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"

export function OwnerLayoutClient({ children, role }: { children: React.ReactNode; role: string }) {
  const pathname = usePathname()
  return (
    <DashboardLayout activePath={pathname} role={role}>
      {children}
    </DashboardLayout>
  )
}
