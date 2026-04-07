import type { Metadata } from "next"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ServicesManagementPage } from "@/components/admin/services-management"

export const metadata: Metadata = {
  title: "Управление услугами — ДаоДент",
}

export default async function AdminServicesPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  let categories: Array<{
    id: string
    name: string
    slug: string
    order: number
    services: Array<{
      id: string
      name: string
      slug: string
      price: { toString(): string }
      priceMax: { toString(): string } | null
      durationMin: number
      published: boolean
      order: number
    }>
  }> = []

  try {
    categories = await prisma.serviceCategory.findMany({
      orderBy: { order: "asc" },
      include: {
        services: { orderBy: { order: "asc" } },
      },
    })
  } catch {
    // БД недоступна
  }

  return <ServicesManagementPage categories={categories} />
}
