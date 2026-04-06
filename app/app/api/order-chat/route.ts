import { convertToModelMessages, streamText, tool } from "ai"
import { deepseek } from "@ai-sdk/deepseek"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createOrder } from "@/lib/orders"

const SYSTEM_PROMPT = `Ты — ассистент по заказу косметики для косметологов DIB Academy.

Твоя единственная задача — помочь косметологу заказать товары для своего склада.

Правила:
- Отвечай на русском, кратко и дружелюбно.
- Спроси какие товары нужны, помоги найти в каталоге.
- Покажи цены и наличие.
- Подтверди заказ перед оформлением.
- Не обсуждай темы вне заказа косметики.
- Формат: перечисляй товары списком с ценами.
- Когда клиент подтвердил — оформи заказ через инструмент.`

function createOrderTools(userId: string) {
  return {
    search_products: tool({
      description: "Поиск товаров в каталоге по названию, бренду или категории.",
      inputSchema: z.object({
        query: z.string().describe("Поисковый запрос"),
        limit: z.number().optional().describe("Количество результатов"),
      }),
      execute: async ({ query, limit: lim }: { query: string; limit?: number }) => {
        const take = lim ?? 10
        const products = await prisma.product.findMany({
          where: {
            published: true,
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { brand: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } },
              { sku: { contains: query, mode: "insensitive" } },
            ],
          },
          take,
          select: { id: true, name: true, sku: true, price: true, brand: true, unit: true },
          orderBy: { name: "asc" },
        })
        if (products.length === 0) return "Товары не найдены. Попробуйте другой запрос."
        return JSON.stringify(
          products.map((p) => ({
            id: p.id, name: p.name, sku: p.sku,
            price: p.price ? `${Number(p.price)} ₽` : "цена не указана",
            brand: p.brand, unit: p.unit,
          })), null, 2,
        )
      },
    }),

    list_categories: tool({
      description: "Список всех категорий товаров",
      inputSchema: z.object({}),
      execute: async () => {
        const cats = await prisma.storeCategory.findMany({
          select: { id: true, name: true },
          orderBy: { order: "asc" },
        })
        return JSON.stringify(cats, null, 2)
      },
    }),

    create_order: tool({
      description: "Создать заказ. Используй ТОЛЬКО после подтверждения клиентом.",
      inputSchema: z.object({
        items: z.array(z.object({
          productId: z.string(),
          quantity: z.number().positive(),
          unitPrice: z.number(),
        })),
        comment: z.string().optional(),
      }),
      execute: async ({ items, comment }: { items: Array<{ productId: string; quantity: number; unitPrice: number }>; comment?: string }) => {
        const order = await createOrder({
          userId,
          type: "PRODUCT",
          items,
          status: "PENDING",
          note: comment,
        })
        return JSON.stringify({
          success: true,
          orderNumber: order.orderNumber,
          totalAmount: Number(order.totalAmount),
          message: `Заказ ${order.orderNumber} создан! Сумма: ${Number(order.totalAmount).toLocaleString("ru-RU")} ₽`,
        })
      },
    }),
  }
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
  }

  if (!process.env.DEEPSEEK_API_KEY) {
    return new Response(JSON.stringify({ error: "Чат временно недоступен" }), { status: 503 })
  }

  const body = await req.json()
  const messages = Array.isArray(body.messages) ? body.messages : []
  if (messages.length === 0) {
    return new Response(JSON.stringify({ error: "Пустое сообщение" }), { status: 400 })
  }

  try {
    const modelMessages = await convertToModelMessages(messages as never)
    const result = streamText({
      model: deepseek("deepseek-chat"),
      system: SYSTEM_PROMPT,
      messages: modelMessages,
      tools: createOrderTools(session.user.id),
    })

    return result.toUIMessageStreamResponse({
      onError: (err: unknown) => {
        console.error("[order-chat]", err)
        return "Не удалось получить ответ. Попробуйте ещё раз."
      },
    })
  } catch (err) {
    console.error("[order-chat]", err)
    return new Response(
      JSON.stringify({ error: "Ошибка при обращении к модели" }),
      { status: 500 },
    )
  }
}
