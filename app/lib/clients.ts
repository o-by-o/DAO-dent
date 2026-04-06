import { prisma } from "@/lib/prisma"

/**
 * Создаёт записи Client для пользователей (STUDENT), у которых ещё нет клиентской записи.
 * Вызывать при заходе в раздел «Клиентская база» или по крону.
 */
export async function syncClientsFromUsers(): Promise<{ created: number }> {
  const users = await prisma.user.findMany({
    where: { role: "STUDENT" },
    select: { id: true, email: true, name: true },
  })

  const existingClients = await prisma.client.findMany({
    where: { userId: { not: null } },
    select: { userId: true },
  })
  const existingUserIds = new Set(
    (existingClients.map((c) => c.userId).filter(Boolean) as string[]) ?? []
  )

  const toCreate = users.filter((u) => !existingUserIds.has(u.id))
  if (toCreate.length === 0) return { created: 0 }

  for (const user of toCreate) {
    await prisma.client.create({
      data: {
        name: user.name ?? user.email,
        email: user.email,
        source: "WEBSITE_USER",
        externalId: user.id,
        userId: user.id,
      },
    })
  }

  return { created: toCreate.length }
}
