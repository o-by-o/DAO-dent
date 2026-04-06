/**
 * Получить из Mux API детали по asset ID: дата создания, длительность, passthrough.
 * По passthrough видно, загружено ли через админку (lessonId/courseId) или без привязки.
 *
 * Запуск: pnpm exec tsx scripts/mux-asset-info.ts [asset_id ...]
 * Без аргументов — выводит инфо по 11 asset ID, которых нет в БД.
 * Требует: MUX_TOKEN_ID, MUX_TOKEN_SECRET в .env
 */
import "dotenv/config"
import Mux from "@mux/mux-node"

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
})

const ASSET_IDS_NOT_IN_DB = [
  "3NMmls002uCgmbybNcbx429wMszy01zdDMEAvOcsQPQ8E",
  "XSwcuB02IQ3G3k8jJa2woEEHF02szUhp4gRjDut5Ci01Mw",
  "023F01q3NAdmv2nkLmvY00gUM5LOvE8a1Vg9lJj6pIMc008",
  "00Njgd2pswYnAxx02aSoleXT00892XEG88bcMFe6yAAXKY",
  "tzpDxXWJmvX1Nelz8Su7mm01yu74PDVlC8p017ABZZ1iQ",
  "jsT5VZQ27ywJmRVXLAktVTlGpwblq11sIl8f5kmlAxs",
  "OHNlwLM7sRW8Uq97rP39hH00ya00hyJJWF9kUHD02rZy9g",
  "cvghZCtuVEqNqaRWbQBQs6r65kqnRwZYxGopALeCQG00",
  "gb5k3DmV5GBEv02fxhfw7600Uj2flVvQ49ipXjOeIv3Y4",
  "r1iTdkYAzv7YqKdF2rdjAa8KMHKYAuvd024a414qsM8Y",
  "QRDVNYm6Dvev4aGQktlmP02zwTvopAtHccHYv8BZ3lzM",
]

function formatDuration(sec: number | undefined): string {
  if (sec == null) return "—"
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, "0")}`
}

async function main() {
  const ids = process.argv.slice(2).length > 0 ? process.argv.slice(2) : ASSET_IDS_NOT_IN_DB

  console.log("\n=== Детали ассетов в Mux ===\n")
  console.log("Как видео попадают в Mux у вас:")
  console.log("  1) Админка: загрузка к уроку → passthrough содержит lessonId/courseId → вебхук привязывает к уроку.")
  console.log("  2) Скрипт upload-video.ts --file ... --lesson-id ID → привязка сразу в скрипте (passthrough может быть пуст).")
  console.log("  3) Прямая загрузка в dashboard Mux → passthrough пустой, к уроку не привязывается.\n")

  for (const assetId of ids) {
    try {
      const asset = await mux.video.assets.retrieve(assetId)
      const durationStr = formatDuration(asset.duration ?? undefined)
      const created = asset.created_at != null ? new Date(Number(asset.created_at) * 1000).toISOString() : "—"
      let passthrough = (asset as { passthrough?: string }).passthrough ?? ""
      if (passthrough) {
        try {
          const parsed = JSON.parse(passthrough)
          passthrough = JSON.stringify(parsed, null, 2)
        } catch {
          // leave as-is
        }
      } else {
        passthrough = "(пусто)"
      }

      console.log(`Asset: ${assetId}`)
      console.log(`  Длительность: ${durationStr}  |  Статус: ${asset.status ?? "—"}  |  Создан: ${created}`)
      console.log(`  Passthrough: ${passthrough}`)
      if (passthrough !== "(пусто)") {
        console.log(`  → Загружено через админку (есть lessonId/courseId). Если не в БД — вебхук мог не сработать или урок удалён.`)
      } else {
        console.log(`  → Passthrough пустой: загрузка через скрипт без passthrough или напрямую в Mux.`)
      }
      console.log("")
    } catch (err) {
      console.log(`Asset: ${assetId}`)
      console.log(`  Ошибка: ${err instanceof Error ? err.message : String(err)}`)
      console.log("")
    }
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
