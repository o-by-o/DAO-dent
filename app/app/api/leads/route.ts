import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// POST /api/leads — создание лида с лендинга (публичный)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, phone, email, service, message, channel } = body

    if (!phone) {
      return NextResponse.json({ error: "Телефон обязателен" }, { status: 400 })
    }

    const lead = await prisma.lead.create({
      data: {
        name: name || null,
        phone,
        email: email || null,
        service: service || null,
        message: message || null,
        channel: channel || "WEBSITE_FORM",
        status: "NEW",
      },
    })

    return NextResponse.json({ id: lead.id, status: "ok" })
  } catch (error) {
    console.error("Ошибка создания лида:", error)
    return NextResponse.json({ error: "Внутренняя ошибка" }, { status: 500 })
  }
}

// GET /api/leads — список заявок (для CRM, авторизованный)
export async function GET() {
  try {
    const leads = await prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        patient: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    })

    return NextResponse.json(leads)
  } catch (error) {
    console.error("Ошибка получения лидов:", error)
    return NextResponse.json({ error: "Внутренняя ошибка" }, { status: 500 })
  }
}
