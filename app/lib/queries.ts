import { prisma } from "@/lib/prisma"

/**
 * Статистика для дашборда владельца
 */
export async function getDashboardStats() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [totalPatients, todayAppointments, newLeads, patientsInTreatment] = await Promise.all([
    prisma.patient.count(),
    prisma.appointment.count({ where: { date: { gte: today } } }),
    prisma.lead.count({ where: { status: "NEW" } }),
    prisma.patient.count({ where: { status: "IN_TREATMENT" } }),
  ])

  return { totalPatients, todayAppointments, newLeads, patientsInTreatment }
}

/**
 * Приёмы врача на определённую дату
 */
export async function getDoctorAppointments(doctorId: string, date: Date) {
  return prisma.appointment.findMany({
    where: { doctorId, date },
    orderBy: { startTime: "asc" },
    include: {
      patient: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          allergies: true,
        },
      },
      service: { select: { name: true, price: true } },
      cabinet: { select: { name: true, number: true } },
    },
  })
}

/**
 * Поиск пациентов
 */
export async function searchPatients(query: string, limit = 20) {
  return prisma.patient.findMany({
    where: {
      OR: [
        { firstName: { contains: query, mode: "insensitive" } },
        { lastName: { contains: query, mode: "insensitive" } },
        { phone: { contains: query } },
      ],
    },
    orderBy: { updatedAt: "desc" },
    take: limit,
    include: {
      doctor: { select: { name: true } },
    },
  })
}

/**
 * Список услуг с категориями
 */
export async function getServicesWithCategories() {
  return prisma.serviceCategory.findMany({
    orderBy: { order: "asc" },
    include: {
      services: {
        where: { published: true },
        orderBy: { order: "asc" },
      },
    },
  })
}

/**
 * Список врачей
 */
export async function getDoctors() {
  return prisma.user.findMany({
    where: { role: "DOCTOR" },
    select: {
      id: true,
      name: true,
      specialization: true,
      experience: true,
      bio: true,
      avatarUrl: true,
    },
  })
}

/**
 * Свободные слоты для записи
 */
export async function getAvailableSlots(doctorId: string, date: Date) {
  const appointments = await prisma.appointment.findMany({
    where: {
      doctorId,
      date,
      status: { notIn: ["CANCELLED", "NO_SHOW"] },
    },
    select: { startTime: true, endTime: true },
  })

  // Генерируем все возможные слоты с 9:00 до 21:00 с шагом 30 мин
  const allSlots: string[] = []
  for (let h = 9; h < 21; h++) {
    allSlots.push(`${String(h).padStart(2, "0")}:00`)
    allSlots.push(`${String(h).padStart(2, "0")}:30`)
  }

  // Фильтруем занятые
  const busyTimes = new Set(appointments.map((a) => a.startTime))
  return allSlots.filter((slot) => !busyTimes.has(slot))
}
