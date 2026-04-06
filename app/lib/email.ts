import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2"

interface SendEmailArgs {
  to: string
  subject: string
  html: string
  text: string
}

interface SendEmailResult {
  sent: boolean
  reason?: string
}

function getPostboxClient(): SESv2Client | null {
  const accessKeyId = process.env.POSTBOX_ACCESS_KEY_ID
  const secretAccessKey = process.env.POSTBOX_SECRET_ACCESS_KEY

  if (!accessKeyId || !secretAccessKey) {
    return null
  }

  return new SESv2Client({
    region: "ru-central1",
    endpoint: "https://postbox.cloud.yandex.net",
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  })
}

async function sendViaPostbox({
  to,
  subject,
  html,
  text,
}: SendEmailArgs): Promise<SendEmailResult> {
  const from = process.env.EMAIL_FROM

  if (!from) {
    return {
      sent: false,
      reason: "EMAIL_FROM не настроен",
    }
  }

  const client = getPostboxClient()
  if (!client) {
    return {
      sent: false,
      reason: "POSTBOX_ACCESS_KEY_ID или POSTBOX_SECRET_ACCESS_KEY не настроены",
    }
  }

  try {
    const command = new SendEmailCommand({
      FromEmailAddress: from,
      Destination: {
        ToAddresses: [to],
      },
      Content: {
        Simple: {
          Subject: {
            Data: subject,
            Charset: "UTF-8",
          },
          Body: {
            Html: {
              Data: html,
              Charset: "UTF-8",
            },
            Text: {
              Data: text,
              Charset: "UTF-8",
            },
          },
        },
      },
    })

    const result = await client.send(command)
    console.log(`[Postbox] Email sent to ${to}, MessageId: ${result.MessageId}`)
    return { sent: true }
  } catch (error) {
    const message = (error as Error).message || "Не удалось отправить email"
    console.error(`[Postbox] Error sending to ${to}:`, message)
    return {
      sent: false,
      reason: message,
    }
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function buildLoginUrl(): string {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3001"
  return `${baseUrl.replace(/\/$/, "")}/login`
}

export async function sendAccessGrantedEmail(args: {
  to: string
  name?: string | null
  temporaryPassword?: string | null
  courseTitles: string[]
}) {
  const userName = escapeHtml(args.name || "студент")
  const loginUrl = buildLoginUrl()
  const coursesText = escapeHtml(args.courseTitles.join(", "))
  const safeEmail = escapeHtml(args.to)

  const credentialsBlock = args.temporaryPassword
    ? `<p><strong>Логин:</strong> ${safeEmail}<br/><strong>Пароль:</strong> ${escapeHtml(args.temporaryPassword)}</p>`
    : `<p><strong>Логин:</strong> ${safeEmail}<br/>Используйте ваш текущий пароль.</p>`

  const html = `
    <h2>Доступ к курсам DIB Academy открыт</h2>
    <p>Здравствуйте, ${userName}.</p>
    <p>Вам предоставлен доступ к курсам: ${coursesText}.</p>
    ${credentialsBlock}
    <p><a href="${escapeHtml(loginUrl)}">Войти в личный кабинет</a></p>
  `.trim()

  const text = [
    "Доступ к курсам DIB Academy открыт.",
    `Здравствуйте, ${userName}.`,
    `Курсы: ${coursesText}.`,
    `Логин: ${args.to}.`,
    args.temporaryPassword
      ? `Пароль: ${args.temporaryPassword}.`
      : "Используйте ваш текущий пароль.",
    `Войти: ${loginUrl}`,
  ].join("\n")

  return sendViaPostbox({
    to: args.to,
    subject: "DIB Academy: доступ к курсам открыт",
    html,
    text,
  })
}

export async function sendPasswordResetEmail(args: {
  to: string
  name?: string | null
  resetUrl: string
}) {
  const userName = escapeHtml(args.name || "студент")
  const safeResetUrl = escapeHtml(args.resetUrl)
  const html = `
    <h2>Сброс пароля DIB Academy</h2>
    <p>Здравствуйте, ${userName}.</p>
    <p>Чтобы установить новый пароль, перейдите по ссылке:</p>
    <p><a href="${safeResetUrl}">${safeResetUrl}</a></p>
    <p>Ссылка действительна 60 минут.</p>
  `.trim()

  const text = [
    "Сброс пароля DIB Academy.",
    `Здравствуйте, ${userName}.`,
    "Чтобы установить новый пароль, перейдите по ссылке:",
    args.resetUrl,
    "Ссылка действительна 60 минут.",
  ].join("\n")

  return sendViaPostbox({
    to: args.to,
    subject: "DIB Academy: сброс пароля",
    html,
    text,
  })
}
