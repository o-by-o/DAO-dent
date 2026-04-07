"use client"

import { useState } from "react"
import { ChevronDown, CreditCard, Percent } from "lucide-react"
import { fallbackServices } from "@/lib/dib-interfarm-content"

type ServicePrice = {
  name: string
  price: string
  priceMax?: string
  category: string
}

// Группируем fallback-услуги по категориям + дополняем полным прайсом
const PRICE_DATA: { category: string; services: { name: string; price: string }[] }[] = [
  {
    category: "Терапия",
    services: [
      { name: "Консультация стоматолога", price: "Бесплатно" },
      { name: "Лечение кариеса", price: "от 3 500 ₽" },
      { name: "Лечение пульпита (1 канал)", price: "от 8 000 ₽" },
      { name: "Лечение периодонтита", price: "от 10 000 ₽" },
      { name: "Реставрация зуба", price: "от 5 000 ₽" },
    ],
  },
  {
    category: "Профилактика",
    services: [
      { name: "Профессиональная гигиена (комплекс)", price: "от 4 500 ₽" },
      { name: "Air Flow (1 челюсть)", price: "от 2 500 ₽" },
      { name: "Фторирование", price: "от 1 500 ₽" },
      { name: "Герметизация фиссур (1 зуб)", price: "от 1 500 ₽" },
    ],
  },
  {
    category: "Хирургия",
    services: [
      { name: "Удаление зуба (простое)", price: "от 2 500 ₽" },
      { name: "Удаление зуба (сложное)", price: "от 5 000 ₽" },
      { name: "Удаление зуба мудрости", price: "от 8 000 ₽" },
      { name: "Костная пластика", price: "от 20 000 ₽" },
    ],
  },
  {
    category: "Имплантация",
    services: [
      { name: "Имплант Osstem (Корея)", price: "от 35 000 ₽" },
      { name: "Имплант Straumann (Швейцария)", price: "от 55 000 ₽" },
      { name: "All-on-4 (под ключ)", price: "от 250 000 ₽" },
      { name: "All-on-6 (под ключ)", price: "от 350 000 ₽" },
    ],
  },
  {
    category: "Ортодонтия",
    services: [
      { name: "Металлические брекеты (1 челюсть)", price: "от 40 000 ₽" },
      { name: "Керамические брекеты (1 челюсть)", price: "от 55 000 ₽" },
      { name: "Элайнеры (полный курс)", price: "от 80 000 ₽" },
    ],
  },
  {
    category: "Эстетика",
    services: [
      { name: "Виниры E-max (1 ед.)", price: "от 15 000 ₽" },
      { name: "Отбеливание ZOOM", price: "от 20 000 ₽" },
      { name: "Отбеливание домашнее (капы)", price: "от 8 000 ₽" },
    ],
  },
  {
    category: "Протезирование",
    services: [
      { name: "Коронка металлокерамическая", price: "от 12 000 ₽" },
      { name: "Коронка циркониевая", price: "от 25 000 ₽" },
      { name: "Съёмный протез", price: "от 30 000 ₽" },
    ],
  },
  {
    category: "Детская стоматология",
    services: [
      { name: "Лечение молочных зубов", price: "от 2 000 ₽" },
      { name: "Серебрение (1 зуб)", price: "от 500 ₽" },
      { name: "Герметизация фиссур", price: "от 1 500 ₽" },
    ],
  },
]

const PACKAGES = [
  {
    name: "Комплекс «Здоровые зубы»",
    description: "Консультация + гигиена + фторирование",
    price: "5 500 ₽",
    oldPrice: "7 500 ₽",
    badge: "Выгода 27%",
  },
  {
    name: "Комплекс «Лечение кариеса»",
    description: "Диагностика + лечение + контрольный визит",
    price: "от 4 900 ₽",
    oldPrice: null,
    badge: "Популярный",
  },
  {
    name: "All-on-4 под ключ",
    description: "Имплантация + временный протез + наблюдение",
    price: "от 250 000 ₽",
    oldPrice: null,
    badge: "Рассрочка 0%",
  },
]

export function LandingPrices() {
  const [openCategory, setOpenCategory] = useState<string | null>(PRICE_DATA[0]?.category ?? null)

  return (
    <section id="prices" className="bg-white py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="mb-4 inline-block rounded-full bg-blue-50 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-blue-600">
            Цены
          </span>
          <h2 className="font-serif text-3xl font-semibold text-gray-900 md:text-4xl">
            Открытый прайс-лист
          </h2>
          <p className="mt-4 text-gray-600">
            Честные цены без скрытых платежей. Точная стоимость определяется после консультации.
          </p>
        </div>

        {/* Пакеты услуг */}
        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {PACKAGES.map((pkg) => (
            <div
              key={pkg.name}
              className="relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-6"
            >
              <span className="mb-3 inline-block rounded-full bg-blue-600 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                {pkg.badge}
              </span>
              <h3 className="text-lg font-semibold text-gray-900">{pkg.name}</h3>
              <p className="mt-1 text-sm text-gray-500">{pkg.description}</p>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-blue-600">{pkg.price}</span>
                {pkg.oldPrice && (
                  <span className="text-sm text-gray-400 line-through">{pkg.oldPrice}</span>
                )}
              </div>
              <a
                href="#appointment"
                className="mt-4 block rounded-xl bg-blue-600 py-2.5 text-center text-sm font-medium text-white transition hover:bg-blue-700"
              >
                Записаться
              </a>
            </div>
          ))}
        </div>

        {/* Прайс-лист аккордеон */}
        <div className="mt-12 space-y-2">
          {PRICE_DATA.map((cat) => (
            <div key={cat.category} className="overflow-hidden rounded-2xl border border-gray-100">
              <button
                type="button"
                onClick={() => setOpenCategory(openCategory === cat.category ? null : cat.category)}
                className="flex w-full items-center justify-between bg-white px-6 py-4 text-left transition hover:bg-gray-50"
              >
                <span className="text-base font-semibold text-gray-900">{cat.category}</span>
                <ChevronDown
                  className={`h-5 w-5 text-gray-400 transition ${
                    openCategory === cat.category ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openCategory === cat.category && (
                <div className="border-t border-gray-50 bg-white">
                  <table className="w-full">
                    <tbody>
                      {cat.services.map((service, i) => (
                        <tr
                          key={service.name}
                          className={i % 2 === 0 ? "bg-gray-50/50" : "bg-white"}
                        >
                          <td className="px-6 py-3 text-sm text-gray-700">{service.name}</td>
                          <td className="px-6 py-3 text-right text-sm font-semibold text-blue-600">
                            {service.price}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Рассрочка */}
        <div className="mt-12 flex flex-col items-center gap-6 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 p-8 text-white sm:flex-row sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
              <CreditCard className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Рассрочка 0% на все виды лечения</h3>
              <p className="text-sm text-blue-100">До 12 месяцев без переплат. Оформление за 15 минут.</p>
            </div>
          </div>
          <a
            href="#appointment"
            className="shrink-0 rounded-full bg-white px-8 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
          >
            Узнать подробнее
          </a>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          * Цены указаны ориентировочно. Точная стоимость определяется после осмотра врача.
          Имеются противопоказания. Необходима консультация специалиста.
        </p>
      </div>
    </section>
  )
}
