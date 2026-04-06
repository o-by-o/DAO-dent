/**
 * Диагностика кожи — гибридный pipeline
 *
 * Поток: фото → GPT-4o-mini Vision (извлечение данных) → DeepSeek V3 (рекомендации) → RAG (продукты)
 */

import { prisma } from "@/lib/prisma"
import { searchKnowledge } from "@/lib/rag"

export interface SkinAnalysisResult {
  analysisId: string
  skinType: string
  concerns: string[]
  condition: string
  summary: string
  recommendations: string[]
  productRecommendations: Array<{ title: string; content: string }>
}

export async function analyzeSkin(
  imageUrl: string,
  userId?: string,
): Promise<SkinAnalysisResult> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY не настроен. Нужен для Vision API (диагностика кожи).",
    )
  }

  const apiBaseUrl = (
    process.env.OPENAI_API_BASE_URL ||
    process.env.OPENAI_API_URL ||
    "https://api.openai.com/v1"
  )
    .replace(/\/(embeddings|chat\/completions)\/?$/i, "")
    .replace(/\/+$/, "")
  const chatCompletionsUrl = `${apiBaseUrl}/chat/completions`

  // 1. Вызов Vision API для анализа фото
  const visionRes = await fetch(chatCompletionsUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Ты — эксперт-косметолог. Проанализируй фото кожи лица и предоставь результат СТРОГО в формате JSON (без markdown, без \`\`\`):
{
  "skinType": "тип кожи (сухая/жирная/комбинированная/нормальная/чувствительная)",
  "concerns": ["список проблем: акне, пигментация, морщины, расширенные поры, обезвоженность, покраснения, тусклость и т.д."],
  "condition": "общая оценка: хорошее/удовлетворительное/требует внимания",
  "summary": "краткое описание состояния кожи на русском языке (2-3 предложения)",
  "recommendations": ["конкретные рекомендации по уходу на русском (3-5 пунктов)"]
}`,
            },
            {
              type: "image_url",
              image_url: { url: imageUrl },
            },
          ],
        },
      ],
      max_tokens: 1000,
      temperature: 0.3,
    }),
  })

  if (!visionRes.ok) {
    const err = await visionRes.text()
    throw new Error(`Vision API error: ${visionRes.status} ${err}`)
  }

  const visionData = await visionRes.json()
  const analysisText =
    visionData.choices?.[0]?.message?.content?.trim() ?? ""

  // Парсим JSON из ответа
  let analysis: {
    skinType: string
    concerns: string[]
    condition: string
    summary: string
    recommendations: string[]
  }

  try {
    // Убираем markdown обёртку если есть
    const cleaned = analysisText
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim()
    analysis = JSON.parse(cleaned)
  } catch {
    analysis = {
      skinType: "не определено",
      concerns: [],
      condition: "не определено",
      summary: analysisText,
      recommendations: [],
    }
  }

  // 2. DeepSeek V3 — развёрнутые рекомендации на русском
  const deepseekKey = process.env.DEEPSEEK_API_KEY
  if (deepseekKey) {
    try {
      const dsRes = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${deepseekKey}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            {
              role: "system",
              content:
                "Ты — профессиональный косметолог. На основе результатов анализа кожи дай развёрнутые рекомендации на русском языке. Ответ — JSON без markdown: { \"summary\": \"подробное описание (3-4 предложения)\", \"recommendations\": [\"5-7 конкретных рекомендаций\"] }",
            },
            {
              role: "user",
              content: `Тип кожи: ${analysis.skinType}. Проблемы: ${analysis.concerns.join(", ")}. Состояние: ${analysis.condition}. Краткое описание: ${analysis.summary}`,
            },
          ],
          max_tokens: 800,
          temperature: 0.4,
        }),
      })

      if (dsRes.ok) {
        const dsData = await dsRes.json()
        const dsText = dsData.choices?.[0]?.message?.content?.trim() ?? ""
        try {
          const cleaned = dsText
            .replace(/^```(?:json)?\s*/i, "")
            .replace(/\s*```$/i, "")
            .trim()
          const enriched = JSON.parse(cleaned)
          if (enriched.summary) analysis.summary = enriched.summary
          if (Array.isArray(enriched.recommendations) && enriched.recommendations.length > 0) {
            analysis.recommendations = enriched.recommendations
          }
        } catch {
          // Не удалось распарсить DeepSeek — оставляем GPT-4o-mini результат
        }
      }
    } catch {
      // DeepSeek недоступен — используем результат GPT-4o-mini
    }
  }

  // 3. Поиск продуктов из RAG
  const searchQuery = `${analysis.skinType} ${analysis.concerns.join(" ")} уход кожа`
  let productRecommendations: Array<{ title: string; content: string }> = []

  try {
    const results = await searchKnowledge(searchQuery, { limit: 3, source: "product" })
    productRecommendations = results.map((r) => ({
      title: r.title,
      content: r.content.slice(0, 200),
    }))
  } catch {
    // RAG может быть не инициализирован — не страшно
  }

  // 4. Сохраняем результат в БД
  const saved = await prisma.skinAnalysis.create({
    data: {
      userId: userId ?? null,
      imageUrl,
      result: {
        ...analysis,
        productRecommendations,
      },
    },
  })

  return {
    analysisId: saved.id,
    skinType: analysis.skinType,
    concerns: analysis.concerns,
    condition: analysis.condition,
    summary: analysis.summary,
    recommendations: analysis.recommendations,
    productRecommendations,
  }
}
