import type { Metadata } from "next"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { PatientsListPage } from "@/components/crm/patients-list"

export const metadata: Metadata = {
  title: "Пациенты — ДаоДент CRM",
}

export default async function AdminPatientsPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const role = (session.user as { role: string }).role
  if (!["OWNER", "MANAGER", "ADMIN"].includes(role)) redirect("/home")

  let patients: Array<{
    id: string
    firstName: string
    lastName: string
    middleName: string | null
    phone: string
    email: string | null
    status: string
    source: string
    createdAt: Date
    doctor: { name: string | null } | null
    _count: { appointments: number }
  }> = []

  try {
    patients = await prisma.patient.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        doctor: { select: { name: true } },
        _count: { select: { appointments: true } },
      },
    })
  } catch {
    // БД может быть недоступна
  }

  return <PatientsListPage patients={patients} />
}
