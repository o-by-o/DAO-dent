import type { Metadata } from "next"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { PatientsListPage } from "@/components/crm/patients-list"

export const metadata: Metadata = {
  title: "Мои пациенты — ДаоДент",
}

export default async function DoctorPatientsPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const role = (session.user as { role: string }).role
  if (!["OWNER", "MANAGER", "DOCTOR"].includes(role)) redirect("/home")

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
      where: { doctorId: session.user.id },
      orderBy: { updatedAt: "desc" },
      include: {
        doctor: { select: { name: true } },
        _count: { select: { appointments: true } },
      },
    })
  } catch {
    // БД недоступна
  }

  return <PatientsListPage patients={patients} />
}
