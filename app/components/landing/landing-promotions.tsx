"use client"

import { Gift, Clock, Percent, Sparkles } from "lucide-react"

const PROMOTIONS = [
  {
    icon: Gift,
    title: "Бесплатная консультация",
    description: "Первичный осмотр и план лечения бесплатно для новых пациентов",
    badge: "Новым пациентам",
    color: "from-blue-500 to-blue-600",
  },
  {
    icon: Percent,
    title: "Скидка 20% на гигиену",
    description: "Профессиональная чистка со скидкой при первом посещении клиники",
    badge: "До конца месяца",
    color: "from-emerald-500 to-emerald-600",
  },
  {
    icon: Sparkles,
    title: "Семейная скидка 10%",
    description: "Приходите всей семьёй — получите скидку на лечение каждого члена семьи",
    badge: "Постоянная акция",
    color: "from-purple-500 to-purple-600",
  },
  {
    icon: Clock,
    title: "Рассрочка 0% до 12 месяцев",
    description: "На имплантацию, протезирование и ортодонтию. Без переплат и первого взноса",
    badge: "Рассрочка",
    color: "from-amber-500 to-orange-500",
  },
]

export function LandingPromotions() {
  return (
    <section id="promotions" className="bg-white py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="mb-4 inline-block rounded-full bg-amber-50 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-amber-600">
            Акции
          </span>
          <h2 className="font-serif text-3xl font-semibold text-gray-900 md:text-4xl">
            Специальные предложения
          </h2>
          <p className="mt-4 text-gray-600">
            Выгодные условия для новых и постоянных пациентов
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {PROMOTIONS.map((promo) => {
            const Icon = promo.icon
            return (
              <div
                key={promo.title}
                className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:shadow-md"
              >
                {/* Градиентный акцент сверху */}
                <div
                  className={`absolute left-0 right-0 top-0 h-1 bg-gradient-to-r ${promo.color}`}
                />

                <div className="flex items-start gap-4">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${promo.color} text-white shadow-lg`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-gray-900">{promo.title}</h3>
                    </div>
                    <span className="mb-2 inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                      {promo.badge}
                    </span>
                    <p className="mt-2 text-sm leading-relaxed text-gray-500">
                      {promo.description}
                    </p>
                  </div>
                </div>

                <a
                  href="#appointment"
                  className="mt-4 block rounded-xl bg-gray-50 py-2.5 text-center text-sm font-medium text-blue-600 transition hover:bg-blue-50"
                >
                  Воспользоваться &rarr;
                </a>
              </div>
            )
          })}
        </div>

        {/* Блок для жителей района */}
        <div className="mt-12 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white">
          <div className="mx-auto max-w-2xl text-center">
            <h3 className="text-xl font-semibold">
              Скидка жителям Соколиной Горы и Измайлово
            </h3>
            <p className="mt-3 text-blue-100">
              Покажите любой документ с регистрацией в районе и получите дополнительную
              скидку 5% на первое посещение. Мы ценим наших соседей!
            </p>
            <a
              href="#appointment"
              className="mt-6 inline-block rounded-full bg-white px-8 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
            >
              Записаться со скидкой
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
