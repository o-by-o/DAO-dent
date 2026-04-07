import type { Metadata } from "next"
import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { PatientDetailPage } from "@/components/crm/patient-detail"

export const metadata: Metadata = {
  title: "Карточка пациента — ДаоДент CRM",
}

export default async function AdminPatientDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const { id } = await params

  const [patient, doctors, services] = await Promise.all([
    prisma.patient.findUnique({
      where: { id },
      include: {
        doctor: { select: { id: true, name: true, specialization: true } },
        appointments: {
          orderBy: { date: "desc" },
          take: 20,
          include: {
            doctor: { select: { name: true } },
            service: { select: { name: true, price: true } },
            cabinet: { select: { name: true } },
          },
        },
        treatmentPlans: {
          orderBy: { createdAt: "desc" },
          include: {
            steps: {
              orderBy: { order: "asc" },
              include: { service: { select: { name: true } } },
            },
            doctor: { select: { name: true } },
          },
        },
        dentalChart: { orderBy: { toothNumber: "asc" } },
        notes: { orderBy: { createdAt: "desc" } },
        payments: { orderBy: { createdAt: "desc" }, take: 20 },
        documents: { orderBy: { createdAt: "desc" } },
      },
    }),
    prisma.user.findMany({
      where: { role: "DOCTOR" },
      select: { id: true, name: true, specialization: true },
    }),
    prisma.service.findMany({
      where: { published: true },
      orderBy: { order: "asc" },
      select: { id: true, name: true, durationMin: true, price: true },
    }),
  ])

  if (!patient) notFound()

  return (
    <PatientDetailPage
      patient={patient}
      doctors={doctors}
      services={services}
    />
  )
}
