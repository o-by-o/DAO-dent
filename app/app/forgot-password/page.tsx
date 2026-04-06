"use client"

import { useState } from "react"
import { Loader2, CheckCircle2 } from "lucide-react"
import { BrandLogo } from "@/components/brand-logo"
import { Input } from "@/components/ui/input"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || "Не удалось отправить ссылку")
        return
      }

      setSuccess(data.message || "Проверьте вашу почту")
    } catch {
      setError("Не удалось отправить ссылку")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-secondary/5 via-background to-muted p-4">
      <div className="w-full max-w-[400px] space-y-6 rounded-2xl border border-border/40 bg-card p-8 shadow-lg">
        {/* Red accent stripe */}
        <div className="mx-auto h-[3px] w-12 rounded-full bg-primary" />

        <div className="flex flex-col items-center gap-3">
          <BrandLogo withBackground className="h-auto w-[250px]" />
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Восстановление пароля
          </h1>
          <p className="text-center text-sm text-muted-foreground">
            Укажите email, и мы отправим ссылку для смены пароля.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.ru"
              required
            />
          </div>

          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          {success && (
            <p className="flex items-center gap-2 rounded-lg bg-green-500/10 px-3 py-2 text-sm text-green-700">
              <CheckCircle2 className="h-4 w-4" />
              {success}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all duration-200 hover:bg-primary/90 hover:shadow-md active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {loading ? "Отправляем..." : "Отправить ссылку"}
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          <a href="/login" className="underline underline-offset-2">
            Вернуться ко входу
          </a>
        </p>
      </div>
    </div>
  )
}
