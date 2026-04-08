"use client"

import { useState, useEffect } from "react"
import {
  TrendingUp,
  MousePointerClick,
  Eye,
  DollarSign,
  Play,
  Pause,
  Plus,
  Sparkles,
  AlertCircle,
  ExternalLink,
  Target,
  BarChart3,
  Copy,
  Check,
} from "lucide-react"

type Campaign = {
  Id: number
  Name: string
  Status: string
  State: string
  Type: string
  Statistics?: {
    Impressions: number
    Clicks: number
    Cost: number
  }
}

type GeneratedAd = {
  title: string
  title2: string
  text: string
  keywords: string[]
  href: string
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  ACCEPTED: { label: "Активна", color: "bg-green-100 text-green-700" },
  DRAFT: { label: "Черновик", color: "bg-gray-100 text-gray-600" },
  MODERATION: { label: "На модерации", color: "bg-yellow-100 text-yellow-700" },
  SUSPENDED: { label: "Остановлена", color: "bg-red-100 text-red-600" },
  OFF: { label: "Выключена", color: "bg-gray-100 text-gray-500" },
  ENDED: { label: "Завершена", color: "bg-gray-100 text-gray-400" },
}

export function MarketingDashboard({ yandexDirectConnected }: { yandexDirectConnected: boolean }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [generatedAds, setGeneratedAds] = useState<GeneratedAd[]>([])
  const [loading, setLoading] = useState(false)
  const [adsLoading, setAdsLoading] = useState(false)
  const [error, setError] = useState("")
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)

  // Загрузка кампаний
  useEffect(() => {
    if (!yandexDirectConnected) return
    setLoading(true)
    fetch("/api/admin/marketing/campaigns")
      .then((r) => r.json())
      .then((data) => {
        setCampaigns(data.campaigns || [])
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [yandexDirectConnected])

  // Генерация объявлений
  async function generateAds() {
    setAdsLoading(true)
    try {
      const res = await fetch("/api/admin/marketing/generate-ads", { method: "POST" })
      const data = await res.json()
      setGeneratedAds(data.ads || [])
    } catch {
      setError("Ошибка генерации")
    }
    setAdsLoading(false)
  }

  function copyAd(idx: number) {
    const ad = generatedAds[idx]
    const text = `Заголовок: ${ad.title}\nЗаголовок 2: ${ad.title2}\nТекст: ${ad.text}\nКлючевые слова: ${ad.keywords.join(", ")}\nСсылка: ${ad.href}`
    navigator.clipboard.writeText(text)
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 2000)
  }

  // Суммарная статистика по кампаниям
  const totalImpressions = campaigns.reduce((s, c) => s + (c.Statistics?.Impressions || 0), 0)
  const totalClicks = campaigns.reduce((s, c) => s + (c.Statistics?.Clicks || 0), 0)
  const totalCost = campaigns.reduce((s, c) => s + (c.Statistics?.Cost || 0), 0)
  const avgCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1) : "0"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Маркетинг</h1>
          <p className="text-sm text-gray-500">Управление рекламой в Яндекс.Директ</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={generateAds}
            disabled={adsLoading}
            className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-purple-700 disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" />
            {adsLoading ? "Генерация..." : "Сгенерировать объявления"}
          </button>
        </div>
      </div>

      {/* Статус подключения */}
      {!yandexDirectConnected && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="mt-0.5 h-6 w-6 shrink-0 text-amber-600" />
            <div>
              <h3 className="font-semibold text-amber-900">Яндекс.Директ не подключён</h3>
              <p className="mt-1 text-sm text-amber-700">
                Для управления рекламными кампаниями нужен OAuth-токен.
              </p>
              <ol className="mt-3 space-y-1 text-sm text-amber-700">
                <li>1. Перейдите на oauth.yandex.ru и авторизуйте приложение</li>
                <li>2. Скопируйте полученный токен</li>
                <li>3. Добавьте его в .env как YANDEX_DIRECT_TOKEN</li>
              </ol>
              <p className="mt-3 text-sm text-amber-600">
                Генерация объявлений работает без подключения — можно подготовить тексты заранее.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* KPI */}
      {yandexDirectConnected && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Eye className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Показы</p>
                <p className="text-2xl font-bold text-gray-900">{totalImpressions.toLocaleString("ru-RU")}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600">
                <MousePointerClick className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Клики</p>
                <p className="text-2xl font-bold text-gray-900">{totalClicks.toLocaleString("ru-RU")}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Расход</p>
                <p className="text-2xl font-bold text-gray-900">{totalCost.toLocaleString("ru-RU")} &#8381;</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-gray-500">CTR</p>
                <p className="text-2xl font-bold text-gray-900">{avgCtr}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Кампании */}
      {yandexDirectConnected && (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Кампании
            </h2>
            <button className="flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-100">
              <Plus className="h-3 w-3" /> Новая кампания
            </button>
          </div>

          {loading ? (
            <p className="py-8 text-center text-sm text-gray-400">Загрузка кампаний...</p>
          ) : campaigns.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">Кампаний пока нет</p>
          ) : (
            <div className="space-y-3">
              {campaigns.map((c) => {
                const st = STATUS_LABELS[c.Status] || STATUS_LABELS[c.State] || { label: c.Status, color: "bg-gray-100 text-gray-600" }
                return (
                  <div key={c.Id} className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{c.Name}</span>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${st.color}`}>
                          {st.label}
                        </span>
                      </div>
                      {c.Statistics && (
                        <div className="mt-1 flex gap-4 text-xs text-gray-500">
                          <span>{c.Statistics.Impressions.toLocaleString()} показов</span>
                          <span>{c.Statistics.Clicks.toLocaleString()} кликов</span>
                          <span>{c.Statistics.Cost.toLocaleString()} &#8381;</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button className="rounded-lg bg-white p-2 text-gray-400 transition hover:text-green-600">
                        <Play className="h-4 w-4" />
                      </button>
                      <button className="rounded-lg bg-white p-2 text-gray-400 transition hover:text-amber-600">
                        <Pause className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </div>
      )}

      {/* Сгенерированные объявления */}
      {generatedAds.length > 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Sparkles className="h-5 w-5 text-purple-600" />
            Сгенерированные объявления ({generatedAds.length})
          </h2>
          <p className="mb-4 text-sm text-gray-500">
            Объявления сгенерированы на основе услуг клиники с геотаргетингом на м. Семёновская
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            {generatedAds.map((ad, i) => (
              <div key={i} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                {/* Превью как в Яндексе */}
                <div className="rounded-lg bg-white p-3 shadow-sm">
                  <p className="text-sm font-medium text-blue-700">{ad.title}</p>
                  {ad.title2 && (
                    <p className="text-sm text-blue-600">{ad.title2}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-600">{ad.text}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-green-700">
                    <ExternalLink className="h-3 w-3" />
                    {ad.href.replace("https://", "")}
                  </p>
                </div>

                {/* Ключевые слова */}
                <div className="mt-3 flex flex-wrap gap-1">
                  {ad.keywords.map((kw, j) => (
                    <span key={j} className="rounded bg-blue-50 px-2 py-0.5 text-[10px] text-blue-600">
                      {kw}
                    </span>
                  ))}
                </div>

                <button
                  onClick={() => copyAd(i)}
                  className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg bg-white py-2 text-xs font-medium text-gray-600 transition hover:bg-gray-100"
                >
                  {copiedIdx === i ? (
                    <>
                      <Check className="h-3 w-3 text-green-600" /> Скопировано
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" /> Копировать
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Рекомендации */}
      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6">
        <h3 className="flex items-center gap-2 font-semibold text-blue-900">
          <TrendingUp className="h-5 w-5" />
          Рекомендации AI
        </h3>
        <div className="mt-3 space-y-2 text-sm text-blue-800">
          <p>1. Настройте геотаргетинг на радиус 3-5 км от м. Семёновская для максимальной конверсии</p>
          <p>2. Используйте сгенерированные объявления как основу, адаптируя под текущие акции</p>
          <p>3. Начните с кампании на «имплантация» — самый высокий средний чек</p>
          <p>4. Добавьте быстрые ссылки: «Цены», «Врачи», «Отзывы», «Как добраться»</p>
          <p>5. Не забудьте маркировку рекламы по ФЗ-347 (ОРД) в каждом объявлении</p>
        </div>
      </div>
    </div>
  )
}
