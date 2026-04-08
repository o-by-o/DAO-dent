import type { Metadata } from "next"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { PaymentsPage } from "@/components/owner/payments-page"

export const metadata: Metadata = {
  title: "Оплаты — ДаоДент",
}

export default async function OwnerPaymentsRoute() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const role = (session.user as { role: string }).role
  if (role !== "OWNER") redirect("/home")

  let payments: Array<{
    id: string
    amount: { toString(): string }
    method: string
    status: string
    description: string | null
    createdAt: Date
    patient: { id: string; firstName: string; lastName: string }
    appointment: { id: string; date: Date; startTime: string; service: { name: string } | null } | null
  }> = []

  let stats = { totalRevenue: 0, monthRevenue: 0, pendingAmount: 0, paymentCount: 0 }

  try {
    payments = await prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        appointment: {
          select: { id: true, date: true, startTime: true, service: { select: { name: true } } },
        },
      },
    })

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const [totalAgg, monthAgg, pendingAgg] = await Promise.all([
      prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "PAID" } }),
      prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "PAID", createdAt: { gte: monthStart } } }),
      prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "PENDING" } }),
    ])

    stats = {
      totalRevenue: Number(totalAgg._sum.amount || 0),
      monthRevenue: Number(monthAgg._sum.amount || 0),
      pendingAmount: Number(pendingAgg._sum.amount || 0),
      paymentCount: payments.length,
    }
  } catch {
    // БД недоступна
  }

  return <PaymentsPage payments={payments} stats={stats} />
}
