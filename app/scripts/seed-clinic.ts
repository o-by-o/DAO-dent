/**
 * Сидинг начальных данных для клиники ДаоДент
 * Запуск: npx tsx scripts/seed-clinic.ts
 */
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("Сидинг данных клиники ДаоДент...")

  // 1. Кабинеты
  const cabinets = await Promise.all(
    [
      { name: "Кабинет 1", number: 1 },
      { name: "Кабинет 2", number: 2 },
      { name: "Кабинет 3", number: 3 },
    ].map((c) =>
      prisma.cabinet.upsert({
        where: { number: c.number },
        update: {},
        create: c,
      }),
    ),
  )
  console.log(`Кабинеты: ${cabinets.length}`)

  // 2. Пользователи (врачи + админ + владелец)
  const hashedPassword = await bcrypt.hash("daodent2026", 12)

  const owner = await prisma.user.upsert({
    where: { email: "owner@daodent.ru" },
    update: {},
    create: {
      email: "owner@daodent.ru",
      name: "Владелец клиники",
      hashedPassword,
      role: "OWNER",
      phone: "+7 (495) 000-00-00",
    },
  })

  const admin = await prisma.user.upsert({
    where: { email: "admin@daodent.ru" },
    update: {},
    create: {
      email: "admin@daodent.ru",
      name: "Администратор ресепшна",
      hashedPassword,
      role: "ADMIN",
      phone: "+7 (495) 000-00-01",
    },
  })

  const doctors = await Promise.all([
    prisma.user.upsert({
      where: { email: "ivanov@daodent.ru" },
      update: {},
      create: {
        email: "ivanov@daodent.ru",
        name: "Иванов Алексей Петрович",
        hashedPassword,
        role: "DOCTOR",
        phone: "+7 (495) 000-00-10",
        specialization: "Стоматолог-терапевт",
        experience: "15 лет",
        bio: "Специалист по лечению кариеса и его осложнений, эндодонтии. Постоянно повышает квалификацию.",
      },
    }),
    prisma.user.upsert({
      where: { email: "petrova@daodent.ru" },
      update: {},
      create: {
        email: "petrova@daodent.ru",
        name: "Петрова Мария Сергеевна",
        hashedPassword,
        role: "DOCTOR",
        phone: "+7 (495) 000-00-11",
        specialization: "Стоматолог-ортодонт",
        experience: "12 лет",
        bio: "Исправление прикуса брекетами и элайнерами у детей и взрослых. Индивидуальный подход к каждому пациенту.",
      },
    }),
    prisma.user.upsert({
      where: { email: "sidorov@daodent.ru" },
      update: {},
      create: {
        email: "sidorov@daodent.ru",
        name: "Сидоров Дмитрий Владимирович",
        hashedPassword,
        role: "DOCTOR",
        phone: "+7 (495) 000-00-12",
        specialization: "Стоматолог-хирург, имплантолог",
        experience: "18 лет",
        bio: "Имплантация, костная пластика, удаление любой сложности. Более 3000 установленных имплантов.",
      },
    }),
  ])
  console.log(`Врачи: ${doctors.length}, Владелец: ${owner.email}, Админ: ${admin.email}`)

  // 3. Категории услуг
  const categories = await Promise.all(
    [
      { name: "Терапия", slug: "therapy", order: 1 },
      { name: "Хирургия", slug: "surgery", order: 2 },
      { name: "Имплантация", slug: "implantation", order: 3 },
      { name: "Ортодонтия", slug: "orthodontics", order: 4 },
      { name: "Эстетическая стоматология", slug: "esthetics", order: 5 },
      { name: "Детская стоматология", slug: "pediatric", order: 6 },
      { name: "Профилактика", slug: "prevention", order: 7 },
      { name: "Протезирование", slug: "prosthetics", order: 8 },
    ].map((c) =>
      prisma.serviceCategory.upsert({
        where: { slug: c.slug },
        update: {},
        create: c,
      }),
    ),
  )
  console.log(`Категории: ${categories.length}`)

  // 4. Услуги
  const categoryMap = Object.fromEntries(categories.map((c) => [c.slug, c.id]))

  const services = [
    { name: "Консультация стоматолога", slug: "consultation", categoryId: categoryMap["therapy"]!, price: 0, durationMin: 30, order: 1 },
    { name: "Лечение кариеса", slug: "caries-treatment", categoryId: categoryMap["therapy"]!, price: 3500, priceMax: 7000, durationMin: 60, order: 2 },
    { name: "Лечение пульпита", slug: "pulpitis", categoryId: categoryMap["therapy"]!, price: 8000, priceMax: 15000, durationMin: 90, order: 3 },
    { name: "Лечение периодонтита", slug: "periodontitis", categoryId: categoryMap["therapy"]!, price: 10000, priceMax: 18000, durationMin: 90, order: 4 },
    { name: "Профессиональная гигиена", slug: "hygiene", categoryId: categoryMap["prevention"]!, price: 4500, priceMax: 7000, durationMin: 60, order: 1 },
    { name: "Фторирование", slug: "fluoridation", categoryId: categoryMap["prevention"]!, price: 1500, durationMin: 30, order: 2 },
    { name: "Удаление зуба (простое)", slug: "extraction-simple", categoryId: categoryMap["surgery"]!, price: 2500, priceMax: 5000, durationMin: 30, order: 1 },
    { name: "Удаление зуба мудрости", slug: "extraction-wisdom", categoryId: categoryMap["surgery"]!, price: 8000, priceMax: 15000, durationMin: 60, order: 2 },
    { name: "Имплантация (1 имплант)", slug: "implant-single", categoryId: categoryMap["implantation"]!, price: 35000, priceMax: 70000, durationMin: 90, order: 1 },
    { name: "All-on-4", slug: "all-on-4", categoryId: categoryMap["implantation"]!, price: 250000, priceMax: 430000, durationMin: 180, order: 2 },
    { name: "Установка брекет-системы", slug: "braces", categoryId: categoryMap["orthodontics"]!, price: 40000, priceMax: 90000, durationMin: 90, order: 1 },
    { name: "Элайнеры", slug: "aligners", categoryId: categoryMap["orthodontics"]!, price: 80000, priceMax: 250000, durationMin: 60, order: 2 },
    { name: "Виниры (1 ед.)", slug: "veneer", categoryId: categoryMap["esthetics"]!, price: 15000, priceMax: 35000, durationMin: 60, order: 1 },
    { name: "Отбеливание ZOOM", slug: "whitening-zoom", categoryId: categoryMap["esthetics"]!, price: 20000, priceMax: 30000, durationMin: 90, order: 2 },
    { name: "Коронка металлокерамическая", slug: "crown-metalceramic", categoryId: categoryMap["prosthetics"]!, price: 12000, priceMax: 20000, durationMin: 60, order: 1 },
    { name: "Коронка циркониевая", slug: "crown-zirconia", categoryId: categoryMap["prosthetics"]!, price: 25000, priceMax: 40000, durationMin: 60, order: 2 },
    { name: "Лечение молочных зубов", slug: "pediatric-treatment", categoryId: categoryMap["pediatric"]!, price: 2000, priceMax: 5000, durationMin: 30, order: 1 },
    { name: "Герметизация фиссур", slug: "fissure-sealant", categoryId: categoryMap["pediatric"]!, price: 1500, priceMax: 2500, durationMin: 20, order: 2 },
  ]

  for (const s of services) {
    await prisma.service.upsert({
      where: { slug: s.slug },
      update: {},
      create: {
        name: s.name,
        slug: s.slug,
        categoryId: s.categoryId,
        price: s.price,
        priceMax: s.priceMax || null,
        durationMin: s.durationMin,
        order: s.order,
      },
    })
  }
  console.log(`Услуги: ${services.length}`)

  // 5. Контент сайта
  const siteContent = [
    { key: "hero_title", value: "Семейная стоматология у метро Семёновская — 5 минут пешком" },
    { key: "hero_subtitle", value: "Безболезненное лечение, современное оборудование, опытные врачи. Запишитесь онлайн прямо сейчас." },
    { key: "about_text", value: "Клиника ДаоДент — это современная стоматология для всей семьи в шаговой доступности от метро Семёновская. Мы используем передовые технологии и материалы мировых лидеров для безболезненного и качественного лечения." },
    { key: "footer_phone", value: "+7 (495) 000-00-00" },
    { key: "footer_email", value: "info@daodent.ru" },
  ]

  for (const c of siteContent) {
    await prisma.siteContent.upsert({
      where: { key: c.key },
      update: { value: c.value },
      create: c,
    })
  }
  console.log(`Контент сайта: ${siteContent.length}`)

  // 6. Склады
  await prisma.warehouse.upsert({
    where: { id: "warehouse-main" },
    update: {},
    create: { id: "warehouse-main", name: "Основной склад", type: "MAIN" },
  })
  for (const cab of cabinets) {
    await prisma.warehouse.upsert({
      where: { id: `warehouse-cab-${cab.number}` },
      update: {},
      create: {
        id: `warehouse-cab-${cab.number}`,
        name: `Кабинет ${cab.number}`,
        type: "CABINET",
      },
    })
  }
  console.log("Склады созданы")

  console.log("\nСидинг завершён!")
  console.log("Логины:")
  console.log("  Владелец: owner@daodent.ru / daodent2026")
  console.log("  Админ: admin@daodent.ru / daodent2026")
  console.log("  Врач 1: ivanov@daodent.ru / daodent2026")
  console.log("  Врач 2: petrova@daodent.ru / daodent2026")
  console.log("  Врач 3: sidorov@daodent.ru / daodent2026")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
