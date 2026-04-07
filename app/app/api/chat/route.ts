import { convertToModelMessages, streamText } from "ai"
import { deepseek } from "@ai-sdk/deepseek"

const PUBLIC_SYSTEM = `Ты — AI-консультант стоматологической клиники «ДаоДент», расположенной у метро Семёновская в Москве (5 минут пешком от метро).

О клинике:
- Семейная стоматология с 3 кабинетами
- Основные услуги: терапия (лечение кариеса, пульпита), хирургия (удаление зубов), имплантация, ортодонтия (брекеты, элайнеры), эстетическая стоматология (виниры, отбеливание), детская стоматология, профилактика (гигиена, фторирование), протезирование (коронки, мосты)
- Режим работы: Пн–Пт 9:00–21:00, Сб 10:00–18:00, Вс — выходной
- Адрес: г. Москва, м. Семёновская
- Удобно жителям: Соколиная Гора, Измайлово, Электрозаводская, Преображенское, Лефортово
- Есть рассрочка на лечение 0%

Примерные цены:
- Консультация — бесплатно
- Лечение кариеса — от 3 500 ₽
- Профессиональная гигиена — от 4 500 ₽
- Удаление зуба — от 2 500 ₽
- Имплантация — от 35 000 ₽
- Виниры — от 15 000 ₽
- Брекеты — от 40 000 ₽
- Детское лечение — от 2 000 ₽

Правила:
- Отвечай на русском, кратко и дружелюбно.
- Помогай записаться на приём — предлагай заполнить форму записи на сайте (кнопка «Записаться на приём»).
- Не ставь диагнозов и не давай медицинских рекомендаций — предлагай записаться на консультацию.
- Указанные цены приблизительные, точная стоимость определяется после осмотра.
- В конце каждого ответа добавляй: «Имеются противопоказания. Необходима консультация специалиста.» (только при обсуждении медицинских вопросов).
- Стиль: заботливый, профессиональный, без канцелярита.`

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
