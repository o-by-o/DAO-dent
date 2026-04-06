/**
 * Скрипт загрузки видео на MUX и привязки к уроку в БД
 *
 * Использование (из папки school-cosmo, подхватывает .env):
 *   pnpm mux:list
 *   pnpm exec tsx scripts/upload-video.ts --file ./video.mp4 --lesson-id ID
 *
 * Переменные окружения (из .env):
 *   MUX_TOKEN_ID, MUX_TOKEN_SECRET, DATABASE_URL
 */
import "dotenv/config"

import { PrismaClient } from "@prisma/client"
import Mux from "@mux/mux-node"
import { createReadStream, statSync } from "fs"
import { resolve } from "path"

const prisma = new PrismaClient()
const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
})

// ============================================
// Парсинг аргументов
// ============================================

const args = process.argv.slice(2)

function getArg(name: string): string | undefined {
  const idx = args.indexOf(`--${name}`)
  if (idx === -1) return undefined
  return args[idx + 1]
}

function hasFlag(name: string): boolean {
  return args.includes(`--${name}`)
}

// ============================================
// Команды
// ============================================

/** Показать список всех уроков */
async function listLessons() {
  const lessons = await prisma.lesson.findMany({
    include: { module: { include: { course: true } } },
    orderBy: [
      { module: { course: { title: "asc" } } },
      { module: { order: "asc" } },
      { order: "asc" },
    ],
  })

  console.log("\n📚 Все уроки:\n")
  let currentCourse = ""
  let currentModule = ""

  for (const lesson of lessons) {
    if (lesson.module.course.title !== currentCourse) {
      currentCourse = lesson.module.course.title
      console.log(`\n━━━ ${currentCourse} ━━━`)
    }
    if (lesson.module.title !== currentModule) {
      currentModule = lesson.module.title
      console.log(`\n  📁 ${currentModule}`)
    }

    const videoStatus = lesson.muxPlaybackId
      ? `✅ ${lesson.muxPlaybackId}`
      : "⬜ нет видео"

    console.log(`    ${lesson.title}`)
    console.log(`      ID: ${lesson.id}  |  Видео: ${videoStatus}`)
  }
  console.log("")
}

/** Показать статус видео */
async function showStatus() {
  const lessons = await prisma.lesson.findMany({
    include: { module: { include: { course: true } } },
    orderBy: [
      { module: { course: { title: "asc" } } },
      { module: { order: "asc" } },
      { order: "asc" },
    ],
  })

  const withVideo = lessons.filter((l) => l.muxPlaybackId)
  const withoutVideo = lessons.filter((l) => !l.muxPlaybackId)

  console.log(`\n📊 Статус видео: ${withVideo.length}/${lessons.length} загружено\n`)

  if (withoutVideo.length > 0) {
    console.log("⬜ Уроки БЕЗ видео:")
    for (const l of withoutVideo) {
      console.log(`  - ${l.title} (${l.id})`)
    }
  }

  if (withVideo.length > 0) {
    console.log("\n✅ Уроки С видео:")
    for (const l of withVideo) {
      console.log(`  - ${l.title} → playback_id: ${l.muxPlaybackId}`)
    }
  }
  console.log("")
}

/** Загрузить видео на MUX по URL */
async function uploadFromUrl(url: string, lessonId: string) {
  console.log(`\n🎬 Загружаю видео с URL: ${url}`)
  console.log(`   Для урока: ${lessonId}\n`)

  // Проверяем, что урок существует
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { module: { include: { course: true } } },
  })

  if (!lesson) {
    console.error(`❌ Урок с ID "${lessonId}" не найден. Используйте --list для списка.`)
    process.exit(1)
  }

  console.log(`   Курс: ${lesson.module.course.title}`)
  console.log(`   Модуль: ${lesson.module.title}`)
  console.log(`   Урок: ${lesson.title}\n`)

  // Создаём ассет на MUX
  const asset = await mux.video.assets.create({
    inputs: [{ url }],
    playback_policy: ["public"],
    encoding_tier: "baseline",
  })

  console.log(`✅ MUX Asset создан: ${asset.id}`)
  console.log(`   Playback ID: ${asset.playback_ids?.[0]?.id}`)
  console.log(`   Статус: ${asset.status}`)

  // Сохраняем в БД
  await prisma.lesson.update({
    where: { id: lessonId },
    data: {
      muxAssetId: asset.id,
      muxPlaybackId: asset.playback_ids?.[0]?.id ?? null,
      muxStatus: asset.status,
    },
  })

  console.log(`\n💾 Сохранено в БД!`)
  console.log(`   Видео будет готово через 1-5 минут (MUX обрабатывает).`)
  console.log(`   Проверьте статус: npx tsx scripts/upload-video.ts --status\n`)
}

