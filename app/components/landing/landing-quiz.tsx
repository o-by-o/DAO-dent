"use client"

import { useState } from "react"
import { ArrowRight, ArrowLeft, CheckCircle, Sparkles } from "lucide-react"

type Step = {
  question: string
  options: { label: string; value: string }[]
}

const STEPS: Step[] = [
  {
    question: "Что вас беспокоит?",
    options: [
      { label: "Болит зуб", value: "pain" },
      { label: "Нужна чистка / профилактика", value: "hygiene" },
      { label: "Хочу красивую улыбку", value: "esthetics" },
      { label: "Нужен имплант или протез", value: "implant" },
      { label: "Проблемы с прикусом", value: "orthodontics" },
      { label: "Детская стоматология", value: "pediatric" },
    ],
  },
  {
    question: "Как давно возникла проблема?",
    options: [
      { label: "Только что / сегодня", value: "today" },
      { label: "Несколько дней", value: "days" },
      { label: "Несколько недель", value: "weeks" },
      { label: "Давно, но не было времени", value: "long" },
      { label: "Планирую заранее", value: "planning" },
    ],
  },
  {
    question: "Был ли у вас стоматолог в последний год?",
    options: [
      { label: "Да, регулярно хожу", value: "regular" },
      { label: "Был 1-2 раза", value: "rare" },
      { label: "Больше года не был", value: "long_ago" },
      { label: "Не помню", value: "unknown" },
    ],
  },
  {
    question: "Что для вас важнее всего?",
    options: [
      { label: "Безболезненное лечение", value: "painless" },
      { label: "Доступная цена", value: "price" },
      { label: "Качество и гарантия", value: "quality" },
      { label: "Быстрый результат", value: "speed" },
      { label: "Близость к дому / метро", value: "location" },
    ],
  },
]

const RESULTS: Record<string, { title: string; description: string; services: string[]; discount: string }> = {
  pain: {
    title: "Экстренная помощь + план лечения",
    description: "Снимем боль уже на первом приёме. Проведём диагностику и составим план лечения.",
    services: ["Консультация (бесплатно)", "Рентген-диагностика", "Лечение кариеса / пульпита"],
    discount: "Скидка 15% на первое лечение",
  },
  hygiene: {
    title: "Комплекс «Здоровые зубы»",
    description: "Профессиональная гигиена + осмотр + рекомендации по уходу.",
    services: ["Ультразвуковая чистка", "Air Flow", "Фторирование", "Консультация"],
    discount: "Скидка 20% на комплексную гигиену",
  },
  esthetics: {
    title: "Программа «Идеальная улыбка»",
    description: "Подберём оптимальный вариант: виниры, отбеливание или реставрация.",
    services: ["Консультация эстетиста", "Отбеливание ZOOM", "Виниры E-max"],
    discount: "Бесплатная консультация + 3D-моделирование",
  },
  implant: {
    title: "Имплантация под ключ",
    description: "Полный цикл: от диагностики до установки коронки. Гарантия на импланты — пожизненная.",
    services: ["КТ-диагностика", "Имплантация Osstem / Straumann", "Протезирование"],
    discount: "Рассрочка 0% до 24 месяцев",
  },
  orthodontics: {
    title: "Исправление прикуса",
    description: "Подберём оптимальный метод: брекеты или прозрачные элайнеры.",
    services: ["Консультация ортодонта", "Диагностика", "Брекеты или элайнеры"],
    discount: "Скидка 10% при оплате полного курса",
  },
  pediatric: {
    title: "Детская стоматология",
    description: "Бережное лечение в игровой форме. Врачи умеют найти подход к каждому ребёнку.",
    services: ["Адаптационный визит", "Профилактический осмотр", "Герметизация фиссур"],
    discount: "Бесплатный первый визит для детей",
  },
}

