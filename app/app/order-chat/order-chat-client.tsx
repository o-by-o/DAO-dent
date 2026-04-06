"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { BrandLogo } from "@/components/brand-logo"
import { Send, ShoppingCart, Loader2 } from "lucide-react"

export function OrderChatClient() {
  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/order-chat" }),
    [],
  )

  const { messages: chatMessages, sendMessage, status } = useChat({ transport })

  const messages = chatMessages

  const [input, setInput] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)
  const isLoading = status === "streaming" || status === "submitted"

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    sendMessage({ text: input.trim() })
    setInput("")
  }

  return (
    <DashboardLayout activePath="/order-chat">
      <div className="flex h-[calc(100vh-10rem)] flex-col">
        {/* Header */}
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <ShoppingCart className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">Заказ товаров</h1>
            <p className="text-xs text-muted-foreground">Закажите косметику через чат с агентом</p>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto rounded-xl border border-border/50 bg-card p-4 shadow-[var(--shadow-card)]">
            {/* Welcome message */}
          {messages.length === 0 && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <BrandLogo variant="collapsed" className="h-5 w-5" />
              </div>
              <div className="max-w-[80%] rounded-2xl bg-muted/50 px-4 py-2.5 text-sm leading-relaxed text-foreground">
                Здравствуйте! Я помогу вам заказать косметику для вашего склада. Скажите, какие товары вам нужны — я найду их в каталоге и оформлю заказ.
              </div>
            </div>
          )}
          {messages.map((m) => {
            const text = m.parts
              ?.filter((p): p is { type: "text"; text: string } => p.type === "text")
              .map((p) => p.text)
              .join("") || ""
            if (!text.trim()) return null
            return (
              <div key={m.id} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                {m.role === "assistant" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <BrandLogo variant="collapsed" className="h-5 w-5" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/50 text-foreground"
                  }`}
                >
                  <span className="whitespace-pre-wrap">{text}</span>
                </div>
              </div>
            )
          })}
          {isLoading && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              </div>
              <div className="rounded-2xl bg-muted/50 px-4 py-2.5 text-sm text-muted-foreground">
                Ищу товары...
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Напишите какие товары нужны..."
            className="flex-1 rounded-full border border-border bg-background px-5 py-3 text-sm outline-none boty-transition focus:border-primary"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground boty-transition hover:bg-primary/90 disabled:opacity-50"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>
    </DashboardLayout>
  )
}
