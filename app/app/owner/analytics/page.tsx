import type { Metadata } from "next"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { OwnerDashboard } from "@/components/owner/owner-dashboard"

export const metadata: Metadata = {
  title: "Аналитика — ДаоДент",
}

export default async function OwnerAnalyticsPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const role = (session.user as { role: string }).role
  if (role !== "OWNER" && role !== "MANAGER") redirect("/home")

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 7)
  const monthAgo = new Date(today)
  monthAgo.setMonth(monthAgo.getMonth() - 1)

  let stats = {
    todayAppointments: 0,
    weekAppointments: 0,
    monthAppointments: 0,
    totalPatients: 0,
    newLeadsToday: 0,
    newLeadsWeek: 0,
    patientsInTreatment: 0,
    cabinets: [] as Array<{ id: string; name: string; number: number; status: string }>,
    doctorWorkload: [] as Array<{ name: string | null; count: number }>,
  }

  try {
    const [
      todayAppointments,
      weekAppointments,
      monthAppointments,
      totalPatients,
      newLeadsToday,
      newLeadsWeek,
      patientsInTreatment,
      cabinets,
    ] = await Promise.all([
      prisma.appointment.count({ where: { date: { gte: today } } }),
      prisma.appointment.count({ where: { date: { gte: weekAgo } } }),
      prisma.appointment.count({ where: { date: { gte: monthAgo } } }),
      prisma.patient.count(),
      prisma.lead.count({ where: { createdAt: { gte: today } } }),
      prisma.lead.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.patient.count({ where: { status: "IN_TREATMENT" } }),
      prisma.cabinet.findMany({ orderBy: { number: "asc" } }),
    ])

    // Загруженность врачей (приёмы за неделю)
    const doctors = await prisma.user.findMany({
      where: { role: "DOCTOR" },
      select: {
        name: true,
        _count: {
          select: {
            appointments: { where: { date: { gte: weekAgo } } },
          },
        },
      },
    })

    stats = {
      todayAppointments,
      weekAppointments,
      monthAppointments,
      totalPatients,
      newLeadsToday,
      newLeadsWeek,
      patientsInTreatment,
      cabinets,
      doctorWorkload: doctors.map((d) => ({ name: d.name, count: d._count.appointments })),
    }
  } catch {
    // БД недоступна
  }

  return <OwnerDashboard stats={stats} />
}
