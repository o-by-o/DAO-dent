"use client"

import { useState, useCallback } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Users,
  Layers,
  Play,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Film,
  Lock,
  Settings,
} from "lucide-react"
import { stripSectionPrefix } from "@/lib/course-display"

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface LessonInfo {
  id: string
  title: string
  description: string | null
  order: number
  durationMin: number
  hasVideo: boolean
  isCompleted: boolean
}

interface ModuleInfo {
  id: string
  title: string
  order: number
  lessons: LessonInfo[]
}

interface CourseInfo {
  id: string
  title: string
  slug: string
  description: string | null
  author: string
  thumbnailUrl: string | null
  published: boolean
  totalLessons: number
  totalModules: number
  totalDurationMin: number
  studentsCount: number
  modules: ModuleInfo[]
}

interface Props {
  course: CourseInfo
  isEnrolled: boolean
  isAdmin: boolean
  completedCount: number
  isPreview?: boolean
  editorHref?: string
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function CourseDetailClient({
  course,
  isEnrolled,
  isAdmin,
  completedCount,
  isPreview = false,
  editorHref,
}: Props) {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set(course.modules.slice(0, 2).map((m) => m.id)),
  )

  const hasAccess = isAdmin || isEnrolled

  const progress =
    course.totalLessons > 0
      ? Math.round((completedCount / course.totalLessons) * 100)
      : 0

