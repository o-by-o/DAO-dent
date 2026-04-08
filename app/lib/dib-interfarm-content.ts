/**
 * Контент клиники ДаоДент для лендинга и компонентов.
 */

export const CLINIC_NAME = "ДаоДент" as const
export const CLINIC_FULL_NAME = "Стоматологическая клиника ДаоДент" as const
export const CLINIC_TAGLINE = "Семейная стоматология у м. Семёновская" as const

export const clinicPhone = "+7 (495) 000-00-00"
export const clinicPhoneSecondary = "+7 (906) 000-00-00"
export const clinicAddress = "г. Москва, ул. Семёновская, д. XX, м. Семёновская — 5 минут пешком"
export const clinicEmail = "info@daodent.ru"

export const clinicWorkingHours = {
  weekdays: "Пн–Пт: 9:00–21:00",
  saturday: "Сб: 10:00–18:00",
  sunday: "Вс: выходной",
}

export const clinicGeo = {
  lat: 55.7818,
  lng: 37.7193,
  metro: "Семёновская",
  districts: ["Соколиная Гора", "Измайлово", "Электрозаводская", "Преображенское"],
}

export const clinicSocial = [
  { label: "Telegram", href: "https://t.me/daodent" },
  { label: "WhatsApp", href: "https://wa.me/74950000000" },
  { label: "ВКонтакте", href: "https://vk.com/daodent" },
]

/** Статичные карточки услуг для лендинга (когда в БД нет данных) */
export const fallbackServices = [
  {
    id: "fs-1",
    name: "Лечение кариеса",
    category: "Терапия",
    priceLabel: "от 3 500 ₽",
    icon: "tooth",
    description: "Безболезненное лечение кариеса с использованием современных пломбировочных материалов",
  },
  {
    id: "fs-2",
    name: "Профессиональная гигиена",
    category: "Профилактика",
    priceLabel: "от 4 500 ₽",
    icon: "sparkles",
    description: "Ультразвуковая чистка, Air Flow, полировка и фторирование",
  },
  {
    id: "fs-3",
    name: "Имплантация зубов",
    category: "Имплантация",
    priceLabel: "от 35 000 ₽",
    icon: "implant",
    description: "Установка имплантов ведущих мировых производителей с пожизненной гарантией",
  },
  {
    id: "fs-4",
    name: "Виниры и коронки",
    category: "Эстетика",
    priceLabel: "от 15 000 ₽",
    icon: "smile",
    description: "Керамические и циркониевые виниры для идеальной улыбки",
  },
  {
    id: "fs-5",
    name: "Удаление зубов",
    category: "Хирургия",
    priceLabel: "от 2 500 ₽",
    icon: "scissors",
    description: "Простое и сложное удаление, включая зубы мудрости",
  },
  {
    id: "fs-6",
    name: "Детская стоматология",
    category: "Детская",
    priceLabel: "от 2 000 ₽",
    icon: "baby",
    description: "Бережное лечение в игровой форме, герметизация фиссур, серебрение",
  },
] as const

/** Статичные карточки врачей */
export const fallbackDoctors = [
  {
    id: "fd-1",
    name: "Иванов Алексей Петрович",
    specialization: "Стоматолог-терапевт",
    experience: "15 лет",
    description: "Специалист по лечению кариеса и его осложнений, эндодонтии",
  },
  {
    id: "fd-2",
    name: "Петрова Мария Сергеевна",
    specialization: "Стоматолог-ортодонт",
    experience: "12 лет",
    description: "Исправление прикуса брекетами и элайнерами у детей и взрослых",
  },
  {
    id: "fd-3",
    name: "Сидоров Дмитрий Владимирович",
    specialization: "Стоматолог-хирург, имплантолог",
    experience: "18 лет",
    description: "Имплантация, костная пластика, удаление любой сложности",
  },
] as const

/** Отзывы для лендинга */
export const fallbackReviews = [
  {
    name: "Светлана К.",
    text: "Лечила кариес у доктора Иванова — абсолютно безболезненно! Теперь вся семья ходит только сюда.",
    tag: "Терапия",
    rating: 5,
  },
  {
    name: "Дмитрий П.",
    text: "Поставил два импланта. Всё прошло быстро и без осложнений. Рекомендую клинику!",
    tag: "Имплантация",
    rating: 5,
  },
  {
    name: "Анна М.",
    text: "Дочке 6 лет — она теперь сама просится к стоматологу! Врачи умеют найти подход к детям.",
    tag: "Детская стоматология",
    rating: 5,
  },
  {
    name: "Олег В.",
    text: "Профгигиена здесь — лучшая, что я пробовал. Зубы как новые, и цена адекватная.",
    tag: "Гигиена",
    rating: 5,
  },
] as const
