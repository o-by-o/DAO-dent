"use client"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { ProfileForm } from "@/components/dashboard/profile-form"
import { Settings } from "lucide-react"

export default function SettingsPage() {
  return (
    <DashboardLayout activePath="/settings">
      {/* Page header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
          <Settings className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Настройки профиля
          </h1>
          <p className="text-sm text-muted-foreground">
            Управляйте личными данными, безопасностью и уведомлениями
          </p>
        </div>
      </div>

      <ProfileForm />
    </DashboardLayout>
  )
}
