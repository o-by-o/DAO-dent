import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { Calendar } from "lucide-react"

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface EventItemProps {
  /** Event title */
  title: string
  /** Date/time string */
  date: string
  /** Colored dot: "rose" | "gold" | "plum" */
  dotColor?: "rose" | "gold" | "plum"
}

/* ------------------------------------------------------------------ */
/*  Dot color map                                                      */
/* ------------------------------------------------------------------ */

const dotColors: Record<string, string> = {
  rose: "bg-primary",
  gold: "bg-accent",
  plum: "bg-secondary",
}

/* ------------------------------------------------------------------ */
/*  EventItem                                                          */
/* ------------------------------------------------------------------ */

export function EventItem({
  title,
  date,
  dotColor = "rose",
}: EventItemProps) {
  return (
    <div className="flex items-start gap-4 rounded-xl border border-border bg-card px-5 py-4 transition-shadow hover:shadow-sm">
      {/* Date icon */}
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
        <Calendar className="h-5 w-5 text-muted-foreground" />
      </span>

      {/* Text */}
      <div className="flex-1">
        <div className="flex items-center gap-2">
          {/* Colored status dot */}
          <span
            className={cn("h-2 w-2 shrink-0 rounded-full", dotColors[dotColor])}
            aria-hidden="true"
          />
          <p className="text-sm font-medium text-card-foreground">{title}</p>
        </div>
        <p className="mt-0.5 pl-4 text-xs text-muted-foreground">{date}</p>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Skeleton variant                                                   */
/* ------------------------------------------------------------------ */

export function EventItemSkeleton() {
  return (
    <div className="flex items-start gap-4 rounded-xl border border-border bg-card px-5 py-4">
      <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  )
}
