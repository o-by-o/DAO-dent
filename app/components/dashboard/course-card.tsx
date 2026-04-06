import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowRight } from "lucide-react"

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface CourseCardProps {
  /** Course title */
  title: string
  /** Completed / total lessons string, e.g. "18/24 уроков" */
  lessons: string
  /** 0-100 progress percentage */
  progress: number
  /** Status badge label */
  status: string
  /** Badge visual variant */
  statusVariant?: "inProgress" | "notStarted" | "completed"
  /** Thumbnail gradient or image */
  thumbnailGradient?: string
  /** Link to the course detail */
  href?: string
}

/* ------------------------------------------------------------------ */
/*  Status badge style map                                             */
/* ------------------------------------------------------------------ */

const statusStyles: Record<string, string> = {
  inProgress: "bg-primary/10 text-primary border-primary/20",
  notStarted: "bg-muted text-muted-foreground border-border",
  completed: "bg-green-500/10 text-green-700 border-green-500/20",
}

/* ------------------------------------------------------------------ */
/*  CourseCard                                                         */
/* ------------------------------------------------------------------ */

export function CourseCard({
  title,
  lessons,
  progress,
  status,
  statusVariant = "inProgress",
  thumbnailGradient = "from-secondary to-primary",
  href = "#",
}: CourseCardProps) {
  return (
    <a
      href={href}
      className="group flex flex-col overflow-hidden rounded-xl border border-border/50 bg-card shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)] hover:border-primary/20"
    >
      <div
        className={cn(
          "h-24 w-full bg-gradient-to-br transition-transform duration-300 group-hover:scale-[1.02]",
          thumbnailGradient,
        )}
      />

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        {/* Badge */}
        <Badge
          className={cn(
            "w-fit text-[11px]",
            statusStyles[statusVariant],
          )}
        >
          {status}
        </Badge>

        {/* Title */}
        <h3 className="text-pretty text-sm font-semibold leading-snug text-foreground">
          {title}
        </h3>

        {/* Lessons count */}
        <p className="text-xs text-muted-foreground">{lessons}</p>

        {/* Progress */}
        <div className="mt-auto">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Прогресс</span>
            <span className="font-semibold text-foreground">{progress}%</span>
          </div>
          <Progress value={progress} />
        </div>

        <span className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
          Перейти
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </a>
  )
}

/* ------------------------------------------------------------------ */
/*  Skeleton variant                                                   */
/* ------------------------------------------------------------------ */

export function CourseCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border/50 bg-card">
      <Skeleton className="h-24 w-full rounded-none" />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-24" />
        <div className="mt-auto space-y-1.5">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
        <Skeleton className="mt-1 h-4 w-16" />
      </div>
    </div>
  )
}
