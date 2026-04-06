"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Award, BookOpen, ArrowRight } from "lucide-react"

function formatDate(value?: string) {
  if (!value) return ""
  return new Date(value).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface MyCourseData {
  id: string
  slug: string
  title: string
  /** e.g. "Раздел 4 из 6 • Урок 18 из 24" */
  subtitle: string
  /** 0-100 progress percentage */
  progress: number
  /** Author name */
  author: string
  /** e.g. "2 часа назад" or "вчера" */
  lastAccessed?: string
  /** Completion date string, e.g. "28 января 2025" */
  completedAt?: string
  /** Whether certificate has been issued */
  hasCertificate?: boolean
  /** Status for determining card variant */
  status: "in-progress" | "completed"
  /** Gradient colors for thumbnail */
  gradient: string
  /** Route for continue/rewatch action */
  continueHref: string
  /** Route for details action */
  detailsHref: string
}

/* ------------------------------------------------------------------ */
/*  MyCourseCard                                                       */
/* ------------------------------------------------------------------ */

export function MyCourseCard({ course }: { course: MyCourseData }) {
  const isCompleted = course.status === "completed"

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card shadow-[var(--shadow-card)] transition-all duration-300 hover:shadow-[var(--shadow-card-hover)] sm:flex-row">
      {/* Thumbnail */}
      <div
        className={cn(
          "relative flex h-40 w-full shrink-0 items-center justify-center sm:h-auto sm:w-[200px]",
          course.gradient,
        )}
      >
        <BookOpen className="h-10 w-10 text-card/60" />

        {/* Completed checkmark overlay */}
        {isCompleted && (
          <div className="absolute inset-0 flex items-center justify-center bg-secondary/30">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-card">
              <Award className="h-6 w-6 text-accent" />
            </div>
          </div>
        )}
      </div>

      {/* Content area */}
      <div className="flex flex-1 flex-col justify-between gap-3 p-4 sm:p-5">
        {/* Top: title, subtitle, meta */}
        <div className="flex flex-col gap-1.5">
          <h3 className="text-base font-semibold text-card-foreground group-hover:text-primary sm:text-lg">
            {course.title}
          </h3>
          <p className="text-sm text-muted-foreground">{course.subtitle}</p>
        </div>

        {/* Progress bar */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Прогресс
            </span>
            <span
              className={cn(
                "text-xs font-bold",
                isCompleted ? "text-green-700" : "text-primary",
              )}
            >
              {course.progress}%
            </span>
          </div>
          <Progress
            value={course.progress}
            className="h-2.5"
            indicatorClassName={cn(
              isCompleted
                ? "bg-green-500"
                : "bg-gradient-to-r from-primary to-primary/70",
            )}
          />
        </div>

        {/* Bottom meta row */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Author */}
          <span className="text-xs text-muted-foreground">
            {course.author}
          </span>

          <span className="text-muted-foreground/40">|</span>

          {/* Last accessed or completion date */}
          {isCompleted && course.completedAt ? (
            <span className="text-xs text-muted-foreground">
              Завершён {formatDate(course.completedAt)}
            </span>
          ) : (
            course.lastAccessed && (
              <span className="text-xs text-muted-foreground">
                Последний вход: {formatDate(course.lastAccessed)}
              </span>
            )
          )}

          {/* Certificate badge */}
          {course.hasCertificate && (
            <Badge className="ml-auto border-green-500/20 bg-green-500/10 text-green-700 hover:bg-green-500/10">
              <Award className="mr-1 h-3 w-3" />
              Сертификат получен
            </Badge>
          )}
        </div>
      </div>

      {/* Action buttons (right column on desktop) */}
      <div className="flex shrink-0 flex-row items-center gap-2 border-t border-border p-4 sm:flex-col sm:justify-center sm:border-t-0 sm:border-l sm:px-5 sm:py-4">
        {isCompleted ? (
          <>
            <a
              href={course.continueHref}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-muted px-4 text-sm font-medium text-card-foreground transition-colors hover:bg-muted/80"
            >
              Пересмотреть
            </a>
            <button
              type="button"
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-accent px-4 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/80"
            >
              <Award className="h-4 w-4" />
              <span className="whitespace-nowrap">Скачать сертификат</span>
            </button>
          </>
        ) : (
          <>
            <a
              href={course.continueHref}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
            >
              Продолжить
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href={course.detailsHref}
              className="inline-flex h-9 items-center justify-center rounded-lg px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-card-foreground"
            >
              Подробнее
            </a>
          </>
        )}
      </div>
    </article>
  )
}

/* ------------------------------------------------------------------ */
/*  Skeleton loader                                                    */
/* ------------------------------------------------------------------ */

export function MyCourseCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card sm:flex-row">
      {/* Thumbnail skeleton */}
      <Skeleton className="h-40 w-full shrink-0 rounded-none sm:h-auto sm:w-[200px]" />

      {/* Content skeleton */}
      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-2.5 w-full rounded-full" />
        <div className="flex gap-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>

      {/* Actions skeleton */}
      <div className="flex shrink-0 flex-col items-center gap-2 border-t border-border p-4 sm:border-t-0 sm:border-l sm:px-5 sm:py-4">
        <Skeleton className="h-9 w-28 rounded-lg" />
        <Skeleton className="h-9 w-24 rounded-lg" />
      </div>
    </div>
  )
}
