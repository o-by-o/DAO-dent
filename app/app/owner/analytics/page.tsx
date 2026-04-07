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
    funnel: { leads: 0, scheduled: 0, visited: 0, inTreatment: 0, completed: 0 },
    monthRevenue: 0,
    totalRevenue: 0,
    pendingPayments: 0,
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
      leadsCount,
      scheduledCount,
      visitedCount,
      completedCount,
      totalRevAgg,
      monthRevAgg,
      pendingAgg,
    ] = await Promise.all([
      prisma.appointment.count({ where: { date: { gte: today } } }),
      prisma.appointment.count({ where: { date: { gte: weekAgo } } }),
      prisma.appointment.count({ where: { date: { gte: monthAgo } } }),
      prisma.patient.count(),
      prisma.lead.count({ where: { createdAt: { gte: today } } }),
      prisma.lead.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.patient.count({ where: { status: "IN_TREATMENT" } }),
      prisma.cabinet.findMany({ orderBy: { number: "asc" } }),
      prisma.patient.count({ where: { status: "NEW_LEAD" } }),
      prisma.patient.count({ where: { status: "APPOINTMENT_SCHEDULED" } }),
      prisma.patient.count({ where: { status: "VISITED" } }),
      prisma.patient.count({ where: { status: "TREATMENT_COMPLETED" } }),
      prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "PAID" } }),
      prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "PAID", createdAt: { gte: monthAgo } } }),
      prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "PENDING" } }),
    ])

    const doctors = await prisma.user.findMany({
      where: { role: "DOCTOR" },
      select: {
        name: true,
        _count: { select: { appointments: { where: { date: { gte: weekAgo } } } } },
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
      funnel: {
        leads: leadsCount,
        scheduled: scheduledCount,
        visited: visitedCount,
        inTreatment: patientsInTreatment,
        completed: completedCount,
      },
      monthRevenue: Number(monthRevAgg._sum.amount || 0),
      totalRevenue: Number(totalRevAgg._sum.amount || 0),
      pendingPayments: Number(pendingAgg._sum.amount || 0),
    }
  } catch {
    // БД недоступна
  }

  return <OwnerDashboard stats={stats} />
}
