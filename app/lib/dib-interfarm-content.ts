/**
 * Публичные материалы с витрины dib-interfarm.ru (изображения и формулировки главной страницы).
 * Используются на лендинге для согласованности с действующим сайтом компании.
 */
export const DIB_INTERFARM_ORIGIN = "https://dib-interfarm.ru" as const

export type DibInterfarmHeroSlide = {
  imageUrl: string
  title: string
  subtitle: string
}

/** Три ключевых баннера главной dib-interfarm.ru (категории + обучение) */
export const dibInterfarmHeroSlides: readonly DibInterfarmHeroSlide[] = [
  {
    imageUrl: `${DIB_INTERFARM_ORIGIN}/thumb/2/iPsw_eJ5nx4qUFSZYbTHbQ/1200r1200/d/apparat.jpg`,
    title: "Аппаратная косметология",
    subtitle:
      "Современные процедуры с мгновенным эффектом без боли, уколов и длительной реабилитации",
  },
  {
    imageUrl: `${DIB_INTERFARM_ORIGIN}/thumb/2/KxS3SawL_mSJyLN1uzuZtQ/1200r1200/d/krem.jpg`,
    title: "Совершенство во всём",
    subtitle: "Выбирайте свой образ в работе с профессиональной косметикой",
  },
  {
    imageUrl: `${DIB_INTERFARM_ORIGIN}/thumb/2/8PUtFDL5tSE6tcdJWlX1xg/1200r1200/d/ampuly.jpg`,
    title: "Уход, который работает",
    subtitle:
      "Подбираем средства по типу кожи, сезону и задачам. Проверенные бренды и оригинальные формулы",
  },
]

/** Фоновый кадр с главной витрины (визуальный якорь бренда) */
export const dibInterfarmHeroBackdropUrl = `${DIB_INTERFARM_ORIGIN}/thumb/2/YX3fzCIqyzCScESQbeJ1uQ/1200r1200/d/111.jpg`

/** Иллюстрация блока «Обучение» с раздела курсов на dib-interfarm.ru */
export const dibInterfarmCoursesSpotlightUrl = `${DIB_INTERFARM_ORIGIN}/thumb/2/pplt9xdRMBIxA8nLFY-SeQ/1200r1200/d/ucheba.jpg`

/** Доп. телефон с сайта */
export const dibInterfarmPhoneSecondary = "+7 (906) 051-76-13"

/** Адрес офиса с dib-interfarm.ru */
export const dibInterfarmAddress = "г. Москва, ул. Александры Монаховой, 43 к. 1"

/**
 * Запасные изображения для тизеров товаров, если в БД нет imageUrl
 * (миниатюры каталога с dib-interfarm.ru).
 */
export const dibInterfarmProductFallbackImages: readonly string[] = [
  `${DIB_INTERFARM_ORIGIN}/thumb/2/40BVa5B9btWUwtzHCpHWNA/1200r1200/d/g1_651524.jpg`,
  `${DIB_INTERFARM_ORIGIN}/thumb/2/Dc1JU8b_m4AOPftSqcqtZA/800r800/d/img_1jpg.jpg`,
  `${DIB_INTERFARM_ORIGIN}/thumb/2/8RTaHbVYQ-k1X6zztu_IZw/1200r1200/d/img_1jpg.jpg`,
  `${DIB_INTERFARM_ORIGIN}/thumb/2/KxS3SawL_mSJyLN1uzuZtQ/1200r1200/d/krem.jpg`,
]

/**
 * Статичные тизеры товаров для лендинга (когда в БД нет published-товаров).
 * Иллюстрации — сгенерированы под визуал DIB Academy (премиальный K-beauty / клиника).
 */
export const dibInterfarmFallbackProducts = [
  {
    id: "fp-1",
    name: "Крем двойной антибактериальный. 50 мл",
    brand: "Dr.PaceLeader",
    priceLabel: "3 390 ₽",
    imageUrl: "/images/landing/landing-product-01-skincare.png",
    fallbackImageUrl: null,
  },
  {
    id: "fp-2",
    name: "Крем двойной омолаживающий. 200 мл",
    brand: "Dr.PaceLeader",
    priceLabel: "6 500 ₽",
    imageUrl: "/images/landing/landing-product-02-antiage.png",
    fallbackImageUrl: null,
  },
  {
    id: "fp-3",
    name: "Солнцезащитный крем SPF50+",
    brand: "Dr.PaceLeader",
    priceLabel: "3 390 ₽",
    imageUrl: "/images/landing/landing-product-03-spf.png",
    fallbackImageUrl: null,
  },
  {
    id: "fp-4",
    name: "Солнцезащитный крем с пептидами",
    brand: "DERMACHIC",
    priceLabel: "1 850 ₽",
    imageUrl: "/images/landing/landing-product-04-peptide.png",
    fallbackImageUrl: null,
  },
] as const

/**
 * Статичные тизеры курсов для лендинга (когда в БД нет published-курсов).
 * Соответствуют сид-данным из seed-courses.ts.
 */
export const dibInterfarmFallbackCourses = [
  {
    id: "fc-1",
    title: "Корейские протоколы ухода за кожей",
    description:
      "Полный курс по корейской системе ухода за кожей. 4 модуля, 15 уроков — от философии K-beauty до профессиональных протоколов.",
    thumbnailUrl: "/images/landing/landing-course-kbeauty.png",
    slug: "korean-skincare",
    moduleCount: 4,
  },
  {
    id: "fc-2",
    title: "Основы инъекционной косметологии",
    description:
      "Ботулотоксин, филлеры, мезотерапия. 6 модулей, 24 урока для специалистов.",
    thumbnailUrl: "/images/landing/landing-course-injection.png",
    slug: "injection-cosmetology",
    moduleCount: 6,
  },
  {
    id: "fc-3",
    title: "Косметология",
    description:
      "Уходовые техники, анализ кожи, работа с пигментацией и пилинги. 5 модулей.",
    thumbnailUrl: "/images/landing/landing-course-cosmetology.png",
    slug: "business-cosmetology",
    moduleCount: 5,
  },
] as const

/** Локальные иллюстрации для карточек «Косметика» на главной (всегда, данные текста — из БД). */
export const landingCollectionProductArt: readonly string[] = dibInterfarmFallbackProducts.map(
  (p) => p.imageUrl,
)

/** Локальные иллюстрации для карточек «Курсы» на главной. */
export const landingCollectionCourseArt: readonly string[] = dibInterfarmFallbackCourses.map(
  (c) => c.thumbnailUrl,
)
