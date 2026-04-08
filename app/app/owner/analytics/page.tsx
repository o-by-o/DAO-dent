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
    dailyRevenue: [] as Array<{ date: string; revenue: number; appointments: number }>,
    avgCheckByDoctor: [] as Array<{ name: string; avgCheck: number; totalRevenue: number; count: number }>,
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
      dailyRevenue: [] as Array<{ date: string; revenue: number; appointments: number }>,
      avgCheckByDoctor: [] as Array<{ name: string; avgCheck: number; totalRevenue: number; count: number }>,
    }

    // Данные по дням за 30 дней для графика
    try {
      const payments = await prisma.payment.findMany({
        where: { status: "PAID", createdAt: { gte: monthAgo } },
        select: { amount: true, createdAt: true },
      })

      const appointmentsByDate = await prisma.appointment.findMany({
        where: { date: { gte: monthAgo }, status: "COMPLETED" },
        select: { date: true },
      })

      // Группируем по дням
      const dailyMap = new Map<string, { revenue: number; appointments: number }>()
      for (let d = new Date(monthAgo); d <= today; d.setDate(d.getDate() + 1)) {
        const key = d.toISOString().split("T")[0]
        dailyMap.set(key, { revenue: 0, appointments: 0 })
      }

      for (const p of payments) {
        const key = p.createdAt.toISOString().split("T")[0]
        const entry = dailyMap.get(key)
        if (entry) entry.revenue += Number(p.amount)
      }

      for (const a of appointmentsByDate) {
        const key = a.date.toISOString().split("T")[0]
        const entry = dailyMap.get(key)
        if (entry) entry.appointments += 1
      }

      stats.dailyRevenue = Array.from(dailyMap.entries())
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => a.date.localeCompare(b.date))

      // Средний чек по врачам
      const doctorPayments = await prisma.payment.findMany({
        where: { status: "PAID" },
        select: {
          amount: true,
          appointment: {
            select: { doctor: { select: { name: true } } },
          },
        },
      })

      const doctorStats = new Map<string, { total: number; count: number }>()
      for (const p of doctorPayments) {
        const name = p.appointment?.doctor?.name || "Без врача"
        const entry = doctorStats.get(name) || { total: 0, count: 0 }
        entry.total += Number(p.amount)
        entry.count += 1
        doctorStats.set(name, entry)
      }

      stats.avgCheckByDoctor = Array.from(doctorStats.entries()).map(([name, d]) => ({
        name,
        avgCheck: d.count > 0 ? Math.round(d.total / d.count) : 0,
        totalRevenue: d.total,
        count: d.count,
      }))
    } catch {
      // Ошибка агрегации — не критично
    }
  } catch {
    // БД недоступна
  }

  return <OwnerDashboard stats={stats} />
}
