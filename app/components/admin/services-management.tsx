"use client"

import { Clock, DollarSign, Eye, EyeOff } from "lucide-react"

type ServiceRow = {
  id: string
  name: string
  slug: string
  price: { toString(): string }
  priceMax: { toString(): string } | null
  durationMin: number
  published: boolean
  order: number
}

type CategoryRow = {
  id: string
  name: string
  slug: string
  order: number
  services: ServiceRow[]
}

export function ServicesManagementPage({ categories }: { categories: CategoryRow[] }) {
  const totalServices = categories.reduce((sum, c) => sum + c.services.length, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Услуги клиники</h1>
          <p className="text-sm text-gray-500">
            {categories.length} категорий, {totalServices} услуг
          </p>
        </div>
        <button className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700">
          + Добавить услугу
        </button>
      </div>

      {categories.length === 0 && (
        <div className="rounded-2xl bg-gray-50 p-12 text-center text-gray-400">
          Услуги не найдены. Запустите seed: <code>npx tsx scripts/seed-clinic.ts</code>
        </div>
      )}

      {categories.map((category) => (
        <div key={category.id} className="rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">{category.name}</h2>
            <p className="text-xs text-gray-400">{category.services.length} услуг</p>
          </div>

          <div className="divide-y divide-gray-50">
            {category.services.map((service) => {
              const price = Number(service.price)
              const priceMax = service.priceMax ? Number(service.priceMax) : null
              const priceLabel = priceMax
                ? `${price.toLocaleString("ru-RU")} – ${priceMax.toLocaleString("ru-RU")} ₽`
                : price === 0
                  ? "Бесплатно"
                  : `от ${price.toLocaleString("ru-RU")} ₽`

              return (
                <div key={service.id} className="flex items-center justify-between px-6 py-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{service.name}</span>
                      {!service.published && (
                        <span className="flex items-center gap-1 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">
                          <EyeOff className="h-3 w-3" /> скрыта
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {priceLabel}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {service.durationMin} мин
                      </span>
                    </div>
                  </div>
                  <button className="rounded-lg bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-100">
                    Редактировать
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
