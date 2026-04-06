"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { X, Send } from "lucide-react"
import { BrandLogo } from "@/components/brand-logo"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const SUGGESTIONS = [
  "Подобрать уход для лица",
  "Как записаться на курсы?",
  "Что такое AI-диагностика?",
  "Где каталог косметики?",
]

export function BotyAiChat() {
  const [open, setOpen] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
      }),
    [],
  )

  const { messages, sendMessage, status } = useChat({ transport })

  const busy = status === "streaming" || status === "submitted"

  useEffect(() => {
    if (open) {
      endRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, open])

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const text = String(fd.get("msg") ?? "").trim()
    if (!text || busy) return
    sendMessage({ text })
    e.currentTarget.reset()
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-300 hover:scale-105 md:hidden",
          open && "pointer-events-none opacity-0",
        )}
        aria-label="Открыть AI-консультанта"
      >
        <BrandLogo variant="collapsed" useCurrentColor className="h-8 w-8" aria-hidden />
      </button>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-40 hidden items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-300 hover:scale-105 md:flex",
          open && "pointer-events-none opacity-0",
        )}
      >
        <BrandLogo variant="collapsed" useCurrentColor className="h-4 w-4 shrink-0" aria-hidden />
        AI-консультант
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      <div
        className={cn(
          "fixed z-50 flex flex-col border-border bg-card shadow-2xl transition-transform duration-300 ease-in-out",
          "inset-x-0 bottom-0 top-0 border-l",
          "md:inset-y-0 md:left-auto md:right-0 md:w-[400px]",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex shrink-0 items-center gap-3 border-b border-border p-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 p-0.5">
            <BrandLogo variant="collapsed" className="h-[26px] w-[26px] shrink-0" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-serif text-sm font-semibold">AI-консультант</p>
            <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" />
              онлайн
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="shrink-0">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
          {messages.length === 0 && (
            <div className="flex gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 p-0.5">
                <BrandLogo variant="collapsed" className="h-[26px] w-[26px] shrink-0" aria-hidden />
              </div>
              <div className="max-w-[85%] rounded-2xl rounded-tl-md border border-border/50 bg-muted/90 px-4 py-3 text-sm text-foreground shadow-sm">
                <p className="leading-relaxed">
                  Привет! Помогу с курсами, магазином и AI-диагностикой DIB Academy. Что вас интересует?
                </p>
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={cn("flex gap-2.5", msg.role === "user" && "flex-row-reverse")}>
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium",
                  msg.role === "assistant" ? "bg-primary/10" : "bg-primary/15 text-primary",
                )}
              >
                {msg.role === "assistant" ? (
                  <BrandLogo variant="collapsed" className="h-[22px] w-[22px] shrink-0" aria-hidden />
                ) : (
                  "Вы"
                )}
              </div>
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-3 text-sm",
                  msg.role === "assistant"
                    ? "rounded-tl-md border border-border/50 bg-muted/90 text-foreground shadow-sm"
                    : "rounded-tr-md bg-primary text-primary-foreground",
                )}
              >
                {msg.parts?.map((part, j) => {
                  if (part.type === "text") {
                    return (
                      <p key={j} className="whitespace-pre-wrap leading-relaxed">
                        {part.text}
                      </p>
                    )
                  }
                  return null
                })}
              </div>
            </div>
          ))}

          {busy && (
            <div className="flex gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 p-0.5">
                <BrandLogo
                  variant="collapsed"
                  className="h-[22px] w-[22px] shrink-0 animate-pulse"
                  aria-hidden
                />
              </div>
              <div className="rounded-2xl rounded-tl-md border border-border/50 bg-muted/90 px-4 py-3 shadow-sm">
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/50" />
                  <span
                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/50"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/50"
                    style={{ animationDelay: "300ms" }}
                  />
                </span>
              </div>
            </div>
          )}

          <div ref={endRef} />
        </div>

        {messages.length <= 1 && !busy && (
          <div className="flex shrink-0 flex-wrap gap-2 px-4 pb-3">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  sendMessage({ text: s })
                  setOpen(true)
                }}
                className="rounded-full border border-border/50 bg-muted/80 px-3 py-1.5 text-[11px] font-medium text-foreground transition-colors hover:bg-muted"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={onSubmit} className="flex shrink-0 gap-2 border-t border-border p-4">
          <Input
            name="msg"
            placeholder="Спросите что-нибудь…"
            className="flex-1 rounded-full border border-border/40 bg-background/90"
            disabled={busy}
            autoComplete="off"
          />
          <Button type="submit" size="icon" disabled={busy} className="shrink-0 rounded-full">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </>
  )
}
