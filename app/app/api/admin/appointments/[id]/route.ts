import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// PATCH /api/admin/appointments/[id] — обновление приёма
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const appointment = await prisma.appointment.update({
    where: { id },
    data: {
      ...(body.status && { status: body.status }),
      ...(body.diagnosis !== undefined && { diagnosis: body.diagnosis }),
      ...(body.treatment !== undefined && { treatment: body.treatment }),
      ...(body.materials !== undefined && { materials: body.materials }),
      ...(body.recommendations !== undefined && { recommendations: body.recommendations }),
      ...(body.notes !== undefined && { notes: body.notes }),
    },
  })

  // При завершении обновляем статус пациента
  if (body.status === "COMPLETED") {
    await prisma.patient.updateMany({
      where: {
        id: appointment.patientId,
        status: { in: ["APPOINTMENT_SCHEDULED", "NEW_LEAD", "CONTACTED"] },
      },
      data: { status: "VISITED" },
    })
  }

  return NextResponse.json(appointment)
}
