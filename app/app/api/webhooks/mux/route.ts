import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"

/**
 * POST /api/webhooks/mux
 *
 * Вебхук от Mux. Обновляет статус видео в БД.
 *
 * Mux отправляет события:
 *  - video.asset.ready       → видео готово к воспроизведению
 *  - video.asset.errored     → ошибка при обработке
 *  - video.upload.asset_created → загрузка завершена, ассет создан
 *
 * Подпись проверяется через MUX_WEBHOOK_SECRET (если задан).
 */
export async function POST(request: Request) {
  const rawBody = await request.text()

  // Проверяем подпись (обязательно)
  const webhookSecret = process.env.MUX_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error("Mux webhook: MUX_WEBHOOK_SECRET не настроен")
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 })
  }
  const signature = request.headers.get("mux-signature") ?? ""
  if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
    console.error("Mux webhook: неверная подпись")
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  let event: MuxWebhookEvent
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  console.log(`Mux webhook: ${event.type}`, event.data?.id ?? "")

  try {
    switch (event.type) {
      case "video.upload.asset_created": {
        // Загрузка завершена → привязываем ассет к уроку
        await handleUploadAssetCreated(event)
        break
      }

      case "video.asset.ready": {
        // Ассет готов к воспроизведению
        await handleAssetReady(event)
        break
      }

      case "video.asset.errored": {
        // Ошибка обработки
        await handleAssetErrored(event)
        break
      }

      default:
        // Игнорируем неизвестные события
        break
    }
  } catch (err) {
    console.error("Mux webhook error:", err)
  }

  return NextResponse.json({ received: true })
}

/* ------------------------------------------------------------------ */
/*  Обработчики событий                                                */
/* ------------------------------------------------------------------ */

async function handleUploadAssetCreated(event: MuxWebhookEvent) {
  const uploadId = event.data?.id
  const assetId = event.data?.asset_id
  const passthrough = event.data?.new_asset_settings?.passthrough
    ?? event.data?.passthrough

  if (!assetId) return

  // Пробуем найти урок по passthrough
  let lessonId: string | null = null
  if (passthrough) {
    try {
      const meta = JSON.parse(passthrough)
      lessonId = meta.lessonId
    } catch {
      // passthrough может быть не JSON
    }
  }

  if (!lessonId) {
    console.warn("Mux webhook: upload.asset_created без lessonId", { uploadId, assetId })
    return
  }

  await prisma.lesson.update({
    where: { id: lessonId },
    data: {
      muxAssetId: assetId,
      muxStatus: "preparing",
    },
  })

  console.log(`Mux: ассет ${assetId} привязан к уроку ${lessonId}`)
}

async function handleAssetReady(event: MuxWebhookEvent) {
  const assetId = event.data?.id
  const playbackId = event.data?.playback_ids?.[0]?.id
  const duration = event.data?.duration

  if (!assetId) return

  // Находим урок по muxAssetId
  const lesson = await prisma.lesson.findFirst({
    where: { muxAssetId: assetId },
  })

  if (!lesson) {
    // Может быть ещё не привязан — пробуем через passthrough
    const passthrough = event.data?.passthrough
    if (passthrough) {
      try {
        const meta = JSON.parse(passthrough)
        if (meta.lessonId) {
          await prisma.lesson.update({
            where: { id: meta.lessonId },
            data: {
              muxAssetId: assetId,
              muxPlaybackId: playbackId ?? null,
              muxStatus: "ready",
              ...(duration ? { durationMin: Math.ceil(duration / 60) } : {}),
            },
          })
          console.log(`Mux: видео готово для урока ${meta.lessonId}`)
          return
        }
      } catch {
        // ignore
      }
    }
    console.warn("Mux webhook: asset.ready, урок не найден", assetId)
    return
  }

  await prisma.lesson.update({
    where: { id: lesson.id },
    data: {
      muxPlaybackId: playbackId ?? null,
      muxStatus: "ready",
      ...(duration ? { durationMin: Math.ceil(duration / 60) } : {}),
    },
  })

  console.log(`Mux: видео готово для урока ${lesson.id} (${lesson.title})`)
}

async function handleAssetErrored(event: MuxWebhookEvent) {
  const assetId = event.data?.id
  if (!assetId) return

  const lesson = await prisma.lesson.findFirst({
    where: { muxAssetId: assetId },
  })

  if (!lesson) return

  await prisma.lesson.update({
    where: { id: lesson.id },
    data: { muxStatus: "errored" },
  })

  console.error(`Mux: ошибка обработки видео для урока ${lesson.id}`, event.data?.errors)
}

/* ------------------------------------------------------------------ */
/*  Проверка подписи                                                   */
/* ------------------------------------------------------------------ */

function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string,
  secret: string,
): boolean {
  // Формат: t=timestamp,v1=hash
  const parts = signatureHeader.split(",")
  const timestampPart = parts.find((p) => p.startsWith("t="))
  const signaturePart = parts.find((p) => p.startsWith("v1="))

  if (!timestampPart || !signaturePart) return false

  const timestamp = timestampPart.replace("t=", "")
  const expectedSignature = signaturePart.replace("v1=", "")

  // Защита от replay-атак: timestamp не старше 5 минут
  const timestampSec = parseInt(timestamp, 10)
  if (isNaN(timestampSec)) return false
  const nowSec = Math.floor(Date.now() / 1000)
  if (Math.abs(nowSec - timestampSec) > 300) return false

  // Подпись = HMAC-SHA256(secret, timestamp.rawBody)
  const payload = `${timestamp}.${rawBody}`
  const hmac = crypto.createHmac("sha256", secret)
  hmac.update(payload)
  const computedSignature = hmac.digest("hex")

  // Защита от timing-атак
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(computedSignature),
    )
  } catch {
    return false
  }
}

/* ------------------------------------------------------------------ */
/*  Типы для Mux webhook                                               */
/* ------------------------------------------------------------------ */

interface MuxWebhookEvent {
  type: string
  data?: {
    id?: string
    asset_id?: string
    status?: string
    duration?: number
    passthrough?: string
    playback_ids?: Array<{ id: string; policy: string }>
    new_asset_settings?: {
      passthrough?: string
      playback_policy?: string[]
    }
    errors?: {
      type?: string
      messages?: string[]
    }
  }
}
