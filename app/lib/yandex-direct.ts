/**
 * Yandex Direct API v5 — управление рекламными кампаниями
 * https://yandex.ru/dev/direct/doc/ref-v5/concepts/about.html
 *
 * Эндпоинт: https://api.direct.yandex.com/json/v5/
 * Песочница: https://api-sandbox.direct.yandex.com/json/v5/
 *
 * Авторизация: OAuth-токен в заголовке Authorization: Bearer TOKEN
 */

const API_URL = "https://api.direct.yandex.com/json/v5"
const SANDBOX_URL = "https://api-sandbox.direct.yandex.com/json/v5"

function getConfig() {
  const token = process.env.YANDEX_DIRECT_TOKEN
  const login = process.env.YANDEX_DIRECT_LOGIN
  const useSandbox = process.env.YANDEX_DIRECT_SANDBOX === "true"

  if (!token) {
    throw new Error("YANDEX_DIRECT_TOKEN не задан. Получите OAuth-токен через Яндекс.OAuth.")
  }

  return {
    token,
    login,
    baseUrl: useSandbox ? SANDBOX_URL : API_URL,
  }
}

/**
 * Выполнить запрос к Yandex Direct API v5
 */
async function directRequest(
  service: string,
  method: string,
  params: Record<string, unknown>,
): Promise<{ result?: unknown; error?: { error_code: number; error_string: string; error_detail: string } }> {
  const config = getConfig()

  const url = `${config.baseUrl}/${service}`

  const body = {
    method,
    params,
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${config.token}`,
    "Content-Type": "application/json; charset=utf-8",
    "Accept-Language": "ru",
  }

  if (config.login) {
    headers["Client-Login"] = config.login
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  })

  const data = await response.json()

  if (data.error) {
    console.error("[YandexDirect]", data.error)
  }

  return data
}

// ============================================
// Кампании
// ============================================

export type Campaign = {
  Id: number
  Name: string
  Status: string
  State: string
  Type: string
  DailyBudget?: { Amount: number; Mode: string }
  Statistics?: {
    Impressions: number
    Clicks: number
    Cost: number
  }
}

/** Получить список кампаний */
export async function getCampaigns(): Promise<Campaign[]> {
  const result = await directRequest("campaigns", "get", {
    SelectionCriteria: {},
    FieldNames: ["Id", "Name", "Status", "State", "Type", "DailyBudget", "Statistics"],
  })

  if (result.error) throw new Error(result.error.error_detail)
  const data = result.result as { Campaigns?: Campaign[] }
  return data?.Campaigns || []
}

/** Создать кампанию */
export async function createCampaign(params: {
  name: string
  dailyBudgetMicros: number // бюджет в микро (1 руб = 1_000_000)
  startDate: string // "YYYY-MM-DD"
  regionIds: number[] // ID регионов (Москва = 1, Семёновская район)
}) {
  return directRequest("campaigns", "add", {
    Campaigns: [
      {
        Name: params.name,
        StartDate: params.startDate,
        DailyBudget: {
          Amount: params.dailyBudgetMicros,
          Mode: "STANDARD",
        },
        TextCampaign: {
          BiddingStrategy: {
            Search: {
              BiddingStrategyType: "WB_MAXIMUM_CLICKS",
              WbMaximumClicks: {
                WeeklySpendLimit: params.dailyBudgetMicros * 7,
              },
            },
            Network: {
              BiddingStrategyType: "SERVING_OFF",
            },
          },
          Settings: [
            { Option: "ADD_METRICA_TAG", Value: "YES" },
            { Option: "ADD_TO_FAVORITES", Value: "NO" },
          ],
        },
        NegativeKeywords: { Items: ["бесплатно", "скачать", "реферат", "курсовая"] },
      },
    ],
  })
}

/** Приостановить/возобновить кампанию */
export async function toggleCampaign(campaignId: number, action: "suspend" | "resume") {
  return directRequest("campaigns", action, {
    SelectionCriteria: { Ids: [campaignId] },
  })
}

// ============================================
// Группы объявлений
// ============================================

/** Получить группы объявлений для кампании */
export async function getAdGroups(campaignId: number) {
  const result = await directRequest("adgroups", "get", {
    SelectionCriteria: { CampaignIds: [campaignId] },
    FieldNames: ["Id", "Name", "CampaignId", "Status"],
  })

  if (result.error) throw new Error(result.error.error_detail)
  const data = result.result as { AdGroups?: unknown[] }
  return data?.AdGroups || []
}

// ============================================
// Объявления
// ============================================

/** Получить объявления для кампании */
export async function getAds(campaignId: number) {
  const result = await directRequest("ads", "get", {
    SelectionCriteria: { CampaignIds: [campaignId] },
    FieldNames: ["Id", "AdGroupId", "Status", "State", "Type"],
    TextAdFieldNames: ["Title", "Title2", "Text", "Href", "DisplayDomain"],
  })

  if (result.error) throw new Error(result.error.error_detail)
  const data = result.result as { Ads?: unknown[] }
  return data?.Ads || []
}

/** Создать текстовое объявление */
export async function createTextAd(params: {
  adGroupId: number
  title: string     // до 56 символов
  title2?: string   // до 30 символов
  text: string      // до 81 символа
  href: string      // URL посадочной страницы
}) {
  return directRequest("ads", "add", {
    Ads: [
      {
        AdGroupId: params.adGroupId,
        TextAd: {
          Title: params.title.slice(0, 56),
          Title2: params.title2?.slice(0, 30),
          Text: params.text.slice(0, 81),
          Href: params.href,
          Mobile: "NO",
        },
      },
    ],
  })
}

// ============================================
// Ключевые слова
// ============================================

/** Получить ключевые слова */
export async function getKeywords(adGroupId: number) {
  const result = await directRequest("keywords", "get", {
    SelectionCriteria: { AdGroupIds: [adGroupId] },
    FieldNames: ["Id", "Keyword", "Bid", "AdGroupId", "Status"],
  })

  if (result.error) throw new Error(result.error.error_detail)
  const data = result.result as { Keywords?: unknown[] }
  return data?.Keywords || []
}

// ============================================
// Статистика
// ============================================

export type CampaignStats = {
  CampaignId: number
  CampaignName: string
  Impressions: number
  Clicks: number
  Cost: number // в валюте
  Ctr: number  // CTR в %
  Date?: string
}

/** Получить статистику по кампаниям за период */
export async function getCampaignStats(params: {
  campaignIds: number[]
  dateFrom: string // "YYYY-MM-DD"
  dateTo: string
  groupBy?: "DAY" | "WEEK" | "MONTH"
}): Promise<CampaignStats[]> {
  const result = await directRequest("reports", "get", {
    SelectionCriteria: {
      DateFrom: params.dateFrom,
      DateTo: params.dateTo,
      Filter: [
        { Field: "CampaignId", Operator: "IN", Values: params.campaignIds.map(String) },
      ],
    },
    FieldNames: ["CampaignId", "CampaignName", "Impressions", "Clicks", "Cost", "Ctr"],
    ReportName: `campaign-stats-${Date.now()}`,
    ReportType: "CAMPAIGN_PERFORMANCE_REPORT",
    DateRangeType: "CUSTOM_DATE",
    Format: "TSV",
    IncludeVAT: "NO",
  })

  // Отчёты возвращаются в формате TSV, парсим
  if (result.error) throw new Error(result.error.error_detail)
  return [] // TODO: парсинг TSV ответа
}

// ============================================
// Генерация рекламных объявлений на основе услуг
// ============================================

export type GeneratedAd = {
  title: string
  title2: string
  text: string
  keywords: string[]
  href: string
}

/** Сгенерировать объявления для услуги клиники */
export function generateAdsForService(service: {
  name: string
  price: number
  category: string
  slug: string
}): GeneratedAd[] {
  const metro = "м. Семёновская"
  const baseUrl = "https://daodent.ru"

  const ads: GeneratedAd[] = [
    {
      title: `${service.name} — ${metro}`.slice(0, 56),
      title2: `от ${service.price.toLocaleString("ru-RU")} ₽`.slice(0, 30),
      text: `${service.name} в клинике ДаоДент. 5 мин от метро. Опытные врачи, гарантия. Запись онлайн!`.slice(0, 81),
      keywords: [
        `${service.name.toLowerCase()} семёновская`,
        `${service.name.toLowerCase()} москва`,
        `${service.name.toLowerCase()} цена`,
        `${service.category.toLowerCase()} стоматология`,
        `${service.name.toLowerCase()} соколиная гора`,
      ],
      href: `${baseUrl}/services/${service.slug}`,
    },
    {
      title: `${service.category} у ${metro}`.slice(0, 56),
      title2: "Запись онлайн. Рассрочка 0%",
      text: `${service.name}. Безболезненно, с гарантией. Семейная стоматология ДаоДент. Звоните!`.slice(0, 81),
      keywords: [
        `${service.category.toLowerCase()} семёновская`,
        `стоматология ${service.category.toLowerCase()}`,
        `${service.name.toLowerCase()} недорого`,
      ],
      href: `${baseUrl}/services/${service.slug}`,
    },
  ]

  return ads
}

/**
 * Геотаргетинг для района м. Семёновская
 * ID регионов Яндекс.Директ:
 * - 1 = Москва и область
 * - Для более точного таргетинга используем настройки кампании
 */
export const SEMYONOVSKAYA_GEO = {
  regionId: 1, // Москва
  radiusKm: 5,
  lat: 55.7818,
  lng: 37.7193,
}
