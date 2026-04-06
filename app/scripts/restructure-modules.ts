/**
 * Миграция: 5 уроков → 5 модулей (по одному уроку в каждом)
 *
 * Запуск: pnpm exec tsx scripts/restructure-modules.ts
 */
import "dotenv/config"

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const COURSE_SLUG = "business-cosmetology"

const MODULE_1_ID = "cmldxytoj001iogk6kmp1q1tj"
const MODULE_2_ID = "cmldxytoj001nogk6krwcp5kj"

const LESSON_2_ID = "cmldxytoj001kogk6yel43j7o" // Анализ кожи и подбор ухода
const LESSON_3_ID = "cmldxytoj001logk61g8hx61r" // Посттравматическая пигментация
const LESSON_4_ID = "cmldxytoj001mogk6eotu9sni" // Пилинг DuoPeel для проблемной кожи
const LESSON_5_ID = "cmldxytoj001oogk64f5hy81l" // Пилинг DuoPeel для осветления пигментации

async function main() {
  console.log("🔧 Реструктуризация: 5 уроков → 5 модулей\n")

  const course = await prisma.course.findUnique({ where: { slug: COURSE_SLUG } })
  if (!course) throw new Error(`Курс не найден: ${COURSE_SLUG}`)
  console.log(`📚 Курс: ${course.title}\n`)

  await prisma.$transaction(async (tx) => {
    // 1. Создаём 3 новых модуля (orders 3, 4, 5)
    console.log("➕ Создаю модули 3, 4, 5...")
    const mod3 = await tx.module.create({
      data: { title: "Модуль 3: Посттравматическая пигментация", order: 3, courseId: course.id },
    })
    const mod4 = await tx.module.create({
      data: { title: "Модуль 4: Пилинг DuoPeel для проблемной кожи", order: 4, courseId: course.id },
    })
    const mod5 = await tx.module.create({
      data: { title: "Модуль 5: Пилинг DuoPeel для осветления пигментации", order: 5, courseId: course.id },
    })

    // 2. Переносим уроки 5, 4, 3 из модуля 2 в новые модули
    console.log("🔀 Переношу уроки в новые модули...")
    await tx.lesson.update({ where: { id: LESSON_5_ID }, data: { moduleId: mod5.id, order: 1 } })
    await tx.lesson.update({ where: { id: LESSON_4_ID }, data: { moduleId: mod4.id, order: 1 } })
    await tx.lesson.update({ where: { id: LESSON_3_ID }, data: { moduleId: mod3.id, order: 1 } })

    // 3. Переносим урок 2 из модуля 1 в модуль 2 (теперь пустой)
    await tx.lesson.update({ where: { id: LESSON_2_ID }, data: { moduleId: MODULE_2_ID, order: 1 } })

    // 4. Переименовываем модули 1 и 2
    console.log("✏️  Переименовываю модули...")
    await tx.module.update({
      where: { id: MODULE_1_ID },
      data: { title: "Модуль 1: Корейский косметический массаж" },
    })
    await tx.module.update({
      where: { id: MODULE_2_ID },
      data: { title: "Модуль 2: Анализ кожи и подбор ухода" },
    })
  })

  // Проверка
  console.log("\n✅ Результат:\n")
  const updated = await prisma.course.findUnique({
    where: { slug: COURSE_SLUG },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: { lessons: { select: { title: true, muxAssetId: true } } },
      },
    },
  })
  for (const mod of updated!.modules) {
    const lesson = mod.lessons[0]
    const video = lesson?.muxAssetId ? "✅" : "⬜"
    console.log(`  ${video} ${mod.title} → ${lesson?.title}`)
  }
  console.log("\n🎉 Готово!")
}

main()
  .catch((e) => { console.error("❌ Ошибка:", e); process.exit(1) })
  .finally(() => prisma.$disconnect())
