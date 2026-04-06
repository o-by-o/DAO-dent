"use client"

import { useState, useCallback, useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Users, Plus, Copy, Check, Ban, RotateCcw, Clock, AlertTriangle } from "lucide-react"

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

interface CourseEnrollment {
  id: string
  title: string
  slug: string
  enrollmentId: string
  expiresAt: string | null
  revokedAt: string | null
  status: "active" | "revoked" | "expired"
}

interface UserItem {
  id: string
  email: string
  name: string | null
  createdAt: string
  courses: CourseEnrollment[]
  completedLessons: number
}

interface CourseOption {
  id: string
  title: string
  slug: string
}

interface Props {
  initialUsers: UserItem[]
  courses: CourseOption[]
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

const LICENSE_OPTIONS = [
  { value: 0, label: "Бессрочно" },
  { value: 30, label: "1 месяц" },
  { value: 90, label: "3 месяца" },
  { value: 180, label: "6 месяцев" },
  { value: 365, label: "1 год" },
]

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function StatusBadge({ status, expiresAt }: { status: CourseEnrollment["status"]; expiresAt: string | null }) {
  if (status === "revoked") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
        <Ban className="h-3 w-3" />
        Отозван
      </span>
    )
  }
  if (status === "expired") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
        <AlertTriangle className="h-3 w-3" />
        Истёк
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
      <Check className="h-3 w-3" />
      Активен
      {expiresAt && (
        <span className="ml-1 text-green-600/70">
          до {formatDate(expiresAt)}
        </span>
      )}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

