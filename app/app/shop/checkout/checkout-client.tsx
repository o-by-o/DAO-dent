"use client"

import { useState } from "react"
import type { Session } from "next-auth"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { useCart } from "@/lib/cart"
import {
  ShoppingBag,
  Minus,
  Plus,
  Trash2,
  ArrowLeft,
  Check,
} from "lucide-react"

interface Props {
  session: Session
}

export function CheckoutClient({ session }: Props) {
  const { items, updateQuantity, removeItem, clearCart, totalPrice } = useCart()
  const [phone, setPhone] = useState("")
  const [comment, setComment] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (items.length === 0) return

    setSubmitting(true)
    try {
      const res = await fetch("/api/shop/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            unitPrice: i.price,
          })),
          phone,
          comment: comment || undefined,
        }),
      })

      if (res.ok) {
        clearCart()
        setSuccess(true)
      }
    } catch {
      // error handling
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <DashboardLayout activePath="/shop" session={session}>
        <div className="flex flex-col items-center gap-4 py-20">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-chart-3/15">
            <Check className="h-8 w-8 text-chart-3" />
          </div>
          <h1 className="text-2xl font-semibold">Заказ оформлен!</h1>
          <p className="text-sm text-muted-foreground">
            Мы свяжемся с вами для подтверждения
          </p>
          <a
            href="/shop"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground boty-transition hover:bg-primary/90"
          >
            Вернуться в магазин
          </a>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout activePath="/shop" session={session}>
      <div className="mb-6">
        <a
          href="/shop"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground boty-transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Назад в магазин
        </a>
        <h1 className="mt-2 text-2xl font-semibold">Оформление заказа</h1>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border/60 bg-muted/30 py-16">
          <ShoppingBag className="h-12 w-12 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Корзина пуста</p>
          <a
            href="/shop"
            className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground boty-transition hover:bg-primary/90"
          >
            Перейти в магазин
          </a>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
          {/* Cart items */}
          <div className="space-y-3 lg:col-span-2">
            {items.map((item) => (
              <div
                key={item.productId}
                className="flex items-center gap-4 rounded-xl border border-border/50 bg-card p-4 shadow-[var(--shadow-card)]"
              >
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted/50">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ShoppingBag className="h-6 w-6 text-muted-foreground/40" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.name}</p>
                  <p className="text-sm font-semibold text-primary">
                    {item.price.toLocaleString("ru-RU")} ₽
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      updateQuantity(item.productId, item.quantity - 1)
                    }
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-border boty-transition hover:bg-muted"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-8 text-center text-sm font-medium">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      updateQuantity(item.productId, item.quantity + 1)
                    }
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-border boty-transition hover:bg-muted"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="w-20 text-right text-sm font-semibold">
                  {(item.price * item.quantity).toLocaleString("ru-RU")} ₽
                </p>
                <button
                  type="button"
                  onClick={() => removeItem(item.productId)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground boty-transition hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Order summary */}
          <div className="space-y-4">
            <div className="rounded-xl border border-border/50 bg-card p-5 shadow-[var(--shadow-card)]">
              <h2 className="mb-4 text-base font-semibold">Ваш заказ</h2>
              <div className="space-y-2 text-sm">
                {items.map((item) => (
                  <div
                    key={item.productId}
                    className="flex justify-between gap-2"
                  >
                    <span className="truncate text-muted-foreground">
                      {item.name} x{item.quantity}
                    </span>
                    <span className="shrink-0 font-medium">
                      {(item.price * item.quantity).toLocaleString("ru-RU")} ₽
                    </span>
                  </div>
                ))}
                <div className="border-t border-border/50 pt-2">
                  <div className="flex justify-between text-base font-semibold">
                    <span>Итого</span>
                    <span className="text-primary">
                      {totalPrice.toLocaleString("ru-RU")} ₽
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border/50 bg-card p-5 shadow-[var(--shadow-card)]">
              <h2 className="mb-4 text-base font-semibold">Контакты</h2>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">
                    Телефон
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+7 (___) ___-__-__"
                    required
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none boty-transition focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">
                    Комментарий
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={2}
                    placeholder="Пожелания к заказу"
                    className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none boty-transition focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || items.length === 0}
              className="w-full rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground boty-transition hover:bg-primary/90 disabled:opacity-50"
            >
              {submitting ? "Оформляем..." : "Оформить заказ"}
            </button>
          </div>
        </form>
      )}
    </DashboardLayout>
  )
}
