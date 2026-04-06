"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Plus, Search, Phone, Mail, Cake, StickyNote } from "lucide-react"

interface ClientItem {
  id: string
  name: string
  email: string | null
  phone: string | null
  birthDate: string | null
  lastNote: string | null
  createdAt: string
}

export function MyClientsClient() {
  const [clients, setClients] = useState<ClientItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: "", email: "", phone: "", birthDate: "" })
  const [saving, setSaving] = useState(false)

  const fetchClients = useCallback(async () => {
    const res = await fetch("/api/my-clients")
    if (res.ok) setClients(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { fetchClients() }, [fetchClients])

  const filtered = useMemo(() => {
    if (!search.trim()) return clients
    const q = search.toLowerCase()
    return clients.filter(
      (c) => c.name.toLowerCase().includes(q) || c.phone?.includes(q) || c.email?.toLowerCase().includes(q),
    )
  }, [clients, search])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    const res = await fetch("/api/my-clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      setForm({ name: "", email: "", phone: "", birthDate: "" })
      setShowForm(false)
      fetchClients()
    }
    setSaving(false)
  }

  return (
    <DashboardLayout activePath="/my-clients">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Мои клиенты</h1>
          <p className="mt-1 text-sm text-muted-foreground">{clients.length} клиентов</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground boty-transition hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Добавить
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="mb-6 rounded-xl border border-border/50 bg-card p-5 shadow-[var(--shadow-card)]">
          <h3 className="mb-3 text-sm font-semibold">Новый клиент</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Имя *" required className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none boty-transition focus:border-primary" />
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Телефон" className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none boty-transition focus:border-primary" />
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" type="email" className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none boty-transition focus:border-primary" />
            <input value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} type="date" className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none boty-transition focus:border-primary" />
          </div>
          <div className="mt-3 flex gap-2">
            <button type="submit" disabled={saving} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground boty-transition hover:bg-primary/90 disabled:opacity-50">
              {saving ? "Сохраняем..." : "Создать"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-border px-4 py-2 text-sm boty-transition hover:bg-muted">Отмена</button>
          </div>
        </form>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по имени, телефону, email..."
          className="w-full rounded-lg border border-border bg-background py-2 pl-10 pr-3 text-sm outline-none boty-transition focus:border-primary"
        />
      </div>

      {/* Client list */}
      {loading ? (
        <p className="text-sm text-muted-foreground">Загрузка...</p>
      ) : filtered.length > 0 ? (
        <div className="space-y-2">
          {filtered.map((c) => (
            <div key={c.id} className="flex items-center gap-4 rounded-xl border border-border/50 bg-card p-4 shadow-[var(--shadow-card)] boty-transition hover:shadow-[var(--shadow-card-hover)]">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                {c.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{c.name}</p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  {c.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{c.phone}</span>}
                  {c.email && <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" />{c.email}</span>}
                  {c.birthDate && <span className="inline-flex items-center gap-1"><Cake className="h-3 w-3" />{new Date(c.birthDate).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}</span>}
                </div>
              </div>
              {c.lastNote && (
                <div className="hidden max-w-[200px] items-center gap-1 text-xs text-muted-foreground md:flex">
                  <StickyNote className="h-3 w-3 shrink-0" />
                  <span className="truncate">{c.lastNote}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border/60 bg-muted/30 py-12">
          <p className="text-sm text-muted-foreground">
            {search ? "Никого не найдено" : "У вас пока нет клиентов"}
          </p>
          {!search && (
            <button onClick={() => setShowForm(true)} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
              Добавить первого клиента
            </button>
          )}
        </div>
      )}
    </DashboardLayout>
  )
}
