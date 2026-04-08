import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import {
  generateConsentForm,
  generatePersonalDataConsent,
  generateMedicalExtract,
  generateTreatmentCertificate,
} from "@/lib/medical-documents"

/**
 * POST /api/admin/patients/[id]/documents
 * Генерация медицинского документа (HTML для печати)
 *
 * Body: { type: "consent" | "personal_data" | "extract" | "certificate", procedures?: string[], ... }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { type } = body

  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      doctor: { select: { name: true, specialization: true } },
      appointments: {
        where: { status: "COMPLETED" },
        orderBy: { date: "desc" },
        take: 20,
        select: { date: true, diagnosis: true, treatment: true },
      },
    },
  })

  if (!patient) return NextResponse.json({ error: "Пациент не найден" }, { status: 404 })

  const patientData = {
    firstName: patient.firstName,
    lastName: patient.lastName,
    middleName: patient.middleName,
    birthDate: patient.birthDate?.toISOString() || null,
    phone: patient.phone,
    address: patient.address,
    passportData: patient.passportData,
  }

  const doctorData = patient.doctor || {
    name: (session.user as { name?: string }).name || "Врач",
    specialization: null,
  }

  let html: string

  switch (type) {
    case "consent":
      html = generateConsentForm(
        patientData,
        doctorData,
        body.procedures || ["Осмотр полости рта", "Лечение по плану"],
      )
      break

    case "personal_data":
      html = generatePersonalDataConsent(patientData)
      break

    case "extract":
      html = generateMedicalExtract(
        patientData,
        doctorData,
        patient.appointments
          .filter((a) => a.diagnosis)
          .map((a) => ({
            date: a.date.toISOString(),
            diagnosis: a.diagnosis || "",
            treatment: a.treatment || "",
          })),
      )
      break

    case "certificate":
      html = generateTreatmentCertificate(
        patientData,
        doctorData,
        body.diagnosis || "—",
        body.treatment || "—",
        body.dateFrom || new Date().toISOString(),
        body.dateTo || new Date().toISOString(),
      )
      break

    default:
      return NextResponse.json({ error: "Неизвестный тип документа" }, { status: 400 })
  }

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  })
}
