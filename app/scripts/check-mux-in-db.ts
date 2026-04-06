/**
 * Проверка: какие Mux asset ID из списка есть в БД (таблица lessons, поле muxAssetId).
 * Запуск: pnpm exec tsx scripts/check-mux-in-db.ts
 * Требует: DATABASE_URL в .env
 */
import "dotenv/config"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const MUX_ASSET_IDS_FROM_MUX = [
  "3NMmls002uCgmbybNcbx429wMszy01zdDMEAvOcsQPQ8E",
  "XSwcuB02IQ3G3k8jJa2woEEHF02szUhp4gRjDut5Ci01Mw",
  "023F01q3NAdmv2nkLmvY00gUM5LOvE8a1Vg9lJj6pIMc008",
  "00Njgd2pswYnAxx02aSoleXT00892XEG88bcMFe6yAAXKY",
  "500H4MLJAOQRGaCmjZRQ6JowJqwqBbzFD9pE721V4XKo",
  "muBWZOUuBHzuXqlgpJcd02N91WhMifHV201kxuxtxMrdc",
  "3RGm87mYQyV6l7st0258EbVZiIYB63xOCPmXGt8ZCRlA",
  "Qq6amgzKaoAzb00rPhBEPa9tHWUpTw28kut7OdKphdCs",
  "OqcspbaFeD4ISO6YK13oEQekCsmR02T1bYAhK3K5xiRE",
  "tzpDxXWJmvX1Nelz8Su7mm01yu74PDVlC8p017ABZZ1iQ",
  "ScZ5dx7rpYzRcYWeIePMlcVFCHkKtYnp0102T9qtdhN0200",
  "01qlyu7csM02die01M3vgODHFNcNM4UmHEgWwcPRhvdSCY",
  "jsT5VZQ27ywJmRVXLAktVTlGpwblq11sIl8f5kmlAxs",
  "OHNlwLM7sRW8Uq97rP39hH00ya00hyJJWF9kUHD02rZy9g",
  "cvghZCtuVEqNqaRWbQBQs6r65kqnRwZYxGopALeCQG00",
  "02X5hBtGFSvE8degGS2Qklm8wAKz5EuAE8PILwlc01gTU",
  "pCrKyz9CqQHtt400EA3sdE2yrFV1WDDfg8OGUGQyiYRs",
  "x9Sgt8vKNEypTgO8GzJ2mgMwuWtmrE14e8sG02IBSU14",
  "bLt4bF3eUcH7hmrKemDrWabX8V02ZJ00gJXD5hqirUBxk",
  "cdBEmW02ji5KNVYiMLun3l02cS006c1eDUc0201nUPyqcSgQ",
  "6wS4ybhH5A1tTw01GKoLwB4plXPFw3lLojItUZG25HRw",
  "gb5k3DmV5GBEv02fxhfw7600Uj2flVvQ49ipXjOeIv3Y4",
  "r1iTdkYAzv7YqKdF2rdjAa8KMHKYAuvd024a414qsM8Y",
  "QRDVNYm6Dvev4aGQktlmP02zwTvopAtHccHYv8BZ3lzM",
]

async function main() {
  const inDb = await prisma.lesson.findMany({
    where: { muxAssetId: { in: MUX_ASSET_IDS_FROM_MUX } },
    select: {
      id: true,
      title: true,
      muxAssetId: true,
      muxPlaybackId: true,
      muxStatus: true,
      module: { select: { title: true, course: { select: { title: true } } } },
    },
  })

  const foundIds = new Set(inDb.map((l) => l.muxAssetId!))
  const missing = MUX_ASSET_IDS_FROM_MUX.filter((id) => !foundIds.has(id))

  console.log("\n=== Mux asset ID → наличие в БД ===\n")
  console.log(`Всего в списке Mux: ${MUX_ASSET_IDS_FROM_MUX.length}`)
  console.log(`Найдено в БД:       ${inDb.length}`)
  console.log(`Нет в БД:           ${missing.length}\n`)

  if (inDb.length) {
    console.log("--- В БД (урок, курс/модуль, playback_id, status) ---")
    for (const l of inDb) {
      const course = l.module?.course?.title ?? "?"
      const module = l.module?.title ?? "?"
      console.log(`  ${l.muxAssetId}  →  ${l.title}  (${course} / ${module})  playback=${l.muxPlaybackId ?? "—"}  status=${l.muxStatus ?? "—"}`)
    }
  }

  if (missing.length) {
    console.log("\n--- Нет в БД (asset_id только в Mux) ---")
    for (const id of missing) console.log(`  ${id}`)
  }

  console.log("")
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e)
    prisma.$disconnect()
    process.exit(1)
  })
