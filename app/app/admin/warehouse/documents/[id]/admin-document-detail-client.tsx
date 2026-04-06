"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { ArrowLeft, Plus, Trash2, Check } from "lucide-react"

const DOC_TYPE_LABELS: Record<string, string> = {
  RECEIPT: "Приход",
  WRITE_OFF: "Расход",
  TRANSFER: "Перемещение",
  INVENTORY: "Инвентаризация",
}

const UNIT_LABELS: Record<string, string> = {
  PCS: "шт",
  PACK: "уп",
  ML: "мл",
  G: "г",
  L: "л",
  KG: "кг",
}

interface MovementLine {
  id: string
  type: string
  productId: string
  product: { id: string; sku: string; name: string; unit: string }
  warehouseId: string
  warehouse: { id: string; name: string }
  batchId: string | null
  batch: { id: string; batchNumber: string | null; expiryDate: string | null } | null
  quantity: number
}

interface DocumentData {
  id: string
  type: string
  number: string
  documentDate: string
  status: string
  comment: string | null
  movements: MovementLine[]
}

interface ProductOption {
  id: string
  sku: string
  name: string
  unit: string
}

interface WarehouseOption {
  id: string
  name: string
}

interface Props {
  document: DocumentData
  products: ProductOption[]
  warehouses: WarehouseOption[]
}

export function AdminDocumentDetailClient({
  document: initial,
  products,
  warehouses,
}: Props) {
  const [document, setDocument] = useState(initial)
  const [addProductId, setAddProductId] = useState(products[0]?.id ?? "")
  const [addWarehouseId, setAddWarehouseId] = useState(warehouses[0]?.id ?? "")
  const [addQuantity, setAddQuantity] = useState("")
  const [loading, setLoading] = useState(false)
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState("")

  const movementType =
    document.type === "RECEIPT"
      ? "RECEIPT"
      : document.type === "WRITE_OFF"
        ? "SHIPMENT"
        : "TRANSFER"

  const handleAddLine = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      const qty = Number(addQuantity)
      if (!addProductId || !addWarehouseId || Number.isNaN(qty) || qty === 0) {
        setError("Укажите товар, склад и количество")
        return
      }
      setError("")
      setLoading(true)
      try {
        const quantity =
          document.type === "WRITE_OFF" ? -Math.abs(qty) : Math.abs(qty)
        const res = await fetch(
          `/api/admin/warehouse/documents/${document.id}/movements`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: movementType,
              productId: addProductId,
              warehouseId: addWarehouseId,
              quantity,
            }),
          }
        )
        const data = await res.json()
        if (!res.ok) {
          setError(data.error || "Ошибка добавления строки")
          return
        }
        setDocument((prev) => ({
          ...prev,
          movements: [
            ...prev.movements,
            {
              id: data.movement.id,
              type: data.movement.type,
              productId: data.movement.product.id,
              product: data.movement.product,
              warehouseId: data.movement.warehouse.id,
              warehouse: data.movement.warehouse,
              batchId: null,
              batch: null,
              quantity: data.movement.quantity,
            },
          ],
        }))
        setAddQuantity("")
      } finally {
        setLoading(false)
      }
    },
    [
      document.id,
      document.type,
      addProductId,
      addWarehouseId,
      addQuantity,
      movementType,
    ]
  )

  const handleDeleteLine = useCallback(
    async (movementId: string) => {
      if (!confirm("Удалить строку?")) return
      const res = await fetch(
        `/api/admin/warehouse/documents/${document.id}/movements/${movementId}`,
        { method: "DELETE" }
      )
      if (res.ok) {
        setDocument((prev) => ({
          ...prev,
          movements: prev.movements.filter((m) => m.id !== movementId),
        }))
      }
    },
    [document.id]
  )

  const handlePost = useCallback(async () => {
    if (!confirm("Провести документ? Остатки будут обновлены.")) return
    setPosting(true)
    setError("")
    try {
      const res = await fetch(
        `/api/admin/warehouse/documents/${document.id}/post`,
        { method: "POST" }
      )
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Ошибка проведения")
        return
      }
      setDocument((prev) => ({ ...prev, status: "POSTED" }))
    } finally {
      setPosting(false)
    }
  }, [document.id])

  const isDraft = document.status === "DRAFT"

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/warehouse"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          К складу
        </Link>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {DOC_TYPE_LABELS[document.type] ?? document.type} {document.number}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {new Date(document.documentDate).toLocaleDateString("ru-RU")} ·{" "}
              {document.status === "POSTED" ? "Проведён" : "Черновик"}
            </p>
          </div>
          {isDraft && (
            <button
              type="button"
              onClick={handlePost}
              disabled={posting || document.movements.length === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
              {posting ? "Проведение…" : "Провести"}
            </button>
          )}
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
            {error}
          </div>
        )}

        {isDraft && (
          <form
            onSubmit={handleAddLine}
            className="mt-6 flex flex-wrap items-end gap-3 rounded-lg border border-border bg-muted/20 p-4"
          >
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Товар
              </label>
              <select
                value={addProductId}
                onChange={(e) => setAddProductId(e.target.value)}
                className="min-w-[180px] rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.sku} — {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Склад
              </label>
              <select
                value={addWarehouseId}
                onChange={(e) => setAddWarehouseId(e.target.value)}
                className="min-w-[140px] rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Количество{" "}
                {document.type === "WRITE_OFF" ? "(списание, можно отрицательное)" : ""}
              </label>
              <input
                type="number"
                step="any"
                value={addQuantity}
                onChange={(e) => setAddQuantity(e.target.value)}
                placeholder="0"
                className="w-24 rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Добавить строку
            </button>
          </form>
        )}

        <div className="mt-6">
          <h2 className="mb-3 text-sm font-medium text-foreground">Строки движения</h2>
          {document.movements.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Нет строк. {isDraft && "Добавьте строки выше и нажмите «Провести»."}
            </p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-2 text-left font-medium">Товар</th>
                    <th className="px-4 py-2 text-left font-medium">Склад</th>
                    <th className="px-4 py-2 text-right font-medium">Количество</th>
                    {isDraft && (
                      <th className="px-4 py-2 text-right font-medium">Действия</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {document.movements.map((m) => (
                    <tr key={m.id} className="border-b border-border/60">
                      <td className="px-4 py-2">
                        <span className="font-mono text-muted-foreground">
                          {m.product.sku}
                        </span>{" "}
                        {m.product.name}
                      </td>
                      <td className="px-4 py-2">{m.warehouse.name}</td>
                      <td className="px-4 py-2 text-right font-medium">
                        {m.quantity > 0 ? "+" : ""}
                        {m.quantity} {UNIT_LABELS[m.product.unit] ?? m.product.unit}
                      </td>
                      {isDraft && (
                        <td className="px-4 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteLine(m.id)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
