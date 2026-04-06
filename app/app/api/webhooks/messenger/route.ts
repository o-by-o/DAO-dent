import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * POST /api/webhooks/messenger
 * Заготовка для приёма заявок из мессенджеров (Telegram, WhatsApp и т.д.).
 * Тело запроса зависит от провайдера. При необходимости добавить проверку подписи.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({})) as {
      channel?: string
      externalId?: string
      threadId?: string
      name?: string
      phone?: string
      email?: string
      message?: string
    }

    const channel = (body.channel ?? "OTHER") as "TELEGRAM" | "WHATSAPP" | "WEB_FORM" | "OTHER"
    const externalId = String(body.externalId ?? "").trim()
    const threadId = body.threadId ?? body.externalId ?? ""
    const name = (body.name ?? "Клиент из мессенджера").trim()
    const phone = body.phone?.trim() ?? null
    const email = body.email?.trim() ?? null
    const rawMessage = body.message?.trim() ?? ""

    if (!externalId && !threadId) {
      return NextResponse.json(
        { error: "Нужен externalId или threadId для идентификации контакта" },
        { status: 400 }
      )
    }

    const externalKey = externalId || threadId

    let client = await prisma.client.findFirst({
      where: {
        source: "MESSENGER_LEAD",
        externalId: externalKey,
      },
    })

    if (!client) {
      client = await prisma.client.create({
        data: {
          name,
          email,
          phone,
          source: "MESSENGER_LEAD",
          externalId: externalKey,
        },
      })
    }

    await prisma.lead.create({
      data: {
        clientId: client.id,
        channel,
        externalThreadId: threadId || null,
        rawMessage: rawMessage || null,
        status: "NEW",
      },
    })

    return NextResponse.json({
      ok: true,
      clientId: client.id,
      message: "Заявка сохранена",
    })
  } catch (e) {
    console.error("[webhooks/messenger]", e)
    return NextResponse.json(
      { error: "Ошибка обработки webhook" },
      { status: 500 }
    )
  }
}
