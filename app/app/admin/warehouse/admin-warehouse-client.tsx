"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import {
  ShoppingCart,
  PackagePlus,
  PackageMinus,
  ClipboardList,
  FolderTree,
  Plus,
  Trash2,
  Search,
} from "lucide-react"

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Product {
  id: string
  sku: string
  name: string
  unit: string
}

interface Category {
  id: string
  name: string
  slug: string
}

interface ClientOption {
  id: string
  name: string
  phone: string | null
}

type Tab = "sale" | "receipt" | "writeoff" | "inventory" | "categories"

const UNIT_LABELS: Record<string, string> = {
  PCS: "шт", PACK: "уп", ML: "мл", G: "г", L: "л", KG: "кг",
}

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "sale", label: "Продажа", icon: ShoppingCart },
  { key: "receipt", label: "Приход", icon: PackagePlus },
  { key: "writeoff", label: "Списание", icon: PackageMinus },
  { key: "inventory", label: "Инвентаризация", icon: ClipboardList },
  { key: "categories", label: "Категории", icon: FolderTree },
]

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface Props {
  initialProducts: Product[]
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export function AdminWarehouseClient({ initialProducts }: Props) {
  const [tab, setTab] = useState<Tab>("sale")
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [categories, setCategories] = useState<Category[]>([])
  const [clients, setClients] = useState<ClientOption[]>([])

  // Fetch helpers
  const fetchProducts = useCallback(async () => {
    const res = await fetch("/api/admin/warehouse/products")
    if (res.ok) setProducts(await res.json())
  }, [])

  const fetchCategories = useCallback(async () => {
    const res = await fetch("/api/shop/categories")
    if (res.ok) {
      const data = await res.json()
      setCategories(data.map((c: { id: string; name: string; slug: string }) => ({
        id: c.id, name: c.name, slug: c.slug,
      })))
    }
  }, [])

  const fetchClients = useCallback(async () => {
    const res = await fetch("/api/admin/clients")
    if (res.ok) {
      const data = await res.json()
      setClients(data.map((c: { id: string; name: string; phone?: string }) => ({
        id: c.id, name: c.name, phone: c.phone ?? null,
      })))
    }
  }, [])

  useEffect(() => {
    fetchCategories()
    fetchClients()
  }, [fetchCategories, fetchClients])

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold">Складские операции</h1>
      <p className="mb-6 text-sm text-muted-foreground">Продажа, приход, списание и инвентаризация товара</p>

      {/* Tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium boty-transition ${
              tab === t.key
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "sale" && (
        <MovementForm
          type="sale"
          products={products}
          clients={clients}
          onSuccess={fetchProducts}
        />
      )}
      {tab === "receipt" && (
        <MovementForm
          type="receipt"
          products={products}
          onSuccess={fetchProducts}
        />
      )}
      {tab === "writeoff" && (
        <MovementForm
          type="writeoff"
          products={products}
          onSuccess={fetchProducts}
        />
      )}
      {tab === "inventory" && (
        <InventoryView products={products} onRefresh={fetchProducts} />
      )}
      {tab === "categories" && (
        <CategoriesView categories={categories} onRefresh={fetchCategories} />
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Movement Form (Sale / Receipt / Write-off)                         */
/* ------------------------------------------------------------------ */

function MovementForm({
  type,
  products,
  clients,
  onSuccess,
}: {
  type: "sale" | "receipt" | "writeoff"
  products: Product[]
  clients?: ClientOption[]
  onSuccess: () => void
}) {
  const [productId, setProductId] = useState("")
  const [quantity, setQuantity] = useState("1")
  const [clientId, setClientId] = useState("")
  const [clientSearch, setClientSearch] = useState("")
  const [comment, setComment] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  const filteredClients = useMemo(() => {
    if (!clients) return []
    if (!clientSearch.trim()) return clients.slice(0, 20)
    const q = clientSearch.toLowerCase()
    return clients.filter(
      (c) => c.name.toLowerCase().includes(q) || c.phone?.includes(q),
    )
  }, [clients, clientSearch])

  const labels = {
    sale: { title: "Продажа товара", btn: "Оформить продажу", docType: "WRITE_OFF" as const },
    receipt: { title: "Приход товара", btn: "Оформить приход", docType: "RECEIPT" as const },
    writeoff: { title: "Списание товара", btn: "Оформить списание", docType: "WRITE_OFF" as const },
  }[type]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!productId || !quantity) return

    setSubmitting(true)
    setError("")
    setSuccess(false)

    try {
      const res = await fetch("/api/admin/warehouse/quick-operation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: labels.docType,
          productId,
          quantity: Number(quantity),
          clientId: clientId || undefined,
          comment: comment || undefined,
        }),
      })

      if (res.ok) {
        setSuccess(true)
        setProductId("")
        setQuantity("1")
        setClientId("")
        setClientSearch("")
        setComment("")
        onSuccess()
        setTimeout(() => setSuccess(false), 3000)
      } else {
        const data = await res.json()
        setError(data.error || "Ошибка")
      }
    } catch {
      setError("Ошибка сети")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <h2 className="mb-4 text-lg font-semibold">{labels.title}</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Client (only for sales) */}
        {type === "sale" && clients && (
          <div>
            <label className="mb-1 block text-sm font-medium">Клиент</label>
            <input
              type="text"
              value={clientSearch}
              onChange={(e) => {
                setClientSearch(e.target.value)
                setClientId("")
              }}
              placeholder="Начните вводить имя или телефон..."
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none boty-transition focus:border-primary"
            />
            {clientSearch && !clientId && filteredClients.length > 0 && (
              <div className="mt-1 max-h-40 overflow-y-auto rounded-lg border border-border bg-card shadow-lg">
                {filteredClients.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setClientId(c.id)
                      setClientSearch(c.name)
                    }}
                    className="flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-muted"
                  >
                    <span>{c.name}</span>
                    {c.phone && <span className="text-xs text-muted-foreground">{c.phone}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Product */}
        <div>
          <label className="mb-1 block text-sm font-medium">Товар</label>
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            required
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none boty-transition focus:border-primary"
          >
            <option value="">Выберите товар...</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.sku}) — {UNIT_LABELS[p.unit] || p.unit}
              </option>
            ))}
          </select>
        </div>

        {/* Quantity */}
        <div>
          <label className="mb-1 block text-sm font-medium">Количество</label>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none boty-transition focus:border-primary"
          />
        </div>

        {/* Comment */}
        <div>
          <label className="mb-1 block text-sm font-medium">Комментарий</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            placeholder="Необязательно"
            className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none boty-transition focus:border-primary"
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {success && <p className="text-sm text-chart-3">Операция выполнена!</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground boty-transition hover:bg-primary/90 disabled:opacity-50"
        >
          {submitting ? "Оформляем..." : labels.btn}
        </button>
      </form>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Inventory View                                                     */
/* ------------------------------------------------------------------ */

function InventoryView({
  products,
  onRefresh,
}: {
  products: Product[]
  onRefresh: () => void
}) {
  const [stock, setStock] = useState<
    Array<{ productId: string; productName: string; sku: string; quantity: number; unit: string }>
  >([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/warehouse/stock")
      .then((r) => r.json())
      .then((data) => {
        const items = (data.stock || data || []).map((s: Record<string, unknown>) => ({
          productId: (s.product as { id: string })?.id ?? s.productId,
          productName: (s.product as { name: string })?.name ?? "",
          sku: (s.product as { sku: string })?.sku ?? "",
          quantity: Number(s.quantity ?? 0),
          unit: (s.product as { unit: string })?.unit ?? "PCS",
        }))
        // Group by product (sum quantities across warehouses)
        const grouped = new Map<string, typeof items[number]>()
        for (const item of items) {
          const existing = grouped.get(item.productId)
          if (existing) {
            existing.quantity += item.quantity
          } else {
            grouped.set(item.productId, { ...item })
          }
        }
        setStock(Array.from(grouped.values()))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    if (!search.trim()) return stock
    const q = search.toLowerCase()
    return stock.filter(
      (s) => s.productName.toLowerCase().includes(q) || s.sku.toLowerCase().includes(q),
    )
  }, [stock, search])

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <h2 className="text-lg font-semibold">Инвентаризация</h2>
        <button
          onClick={() => {
            setLoading(true)
            fetch("/api/admin/warehouse/stock")
              .then((r) => r.json())
              .then((data) => { setStock(data); setLoading(false); onRefresh() })
          }}
          className="text-sm text-primary boty-transition hover:text-primary/80"
        >
          Обновить
        </button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по названию или артикулу..."
          className="w-full rounded-lg border border-border bg-background py-2 pl-10 pr-3 text-sm outline-none boty-transition focus:border-primary"
        />
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Загрузка...</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border/50">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30">
                <th className="px-4 py-3 text-left font-medium">Товар</th>
                <th className="px-4 py-3 text-left font-medium">Артикул</th>
                <th className="px-4 py-3 text-right font-medium">Остаток</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((s) => (
                  <tr key={s.productId} className="border-b border-border/30 last:border-0">
                    <td className="px-4 py-3">{s.productName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.sku}</td>
                    <td className="px-4 py-3 text-right font-medium">
                      {Number(s.quantity)} {UNIT_LABELS[s.unit] || s.unit}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                    {search ? "Ничего не найдено" : "Нет товаров на складе"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Categories View                                                    */
/* ------------------------------------------------------------------ */

function CategoriesView({
  categories,
  onRefresh,
}: {
  categories: Category[]
  onRefresh: () => void
}) {
  const [name, setName] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSubmitting(true)
    const slug = name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-zа-яё0-9-]/gi, "")
    await fetch("/api/admin/warehouse/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), slug }),
    })
    setName("")
    setSubmitting(false)
    onRefresh()
  }

  return (
    <div className="mx-auto max-w-lg">
      <h2 className="mb-4 text-lg font-semibold">Категории товаров</h2>

      <form onSubmit={handleCreate} className="mb-6 flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Название категории"
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none boty-transition focus:border-primary"
        />
        <button
          type="submit"
          disabled={submitting || !name.trim()}
          className="inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground boty-transition hover:bg-primary/90 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Добавить
        </button>
      </form>

      <div className="space-y-2">
        {categories.map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-between rounded-xl border border-border/50 bg-card px-4 py-3 shadow-[var(--shadow-card)]"
          >
            <span className="text-sm font-medium">{c.name}</span>
            <button
              onClick={async () => {
                await fetch(`/api/admin/warehouse/categories?id=${c.id}`, { method: "DELETE" })
                onRefresh()
              }}
              className="text-muted-foreground boty-transition hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        {categories.length === 0 && (
          <p className="text-sm text-muted-foreground">Нет категорий</p>
        )}
      </div>
    </div>
  )
}
