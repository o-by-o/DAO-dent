"use client"

import { useState, useMemo } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Search, ShoppingCart, Package, Check } from "lucide-react"
import { useCart } from "@/lib/cart"

interface ShopProduct {
  id: string
  sku: string
  name: string
  description: string | null
  price: number | null
  imageUrl: string | null
  slug: string | null
  unit: string
  brand: string | null
  category: { id: string; name: string; slug: string } | null
  published?: boolean
}

interface CategoryNode {
  id: string
  name: string
  slug: string
  productsCount: number
  children?: Array<{ id: string; name: string; slug: string; productsCount: number }>
}

interface Props {
  products: ShopProduct[]
  categories: CategoryNode[]
  isAdmin: boolean
  shopTitle?: string
  shopSubtitle?: string
}

const gradients = [
  "from-primary/15 to-muted",
  "from-muted to-primary/10",
  "from-accent/40 to-muted",
]

export function ShopClient({ products, categories, isAdmin, shopTitle = "Магазин", shopSubtitle = "Профессиональная корейская косметика" }: Props) {
  const [search, setSearch] = useState("")
  const [priceFrom, setPriceFrom] = useState("")
  const [priceTo, setPriceTo] = useState("")
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<"default" | "price-asc" | "price-desc" | "name">("default")

  const brands = useMemo(() => {
    const set = new Set(products.map((p) => p.brand).filter(Boolean) as string[])
    return Array.from(set).sort()
  }, [products])

  const filteredProducts = useMemo(() => {
    let list = [...products]
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q)) ||
          (p.brand && p.brand.toLowerCase().includes(q)) ||
          p.sku.toLowerCase().includes(q)
      )
    }
    if (selectedCategoryId) {
      const catIds = new Set<string>([selectedCategoryId])
      const cat = categories.find((c) => c.id === selectedCategoryId)
      cat?.children?.forEach((ch) => catIds.add(ch.id))
      list = list.filter((p) => p.category && catIds.has(p.category.id))
    }
    if (selectedBrand) {
      list = list.filter((p) => p.brand === selectedBrand)
    }
    const from = priceFrom ? parseFloat(priceFrom) : null
    const to = priceTo ? parseFloat(priceTo) : null
    if (from != null && !isNaN(from)) {
      list = list.filter((p) => p.price != null && p.price >= from)
    }
    if (to != null && !isNaN(to)) {
      list = list.filter((p) => p.price != null && p.price <= to)
    }
    if (sortBy === "price-asc") {
      list.sort((a, b) => (a.price ?? 0) - (b.price ?? 0))
    } else if (sortBy === "price-desc") {
      list.sort((a, b) => (b.price ?? 0) - (a.price ?? 0))
    } else if (sortBy === "name") {
      list.sort((a, b) => a.name.localeCompare(b.name))
    }
    return list
  }, [products, search, selectedCategoryId, selectedBrand, priceFrom, priceTo, sortBy, categories])

  return (
    <DashboardLayout activePath="/shop" isAdmin={isAdmin}>
      <section className="mb-6">
        <div className="mb-3 h-[3px] w-12 rounded-full bg-primary" />
        <h1 className="font-serif text-balance text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          {shopTitle}
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          {shopSubtitle}
        </p>
      </section>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Фильтр */}
        <aside className="w-full shrink-0 rounded-3xl border border-border/60 bg-card p-5 boty-shadow lg:w-64">
          <h3 className="mb-3 text-sm font-semibold">Фильтр</h3>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Цена (₽)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={0}
                  placeholder="от"
                  value={priceFrom}
                  onChange={(e) => setPriceFrom(e.target.value)}
                  className="w-full rounded-full border border-border bg-background px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  min={0}
                  placeholder="до"
                  value={priceTo}
                  onChange={(e) => setPriceTo(e.target.value)}
                  className="w-full rounded-full border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Категория
              </label>
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => setSelectedCategoryId(null)}
                  className={`block w-full rounded-full px-3 py-2 text-left text-sm boty-transition ${!selectedCategoryId ? "bg-primary font-medium text-primary-foreground shadow-sm" : "hover:bg-muted/80"}`}
                >
                  Все
                </button>
                {categories.map((c) => (
                  <div key={c.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedCategoryId(selectedCategoryId === c.id ? null : c.id)}
                      className={`flex w-full items-center justify-between rounded-full px-3 py-2 text-left text-sm boty-transition ${selectedCategoryId === c.id ? "bg-primary font-medium text-primary-foreground shadow-sm" : "hover:bg-muted/80"}`}
                    >
                      {c.name}
                      <span className="text-xs text-muted-foreground">({c.productsCount})</span>
                    </button>
                    {c.children && c.children.length > 0 && (
                      <div className="ml-3 mt-1 space-y-1">
                        {c.children.map((ch) => (
                          <button
                            key={ch.id}
                            type="button"
                            onClick={() => setSelectedCategoryId(selectedCategoryId === ch.id ? null : ch.id)}
                            className={`block w-full rounded-full px-3 py-1.5 text-left text-xs boty-transition ${selectedCategoryId === ch.id ? "bg-primary/15 font-medium text-primary" : "text-muted-foreground hover:text-foreground"}`}
                          >
                            {ch.name} ({ch.productsCount})
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            {brands.length > 0 && (
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Производитель
                </label>
                <select
                  value={selectedBrand ?? ""}
                  onChange={(e) => setSelectedBrand(e.target.value || null)}
                  className="w-full rounded-full border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="">Все</option>
                  {brands.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                setSearch("")
                setPriceFrom("")
                setPriceTo("")
                setSelectedCategoryId(null)
                setSelectedBrand(null)
              }}
              className="w-full rounded-full border border-border px-3 py-2 text-sm boty-transition hover:bg-muted"
            >
              Сбросить фильтр
            </button>
          </div>
        </aside>

        {/* Контент */}
        <div className="min-w-0 flex-1">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск по названию, артикулу..."
                className="w-full rounded-full border border-border bg-card pl-10 pr-4 py-2.5 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Сортировать:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="rounded-full border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="default">По умолчанию</option>
                <option value="price-asc">Цена — возрастание</option>
                <option value="price-desc">Цена — убывание</option>
                <option value="name">Название А–Я</option>
              </select>
            </div>
          </div>

          <p className="mb-4 text-sm text-muted-foreground">
            Показано: {filteredProducts.length} {filteredProducts.length === 1 ? "товар" : "товаров"}
          </p>

          {filteredProducts.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProducts.map((p, i) => (
                <ProductCard key={p.id} product={p} gradient={gradients[i % gradients.length]} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/60 bg-card py-16 boty-shadow">
              <Package className="mb-3 h-12 w-12 text-muted-foreground/40" />
              <p className="text-sm font-medium text-muted-foreground">
                {search || selectedCategoryId || selectedBrand || priceFrom || priceTo
                  ? "Ничего не найдено"
                  : "Товары скоро появятся"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                {search || selectedCategoryId || selectedBrand || priceFrom || priceTo
                  ? "Попробуйте изменить фильтры"
                  : "Запустите: pnpm tsx scripts/seed-shop.ts"}
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

function ProductCard({
  product,
  gradient,
}: {
  product: ShopProduct
  gradient: string
}) {
  const { addItem, items } = useCart()
  const inCart = items.some((i) => i.productId === product.id)

  const handleAdd = () => {
    if (product.price == null) return
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
    })
  }

  return (
    <div className="group flex flex-col overflow-hidden rounded-3xl border border-border/50 bg-card boty-shadow boty-transition hover:-translate-y-1 hover:border-primary/25">
      <div className="relative h-40 w-full overflow-hidden">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className={`h-full w-full bg-gradient-to-br ${gradient}`} />
        )}
        {product.brand && (
          <span className="absolute left-3 top-3 rounded bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
            {product.brand}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-serif text-pretty text-base font-semibold leading-snug line-clamp-2">
          {product.name}
        </h3>
        {product.description && (
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {product.description}
          </p>
        )}
        <p className="mt-auto text-lg font-bold text-primary">
          {product.price != null ? `${product.price.toLocaleString("ru-RU")} ₽` : "—"}
        </p>
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={handleAdd}
            disabled={product.price == null}
            className={`inline-flex flex-1 items-center justify-center gap-2 rounded-full px-3 py-2 text-sm font-medium boty-transition ${
              inCart
                ? "bg-chart-3/15 text-chart-3"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
          >
            {inCart ? (
              <>
                <Check className="h-4 w-4" />
                В корзине
              </>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4" />
                В корзину
              </>
            )}
          </button>
          <a
            href="/shop/checkout"
            onClick={handleAdd}
            className="rounded-full border border-border px-3 py-2 text-sm boty-transition hover:bg-muted"
            title="Купить в 1 клик"
          >
            1 клик
          </a>
        </div>
      </div>
    </div>
  )
}
