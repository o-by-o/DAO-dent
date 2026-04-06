import { auth } from "@/lib/auth"
import { createOrder } from "@/lib/orders"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { items, phone, comment } = body as {
    items: Array<{ productId: string; quantity: number; unitPrice: number }>
    phone?: string
    comment?: string
  }

  if (!items || items.length === 0) {
    return NextResponse.json({ error: "Корзина пуста" }, { status: 400 })
  }

  try {
    const order = await createOrder({
      userId: session.user.id,
      type: "PRODUCT",
      items: items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
      note: [phone && `Тел: ${phone}`, comment].filter(Boolean).join(". ") || undefined,
    })

    return NextResponse.json({ ok: true, orderId: order.id, orderNumber: order.orderNumber })
  } catch (e) {
    console.error("shop/order error:", e)
    return NextResponse.json({ error: "Ошибка создания заказа" }, { status: 500 })
  }
}
