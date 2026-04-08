import type { Metadata } from "next"
import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { AppointmentSessionPage } from "@/components/doctor/appointment-session"

export const metadata: Metadata = {
  title: "Ведение приёма — ДаоДент",
}

export default async function AppointmentSessionRoute({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const { id } = await params

  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: {
      patient: {
        include: {
          dentalChart: { orderBy: { toothNumber: "asc" } },
          medicalRecords: { orderBy: { date: "desc" }, take: 10 },
          treatmentPlans: {
            where: { status: { in: ["APPROVED", "IN_PROGRESS"] } },
            include: { steps: { orderBy: { order: "asc" } } },
          },
        },
      },
      service: true,
      cabinet: true,
    },
  })

  if (!appointment) notFound()

  return <AppointmentSessionPage appointment={appointment} />
}
