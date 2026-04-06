import { tool } from "ai"
import { z } from "zod"
import { copyFile, mkdir, unlink } from "node:fs/promises"
import path from "node:path"
import { prisma } from "@/lib/prisma"
import { generateSlug } from "@/lib/utils"

export interface VideoMeta {
  fileName: string
  fileSize?: number
  uploadId: string
  muxAssetId?: string | null
  muxPlaybackId?: string | null
  muxStatus?: string | null
  duration?: number | null
}

export interface ChatImageMeta {
  fileName: string
  url: string
}

const DEEPSEEK_API = "https://api.deepseek.com/chat/completions"

function extractRequestedModulesCount(...texts: Array<string | undefined>): number | null {
  const source = texts
    .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
    .join(" ")
    .toLowerCase()
  if (!source) return null

  const digitMatch = source.match(/(\d+)\s*модул/)
  if (digitMatch) {
    const parsed = Number(digitMatch[1])
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null
  }

  if (/\bодин\b.*модул|\b1\b.*модул/.test(source)) return 1
  if (/\bдва\b.*модул|\b2\b.*модул/.test(source)) return 2
  if (/\bтри\b.*модул|\b3\b.*модул/.test(source)) return 3
  if (/\bчетыре\b.*модул|\b4\b.*модул/.test(source)) return 4
  return null
}

function extractRequestedVideosCount(...texts: Array<string | undefined>): number | null {
  const source = texts
    .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
    .join(" ")
    .toLowerCase()
  if (!source) return null

  const digitMatch = source.match(/(\d+)\s*видео/)
  if (digitMatch) {
    const parsed = Number(digitMatch[1])
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null
  }

  if (/\bодно\b.*видео|\b1\b.*видео/.test(source)) return 1
  if (/\bдва\b.*видео|\b2\b.*видео/.test(source)) return 2
  if (/\bтри\b.*видео|\b3\b.*видео/.test(source)) return 3
  if (/\bчетыре\b.*видео|\b4\b.*видео/.test(source)) return 4
  if (/\bпять\b.*видео|\b5\b.*видео/.test(source)) return 5
  if (/\bшесть\b.*видео|\b6\b.*видео/.test(source)) return 6
  if (/\bсемь\b.*видео|\b7\b.*видео/.test(source)) return 7
  if (/\bвосемь\b.*видео|\b8\b.*видео/.test(source)) return 8
  if (/\bдевять\b.*видео|\b9\b.*видео/.test(source)) return 9
  if (/\bдесять\b.*видео|\b10\b.*видео/.test(source)) return 10

  return null
}

function normalizeStructureByConstraints(
  raw: {
    title?: string
    description?: string
    modules?: Array<{
      title?: string
      lessons?: Array<{ title?: string; description?: string; videoIndex?: number }>
    }>
  },
  options: {
    uploadedVideoCount: number
    requestedVideosCount: number | null
    requestedModulesCount: number | null
  },
) {
  const safeTitle = raw.title?.trim() || "Новый курс"
  const safeDescription = raw.description?.trim() || ""
  const sourceModules = Array.isArray(raw.modules) ? raw.modules : []
  const allLessons = sourceModules.flatMap((m) => (Array.isArray(m.lessons) ? m.lessons : []))

  const requestedModules =
    options.requestedModulesCount && options.requestedModulesCount > 0
      ? options.requestedModulesCount
      : sourceModules.length > 0
        ? sourceModules.length
        : 1
  const modulesCount = Math.max(1, requestedModules)

  // Жесткое правило:
  // 1) если пользователь явно указал количество видео — считаем это числом видео-уроков;
  // 2) иначе, если есть загруженные видео — используем их количество;
  // 3) иначе fallback на ответ модели.
  const videoLessonsCount =
    options.requestedVideosCount && options.requestedVideosCount > 0
      ? options.requestedVideosCount
      : options.uploadedVideoCount > 0
        ? options.uploadedVideoCount
        : Math.max(allLessons.length, 1)

  // Для соблюдения параметра modulesCount каждый модуль должен получить хотя бы один урок.
  // Если модулей больше, чем видео, добавляем уроки без привязки к videoIndex.
  const targetLessonCount = Math.max(videoLessonsCount, modulesCount)
  const mappedVideoLessonsCount = Math.min(options.uploadedVideoCount, videoLessonsCount)
  const lessons: Array<{ title: string; description: string; videoIndex?: number }> = []
  for (let i = 0; i < targetLessonCount; i++) {
    const src = allLessons[i]
    lessons.push({
      title: src?.title?.trim() || `Урок ${i + 1}`,
      description: src?.description?.trim() || "",
      ...(mappedVideoLessonsCount > 0 && i < mappedVideoLessonsCount ? { videoIndex: i } : {}),
    })
  }

  const normalizedModules: Array<{
    title: string
    lessons: Array<{ title: string; description?: string; videoIndex?: number }>
  }> = []
  const baseSize = Math.floor(targetLessonCount / modulesCount)
  const extra = targetLessonCount % modulesCount
  let cursor = 0

  for (let i = 0; i < modulesCount; i++) {
    const size = baseSize + (i < extra ? 1 : 0)
    const slice = lessons.slice(cursor, cursor + size)
    cursor += size
    normalizedModules.push({
      title: sourceModules[i]?.title?.trim() || `Модуль ${i + 1}`,
      lessons: slice,
    })
  }

  return {
    title: safeTitle,
    description: safeDescription,
    modules: normalizedModules,
  }
}

function getAgentTempDir() {
  return path.join(process.cwd(), "uploads", "agent-temp")
}

function getCoverDir() {
  return path.join(process.cwd(), "public", "uploads", "course-covers")
}

function extFromMimeOrName(imageUrl: string, fileName: string): string {
  const lower = `${imageUrl} ${fileName}`.toLowerCase()
  if (lower.includes(".png")) return ".png"
  if (lower.includes(".webp")) return ".webp"
  if (lower.includes(".jpeg") || lower.includes(".jpg")) return ".jpg"
  if (lower.includes(".gif")) return ".gif"
  return ".jpg"
}

function extractTempImageName(imageUrl: string): string {
  try {
    const parsed = new URL(imageUrl)
    const fileName = parsed.searchParams.get("path")
    if (!fileName) throw new Error("Не удалось извлечь имя файла из URL")
    return fileName
  } catch {
    throw new Error("Неверный URL изображения")
  }
}

