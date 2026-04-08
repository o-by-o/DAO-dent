import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST /api/leads/[id]/convert — конвертация лида в пациента
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 })

  const { id } = await params

  const lead = await prisma.lead.findUnique({ where: { id } })
  if (!lead) return NextResponse.json({ error: "Заявка не найдена" }, { status: 404 })

  if (lead.status === "CONVERTED") {
    return NextResponse.json({ error: "Заявка уже конвертирована" }, { status: 400 })
  }

  // Парсим имя (пробуем разделить на фамилию и имя)
  const nameParts = (lead.name || "").trim().split(/\s+/)
  const firstName = nameParts[0] || "Не указано"
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : ""

  // Создаём пациента
  const patient = await prisma.patient.create({
    data: {
      firstName,
      lastName: lastName || firstName,
      phone: lead.phone || "",
      email: lead.email,
      source: lead.channel === "WEBSITE_FORM" ? "WEBSITE"
        : lead.channel === "PHONE_CALL" || lead.channel === "CALLBACK" ? "PHONE"
        : lead.channel === "WHATSAPP" ? "MESSENGER"
        : lead.channel === "TELEGRAM" ? "MESSENGER"
        : lead.channel === "VK" ? "SOCIAL_MEDIA"
        : lead.channel === "AI_CHAT" ? "WEBSITE"
        : "OTHER",
      status: "CONTACTED",
      utmSource: lead.utmSource,
      utmMedium: lead.utmMedium,
      utmCampaign: lead.utmCampaign,
    },
  })

  // Привязываем лид к пациенту и обновляем статус
  await prisma.lead.update({
    where: { id },
    data: { status: "CONVERTED", patientId: patient.id },
  })

  return NextResponse.json({ patientId: patient.id, patient })
}
