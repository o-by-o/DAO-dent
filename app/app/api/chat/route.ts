import { convertToModelMessages, streamText } from "ai"
import { deepseek } from "@ai-sdk/deepseek"

const PUBLIC_SYSTEM = `Ты — дружелюбный AI-консультант DIB Academy / DIB-INTERFARM (онлайн-школа косметологов, магазин профессиональной косметики, курсы, AI-диагностика кожи).

Правила:
- Отвечай на русском, кратко и по делу.
- Помогай с навигацией: магазин /shop, каталог курсов /catalog, диагностика /diagnostics, вход /login, личный кабинет /home.
- Не выдумывай точные цены и наличие — предложи открыть каталог или зарегистрироваться.
- Не обещай медицинских диагнозов; для серьёзных проблем кожи советуй очный приём к врачу.
- Стиль: тёплый, профессиональный, без канцелярита.`

export async function POST(req: Request) {
  if (!process.env.DEEPSEEK_API_KEY) {
    return new Response(
      JSON.stringify({
        error: "Чат временно недоступен. Задайте DEEPSEEK_API_KEY в настройках сервера.",
      }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    )
  }

  let body: { messages?: unknown[] }
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: "Некорректный запрос" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  const messages = Array.isArray(body.messages) ? body.messages : []
  if (messages.length === 0) {
    return new Response(JSON.stringify({ error: "Пустое сообщение" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  try {
    const modelMessages = await convertToModelMessages(messages as never)
    const result = streamText({
      model: deepseek("deepseek-chat"),
      system: PUBLIC_SYSTEM,
      messages: modelMessages,
    })
    return result.toUIMessageStreamResponse({
      onError: (err: unknown) => {
        console.error("[api/chat]", err)
        return "Не удалось получить ответ. Попробуйте ещё раз."
      },
    })
  } catch (err) {
    console.error("[api/chat]", err)
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Ошибка при обращении к модели",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }
}
