import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/admin/patients/[id] — карточка пациента
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 })

  const { id } = await params

  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      doctor: { select: { id: true, name: true, specialization: true } },
      appointments: {
        orderBy: { date: "desc" },
        take: 20,
        include: {
          doctor: { select: { name: true } },
          service: { select: { name: true } },
        },
      },
      treatmentPlans: {
        orderBy: { createdAt: "desc" },
        include: {
          steps: { orderBy: { order: "asc" } },
          doctor: { select: { name: true } },
        },
      },
      dentalChart: { orderBy: { toothNumber: "asc" } },
      notes: { orderBy: { createdAt: "desc" } },
      payments: { orderBy: { createdAt: "desc" } },
      documents: { orderBy: { createdAt: "desc" } },
    },
  })

  if (!patient) return NextResponse.json({ error: "Пациент не найден" }, { status: 404 })

  return NextResponse.json(patient)
}

// PATCH /api/admin/patients/[id] — обновление пациента
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const patient = await prisma.patient.update({
    where: { id },
    data: body,
  })

  return NextResponse.json(patient)
}
