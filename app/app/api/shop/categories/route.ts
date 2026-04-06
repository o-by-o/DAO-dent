import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/** GET /api/shop/categories — категории витрины (для авторизованных) */
export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const categories = await prisma.storeCategory.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
    include: {
      _count: { select: { products: true } },
      children: {
        orderBy: { order: "asc" },
        include: { _count: { select: { products: true } } },
      },
    },
  })

  return NextResponse.json({
    categories: categories
      .filter((c) => !c.parentId)
      .map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        order: c.order,
        productsCount: c._count.products + c.children.reduce((s, ch) => s + ch._count.products, 0),
        children: c.children.map((ch) => ({
          id: ch.id,
          name: ch.name,
          slug: ch.slug,
          productsCount: ch._count.products,
        })),
      })),
  })
}
