import { prisma } from "@/lib/prisma"
import { AdminWarehouseClient } from "./admin-warehouse-client"

export default async function AdminWarehousePage() {
  const products = await prisma.product.findMany({
    orderBy: { name: "asc" },
    select: { id: true, sku: true, name: true, unit: true },
  })

  return (
    <AdminWarehouseClient
      initialProducts={products.map((p) => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        unit: p.unit,
      }))}
    />
  )
}
