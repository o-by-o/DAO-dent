"use client"

import { MapPin, Clock, Car, Train } from "lucide-react"

export function LandingLocation() {
  return (
    <section id="contacts" className="bg-gray-50 py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="mb-4 inline-block rounded-full bg-blue-50 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-blue-600">
            Контакты
          </span>
          <h2 className="font-serif text-3xl font-semibold text-gray-900 md:text-4xl">
            Как нас найти
          </h2>
          <p className="mt-4 text-gray-600">
            5 минут пешком от метро Семёновская
          </p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-2">
          {/* Карта (заглушка) */}
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-200">
            <div className="flex h-[400px] items-center justify-center text-gray-400">
              <div className="text-center">
                <MapPin className="mx-auto mb-4 h-12 w-12" />
                <p className="text-sm font-medium">Яндекс.Карта</p>
                <p className="mt-1 text-xs">Интерактивная карта будет подключена</p>
              </div>
            </div>
          </div>

          {/* Информация */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Адрес</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    г. Москва, ул. Семёновская, д. XX
                  </p>
                  <p className="text-sm text-gray-500">
                    м. Семёновская, выход 1, далее 5 минут пешком
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Режим работы</h3>
                  <div className="mt-1 space-y-1 text-sm text-gray-600">
                    <p>Пн–Пт: 9:00–21:00</p>
                    <p>Сб: 10:00–18:00</p>
                    <p>Вс: выходной</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Train className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Как добраться</h3>
                  <div className="mt-1 space-y-1 text-sm text-gray-600">
                    <p>м. Семёновская — 5 мин пешком</p>
                    <p>м. Электрозаводская — 10 мин пешком</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Car className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Парковка</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Бесплатная парковка во дворе клиники
                  </p>
                </div>
              </div>
            </div>

            {/* Районы */}
            <div className="rounded-2xl bg-blue-50 p-6">
              <h3 className="mb-3 font-semibold text-gray-900">
                Удобно жителям районов:
              </h3>
              <div className="flex flex-wrap gap-2">
                {["Соколиная Гора", "Измайлово", "Электрозаводская", "Преображенское", "Семёновская", "Лефортово"].map(
                  (district) => (
                    <span
                      key={district}
                      className="rounded-full bg-white px-3 py-1 text-xs font-medium text-blue-700 shadow-sm"
                    >
                      {district}
                    </span>
                  ),
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
