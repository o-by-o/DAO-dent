import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/admin/patients/[id]/dental-chart — зубная формула пациента
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 })

  const { id } = await params

  const teeth = await prisma.toothRecord.findMany({
    where: { patientId: id },
    orderBy: { toothNumber: "asc" },
  })

  return NextResponse.json(teeth)
}

// PUT /api/admin/patients/[id]/dental-chart — обновление зуба
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 })

  const role = (session.user as { role: string }).role
  if (!["OWNER", "MANAGER", "DOCTOR"].includes(role)) {
    return NextResponse.json({ error: "Недостаточно прав" }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()
  const { toothNumber, status, notes } = body

  if (!toothNumber || !status) {
    return NextResponse.json({ error: "toothNumber и status обязательны" }, { status: 400 })
  }

  const tooth = await prisma.toothRecord.upsert({
    where: {
      patientId_toothNumber: { patientId: id, toothNumber },
    },
    update: { status, notes: notes || null },
    create: {
      patientId: id,
      toothNumber,
      status,
      notes: notes || null,
    },
  })

  return NextResponse.json(tooth)
}
