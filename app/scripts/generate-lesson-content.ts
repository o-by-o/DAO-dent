/**
 * Генерация заголовков и описаний уроков из транскриптов через DeepSeek
 *
 * Использование:
 *   pnpm exec tsx scripts/generate-lesson-content.ts --preview    # показать что будет сгенерировано (без записи в БД)
 *   pnpm exec tsx scripts/generate-lesson-content.ts --apply      # сгенерировать и записать в БД
 */
import "dotenv/config"

import { PrismaClient } from "@prisma/client"
import { readFileSync, existsSync } from "fs"
import { resolve } from "path"

const prisma = new PrismaClient()

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY!
const DEEPSEEK_URL = "https://api.deepseek.com/v1/chat/completions"

const args = process.argv.slice(2)
function hasFlag(name: string): boolean {
  return args.includes(`--${name}`)
}

/** Маппинг: номер видео → ID урока в БД */
const VIDEO_LESSON_MAP: Record<number, string> = {
  1: "cmldxytoj001jogk6p4ffdtm3",
  2: "cmldxytoj001kogk6yel43j7o",
  3: "cmldxytoj001logk61g8hx61r",
  4: "cmldxytoj001mogk6eotu9sni",
  5: "cmldxytoj001oogk64f5hy81l",
}

/** Очистить транскрипт от мусора (повторяющиеся строки от Whisper) */
function cleanTranscript(raw: string): string {
  const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean)

  // Убираем повторяющиеся строки подряд
  const deduped: string[] = []
  for (const line of lines) {
    if (deduped.length === 0 || deduped[deduped.length - 1] !== line) {
      deduped.push(line)
    }
  }

  // Убираем строки с "Редактор субтитров", "Корректор" — мусор от Whisper
  const cleaned = deduped.filter(
    (l) =>
      !l.startsWith("Редактор субтитров") &&
      !l.startsWith("Корректор") &&
      !l.startsWith("Добавляем эту функцию") &&
      !l.startsWith("На основе гелевого кислотой") &&
      !l.startsWith("Это очень хорошая функция")
  )

  // Берём первые 3000 символов содержательного текста (лимит для API)
  return cleaned.join(" ").slice(0, 3000)
}

/** Вызвать DeepSeek API */
async function callDeepSeek(prompt: string, systemPrompt: string): Promise<string> {
  const res = await fetch(DEEPSEEK_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`DeepSeek API ${res.status}: ${text}`)
  }

  const data = await res.json() as any
  return data.choices[0].message.content
}

/** Сгенерировать заголовок и описание урока */
async function generateForLesson(
  lessonNum: number
): Promise<{ title: string; description: string } | null> {
  const transcriptPath = resolve(
    __dirname,
    `../transcripts/lesson_${lessonNum}.txt`
  )

  if (!existsSync(transcriptPath)) {
    console.log(`  ⏭️ Транскрипт lesson_${lessonNum}.txt не найден`)
    return null
  }

  const raw = readFileSync(transcriptPath, "utf-8")
  const cleaned = cleanTranscript(raw)

  if (cleaned.length < 100) {
    console.log(`  ⏭️ Транскрипт слишком короткий (${cleaned.length} символов)`)
    return null
  }

  const systemPrompt = `Ты — редактор контента для онлайн-школы косметологии DIB Academy.
Твоя задача — на основе транскрипта видеоурока создать:
1. Короткий заголовок урока (формат: "Урок N: Тема") — максимум 60 символов
2. Описание урока для отображения на сайте — 2-4 предложения, профессиональным языком

Контекст: это школа косметологии, уроки ведёт практикующий косметолог. Видео — это практические занятия с демонстрацией процедур.

ВАЖНО:
- Транскрипт сгенерирован автоматически и содержит ошибки распознавания. Исправляй очевидные ошибки.
- Пиши профессионально, но понятно
- Не выдумывай информацию, которой нет в транскрипте
- Формат ответа строго JSON: {"title": "Урок N: ...", "description": "..."}`

  const prompt = `Номер урока: ${lessonNum}

Транскрипт видеоурока (первые 3000 символов):
${cleaned}`

  const response = await callDeepSeek(prompt, systemPrompt)

  // Парсим JSON из ответа
  const jsonMatch = response.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    console.error(`  ❌ Не удалось извлечь JSON из ответа DeepSeek`)
    console.log(`  Ответ: ${response.slice(0, 200)}`)
    return null
  }

  try {
    return JSON.parse(jsonMatch[0])
  } catch {
    console.error(`  ❌ Невалидный JSON: ${jsonMatch[0].slice(0, 200)}`)
    return null
  }
}

/** Предпросмотр — генерация без записи в БД */
async function preview() {
  console.log("\n🔍 Предпросмотр генерации контента\n")

  for (const [numStr, lessonId] of Object.entries(VIDEO_LESSON_MAP)) {
    const num = parseInt(numStr)
    console.log(`━━━ Видео ${num} (урок ${lessonId}) ━━━`)

    const result = await generateForLesson(num)
    if (result) {
      console.log(`  📝 ${result.title}`)
      console.log(`  📄 ${result.description}`)
    }
    console.log("")
  }
}

/** Генерация и запись в БД */
async function apply() {
  console.log("\n✍️ Генерация контента и запись в БД\n")

  for (const [numStr, lessonId] of Object.entries(VIDEO_LESSON_MAP)) {
    const num = parseInt(numStr)
    console.log(`━━━ Видео ${num} ━━━`)

    const result = await generateForLesson(num)
    if (!result) continue

    console.log(`  📝 ${result.title}`)
    console.log(`  📄 ${result.description}`)

    // Записываем в БД
    await prisma.lesson.update({
      where: { id: lessonId },
      data: {
        title: result.title,
        description: result.description,
      },
    })
    console.log(`  ✅ Сохранено в БД`)
    console.log("")
  }
}

// ============================================
// Main
// ============================================

async function main() {
  if (!DEEPSEEK_API_KEY) {
    console.error("❌ DEEPSEEK_API_KEY не задан в .env")
    process.exit(1)
  }

  if (hasFlag("preview")) {
    await preview()
  } else if (hasFlag("apply")) {
    await apply()
  } else {
    console.log(`
✍️ Генерация контента уроков из транскриптов — DIB Academy

Использование:
  npx tsx scripts/generate-lesson-content.ts --preview   # предпросмотр (без записи)
  npx tsx scripts/generate-lesson-content.ts --apply     # сгенерировать и записать в БД
`)
  }
}

main()
  .catch((e) => {
    console.error("❌ Ошибка:", e.message)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
