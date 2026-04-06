import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { AdminClientDetailClient } from "./admin-client-detail-client"

export default async function AdminClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      leads: { orderBy: { createdAt: "desc" } },
      user: { select: { id: true, email: true, name: true } },
      notes: { orderBy: { createdAt: "desc" } },
    },
  })

  if (!client) notFound()

  const data = {
    id: client.id,
    name: client.name,
    email: client.email,
    phone: client.phone,
    birthDate: client.birthDate?.toISOString() ?? null,
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
    notes: client.notes.map((n) => ({
      id: n.id,
      text: n.text,
      callAt: n.callAt?.toISOString() ?? null,
      createdAt: n.createdAt.toISOString(),
    })),
  }

  return <AdminClientDetailClient client={data} />
}
