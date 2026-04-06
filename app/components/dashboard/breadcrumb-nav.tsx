"use client"

import { ChevronRight, Home } from "lucide-react"

/* ------------------------------------------------------------------ */
/*  Path-to-label mapping                                              */
/* ------------------------------------------------------------------ */

const pathLabels: Array<{ prefix: string; label: string }> = [
  { prefix: "/admin/agent", label: "Агент" },
  { prefix: "/admin/courses", label: "Управление курсами" },
  { prefix: "/admin/users", label: "Управление пользователями" },
  { prefix: "/admin/clients", label: "Клиентская база" },
  { prefix: "/admin/warehouse", label: "Складские операции" },
  { prefix: "/admin/media", label: "Медиатека" },
  { prefix: "/admin/calendar", label: "Календарь" },
  { prefix: "/shop/checkout", label: "Оформление заказа" },
  { prefix: "/shop", label: "Магазин" },
  { prefix: "/course/", label: "Курс" },
  { prefix: "/courses", label: "Мои курсы" },
  { prefix: "/catalog", label: "Каталог курсов" },
  { prefix: "/diagnostics", label: "Диагностика лица" },
  { prefix: "/order-chat", label: "Заказ товаров" },
  { prefix: "/schedule", label: "Ежедневник" },
  { prefix: "/my-clients", label: "Мои клиенты" },
  { prefix: "/my-warehouse", label: "Мой склад" },
  { prefix: "/schedule", label: "Расписание" },
  { prefix: "/certificates", label: "Сертификаты" },
  { prefix: "/settings", label: "Настройки" },
  { prefix: "/support", label: "Поддержка" },
  { prefix: "/home", label: "Главная" },
]

/* ------------------------------------------------------------------ */
/*  BreadcrumbNav component                                            */
/* ------------------------------------------------------------------ */

interface BreadcrumbNavProps {
  activePath?: string
}

export function BreadcrumbNav({ activePath = "/home" }: BreadcrumbNavProps) {
  const currentLabel =
    pathLabels.find((item) => activePath === item.prefix || activePath.startsWith(item.prefix))
      ?.label ?? "Страница"

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
      {/* Home crumb */}
      <a
        href="/home"
        className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
      >
        <Home className="h-3.5 w-3.5" />
        <span className="sr-only">Главная</span>
      </a>

      {/* Only show separator + current page label if not on home */}
      {activePath !== "/home" && (
        <>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
          <span className="font-medium text-foreground">{currentLabel}</span>
        </>
      )}

      {/* On home, show label directly */}
      {activePath === "/home" && (
        <>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
          <span className="font-medium text-foreground">Главная</span>
        </>
      )}
    </nav>
  )
}
