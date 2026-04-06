"use client"

import React from "react"

import { useState, useCallback, useRef, useEffect } from "react"
import { MessageCircle, X, Send, Bot } from "lucide-react"
import { cn } from "@/lib/utils"

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Message {
  id: number
  text: string
  from: "bot" | "user"
}

const initialMessages: Message[] = [
  {
    id: 1,
    text: "Здравствуйте! Чем могу помочь?",
    from: "bot",
  },
  {
    id: 2,
    text: "Напишите ваш вопрос, и я постараюсь ответить как можно скорее.",
    from: "bot",
  },
]

/* ------------------------------------------------------------------ */
/*  ChatWidget                                                         */
/* ------------------------------------------------------------------ */

export function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  /* Auto-scroll to bottom on new messages */
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = useCallback(() => {
    const text = input.trim()
    if (!text) return

    const userMsg: Message = {
      id: Date.now(),
      text,
      from: "user",
    }
    setMessages((prev) => [...prev, userMsg])
    setInput("")

    /* Simulate bot auto-reply after 1s */
    setTimeout(() => {
      const botReply: Message = {
        id: Date.now() + 1,
        text: "Спасибо за сообщение! Оператор ответит вам в ближайшее время.",
        from: "bot",
      }
      setMessages((prev) => [...prev, botReply])
    }, 1000)
  }, [input])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend],
  )

  return (
    <>
      {/* ---- Floating button ---- */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "fixed right-5 bottom-5 z-50 flex items-center gap-2 rounded-full px-5 py-3 font-semibold shadow-lg transition-all hover:scale-105",
          open
            ? "bg-muted text-foreground"
            : "bg-secondary text-secondary-foreground",
        )}
        aria-label={open ? "Закрыть чат" : "Открыть чат"}
      >
        {open ? (
          <X className="h-5 w-5" />
        ) : (
          <MessageCircle className="h-5 w-5" />
        )}
        <span className="text-sm">{open ? "Закрыть" : "Чат"}</span>
      </button>

      {/* ---- Chat popup ---- */}
      {open && (
        <div className="fixed right-5 bottom-20 z-50 flex h-[420px] w-[340px] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
          {/* Header */}
          <div className="flex items-center gap-3 bg-secondary px-4 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-secondary-foreground">
                Поддержка DIB Academy
              </p>
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-green-400" />
                <span className="text-xs text-secondary-foreground/70">
                  Онлайн
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-secondary-foreground/60 hover:text-secondary-foreground"
              aria-label="Закрыть чат"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex",
                  msg.from === "user" ? "justify-end" : "justify-start",
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
                    msg.from === "user"
                      ? "rounded-br-sm bg-primary text-primary-foreground"
                      : "rounded-bl-sm bg-muted text-card-foreground",
                  )}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="border-t border-border px-3 py-2.5">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Напишите сообщение..."
                className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!input.trim()}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/80 disabled:opacity-40"
                aria-label="Отправить"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1.5 text-center text-[10px] text-muted-foreground">
              Powered by AI
            </p>
          </div>
        </div>
      )}
    </>
  )
}
