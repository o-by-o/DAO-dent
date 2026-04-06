import { notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { AdminDocumentDetailClient } from "./admin-document-detail-client"

export default async function AdminWarehouseDocumentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    notFound()
  }

  const { id } = await params
  const [doc, products, warehouses] = await Promise.all([
    prisma.stockDocument.findUnique({
      where: { id },
      include: {
        movements: {
          include: {
            product: { select: { id: true, sku: true, name: true, unit: true } },
            warehouse: { select: { id: true, name: true } },
            batch: { select: { id: true, batchNumber: true, expiryDate: true } },
          },
        },
      },
    }),
    prisma.product.findMany({
      orderBy: { name: "asc" },
      select: { id: true, sku: true, name: true, unit: true },
    }),
    prisma.warehouse.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ])

  if (!doc) notFound()

  const document = {
    id: doc.id,
    type: doc.type,
    number: doc.number,
    documentDate: doc.documentDate.toISOString(),
    status: doc.status,
    comment: doc.comment,
    movements: doc.movements.map((m) => ({
      id: m.id,
      type: m.type,
      productId: m.productId,
      product: m.product,
      warehouseId: m.warehouseId,
      warehouse: m.warehouse,
      batchId: m.batchId,
      batch: m.batch
        ? {
            id: m.batch.id,
            batchNumber: m.batch.batchNumber,
            expiryDate: m.batch.expiryDate?.toISOString() ?? null,
          }
        : null,
      quantity: Number(m.quantity),
    })),
  }

  const productsList = products.map((p) => ({ id: p.id, sku: p.sku, name: p.name, unit: p.unit }))
  const warehousesList = warehouses.map((w) => ({ id: w.id, name: w.name }))

  return (
    <AdminDocumentDetailClient
      document={document}
      products={productsList}
      warehouses={warehousesList}
    />
  )
}
