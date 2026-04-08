"use client"

import { ProfileForm } from "@/components/dashboard/profile-form"
import { Settings } from "lucide-react"

export default function SettingsPage() {
  return (
    <>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
          <Settings className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Настройки профиля</h1>
          <p className="text-sm text-gray-500">
            Управление личными данными и безопасностью
          </p>
        </div>
      </div>
      <ProfileForm />
    </>
  )
}
