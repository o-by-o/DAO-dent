import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/** GET /api/admin/clients/[id] — один клиент с заявками */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      leads: { orderBy: { createdAt: "desc" } },
      user: { select: { id: true, email: true, name: true } },
    },
  })

  if (!client) {
    return NextResponse.json({ error: "Клиент не найден" }, { status: 404 })
  }

  return NextResponse.json({
    client: {
      id: client.id,
      name: client.name,
      email: client.email,
      phone: client.phone,
      source: client.source,
      externalId: client.externalId,
      userId: client.userId,
      createdAt: client.createdAt.toISOString(),
      updatedAt: client.updatedAt.toISOString(),
      user: client.user
        ? { id: client.user.id, email: client.user.email, name: client.user.name }
        : null,
      leads: client.leads.map((l) => ({
        id: l.id,
        channel: l.channel,
        status: l.status,
        externalThreadId: l.externalThreadId,
        rawMessage: l.rawMessage,
        createdAt: l.createdAt.toISOString(),
        updatedAt: l.updatedAt.toISOString(),
      })),
    },
  })
}

/** PATCH /api/admin/clients/[id] — обновить клиента */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json() as { name?: string; email?: string; phone?: string; userId?: string | null; birthDate?: string | null }

  const data: { name?: string; email?: string | null; phone?: string | null; userId?: string | null; birthDate?: Date | null } = {}
  if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim()
  if ("email" in body) data.email = body.email?.trim() || null
  if ("phone" in body) data.phone = body.phone?.trim() || null
  if ("userId" in body) data.userId = body.userId?.trim() || null
  if ("birthDate" in body) data.birthDate = body.birthDate ? new Date(body.birthDate) : null

  const client = await prisma.client.update({
    where: { id },
    data,
  })

  return NextResponse.json({
    client: {
      id: client.id,
      name: client.name,
      email: client.email,
      phone: client.phone,
      userId: client.userId,
      updatedAt: client.updatedAt.toISOString(),
    },
  })
}
