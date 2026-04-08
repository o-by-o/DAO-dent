/**
 * AI-инструменты для врача-стоматолога
 * Помощь с диагнозами, планами лечения, рекомендациями
 */
import { tool } from "ai"
import { z } from "zod"
import { prisma } from "@/lib/prisma"

/** Получить карту пациента */
export const getPatientCard = tool({
  description: "Получить полную карточку пациента: ФИО, аллергии, зубная формула, история приёмов, планы лечения",
  inputSchema: z.object({
    patientId: z.string().describe("ID пациента"),
  }),
  execute: async ({ patientId }) => {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        dentalChart: { orderBy: { toothNumber: "asc" } },
        appointments: {
          orderBy: { date: "desc" },
          take: 10,
          include: { service: { select: { name: true } } },
        },
        treatmentPlans: {
          include: { steps: { orderBy: { order: "asc" } } },
        },
      },
    })

    if (!patient) {
      return {
        name: "Пациент не найден",
        phone: "", birthDate: null, allergies: "нет данных",
        chronicDiseases: "нет данных", contraindications: "нет данных",
        dentalChart: [], recentAppointments: [], treatmentPlans: [],
      }
    }

    const toothStatusLabels: Record<string, string> = {
      HEALTHY: "здоров", CARIES: "кариес", FILLED: "пломба", CROWN: "коронка",
      MISSING: "отсутствует", IMPLANT: "имплант", ROOT_CANAL: "депульпирован",
      BRIDGE: "мост", PERIDONTAL: "пародонтит", EXTRACTION_NEEDED: "удаление",
    }

    return {
      name: `${patient.lastName} ${patient.firstName} ${patient.middleName || ""}`.trim(),
      phone: patient.phone,
      birthDate: patient.birthDate?.toLocaleDateString("ru-RU"),
      allergies: patient.allergies || "не указаны",
      chronicDiseases: patient.chronicDiseases || "не указаны",
      contraindications: patient.contraindications || "не указаны",
      dentalChart: patient.dentalChart
        .filter((t) => t.status !== "HEALTHY")
        .map((t) => ({
          tooth: t.toothNumber,
          status: toothStatusLabels[t.status] || t.status,
          notes: t.notes,
        })),
      recentAppointments: patient.appointments.map((a) => ({
        date: a.date.toLocaleDateString("ru-RU"),
        service: a.service?.name || a.type,
        diagnosis: a.diagnosis,
        treatment: a.treatment,
      })),
      treatmentPlans: patient.treatmentPlans.map((p) => ({
        title: p.title,
        status: p.status,
        steps: p.steps.map((s) => ({
          description: s.description,
          tooth: s.toothNumber,
          completed: s.completed,
        })),
      })),
    }
  },
})

/** Помощь с диагнозом */
export const suggestDiagnosis = tool({
  description: "Предложить возможные диагнозы на основе симптомов и осмотра. НЕ заменяет врачебное решение — только помощь.",
  inputSchema: z.object({
    symptoms: z.string().describe("Жалобы пациента и данные осмотра"),
    toothNumber: z.number().optional().describe("Номер зуба (ISO 3950)"),
  }),
  execute: async ({ symptoms, toothNumber }) => {
    // База знаний стоматологических диагнозов
    const knowledgeBase = [
      { symptoms: ["боль", "горячее", "холодное", "сладкое"], diagnosis: "Кариес дентина (К02.1)", icd: "К02.1" },
      { symptoms: ["острая боль", "ночная боль", "пульсирующая"], diagnosis: "Острый пульпит (К04.0)", icd: "К04.0" },
      { symptoms: ["боль при накусывании", "отёк", "свищ"], diagnosis: "Острый периодонтит (К04.4)", icd: "К04.4" },
      { symptoms: ["кровоточивость дёсен", "покраснение", "отёк десны"], diagnosis: "Гингивит (К05.1)", icd: "К05.1" },
      { symptoms: ["подвижность зуба", "рецессия десны", "карман"], diagnosis: "Пародонтит (К05.3)", icd: "К05.3" },
      { symptoms: ["скол", "трещина", "перелом"], diagnosis: "Перелом коронки зуба (S02.5)", icd: "S02.5" },
      { symptoms: ["тёмное пятно", "начальный", "меловидное"], diagnosis: "Начальный кариес (К02.0)", icd: "К02.0" },
      { symptoms: ["глубокая полость", "дно полости"], diagnosis: "Глубокий кариес (К02.1)", icd: "К02.1" },
      { symptoms: ["отёк щеки", "температура", "гной"], diagnosis: "Периостит (К10.2)", icd: "К10.2" },
      { symptoms: ["стираемость", "чувствительность", "клиновидный"], diagnosis: "Повышенная стираемость (К03.0)", icd: "К03.0" },
    ]

    const lower = symptoms.toLowerCase()
    const matches = knowledgeBase
      .map((entry) => ({
        ...entry,
        score: entry.symptoms.filter((s) => lower.includes(s)).length,
      }))
      .filter((e) => e.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)

    return {
      disclaimer: "ВНИМАНИЕ: Это вспомогательная информация, НЕ замена врачебного решения. Диагноз ставит только врач.",
      toothNumber,
      inputSymptoms: symptoms,
      suggestions: matches.length > 0
        ? matches.map((m) => ({
            diagnosis: m.diagnosis,
            icdCode: m.icd,
            matchedSymptoms: m.symptoms.filter((s) => lower.includes(s)),
            confidence: m.score >= 3 ? "высокая" : m.score >= 2 ? "средняя" : "низкая",
          }))
        : [{ note: "Не удалось подобрать диагноз по описанным симптомам. Рекомендуется дополнительная диагностика." }],
    }
  },
})

