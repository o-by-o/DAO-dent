import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logAudit } from "@/lib/audit"

// GET /api/admin/patients — список пациентов
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status")
  const search = searchParams.get("search")
  const page = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "50")

  const where: Record<string, unknown> = {}
  if (status) where.status = status
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
      { phone: { contains: search } },
      { email: { contains: search, mode: "insensitive" } },
    ]
  }

  const [patients, total] = await Promise.all([
    prisma.patient.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        doctor: { select: { id: true, name: true } },
        _count: { select: { appointments: true } },
      },
    }),
    prisma.patient.count({ where }),
  ])

  return NextResponse.json({ patients, total, page, limit })
}

// POST /api/admin/patients — создание пациента
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 })

  const body = await req.json()
  const { firstName, lastName, middleName, phone, email, birthDate, source, doctorId } = body

  if (!firstName || !lastName || !phone) {
    return NextResponse.json({ error: "ФИО и телефон обязательны" }, { status: 400 })
  }

  const patient = await prisma.patient.create({
    data: {
      firstName,
      lastName,
      middleName,
      phone,
      email,
      birthDate: birthDate ? new Date(birthDate) : null,
      source: source || "OTHER",
      doctorId: doctorId || null,
      status: "NEW_LEAD",
    },
  })

  await logAudit({
    userId: session.user.id,
    action: "patient.create",
    entity: "patient",
    entityId: patient.id,
    details: { firstName, lastName, phone },
  })

  return NextResponse.json(patient)
}
