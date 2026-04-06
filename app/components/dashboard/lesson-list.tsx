"use client"

import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion"
import { CheckCircle2, Lock, Play, Clock } from "lucide-react"

/* ------------------------------------------------------------------ */
/*  Data types                                                         */
/* ------------------------------------------------------------------ */

export type LessonStatus = "completed" | "current" | "locked"

export interface Lesson {
  id: string
  title: string
  duration: string
  status: LessonStatus
}

export interface Module {
  id: string
  title: string
  lessons: Lesson[]
}

/* ------------------------------------------------------------------ */
/*  Lesson row                                                         */
/* ------------------------------------------------------------------ */

function LessonRow({ lesson }: { lesson: Lesson }) {
  const isCurrent = lesson.status === "current"
  const isLocked = lesson.status === "locked"
  const isCompleted = lesson.status === "completed"

  return (
    <a
      href={isLocked ? undefined : "#"}
      aria-disabled={isLocked}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
        isCurrent && "bg-primary/15 font-medium text-foreground",
        isCompleted && "text-muted-foreground hover:bg-muted/50",
        isLocked && "cursor-not-allowed text-muted-foreground/50",
        !isCurrent && !isLocked && !isCompleted && "hover:bg-muted/50",
      )}
    >
      {/* Status icon */}
      {isCompleted && (
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
      )}
      {isCurrent && (
        <Play className="h-4 w-4 shrink-0 fill-primary text-primary" />
      )}
      {isLocked && (
        <Lock className="h-4 w-4 shrink-0" />
      )}

      {/* Title */}
      <span className="flex-1 truncate">{lesson.title}</span>

      {/* Duration badge */}
      <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
        <Clock className="h-3 w-3" />
        {lesson.duration}
      </span>
    </a>
  )
}

/* ------------------------------------------------------------------ */
/*  Module accordion                                                   */
/* ------------------------------------------------------------------ */

function getModuleProgress(lessons: Lesson[]): number {
  const completed = lessons.filter((l) => l.status === "completed").length
  return Math.round((completed / lessons.length) * 100)
}

/* ------------------------------------------------------------------ */
/*  LessonList -- full sidebar list                                    */
/* ------------------------------------------------------------------ */

interface LessonListProps {
  courseTitle: string
  overallProgress: number
  modules: Module[]
}

export function LessonList({
  courseTitle,
  overallProgress,
  modules,
}: LessonListProps) {
  /* Default open the module that contains the current lesson */
  const currentModuleId = modules.find((m) =>
    m.lessons.some((l) => l.status === "current"),
  )?.id

  return (
    <div className="flex flex-col gap-4">
      {/* Course header */}
      <div className="space-y-2 px-1">
        <h3 className="text-base font-semibold text-foreground leading-snug text-balance">
          {courseTitle}
        </h3>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Прогресс</span>
          <span className="font-medium text-foreground">{overallProgress}%</span>
        </div>
        <Progress value={overallProgress} className="h-2" />
      </div>

      {/* Module accordion */}
      <Accordion
        type="single"
        collapsible
        defaultValue={currentModuleId}
        className="space-y-1"
      >
        {modules.map((mod) => {
          const progress = getModuleProgress(mod.lessons)
          const allCompleted = progress === 100
          const hasCurrentLesson = mod.lessons.some(
            (l) => l.status === "current",
          )

          return (
            <AccordionItem
              key={mod.id}
              value={mod.id}
              className="rounded-lg border border-border bg-card/50 px-2"
            >
              <AccordionTrigger className="py-3 text-sm hover:no-underline">
                <div className="flex flex-1 items-center gap-2 pr-2 text-left">
                  {allCompleted && (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                  )}
                  {!allCompleted && hasCurrentLesson && (
                    <Play className="h-4 w-4 shrink-0 text-primary" />
                  )}
                  {!allCompleted && !hasCurrentLesson && (
                    <Lock className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                  )}
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium leading-snug">
                      {mod.title}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {mod.lessons.length} уроков &middot; {progress}%
                    </span>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-0.5 pb-2">
                {mod.lessons.map((lesson) => (
                  <LessonRow key={lesson.id} lesson={lesson} />
                ))}
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>
    </div>
  )
}
