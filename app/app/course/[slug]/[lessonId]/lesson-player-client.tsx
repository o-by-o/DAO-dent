"use client"

import { useState, useCallback } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { CommentSection } from "@/components/dashboard/comment-section"
import {
  FileText,
  Download,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  BookOpen,
  Play,
  Lock,
} from "lucide-react"
import MuxPlayer from "@mux/mux-player-react"
import { formatSectionHeading } from "@/lib/course-display"

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface LessonData {
  id: string
  title: string
  description: string | null
  durationMin: number
  rotate90: boolean
  muxPlaybackId: string | null
  materials: {
    id: string
    name: string
    url: string
    size: string
    mimeType: string | null
  }[]
  isCompleted: boolean
  homework: {
    id: string
    fileName: string
    fileUrl: string
    comment: string | null
    status: "SUBMITTED" | "REVIEWED" | "REVISION_NEEDED"
    feedback: string | null
  } | null
}

interface ModuleForList {
  id: string
  title: string
  order: number
  lessons: {
    id: string
    title: string
    durationMin: number
    isCompleted: boolean
    isCurrent: boolean
    hasVideo: boolean
  }[]
}

interface Props {
  isPreview?: boolean
  editorHref?: string
  /** Override for DashboardLayout admin UI (used for preview mode). */
  isAdmin?: boolean
  lesson: LessonData
  module: { title: string; order: number }
  course: {
    title: string
    slug: string
    progress: number
    modules: ModuleForList[]
  }
  navigation: {
    prev: { id: string; title: string; slug: string } | null
    next: { id: string; title: string; slug: string } | null
  }
  comments: {
    id: string
    text: string
    userName: string
    avatarUrl: string | null
    createdAt: string
  }[]
  currentUserName: string
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function LessonPlayerClient({
  isPreview = false,
  editorHref,
  isAdmin,
  lesson,
  module,
  course,
  navigation,
  comments,
  currentUserName,
}: Props) {
  const [lessonCompleted, setLessonCompleted] = useState(lesson.isCompleted)
  const previewSuffix = isPreview ? "?preview=1" : ""

  const toggleCompleted = useCallback(async () => {
    if (isPreview) return

    const newState = !lessonCompleted
    setLessonCompleted(newState)

    // Отправить на сервер
    const response = await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lessonId: lesson.id,
        completed: newState,
      }),
    })
    if (!response.ok) {
      setLessonCompleted(!newState)
    }
  }, [isPreview, lessonCompleted, lesson.id])

  return (
    <DashboardLayout activePath="/courses" isAdmin={isAdmin}>
      {isPreview && (
        <div className="mb-6 flex flex-col gap-2 rounded-xl border border-border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
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

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* ====== LEFT: Video + Tabs ====== */}
        <div className="min-w-0 flex-1 space-y-6">
          {/* Video Player */}
          {lesson.muxPlaybackId ? (
            <div className="relative aspect-video overflow-hidden rounded-xl border border-border bg-black">
              {lesson.rotate90 ? (
                <div className="absolute left-1/2 top-1/2 h-[177.78%] w-[56.25%] -translate-x-1/2 -translate-y-1/2 rotate-90">
                  <MuxPlayer
                    playbackId={lesson.muxPlaybackId}
                    accentColor="#4A2040"
                    metadata={{
                      video_title: lesson.title,
                    }}
                    className="h-full w-full"
                    style={{ width: "100%", height: "100%" }}
                  />
                </div>
              ) : (
                <MuxPlayer
                  playbackId={lesson.muxPlaybackId}
                  accentColor="#4A2040"
                  metadata={{
                    video_title: lesson.title,
                  }}
                  style={{ aspectRatio: "16/9", width: "100%" }}
                />
              )}
            </div>
          ) : (
            <div className="flex aspect-video items-center justify-center rounded-xl border border-border bg-secondary/95">
              <div className="flex flex-col items-center gap-3">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
                  <Play className="h-7 w-7 text-primary" />
                </div>
                <p className="text-sm font-medium text-secondary-foreground">
                  {lesson.title}
                </p>
                <p className="text-xs text-secondary-foreground/60">
                  Видео будет доступно после загрузки
                </p>
              </div>
            </div>
          )}

          {/* Lesson title & meta */}
          <div className="space-y-1.5">
            <h2 className="text-balance text-xl font-bold leading-snug text-foreground">
              {lesson.title}
            </h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BookOpen className="h-4 w-4" />
            <span>{formatSectionHeading(module.order, module.title)}</span>
            <span>&middot;</span>
            <Clock className="h-4 w-4" />
            <span>{lesson.durationMin} мин</span>
          </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="description">
            <TabsList className="w-full flex-wrap">
              <TabsTrigger value="description">Описание</TabsTrigger>
              <TabsTrigger value="materials">Материалы</TabsTrigger>

              <TabsTrigger value="comments">Комментарии</TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="space-y-4">
              <div className="prose prose-sm max-w-none leading-relaxed text-foreground/85">
                {lesson.description ? (
                  <p>{lesson.description}</p>
                ) : (
                  <p className="text-muted-foreground">
                    Описание пока не добавлено.
                  </p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="materials">
              {lesson.materials.length > 0 ? (
                <div className="space-y-3">
                  {lesson.materials.map((mat) => (
                    <div
                      key={mat.id}
                      className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-muted/30"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {mat.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {mat.size}
                        </p>
                      </div>
                      <a
                        href={mat.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                        aria-label={`Скачать ${mat.name}`}
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Материалы для этого урока пока не добавлены.
                </p>
              )}
            </TabsContent>


            <TabsContent value="comments">
              <CommentSection
                lessonId={isPreview ? undefined : lesson.id}
                currentUserName={currentUserName}
                initialComments={comments}
              />
            </TabsContent>
          </Tabs>

          {/* Lesson navigation */}
          <div className="flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              {navigation.prev ? (
                <a
                  href={`/course/${navigation.prev.slug}/${navigation.prev.id}${previewSuffix}`}
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted/50"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Предыдущий урок
                </a>
              ) : (
                <span className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-muted-foreground opacity-50">
                  <ChevronLeft className="h-4 w-4" />
                  Предыдущий урок
                </span>
              )}

              {navigation.next ? (
                <a
                  href={`/course/${navigation.next.slug}/${navigation.next.id}${previewSuffix}`}
                  className="inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2.5 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/90"
                >
                  Следующий урок
                  <ChevronRight className="h-4 w-4" />
                </a>
              ) : (
                <span className="inline-flex items-center gap-2 rounded-lg bg-secondary/50 px-4 py-2.5 text-sm font-medium text-secondary-foreground/50">
                  Следующий урок
                  <ChevronRight className="h-4 w-4" />
                </span>
              )}
            </div>

            <label className="flex cursor-pointer select-none items-center gap-2">
              <button
                type="button"
                onClick={toggleCompleted}
                disabled={isPreview}
                className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${
                  lessonCompleted
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : "border-border bg-card text-transparent hover:border-primary"
                } disabled:cursor-not-allowed disabled:opacity-50`}
                aria-label="Отметить как пройденный"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
              </button>
              <span className="text-sm text-foreground">
                Отметить урок как пройденный
              </span>
            </label>
          </div>
        </div>

        {/* ====== RIGHT: Lesson list ====== */}
        <aside className="hidden w-[320px] shrink-0 lg:block">
          <div className="sticky top-24 rounded-xl border border-border bg-card p-4">
            <h3 className="mb-2 text-sm font-bold text-foreground">
              {course.title}
            </h3>
            <div className="mb-4">
              <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                <span>Прогресс</span>
                <span>{course.progress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${course.progress}%` }}
                />
              </div>
            </div>

            <div className="max-h-[60vh] space-y-4 overflow-y-auto">
              {course.modules.map((mod) => (
                <div key={mod.id}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {formatSectionHeading(mod.order, mod.title)}
                  </p>
                  <div className="space-y-1">
                    {mod.lessons.map((l) => (
                      <a
                        key={l.id}
                        href={`/course/${course.slug}/${l.id}${previewSuffix}`}
                        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs transition-colors ${
                          l.isCurrent
                            ? "bg-primary/10 font-medium text-foreground"
                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                        }`}
                      >
                        {l.isCompleted ? (
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                        ) : l.isCurrent ? (
                          <Play className="h-3.5 w-3.5 shrink-0 text-primary" />
                        ) : l.hasVideo ? (
                          <Play className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                        ) : (
                          <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
                        )}
                        <span className="flex-1 truncate">{l.title}</span>
                        <span className="shrink-0 text-[10px]">
                          {l.durationMin} мин
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </DashboardLayout>
  )
}