async function callDeepSeek(systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) {
    throw new Error("DEEPSEEK_API_KEY не настроен")
  }

  const res = await fetch(DEEPSEEK_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 2000,
      temperature: 0.6,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message ?? `DeepSeek API error: ${res.status}`)
  }

  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> }
  const content = data.choices?.[0]?.message?.content?.trim()
  if (!content) throw new Error("Пустой ответ от DeepSeek")
  return content
}

function extractJsonFromResponse(text: string): unknown {
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error("Не найден JSON в ответе")
  try {
    return JSON.parse(match[0]) as unknown
  } catch {
    throw new Error("Невалидный JSON в ответе")
  }
}

export function createOpenClawTools(videos: VideoMeta[] = [], images: ChatImageMeta[] = [], userId?: string) {
  const videoNames = videos.map((v) => v.fileName).join(", ")
  const executeProductsGet = async ({ productId, sku }: { productId?: string; sku?: string }) => {
    if (!productId && !sku) throw new Error("Укажи productId или sku")
    const where = productId ? { id: productId } : { sku: sku! }
    const product = await prisma.product.findFirst({
      where,
      include: { category: { select: { id: true, name: true, slug: true } } },
    })
    if (!product) throw new Error("Товар не найден")
    return JSON.stringify(
      {
        id: product.id,
        sku: product.sku,
        name: product.name,
        description: product.description,
        price: product.price ? Number(product.price) : null,
        brand: product.brand,
        unit: product.unit,
        imageUrl: product.imageUrl,
        published: product.published,
        order: product.order,
        category: product.category,
      },
      null,
      2,
    )
  }

  const executeProductsCreate = async ({
    name,
    sku,
    price,
    description,
    brand,
    unit,
    categoryId,
    published,
  }: {
    name: string
    sku?: string
    price?: number
    description?: string
    brand?: string
    unit?: string
    categoryId?: string
    published?: boolean
  }) => {
    const trimmedName = name?.trim()
    if (!trimmedName) throw new Error("Укажи название товара")
    if (price !== undefined && price < 0) throw new Error("Цена не может быть отрицательной")
    const generatedSlug = generateSlug(trimmedName)
    if (!generatedSlug) throw new Error("Название должно содержать хотя бы одну букву или цифру")
    const baseSku = sku?.trim() || generatedSlug.toUpperCase().slice(0, 20)
    let candidateSku = baseSku
    let suffix = 2
    while (await prisma.product.findUnique({ where: { sku: candidateSku } })) {
      candidateSku = `${baseSku}-${suffix++}`
    }
    const slug = generatedSlug
    let candidateSlug: string | null = slug
    let slugSuffix = 2
    while (await prisma.product.findUnique({ where: { slug: candidateSlug } })) {
      candidateSlug = `${slug}-${slugSuffix++}`
    }
    const validUnits = ["PCS", "PACK", "ML", "G", "L", "KG"]
    const resolvedUnit = unit && validUnits.includes(unit.toUpperCase()) ? unit.toUpperCase() : "PCS"
    const product = await prisma.product.create({
      data: {
        name: trimmedName,
        sku: candidateSku,
        price: price ?? null,
        description: description ?? null,
        brand: brand ?? null,
        unit: resolvedUnit as "PCS" | "PACK" | "ML" | "G" | "L" | "KG",
        categoryId: categoryId ?? null,
        slug: candidateSlug,
        published: published ?? false,
      },
    })
    return JSON.stringify({
      message: `Товар "${product.name}" создан (SKU: ${product.sku})`,
      productId: product.id,
      sku: product.sku,
    })
  }

  const executeProductsUpdate = async ({
    productId,
    sku,
    ...fields
  }: {
    productId?: string
    sku?: string
    name?: string
    description?: string
    price?: number
    brand?: string
    imageUrl?: string
    published?: boolean
    categoryId?: string
    order?: number
  }) => {
    if (!productId && !sku) throw new Error("Укажи productId или sku")
    if (fields.price !== undefined && fields.price < 0) throw new Error("Цена не может быть отрицательной")
    const where = productId ? { id: productId } : { sku: sku! }
    const product = await prisma.product.findFirst({ where })
    if (!product) throw new Error("Товар не найден")
    const data: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(fields)) {
      if (v !== undefined) data[k] = v
    }
    if (Object.keys(data).length === 0) throw new Error("Укажи хотя бы одно поле")
    await prisma.product.update({ where: { id: product.id }, data })
    return JSON.stringify({ message: `Товар "${product.name}" обновлён` })
  }

  const executeProductsUpdatePrice = async ({
    productId,
    sku,
    price,
  }: {
    productId?: string
    sku?: string
    price: number
  }) => {
    if (price < 0) throw new Error("Цена не может быть отрицательной")
    if (!productId && !sku) throw new Error("Укажи productId или sku товара")
    const where = productId ? { id: productId } : { sku: sku! }
    const product = await prisma.product.findFirst({ where })
    if (!product) {
      throw new Error(sku ? `Товар с артикулом "${sku}" не найден` : `Товар с id "${productId}" не найден`)
    }
    await prisma.product.update({
      where: { id: product.id },
      data: { price },
    })
    return JSON.stringify({ message: `Цена обновлена: ${product.name} — ${price} ₽` })
  }

  const executeCategoriesList = async () => {
    const categories = await prisma.storeCategory.findMany({
      where: { parentId: null },
      include: { children: { orderBy: { order: "asc" } } },
      orderBy: { order: "asc" },
    })
    return JSON.stringify(
      categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        children: c.children.map((ch) => ({ id: ch.id, name: ch.name, slug: ch.slug })),
      })),
      null,
      2,
    )
  }

  const executeCategoriesCreate = async ({ name, parentId }: { name: string; parentId?: string }) => {
    const trimmedName = name?.trim()
    if (!trimmedName) throw new Error("Укажи название категории")
    const slug = generateSlug(trimmedName)
    if (!slug) throw new Error("Название должно содержать хотя бы одну букву или цифру")
    let candidateSlug = slug
    let suffix = 2
    while (await prisma.storeCategory.findUnique({ where: { slug: candidateSlug } })) {
      candidateSlug = `${slug}-${suffix++}`
    }
    const maxOrder = await prisma.storeCategory
      .aggregate({ where: { parentId: parentId ?? null }, _max: { order: true } })
      .then((r) => r._max.order ?? 0)
    const category = await prisma.storeCategory.create({
      data: {
        name: trimmedName,
        slug: candidateSlug,
        parentId: parentId ?? null,
        order: maxOrder + 1,
      },
    })
    return JSON.stringify({ message: `Категория "${category.name}" создана`, categoryId: category.id })
  }

  const executeKnowledgeSearch = async (
    {
      query,
      source,
      limit: resultLimit,
    }: {
      query: string
      source?: string
      limit?: number
    },
    noResultsMessage: string,
  ) => {
    try {
      const { searchKnowledge } = await import("@/lib/rag")
      const results = await searchKnowledge(query, { limit: resultLimit, source })
      if (results.length === 0) return JSON.stringify({ message: noResultsMessage + query })
      return JSON.stringify(
        results.map((r) => ({
          title: r.title,
          source: r.source,
          content: r.content.slice(0, 500),
          score: r.score,
        })),
        null,
        2,
      )
    } catch (e) {
      return JSON.stringify({ error: e instanceof Error ? e.message : "Ошибка поиска" })
    }
  }

  const executeSocialPostCreate = async ({
    text,
    imageUrl,
    platforms: targetPlatforms,
  }: {
    text: string
    imageUrl?: string
    platforms: string[]
  }) => {
    const validPlatforms = targetPlatforms.filter((p) => ["telegram", "vk"].includes(p))
    if (validPlatforms.length === 0) throw new Error("Укажи платформы: telegram и/или vk")

    const { postToTelegram } = await import("@/lib/social/telegram")
    const { postToVK } = await import("@/lib/social/vk")

    const results: Record<string, unknown> = {}
    let hasError = false
    let successCount = 0

    const notConfigured: string[] = []
    for (const platform of validPlatforms) {
      try {
        if (platform === "telegram") {
          results.telegram = await postToTelegram(text, imageUrl)
          const res = results.telegram as { ok?: boolean; error?: string }
          if (res?.ok) successCount += 1
          else if (res?.error?.includes("не настроен")) notConfigured.push(platform)
          else hasError = true
        } else if (platform === "vk") {
          results.vk = await postToVK(text, imageUrl)
          const res = results.vk as { ok?: boolean; error?: string }
          if (res?.ok) successCount += 1
          else if (res?.error?.includes("не настроен")) notConfigured.push(platform)
          else hasError = true
        }
      } catch (e) {
        results[platform] = { ok: false, error: e instanceof Error ? e.message : "Ошибка" }
        hasError = true
      }
    }
    const status = notConfigured.length === validPlatforms.length
      ? "not_configured"
      : !hasError && notConfigured.length === 0 ? "published" : successCount === 0 ? "failed" : "partial"

    await prisma.socialPost.create({
      data: {
        content: text,
        imageUrl: imageUrl ?? null,
        platforms: validPlatforms,
        status,
        publishedAt: status === "published" || status === "partial" ? new Date() : null,
        results: results as object,
      },
    })

    return JSON.stringify({
      message:
        status === "published"
          ? "Пост опубликован"
          : status === "not_configured"
            ? `Платформы не настроены (${notConfigured.join(", ")}). Проверь переменные окружения.`
            : status === "failed"
              ? "Не удалось опубликовать пост"
              : "Пост опубликован с ошибками",
      results,
    })
  }

  const executeSocialPostList = async ({ limit: resultLimit }: { limit?: number }) => {
    const posts = await prisma.socialPost.findMany({
      select: {
        id: true,
        content: true,
        platforms: true,
        status: true,
        publishedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: resultLimit ?? 10,
    })
    return JSON.stringify(
      posts.map((p) => ({
        id: p.id,
        content: p.content.slice(0, 100) + (p.content.length > 100 ? "..." : ""),
        platforms: p.platforms,
        status: p.status,
        date: p.publishedAt?.toISOString() ?? p.createdAt.toISOString(),
      })),
      null,
      2,
    )
  }

  const executeSkinAnalyze = async ({ imageUrl }: { imageUrl: string }) => {
    const { analyzeSkin } = await import("@/lib/skin-analysis")
    const result = await analyzeSkin(imageUrl, userId)
    return JSON.stringify(result, null, 2)
  }

  return {
    generateCourseStructure: tool({
      description:
        "Генерирует структуру курса (модули и уроки) на основе параметров. Используй после того, как собрал название, аудиторию, сложность, стиль и количество видео/уроков от пользователя.",
      inputSchema: z.object({
        title: z.string().describe("Название курса"),
        description: z.string().optional().describe("Краткое описание курса"),
        audience: z
          .string()
          .describe("Целевая аудитория: начинающие / практикующие / продвинутые косметологи"),
        difficulty: z
          .enum(["beginner", "intermediate", "advanced"])
          .describe("Уровень сложности"),
        style: z
          .string()
          .optional()
          .describe("Стиль подачи: академический / практический / разговорный"),
        customInstructions: z.string().optional().describe("Дополнительные пожелания пользователя"),
        modulesCount: z
          .number()
          .int()
          .positive()
          .max(12)
          .optional()
          .describe("Точное число модулей, если пользователь явно указал"),
        videosCount: z
          .number()
          .int()
          .positive()
          .max(100)
          .optional()
          .describe("Точное число видео/уроков. Если видео не загружены, это поле обязательно."),
      }),
      execute: async (params) => {
        const systemPrompt = `Ты — архитектор онлайн-курсов для школы косметологии "DIB Academy".
Сгенерируй структуру курса в формате JSON. Ответ СТРОГО только JSON, без markdown и пояснений.

Формат:
{
  "title": "Название курса",
  "description": "Краткое описание 2-3 предложения",
  "modules": [
    {
      "title": "Название модуля",
      "lessons": [
        {
          "title": "Название урока",
          "description": "1-2 предложения что изучит студент",
          "videoIndex": 0
        }
      ]
    }
  ]
}

Правила:
- videoIndex — индекс видео (0-based). У пользователя ${videos.length} видео: ${videoNames || "нет"}
- Распредели все видео по урокам. Каждый урок = одно видео.
- 1-4 модуля, 1-5 уроков в модуле.
- Пиши на русском.`

        const userPrompt = `Курс: "${params.title}"
Аудитория: ${params.audience}
Сложность: ${params.difficulty}
${params.style ? `Стиль: ${params.style}` : ""}
${params.customInstructions ? `Дополнительно: ${params.customInstructions}` : ""}
${params.description ? `Описание: ${params.description}` : ""}`

        const content = await callDeepSeek(systemPrompt, userPrompt)
        const json = extractJsonFromResponse(content) as {
          title?: string
          description?: string
          modules?: Array<{
            title: string
            lessons: Array<{ title: string; description?: string; videoIndex?: number }>
          }>
        }

        const requestedModulesCount =
          params.modulesCount ??
          extractRequestedModulesCount(params.customInstructions, params.description, params.audience)
        const requestedVideosCount =
          params.videosCount ??
          extractRequestedVideosCount(params.customInstructions, params.description, params.audience)
        if (!requestedVideosCount && videos.length === 0) {
          throw new Error(
            "Перед генерацией структуры укажите количество видео/уроков отдельным ответом (например: 5 видео).",
          )
        }
        const normalized = normalizeStructureByConstraints(json, {
          uploadedVideoCount: videos.length,
          requestedVideosCount,
          requestedModulesCount,
        })

        if (!normalized.modules?.length) {
          throw new Error("Структура курса пуста")
        }

        return JSON.stringify(normalized, null, 2)
      },
    }),

    createDraftCourse: tool({
      description:
        "Создаёт курс в базе данных как черновик. Вызывай только после подтверждения пользователя. Требует одобрения пользователя.",
      needsApproval: true,
      inputSchema: z.object({
        title: z.string(),
        slug: z.string().describe("URL-slug курса, только латиница и дефисы"),
        description: z.string(),
        author: z.string().default("Айхаана Данилова"),
        modules: z.array(
          z.object({
            title: z.string(),
            lessons: z.array(
              z.object({
                title: z.string(),
                description: z.string().optional(),
                videoIndex: z.number().optional().describe("Индекс видео (0-based)"),
              }),
            ),
          }),
        ),
      }),
      execute: async (params) => {
        // Проверяем, что все видео с videoIndex готовы
        const videoIndices = new Set<number>()
        for (const mod of params.modules) {
          for (const les of mod.lessons) {
            if (les.videoIndex !== undefined) {
              videoIndices.add(les.videoIndex)
            }
          }
        }

        for (const idx of videoIndices) {
          const v = videos[idx]
          if (!v) {
            throw new Error(`Видео с индексом ${idx} не найдено`)
          }
          if (!v.muxAssetId || !v.muxPlaybackId || v.muxStatus !== "ready") {
            throw new Error(
              `Видео "${v.fileName}" ещё не готово (статус: ${v.muxStatus ?? "unknown"}). Дождитесь завершения загрузки.`,
            )
          }
        }

        // Проверка уникальности slug
        const existing = await prisma.course.findUnique({ where: { slug: params.slug } })
        if (existing) {
          throw new Error(`Курс с slug "${params.slug}" уже существует. Выбери другой.`)
        }

        const course = await prisma.$transaction(async (tx) => {
          const created = await tx.course.create({
            data: {
              title: params.title,
              slug: params.slug,
              description: params.description,
              author: params.author,
              published: false,
              aiGenerated: true,
              aiMetadata: {
                generatedAt: new Date().toISOString(),
                videoCount: videos.length,
              },
            },
          })

          let moduleOrder = 1
          for (const mod of params.modules) {
            const createdModule = await tx.module.create({
              data: {
                title: mod.title,
                order: moduleOrder++,
                courseId: created.id,
              },
            })

            let lessonOrder = 1
            for (const les of mod.lessons) {
              const video = les.videoIndex !== undefined ? videos[les.videoIndex] : null
              await tx.lesson.create({
                data: {
                  title: les.title,
                  description: les.description ?? null,
                  order: lessonOrder++,
                  moduleId: createdModule.id,
                  aiGenerated: true,
                  ...(video
                    ? {
                        muxAssetId: video.muxAssetId!,
                        muxPlaybackId: video.muxPlaybackId!,
                        muxStatus: "ready",
                        durationMin: video.duration ? Math.ceil(video.duration / 60) : 0,
                      }
                    : {}),
                },
              })
            }
          }

          return created
        })

        const baseUrl = process.env.NEXTAUTH_URL ?? "https://dibinterfarm.ru"
        return JSON.stringify({
          courseId: course.id,
          editorUrl: `${baseUrl}/admin/courses/${course.id}`,
          message: `Курс создан. Откройте редактор для загрузки обложки и финальной настройки.`,
        })
      },
    }),

    listCourses: tool({
      description:
        "Возвращает список всех курсов (id, title, slug, published). Используй, когда пользователь хочет редактировать курс — сначала найди нужный по названию или slug.",
      inputSchema: z.object({}),
      execute: async () => {
        const courses = await prisma.course.findMany({
          select: { id: true, title: true, slug: true, published: true },
          orderBy: { updatedAt: "desc" },
        })
        return JSON.stringify(courses, null, 2)
      },
    }),

    getCourseStructure: tool({
      description:
        "Возвращает полную структуру курса: модули и уроки с их id, title, description. Используй перед редактированием, чтобы знать что менять.",
      inputSchema: z.object({
        courseId: z.string().describe("ID курса из listCourses"),
      }),
      execute: async ({ courseId }) => {
        const course = await prisma.course.findUnique({
          where: { id: courseId },
          include: {
            modules: {
              orderBy: { order: "asc" },
              include: {
                lessons: { orderBy: { order: "asc" } },
              },
            },
          },
        })
        if (!course) throw new Error(`Курс с id ${courseId} не найден`)
        return JSON.stringify(
          {
            id: course.id,
            title: course.title,
            slug: course.slug,
            description: course.description,
            published: course.published,
            modules: course.modules.map((m) => ({
              id: m.id,
              title: m.title,
              order: m.order,
              lessons: m.lessons.map((l) => ({
                id: l.id,
                title: l.title,
                description: l.description,
                order: l.order,
                muxStatus: l.muxStatus,
              })),
            })),
          },
          null,
          2,
        )
      },
    }),

    updateCourse: tool({
      description: "Обновляет название или описание курса.",
      inputSchema: z.object({
        courseId: z.string(),
        title: z.string().optional().describe("Новое название"),
        description: z.string().optional().describe("Новое описание"),
      }),
      execute: async ({ courseId, title, description }) => {
        const data: { title?: string; description?: string } = {}
        if (title !== undefined) data.title = title
        if (description !== undefined) data.description = description
        if (Object.keys(data).length === 0) {
          throw new Error("Укажи title или description для обновления")
        }
        const course = await prisma.course.update({
          where: { id: courseId },
          data,
        })
        return JSON.stringify({ message: "Курс обновлён", courseId: course.id })
      },
    }),

    updateModule: tool({
      description: "Обновляет название модуля.",
      inputSchema: z.object({
        moduleId: z.string(),
        title: z.string(),
      }),
      execute: async ({ moduleId, title }) => {
        await prisma.module.update({
          where: { id: moduleId },
          data: { title },
        })
        return JSON.stringify({ message: "Модуль обновлён", moduleId })
      },
    }),

    updateLesson: tool({
      description: "Обновляет название или описание урока.",
      inputSchema: z.object({
        lessonId: z.string(),
        title: z.string().optional().describe("Новое название урока"),
        description: z.string().optional().describe("Новое описание урока"),
      }),
      execute: async ({ lessonId, title, description }) => {
        const data: { title?: string; description?: string } = {}
        if (title !== undefined) data.title = title
        if (description !== undefined) data.description = description
        if (Object.keys(data).length === 0) {
          throw new Error("Укажи title или description для обновления")
        }
        await prisma.lesson.update({
          where: { id: lessonId },
          data,
        })
        return JSON.stringify({ message: "Урок обновлён", lessonId })
      },
    }),

    addModuleToCourse: tool({
      description: "Добавляет новый модуль в курс.",
      inputSchema: z.object({
        courseId: z.string(),
        title: z.string().describe("Название модуля"),
      }),
      execute: async ({ courseId, title }) => {
        const maxOrder = await prisma.module
          .aggregate({ where: { courseId }, _max: { order: true } })
          .then((r) => r._max.order ?? 0)
        const module_ = await prisma.module.create({
          data: { courseId, title, order: maxOrder + 1 },
        })
        const baseUrl = process.env.NEXTAUTH_URL ?? "https://dibinterfarm.ru"
        return JSON.stringify({
          message: "Модуль добавлен",
          moduleId: module_.id,
          editorUrl: `${baseUrl}/admin/courses/${courseId}`,
        })
      },
    }),

    addLessonToModule: tool({
      description:
        "Добавляет новый урок в модуль. Если пользователь прикрепил видео в чате — укажи videoIndex (0-based). Иначе урок будет без видео.",
      inputSchema: z.object({
        moduleId: z.string(),
        title: z.string(),
        description: z.string().optional(),
        videoIndex: z.number().optional().describe("Индекс видео из чата (0-based)"),
      }),
      execute: async ({ moduleId, title, description, videoIndex }) => {
        const maxOrder = await prisma.lesson
          .aggregate({ where: { moduleId }, _max: { order: true } })
          .then((r) => r._max.order ?? 0)

        const video =
          videoIndex !== undefined ? videos[videoIndex] : null
        if (videoIndex !== undefined && !video) {
          throw new Error(`Видео с индексом ${videoIndex} не найдено в чате`)
        }
        if (video && (!video.muxAssetId || !video.muxPlaybackId || video.muxStatus !== "ready")) {
          throw new Error(
            `Видео "${video.fileName}" ещё не готово. Дождитесь завершения загрузки.`,
          )
        }

        await prisma.lesson.create({
          data: {
            moduleId,
            title,
            description: description ?? null,
            order: maxOrder + 1,
            aiGenerated: true,
            ...(video
              ? {
                  muxAssetId: video.muxAssetId!,
                  muxPlaybackId: video.muxPlaybackId!,
                  muxStatus: "ready" as const,
                  durationMin: video.duration ? Math.ceil(video.duration / 60) : 0,
                }
              : {}),
          },
        })
        return JSON.stringify({ message: "Урок добавлен", moduleId })
      },
    }),

    addVideoToModule: tool({
      description:
        "Добавляет видео в конкретный модуль существующего курса как новый урок. Используй, когда пользователь просит: 'добавь видео в N модуль'.",
      inputSchema: z.object({
        courseId: z.string().describe("ID курса"),
        moduleId: z.string().optional().describe("ID модуля, если уже известен"),
        moduleOrder: z
          .number()
          .int()
          .positive()
          .optional()
          .describe("Порядковый номер модуля (1-based), например 9"),
        videoIndex: z.number().int().nonnegative().describe("Индекс видео из текущего чата (0-based)"),
        lessonTitle: z
          .string()
          .optional()
          .describe("Опционально: название нового урока. По умолчанию формируется автоматически."),
        lessonDescription: z.string().optional().describe("Опционально: описание урока"),
      }),
      execute: async ({ courseId, moduleId, moduleOrder, videoIndex, lessonTitle, lessonDescription }) => {
        const video = videos[videoIndex]
        if (!video) {
          throw new Error(`Видео с индексом ${videoIndex} не найдено в чате`)
        }
        if (!video.muxAssetId || !video.muxPlaybackId || video.muxStatus !== "ready") {
          throw new Error(`Видео "${video.fileName}" ещё не готово. Дождитесь завершения загрузки.`)
        }

        const module_ = moduleId
          ? await prisma.module.findUnique({
              where: { id: moduleId },
              select: { id: true, title: true, order: true, courseId: true },
            })
          : moduleOrder
            ? await prisma.module.findFirst({
                where: { courseId, order: moduleOrder },
                select: { id: true, title: true, order: true, courseId: true },
              })
            : null

        if (!module_) {
          throw new Error(
            moduleOrder
              ? `Модуль №${moduleOrder} не найден в курсе`
              : "Не найден целевой модуль. Укажи moduleId или moduleOrder.",
          )
        }
        if (module_.courseId !== courseId) {
          throw new Error("Указанный модуль не принадлежит выбранному курсу")
        }

        const nextOrder = await prisma.lesson
          .aggregate({ where: { moduleId: module_.id }, _max: { order: true } })
          .then((r) => (r._max.order ?? 0) + 1)

        const createdLesson = await prisma.lesson.create({
          data: {
            moduleId: module_.id,
            title: lessonTitle?.trim() || `Видеоурок: ${video.fileName.replace(/\.[^.]+$/, "")}`,
            description: lessonDescription?.trim() || null,
            order: nextOrder,
            aiGenerated: true,
            muxAssetId: video.muxAssetId,
            muxPlaybackId: video.muxPlaybackId,
            muxStatus: "ready",
            durationMin: video.duration ? Math.ceil(video.duration / 60) : 0,
          },
          select: { id: true, title: true },
        })

        return JSON.stringify({
          message: `Видео добавлено в модуль "${module_.title}" как урок "${createdLesson.title}".`,
          courseId,
          moduleId: module_.id,
          moduleOrder: module_.order,
          lessonId: createdLesson.id,
        })
      },
    }),

    setCourseCover: tool({
      description:
        "Устанавливает обложку курса из изображения, загруженного в текущий чат. Используй, когда пользователь просит поставить/обновить обложку.",
      inputSchema: z.object({
        courseId: z.string().optional().describe("ID курса"),
        courseTitle: z
          .string()
          .optional()
          .describe("Название курса для поиска, если courseId не указан"),
        imageIndex: z
          .number()
          .int()
          .nonnegative()
          .optional()
          .describe("Индекс изображения из текущего чата (0-based)"),
      }),
      execute: async ({ courseId, courseTitle, imageIndex = 0 }) => {
        const image = images[imageIndex]
        if (!image) {
          throw new Error(`Изображение с индексом ${imageIndex} не найдено в чате`)
        }

        let resolvedCourseId: string | null = courseId ?? null
        if (!resolvedCourseId && courseTitle?.trim()) {
          const found = await prisma.course.findMany({
            where: {
              OR: [
                { title: { contains: courseTitle.trim(), mode: "insensitive" } },
                { slug: { contains: generateSlug(courseTitle.trim()), mode: "insensitive" } },
              ],
            },
            select: { id: true, title: true, updatedAt: true },
            orderBy: { updatedAt: "desc" },
            take: 5,
          })
          if (found.length === 0) {
            throw new Error(`Курс с названием "${courseTitle}" не найден`)
          }
          // Берем наиболее свежий матч.
          resolvedCourseId = found[0].id
        }
        if (!resolvedCourseId) {
          throw new Error("Укажи courseId или courseTitle для установки обложки")
        }

        const course = await prisma.course.findUnique({
          where: { id: resolvedCourseId },
          select: { id: true, title: true, thumbnailUrl: true },
        })
        if (!course) {
          throw new Error("Курс не найден")
        }

        const sourceFileName = extractTempImageName(image.url)
        const sourcePath = path.join(getAgentTempDir(), sourceFileName)
        const ext = extFromMimeOrName(image.url, image.fileName)
        const destDir = getCoverDir()
        const destFileName = `${course.id}${ext}`
        const destPath = path.join(destDir, destFileName)
        const thumbnailUrl = `/uploads/course-covers/${destFileName}`

        await mkdir(destDir, { recursive: true })
        for (const oldExt of [".jpg", ".jpeg", ".png", ".webp", ".gif"]) {
          if (oldExt === ext) continue
          try {
            await unlink(path.join(destDir, `${course.id}${oldExt}`))
          } catch {
            // ignore
          }
        }

        try {
          await copyFile(sourcePath, destPath)
        } catch {
          throw new Error("Не удалось прочитать загруженное изображение. Загрузите файл ещё раз.")
        }

        await prisma.course.update({
          where: { id: course.id },
          data: { thumbnailUrl },
        })

        return JSON.stringify({
          message: `Обложка курса "${course.title}" обновлена.`,
          courseId: course.id,
          thumbnailUrl,
        })
      },
    }),

    // === Магазин: цены (products_list — алиас для совместимости с промптом) ===
    productsList: tool({
      description:
        "Возвращает список товаров магазина (id, sku, name, price). Вызови без search для полной выкладки. Используй для поиска товара перед изменением цены.",
      inputSchema: z.object({
        search: z.string().optional().describe("Поиск по названию или SKU. Не указывай для полного списка."),
      }),
      execute: async ({ search }) => {
        try {
          const where = search
            ? {
                OR: [
                  { name: { contains: search, mode: "insensitive" as const } },
                  { sku: { contains: search, mode: "insensitive" as const } },
                ],
              }
            : {}
          const products = await prisma.product.findMany({
            where,
            select: { id: true, sku: true, name: true, price: true },
            orderBy: { name: "asc" },
            take: 500,
          })
          return JSON.stringify(
            products.map((p) => ({
              id: p.id,
              sku: p.sku,
              name: p.name,
              price: p.price ? Number(p.price) : null,
            })),
            null,
            2,
          )
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Ошибка при запросе списка товаров"
          return JSON.stringify({ error: msg })
        }
      },
    }),
    products_list: tool({
      description:
        "Полный список товаров магазина. Вызови без параметров — вернётся полная выкладка (id, sku, name, price).",
      inputSchema: z.object({
        search: z.string().optional().describe("Опционально: поиск по названию или SKU."),
      }),
      execute: async ({ search }) => {
        try {
          const where = search
            ? {
                OR: [
                  { name: { contains: search, mode: "insensitive" as const } },
                  { sku: { contains: search, mode: "insensitive" as const } },
                ],
              }
            : {}
          const products = await prisma.product.findMany({
            where,
            select: { id: true, sku: true, name: true, price: true },
            orderBy: { name: "asc" },
            take: 500,
          })
          return JSON.stringify(
            products.map((p) => ({
              id: p.id,
              sku: p.sku,
              name: p.name,
              price: p.price ? Number(p.price) : null,
            })),
            null,
            2,
          )
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Ошибка при запросе списка товаров"
          return JSON.stringify({ error: msg })
        }
      },
    }),

    productsUpdatePrice: tool({
      description:
        "Изменяет цену товара в магазине. Укажи productId (из productsList) ИЛИ sku (артикул, напр. DRP-DTC-50). Цена в рублях.",
      inputSchema: z.object({
        productId: z.string().optional().describe("ID товара из productsList"),
        sku: z.string().optional().describe("Артикул товара, напр. DRP-DTC-50"),
        price: z.number().describe("Новая цена в рублях"),
      }),
      execute: executeProductsUpdatePrice,
    }),
    products_update_price: tool({
      description: "Изменяет цену товара в магазине.",
      inputSchema: z.object({
        productId: z.string().optional().describe("ID товара из productsList"),
        sku: z.string().optional().describe("Артикул товара, напр. DRP-DTC-50"),
        price: z.number().describe("Новая цена в рублях"),
      }),
      execute: executeProductsUpdatePrice,
    }),

    // === Магазин: расширенное управление ===
    productsGet: tool({
      description: "Возвращает полную карточку товара: описание, бренд, категорию, изображение, статус публикации.",
      inputSchema: z.object({
        productId: z.string().optional().describe("ID товара"),
        sku: z.string().optional().describe("Артикул товара"),
      }),
      execute: executeProductsGet,
    }),
    products_get: tool({
      description: "Полная карточка товара (описание, бренд, категория, изображение, публикация).",
      inputSchema: z.object({
        productId: z.string().optional().describe("ID товара"),
        sku: z.string().optional().describe("Артикул товара"),
      }),
      execute: executeProductsGet,
    }),

    productsCreate: tool({
      description: "Создаёт новый товар в магазине. SKU генерируется автоматически, если не указан.",
      inputSchema: z.object({
        name: z.string().describe("Название товара"),
        sku: z.string().optional().describe("Артикул (уникальный)"),
        price: z.number().optional().describe("Цена в рублях"),
        description: z.string().optional().describe("Описание товара"),
        brand: z.string().optional().describe("Бренд/производитель"),
        unit: z.string().optional().describe("Единица: PCS, PACK, ML, G, L, KG"),
        categoryId: z.string().optional().describe("ID категории"),
        published: z.boolean().optional().describe("Опубликовать на витрине"),
      }),
      execute: executeProductsCreate,
    }),
    products_create: tool({
      description: "Создаёт новый товар в магазине.",
      inputSchema: z.object({
        name: z.string().describe("Название товара"),
        sku: z.string().optional().describe("Артикул"),
        price: z.number().optional().describe("Цена в рублях"),
        description: z.string().optional().describe("Описание"),
        brand: z.string().optional().describe("Бренд"),
        unit: z.string().optional().describe("Единица: PCS, PACK, ML, G, L, KG"),
        categoryId: z.string().optional().describe("ID категории"),
        published: z.boolean().optional().describe("Опубликовать"),
      }),
      execute: executeProductsCreate,
    }),

    productsUpdate: tool({
      description: "Обновляет любые поля товара: название, описание, бренд, изображение, категорию, цену, публикацию.",
      inputSchema: z.object({
        productId: z.string().optional().describe("ID товара"),
        sku: z.string().optional().describe("Артикул для поиска"),
        name: z.string().optional().describe("Новое название"),
        description: z.string().optional().describe("Новое описание"),
        price: z.number().optional().describe("Новая цена"),
        brand: z.string().optional().describe("Бренд"),
        imageUrl: z.string().optional().describe("URL изображения"),
        published: z.boolean().optional().describe("Показывать на витрине"),
        categoryId: z.string().optional().describe("ID категории"),
        order: z.number().optional().describe("Порядок отображения"),
      }),
      execute: executeProductsUpdate,
    }),
    products_update: tool({
      description: "Обновляет товар: название, описание, бренд, изображение, категорию, цену, публикацию.",
      inputSchema: z.object({
        productId: z.string().optional().describe("ID товара"),
        sku: z.string().optional().describe("Артикул"),
        name: z.string().optional(),
        description: z.string().optional(),
        price: z.number().optional(),
        brand: z.string().optional(),
        imageUrl: z.string().optional(),
        published: z.boolean().optional(),
        categoryId: z.string().optional(),
        order: z.number().optional(),
      }),
      execute: executeProductsUpdate,
    }),

    categoriesList: tool({
      description: "Дерево категорий магазина с id, name, slug и подкатегориями.",
      inputSchema: z.object({}),
      execute: executeCategoriesList,
    }),
    categories_list: tool({
      description: "Список категорий магазина (дерево).",
      inputSchema: z.object({}),
      execute: executeCategoriesList,
    }),

    categoriesCreate: tool({
      description: "Создаёт новую категорию магазина. parentId — для подкатегории.",
      inputSchema: z.object({
        name: z.string().describe("Название категории"),
        parentId: z.string().optional().describe("ID родительской категории"),
      }),
      execute: executeCategoriesCreate,
    }),
    categories_create: tool({
      description: "Создаёт категорию магазина.",
      inputSchema: z.object({
        name: z.string().describe("Название"),
        parentId: z.string().optional().describe("ID родительской категории"),
      }),
      execute: executeCategoriesCreate,
    }),

    // === Контент сайта ===
    contentList: tool({
      description:
        "Список контента. Подзаголовок магазина = shop_subtitle. Ключи: shop_title, shop_subtitle, hero_title, footer_phone, about_text.",
      inputSchema: z.object({}),
      execute: async () => {
        const items = await prisma.siteContent.findMany({
          select: { key: true, value: true },
          orderBy: { key: "asc" },
        })
        return JSON.stringify(items, null, 2)
      },
    }),

    contentUpdate: tool({
      description:
        "Обновляет текст. Подзаголовок магазина = shop_subtitle. Пример: key: shop_subtitle, value: Корейская косметика для профессионалов",
      inputSchema: z.object({
        key: z.string().describe("Ключ: shop_subtitle (подзаголовок магазина), shop_title, footer_phone"),
        value: z.string().describe("Новый текст"),
      }),
      execute: async ({ key, value }) => {
        await prisma.siteContent.upsert({
          where: { key },
          create: { key, value },
          update: { value },
        })
        return JSON.stringify({ message: `Контент "${key}" обновлён` })
      },
    }),

    // === База знаний (RAG) ===
    knowledgeSearch: tool({
      description: "Семантический поиск по базе знаний DIB Academy: продукты, процедуры, ингредиенты, FAQ. Используй для экспертной информации.",
      inputSchema: z.object({
        query: z.string().describe("Поисковый запрос"),
        source: z.string().optional().describe("Фильтр: product, procedure, ingredient, faq, article"),
        limit: z.number().optional().describe("Макс. результатов (по умолч. 5)"),
      }),
      execute: (params) =>
        executeKnowledgeSearch(params, "Ничего не найдено в базе знаний по запросу: "),
    }),
    knowledge_search: tool({
      description: "Поиск в базе знаний (продукты, процедуры, ингредиенты, FAQ).",
      inputSchema: z.object({
        query: z.string().describe("Запрос"),
        source: z.string().optional().describe("Фильтр: product, procedure, ingredient, faq"),
        limit: z.number().optional().describe("Макс. результатов"),
      }),
      execute: (params) => executeKnowledgeSearch(params, "Ничего не найдено: "),
    }),

    // === Соцсети ===
    socialPostCreate: tool({
      description: "Публикует пост в Telegram-канал и/или VK-сообщество.",
      inputSchema: z.object({
        text: z.string().describe("Текст поста"),
        imageUrl: z.string().optional().describe("URL изображения"),
        platforms: z.array(z.string()).describe('Платформы: ["telegram"], ["vk"] или ["telegram", "vk"]'),
      }),
      execute: executeSocialPostCreate,
    }),
    social_post_create: tool({
      description: "Публикует пост в соцсети (telegram, vk).",
      inputSchema: z.object({
        text: z.string().describe("Текст поста"),
        imageUrl: z.string().optional().describe("URL изображения"),
        platforms: z.array(z.string()).describe("Платформы"),
      }),
      execute: executeSocialPostCreate,
    }),

    socialPostList: tool({
      description: "История постов в соцсетях.",
      inputSchema: z.object({
        limit: z.number().optional().describe("Количество (по умолч. 10)"),
      }),
      execute: executeSocialPostList,
    }),
    social_post_list: tool({
      description: "Список постов в соцсетях.",
      inputSchema: z.object({
        limit: z.number().optional().describe("Количество"),
      }),
      execute: executeSocialPostList,
    }),

    // === Диагностика кожи ===
    skinAnalyze: tool({
      description: "Анализирует фото кожи через Vision AI. Передай URL загруженного изображения.",
      inputSchema: z.object({
        imageUrl: z.string().describe("URL изображения кожи"),
      }),
      execute: executeSkinAnalyze,
    }),
    skin_analyze: tool({
      description: "Анализ фото кожи + рекомендации продуктов.",
      inputSchema: z.object({
        imageUrl: z.string().describe("URL изображения"),
      }),
      execute: executeSkinAnalyze,
    }),

    // ==================== Отчёты по клиентам ====================

    client_report: tool({
      description: "Сводка по клиентам: список клиентов, какой косметикой пользуются, заказы, статистика. Используй когда пользователь спрашивает 'сводку по клиентам', 'какой косметикой пользуются', 'отчёт по продажам'.",
      inputSchema: z.object({
        type: z.enum(["all_clients", "top_products", "recent_orders", "client_detail"]).describe(
          "Тип отчёта: all_clients=все клиенты, top_products=популярные товары, recent_orders=последние заказы, client_detail=детали по клиенту"
        ),
        clientName: z.string().optional().describe("Имя клиента для детального отчёта"),
        limit: z.number().optional().describe("Количество записей (по умолчанию 10)"),
      }),
      execute: async ({ type, clientName, limit: lim }) => {
        const take = lim ?? 10

        if (type === "all_clients") {
          const clients = await prisma.client.findMany({
            take,
            orderBy: { createdAt: "desc" },
            select: { name: true, email: true, phone: true, birthDate: true, source: true, createdAt: true },
          })
          const total = await prisma.client.count()
          return JSON.stringify({ total, clients }, null, 2)
        }

        if (type === "top_products") {
          const items = await prisma.orderItem.groupBy({
            by: ["productId"],
            _sum: { quantity: true },
            orderBy: { _sum: { quantity: "desc" } },
            where: { productId: { not: null } },
            take,
          })
          const productIds = items.map((i) => i.productId!).filter(Boolean)
          const products = await prisma.product.findMany({
            where: { id: { in: productIds } },
            select: { id: true, name: true, sku: true, brand: true },
          })
          const result = items.map((i) => {
            const p = products.find((pp) => pp.id === i.productId)
            return { product: p?.name ?? "—", sku: p?.sku, brand: p?.brand, totalSold: Number(i._sum.quantity ?? 0) }
          })
          return JSON.stringify(result, null, 2)
        }

        if (type === "recent_orders") {
          const orders = await prisma.order.findMany({
            take,
            orderBy: { createdAt: "desc" },
            include: {
              user: { select: { name: true, email: true } },
              items: { include: { product: { select: { name: true } }, course: { select: { title: true } } } },
            },
          })
          return JSON.stringify(
            orders.map((o) => ({
              orderNumber: o.orderNumber,
              client: o.user.name ?? o.user.email,
              total: Number(o.totalAmount),
              status: o.status,
              date: o.createdAt.toISOString().slice(0, 10),
              items: o.items.map((i) => ({
                name: i.product?.name ?? i.course?.title ?? "—",
                qty: i.quantity,
                price: Number(i.unitPrice),
              })),
            })),
            null, 2,
          )
        }

        if (type === "client_detail" && clientName) {
          const client = await prisma.client.findFirst({
            where: { name: { contains: clientName, mode: "insensitive" } },
            include: {
              notes: { orderBy: { createdAt: "desc" }, take: 5 },
              leads: { orderBy: { createdAt: "desc" }, take: 5 },
              user: {
                select: {
                  orders: {
                    take: 5,
                    orderBy: { createdAt: "desc" },
                    include: { items: { include: { product: { select: { name: true } } } } },
                  },
                },
              },
            },
          })
          if (!client) return JSON.stringify({ error: `Клиент "${clientName}" не найден` })
          return JSON.stringify({
            name: client.name,
            email: client.email,
            phone: client.phone,
            birthDate: client.birthDate?.toISOString().slice(0, 10) ?? null,
            notes: client.notes.map((n) => ({ text: n.text, callAt: n.callAt?.toISOString() ?? null })),
            orders: client.user?.orders.map((o) => ({
              number: o.orderNumber,
              total: Number(o.totalAmount),
              items: o.items.map((i) => i.product?.name ?? "—"),
            })) ?? [],
          }, null, 2)
        }

        return JSON.stringify({ error: "Неизвестный тип отчёта" })
      },
    }),
  }
}
