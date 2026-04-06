/**
 * Синхронизация Mux ассетов с БД
 * Находит видео с passthrough (lessonId) и обновляет уроки
 * Также находит видео без привязки и пытается привязать по playbackId
 *
 * Запуск: npx tsx scripts/sync-mux-to-db.ts
 */

import "dotenv/config"
import Mux from "@mux/mux-node"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()
const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
})

async function main() {
  console.log("🔄 Синхронизация Mux → БД\n")

  // Получаем все ассеты из Mux
  const assets = await mux.video.assets.list({ limit: 100 })
  console.log(`Всего ассетов в Mux: ${assets.data.length}\n`)

  let synced = 0
  let skipped = 0
  let orphaned = 0

  for (const asset of assets.data) {
    if (asset.status !== "ready") continue

    const playbackId = asset.playback_ids?.[0]?.id
    if (!playbackId) continue

    // Проверяем, уже ли привязан
    const existing = await prisma.lesson.findFirst({
      where: { muxAssetId: asset.id },
    })
    if (existing) {
      // Уже привязан, убедимся что playbackId актуальный
      if (existing.muxPlaybackId !== playbackId || existing.muxStatus !== "ready") {
        await prisma.lesson.update({
          where: { id: existing.id },
          data: { muxPlaybackId: playbackId, muxStatus: "ready" },
        })
        console.log(`🔧 Обновлён playbackId: ${existing.title}`)
        synced++
      } else {
        skipped++
      }
      continue
    }

    // Пробуем привязать по passthrough
    let lessonId: string | null = null
    if (asset.passthrough) {
      try {
        const pt = JSON.parse(asset.passthrough)
        lessonId = pt.lessonId || null
      } catch {
        // не JSON
      }
    }

    if (lessonId) {
      const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } })
      if (lesson) {
        await prisma.lesson.update({
          where: { id: lessonId },
          data: {
            muxAssetId: asset.id,
            muxPlaybackId: playbackId,
            muxStatus: "ready",
          },
        })
        const duration = asset.duration ? `${Math.floor(asset.duration / 60)}:${String(Math.floor(asset.duration % 60)).padStart(2, "0")}` : "?"
        console.log(`✅ Привязано: "${lesson.title}" ← ${asset.id} (${duration})`)
        synced++
      } else {
        console.log(`⚠️  Урок ${lessonId} не найден в БД (удалён?). Asset: ${asset.id}`)
        orphaned++
      }
    } else {
      // Видео без passthrough — пробуем найти по playbackId
      const byPlayback = await prisma.lesson.findFirst({
        where: { muxPlaybackId: playbackId },
      })
      if (byPlayback) {
        if (!byPlayback.muxAssetId) {
          await prisma.lesson.update({
            where: { id: byPlayback.id },
            data: { muxAssetId: asset.id, muxStatus: "ready" },
          })
          console.log(`🔧 Дополнен assetId: ${byPlayback.title}`)
          synced++
        } else {
          skipped++
        }
      } else {
        const duration = asset.duration ? `${Math.floor(asset.duration / 60)}:${String(Math.floor(asset.duration % 60)).padStart(2, "0")}` : "?"
        console.log(`❓ Без привязки: ${asset.id} (${duration}) — нужно привязать вручную`)
        orphaned++
      }
    }
  }

  console.log(`\n📊 Итого:`)
  console.log(`  Синхронизировано: ${synced}`)
  console.log(`  Пропущено (ок):  ${skipped}`)
  console.log(`  Без привязки:    ${orphaned}`)

  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
