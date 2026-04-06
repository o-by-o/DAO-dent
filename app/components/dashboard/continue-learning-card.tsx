import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { PlayCircle } from "lucide-react"

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface ContinueLearningCardProps {
  /** Course title */
  courseTitle: string
  /** Current lesson label */
  currentLesson: string
  /** 0-100 progress */
  progress: number
  /** Link to resume */
  href?: string
}

/* ------------------------------------------------------------------ */
/*  ContinueLearningCard                                               */
/* ------------------------------------------------------------------ */

export function ContinueLearningCard({
  courseTitle,
  currentLesson,
  progress,
  href = "#",
}: ContinueLearningCardProps) {
  return (
    <a
      href={href}
      className="flex overflow-hidden rounded-xl border border-border/50 bg-card shadow-[var(--shadow-card)] transition-all duration-200 hover:shadow-[var(--shadow-card-hover)] hover:border-primary/20"
    >
      <div className="flex flex-col md:flex-row md:flex-1">
        <div className="flex h-32 shrink-0 items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20 md:w-40">
          <PlayCircle className="h-8 w-8 text-primary" />
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col justify-center gap-3 p-4 md:p-5">
          <div>
            <p className="mb-0.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Продолжить обучение
            </p>
            <h3 className="text-base font-semibold text-foreground md:text-lg">
              {courseTitle}
            </h3>
          </div>

          <p className="text-sm text-muted-foreground">{currentLesson}</p>

          {/* Progress */}
          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Прогресс курса</span>
              <span className="font-semibold text-foreground">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2.5" />
          </div>

          <span className="inline-flex w-fit items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            <PlayCircle className="h-3.5 w-3.5" />
            Продолжить
          </span>
        </div>
      </div>
    </a>
  )
}

/* ------------------------------------------------------------------ */
/*  Skeleton variant                                                   */
/* ------------------------------------------------------------------ */

export function ContinueLearningCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex flex-col md:flex-row">
        <Skeleton className="h-44 shrink-0 rounded-none md:h-48 md:w-64" />
        <div className="flex flex-1 flex-col gap-4 p-6 md:p-8">
          <div className="space-y-2">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-6 w-3/4" />
          </div>
          <Skeleton className="h-4 w-2/3" />
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-2.5 w-full rounded-full" />
          </div>
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>
      </div>
    </div>
  )
}