/** Загрузить видео на MUX через direct upload (локальный файл) */
async function uploadFromFile(filePath: string, lessonId: string) {
  const absPath = resolve(filePath)

  try {
    const stat = statSync(absPath)
    const sizeMB = (stat.size / 1024 / 1024).toFixed(1)
    console.log(`\n🎬 Загружаю файл: ${absPath} (${sizeMB} МБ)`)
  } catch {
    console.error(`❌ Файл не найден: ${absPath}`)
    process.exit(1)
  }

  // Проверяем урок
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { module: { include: { course: true } } },
  })

  if (!lesson) {
    console.error(`❌ Урок с ID "${lessonId}" не найден. Используйте --list для списка.`)
    process.exit(1)
  }

  console.log(`   Курс: ${lesson.module.course.title}`)
  console.log(`   Урок: ${lesson.title}\n`)

  // Создаём direct upload URL
  const upload = await mux.video.uploads.create({
    new_asset_settings: {
      playback_policy: ["public"],
      encoding_tier: "baseline",
    },
    cors_origin: "*",
  })

  console.log(`📤 Загружаю на MUX...`)

  // Определяем Content-Type по расширению
  const ext = absPath.split(".").pop()?.toLowerCase()
  const mimeTypes: Record<string, string> = {
    mp4: "video/mp4",
    mkv: "video/x-matroska",
    webm: "video/webm",
    mov: "video/quicktime",
  }
  const contentType = mimeTypes[ext ?? ""] ?? "application/octet-stream"

  // Загружаем файл через PUT
  const fileStream = createReadStream(absPath)
  const stat = statSync(absPath)

  const response = await fetch(upload.url, {
    method: "PUT",
    headers: {
      "Content-Length": stat.size.toString(),
      "Content-Type": contentType,
    },
    body: fileStream as unknown as BodyInit,
    // @ts-expect-error duplex needed for streaming
    duplex: "half",
  })

  if (!response.ok) {
    console.error(`❌ Ошибка загрузки: ${response.status} ${response.statusText}`)
    process.exit(1)
  }

  console.log(`✅ Файл загружен, ожидаю создание ассета...`)

  // Ждём пока MUX создаст ассет (поллинг)
  let asset = null
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 2000))
    const uploadStatus = await mux.video.uploads.retrieve(upload.id)

    if (uploadStatus.asset_id) {
      asset = await mux.video.assets.retrieve(uploadStatus.asset_id)
      break
    }
    process.stdout.write(".")
  }

  if (!asset) {
    console.error("\n❌ Таймаут: ассет не был создан за 60 секунд")
    process.exit(1)
  }

  console.log(`\n✅ MUX Asset: ${asset.id}`)
  console.log(`   Playback ID: ${asset.playback_ids?.[0]?.id}`)

  // Сохраняем в БД
  await prisma.lesson.update({
    where: { id: lessonId },
    data: {
      muxAssetId: asset.id,
      muxPlaybackId: asset.playback_ids?.[0]?.id ?? null,
      muxStatus: asset.status,
    },
  })

  console.log(`💾 Сохранено в БД!\n`)
}

// ============================================
// Main
// ============================================

async function main() {
  if (hasFlag("list")) {
    await listLessons()
  } else if (hasFlag("status")) {
    await showStatus()
  } else if (getArg("url") && getArg("lesson-id")) {
    await uploadFromUrl(getArg("url")!, getArg("lesson-id")!)
  } else if (getArg("file") && getArg("lesson-id")) {
    await uploadFromFile(getArg("file")!, getArg("lesson-id")!)
  } else {
    console.log(`
📹 MUX Video Uploader — DIB Academy

Использование:
  npx tsx scripts/upload-video.ts --list                              # список уроков и их ID
  npx tsx scripts/upload-video.ts --status                            # статус видео
  npx tsx scripts/upload-video.ts --file ./video.mp4 --lesson-id ID   # загрузить локальный файл
  npx tsx scripts/upload-video.ts --url https://... --lesson-id ID    # загрузить по URL

Примеры:
  npx tsx scripts/upload-video.ts --list
  npx tsx scripts/upload-video.ts --file ./videos/lesson-07.mp4 --lesson-id clxyz123
  npx tsx scripts/upload-video.ts --url https://storage.ya.ru/video.mp4 --lesson-id clxyz456
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
