"use client"

import { useMemo, useRef, useEffect } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { Send, Bot, User } from "lucide-react"

interface AgentClientProps {
  chatId: string
  initialMessages?: unknown[]
}

export function AgentClient({ chatId, initialMessages = [] }: AgentClientProps) {
  const endRef = useRef<HTMLDivElement>(null)

  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/agent" }),
    [],
  )

  const { messages, sendMessage, status } = useChat({
    transport,
  })

  const busy = status === "streaming" || status === "submitted"

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const text = String(fd.get("msg") ?? "").trim()
    if (!text || busy) return
    sendMessage({ text })
    e.currentTarget.reset()
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="border-b border-gray-100 px-6 py-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <Bot className="h-4 w-4 text-blue-600" />
          AI-агент ДаоДент
        </h2>
        <p className="text-xs text-gray-500">Помощник по управлению клиникой</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <Bot className="h-4 w-4" />
            </div>
            <div className="max-w-[80%] rounded-2xl rounded-tl-md border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-700">
              Здравствуйте! Я AI-агент клиники ДаоДент. Могу помочь с вопросами по управлению,
              аналитикой, составлением текстов для рекламы и соцсетей. Что нужно?
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
              msg.role === "assistant" ? "bg-blue-100 text-blue-600" : "bg-gray-200 text-gray-600"
            }`}>
              {msg.role === "assistant" ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
            </div>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
              msg.role === "assistant"
                ? "rounded-tl-md border border-gray-100 bg-gray-50 text-gray-700"
                : "rounded-tr-md bg-blue-600 text-white"
            }`}>
              {msg.parts?.map((part, j) => {
                if (part.type === "text") {
                  return <p key={j} className="whitespace-pre-wrap leading-relaxed">{part.text}</p>
                }
                if (part.type === "tool-invocation") {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const inv = (part as any).toolInvocation
                  return (
                    <div key={j} className="mt-2 rounded-lg bg-blue-50 px-3 py-2 text-xs">
                      <span className="font-medium text-blue-700">
                        {inv?.state === "result" ? "✓" : "⏳"} {inv?.toolName}
                      </span>
                      {inv?.state === "result" && inv?.result && (
                        <pre className="mt-1 max-h-40 overflow-auto text-[10px] text-gray-600">
                          {JSON.stringify(inv.result, null, 2).slice(0, 500)}
                        </pre>
                      )}
                    </div>
                  )
                }
                return null
              })}
            </div>
          </div>
        ))}

        {busy && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100">
              <Bot className="h-4 w-4 text-blue-600 animate-pulse" />
            </div>
            <div className="rounded-2xl rounded-tl-md border border-gray-100 bg-gray-50 px-4 py-3">
              <span className="flex gap-1">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: "150ms" }} />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: "300ms" }} />
              </span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={onSubmit} className="flex gap-2 border-t border-gray-100 p-4">
        <input
          name="msg"
          placeholder="Напишите вопрос..."
          className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          disabled={busy}
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-xl bg-blue-600 px-4 py-2.5 text-white transition hover:bg-blue-700 disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  )
}