  const toggleModule = useCallback((moduleId: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev)
      if (next.has(moduleId)) {
        next.delete(moduleId)
      } else {
        next.add(moduleId)
      }
      return next
    })
  }, [])

  // Найти первый незавершённый урок
  const firstIncompleteLesson = course.modules
    .flatMap((m) => m.lessons)
    .find((l) => !l.isCompleted)

  const firstLesson = course.modules[0]?.lessons[0]

  const totalHours = Math.floor(course.totalDurationMin / 60)
  const totalMinutes = course.totalDurationMin % 60
  const previewSuffix = isPreview ? "?preview=1" : ""

  return (
    <DashboardLayout activePath="/catalog" isAdmin={isAdmin}>
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Back link */}
        <a
          href="/catalog"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Назад к курсам
        </a>

        {isPreview && (
          <div className="flex flex-col gap-2 rounded-xl border border-border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-foreground">
              Предпросмотр: вы видите курс как студент
            </p>
            {editorHref && (
              <a
                href={editorHref}
                className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
              >
                Вернуться в редактор
              </a>
            )}
          </div>
        )}

        {/* Hero section */}
        <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-[var(--shadow-card)]">
          {/* Header: cover image or gradient */}
          <div className="relative h-48 w-full overflow-hidden sm:h-56">
            {course.thumbnailUrl ? (
              <>
                <img
                  src={course.thumbnailUrl}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40" />
              </>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-secondary to-primary" />
            )}
            <div className="absolute inset-0 bg-black/20" />
            <div className="relative flex h-full flex-col justify-end p-6 sm:p-8">
              <h1 className="text-balance text-2xl font-bold text-white sm:text-3xl">
                {course.title}
              </h1>
              <p className="mt-2 text-sm text-white/80">
                {course.author}
              </p>
            </div>
          </div>

          {/* Stats bar */}
          <div className="flex flex-wrap items-center gap-4 border-b border-border px-6 py-4 sm:gap-6 sm:px-8">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Layers className="h-4 w-4" />
              <span>{course.totalModules} разделов</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <BookOpen className="h-4 w-4" />
              <span>{course.totalLessons} уроков</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                {totalHours > 0 ? `${totalHours} ч ` : ""}
                {totalMinutes > 0 ? `${totalMinutes} мин` : totalHours > 0 ? "" : "—"}
              </span>
            </div>
            {isAdmin && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{course.studentsCount} студентов</span>
              </div>
            )}
          </div>

          {/* Description + CTA */}
          <div className="p-6 sm:p-8">
            {course.description && (
              <div className="mb-6">
                <h2 className="mb-2 text-base font-semibold text-foreground">
                  О курсе
                </h2>
                <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                  {course.description}
                </p>
              </div>
            )}

            {/* Actions */}
            {hasAccess ? (
              <div className="space-y-4">
                {/* Progress bar (for enrolled students) */}
                {isEnrolled && (
                  <div className="rounded-xl border border-border bg-muted/30 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">
                        Ваш прогресс
                      </span>
                      <span className="text-sm font-semibold text-primary">
                        {progress}%
                      </span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      Завершено {completedCount} из {course.totalLessons} уроков
                    </p>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex flex-wrap items-center gap-3">
                  <a
                    href={`/course/${course.slug}/${firstIncompleteLesson?.id ?? firstLesson?.id}${previewSuffix}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    <Play className="h-4 w-4" />
                    {completedCount > 0 ? "Продолжить обучение" : "Начать обучение"}
                  </a>

                  {isAdmin && (
                    <a
                      href={`/admin/courses/${course.id}`}
                      className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                    >
                      <Settings className="h-4 w-4" />
                      Управление курсом
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-5 dark:border-amber-800 dark:bg-amber-950/20">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                    <Lock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                      Доступ по приглашению
                    </p>
                    <p className="text-xs text-amber-600/70 dark:text-amber-400/70">
                      Для получения доступа к курсу обратитесь к администратору
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modules & Lessons */}
        <div className="rounded-2xl border border-border/50 bg-card shadow-[var(--shadow-card)]">
          <div className="border-b border-border px-6 py-4 sm:px-8">
            <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
              <Layers className="h-5 w-5 text-primary" />
              Программа курса
            </h2>
          </div>

          <div className="divide-y divide-border">
            {course.modules.map((module) => {
              const isExpanded = expandedModules.has(module.id)
              const moduleLessonsCompleted = module.lessons.filter(
                (l) => l.isCompleted,
              ).length
              const moduleProgress =
                module.lessons.length > 0
                  ? Math.round(
                      (moduleLessonsCompleted / module.lessons.length) * 100,
                    )
                  : 0

              return (
                <div key={module.id}>
                  {/* Module header */}
                  <button
                    type="button"
                    onClick={() => toggleModule(module.id)}
                    className="flex w-full items-center gap-3 px-6 py-4 text-left transition-colors hover:bg-muted/30 sm:px-8"
                  >
                    <span className="shrink-0 text-muted-foreground">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </span>
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                      {module.order}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {stripSectionPrefix(module.title) || "Раздел"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {module.lessons.length} уроков
                        {hasAccess && moduleLessonsCompleted > 0 && (
                          <span className="text-primary">
                            {" "}&middot; {moduleProgress}% пройдено
                          </span>
                        )}
                      </p>
                    </div>
                  </button>

                  {/* Lessons */}
                  {isExpanded && (
                    <div className="border-t border-border/50 bg-muted/10">
                      {module.lessons.map((lesson) => (
                        <div
                          key={lesson.id}
                          className="flex items-center gap-3 border-b border-border/30 px-6 py-3 pl-16 last:border-b-0 sm:pl-20"
                        >
                          {/* Status icon */}
                          {lesson.isCompleted ? (
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                          ) : hasAccess && lesson.hasVideo ? (
                            <Film className="h-4 w-4 shrink-0 text-primary/60" />
                          ) : hasAccess ? (
                            <Play className="h-4 w-4 shrink-0 text-muted-foreground/40" />
                          ) : (
                            <Lock className="h-4 w-4 shrink-0 text-muted-foreground/30" />
                          )}

                          {/* Lesson info */}
                          <div className="flex-1 min-w-0">
                            {hasAccess ? (
                              <a
                                href={`/course/${course.slug}/${lesson.id}${previewSuffix}`}
                                className="text-sm text-foreground transition-colors hover:text-primary"
                              >
                                {lesson.title}
                              </a>
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                {lesson.title}
                              </p>
                            )}
                            {lesson.description && (
                              <p className="truncate text-xs text-muted-foreground">
                                {lesson.description}
                              </p>
                            )}
                          </div>

                          {/* Duration */}
                          {lesson.durationMin > 0 && (
                            <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {lesson.durationMin} мин
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