/** Предложить план лечения */
export const suggestTreatmentPlan = tool({
  description: "Предложить план лечения на основе диагноза и состояния зубов пациента",
  inputSchema: z.object({
    diagnosis: z.string().describe("Диагноз"),
    toothNumbers: z.array(z.number()).describe("Номера зубов"),
    patientId: z.string().optional().describe("ID пациента для учёта истории"),
  }),
  execute: async ({ diagnosis, toothNumbers, patientId }) => {
    // Стандартные протоколы лечения
    const protocols: Record<string, { steps: string[]; materials: string[]; estimatedCost: string }> = {
      "кариес": {
        steps: ["Анестезия", "Препарирование кариозной полости", "Медикаментозная обработка", "Пломбирование (светоотверждаемый композит)", "Шлифовка и полировка"],
        materials: ["Ультракаин 1.7мл", "Композит Filtek/Estelite", "Адгезив", "Матрица, клин"],
        estimatedCost: "3 500 — 7 000 ₽ за зуб",
      },
      "пульпит": {
        steps: ["Анестезия", "Раскрытие полости зуба", "Экстирпация пульпы", "Механическая и медикаментозная обработка каналов", "Пломбирование каналов (гуттаперча)", "Контрольный рентген", "Реставрация коронковой части"],
        materials: ["Ультракаин 1.7мл", "Эндодонтические файлы", "Гуттаперча", "Силер", "Композит"],
        estimatedCost: "8 000 — 15 000 ₽",
      },
      "периодонтит": {
        steps: ["Анестезия", "Раскрытие и обработка каналов", "Временное пломбирование (Ca(OH)2)", "Контрольный визит через 7-14 дней", "Постоянное пломбирование каналов", "Реставрация"],
        materials: ["Ультракаин", "Ca(OH)2 паста", "Гуттаперча", "Силер", "Композит"],
        estimatedCost: "10 000 — 18 000 ₽",
      },
      "удаление": {
        steps: ["Анестезия", "Отслойка круговой связки", "Люксация и извлечение зуба", "Ревизия лунки", "Гемостаз", "Рекомендации"],
        materials: ["Ультракаин 1.7-3.4мл", "Гемостатическая губка"],
        estimatedCost: "2 500 — 15 000 ₽",
      },
      "гигиена": {
        steps: ["Ультразвуковой скейлинг", "Air Flow", "Полировка пастой", "Фторирование"],
        materials: ["Полировочная паста", "Фтор-лак"],
        estimatedCost: "4 500 — 7 000 ₽",
      },
    }

    const lower = diagnosis.toLowerCase()
    const matchedProtocol = Object.entries(protocols).find(([key]) => lower.includes(key))

    let patientInfo = null
    if (patientId) {
      const p = await prisma.patient.findUnique({
        where: { id: patientId },
        select: { allergies: true, chronicDiseases: true },
      })
      patientInfo = p
    }

    return {
      disclaimer: "План лечения носит рекомендательный характер. Окончательное решение — за лечащим врачом.",
      diagnosis,
      teeth: toothNumbers,
      protocol: matchedProtocol
        ? {
            name: matchedProtocol[0],
            steps: matchedProtocol[1].steps,
            materials: matchedProtocol[1].materials,
            estimatedCost: matchedProtocol[1].estimatedCost,
          }
        : { note: "Стандартный протокол не найден. Составьте план индивидуально." },
      warnings: patientInfo?.allergies
        ? [`⚠ У пациента аллергии: ${patientInfo.allergies}. Проверьте совместимость материалов!`]
        : [],
    }
  },
})

/** Получить список услуг с ценами */
export const getServicePrices = tool({
  description: "Показать прайс-лист клиники — все услуги с ценами по категориям",
  inputSchema: z.object({
    category: z.string().optional().describe("Категория услуг (терапия, хирургия и т.д.)"),
  }),
  execute: async ({ category }) => {
    const where = category
      ? { published: true, category: { name: { contains: category, mode: "insensitive" as const } } }
      : { published: true }

    const services = await prisma.service.findMany({
      where,
      include: { category: { select: { name: true } } },
      orderBy: [{ category: { order: "asc" } }, { order: "asc" }],
    })

    return services.map((s) => ({
      category: s.category.name,
      name: s.name,
      price: `от ${Number(s.price).toLocaleString("ru-RU")} ₽`,
      duration: `${s.durationMin} мин`,
    }))
  },
})