export function AdminUsersClient({ initialUsers, courses }: Props) {
  const [users, setUsers] = useState(initialUsers)
  const [createOpen, setCreateOpen] = useState(false)
  const [resultOpen, setResultOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [result, setResult] = useState<{
    email: string
    name: string | null
    temporaryPassword: string | null
    message: string
  } | null>(null)
  const [copied, setCopied] = useState(false)

  // Form state
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([])
  const [licenseDays, setLicenseDays] = useState(0)

  // Expanded user for course details
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [courseFilter, setCourseFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<"all" | CourseEnrollment["status"]>("all")

  const toggleCourse = useCallback((id: string) => {
    setSelectedCourseIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }, [])

  /** Refresh the users list from the API */
  const refreshUsers = useCallback(async () => {
    const listRes = await fetch("/api/admin/users")
    if (listRes.ok) {
      const { users: list } = await listRes.json()
      setUsers(list)
    }
  }, [])

  /** Create user + grant access */
  const handleCreate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim() || undefined,
          courseIds: selectedCourseIds,
          licenseDays: licenseDays || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Ошибка")
        return
      }
      setResult({
        email: data.user.email,
        name: data.user.name ?? null,
        temporaryPassword: data.temporaryPassword ?? null,
        message: data.message,
      })
      setCreateOpen(false)
      setResultOpen(true)
      setEmail("")
      setName("")
      setSelectedCourseIds([])
      setLicenseDays(0)
      await refreshUsers()
    } finally {
      setLoading(false)
    }
  }, [email, name, selectedCourseIds, licenseDays, refreshUsers])

  /** Revoke or restore enrollment */
  const handleEnrollmentAction = useCallback(async (
    enrollmentId: string,
    action: "revoke" | "restore",
  ) => {
    setActionLoading(enrollmentId)
    try {
      const res = await fetch(`/api/admin/enrollments/${enrollmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      if (res.ok) {
        await refreshUsers()
      }
    } finally {
      setActionLoading(null)
    }
  }, [refreshUsers])

  const copyToClipboard = useCallback(() => {
    if (!result) return
    const loginUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/login`
    const text = result.temporaryPassword
      ? `Вход: ${result.email}\nПароль: ${result.temporaryPassword}\nСсылка: ${loginUrl}`
      : `Вход: ${result.email}\nСсылка: ${loginUrl}`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [result])

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const bySearch =
        !searchQuery.trim() ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.name || "").toLowerCase().includes(searchQuery.toLowerCase())

      const byCourse =
        courseFilter === "all" || user.courses.some((course) => course.id === courseFilter)

      const byStatus =
        statusFilter === "all" ||
        user.courses.some((course) => course.status === statusFilter)

      return bySearch && byCourse && byStatus
    })
  }, [users, searchQuery, courseFilter, statusFilter])

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Выдавайте и отзывайте доступ к курсам. Управляйте лицензиями.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Выдать доступ
          </button>
        </div>

        {/* Filters */}
        <div className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Поиск по email / имени
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="student@example.ru"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Курс
            </label>
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="all">Все курсы</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Статус доступа
            </label>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as "all" | CourseEnrollment["status"])
              }
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="all">Любой</option>
              <option value="active">Активен</option>
              <option value="revoked">Отозван</option>
              <option value="expired">Истёк</option>
            </select>
          </div>
        </div>

        {/* Users table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-foreground">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-foreground">
                    Имя
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-foreground">
                    Курсы и доступ
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-foreground">
                    Уроков
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                      По текущим фильтрам пользователей не найдено.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isExpanded = expandedUserId === u.id
                    return (
                      <tr key={u.id} className="border-b border-border/50 align-top">
                        <td className="px-4 py-3 font-medium text-foreground">
                          {u.email}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {u.name || "—"}
                        </td>
                        <td className="px-4 py-3">
                          {u.courses.length === 0 ? (
                            <span className="text-muted-foreground">—</span>
                          ) : (
                            <div className="space-y-2">
                              {/* Show first course always, rest when expanded */}
                              {(isExpanded ? u.courses : u.courses.slice(0, 2)).map((c) => (
                                <div
                                  key={c.enrollmentId}
                                  className="flex flex-wrap items-center gap-2"
                                >
                                  <span className="text-foreground font-medium text-xs">
                                    {c.title}
                                  </span>
                                  <StatusBadge status={c.status} expiresAt={c.expiresAt} />
                                  {/* Action buttons */}
                                  {c.status === "active" && (
                                    <button
                                      type="button"
                                      onClick={() => handleEnrollmentAction(c.enrollmentId, "revoke")}
                                      disabled={actionLoading === c.enrollmentId}
                                      className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
                                      title="Отозвать доступ"
                                    >
                                      <Ban className="h-3 w-3" />
                                      {actionLoading === c.enrollmentId ? "..." : "Отозвать"}
                                    </button>
                                  )}
                                  {(c.status === "revoked" || c.status === "expired") && (
                                    <button
                                      type="button"
                                      onClick={() => handleEnrollmentAction(c.enrollmentId, "restore")}
                                      disabled={actionLoading === c.enrollmentId}
                                      className="inline-flex items-center gap-1 rounded-md border border-green-200 bg-green-50 px-2 py-0.5 text-xs font-medium text-green-600 transition-colors hover:bg-green-100 disabled:opacity-50"
                                      title="Восстановить доступ"
                                    >
                                      <RotateCcw className="h-3 w-3" />
                                      {actionLoading === c.enrollmentId ? "..." : "Восстановить"}
                                    </button>
                                  )}
                                </div>
                              ))}
                              {/* Show more / less */}
                              {u.courses.length > 2 && (
                                <button
                                  type="button"
                                  onClick={() => setExpandedUserId(isExpanded ? null : u.id)}
                                  className="text-xs text-accent hover:underline"
                                >
                                  {isExpanded
                                    ? "Свернуть"
                                    : `Ещё ${u.courses.length - 2} курс(ов)...`}
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          {u.completedLessons}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ==================== Modal: Create Access ==================== */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Выдать доступ
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label htmlFor="admin-email" className="mb-1 block text-sm font-medium text-foreground">
                Email *
              </label>
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@example.ru"
                required
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="admin-name" className="mb-1 block text-sm font-medium text-foreground">
                Имя (необязательно)
              </label>
              <input
                id="admin-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Мария Иванова"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <span className="mb-2 block text-sm font-medium text-foreground">
                Курсы *
              </span>
              <div className="max-h-40 space-y-2 overflow-y-auto rounded-lg border border-border p-3">
                {courses.map((c) => (
                  <label
                    key={c.id}
                    className="flex cursor-pointer items-center gap-2"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCourseIds.includes(c.id)}
                      onChange={() => toggleCourse(c.id)}
                      className="h-4 w-4 rounded border-border"
                    />
                    <span className="text-sm">{c.title}</span>
                  </label>
                ))}
              </div>
            </div>
            {/* License duration */}
            <div>
              <label htmlFor="admin-license" className="mb-1 flex items-center gap-1.5 text-sm font-medium text-foreground">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Срок лицензии
              </label>
              <select
                id="admin-license"
                value={licenseDays}
                onChange={(e) => setLicenseDays(Number(e.target.value))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                {LICENSE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-muted-foreground">
                После окончания срока доступ к курсам будет автоматически закрыт.
              </p>
            </div>
            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={loading || selectedCourseIds.length === 0}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                {loading ? "Создаём…" : "Создать доступ"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ==================== Modal: Result ==================== */}
      <Dialog open={resultOpen} onOpenChange={setResultOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Доступ создан</DialogTitle>
          </DialogHeader>
          {result && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{result.message}</p>
              <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
                <p className="text-sm">
                  <span className="font-medium text-foreground">Email:</span>{" "}
                  {result.email}
                </p>
                {result.temporaryPassword && (
                  <p className="text-sm">
                    <span className="font-medium text-foreground">Пароль (сохраните, показывается один раз):</span>{" "}
                    <code className="inline-block max-w-full break-all whitespace-normal rounded bg-muted px-1.5 py-0.5 font-mono text-sm">
                      {result.temporaryPassword}
                    </code>
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={copyToClipboard}
                className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied ? "Скопировано" : "Скопировать данные для отправки"}
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
