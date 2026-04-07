"use client"

import Link from "next/link"
import { ArrowLeft, Clock, CreditCard, Phone, CheckCircle } from "lucide-react"
import { SiteHeader } from "@/components/boty/site-header"
import { SiteFooter } from "@/components/boty/site-footer"
import { clinicPhone, clinicPhoneSecondary, clinicAddress, clinicEmail } from "@/lib/dib-interfarm-content"

type ServiceFull = {
  id: string
  name: string
  slug: string
  description: string | null
  price: { toString(): string }
  priceMax: { toString(): string } | null
  durationMin: number
  category: { name: string; slug: string }
}

type RelatedService = {
  id: string
  name: string
  slug: string
  price: { toString(): string }
}

export function ServiceDetailPage({
  service,
  relatedServices,
}: {
  service: ServiceFull
  relatedServices: RelatedService[]
}) {
  const price = Number(service.price)
  const priceMax = service.priceMax ? Number(service.priceMax) : null
  const priceLabel = price === 0
    ? "Бесплатно"
    : priceMax
      ? `${price.toLocaleString("ru-RU")} – ${priceMax.toLocaleString("ru-RU")} ₽`
      : `от ${price.toLocaleString("ru-RU")} ₽`

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader isLoggedIn={false} />

      <main className="pt-28 pb-20">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          {/* Хлебные крошки */}
          <nav className="mb-8 flex items-center gap-2 text-sm text-gray-400">
            <Link href="/" className="hover:text-blue-600">Главная</Link>
            <span>/</span>
            <Link href="/#services" className="hover:text-blue-600">Услуги</Link>
            <span>/</span>
            <span className="text-gray-600">{service.category.name}</span>
          </nav>

          {/* Заголовок */}
          <div className="mb-8">
            <span className="mb-3 inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
              {service.category.name}
            </span>
            <h1 className="font-serif text-3xl font-semibold text-gray-900 md:text-4xl">
              {service.name}
            </h1>
            <h2 className="mt-2 text-lg text-gray-500">
              у метро Семёновская — клиника ДаоДент
            </h2>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Левая колонка — описание */}
            <div className="lg:col-span-2 space-y-8">
              {/* Описание */}
              <div className="prose prose-gray max-w-none">
                <p className="text-base leading-relaxed text-gray-600">
                  {service.description ||
                    `${service.name} в клинике ДаоДент — это современный подход с использованием передовых технологий и материалов. Наши врачи имеют многолетний опыт и регулярно повышают квалификацию.`}
                </p>
              </div>

              {/* Преимущества */}
              <div>
                <h3 className="mb-4 text-lg font-semibold text-gray-900">Почему выбирают нас</h3>
                <div className="space-y-3">
                  {[
                    "Безболезненное лечение с современной анестезией",
                    "Гарантия на все виды работ",
                    "Опытные сертифицированные специалисты",
                    "5 минут от метро Семёновская",
                    "Рассрочка 0% до 12 месяцев",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
                      <span className="text-sm text-gray-600">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Фото до/после — плейсхолдер */}
              <div>
                <h3 className="mb-4 text-lg font-semibold text-gray-900">Примеры работ</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex aspect-[4/3] items-center justify-center rounded-xl bg-gray-100 text-sm text-gray-400">
                    До (фото)
                  </div>
                  <div className="flex aspect-[4/3] items-center justify-center rounded-xl bg-gray-100 text-sm text-gray-400">
                    После (фото)
                  </div>
                </div>
              </div>
            </div>

            {/* Правая колонка — CTA */}
            <div className="space-y-4">
              <div className="sticky top-28 space-y-4">
                {/* Цена */}
                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6">
                  <p className="text-sm text-blue-600">Стоимость</p>
                  <p className="text-3xl font-bold text-blue-700">{priceLabel}</p>
                  <div className="mt-3 flex items-center gap-2 text-sm text-blue-600">
                    <Clock className="h-4 w-4" />
                    <span>{service.durationMin} мин</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-sm text-blue-600">
                    <CreditCard className="h-4 w-4" />
                    <span>Рассрочка 0%</span>
                  </div>
                  <a
                    href="/#appointment"
                    className="mt-4 block rounded-xl bg-blue-600 py-3 text-center text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    Записаться на приём
                  </a>
                  <a
                    href={`tel:${clinicPhone.replace(/\s/g, "")}`}
                    className="mt-2 flex items-center justify-center gap-2 rounded-xl border border-blue-200 py-3 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
                  >
                    <Phone className="h-4 w-4" />
                    {clinicPhone}
                  </a>
                </div>

                {/* Похожие услуги */}
                {relatedServices.length > 0 && (
                  <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <h4 className="mb-3 text-sm font-semibold text-gray-900">Смотрите также</h4>
                    <div className="space-y-2">
                      {relatedServices.map((rs) => (
                        <Link
                          key={rs.id}
                          href={`/services/${rs.slug}`}
                          className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm transition hover:bg-blue-50"
                        >
                          <span className="text-gray-700">{rs.name}</span>
                          <span className="text-xs font-medium text-blue-600">
                            от {Number(rs.price).toLocaleString("ru-RU")} ₽
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Дисклеймер */}
          <p className="mt-12 text-center text-xs text-gray-400">
            Имеются противопоказания. Необходима консультация специалиста.
            Точная стоимость определяется после осмотра.
          </p>
        </div>
      </main>

      <SiteFooter
        footerPhone={clinicPhone}
        footerPhoneSecondary={clinicPhoneSecondary}
        footerAddress={clinicAddress}
        footerEmail={clinicEmail}
      />
    </div>
  )
}
