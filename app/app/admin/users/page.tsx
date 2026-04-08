import { prisma } from "@/lib/prisma"
import { UsersManagementPage } from "@/components/admin/users-management"

export default async function AdminUsersPage() {
  let users: Array<{
    id: string
    email: string
    name: string | null
    role: string
    phone: string | null
    specialization: string | null
    createdAt: Date
    _count: { appointments: number }
  }> = []

  try {
    users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        specialization: true,
        createdAt: true,
        _count: { select: { appointments: true } },
      },
    })
  } catch {
    // БД недоступна
  }

  return <UsersManagementPage users={users} />
}
