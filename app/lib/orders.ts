import { prisma } from "@/lib/prisma"
import type { OrderType, OrderStatus } from "@prisma/client"

// ============================================
// Генерация номера заказа: DIB-YYYYMMDD-NNN
// ============================================

export async function generateOrderNumber(): Promise<string> {
  const today = new Date()
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "")
  const prefix = `DIB-${dateStr}-`

  const lastOrder = await prisma.order.findFirst({
    where: { orderNumber: { startsWith: prefix } },
    orderBy: { orderNumber: "desc" },
    select: { orderNumber: true },
  })

  let seq = 1
  if (lastOrder) {
    const lastSeq = parseInt(lastOrder.orderNumber.slice(prefix.length), 10)
    if (!isNaN(lastSeq)) seq = lastSeq + 1
  }

  return `${prefix}${String(seq).padStart(3, "0")}`
}

// ============================================
// Создание заказа
// ============================================

type CreateOrderItem = {
  productId?: string
  courseId?: string
  quantity?: number
  unitPrice: number
}

export async function createOrder(params: {
  userId: string
  type: OrderType
  items: CreateOrderItem[]
  status?: OrderStatus
  paymentId?: string
  note?: string
}) {
  const { userId, type, items, status = "PAID", paymentId, note } = params

  const orderNumber = await generateOrderNumber()

  const totalAmount = items.reduce((sum, item) => {
    return sum + item.unitPrice * (item.quantity ?? 1)
  }, 0)

  return prisma.order.create({
    data: {
      userId,
      orderNumber,
      type,
      status,
      totalAmount,
      paymentId: paymentId ?? null,
      note: note ?? null,
      items: {
        create: items.map((item) => ({
          productId: item.productId ?? null,
          courseId: item.courseId ?? null,
          quantity: item.quantity ?? 1,
          unitPrice: item.unitPrice,
          totalPrice: item.unitPrice * (item.quantity ?? 1),
        })),
      },
    },
    include: { items: true },
  })
}

// ============================================
// Запросы
// ============================================

export async function getOrdersByUser(userId: string, limit = 10) {
  return prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      items: {
        include: {
          product: { select: { name: true, imageUrl: true } },
          course: { select: { title: true, thumbnailUrl: true } },
        },
      },
    },
  })
}

export async function getRecentOrders(limit = 10) {
  return prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      user: { select: { name: true, email: true } },
      items: {
        include: {
          product: { select: { name: true } },
          course: { select: { title: true } },
        },
      },
    },
  })
}

export async function getRevenueStats(periodDays = 30) {
  const since = new Date()
  since.setDate(since.getDate() - periodDays)

  const [orders, totalRevenue] = await Promise.all([
    prisma.order.count({
      where: { status: "PAID", createdAt: { gte: since } },
    }),
    prisma.order.aggregate({
      where: { status: "PAID", createdAt: { gte: since } },
      _sum: { totalAmount: true },
    }),
  ])

  return {
    orderCount: orders,
    revenue: Number(totalRevenue._sum.totalAmount ?? 0),
  }
}
