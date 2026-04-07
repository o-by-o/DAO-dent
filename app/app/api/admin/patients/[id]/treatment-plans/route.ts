import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST /api/admin/patients/[id]/treatment-plans — создание плана лечения
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 })

  const role = (session.user as { role: string }).role
  if (!["OWNER", "MANAGER", "DOCTOR"].includes(role)) {
    return NextResponse.json({ error: "Только врач может создавать планы лечения" }, { status: 403 })
  }

  const { id: patientId } = await params
  const body = await req.json()
  const { title, description, steps } = body

  if (!title) {
    return NextResponse.json({ error: "Название плана обязательно" }, { status: 400 })
  }

  // Считаем общую стоимость из шагов
  const totalCost = (steps || []).reduce(
    (sum: number, step: { cost?: number }) => sum + (step.cost || 0),
    0,
  )

  const plan = await prisma.treatmentPlan.create({
    data: {
      patientId,
      doctorId: session.user.id,
      title,
      description: description || null,
      totalCost,
      status: "DRAFT",
      steps: {
        create: (steps || []).map(
          (
            step: {
              description: string
              serviceId?: string
              toothNumber?: number
              cost?: number
            },
            index: number,
          ) => ({
            description: step.description,
            serviceId: step.serviceId || null,
            toothNumber: step.toothNumber || null,
            cost: step.cost || 0,
            order: index,
          }),
        ),
      },
    },
    include: {
      steps: { orderBy: { order: "asc" } },
    },
  })

  // Обновляем статус пациента
  await prisma.patient.updateMany({
    where: {
      id: patientId,
      status: { in: ["VISITED", "APPOINTMENT_SCHEDULED"] },
    },
    data: { status: "TREATMENT_PLAN" },
  })

  return NextResponse.json(plan)
}
