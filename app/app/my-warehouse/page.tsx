import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { MyWarehouseClient } from "./my-warehouse-client"

export default async function MyWarehousePage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  // All products — for receipt (приход)
  const allProducts = await prisma.product.findMany({
    orderBy: { name: "asc" },
    select: { id: true, sku: true, name: true, unit: true },
  })

  // Products with stock > 0 — for sale/write-off
  const stocks = await prisma.stock.findMany({
    where: { quantity: { gt: 0 } },
    select: { productId: true, quantity: true },
  })
  const stockMap = new Map<string, number>()
  for (const s of stocks) {
    const prev = stockMap.get(s.productId) ?? 0
    stockMap.set(s.productId, prev + Number(s.quantity))
  }

  const inStockProducts = allProducts
    .filter((p) => stockMap.has(p.id))
    .map((p) => ({ ...p, stock: stockMap.get(p.id)! }))

  return (
    <MyWarehouseClient
      allProducts={allProducts.map((p) => ({ id: p.id, sku: p.sku, name: p.name, unit: p.unit }))}
      inStockProducts={inStockProducts.map((p) => ({ id: p.id, sku: p.sku, name: p.name, unit: p.unit, stock: p.stock }))}
    />
  )
}
