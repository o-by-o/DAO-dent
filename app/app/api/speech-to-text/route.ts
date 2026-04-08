import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { recognizeSpeech, parseDentalDictation } from "@/lib/speechkit"

/**
 * POST /api/speech-to-text
 * Принимает аудио от браузера (MediaRecorder), отправляет в Yandex SpeechKit,
 * возвращает распознанный текст + структурированные стомат. данные
 */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
  }

  // Только врачи и владельцы могут использовать голосовой ввод
  const role = (session.user as { role: string }).role
  if (!["OWNER", "MANAGER", "DOCTOR"].includes(role)) {
    return NextResponse.json({ error: "Недостаточно прав" }, { status: 403 })
  }

  try {
    // Проверяем наличие API ключа
    if (!process.env.YANDEX_SPEECHKIT_API_KEY || !process.env.YANDEX_CLOUD_FOLDER_ID) {
      return NextResponse.json(
        { error: "Yandex SpeechKit не настроен. Задайте YANDEX_SPEECHKIT_API_KEY и YANDEX_CLOUD_FOLDER_ID." },
        { status: 503 },
      )
    }

    const contentType = req.headers.get("content-type") || "audio/webm"
    const audioBuffer = Buffer.from(await req.arrayBuffer())

    if (audioBuffer.length === 0) {
      return NextResponse.json({ error: "Пустое аудио" }, { status: 400 })
    }

    if (audioBuffer.length > 1024 * 1024) {
      return NextResponse.json(
        { error: "Аудио слишком большое (макс. 1 МБ / 30 сек)" },
        { status: 400 },
      )
    }

    // Маппинг Content-Type браузера → Yandex SpeechKit
    let speechKitContentType = "audio/ogg"
    if (contentType.includes("webm")) {
      speechKitContentType = "audio/ogg" // WebM/Opus → OGG/Opus совместимы
    } else if (contentType.includes("wav") || contentType.includes("pcm")) {
      speechKitContentType = "audio/x-pcm"
    } else if (contentType.includes("mp3") || contentType.includes("mpeg")) {
      speechKitContentType = "audio/mpeg"
    }

    const result = await recognizeSpeech(audioBuffer, speechKitContentType)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Не удалось распознать речь" },
        { status: 500 },
      )
    }

    // Парсим стоматологическую терминологию
    const parsed = parseDentalDictation(result.text)

    return NextResponse.json({
      text: result.text,
      parsed,
    })
  } catch (error) {
    console.error("[speech-to-text]", error)
    return NextResponse.json(
      { error: "Ошибка при обработке аудио" },
      { status: 500 },
    )
  }
}
