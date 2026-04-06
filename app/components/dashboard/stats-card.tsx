import type React from "react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface StatsCardProps {
  /** Display label beneath the number */
  label: string
  /** Stat value to display prominently */
  value: string
  /** Lucide icon component */
  icon: React.ElementType
  /** Background + text classes for the icon circle */
  iconBg?: string
  /** Icon color class */
  iconColor?: string
}

/* ------------------------------------------------------------------ */
/*  StatsCard                                                          */
/* ------------------------------------------------------------------ */

export function StatsCard({
  label,
  value,
  icon: Icon,
  iconBg = "bg-primary/20",
  iconColor = "text-primary-foreground",
}: StatsCardProps) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border/50 bg-card p-4 shadow-[var(--shadow-card)] transition-shadow duration-200 hover:shadow-[var(--shadow-card-hover)]">
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
          iconBg,
        )}
      >
        <Icon className={cn("h-4 w-4", iconColor)} />
      </span>
      <div>
        <p className="text-xl font-semibold leading-none text-foreground">{value}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Skeleton variant for loading state                                 */
/* ------------------------------------------------------------------ */

export function StatsCardSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border/50 bg-card p-4">
      <Skeleton className="h-11 w-11 shrink-0 rounded-xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-6 w-12" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  )
}
