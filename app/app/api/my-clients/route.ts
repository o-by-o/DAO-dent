import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

/** GET — мои клиенты (скоуп по ownerId = текущий юзер) */
export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const clients = await prisma.client.findMany({
    where: { ownerId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      notes: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  })

  return NextResponse.json(
    clients.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      birthDate: c.birthDate?.toISOString() ?? null,
      lastNote: c.notes[0]?.text ?? null,
      createdAt: c.createdAt.toISOString(),
    })),
  )
}

/** POST — создать клиента */
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { name, email, phone, birthDate } = (await req.json()) as {
    name: string; email?: string; phone?: string; birthDate?: string
  }

  if (!name?.trim()) return NextResponse.json({ error: "Имя обязательно" }, { status: 400 })

  const client = await prisma.client.create({
    data: {
      name: name.trim(),
      email: email?.trim() || null,
      phone: phone?.trim() || null,
      birthDate: birthDate ? new Date(birthDate) : null,
      source: "MANUAL",
      ownerId: session.user.id,
    },
  })

  return NextResponse.json({ id: client.id })
}
