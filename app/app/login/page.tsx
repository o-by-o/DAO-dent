"use client"

import { Suspense, useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { BrandLogo } from "@/components/brand-logo"
import { Input } from "@/components/ui/input"

/** Разрешить только относительные пути приложения (без протокола и внешних URL) */
function getSafeCallbackPath(raw: string | null): string {
  if (!raw || !raw.startsWith("/")) return "/home"
  if (raw.startsWith("//")) return "/home"
  return raw.split("?")[0] || "/home"
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const afterLoginPath = getSafeCallbackPath(searchParams.get("callbackUrl"))

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const callbackUrl = new URL(afterLoginPath, window.location.origin).toString()
    const result = await signIn("credentials", {
      email: email.trim(),
      password: password.trim(),
      callbackUrl,
      redirect: false,
    })

    setLoading(false)

    if (result?.error) {
      setError("Неверный email или пароль")
    } else {
      router.push(afterLoginPath)
      router.refresh()
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-secondary/5 via-background to-muted p-4">
      <div className="w-full max-w-[400px] space-y-6 rounded-2xl border border-border/50 bg-card p-8 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-shadow duration-200">
        {/* Red accent stripe */}
        <div className="mx-auto h-[3px] w-12 rounded-full bg-primary" />

        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <BrandLogo withBackground className="h-auto w-[250px]" />
          <p className="text-sm text-muted-foreground">
            Войдите в личный кабинет
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-sm font-medium text-foreground"
            >
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

          <div className="space-y-2">
            <label
              htmlFor="password"
              className="text-sm font-medium text-foreground"
            >
              Пароль
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <div className="text-right">
              <a
                href="/forgot-password"
                className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
              >
                Забыли пароль?
              </a>
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all duration-200 hover:bg-primary/90 hover:shadow-md active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : null}
            {loading ? "Вход..." : "Войти"}
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          Нет аккаунта? Обратитесь к администратору.
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-secondary/5 via-background to-muted p-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
