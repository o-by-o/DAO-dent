/**
 * Seed дефолтного контента сайта (для OpenClaw content_list)
 * Запуск: pnpm tsx scripts/seed-site-content.ts
 */
import "dotenv/config"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const DEFAULTS: Record<string, string> = {
  shop_title: "Магазин",
  shop_subtitle: "Профессиональная корейская косметика",
  hero_title: "DIB Academy",
  hero_subtitle: "Школа косметологии",
  footer_phone: "+7 (984) 113-12-20",
  footer_email: "dib-interfarm@mail.ru",
  about_text: "Ваш проводник в мир передовой корейской косметологии для профессионалов России.",
}

async function main() {
  for (const [key, value] of Object.entries(DEFAULTS)) {
    await prisma.siteContent.upsert({
      where: { key },
      create: { key, value },
      update: {}, // не перезаписываем существующие
    })
  }
  console.log(`✅ Контент: ${Object.keys(DEFAULTS).length} ключей`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
