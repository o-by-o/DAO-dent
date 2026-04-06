import { syncClientsFromUsers } from "@/lib/clients"
import { prisma } from "@/lib/prisma"
import { AdminClientsClient } from "./admin-clients-client"

export default async function AdminClientsPage() {
  await syncClientsFromUsers()

  const clients = await prisma.client.findMany({
    include: {
      leads: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          status: true,
          channel: true,
          createdAt: true,
          rawMessage: true,
        },
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

  return <AdminClientsClient initialClients={list} />
}
