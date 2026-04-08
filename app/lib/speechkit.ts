/**
 * Yandex SpeechKit — распознавание речи
 * https://cloud.yandex.com/en/docs/speechkit/stt/request
 *
 * Поддерживает:
 * - Синхронное распознавание коротких аудио (до 30 сек, до 1 МБ)
 * - Формат: OGG/Opus, LPCM, MP3
 * - Язык: ru-RU (русский)
 *
 * Требует: YANDEX_SPEECHKIT_API_KEY и YANDEX_CLOUD_FOLDER_ID в .env
 */

const STT_URL = "https://stt.api.cloud.yandex.net/speech/v1/stt:recognize"

type SpeechKitConfig = {
  apiKey: string
  folderId: string
  language?: string
  model?: string
  sampleRateHertz?: number
}

type RecognitionResult = {
  text: string
  success: boolean
  error?: string
}

function getConfig(): SpeechKitConfig {
  const apiKey = process.env.YANDEX_SPEECHKIT_API_KEY
  const folderId = process.env.YANDEX_CLOUD_FOLDER_ID

  if (!apiKey || !folderId) {
    throw new Error(
      "YANDEX_SPEECHKIT_API_KEY и YANDEX_CLOUD_FOLDER_ID должны быть заданы в .env",
    )
  }

  return {
    apiKey,
    folderId,
    language: "ru-RU",
    model: "general",
    sampleRateHertz: 48000,
  }
}

/**
 * Распознать короткое аудио (до 30 сек)
 * @param audioData - бинарные данные аудио (OGG/Opus или LPCM)
 * @param contentType - MIME тип: "audio/ogg", "audio/x-pcm", "audio/mpeg"
 */
export async function recognizeSpeech(
  audioData: Buffer | Uint8Array,
  contentType: string = "audio/ogg",
): Promise<RecognitionResult> {
  try {
    const config = getConfig()

    const params = new URLSearchParams({
      lang: config.language || "ru-RU",
      topic: config.model || "general",
      folderId: config.folderId,
    })

    const response = await fetch(`${STT_URL}?${params}`, {
      method: "POST",
      headers: {
        Authorization: `Api-Key ${config.apiKey}`,
        "Content-Type": contentType,
      },
      body: audioData as unknown as BodyInit,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[SpeechKit] Ошибка:", response.status, errorText)
      return {
        text: "",
        success: false,
        error: `Yandex SpeechKit: ${response.status} ${errorText}`,
      }
    }

    const data = await response.json()

    // Ответ: { result: "распознанный текст" }
    const text = data.result || ""

    return {
      text,
      success: true,
    }
  } catch (error) {
    console.error("[SpeechKit] Ошибка:", error)
    return {
      text: "",
      success: false,
      error: error instanceof Error ? error.message : "Неизвестная ошибка",
    }
  }
}

/**
 * Стоматологический словарь для подсказок и автодополнения
 * Может использоваться для пост-обработки распознанного текста
 */
export const DENTAL_DICTIONARY = {
  // Зубы по ISO 3950
  teeth: Array.from({ length: 32 }, (_, i) => {
    const quadrant = Math.floor(i / 8) + 1
    const tooth = (i % 8) + 1
    return `${quadrant}${tooth}`
  }),

  // Диагнозы
  diagnoses: [
    "кариес",
    "средний кариес",
    "глубокий кариес",
    "пульпит",
    "периодонтит",
    "пародонтит",
    "гингивит",
    "периостит",
    "стоматит",
    "эрозия эмали",
    "клиновидный дефект",
    "перелом коронки",
    "перелом корня",
    "ретинированный зуб",
    "дистопированный зуб",
    "адентия",
  ],

  // Процедуры
  procedures: [
    "осмотр",
    "консультация",
    "лечение кариеса",
    "пломбирование",
    "эндодонтическое лечение",
    "депульпирование",
    "удаление зуба",
    "удаление нерва",
    "профессиональная гигиена",
    "ультразвуковая чистка",
    "air flow",
    "фторирование",
    "герметизация фиссур",
    "имплантация",
    "протезирование",
    "установка коронки",
    "установка винира",
    "отбеливание",
    "снятие слепков",
    "установка брекетов",
    "рентген",
    "кт",
    "анестезия",
  ],

  // Материалы
  materials: [
    "светоотверждаемая пломба",
    "композит",
    "filtek",
    "estelite",
    "ультракаин",
    "артикаин",
    "лидокаин",
    "гуттаперча",
    "цемент",
    "стеклоиономер",
    "адгезив",
    "бонд",
    "коффердам",
    "матрица",
    "клин",
  ],
}

/**
 * Парсинг стоматологической диктовки
 * Извлекает структурированные данные из распознанного текста
 */
export function parseDentalDictation(text: string): {
  toothNumbers: number[]
  diagnosis: string | null
  procedures: string[]
  materials: string[]
  rawText: string
} {
  const lower = text.toLowerCase()

  // Извлечение номеров зубов (паттерны: "зуб 36", "зуб тридцать шесть", "36-й")
  const toothNumbers: number[] = []
  const toothRegex = /зуб\w*\s+(\d{2})/gi
  let match
  while ((match = toothRegex.exec(lower)) !== null) {
    const num = parseInt(match[1])
    if (num >= 11 && num <= 48) {
      toothNumbers.push(num)
    }
  }

  // Также ищем просто числа 11-48 рядом со стомат. словами
  const standaloneTeeth = /\b([1-4][1-8])\b/g
  while ((match = standaloneTeeth.exec(lower)) !== null) {
    const num = parseInt(match[1])
    if (num >= 11 && num <= 48 && !toothNumbers.includes(num)) {
      // Проверяем контекст — рядом ли стомат. слова
      const context = lower.slice(Math.max(0, match.index - 30), match.index + 30)
      if (
        DENTAL_DICTIONARY.diagnoses.some((d) => context.includes(d)) ||
        DENTAL_DICTIONARY.procedures.some((p) => context.includes(p)) ||
        context.includes("зуб")
      ) {
        toothNumbers.push(num)
      }
    }
  }

  // Извлечение диагноза
  const diagnosis =
    DENTAL_DICTIONARY.diagnoses.find((d) => lower.includes(d)) || null

  // Извлечение процедур
  const procedures = DENTAL_DICTIONARY.procedures.filter((p) =>
    lower.includes(p),
  )

  // Извлечение материалов
  const materials = DENTAL_DICTIONARY.materials.filter((m) =>
    lower.includes(m),
  )

  return {
    toothNumbers: [...new Set(toothNumbers)],
    diagnosis,
    procedures,
    materials,
    rawText: text,
  }
}
