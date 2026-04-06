import { convertToModelMessages, streamText } from "ai"
import { createOpenAI } from "@ai-sdk/openai"
import { deepseek } from "@ai-sdk/deepseek"
import { auth } from "@/lib/auth"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { createOpenClawTools, type VideoMeta, type ChatImageMeta } from "@/lib/openclaw-tools"

let openclawHealthCache: { ok: boolean; checkedAt: number } | null = null

async function isOpenClawHealthy(baseUrl: string, token: string): Promise<boolean> {
  const now = Date.now()
  if (openclawHealthCache && now - openclawHealthCache.checkedAt < 30_000) {
    return openclawHealthCache.ok
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 1500)
    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/v1/models`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
    clearTimeout(timeout)
    const ok = res.ok
    openclawHealthCache = { ok, checkedAt: now }
    return ok
  } catch {
    openclawHealthCache = { ok: false, checkedAt: now }
    return false
  }
}

function firstUserMessageText(messages: unknown[]): string | null {
  for (const m of messages) {
    if (typeof m !== "object" || m === null) continue
    const msg = m as { role?: string; parts?: Array<{ type?: string; text?: string }> }
    if (msg.role !== "user" || !Array.isArray(msg.parts)) continue
    const textPart = msg.parts.find((p) => p?.type === "text" && typeof p.text === "string")
    if (textPart && (textPart as { text: string }).text) {
      return ((textPart as { text: string }).text as string).slice(0, 50).trim() || null
    }
  }
  return null
}

function sanitizeMessagesForStorage(messages: unknown[]): object[] {
  const result: object[] = []

  for (const msg of messages) {
    if (!msg || typeof msg !== "object") continue

    const message = msg as { id?: unknown; role?: unknown; parts?: unknown[] }
    const role = typeof message.role === "string" ? message.role : null
    if (!role) continue

    const rawParts = Array.isArray(message.parts) ? message.parts : []
    const safeParts: object[] = []

    for (const part of rawParts) {
      if (!part || typeof part !== "object") continue

      const p = part as { type?: unknown; state?: unknown; text?: unknown }
      if (typeof p.type !== "string") continue
      if (p.type === "text" && typeof p.text !== "string") continue
      if (p.type === "text" && p.state === "streaming") continue
      safeParts.push(part as Record<string, unknown>)
    }

    if (role === "assistant") {
      const hasMeaningfulPart = safeParts.some((part) => {
        const p = part as { type?: unknown; text?: unknown; state?: unknown }
        if (p.type === "text" && typeof p.text === "string" && p.text.trim().length > 0) return true
        if (typeof p.type === "string" && p.type.startsWith("tool-") && typeof p.state === "string") {
          return p.state === "output-available" || p.state === "approval-requested" || p.state === "approval-responded"
        }
        return false
      })
      if (!hasMeaningfulPart) continue
    }

    if (safeParts.length === 0) continue

    result.push({
      ...(typeof message.id === "string" ? { id: message.id } : {}),
      role,
      parts: safeParts,
    })
  }

  return result
}

function sanitizeMessagesForModel(
  messages: unknown[],
  options?: { keepToolParts?: boolean },
): object[] {
  const keepToolParts = options?.keepToolParts === true
  const result: object[] = []

  for (const msg of messages) {
    if (!msg || typeof msg !== "object") continue

    const message = msg as { id?: unknown; role?: unknown; parts?: unknown[] }
    const role = typeof message.role === "string" ? message.role : null
    if (!role) continue

    const rawParts = Array.isArray(message.parts) ? message.parts : []
    const safeParts: object[] = []

    for (const part of rawParts) {
      if (!part || typeof part !== "object") continue

      const p = part as { type?: unknown; state?: unknown; text?: unknown }
      if (typeof p.type !== "string") continue

      if (p.type === "text" && typeof p.text === "string") {
        if (p.state === "streaming") continue
        safeParts.push(part as Record<string, unknown>)
        continue
      }

      if (p.type.startsWith("tool-")) {
        if (keepToolParts) {
          safeParts.push(part as Record<string, unknown>)
          continue
        }
        // В историю модели не передаём tool-parts.
        // DeepSeek через OpenAI-совместимый endpoint периодически отвергает
        // такие цепочки с ошибкой "insufficient tool messages following tool_calls".
        // Для устойчивости оставляем только текстовый контекст.
        continue
      }
    }

    if (safeParts.length === 0) continue

    result.push({
      ...(typeof message.id === "string" ? { id: message.id } : {}),
      role,
      parts: safeParts,
    })
  }

  return result
}

export const maxDuration = 120

type ImageMeta = ChatImageMeta

interface ActiveCourseContext {
  courseId: string
  title: string
  slug?: string
  editorUrl?: string
}

function hasAgentStateFieldsError(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  return (
    error.message.includes("Unknown field `activeCourse`") ||
    error.message.includes("Unknown field `attachments`")
  )
}

function buildSystemPrompt(
  videos: VideoMeta[],
  images: ImageMeta[],
  activeCourse: ActiveCourseContext | null,
): string {
  const videoList =
    videos.length > 0
      ? videos
          .map(
            (v, i) =>
              `  ${i}. ${v.fileName} (${v.fileSize ? `${(v.fileSize / 1024 / 1024).toFixed(1)} МБ` : "?"}) — ${v.muxStatus ?? "загрузка"}${v.muxStatus === "ready" ? " ✓" : ""}`,
          )
          .join("\n")
      : "  (пока нет)"

  const imageList =
    images.length > 0
      ? images.map((img, i) => `  ${i}. ${img.fileName} — ${img.url}`).join("\n")
      : "  (пока нет)"

  const activeCourseBlock = activeCourse
    ? `В текущем чате уже создан черновик курса:
  - courseId: ${activeCourse.courseId}
  - title: ${activeCourse.title}
  - slug: ${activeCourse.slug ?? "(не указан)"}
  - editorUrl: ${activeCourse.editorUrl ?? "(нет)"}

При запросах "добавить видео/урок/модуль", "обновить курс", "править структуру" работай с ЭТИМ курсом через tools редактирования (getCourseStructure/addModuleToCourse/addLessonToModule/updateCourse/updateModule/updateLesson).
Не генерируй новую структуру и не создавай новый курс, если пользователь явно не попросил начать новый курс.
`
    : "Черновик в текущем чате пока не создан."

  return `Ты — Лина, AI-ассистент школы косметологии "DIB Academy". Ты — виртуальный сотрудник: дружелюбная, профессиональная, с лёгким чувством юмора. Разбираешься в косметологии, уходе за кожей и бьюти-индустрии.

Стиль общения:
- Живой, тёплый, по-дружески, но без панибратства. Как умная коллега, а не робот.
- Отвечай кратко и по делу. Не лей воду. Если можно сказать в 2 предложения — скажи в 2.
- Можешь использовать уместные эмодзи (✨ 💄 📦 🎓), но не перебарщивай.
- Если пользователь просит что-то сделать — делай сразу, не переспрашивай очевидное.
- Можешь поддержать small talk на тему красоты и косметологии.
- Когда предлагаешь варианты — перечисляй списком с дефисом (формат: "- вариант"), чтобы в UI появились кнопки.

Загруженные видео:
${videoList}

Загруженные изображения:
${imageList}

Контекст текущего черновика:
${activeCourseBlock}

Твои возможности:

📚 **Курсы:**
- Создавать курсы: собери название, аудиторию, уровень и количество уроков в естественном диалоге, затем generateCourseStructure → createDraftCourse
- Редактировать: listCourses → getCourseStructure → updateCourse / updateModule / updateLesson / addModuleToCourse / addLessonToModule
- Добавлять видео: addVideoToModule (courseId + moduleOrder + videoIndex)
- Обложки: setCourseCover (передавай courseTitle напрямую)

🛍️ **Магазин и витрина:**
- Просмотр товаров: products_list (search опционально), products_get
- Создание товаров: products_create (name, sku, price, description, brand, category)
- Редактирование: products_update (любые поля: описание, цену, бренд, изображение, публикацию)
- Управление ценами: products_update_price
- Категории: categories_list, categories_create

🌐 **Контент сайта:**
- contentList → contentUpdate. Ключи: hero_title, shop_subtitle, footer_phone, about_text и т.д.

🧠 **База знаний (RAG):**
- knowledge_search — ищи экспертную информацию о продуктах, процедурах, ингредиентах, уходе за кожей
- Не выдумывай факты — если не знаешь, поищи в базе знаний или честно скажи

📱 **Соцсети:**
- social_post_create — публикуй посты в Telegram-канал и/или VK (text, imageUrl?, platforms[])
- social_post_list — история опубликованных постов

🔬 **Диагностика кожи:**
- skin_analyze — анализ фото кожи через Vision AI + рекомендации продуктов из базы знаний

Правила:
- Пиши на русском
- Перед важным изменением (создание курса, публикация поста) — коротко покажи что сделаешь и спроси "ок?"
- Никогда не показывай сырой JSON, id, slug, технические дампы. Отвечай человеческим языком.
- При создании курса собирай информацию в естественном диалоге, не обязательно по одному вопросу за раз — адаптируйся к контексту.
- Если пользователь уже дал достаточно информации — не переспрашивай, переходи к действию.
- "ок", "да", "подтверждаю" — это подтверждение, действуй.
- Курсы создавай только как draft (published=false). Не публикуй.
- Удаление запрещено — инструментов удаления нет. Удалить можно вручную в редакторе.
- Не повторяй один и тот же текст — каждое сообщение должно двигать диалог вперёд.`
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    })
  }

  let body: {
    id?: string
    messages?: unknown[]
    videos?: VideoMeta[]
    images?: ImageMeta[]
    activeCourse?: ActiveCourseContext
  }
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  const chatId = typeof body.id === "string" ? body.id : null
  const messages = Array.isArray(body.messages) ? body.messages : []
  const videos: VideoMeta[] = Array.isArray(body.videos) ? body.videos : []
  const images: ImageMeta[] = Array.isArray(body.images) ? body.images : []
  const activeCourse =
    body.activeCourse &&
    typeof body.activeCourse.courseId === "string" &&
    typeof body.activeCourse.title === "string"
      ? {
          courseId: body.activeCourse.courseId,
          title: body.activeCourse.title,
          slug:
            typeof body.activeCourse.slug === "string" ? body.activeCourse.slug : undefined,
          editorUrl:
            typeof body.activeCourse.editorUrl === "string" ? body.activeCourse.editorUrl : undefined,
        }
      : null
  const userId = session.user.id

  if (messages.length === 0) {
    return new Response(JSON.stringify({ error: "No messages" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  const openclawUrl = process.env.OPENCLAW_GATEWAY_URL
  const openclawToken = process.env.OPENCLAW_GATEWAY_TOKEN

  const saveChat = async (
    id: string,
    updatedMessages: unknown[],
    options?: { activeCourse?: ActiveCourseContext | null; videos?: VideoMeta[]; images?: ImageMeta[] },
  ) => {
    try {
      const conv = await prisma.agentConversation.findFirst({
        where: { id, userId },
        select: { title: true },
      })
      if (!conv) return
      let title = conv.title
      if (title === "Новый чат") {
        const firstText = firstUserMessageText(updatedMessages)
        if (firstText) title = firstText
      }
      try {
        await prisma.agentConversation.update({
          where: { id },
          data: {
            messages: sanitizeMessagesForStorage(updatedMessages),
            title,
            activeCourse: options?.activeCourse
              ? JSON.parse(JSON.stringify(options.activeCourse))
              : Prisma.DbNull,
            attachments: JSON.parse(JSON.stringify({
              videos: Array.isArray(options?.videos) ? options.videos : [],
              images: Array.isArray(options?.images) ? options.images : [],
            })),
            updatedAt: new Date(),
          },
        })
      } catch (error) {
        if (!hasAgentStateFieldsError(error)) throw error
        // Fallback для старой Prisma-схемы без activeCourse/attachments:
        // хотя бы сохраняем сообщения и title.
        await prisma.agentConversation.update({
          where: { id },
          data: {
            messages: sanitizeMessagesForStorage(updatedMessages),
            title,
            updatedAt: new Date(),
          },
        })
      }
    } catch {
      // ignore save errors
    }
  }

  const streamOptions = {
    originalMessages: messages,
    onError: (err: unknown) => {
      console.error("[ai-chat] stream error:", err)
      if (err instanceof Error && err.message.includes("insufficient tool messages")) {
        return "Не удалось продолжить шаг с подтверждением. Нажмите «Создать» ещё раз или начните новый чат."
      }
      return "Произошла ошибка при обработке сообщения. Попробуйте ещё раз."
    },
    ...(chatId
      ? {
          onFinish: ({ messages: updatedMessages }: { messages: unknown[] }) => {
            saveChat(chatId, updatedMessages, { activeCourse, videos, images })
          },
        }
      : {}),
  }

  const systemPrompt = buildSystemPrompt(videos, images, activeCourse)
  const tools = createOpenClawTools(videos, images, userId)

  if (openclawUrl && openclawToken) {
    try {
      const healthy = await isOpenClawHealthy(openclawUrl, openclawToken)
      if (!healthy) {
        throw new Error("OpenClaw healthcheck failed")
      }

      const openclaw = createOpenAI({
        baseURL: `${openclawUrl.replace(/\/$/, "")}/v1`,
        apiKey: openclawToken,
        headers: { "x-openclaw-agent-id": "main" },
      })
      const modelSafeMessages = sanitizeMessagesForModel(messages, { keepToolParts: true }) as any
      const modelMessages = await convertToModelMessages(modelSafeMessages)
      const result = streamText({
        model: openclaw.chat("openclaw"),
        system: systemPrompt,
        messages: modelMessages,
        tools,
        maxSteps: 10,
      } as any)
      return result.toUIMessageStreamResponse(streamOptions as any)
    } catch (openclawErr) {
      console.warn("[ai-chat] OpenClaw недоступен, fallback на DeepSeek:", openclawErr)
    }
  }

  try {
    const modelSafeMessages = sanitizeMessagesForModel(messages) as any
    const modelMessages = await convertToModelMessages(modelSafeMessages)
    const result = streamText({
      model: deepseek("deepseek-chat"),
      system: systemPrompt,
      messages: modelMessages,
      tools,
      maxSteps: 10,
    } as any)
    return result.toUIMessageStreamResponse(streamOptions as any)
  } catch (err) {
    console.error("[ai-chat] error:", err)
    return new Response(
      JSON.stringify({
        error:
          err instanceof Error
            ? err.message
            : "Ошибка при запросе к агенту. Проверь DEEPSEEK_API_KEY в .env",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }
}
