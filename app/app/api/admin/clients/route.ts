import { NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/** GET /api/admin/clients — список клиентов (только ADMIN). Query: search, source */
export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const search = searchParams.get("search")?.trim() ?? ""
  const source = searchParams.get("source")?.trim() ?? ""

  const where: Prisma.ClientWhereInput = {}
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
    ]
  }
  if (source && ["WEBSITE_USER", "MESSENGER_LEAD", "MANUAL"].includes(source)) {
    where.source = source as "WEBSITE_USER" | "MESSENGER_LEAD" | "MANUAL"
  }

  const clients = await prisma.client.findMany({
    where,
    include: {
      leads: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true, status: true, channel: true, createdAt: true, rawMessage: true },
      },
      _count: { select: { leads: true } },
    },
    orderBy: { updatedAt: "desc" },
  })

  const list = clients.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    source: c.source,
    externalId: c.externalId,
    userId: c.userId,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    lastLead: c.leads[0]
      ? {
          id: c.leads[0].id,
          status: c.leads[0].status,
          channel: c.leads[0].channel,
          createdAt: c.leads[0].createdAt.toISOString(),
          rawMessage: c.leads[0].rawMessage,
        }
      : null,
    leadsCount: c._count.leads,
  }))

  return NextResponse.json({ clients: list })
}

/** POST /api/admin/clients — создать клиента вручную */
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { name, email, phone } = body as { name: string; email?: string; phone?: string }
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Укажите имя" }, { status: 400 })
    }

    const client = await prisma.client.create({
      data: {
        name: name.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        source: "MANUAL",
      },
    })

    return NextResponse.json({
      client: {
        id: client.id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        source: client.source,
        createdAt: client.createdAt.toISOString(),
      },
    })
  } catch (e) {
    return NextResponse.json({ error: "Не удалось создать клиента" }, { status: 500 })
  }
}