export function LandingQuiz() {
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<string[]>([])
  const [showResult, setShowResult] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const step = STEPS[currentStep]
  const isLast = currentStep === STEPS.length - 1

  function selectOption(value: string) {
    const newAnswers = [...answers]
    newAnswers[currentStep] = value
    setAnswers(newAnswers)

    if (isLast) {
      setShowResult(true)
    } else {
      setCurrentStep(currentStep + 1)
    }
  }

  function goBack() {
    if (showResult) {
      setShowResult(false)
    } else if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)

    await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fd.get("name"),
        phone: fd.get("phone"),
        channel: "QUIZ",
        service: result?.title,
        message: `Квиз: ${answers.join(", ")}`,
      }),
    })

    setLoading(false)
    setSubmitted(true)
  }

  const result = RESULTS[answers[0] || "pain"]!
  const progress = showResult ? 100 : ((currentStep + 1) / STEPS.length) * 100

  if (submitted) {
    return (
      <section className="bg-gradient-to-br from-blue-50 to-white py-20 md:py-28">
        <div className="mx-auto max-w-xl px-6 text-center">
          <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-500" />
          <h2 className="font-serif text-2xl font-semibold text-gray-900">Спасибо!</h2>
          <p className="mt-3 text-gray-600">
            Мы подготовим персональный план лечения и перезвоним вам в течение 30 минут.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section id="quiz" className="bg-gradient-to-br from-blue-50 to-white py-20 md:py-28">
      <div className="mx-auto max-w-2xl px-6 lg:px-8">
        <div className="text-center">
          <span className="mb-4 inline-block rounded-full bg-blue-100 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-blue-700">
            <Sparkles className="mr-1 inline h-3 w-3" />
            Подберите план лечения
          </span>
          <h2 className="font-serif text-3xl font-semibold text-gray-900 md:text-4xl">
            Ответьте на 4 вопроса
          </h2>
          <p className="mt-3 text-gray-600">и получите персональную рекомендацию с ценой</p>
        </div>

        {/* Прогресс */}
        <div className="mt-8 h-2 overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-blue-600 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mt-8 rounded-2xl border border-gray-100 bg-white p-8 shadow-lg">
          {!showResult && !showForm && step && (
            <>
              <p className="mb-1 text-xs text-gray-400">
                Вопрос {currentStep + 1} из {STEPS.length}
              </p>
              <h3 className="mb-6 text-xl font-semibold text-gray-900">{step.question}</h3>
              <div className="space-y-3">
                {step.options.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => selectOption(opt.value)}
                    className={`flex w-full items-center justify-between rounded-xl border px-5 py-4 text-left text-sm font-medium transition ${
                      answers[currentStep] === opt.value
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-100 bg-gray-50 text-gray-700 hover:border-blue-200 hover:bg-blue-50"
                    }`}
                  >
                    {opt.label}
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </button>
                ))}
              </div>
              {currentStep > 0 && (
                <button
                  type="button"
                  onClick={goBack}
                  className="mt-4 flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600"
                >
                  <ArrowLeft className="h-4 w-4" /> Назад
                </button>
              )}
            </>
          )}

          {showResult && !showForm && (
            <>
              <div className="mb-4 rounded-xl bg-green-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-green-600">Ваш результат</p>
                <h3 className="mt-1 text-xl font-semibold text-gray-900">{result.title}</h3>
              </div>
              <p className="text-sm text-gray-600">{result.description}</p>
              <div className="mt-4 space-y-2">
                {result.services.map((s) => (
                  <div key={s} className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    {s}
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-xl bg-amber-50 p-3 text-center text-sm font-semibold text-amber-700">
                {result.discount}
              </div>
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700"
              >
                Получить план и записаться
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={goBack}
                className="mt-3 flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600"
              >
                <ArrowLeft className="h-4 w-4" /> Пройти заново
              </button>
            </>
          )}

          {showForm && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Оставьте контакты</h3>
              <p className="text-sm text-gray-500">Мы перезвоним и расскажем подробнее о вашем плане</p>
              <input
                name="name"
                required
                placeholder="Ваше имя"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
              <input
                name="phone"
                type="tel"
                required
                placeholder="+7 (___) ___-__-__"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-blue-600 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Отправка..." : "Получить план лечения"}
              </button>
              <p className="text-center text-xs text-gray-400">
                Нажимая кнопку, вы соглашаетесь с обработкой персональных данных
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
