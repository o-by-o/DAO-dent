"use client"

import { useState, useCallback, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Camera,
  Eye,
  EyeOff,
  CheckCircle2,
  ShieldCheck,
  Package,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react"

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function getInitials(name: string | null | undefined): string {
  if (!name) return "?"
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

/** Split "Имя Фамилия" into [firstName, lastName] */
function splitName(fullName: string | null | undefined): [string, string] {
  if (!fullName) return ["", ""]
  const parts = fullName.trim().split(/\s+/)
  return [parts[0] || "", parts.slice(1).join(" ") || ""]
}

/* ------------------------------------------------------------------ */
/*  Section 1: Personal Information                                    */
/* ------------------------------------------------------------------ */

function PersonalInfoSection() {
  const { data: session } = useSession()
  const user = session?.user

  const [firstName, lastName] = splitName(user?.name)
  const initials = getInitials(user?.name)

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    city: "",
    dob: "",
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Заполняем форму данными из сессии при загрузке
  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        firstName: prev.firstName || firstName,
        lastName: prev.lastName || lastName,
        email: prev.email || user.email || "",
      }))
    }
  }, [user, firstName, lastName])

  const handleChange = useCallback((field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setSaved(false)
  }, [])

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: [form.firstName.trim(), form.lastName.trim()].filter(Boolean).join(" ") || null,
        }),
      })
      if (res.ok) setSaved(true)
    } finally {
      setSaving(false)
    }
  }, [form])

  return (
    <div className="rounded-xl border border-border/60 bg-card p-6 shadow-[var(--shadow-card)]">
      <h2 className="stripe-left mb-5 text-lg font-semibold text-card-foreground">
        Личные данные
      </h2>

      {/* Avatar upload */}
      <div className="mb-6 flex items-center gap-4">
        <div className="relative">
          <Avatar className="h-20 w-20">
            <AvatarFallback className="bg-primary/20 text-xl font-semibold text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          {/* Camera overlay */}
          <button
            type="button"
            className="absolute inset-0 flex items-center justify-center rounded-full bg-foreground/40 opacity-0 transition-opacity hover:opacity-100"
            aria-label="Загрузить фото"
          >
            <Camera className="h-5 w-5 text-card" />
          </button>
        </div>
        <div>
          <button
            type="button"
            className="text-sm font-medium text-primary-foreground underline underline-offset-2 transition-colors hover:text-accent"
          >
            Загрузить фото
          </button>
          <p className="mt-0.5 text-xs text-muted-foreground">
            JPG, PNG. Макс. 2 МБ
          </p>
        </div>
      </div>

      {/* Form grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="firstName">Имя</Label>
          <Input
            id="firstName"
            value={form.firstName}
            onChange={(e) => handleChange("firstName", e.target.value)}
            placeholder="Введите имя"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lastName">Фамилия</Label>
          <Input
            id="lastName"
            value={form.lastName}
            onChange={(e) => handleChange("lastName", e.target.value)}
            placeholder="Введите фамилию"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Input
              id="email"
              type="email"
              value={form.email}
              readOnly
              className="pr-20 text-muted-foreground"
            />
            <Badge className="absolute top-1/2 right-2 -translate-y-1/2 gap-1 bg-green-100 text-green-700 hover:bg-green-100">
              <CheckCircle2 className="h-3 w-3" />
              Верифицирован
            </Badge>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Телефон</Label>
          <Input
            id="phone"
            type="tel"
            value={form.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            placeholder="+7 (___) ___-__-__"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="city">Город</Label>
          <Input
            id="city"
            value={form.city}
            onChange={(e) => handleChange("city", e.target.value)}
            placeholder="Укажите город"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dob">Дата рождения</Label>
          <Input
            id="dob"
            type="date"
            value={form.dob}
            onChange={(e) => handleChange("dob", e.target.value)}
          />
        </div>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/80 disabled:opacity-50"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {saving ? "Сохраняем..." : "Сохранить изменения"}
        </button>
        {saved && (
          <span className="flex items-center gap-1 text-sm text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            Сохранено
          </span>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Section 2: Professional Info                                       */
/* ------------------------------------------------------------------ */

function ProfessionalInfoSection() {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-6 shadow-[var(--shadow-card)]">
      <h2 className="stripe-left mb-5 text-lg font-semibold text-card-foreground">
        Профессиональная информация
      </h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Специализация</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Выберите..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cosmetologist">Косметолог</SelectItem>
              <SelectItem value="dermatologist">Дерматолог</SelectItem>
              <SelectItem value="salon-owner">Владелец салона</SelectItem>
              <SelectItem value="student">Студент</SelectItem>
              <SelectItem value="other">Другое</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Стаж работы</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Выберите..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="<1">{"Менее 1 года"}</SelectItem>
              <SelectItem value="1-3">1-3 года</SelectItem>
              <SelectItem value="3-5">3-5 лет</SelectItem>
              <SelectItem value="5-10">5-10 лет</SelectItem>
              <SelectItem value="10+">{"Более 10 лет"}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="workplace">Место работы</Label>
          <Input id="workplace" placeholder="Укажите место работы" />
        </div>
      </div>

      <button
        type="button"
        className="mt-5 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/80"
      >
        Сохранить
      </button>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Section 3: Security                                                */
/* ------------------------------------------------------------------ */

function SecuritySection() {
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [saved, setSaved] = useState(false)

  /* Simple strength calculator */
  const strength =
    newPassword.length === 0
      ? 0
      : newPassword.length < 6
        ? 1
        : newPassword.length < 10
          ? 2
          : 3

  const strengthLabel = ["", "Слабый", "Средний", "Сильный"]
  const strengthColor = ["", "bg-destructive", "bg-accent", "bg-green-500"]

  const handleChangePassword = useCallback(async () => {
    setError("")
    setSaved(false)

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Заполните все поля")
      return
    }
    if (newPassword.length < 8) {
      setError("Новый пароль должен быть не короче 8 символов")
      return
    }
    if (newPassword !== confirmPassword) {
      setError("Пароли не совпадают")
      return
    }

    setSaving(true)
    try {
      const response = await fetch("/api/profile/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || "Не удалось изменить пароль")
        return
      }
      setSaved(true)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } finally {
      setSaving(false)
    }
  }, [currentPassword, newPassword, confirmPassword])

  return (
    <div className="rounded-xl border border-border/60 bg-card p-6 shadow-[var(--shadow-card)]">
      <div className="mb-5 flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold text-card-foreground">
          Безопасность
        </h2>
      </div>

      <div className="space-y-4 max-w-md">
        {/* Current password */}
        <div className="space-y-1.5">
          <Label htmlFor="currentPw">Текущий пароль</Label>
          <div className="relative">
            <Input
              id="currentPw"
              type={showCurrent ? "text" : "password"}
              placeholder="Введите текущий пароль"
              className="pr-10"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowCurrent((v) => !v)}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showCurrent ? "Скрыть пароль" : "Показать пароль"}
            >
              {showCurrent ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* New password */}
        <div className="space-y-1.5">
          <Label htmlFor="newPw">Новый пароль</Label>
          <div className="relative">
            <Input
              id="newPw"
              type={showNew ? "text" : "password"}
              placeholder="Введите новый пароль"
              className="pr-10"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowNew((v) => !v)}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showNew ? "Скрыть пароль" : "Показать пароль"}
            >
              {showNew ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {/* Strength indicator */}
          {newPassword.length > 0 && (
            <div className="flex items-center gap-2 pt-1">
              <div className="flex flex-1 gap-1">
                {[1, 2, 3].map((level) => (
                  <div
                    key={level}
                    className={`h-1.5 flex-1 rounded-full transition-colors ${
                      level <= strength ? strengthColor[strength] : "bg-border"
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                {strengthLabel[strength]}
              </span>
            </div>
          )}
        </div>

        {/* Confirm password */}
        <div className="space-y-1.5">
          <Label htmlFor="confirmPw">Подтвердите пароль</Label>
          <Input
            id="confirmPw"
            type="password"
            placeholder="Повторите новый пароль"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {saved && (
        <p className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-green-500/10 px-3 py-2 text-sm text-green-700">
          <CheckCircle2 className="h-4 w-4" />
          Пароль успешно изменён
        </p>
      )}

      <button
        type="button"
        onClick={handleChangePassword}
        disabled={saving}
        className="mt-5 rounded-lg bg-secondary px-5 py-2.5 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-secondary/90"
      >
        {saving ? "Сохраняем..." : "Изменить пароль"}
      </button>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Section 4: Notifications                                           */
/* ------------------------------------------------------------------ */

function NotificationsSection() {
  const [toggles, setToggles] = useState({
    email: true,
    sms: false,
    push: true,
    newsletter: true,
  })

  const handleToggle = useCallback((key: keyof typeof toggles) => {
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }))
  }, [])

  const items = [
    {
      key: "email" as const,
      label: "Email-уведомления о новых уроках",
    },
    {
      key: "sms" as const,
      label: "SMS-напоминания о вебинарах",
    },
    {
      key: "push" as const,
      label: "Push-уведомления",
    },
    {
      key: "newsletter" as const,
      label: "Рассылка новостей и акций",
    },
  ]

  return (
    <div className="rounded-xl border border-border/60 bg-card p-6 shadow-[var(--shadow-card)]">
      <h2 className="stripe-left mb-5 text-lg font-semibold text-card-foreground">
        Уведомления
      </h2>
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.key} className="flex items-center justify-between">
            <Label className="cursor-pointer text-sm font-normal text-card-foreground">
              {item.label}
            </Label>
            <Switch
              checked={toggles[item.key]}
              onCheckedChange={() => handleToggle(item.key)}
              aria-label={item.label}
            />
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        Изменения сохраняются автоматически
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Section 5: Order History                                           */
/* ------------------------------------------------------------------ */

interface Order {
  id: string
  title: string
  price: string
  date: string
  status: "paid" | "delivering"
  details?: string
}

// TODO: загружать историю заказов из БД, когда будет модель Order
const orders: Order[] = []

function OrderHistorySection() {
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <div className="rounded-xl border border-border/60 bg-card p-6 shadow-[var(--shadow-card)]">
      <h2 className="stripe-left mb-5 text-lg font-semibold text-card-foreground">
        История заказов
      </h2>

      <div className="space-y-3">
        {orders.length === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Заказов пока нет
          </p>
        )}
        {orders.map((order) => {
          const isOpen = expanded === order.id
          return (
            <div
              key={order.id}
              className="rounded-lg border border-border bg-background p-4"
            >
              <button
                type="button"
                className="flex w-full items-center gap-3 text-left"
                onClick={() => setExpanded(isOpen ? null : order.id)}
                aria-expanded={isOpen}
              >
                {/* Status icon */}
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                  {order.status === "paid" ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <Package className="h-4 w-4 text-accent" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="text-xs font-medium text-muted-foreground">
                      Заказ {order.id}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {order.date}
                    </span>
                  </div>
                  <p className="truncate text-sm font-medium text-card-foreground">
                    {order.title}
                  </p>
                </div>

                {/* Price + badge */}
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-sm font-semibold text-card-foreground">
                    {order.price}
                  </span>
                  <Badge
                    className={
                      order.status === "paid"
                        ? "bg-green-100 text-green-700 hover:bg-green-100"
                        : "bg-amber-100 text-amber-700 hover:bg-amber-100"
                    }
                  >
                    {order.status === "paid" ? "Оплачен" : "Доставляется"}
                  </Badge>
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </button>

              {/* Expanded details */}
              {isOpen && order.details && (
                <div className="mt-3 border-t border-border pt-3">
                  <p className="text-sm text-muted-foreground">
                    {order.details}
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Composed ProfileForm export                                        */
/* ------------------------------------------------------------------ */

export function ProfileForm() {
  return (
    <div className="space-y-6">
      <PersonalInfoSection />
      <ProfessionalInfoSection />
      <SecuritySection />
      <NotificationsSection />
      <OrderHistorySection />
    </div>
  )
}
