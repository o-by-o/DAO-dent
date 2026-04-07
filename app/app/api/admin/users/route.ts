import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

/** GET /api/admin/users — список пользователей системы */
export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 })

  const role = (session.user as { role?: string }).role
  if (role !== "OWNER" && role !== "MANAGER") {
    return NextResponse.json({ error: "Недостаточно прав" }, { status: 403 })
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      phone: true,
      specialization: true,
      experience: true,
      createdAt: true,
      _count: {
        select: { appointments: true },
      },
    },
  })

  return NextResponse.json({ users })
}

/** POST /api/admin/users — создать пользователя (врач, администратор и т.д.) */
export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 })

  const currentRole = (session.user as { role?: string }).role
  if (currentRole !== "OWNER" && currentRole !== "MANAGER") {
    return NextResponse.json({ error: "Недостаточно прав" }, { status: 403 })
  }

  const body = await request.json()
  const { email, name, role, phone, specialization, experience, password } = body

  if (!email || !name || !role) {
    return NextResponse.json({ error: "email, name и role обязательны" }, { status: 400 })
  }

  // Проверяем, что email свободен
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: "Пользователь с таким email уже существует" }, { status: 400 })
  }

  const hashedPassword = await bcrypt.hash(password || "daodent2026", 12)

  const user = await prisma.user.create({
    data: {
      email,
      name,
      role,
      phone: phone || null,
      specialization: specialization || null,
      experience: experience || null,
      hashedPassword,
    },
  })

  return NextResponse.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  })
}
