/**
 * Генерация субтитров и транскриптов через MUX Auto-Generated Captions
 *
 * Использование:
 *   pnpm exec tsx scripts/generate-captions.ts --generate     # запустить генерацию для всех видео
 *   pnpm exec tsx scripts/generate-captions.ts --status        # проверить статус генерации
 *   pnpm exec tsx scripts/generate-captions.ts --download      # скачать транскрипты в файлы
 */
import "dotenv/config"

import { PrismaClient } from "@prisma/client"
import Mux from "@mux/mux-node"
import { writeFileSync, mkdirSync } from "fs"
import { resolve } from "path"

const prisma = new PrismaClient()
const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
})

const MUX_API = "https://api.mux.com"
const muxAuth = Buffer.from(
  `${process.env.MUX_TOKEN_ID}:${process.env.MUX_TOKEN_SECRET}`
).toString("base64")

/** Вызов MUX REST API напрямую */
async function muxApi(method: string, path: string, body?: object) {
  const res = await fetch(`${MUX_API}${path}`, {
    method,
    headers: {
      Authorization: `Basic ${muxAuth}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`MUX API ${res.status}: ${text}`)
  }
  return res.json()
}

const args = process.argv.slice(2)
function hasFlag(name: string): boolean {
  return args.includes(`--${name}`)
}

/** Получить все уроки с видео */
async function getLessonsWithVideo() {
  return prisma.lesson.findMany({
    where: { muxAssetId: { not: null } },
    include: { module: { include: { course: true } } },
    orderBy: { order: "asc" },
  })
}

/** Запустить генерацию субтитров для всех видео */
async function generateCaptions() {
  const lessons = await getLessonsWithVideo()
  console.log(`\n🎙️ Генерация субтитров для ${lessons.length} видео\n`)

  for (const lesson of lessons) {
    console.log(`━━━ ${lesson.title} ━━━`)
    console.log(`  Asset: ${lesson.muxAssetId}`)

    // Получаем ассет и его треки
    const asset = await mux.video.assets.retrieve(lesson.muxAssetId!)

    // Проверяем, нет ли уже субтитров
    const existingSubtitles = asset.tracks?.filter(
      (t) => t.type === "text" && t.text_type === "subtitles"
    )
    if (existingSubtitles && existingSubtitles.length > 0) {
      console.log(`  ⏭️ Субтитры уже есть: ${existingSubtitles[0].id} (${existingSubtitles[0].status})`)
      continue
    }

    // Проверяем статус ассета
    if (asset.status !== "ready") {
      console.log(`  ⏳ Ассет ещё обрабатывается (${asset.status}), пропускаю`)
      continue
    }

    // Находим аудио-трек
    const audioTrack = asset.tracks?.find((t) => t.type === "audio")
    if (!audioTrack) {
      console.log(`  ❌ Аудио-трек не найден`)
      continue
    }

    console.log(`  Audio track: ${audioTrack.id}`)

    // Запускаем генерацию субтитров через REST API
    try {
      const result = await muxApi(
        "POST",
        `/video/v1/assets/${lesson.muxAssetId}/tracks/${audioTrack.id}/generate-subtitles`,
        {
          generated_subtitles: [
            {
              language_code: "ru",
              name: "Русский (авто)",
            },
          ],
        }
      )

      const track = result.data?.[0]
      console.log(`  ✅ Запущено! Track ID: ${track?.id}, статус: ${track?.status}`)
    } catch (err: any) {
      console.error(`  ❌ Ошибка: ${err.message}`)
    }

    console.log("")
  }
}

/** Проверить статус генерации субтитров */
async function checkStatus() {
  const lessons = await getLessonsWithVideo()
  console.log(`\n📊 Статус субтитров:\n`)

  for (const lesson of lessons) {
    const asset = await mux.video.assets.retrieve(lesson.muxAssetId!)
    const subtitleTracks = asset.tracks?.filter(
      (t) => t.type === "text" && t.text_type === "subtitles"
    )

    if (!subtitleTracks || subtitleTracks.length === 0) {
      console.log(`⬜ ${lesson.title} — субтитры не запрошены`)
    } else {
      const track = subtitleTracks[0]
      const icon = track.status === "ready" ? "✅" : "⏳"
      console.log(`${icon} ${lesson.title} — ${track.status} (track: ${track.id})`)
    }
  }
  console.log("")
}

/** Скачать транскрипты */
async function downloadTranscripts() {
  const lessons = await getLessonsWithVideo()
  const outDir = resolve(__dirname, "../transcripts")
  mkdirSync(outDir, { recursive: true })

  console.log(`\n📥 Скачиваю транскрипты в ${outDir}\n`)

  for (const lesson of lessons) {
    const asset = await mux.video.assets.retrieve(lesson.muxAssetId!)
    const subtitleTrack = asset.tracks?.find(
      (t) => t.type === "text" && t.text_type === "subtitles" && t.status === "ready"
    )

    if (!subtitleTrack) {
      console.log(`⏳ ${lesson.title} — субтитры не готовы, пропускаю`)
      continue
    }

    const playbackId = lesson.muxPlaybackId
    const trackId = subtitleTrack.id

    // Скачиваем текстовый транскрипт
    const txtUrl = `https://stream.mux.com/${playbackId}/text/${trackId}.txt`
    const vttUrl = `https://stream.mux.com/${playbackId}/text/${trackId}.vtt`

    try {
      const [txtRes, vttRes] = await Promise.all([
        fetch(txtUrl),
        fetch(vttUrl),
      ])

      if (txtRes.ok) {
        const txt = await txtRes.text()
        const lessonNum = lesson.title.match(/Урок (\d+)/)?.[1] ?? "unknown"
        const txtPath = resolve(outDir, `lesson_${lessonNum}.txt`)
        const vttPath = resolve(outDir, `lesson_${lessonNum}.vtt`)

        writeFileSync(txtPath, txt, "utf-8")
        console.log(`✅ ${lesson.title} → ${txtPath} (${txt.length} символов)`)

        if (vttRes.ok) {
          writeFileSync(vttPath, await vttRes.text(), "utf-8")
          console.log(`   + VTT субтитры → ${vttPath}`)
        }
      } else {
        console.log(`❌ ${lesson.title} — ошибка загрузки: ${txtRes.status}`)
      }
    } catch (err: any) {
      console.error(`❌ ${lesson.title} — ${err.message}`)
    }
  }
  console.log("")
}

// ============================================
// Main
// ============================================

async function main() {
  if (hasFlag("generate")) {
    await generateCaptions()
  } else if (hasFlag("status")) {
    await checkStatus()
  } else if (hasFlag("download")) {
    await downloadTranscripts()
  } else {
    console.log(`
🎙️ MUX Auto-Generated Captions — DIB Academy

Использование:
  npx tsx scripts/generate-captions.ts --generate   # запустить генерацию субтитров (ru)
  npx tsx scripts/generate-captions.ts --status      # проверить статус
  npx tsx scripts/generate-captions.ts --download    # скачать транскрипты в /transcripts
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
