import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/admin/appointments — список приёмов
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const date = searchParams.get("date")
  const doctorId = searchParams.get("doctorId")
  const status = searchParams.get("status")

  const where: Record<string, unknown> = {}
  if (date) where.date = new Date(date)
  if (doctorId) where.doctorId = doctorId
  if (status) where.status = status

  const appointments = await prisma.appointment.findMany({
    where,
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
    include: {
      patient: { select: { id: true, firstName: true, lastName: true, phone: true } },
      doctor: { select: { id: true, name: true, specialization: true } },
      cabinet: { select: { id: true, name: true, number: true } },
      service: { select: { id: true, name: true, price: true } },
    },
  })

  return NextResponse.json(appointments)
}

// POST /api/admin/appointments — создание приёма
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 })

  const body = await req.json()
  const { patientId, doctorId, cabinetId, serviceId, type, date, startTime, endTime, duration, notes } = body

  if (!patientId || !doctorId || !date || !startTime) {
    return NextResponse.json({ error: "Пациент, врач, дата и время обязательны" }, { status: 400 })
  }

  const appointment = await prisma.appointment.create({
    data: {
      patientId,
      doctorId,
      cabinetId: cabinetId || null,
      serviceId: serviceId || null,
      type: type || "INITIAL_CONSULTATION",
      date: new Date(date),
      startTime,
      endTime: endTime || startTime,
      duration: duration || 30,
      notes: notes || null,
      status: "SCHEDULED",
    },
    include: {
      patient: { select: { firstName: true, lastName: true } },
      doctor: { select: { name: true } },
    },
  })

  // Обновляем статус пациента если он NEW_LEAD
  await prisma.patient.updateMany({
    where: { id: patientId, status: "NEW_LEAD" },
    data: { status: "APPOINTMENT_SCHEDULED" },
  })

  return NextResponse.json(appointment)
}
