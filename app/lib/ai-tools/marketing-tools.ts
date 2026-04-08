/**
 * AI-инструменты для маркетинга
 * Генерация контента, анализ конверсий, рекомендации по рекламе
 */
import { tool } from "ai"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { generateAdsForService } from "@/lib/yandex-direct"

/** Генерация поста для соцсетей */
export const generateSocialPost = tool({
  description: "Сгенерировать текст поста для соцсетей (ВК, Telegram, Дзен) на заданную тему о стоматологии",
  inputSchema: z.object({
    topic: z.string().describe("Тема поста: акция, совет по уходу, описание услуги, новость клиники"),
    platform: z.enum(["vk", "telegram", "dzen", "general"]).default("general"),
    tone: z.enum(["professional", "friendly", "educational"]).default("friendly"),
  }),
  execute: async ({ topic, platform, tone }) => {
    // Возвращаем промпт для AI — текст генерирует сама модель
    return {
      instruction: `Сгенерируй пост для ${platform === "general" ? "соцсетей" : platform} о стоматологической клинике ДаоДент (м. Семёновская, Москва).
Тема: ${topic}
Тон: ${tone === "professional" ? "профессиональный" : tone === "educational" ? "образовательный" : "дружелюбный"}
Требования:
- Упомяни геолокацию (м. Семёновская, 5 мин пешком)
- Добавь призыв к действию (запись на приём)
- Телефон: +7 (495) 000-00-00
- Для медицинских тем: добавь дисклеймер "Имеются противопоказания"
- Длина: ${platform === "telegram" ? "до 300 символов" : platform === "vk" ? "до 500 символов" : "до 1000 символов"}`,
    }
  },
})

/** Анализ источников пациентов */
export const analyzeLeadSources = tool({
  description: "Анализ источников заявок и пациентов: откуда приходят, какие каналы самые эффективные",
  inputSchema: z.object({
    period: z.enum(["week", "month", "quarter"]).default("month"),
  }),
  execute: async ({ period }) => {
    const start = new Date()
    switch (period) {
      case "week": start.setDate(start.getDate() - 7); break
      case "month": start.setMonth(start.getMonth() - 1); break
      case "quarter": start.setMonth(start.getMonth() - 3); break
    }

    const leads = await prisma.lead.findMany({
      where: { createdAt: { gte: start } },
      select: { channel: true, status: true },
    })

    const patients = await prisma.patient.findMany({
      where: { createdAt: { gte: start } },
      select: { source: true },
    })

    // Группировка по каналам
    const channelStats = new Map<string, { total: number; converted: number }>()
    for (const lead of leads) {
      const entry = channelStats.get(lead.channel) || { total: 0, converted: 0 }
      entry.total++
      if (lead.status === "CONVERTED") entry.converted++
      channelStats.set(lead.channel, entry)
    }

    const sourceStats = new Map<string, number>()
    for (const p of patients) {
      sourceStats.set(p.source, (sourceStats.get(p.source) || 0) + 1)
    }

    return {
      period,
      leadsByChannel: Array.from(channelStats.entries()).map(([channel, stats]) => ({
        channel,
        total: stats.total,
        converted: stats.converted,
        conversionRate: stats.total > 0 ? `${Math.round((stats.converted / stats.total) * 100)}%` : "0%",
      })),
      patientsBySource: Array.from(sourceStats.entries()).map(([source, count]) => ({ source, count })),
      totalLeads: leads.length,
      totalNewPatients: patients.length,
    }
  },
})

/** Генерация рекламных объявлений */
export const generateAds = tool({
  description: "Сгенерировать рекламные объявления для Яндекс.Директ на основе услуг клиники",
  inputSchema: z.object({
    serviceSlug: z.string().optional().describe("Slug конкретной услуги, или пусто для всех"),
  }),
  execute: async ({ serviceSlug }) => {
    const where = serviceSlug ? { slug: serviceSlug, published: true } : { published: true }
    const services = await prisma.service.findMany({
      where,
      include: { category: { select: { name: true } } },
      take: 5,
    })

    return services.flatMap((s) =>
      generateAdsForService({
        name: s.name,
        price: Number(s.price),
        category: s.category.name,
        slug: s.slug,
      }),
    )
  },
})

/** Рекомендации по улучшению конверсии */
export const getMarketingRecommendations = tool({
  description: "Получить AI-рекомендации по улучшению маркетинга на основе данных клиники",
  inputSchema: z.object({}),
  execute: async () => {
    const [totalLeads, convertedLeads, totalPatients, lostPatients] = await Promise.all([
      prisma.lead.count(),
      prisma.lead.count({ where: { status: "CONVERTED" } }),
      prisma.patient.count(),
      prisma.patient.count({ where: { status: "LOST" } }),
    ])

    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0
    const lossRate = totalPatients > 0 ? (lostPatients / totalPatients) * 100 : 0

    return {
      metrics: {
        totalLeads,
        conversionRate: `${conversionRate.toFixed(1)}%`,
        lossRate: `${lossRate.toFixed(1)}%`,
      },
      recommendations: [
        conversionRate < 30
          ? "Конверсия заявок ниже 30% — проверьте скорость обработки (SLA: 5 мин на новую заявку)"
          : "Конверсия заявок хорошая",
        lossRate > 20
          ? "Высокий процент потерянных пациентов — запустите серию реактивационных писем"
          : "Процент потерь в норме",
        "Добавьте UTM-метки ко всем рекламным кампаниям для отслеживания ROI",
        "Настройте ретаргетинг на посетителей сайта, которые не оставили заявку",
        "Публикуйте отзывы пациентов в соцсетях — это повышает доверие на 40%",
      ],
    }
  },
})
