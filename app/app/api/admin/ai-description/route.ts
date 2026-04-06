import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

/** POST /api/admin/ai-description — генерация описания курса с помощью ИИ */
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json()
  const { title, modules, type, customPrompt } = body as {
    title: string
    modules?: string[]
    type: "course" | "lesson" | "module"
    customPrompt?: string
  }

  if (!title?.trim()) {
    return NextResponse.json({ error: "Укажите название" }, { status: 400 })
  }

  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) {
    // Fallback: генерация шаблонного описания без ИИ
    return NextResponse.json({
      description: generateFallbackDescription(title, modules, type),
      source: "template",
    })
  }

  try {
    const prompt = customPrompt?.trim()
      ? `${customPrompt.trim()}\n\nКонтекст: название — "${title}"${modules && modules.length > 0 ? `, разделы: ${modules.join(", ")}` : ""}, тип: ${type}.`
      : buildPrompt(title, modules, type)

    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: `Ты — профессиональный копирайтер для онлайн-школы косметологии "DIB Academy". 
Пиши на русском языке. Стиль — профессиональный, но доступный. 
Целевая аудитория — начинающие и практикующие косметологи.
Не используй эмодзи. Ответ должен быть только текстом описания, без заголовков и форматирования markdown.`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      console.error("DeepSeek API error:", errorData)
      // Fallback to template
      return NextResponse.json({
        description: generateFallbackDescription(title, modules, type),
        source: "template",
      })
    }

    const data = await response.json()
    const description = data.choices?.[0]?.message?.content?.trim()

    if (!description) {
      return NextResponse.json({
        description: generateFallbackDescription(title, modules, type),
        source: "template",
      })
    }

    return NextResponse.json({ description, source: "ai" })
  } catch (error) {
    console.error("DeepSeek description generation error:", error)
    return NextResponse.json({
      description: generateFallbackDescription(title, modules, type),
      source: "template",
    })
  }
}

function buildPrompt(title: string, modules?: string[], type?: string): string {
  if (type === "lesson") {
    return `Напиши краткое описание для урока "${title}" в курсе по косметологии. Описание должно быть 1-2 предложения, объясняющих что студент изучит в этом уроке.`
  }

  if (type === "module") {
    return `Напиши краткое описание для раздела "${title}" в курсе по косметологии. Описание должно быть 1-2 предложения.`
  }

  let prompt = `Напиши привлекательное описание для онлайн-курса по косметологии "${title}".`
  prompt += ` Описание должно быть 2-4 предложения, раскрывающих ценность курса для студента.`
  prompt += ` Упомяни, какие навыки получит студент и почему этот курс стоит пройти.`

  if (modules && modules.length > 0) {
    prompt += ` Курс включает следующие разделы: ${modules.join(", ")}.`
  }

  return prompt
}

function generateFallbackDescription(
  title: string,
  modules?: string[],
  type?: string,
): string {
  if (type === "lesson") {
    return `В этом уроке вы изучите ключевые аспекты темы "${title}". Материал включает теоретическую базу и практические рекомендации.`
  }

  if (type === "module") {
    return `Раздел "${title}" охватывает важные аспекты данной темы. Вы получите теоретические знания и практические навыки.`
  }

  let desc = `Курс "${title}" разработан для косметологов, желающих углубить свои знания и навыки в данной области.`
  desc += ` Вы получите актуальные знания от практикующих специалистов и сможете применить их в своей работе.`

  if (modules && modules.length > 0) {
    desc += ` Программа включает ${modules.length} разделов: ${modules.join(", ")}.`
  }

  return desc
}
