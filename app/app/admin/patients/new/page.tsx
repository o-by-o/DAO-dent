import type { Metadata } from "next"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { NewPatientForm } from "@/components/crm/new-patient-form"

export const metadata: Metadata = {
  title: "Новый пациент — ДаоДент CRM",
}

export default async function NewPatientPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  let doctors: Array<{ id: string; name: string | null; specialization: string | null }> = []

  try {
    doctors = await prisma.user.findMany({
      where: { role: "DOCTOR" },
      select: { id: true, name: true, specialization: true },
    })
  } catch {
    // БД недоступна
  }

  return <NewPatientForm doctors={doctors} />
}
