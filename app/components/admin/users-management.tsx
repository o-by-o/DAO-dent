"use client"

import { User, Shield, Stethoscope, Building2 } from "lucide-react"

const ROLE_BADGES: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  OWNER: { label: "Владелец", color: "bg-purple-100 text-purple-700", icon: Shield },
  MANAGER: { label: "Управляющий", color: "bg-blue-100 text-blue-700", icon: Building2 },
  DOCTOR: { label: "Врач", color: "bg-green-100 text-green-700", icon: Stethoscope },
  ADMIN: { label: "Администратор", color: "bg-amber-100 text-amber-700", icon: User },
}

type UserRow = {
  id: string
  email: string
  name: string | null
  role: string
  phone: string | null
  specialization: string | null
  createdAt: Date | string
  _count: { appointments: number }
}

export function UsersManagementPage({ users }: { users: UserRow[] }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Пользователи</h1>
          <p className="text-sm text-gray-500">{users.length} пользователей в системе</p>
        </div>
        <button className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700">
          + Добавить
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr>
              <th className="px-6 py-3 font-medium text-gray-500">Имя</th>
              <th className="px-6 py-3 font-medium text-gray-500">Email</th>
              <th className="px-6 py-3 font-medium text-gray-500">Роль</th>
              <th className="px-6 py-3 font-medium text-gray-500">Специализация</th>
              <th className="px-6 py-3 font-medium text-gray-500">Приёмы</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map((user) => {
              const badge = ROLE_BADGES[user.role] || ROLE_BADGES["ADMIN"]!
              const Icon = badge.icon
              return (
                <tr key={user.id} className="transition hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {user.name || "—"}
                  </td>
                  <td className="px-6 py-4 text-gray-600">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${badge.color}`}>
                      <Icon className="h-3 w-3" />
                      {badge.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {user.specialization || "—"}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {user._count.appointments}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
