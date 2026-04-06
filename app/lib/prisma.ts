import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // В dev логи запросов отключены — включайте ["query"] при отладке (иначе тормозит)
    log: process.env.NODE_ENV === "development" ? [] : [],
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
