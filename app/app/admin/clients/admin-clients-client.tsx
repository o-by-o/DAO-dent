"use client"

import { useState, useCallback, useMemo } from "react"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { UserCircle, Plus, RefreshCw, Search, ExternalLink } from "lucide-react"

interface LeadSummary {
  id: string
  status: string
  channel: string
  createdAt: string
  rawMessage: string | null
}

interface ClientItem {
  id: string
  name: string
  email: string | null
  phone: string | null
  source: string
  externalId: string | null
  userId: string | null
  createdAt: string
  updatedAt: string
  lastLead: LeadSummary | null
  leadsCount: number
}

interface Props {
  initialClients: ClientItem[]
}

const SOURCE_LABELS: Record<string, string> = {
  WEBSITE_USER: "Сайт",
  MESSENGER_LEAD: "Мессенджер",
  MANUAL: "Вручную",
}

const CHANNEL_LABELS: Record<string, string> = {
  TELEGRAM: "Telegram",
  WHATSAPP: "WhatsApp",
  WEB_FORM: "Форма",
  OTHER: "Другое",
}

const LEAD_STATUS_LABELS: Record<string, string> = {
  NEW: "Новая",
  CONTACTED: "На связи",
  CONVERTED: "Конвертирован",
  CLOSED: "Закрыта",
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export function AdminClientsClient({ initialClients }: Props) {
  const [clients, setClients] = useState(initialClients)
  const [searchQuery, setSearchQuery] = useState("")
  const [sourceFilter, setSourceFilter] = useState("")
  const [createOpen, setCreateOpen] = useState(false)
  const [syncLoading, setSyncLoading] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [error, setError] = useState("")
  const [createName, setCreateName] = useState("")
  const [createEmail, setCreateEmail] = useState("")
  const [createPhone, setCreatePhone] = useState("")

  const refresh = useCallback(async () => {
    const res = await fetch("/api/admin/clients")
    if (res.ok) {
      const { clients: list } = await res.json()
      setClients(list)
    }
  }, [])

  const handleSync = useCallback(async () => {
    setSyncLoading(true)
    setError("")
    try {
      const res = await fetch("/api/admin/clients/sync", { method: "POST" })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Ошибка синхронизации")
        return
      }
      await refresh()
    } finally {
      setSyncLoading(false)
    }
  }, [refresh])

  const handleCreate = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError("")
      setCreateLoading(true)
      try {
        const res = await fetch("/api/admin/clients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: createName.trim(),
            email: createEmail.trim() || undefined,
            phone: createPhone.trim() || undefined,
          }),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error || "Ошибка")
          return
        }
        setCreateOpen(false)
        setCreateName("")
        setCreateEmail("")
        setCreatePhone("")
        await refresh()
      } finally {
        setCreateLoading(false)
      }
    },
    [createName, createEmail, createPhone, refresh]
  )

  const filtered = useMemo(() => {
    return clients.filter((c) => {
      const bySearch =
        !searchQuery.trim() ||
        (c.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.phone || "").toLowerCase().includes(searchQuery.toLowerCase())
      const bySource = !sourceFilter || c.source === sourceFilter
      return bySearch && bySource
    })
  }, [clients, searchQuery, sourceFilter])

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Клиентская база
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Клиенты и заявки из мессенджеров. Синхронизация с пользователями сайта.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSync}
              disabled={syncLoading}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${syncLoading ? "animate-spin" : ""}`} />
              Синхронизировать
            </button>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Добавить клиента
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
            {error}
          </div>
        )}

        <div className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <Search className="h-3.5 w-3.5" />
              Поиск по имени / email / телефону
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск..."
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Источник
            </label>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="">Все</option>
              {Object.entries(SOURCE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-foreground">
                    Имя
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-foreground">
                    Контакт
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-foreground">
                    Источник
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-foreground">
                    Заявки
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-foreground">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-border/60 hover:bg-muted/30"
                  >
                    <td className="px-4 py-3 font-medium text-foreground">
                      {c.name}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {[c.email, c.phone].filter(Boolean).join(" · ") || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                        {SOURCE_LABELS[c.source] ?? c.source}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {c.leadsCount > 0 ? (
                        <span className="text-muted-foreground">
                          {c.leadsCount}{" "}
                          {c.lastLead && (
                            <span className="text-xs">
                              · {LEAD_STATUS_LABELS[c.lastLead.status] ?? c.lastLead.status}{" "}
                              {formatDate(c.lastLead.createdAt)}
                            </span>
                          )}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/clients/${c.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Открыть
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-muted-foreground">
              <UserCircle className="h-10 w-10 opacity-50" />
              <p>Нет клиентов по заданным фильтрам</p>
            </div>
          )}
        </div>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить клиента</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Имя *
              </label>
              <input
                type="text"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                required
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Email
              </label>
              <input
                type="email"
                value={createEmail}
                onChange={(e) => setCreateEmail(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Телефон
              </label>
              <input
                type="text"
                value={createPhone}
                onChange={(e) => setCreatePhone(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={createLoading || !createName.trim()}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {createLoading ? "Сохранение…" : "Создать"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
