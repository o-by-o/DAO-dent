"use client"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { StatsCard } from "@/components/dashboard/stats-card"
import type { Session } from "next-auth"
import type {
  AdminDashboardStats,
  PopularCourse,
  RecentEnrollment,
} from "@/lib/queries"
import {
  Phone,
  Cake,
  Users,
  UserPlus,
  TrendingUp,
  ShoppingCart,
  GraduationCap,
  AlertTriangle,
  Sparkles,
  Package,
  ArrowRight,
} from "lucide-react"

interface UpcomingAlert {
  id: string
  type: "call" | "birthday"
  title: string
  clientId: string
  date: string
}

interface Props {
  userName: string
  stats: AdminDashboardStats
  popularCourses: PopularCourse[]
  recentEnrollments: RecentEnrollment[]
  upcomingAlerts?: UpcomingAlert[]
  session?: Session | null
}

function formatCurrency(amount: number): string {
  if (amount === 0) return "0 ₽"
  return amount.toLocaleString("ru-RU", { maximumFractionDigits: 0 }) + " ₽"
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
  })
}

export function AdminDashboardClient({
  userName,
  stats,
  popularCourses,
  recentEnrollments,
  upcomingAlerts = [],
  session,
}: Props) {
  const firstName = userName.split(" ")[0]
  const today = new Date().toLocaleDateString("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })

  return (
    <DashboardLayout activePath="/home" isAdmin session={session ?? undefined}>
      {/* ========== Welcome ========== */}
      <section className="mb-8">
        <h1 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">
          Добро пожаловать, {firstName}
        </h1>
        <p className="mt-1 text-sm capitalize text-muted-foreground">{today}</p>
      </section>

      {/* ========== Upcoming Alerts ========== */}
      {upcomingAlerts.length > 0 && (
        <section className="mb-6">
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
            <h3 className="mb-2 text-sm font-semibold text-primary">
              Ближайшие события ({upcomingAlerts.length})
            </h3>
            <div className="space-y-2">
              {upcomingAlerts.map((a) => (
                <a
                  key={a.id}
                  href={`/admin/clients/${a.clientId}`}
                  className="flex items-center gap-3 text-sm boty-transition hover:opacity-80"
                >
                  {a.type === "call" ? (
                    <Phone className="h-4 w-4 text-chart-2" />
                  ) : (
                    <Cake className="h-4 w-4 text-primary" />
                  )}
                  <span className="font-medium">{a.title}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {new Date(a.date).toLocaleDateString("ru-RU", {
                      day: "numeric",
                      month: "short",
                      hour: a.type === "call" ? "2-digit" : undefined,
                      minute: a.type === "call" ? "2-digit" : undefined,
                    })}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ========== Business Stats ========== */}
      <section className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatsCard
          label="Студентов"
          value={String(stats.totalStudents)}
          icon={Users}
          iconBg="bg-primary/10"
          iconColor="text-primary"
        />
        <StatsCard
          label="Новых за неделю"
          value={String(stats.newStudentsThisWeek)}
          icon={UserPlus}
          iconBg="bg-chart-3/10"
          iconColor="text-chart-3"
        />
        <StatsCard
          label="Выручка за месяц"
          value={formatCurrency(stats.revenueThisMonth)}
          icon={TrendingUp}
          iconBg="bg-chart-2/10"
          iconColor="text-chart-2"
        />
        <StatsCard
          label="Заказов за месяц"
          value={String(stats.ordersThisMonth)}
          icon={ShoppingCart}
          iconBg="bg-muted"
          iconColor="text-muted-foreground"
        />
        <StatsCard
          label="Курсов опубликовано"
          value={String(stats.publishedCourses)}
          icon={GraduationCap}
          iconBg="bg-muted"
          iconColor="text-muted-foreground"
        />
        <StatsCard
          label="Алерты по складу"
          value={String(stats.lowStockCount)}
          icon={AlertTriangle}
          iconBg={stats.lowStockCount > 0 ? "bg-destructive/10" : "bg-muted"}
          iconColor={stats.lowStockCount > 0 ? "text-destructive" : "text-muted-foreground"}
        />
      </section>

      {/* ========== Two columns: enrollments + popular courses ========== */}
      <section className="mb-8 grid gap-6 lg:grid-cols-2">
        {/* Recent enrollments */}
        <div className="rounded-xl border border-border/50 bg-card p-5 shadow-[var(--shadow-card)]">
          <h2 className="mb-4 text-base font-semibold text-foreground">
            Последние записи
          </h2>
          {recentEnrollments.length > 0 ? (
            <ul className="space-y-3">
              {recentEnrollments.map((e) => (
                <li
                  key={e.id}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">
                      {e.userName ?? e.userEmail}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {e.courseTitle}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatDate(e.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Пока нет записей</p>
          )}
        </div>

        {/* Popular courses */}
        <div className="rounded-xl border border-border/50 bg-card p-5 shadow-[var(--shadow-card)]">
          <h2 className="mb-4 text-base font-semibold text-foreground">
            Популярные курсы
          </h2>
          {popularCourses.length > 0 ? (
            <ul className="space-y-3">
              {popularCourses.map((c, i) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    <p className="truncate font-medium text-foreground">
                      {c.title}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {c.enrollmentCount} записей
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Нет курсов</p>
          )}
        </div>
      </section>

      {/* ========== Quick Actions ========== */}
      <section className="mb-8">
        <h2 className="mb-4 text-base font-semibold text-foreground">
          Быстрые действия
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            {
              label: "Создать курс",
              desc: "Через AI-агента",
              href: "/admin/agent",
              icon: Sparkles,
            },
            {
              label: "Склад и товары",
              desc: "Управление остатками",
              href: "/admin/warehouse",
              icon: Package,
            },
            {
              label: "Все студенты",
              desc: "Управление доступом",
              href: "/admin/users",
              icon: Users,
            },
          ].map((action) => (
            <a
              key={action.href}
              href={action.href}
              className="group flex items-center gap-3 rounded-xl border border-border/50 bg-card p-4 shadow-[var(--shadow-card)] boty-transition hover:shadow-[var(--shadow-card-hover)]"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <action.icon className="h-5 w-5 text-primary" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">
                  {action.label}
                </p>
                <p className="text-xs text-muted-foreground">{action.desc}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground boty-transition group-hover:translate-x-1 group-hover:text-primary" />
            </a>
          ))}
        </div>
      </section>
    </DashboardLayout>
  )
}
