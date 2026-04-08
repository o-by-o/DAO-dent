/**
 * AI-инструменты для управляющего клиникой
 * Используются через Vercel AI SDK tool-calls
 */
import { tool } from "ai"
import { z } from "zod"
import { prisma } from "@/lib/prisma"

/** Получить сводку по клинике за период */
export const getClinicStats = tool({
  description: "Получить статистику клиники: приёмы, пациенты, заявки, выручка за указанный период",
  inputSchema: z.object({
    period: z.enum(["today", "week", "month", "quarter", "year"]).describe("Период для статистики"),
  }),
  execute: async ({ period }) => {
    const now = new Date()
    const start = new Date(now)

    switch (period) {
      case "today": start.setHours(0, 0, 0, 0); break
      case "week": start.setDate(start.getDate() - 7); break
      case "month": start.setMonth(start.getMonth() - 1); break
      case "quarter": start.setMonth(start.getMonth() - 3); break
      case "year": start.setFullYear(start.getFullYear() - 1); break
    }

    const [appointments, newPatients, leads, revenue, paidCount] = await Promise.all([
      prisma.appointment.count({ where: { date: { gte: start } } }),
      prisma.patient.count({ where: { createdAt: { gte: start } } }),
      prisma.lead.count({ where: { createdAt: { gte: start } } }),
      prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "PAID", createdAt: { gte: start } } }),
      prisma.payment.count({ where: { status: "PAID", createdAt: { gte: start } } }),
    ])

    const totalRevenue = Number(revenue._sum.amount || 0)
    const avgCheck = paidCount > 0 ? Math.round(totalRevenue / paidCount) : 0

    return {
      period,
      appointments,
      newPatients,
      leads,
      totalRevenue,
      avgCheck,
      conversionRate: leads > 0 ? `${Math.round((newPatients / leads) * 100)}%` : "нет данных",
    }
  },
})

/** Загруженность врачей */
export const getDoctorWorkload = tool({
  description: "Показать загруженность каждого врача: количество приёмов, пациентов, средний чек",
  inputSchema: z.object({
    period: z.enum(["week", "month"]).default("week"),
  }),
  execute: async ({ period }) => {
    const start = new Date()
    period === "week" ? start.setDate(start.getDate() - 7) : start.setMonth(start.getMonth() - 1)

    const doctors = await prisma.user.findMany({
      where: { role: "DOCTOR" },
      select: {
        id: true,
        name: true,
        specialization: true,
        _count: {
          select: {
            appointments: { where: { date: { gte: start } } },
            patients: true,
          },
        },
      },
    })

    return doctors.map((d) => ({
      name: d.name,
      specialization: d.specialization,
      appointmentsCount: d._count.appointments,
      totalPatients: d._count.patients,
    }))
  },
})

/** Воронка конверсий */
export const getConversionFunnel = tool({
  description: "Показать воронку конверсий пациентов: сколько на каждом этапе от заявки до завершения лечения",
  inputSchema: z.object({}),
  execute: async () => {
    const statuses = [
      "NEW_LEAD", "CONTACTED", "APPOINTMENT_SCHEDULED",
      "VISITED", "TREATMENT_PLAN", "IN_TREATMENT", "TREATMENT_COMPLETED", "LOST",
    ] as const

    const counts = await Promise.all(
      statuses.map(async (status) => ({
        status,
        count: await prisma.patient.count({ where: { status } }),
      })),
    )

    const labels: Record<string, string> = {
      NEW_LEAD: "Новые лиды",
      CONTACTED: "Контакт установлен",
      APPOINTMENT_SCHEDULED: "Записаны на приём",
      VISITED: "Были на приёме",
      TREATMENT_PLAN: "Составлен план",
      IN_TREATMENT: "На лечении",
      TREATMENT_COMPLETED: "Завершили лечение",
      LOST: "Потерянные",
    }

    return counts.map((c) => ({ ...c, label: labels[c.status] || c.status }))
  },
})

/** Статус кабинетов */
export const getCabinetStatus = tool({
  description: "Показать текущий статус кабинетов клиники и приёмы на сегодня",
  inputSchema: z.object({}),
  execute: async () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [cabinets, todayAppointments] = await Promise.all([
      prisma.cabinet.findMany({ orderBy: { number: "asc" } }),
      prisma.appointment.findMany({
        where: { date: { gte: today } },
        include: {
          patient: { select: { firstName: true, lastName: true } },
          doctor: { select: { name: true } },
          cabinet: { select: { name: true } },
        },
        orderBy: { startTime: "asc" },
      }),
    ])

    return {
      cabinets: cabinets.map((c) => ({ name: c.name, number: c.number, status: c.status })),
      todaySchedule: todayAppointments.map((a) => ({
        time: `${a.startTime}-${a.endTime}`,
        patient: `${a.patient.lastName} ${a.patient.firstName}`,
        doctor: a.doctor?.name,
        cabinet: a.cabinet?.name,
        status: a.status,
      })),
    }
  },
})

/** Поиск пациента */
export const searchPatient = tool({
  description: "Найти пациента по ФИО или телефону",
  inputSchema: z.object({
    query: z.string().describe("Имя, фамилия или номер телефона пациента"),
  }),
  execute: async ({ query }) => {
    const patients = await prisma.patient.findMany({
      where: {
        OR: [
          { firstName: { contains: query, mode: "insensitive" } },
          { lastName: { contains: query, mode: "insensitive" } },
          { phone: { contains: query } },
        ],
      },
      take: 5,
      include: {
        doctor: { select: { name: true } },
        _count: { select: { appointments: true } },
      },
    })

    return patients.map((p) => ({
      id: p.id,
      name: `${p.lastName} ${p.firstName} ${p.middleName || ""}`.trim(),
      phone: p.phone,
      status: p.status,
      doctor: p.doctor?.name,
      appointments: p._count.appointments,
    }))
  },
})
