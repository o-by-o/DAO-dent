"use client"

import { Shield, Award, Microscope, Heart, Clock, Users } from "lucide-react"

const ADVANTAGES = [
  {
    icon: Microscope,
    title: "Современное оборудование",
    text: "Цифровой рентген с минимальной дозой облучения, дентальный микроскоп, лазер для безболезненного лечения",
  },
  {
    icon: Shield,
    title: "Гарантия на лечение",
    text: "Даём гарантию на все виды работ. Пломбы — 3 года, коронки — 5 лет, импланты — пожизненно",
  },
  {
    icon: Heart,
    title: "Безболезненное лечение",
    text: "Современная анестезия, седация для тревожных пациентов. Лечение во сне для детей и взрослых",
  },
  {
    icon: Award,
    title: "Лицензии и сертификаты",
    text: "Все врачи с действующими сертификатами. Клиника лицензирована Росздравнадзором",
  },
  {
    icon: Clock,
    title: "Удобный график",
    text: "Работаем до 21:00 в будни. Приём в субботу. Экстренная помощь без очередей",
  },
  {
    icon: Users,
    title: "Семейная клиника",
    text: "Лечим детей от 3 лет и взрослых. Скидки для всей семьи при лечении нескольких членов",
  },
]

const STATS = [
  { value: "2 500+", label: "довольных пациентов" },
  { value: "15+", label: "лет опыта врачей" },
  { value: "98%", label: "рекомендуют нас" },
  { value: "4.9", label: "рейтинг на Яндекс.Картах" },
]

export function LandingAbout() {
  return (
    <section id="about" className="bg-gray-50 py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="mb-4 inline-block rounded-full bg-blue-50 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-blue-600">
            О клинике
          </span>
          <h2 className="font-serif text-3xl font-semibold text-gray-900 md:text-4xl">
            Почему выбирают ДаоДент
          </h2>
          <p className="mt-4 text-gray-600">
            Современная стоматология с заботой о каждом пациенте.
            Мы&nbsp;сочетаем передовые технологии с индивидуальным подходом.
          </p>
        </div>

        {/* Статистика */}
        <div className="mt-12 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="rounded-2xl bg-white p-6 text-center shadow-sm">
              <div className="text-3xl font-bold text-blue-600">{s.value}</div>
              <div className="mt-1 text-sm text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Преимущества */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {ADVANTAGES.map((adv) => {
            const Icon = adv.icon
            return (
              <div key={adv.title} className="rounded-2xl bg-white p-6 shadow-sm">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-base font-semibold text-gray-900">{adv.title}</h3>
                <p className="text-sm leading-relaxed text-gray-500">{adv.text}</p>
              </div>
            )
          })}
        </div>

        {/* Фотогалерея (плейсхолдеры) */}
        <div className="mt-16">
          <h3 className="mb-6 text-center text-lg font-semibold text-gray-900">
            Наша клиника
          </h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {["Кабинет 1", "Кабинет 2", "Ресепшн", "Зона ожидания"].map((label) => (
              <div
                key={label}
                className="flex aspect-[4/3] items-center justify-center rounded-2xl bg-gray-200 text-sm text-gray-400"
              >
                {label}
                <br />
                (фото)
              </div>
            ))}
          </div>
          <p className="mt-4 text-center text-xs text-gray-400">
            Реальные фотографии клиники ДаоДент
          </p>
        </div>

        {/* Лицензии */}
        <div className="mt-12 rounded-2xl border border-blue-100 bg-blue-50 p-6 text-center">
          <Award className="mx-auto mb-3 h-8 w-8 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Лицензии и сертификаты</h3>
          <p className="mt-2 text-sm text-gray-600">
            Клиника ДаоДент имеет все необходимые лицензии на осуществление медицинской
            деятельности. Все врачи сертифицированы и регулярно повышают квалификацию.
          </p>
          <div className="mt-4 flex justify-center gap-3">
            {["Лицензия", "Сертификат", "Свидетельство"].map((doc) => (
              <div
                key={doc}
                className="flex h-20 w-16 items-center justify-center rounded-lg bg-white text-[10px] text-gray-400 shadow-sm"
              >
                {doc}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
