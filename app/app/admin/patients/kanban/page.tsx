import type { Metadata } from "next"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { PatientKanban } from "@/components/crm/patient-kanban"

export const metadata: Metadata = {
  title: "Воронка пациентов — ДаоДент CRM",
}

export default async function PatientKanbanPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const role = (session.user as { role: string }).role
  if (!["OWNER", "MANAGER", "ADMIN"].includes(role)) redirect("/home")

  let patients: Array<{
    id: string
    firstName: string
    lastName: string
    phone: string
    status: string
    doctor: { name: string | null } | null
    updatedAt: Date
  }> = []

  try {
    patients = await prisma.patient.findMany({
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        status: true,
        updatedAt: true,
        doctor: { select: { name: true } },
      },
    })
  } catch {
    // БД недоступна
  }

  return <PatientKanban patients={patients} />
}
