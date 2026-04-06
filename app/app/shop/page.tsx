export const dynamic = 'force-dynamic'

import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getSiteContent } from "@/lib/site-content"
import { ShopClient } from "./shop-client"

export default async function ShopPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const isAdmin = (session.user as { role?: string }).role === "ADMIN"

  const products = await prisma.product.findMany({
    where: isAdmin ? {} : { published: true },
    include: { category: { select: { id: true, name: true, slug: true } } },
    orderBy: [{ order: "asc" }, { name: "asc" }],
  })

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

  const rootCategories = categories.filter((c) => !c.parentId)
  const categoryTree = rootCategories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    productsCount: c._count.products + c.children.reduce((s, ch) => s + ch._count.products, 0),
    children: c.children.map((ch) => ({
      id: ch.id,
      name: ch.name,
      slug: ch.slug,
      productsCount: ch._count.products,
    })),
  }))

  const [shopTitle, shopSubtitle] = await Promise.all([
    getSiteContent("shop_title"),
    getSiteContent("shop_subtitle"),
  ])

  const shopProducts = products.map((p) => ({
    id: p.id,
    sku: p.sku,
    name: p.name,
    description: p.description,
    price: p.price ? Number(p.price) : null,
    imageUrl: p.imageUrl,
    slug: p.slug,
    unit: p.unit,
    brand: p.brand,
    category: p.category,
    published: p.published,
  }))

  return (
    <ShopClient
      products={shopProducts}
      categories={categoryTree}
      isAdmin={isAdmin}
      shopTitle={shopTitle || "Магазин"}
      shopSubtitle={shopSubtitle || "Профессиональная корейская косметика"}
    />
  )
}
