"use client"

import { useState, useMemo } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import {
  BookOpen,
  Clock,
  Users,
  Play,
  Settings,
  Lock,
  Eye,
  EyeOff,
  Search,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface CatalogCourseData {
  id: string
  title: string
  slug: string
  description: string | null
  author: string
  thumbnailUrl: string | null
  published: boolean
  totalLessons: number
  totalModules: number
  studentsCount: number
  isEnrolled: boolean
}

interface Props {
  courses: CatalogCourseData[]
  isAdmin: boolean
}

/* ------------------------------------------------------------------ */
/*  Gradients                                                          */
/* ------------------------------------------------------------------ */

const gradients = [
  "from-[#4A2040] to-[#E8B4B8]",
  "from-[#E8B4B8] to-[#C9A96E]",
  "from-[#C9A96E]/80 to-[#4A2040]",
  "from-[#4A2040]/70 to-[#7C3AED]/50",
  "from-[#E8B4B8]/80 to-[#4A2040]/60",
  "from-[#C9A96E] to-[#E8B4B8]",
]

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function CatalogClient({ courses, isAdmin }: Props) {
  const [search, setSearch] = useState("")

  const filteredCourses = useMemo(() => {
    if (!search.trim()) return courses
    const q = search.toLowerCase()
    return courses.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q)),
    )
  }, [courses, search])

  return (
    <DashboardLayout activePath="/catalog" isAdmin={isAdmin}>
      {/* Page header */}
      <section className="mb-6">
        <div className="mb-3 h-[3px] w-12 rounded-full bg-primary" />
        {isAdmin && (
          <h1 className="text-balance text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Все курсы
          </h1>
        )}
        <p className={`${isAdmin ? "mt-1.5" : ""} text-sm leading-relaxed text-muted-foreground`}>
          {isAdmin
            ? "Управление курсами платформы"
            : "Ваши доступные курсы обучения"}
        </p>
      </section>

      {/* Search */}
      {courses.length > 3 && (
        <section className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск курсов..."
              className="w-full rounded-xl border border-border bg-card pl-10 pr-4 py-2.5 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </section>
      )}

      {/* Courses grid */}
      {filteredCourses.length > 0 ? (
        <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((course, i) => (
            <CourseCard
              key={course.id}
              course={course}
              gradient={gradients[i % gradients.length]}
              isAdmin={isAdmin}
            />
          ))}
        </section>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-16">
          {search ? (
            <>
              <p className="text-sm font-medium text-muted-foreground">
                Ничего не найдено
              </p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                Попробуйте изменить поисковый запрос
              </p>
            </>
          ) : (
            <>
              <Lock className="mb-3 h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm font-medium text-muted-foreground">
                У вас пока нет доступных курсов
              </p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                Доступ к курсам предоставляется администратором
              </p>
            </>
          )}
        </div>
      )}
    </DashboardLayout>
  )
}

/* ------------------------------------------------------------------ */
/*  Course Card                                                        */
/* ------------------------------------------------------------------ */

function CourseCard({
  course,
  gradient,
  isAdmin,
}: {
  course: CatalogCourseData
  gradient: string
  isAdmin: boolean
}) {
  const initials = course.author
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  // Определяем доступность
  const hasAccess = isAdmin || course.isEnrolled

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-border/50 bg-card shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)] hover:border-primary/20">
      {/* Thumbnail */}
      <div className="relative h-40 w-full overflow-hidden">
        {course.thumbnailUrl ? (
          <img
            src={course.thumbnailUrl}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div
            className={`h-full w-full bg-gradient-to-br transition-transform duration-300 group-hover:scale-[1.03] ${gradient}`}
          />
        )}
        {/* Status badges */}
        <div className="absolute left-3 top-3 flex gap-1.5">
          {!course.published && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/90 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
              <EyeOff className="h-2.5 w-2.5" />
              Черновик
            </span>
          )}
          {hasAccess && course.published && (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-500/90 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
              <Eye className="h-2.5 w-2.5" />
              Доступен
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2.5 p-5">
        <h3 className="text-pretty text-sm font-semibold leading-snug text-card-foreground line-clamp-2">
          {course.title}
        </h3>

        <p className="text-xs leading-relaxed text-muted-foreground line-clamp-2">
          {course.description || "Описание скоро появится"}
        </p>

        {/* Author */}
        <div className="flex items-center gap-2">
          <Avatar className="h-5 w-5 border border-primary/20">
            <AvatarFallback className="bg-primary/20 text-[8px] font-semibold text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground">
            {course.author}
          </span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <BookOpen className="h-3 w-3" />
            {course.totalLessons} уроков
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {course.totalModules} разделов
          </span>
          {isAdmin && (
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {course.studentsCount}
            </span>
          )}
        </div>

        <div className="mt-auto" />

        {/* CTA */}
        <div className="flex items-center gap-2 border-t border-border pt-3">
          {hasAccess ? (
            <a
              href={`/course/${course.slug}`}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Play className="h-3.5 w-3.5" />
              Перейти к курсу
            </a>
          ) : (
            <div className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-muted px-3 py-2 text-xs font-medium text-muted-foreground">
              <Lock className="h-3.5 w-3.5" />
              Доступ по приглашению
            </div>
          )}
          {isAdmin && (
            <a
              href={`/admin/courses/${course.id}`}
              className="inline-flex items-center justify-center rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              title="Управление курсом"
            >
              <Settings className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
