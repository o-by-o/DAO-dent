"use client"

import { useState, useCallback, useEffect } from "react"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Plus,
  BookOpen,
  Users,
  Layers,
  GraduationCap,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  Sparkles,
  MessageSquare,
  MoreHorizontal,
} from "lucide-react"
import { generateSlug } from "@/lib/utils"

interface CourseItem {
  id: string
  title: string
  slug: string
  description: string | null
  thumbnailUrl: string | null
  published: boolean
  author: string
  createdAt: string
  updatedAt: string
  modulesCount: number
  lessonsCount: number
  studentsCount: number
}

interface Props {
  initialCourses: CourseItem[]
}

export function AdminCoursesClient({ initialCourses }: Props) {
  const [mounted, setMounted] = useState(false)
  const [courses, setCourses] = useState(initialCourses)
  const [createOpen, setCreateOpen] = useState(false)

  useEffect(() => setMounted(true), [])
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [aiLoading, setAiLoading] = useState(false)
  const [aiPrompt, setAiPrompt] = useState("")

  // Form state
  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
  const [description, setDescription] = useState("")
  const [author, setAuthor] = useState("Айхаана Данилова")

  const handleTitleChange = useCallback(
    (value: string) => {
      setTitle(value)
      setSlug(generateSlug(value))
    },
    [generateSlug],
  )

  const handleGenerateDescription = useCallback(async () => {
    if (!title.trim()) return
    setAiLoading(true)
    try {
      const res = await fetch("/api/admin/ai-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          type: "course",
          customPrompt: aiPrompt.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (data.description) {
        setDescription(data.description)
      }
    } catch {
      // ignore
    } finally {
      setAiLoading(false)
    }
  }, [title, aiPrompt])

  const handleCreate = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError("")
      setLoading(true)
      try {
        const res = await fetch("/api/admin/courses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            slug: slug.trim(),
            description: description.trim() || undefined,
            author: author.trim(),
            published: false,
          }),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error || "Ошибка")
          return
        }
        // Redirect to edit the new course
        window.location.href = `/admin/courses/${data.course.id}`
      } finally {
        setLoading(false)
      }
    },
    [title, slug, description, author],
  )

  const handleTogglePublish = useCallback(
    async (courseId: string, currentPublished: boolean) => {
      try {
        const res = await fetch(`/api/admin/courses/${courseId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ published: !currentPublished }),
        })
        if (res.ok) {
          setCourses((prev) =>
            prev.map((c) =>
              c.id === courseId ? { ...c, published: !currentPublished } : c,
            ),
          )
        }
      } catch {
        // ignore
      }
    },
    [],
  )

  const handleDelete = useCallback(async (courseId: string) => {
    try {
      const res = await fetch(`/api/admin/courses/${courseId}`, {
        method: "DELETE",
      })
      if (res.ok) {
        setCourses((prev) => prev.filter((c) => c.id !== courseId))
        setDeleteConfirm(null)
      }
    } catch {
      // ignore
    }
  }, [])

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Создавайте и редактируйте курсы. После публикации они станут
              доступны в каталоге.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/admin/agent"
              className="inline-flex items-center gap-2 rounded-lg border border-primary/50 bg-primary/10 px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
            >
              <Sparkles className="h-4 w-4" />
              Агент
            </Link>
            <button
              type="button"
              onClick={() => {
                setTitle("")
                setSlug("")
                setDescription("")
                setAuthor("Айхаана Данилова")
                setAiPrompt("")
                setError("")
                setCreateOpen(true)
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Создать курс
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <GraduationCap className="h-4 w-4" />
              <span className="text-xs font-medium">Всего курсов</span>
            </div>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {courses.length}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Eye className="h-4 w-4" />
              <span className="text-xs font-medium">Опубликовано</span>
            </div>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {courses.filter((c) => c.published).length}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <BookOpen className="h-4 w-4" />
              <span className="text-xs font-medium">Всего уроков</span>
            </div>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {courses.reduce((sum, c) => sum + c.lessonsCount, 0)}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span className="text-xs font-medium">Всего студентов</span>
            </div>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {courses.reduce((sum, c) => sum + c.studentsCount, 0)}
            </p>
          </div>
        </div>

        {/* Course cards */}
        {courses.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-16">
            <GraduationCap className="mb-3 h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm font-medium text-muted-foreground">
              Курсов пока нет
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              Создайте первый курс, чтобы начать
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <div
                key={course.id}
                className="group relative flex flex-col rounded-xl border border-border bg-card transition-shadow hover:shadow-md"
              >
                {/* Card click-through (edit) */}
                <a
                  href={`/admin/courses/${course.id}`}
                  aria-label={`Открыть курс: ${course.title}`}
                  className="absolute inset-0 z-10 rounded-xl"
                />

                {/* Status badge */}
                <div className="flex items-center justify-between px-4 pt-4">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                      course.published
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    }`}
                  >
                    {course.published ? (
                      <Eye className="h-3 w-3" />
                    ) : (
                      <EyeOff className="h-3 w-3" />
                    )}
                    {course.published ? "Опубликован" : "Черновик"}
                  </span>
                  {mounted ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="relative z-20 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          aria-label="Открыть меню действий"
                          title="Действия"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuItem
                          onSelect={() => {
                            window.location.href = `/admin/courses/${course.id}`
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                          Редактировать
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => {
                            window.open(
                              `/course/${course.slug}?preview=1`,
                              "_blank",
                              "noopener,noreferrer",
                            )
                          }}
                        >
                          <Eye className="h-4 w-4" />
                          Посмотреть как студент
                        </DropdownMenuItem>
                        {course.published && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onSelect={() =>
                                handleTogglePublish(course.id, course.published)
                              }
                            >
                              <EyeOff className="h-4 w-4" />
                              Снять с публикации
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onSelect={() => setDeleteConfirm(course.id)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                          Удалить
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <div
                      className="relative z-20 flex items-center justify-center rounded-lg p-1.5 text-muted-foreground"
                      aria-hidden
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col px-4 pt-3 pb-4">
                  <h3 className="text-base font-semibold text-foreground line-clamp-2">
                    {course.title}
                  </h3>
                  {course.description && (
                    <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">
                      {course.description}
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Layers className="h-3.5 w-3.5" />
                      {course.modulesCount} разделов
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3.5 w-3.5" />
                      {course.lessonsCount} уроков
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {course.studentsCount} студентов
                    </span>
                  </div>

                  <div className="mt-auto pt-4">
                    {course.published ? (
                      <a
                        href={`/course/${course.slug}?preview=1`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative z-20 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                      >
                        <Eye className="h-4 w-4" />
                        Предпросмотр
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleTogglePublish(course.id, course.published)}
                        className="relative z-20 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                      >
                        <Eye className="h-4 w-4" />
                        Опубликовать
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create course modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Новый курс
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label
                htmlFor="course-title"
                className="mb-1 block text-sm font-medium text-foreground"
              >
                Название курса *
              </label>
              <input
                id="course-title"
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Основы инъекционной косметологии"
                required
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="course-slug"
                className="mb-1 block text-sm font-medium text-foreground"
              >
                URL-адрес (slug) *
              </label>
              <input
                id="course-slug"
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="osnovy-inektsionnoy-kosmetologii"
                required
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Используется в URL: /course/{slug || "..."}
              </p>
            </div>

            <div>
              <label
                htmlFor="course-description"
                className="mb-1 block text-sm font-medium text-foreground"
              >
                Описание
              </label>

              {/* AI prompt block */}
              <div className="mb-2 rounded-lg border border-violet-200 bg-violet-50/50 p-3 dark:border-violet-800 dark:bg-violet-950/30">
                <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-violet-700 dark:text-violet-300">
                  <MessageSquare className="h-3.5 w-3.5" />
                  Промпт для ИИ
                </div>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  rows={2}
                  className="w-full rounded-md border border-violet-200 bg-white px-3 py-2 text-sm resize-none placeholder:text-violet-300 focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-400 dark:border-violet-700 dark:bg-violet-950/50 dark:placeholder:text-violet-600"
                  placeholder="Напиши подробное описание с акцентом на практические навыки..."
                />
                <div className="mt-1.5 flex items-center justify-between">
                  <p className="text-[11px] text-violet-500 dark:text-violet-400">
                    {aiPrompt.trim() ? "Будет использован ваш промпт" : "Без промпта — авто-генерация по названию"}
                  </p>
                  <button
                    type="button"
                    onClick={handleGenerateDescription}
                    disabled={!title.trim() || aiLoading}
                    className="inline-flex items-center gap-1.5 rounded-md bg-gradient-to-r from-violet-500 to-purple-600 px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    <Sparkles className="h-3 w-3" />
                    {aiLoading ? "Генерация..." : "Сгенерировать с ИИ"}
                  </button>
                </div>
              </div>

              <textarea
                id="course-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Описание курса..."
                rows={3}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none"
              />
            </div>

            <div>
              <label
                htmlFor="course-author"
                className="mb-1 block text-sm font-medium text-foreground"
              >
                Автор
              </label>
              <input
                id="course-author"
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Айхаана Данилова"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                {error}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={loading || !title.trim() || !slug.trim()}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                {loading ? "Создаём..." : "Создать курс"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation modal */}
      <Dialog
        open={deleteConfirm !== null}
        onOpenChange={() => setDeleteConfirm(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Удалить курс?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Это действие удалит курс и все его разделы, уроки. Действие
            необратимо.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setDeleteConfirm(null)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Удалить
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
