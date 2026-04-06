/**
 * Telegram Bot API — постинг в канал
 */

export interface TelegramPostResult {
  ok: boolean
  messageId?: number
  error?: string
}

function escapeTelegramHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

export async function postToTelegram(
  text: string,
  imageUrl?: string,
): Promise<TelegramPostResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const channelId = process.env.TELEGRAM_CHANNEL_ID

  if (!token || !channelId) {
    return { ok: false, error: "TELEGRAM_BOT_TOKEN или TELEGRAM_CHANNEL_ID не настроены" }
  }

  const escapedText = escapeTelegramHtml(text)
  const method = imageUrl ? "sendPhoto" : "sendMessage"
  const body = imageUrl
    ? { chat_id: channelId, photo: imageUrl, caption: escapedText, parse_mode: "HTML" }
    : { chat_id: channelId, text: escapedText, parse_mode: "HTML" }

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${token}/${method}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    )

    const data = await res.json()

    return {
      ok: data.ok === true,
      messageId: data.result?.message_id,
      error: data.ok ? undefined : data.description,
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Ошибка сети" }
  }
}
