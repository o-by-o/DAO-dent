import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/** GET /api/shop/products — товары витрины (published, для авторизованных) */
export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const products = await prisma.product.findMany({
    where: { published: true },
    include: { category: { select: { id: true, name: true, slug: true } } },
    orderBy: [{ order: "asc" }, { name: "asc" }],
  })

  return NextResponse.json({
    products: products.map((p) => ({
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
    })),
  })
}
