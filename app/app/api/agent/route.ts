import { streamText } from "ai"
import { deepseek } from "@ai-sdk/deepseek"
import { auth } from "@/lib/auth"

// Импорт инструментов по ролям
import { getClinicStats, getDoctorWorkload, getConversionFunnel, getCabinetStatus, searchPatient } from "@/lib/ai-tools/manager-tools"
import { generateSocialPost, analyzeLeadSources, generateAds, getMarketingRecommendations } from "@/lib/ai-tools/marketing-tools"
import { getPatientCard, suggestDiagnosis, suggestTreatmentPlan, getServicePrices } from "@/lib/ai-tools/doctor-tools"

const SYSTEM_PROMPTS: Record<string, string> = {
  OWNER: `Ты — AI-помощник владельца стоматологической клиники «ДаоДент» (м. Семёновская, Москва).
Ты имеешь доступ к данным клиники через инструменты. Используй их для ответов.
Помогаешь с: аналитикой, управлением, маркетингом, финансами, стратегией.
Отвечай на русском, кратко, с конкретными цифрами из данных.
При обсуждении маркетинга — учитывай геопривязку к м. Семёновская.
При генерации рекламного контента — добавляй дисклеймер ФЗ-38.`,

  MANAGER: `Ты — AI-помощник управляющего стоматологической клиники «ДаоДент».
Помогаешь с: расписанием, загрузкой врачей, обработкой заявок, аналитикой работы.
Используй инструменты для получения реальных данных.
Отвечай на русском, кратко, конструктивно.`,

  DOCTOR: `Ты — AI-ассистент стоматолога клиники «ДаоДент».
Помогаешь с: подбором диагнозов, планами лечения, информацией о пациентах, прайсом.
ВАЖНО: Ты НЕ ставишь диагнозы — только предлагаешь варианты. Решение за врачом.
При предложении диагноза всегда указывай код МКБ-10.
При предложении лечения проверяй аллергии пациента.
Отвечай на русском, профессионально.`,

  ADMIN: `Ты — AI-помощник администратора стоматологической клиники «ДаоДент».
Помогаешь с: поиском пациентов, записью на приём, обработкой заявок.
Используй инструменты для поиска информации.
Отвечай на русском, вежливо.`,
}

function getToolsForRole(role: string) {
  const commonTools = { searchPatient, getServicePrices }

  switch (role) {
    case "OWNER":
      return {
        ...commonTools,
        getClinicStats,
        getDoctorWorkload,
        getConversionFunnel,
        getCabinetStatus,
        generateSocialPost,
        analyzeLeadSources,
        generateAds,
        getMarketingRecommendations,
        getPatientCard,
        suggestDiagnosis,
        suggestTreatmentPlan,
      }
    case "MANAGER":
      return {
        ...commonTools,
        getClinicStats,
        getDoctorWorkload,
        getConversionFunnel,
        getCabinetStatus,
        analyzeLeadSources,
      }
    case "DOCTOR":
      return {
        ...commonTools,
        getPatientCard,
        suggestDiagnosis,
        suggestTreatmentPlan,
      }
    case "ADMIN":
      return {
        ...commonTools,
        getCabinetStatus,
      }
    default:
      return commonTools
  }
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) {
    return new Response(JSON.stringify({ error: "Не авторизован" }), { status: 401 })
  }

  if (!process.env.DEEPSEEK_API_KEY) {
    return new Response(
      JSON.stringify({ error: "AI-агент недоступен. Задайте DEEPSEEK_API_KEY." }),
      { status: 503 },
    )
  }

  const role = (session.user as { role: string }).role
  const body = await req.json()
  const messages = Array.isArray(body.messages) ? body.messages : []

  if (messages.length === 0) {
    return new Response(JSON.stringify({ error: "Пустое сообщение" }), { status: 400 })
  }

  const systemPrompt = SYSTEM_PROMPTS[role] || SYSTEM_PROMPTS["ADMIN"]!
  const tools = getToolsForRole(role)

  const result = streamText({
    model: deepseek("deepseek-chat"),
    system: systemPrompt,
    messages,
    tools,
  })

  return result.toUIMessageStreamResponse({
    onError: (err: unknown) => {
      console.error("[agent]", err)
      return "Не удалось получить ответ. Попробуйте ещё раз."
    },
  })
}
