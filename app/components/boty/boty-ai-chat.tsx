"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { X, Send, MessageCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const SUGGESTIONS = [
  "Сколько стоит лечение кариеса?",
  "Как записаться на приём?",
  "Какие врачи принимают?",
  "Есть ли рассрочка?",
  "Как добраться от метро?",
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
      {/* FAB кнопка */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/25 transition-all duration-300 hover:scale-105 md:hidden",
          open && "pointer-events-none opacity-0",
        )}
        aria-label="Открыть AI-консультанта"
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-40 hidden items-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-blue-600/25 transition-all duration-300 hover:scale-105 md:flex",
          open && "pointer-events-none opacity-0",
        )}
      >
        <MessageCircle className="h-4 w-4" />
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
          "fixed z-50 flex flex-col border-l border-gray-200 bg-white shadow-2xl transition-transform duration-300 ease-in-out",
          "inset-x-0 bottom-0 top-0",
          "md:inset-y-0 md:left-auto md:right-0 md:w-[400px]",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        {/* Шапка */}
        <div className="flex shrink-0 items-center gap-3 border-b border-gray-100 bg-blue-600 p-4 text-white">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">AI-консультант ДаоДент</p>
            <p className="flex items-center gap-1.5 text-[11px] text-blue-100">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-green-400" />
              онлайн 24/7
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(false)}
            className="shrink-0 text-white hover:bg-white/20 hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Сообщения */}
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-gray-50 p-4">
          {messages.length === 0 && (
            <div className="flex gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <MessageCircle className="h-4 w-4" />
              </div>
              <div className="max-w-[85%] rounded-2xl rounded-tl-md border border-gray-100 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm">
                <p className="leading-relaxed">
                  Здравствуйте! Я AI-консультант клиники ДаоДент.
                  Помогу записаться на приём, расскажу об услугах и ценах,
                  подскажу, как до нас добраться от м. Семёновская.
                  Чем могу помочь?
                </p>
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={cn("flex gap-2.5", msg.role === "user" && "flex-row-reverse")}>
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium",
                  msg.role === "assistant"
                    ? "bg-blue-100 text-blue-600"
                    : "bg-blue-600 text-white",
                )}
              >
                {msg.role === "assistant" ? (
                  <MessageCircle className="h-4 w-4" />
                ) : (
                  "Вы"
                )}
              </div>
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-3 text-sm",
                  msg.role === "assistant"
                    ? "rounded-tl-md border border-gray-100 bg-white text-gray-700 shadow-sm"
                    : "rounded-tr-md bg-blue-600 text-white",
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
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <MessageCircle className="h-4 w-4 animate-pulse" />
              </div>
              <div className="rounded-2xl rounded-tl-md border border-gray-100 bg-white px-4 py-3 shadow-sm">
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: "150ms" }} />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: "300ms" }} />
                </span>
              </div>
            </div>
          )}

          <div ref={endRef} />
        </div>

        {/* Подсказки */}
        {messages.length <= 1 && !busy && (
          <div className="flex shrink-0 flex-wrap gap-2 bg-gray-50 px-4 pb-3">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  sendMessage({ text: s })
                  setOpen(true)
                }}
                className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-[11px] font-medium text-gray-600 transition hover:border-blue-300 hover:text-blue-600"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Форма ввода */}
        <form onSubmit={onSubmit} className="flex shrink-0 gap-2 border-t border-gray-100 bg-white p-4">
          <Input
            name="msg"
            placeholder="Задайте вопрос..."
            className="flex-1 rounded-full border border-gray-200 bg-gray-50"
            disabled={busy}
            autoComplete="off"
          />
          <Button type="submit" size="icon" disabled={busy} className="shrink-0 rounded-full bg-blue-600 hover:bg-blue-700">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </>
  )
}
