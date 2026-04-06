"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { ArrowLeft, Save, MessageSquare, StickyNote, Plus, Trash2, Calendar } from "lucide-react"

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
  return new Date(iso).toLocaleString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

interface LeadItem {
  id: string
  channel: string
  status: string
  externalThreadId: string | null
  rawMessage: string | null
  createdAt: string
  updatedAt: string
}

interface NoteItem {
  id: string
  text: string
  callAt: string | null
  createdAt: string
}

interface ClientData {
  id: string
  name: string
  email: string | null
  phone: string | null
  birthDate: string | null
  source: string
  externalId: string | null
  userId: string | null
  createdAt: string
  updatedAt: string
  user: { id: string; email: string; name: string | null } | null
  leads: LeadItem[]
  notes: NoteItem[]
}

interface Props {
  client: ClientData
}

export function AdminClientDetailClient({ client: initial }: Props) {
  const [client, setClient] = useState(initial)
  const [name, setName] = useState(initial.name)
  const [email, setEmail] = useState(initial.email ?? "")
  const [phone, setPhone] = useState(initial.phone ?? "")
  const [birthDate, setBirthDate] = useState(initial.birthDate?.slice(0, 10) ?? "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [notes, setNotes] = useState<NoteItem[]>(initial.notes ?? [])
  const [newNote, setNewNote] = useState("")
  const [newCallAt, setNewCallAt] = useState("")

  const handleSave = useCallback(async () => {
    setSaving(true)
    setError("")
    try {
      const res = await fetch(`/api/admin/clients/${client.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim() || null,
          phone: phone.trim() || null,
          birthDate: birthDate || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Ошибка сохранения")
        return
      }
      setClient((prev) => ({
        ...prev,
        name: data.client.name,
        email: data.client.email,
        phone: data.client.phone,
        updatedAt: data.client.updatedAt,
      }))
    } finally {
      setSaving(false)
    }
  }, [client.id, name, email, phone, birthDate])

  const handleAddNote = useCallback(async () => {
    if (!newNote.trim()) return
    const res = await fetch(`/api/admin/clients/${client.id}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: newNote.trim(),
        callAt: newCallAt || null,
      }),
    })
    if (res.ok) {
      const data = await res.json()
      setNotes((prev) => [data.note, ...prev])
      setNewNote("")
      setNewCallAt("")
    }
  }, [client.id, newNote, newCallAt])

  const handleDeleteNote = useCallback(async (noteId: string) => {
    await fetch(`/api/admin/clients/${client.id}/notes?noteId=${noteId}`, { method: "DELETE" })
    setNotes((prev) => prev.filter((n) => n.id !== noteId))
  }, [client.id])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/clients"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          К списку
        </Link>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <h1 className="text-xl font-bold text-foreground">{client.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Источник: {SOURCE_LABELS[client.source] ?? client.source} · создан{" "}
          {formatDate(client.createdAt)}
        </p>

        {error && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
            {error}
          </div>
        )}

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Имя
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Телефон
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Дата рождения
            </label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          {client.user && (
            <div className="rounded-lg border border-border bg-muted/20 p-3 text-sm">
              <span className="font-medium text-muted-foreground">
                Пользователь кабинета:
              </span>{" "}
              {client.user.name ?? client.user.email} ({client.user.email})
            </div>
          )}
        </div>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? "Сохранение…" : "Сохранить"}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <MessageSquare className="h-5 w-5" />
          Заявки ({client.leads.length})
        </h2>
        {client.leads.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Заявок пока нет. Они появятся при интеграции с мессенджерами или ручном импорте.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {client.leads.map((lead) => (
              <li
                key={lead.id}
                className="rounded-lg border border-border bg-muted/10 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                    {CHANNEL_LABELS[lead.channel] ?? lead.channel}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {LEAD_STATUS_LABELS[lead.status] ?? lead.status} ·{" "}
                    {formatDate(lead.createdAt)}
                  </span>
                </div>
                {lead.rawMessage && (
                  <p className="mt-2 text-sm text-foreground">{lead.rawMessage}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ========== Notes ========== */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <StickyNote className="h-5 w-5" />
          Заметки ({notes.length})
        </h2>

        <div className="mt-4 space-y-3">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            rows={2}
            placeholder="Добавить заметку..."
            className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none boty-transition focus:border-primary"
          />
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                Напоминание (звонок)
              </label>
              <input
                type="datetime-local"
                value={newCallAt}
                onChange={(e) => setNewCallAt(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none boty-transition focus:border-primary"
              />
            </div>
            <button
              type="button"
              onClick={handleAddNote}
              disabled={!newNote.trim()}
              className="inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground boty-transition hover:bg-primary/90 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Добавить
            </button>
          </div>
        </div>

        {notes.length > 0 && (
          <ul className="mt-4 space-y-2">
            {notes.map((note) => (
              <li
                key={note.id}
                className="flex items-start gap-3 rounded-lg border border-border/50 bg-muted/10 p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm">{note.text}</p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{formatDate(note.createdAt)}</span>
                    {note.callAt && (
                      <span className="inline-flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 text-primary">
                        <Calendar className="h-3 w-3" />
                        Звонок: {formatDate(note.callAt)}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteNote(note.id)}
                  className="shrink-0 text-muted-foreground boty-transition hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
