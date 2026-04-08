"use client"

import { useState } from "react"
import { Calculator, Plus, Trash2, ArrowRight } from "lucide-react"

const PROCEDURES = [
  { name: "Консультация", price: 0 },
  { name: "Лечение кариеса (1 зуб)", price: 5000 },
  { name: "Лечение пульпита (1 канал)", price: 10000 },
  { name: "Профессиональная гигиена", price: 5500 },
  { name: "Удаление зуба (простое)", price: 3500 },
  { name: "Удаление зуба мудрости", price: 10000 },
  { name: "Имплант Osstem", price: 35000 },
  { name: "Имплант Straumann", price: 55000 },
  { name: "Коронка металлокерамика", price: 15000 },
  { name: "Коронка циркониевая", price: 30000 },
  { name: "Винир E-max", price: 25000 },
  { name: "Отбеливание ZOOM", price: 25000 },
  { name: "Брекеты (1 челюсть)", price: 50000 },
  { name: "Элайнеры (курс)", price: 150000 },
  { name: "Фторирование", price: 1500 },
]

export function LandingCalculator() {
  const [selected, setSelected] = useState<{ name: string; price: number; qty: number }[]>([])

  function addProcedure(name: string, price: number) {
    const existing = selected.find((s) => s.name === name)
    if (existing) {
      setSelected(selected.map((s) => s.name === name ? { ...s, qty: s.qty + 1 } : s))
    } else {
      setSelected([...selected, { name, price, qty: 1 }])
    }
  }

  function removeProcedure(name: string) {
    setSelected(selected.filter((s) => s.name !== name))
  }

  const total = selected.reduce((sum, s) => sum + s.price * s.qty, 0)
  const monthlyPayment = total > 0 ? Math.ceil(total / 12) : 0

  return (
    <section className="bg-gray-50 py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="mb-4 inline-block rounded-full bg-blue-50 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-blue-600">
            <Calculator className="mr-1 inline h-3 w-3" />
            Калькулятор
          </span>
          <h2 className="font-serif text-3xl font-semibold text-gray-900 md:text-4xl">
            Рассчитайте стоимость лечения
          </h2>
          <p className="mt-4 text-gray-600">
            Выберите нужные процедуры и узнайте примерную стоимость. Точную цену определит врач после осмотра.
          </p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          {/* Список процедур */}
          <div className="space-y-2">
            <h3 className="mb-3 text-sm font-semibold text-gray-700">Выберите процедуры:</h3>
            {PROCEDURES.map((proc) => (
              <button
                key={proc.name}
                type="button"
                onClick={() => addProcedure(proc.name, proc.price)}
                className="flex w-full items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3 text-left text-sm transition hover:border-blue-200 hover:bg-blue-50"
              >
                <span className="text-gray-700">{proc.name}</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-blue-600">
                    {proc.price === 0 ? "Бесплатно" : `${proc.price.toLocaleString("ru-RU")} ₽`}
                  </span>
                  <Plus className="h-4 w-4 text-blue-400" />
                </div>
              </button>
            ))}
          </div>

          {/* Итого */}
          <div>
            <div className="sticky top-28 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Ваш расчёт</h3>

              {selected.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-400">
                  Выберите процедуры из списка слева
                </p>
              ) : (
                <div className="space-y-2">
                  {selected.map((s) => (
                    <div key={s.name} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                      <div className="flex-1">
                        <span className="text-sm text-gray-700">{s.name}</span>
                        {s.qty > 1 && <span className="ml-1 text-xs text-gray-400">x{s.qty}</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          {(s.price * s.qty).toLocaleString("ru-RU")} ₽
                        </span>
                        <button
                          type="button"
                          onClick={() => removeProcedure(s.name)}
                          className="rounded p-1 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {total > 0 && (
                <>
                  <div className="mt-4 border-t border-gray-100 pt-4">
                    <div className="flex justify-between text-lg">
                      <span className="font-semibold text-gray-900">Итого:</span>
                      <span className="font-bold text-blue-600">{total.toLocaleString("ru-RU")} ₽</span>
                    </div>
                    <p className="mt-1 text-xs text-gray-400">
                      или {monthlyPayment.toLocaleString("ru-RU")} ₽/мес в рассрочку на 12 мес
                    </p>
                  </div>

                  <a
                    href="#appointment"
                    className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    Записаться на консультацию
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </>
              )}

              <p className="mt-4 text-center text-[10px] text-gray-400">
                * Цены ориентировочные. Точную стоимость определит врач после осмотра.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
