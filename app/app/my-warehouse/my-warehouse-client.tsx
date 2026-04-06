"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { ShoppingCart, PackagePlus, PackageMinus, ClipboardList } from "lucide-react"

const UNIT_LABELS: Record<string, string> = {
  PCS: "шт", PACK: "уп", ML: "мл", G: "г", L: "л", KG: "кг",
}

type Tab = "sale" | "receipt" | "writeoff" | "history"

interface Product { id: string; sku: string; name: string; unit: string }
interface StockProduct extends Product { stock: number }

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "sale", label: "Продажа", icon: ShoppingCart },
  { key: "receipt", label: "Приход", icon: PackagePlus },
  { key: "writeoff", label: "Списание", icon: PackageMinus },
  { key: "history", label: "История", icon: ClipboardList },
]

interface Props { allProducts: Product[]; inStockProducts: StockProduct[] }

export function MyWarehouseClient({ allProducts, inStockProducts }: Props) {
  const [tab, setTab] = useState<Tab>("sale")

  return (
    <DashboardLayout activePath="/my-warehouse">
      <h1 className="mb-1 text-2xl font-semibold">Мой склад</h1>
      <p className="mb-6 text-sm text-muted-foreground">Учёт косметики: продажи, приход, списание</p>

      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium boty-transition ${
              tab === t.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {(tab === "sale" || tab === "receipt" || tab === "writeoff") && (
        <OperationForm
          type={tab}
          products={tab === "receipt" ? allProducts : inStockProducts}
          showStock={tab !== "receipt"}
        />
      )}
      {tab === "history" && <OperationHistory />}
    </DashboardLayout>
  )
}

function OperationForm({ type, products, showStock }: { type: "sale" | "receipt" | "writeoff"; products: (Product | StockProduct)[]; showStock?: boolean }) {
  const [productId, setProductId] = useState("")
  const [quantity, setQuantity] = useState("1")
  const [comment, setComment] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  const labels = {
    sale: {
      title: "Продажа товара",
      hint: "Выберите товар из вашего склада. Отображаются только товары с остатком.",
      emptyHint: "На складе пока нет товаров. Сначала оформите приход.",
      btn: "Оформить продажу",
      docType: "WRITE_OFF",
    },
    receipt: {
      title: "Приход товара",
      hint: "Выберите товар из каталога DIB Academy для приёмки на ваш склад. Нужного товара нет? Закажите через «Заказ товаров».",
      emptyHint: "",
      btn: "Оформить приход",
      docType: "RECEIPT",
    },
    writeoff: {
      title: "Списание товара",
      hint: "Списание просроченных или повреждённых товаров. Отображаются только товары с остатком.",
      emptyHint: "На складе пока нет товаров.",
      btn: "Оформить списание",
      docType: "WRITE_OFF",
    },
  }[type]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!productId) return
    setSubmitting(true); setError(""); setSuccess(false)
    try {
      const res = await fetch("/api/my-warehouse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: labels.docType, productId, quantity: Number(quantity), comment: comment || undefined }),
      })
      if (res.ok) {
        setSuccess(true); setProductId(""); setQuantity("1"); setComment("")
        setTimeout(() => setSuccess(false), 3000)
      } else {
        const d = await res.json(); setError(d.error || "Ошибка")
      }
    } catch { setError("Ошибка сети") }
    finally { setSubmitting(false) }
  }

  const isEmpty = products.length === 0

  return (
    <div className="mx-auto max-w-lg">
      <h2 className="mb-1 text-lg font-semibold">{labels.title}</h2>
      <p className="mb-4 text-xs text-muted-foreground">{labels.hint}</p>

      {isEmpty ? (
        <div className="rounded-xl border border-border/50 bg-muted/30 px-6 py-8 text-center">
          <p className="text-sm text-muted-foreground">{labels.emptyHint}</p>
        </div>
      ) : (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Товар</label>
          <select value={productId} onChange={(e) => setProductId(e.target.value)} required className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none boty-transition focus:border-primary">
            <option value="">Выберите товар...</option>
            {products.map((p) => {
              const stock = showStock && "stock" in p ? ` [${p.stock} ${UNIT_LABELS[p.unit] || p.unit}]` : ""
              return <option key={p.id} value={p.id}>{p.name} ({p.sku}){stock}</option>
            })}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Количество</label>
          <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} required className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none boty-transition focus:border-primary" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Комментарий</label>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2} placeholder="Необязательно" className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none boty-transition focus:border-primary" />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {success && <p className="text-sm text-chart-3">Операция выполнена!</p>}
        <button type="submit" disabled={submitting} className="w-full rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground boty-transition hover:bg-primary/90 disabled:opacity-50">
          {submitting ? "Оформляем..." : labels.btn}
        </button>
      </form>
      )}
    </div>
  )
}

function OperationHistory() {
  const [docs, setDocs] = useState<Array<{ id: string; number: string; type: string; date: string; comment: string | null; items: Array<{ product: string; quantity: number; unit: string }> }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/my-warehouse")
      .then((r) => r.json())
      .then((data) => { setDocs(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const typeLabels: Record<string, string> = { RECEIPT: "Приход", WRITE_OFF: "Списание", TRANSFER: "Перемещение", INVENTORY: "Инвентаризация" }

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold">История операций</h2>
      {loading ? <p className="text-sm text-muted-foreground">Загрузка...</p> : docs.length > 0 ? (
        <div className="space-y-2">
          {docs.map((d) => (
            <div key={d.id} className="rounded-xl border border-border/50 bg-card p-4 shadow-[var(--shadow-card)]">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium">{d.number}</span>
                  <span className="ml-2 rounded bg-muted px-2 py-0.5 text-xs">{typeLabels[d.type] ?? d.type}</span>
                </div>
                <span className="text-xs text-muted-foreground">{new Date(d.date).toLocaleDateString("ru-RU")}</span>
              </div>
              {d.items.map((item, i) => (
                <p key={i} className="mt-1 text-sm text-muted-foreground">
                  {item.product} — {Math.abs(item.quantity)} {UNIT_LABELS[item.unit] || item.unit}
                </p>
              ))}
              {d.comment && <p className="mt-1 text-xs text-muted-foreground/70">{d.comment}</p>}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Операций пока нет</p>
      )}
    </div>
  )
}
