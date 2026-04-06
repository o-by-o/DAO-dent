import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Star, Clock, BookOpen } from "lucide-react"

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface CatalogCourse {
  id: string
  title: string
  description: string
  /** "Бестселлер" | "Новинка" | "Скоро" | "Бесплатный вводный модуль" | null */
  badge: string | null
  /** "gold" | "green" | "purple" | "primary" */
  badgeColor: "gold" | "green" | "purple" | "primary" | null
  rating: number | null
  reviewCount: string | null
  lessonsCount: string
  duration: string
  price: string
  oldPrice: string | null
  /** If true, card is dimmed with "coming soon" styling */
  comingSoon: boolean
  authorName: string
  authorInitials: string
  thumbnailGradient: string
}

/* ------------------------------------------------------------------ */
/*  Badge color map                                                    */
/* ------------------------------------------------------------------ */

const badgeColorMap: Record<string, string> = {
  gold: "bg-[#C9A96E] text-[#2D1F2D] border-[#C9A96E]",
  green: "bg-emerald-500 text-white border-emerald-500",
  purple: "bg-[#7C3AED] text-white border-[#7C3AED]",
  primary: "bg-primary text-primary-foreground border-primary",
}

/* ------------------------------------------------------------------ */
/*  CatalogCourseCard                                                  */
/* ------------------------------------------------------------------ */

export function CatalogCourseCard({ course }: { course: CatalogCourse }) {
  const isFree = course.price === "Бесплатно"

  return (
    <div
      className={cn(
        "group flex flex-col overflow-hidden rounded-xl border border-border/50 bg-card shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)]",
        course.comingSoon && "opacity-75",
      )}
    >
      {/* ---- Thumbnail with badge overlay ---- */}
      <div className="relative h-40 w-full overflow-hidden">
        <div
          className={cn(
            "h-full w-full bg-gradient-to-br transition-transform duration-300 group-hover:scale-105",
            course.thumbnailGradient,
          )}
        />
        {/* Badge overlay */}
        {course.badge && course.badgeColor && (
          <Badge
            className={cn(
              "absolute left-3 top-3 text-[11px] shadow-sm",
              badgeColorMap[course.badgeColor],
            )}
          >
            {course.badge}
          </Badge>
        )}
      </div>

      {/* ---- Content ---- */}
      <div className="flex flex-1 flex-col gap-2.5 p-5">
        {/* Title */}
        <h3 className="text-pretty text-sm font-semibold leading-snug text-card-foreground line-clamp-2">
          {course.title}
        </h3>

        {/* Description */}
        <p className="text-xs leading-relaxed text-muted-foreground line-clamp-1">
          {course.description}
        </p>

        {/* Author row */}
        <div className="flex items-center gap-2">
          <Avatar className="h-5 w-5 border border-primary/20">
            <AvatarFallback className="bg-primary/20 text-[8px] font-semibold text-primary-foreground">
              {course.authorInitials}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground">
            {course.authorName}
          </span>
        </div>

        {/* Rating */}
        {course.rating !== null && (
          <div className="flex items-center gap-1.5">
            <Star className="h-3.5 w-3.5 fill-[#C9A96E] text-[#C9A96E]" />
            <span className="text-xs font-semibold text-foreground">
              {course.rating}
            </span>
            {course.reviewCount && (
              <span className="text-xs text-muted-foreground">
                ({course.reviewCount})
              </span>
            )}
          </div>
        )}

        {/* Lessons + duration */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <BookOpen className="h-3 w-3" />
            {course.lessonsCount}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {course.duration}
          </span>
        </div>

        {/* Spacer */}
        <div className="mt-auto" />

        {/* Price + CTA row */}
        <div className="flex items-center justify-between border-t-2 border-primary/15 pt-3">
          <div className="flex items-baseline gap-2">
            <span
              className={cn(
                "text-base font-bold",
                isFree ? "text-emerald-600" : "text-foreground",
              )}
            >
              {course.price}
            </span>
            {course.oldPrice && (
              <span className="text-xs text-muted-foreground line-through">
                {course.oldPrice}
              </span>
            )}
          </div>

          {course.comingSoon ? (
            <button
              type="button"
              className="rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/80"
            >
              В лист ожидания
            </button>
          ) : (
            <a
              href={`/course/${course.id}`}
              className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground transition-colors hover:bg-secondary/90"
            >
              Подробнее
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
