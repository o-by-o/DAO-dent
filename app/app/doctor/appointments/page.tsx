import type { Metadata } from "next"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { DoctorAppointmentsPage } from "@/components/doctor/doctor-appointments"

export const metadata: Metadata = {
  title: "Мои приёмы — ДаоДент",
}

export default async function DoctorAppointmentsRoute() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const role = (session.user as { role: string }).role
  if (!["OWNER", "MANAGER", "DOCTOR"].includes(role)) redirect("/home")

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let appointments: Array<{
    id: string
    date: Date
    startTime: string
    endTime: string
    type: string
    status: string
    notes: string | null
    patient: { id: string; firstName: string; lastName: string; phone: string; allergies: string | null }
    service: { name: string; price: { toString(): string } } | null
    cabinet: { name: string; number: number } | null
  }> = []

  try {
    appointments = await prisma.appointment.findMany({
      where: {
        doctorId: session.user.id,
        date: { gte: today },
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
      take: 50,
      include: {
        patient: {
          select: { id: true, firstName: true, lastName: true, phone: true, allergies: true },
        },
        service: { select: { name: true, price: true } },
        cabinet: { select: { name: true, number: true } },
      },
    })
  } catch {
    // БД недоступна
  }

  return <DoctorAppointmentsPage appointments={appointments} />
}
