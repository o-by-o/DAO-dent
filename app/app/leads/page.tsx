import type { Metadata } from "next"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { LeadsListPage } from "@/components/crm/leads-list"

export const metadata: Metadata = {
  title: "Заявки — ДаоДент CRM",
}

export default async function LeadsPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  let leads: Array<{
    id: string
    name: string | null
    phone: string | null
    email: string | null
    channel: string
    service: string | null
    message: string | null
    status: string
    createdAt: Date
    patient: { id: string; firstName: string; lastName: string } | null
  }> = []

  try {
    leads = await prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
      },
    })
  } catch {
    // БД недоступна
  }

  return <LeadsListPage leads={leads} />
}
