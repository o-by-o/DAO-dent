"use client"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { StatsCard } from "@/components/dashboard/stats-card"
import { CourseCard } from "@/components/dashboard/course-card"
import { ContinueLearningCard } from "@/components/dashboard/continue-learning-card"
import { DiagnosticsCTAWidget } from "@/components/dashboard/diagnostics-cta-widget"
import type { Session } from "next-auth"
import {
  BookOpen,
  CheckCircle,
  Award,
  Clock,
  ArrowRight,
  ShoppingBag,
} from "lucide-react"

interface DashboardStats {
  courses: number
  completedLessons: number
  certificates: number
  hoursLearned: number
}

interface UserCourse {
  id: string
  title: string
  slug: string
  totalLessons: number
  completedLessons: number
  progress: number
  currentLesson: { id: string; title: string } | null
  currentModule: { title: string; order: number } | null
}

interface CertificateItem {
  id: string
  courseName: string
  certificateNumber: string
  status: "earned" | "in-progress"
  progress?: number
  courseHref: string
}

interface ShopProduct {
  id: string
  name: string
  imageUrl: string | null
  price: number | null
  brand: string | null
  slug: string | null
}

interface Props {
  userName: string
  stats: DashboardStats
  courses: UserCourse[]
  continueCourse: UserCourse | null
  skinAnalysisCount?: number
  certificates?: CertificateItem[]
  shopProducts?: ShopProduct[]
  session?: Session | null
}

export function DashboardClient({
  userName,
  stats,
  courses,
  continueCourse,
  skinAnalysisCount = 0,
  certificates = [],
  shopProducts = [],
  session,
}: Props) {
  const firstName = userName.split(" ")[0]
  const earnedCerts = certificates.filter((c) => c.status === "earned")

  return (
    <DashboardLayout activePath="/home" session={session ?? undefined}>
      {/* ========== Welcome ========== */}
      <section className="mb-8">
        <h1 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">
          Добро пожаловать, {firstName}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Продолжайте обучение
          {continueCourse && (
            <> — вы прошли {continueCourse.progress}% курса «{continueCourse.title}»</>
          )}
          .
        </p>
      </section>

      {/* ========== Stats ========== */}
      <section className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Мои курсы", value: String(stats.courses), icon: BookOpen, iconBg: "bg-primary/10", iconColor: "text-primary" },
          { label: "Завершено уроков", value: String(stats.completedLessons), icon: CheckCircle, iconBg: "bg-muted", iconColor: "text-muted-foreground" },
          { label: "Сертификаты", value: String(stats.certificates), icon: Award, iconBg: "bg-muted", iconColor: "text-muted-foreground" },
          { label: "Часов обучения", value: String(stats.hoursLearned), icon: Clock, iconBg: "bg-muted", iconColor: "text-muted-foreground" },
        ].map((stat) => (
          <StatsCard key={stat.label} {...stat} />
        ))}
      </section>

      {/* ========== AI Diagnostics CTA ========== */}
      <section className="mb-8">
        <DiagnosticsCTAWidget analysisCount={skinAnalysisCount} />
      </section>

      {/* ========== Continue Learning ========== */}
      {continueCourse?.currentLesson && (
        <section className="mb-8">
          <ContinueLearningCard
            courseTitle={continueCourse.title}
            currentLesson={continueCourse.currentLesson.title}
            progress={continueCourse.progress}
            href={`/course/${continueCourse.slug}/${continueCourse.currentLesson.id}`}
          />
        </section>
      )}

      {/* ========== My Courses ========== */}
      <section className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Мои курсы</h2>
          <a
            href="/courses"
            className="flex items-center gap-1 text-sm font-medium text-accent transition-colors hover:text-accent/80"
          >
            Все курсы
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        {courses.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <CourseCard
                key={course.id}
                title={course.title}
                lessons={`${course.completedLessons}/${course.totalLessons} уроков`}
                progress={course.progress}
                status={
                  course.progress === 100
                    ? "Завершён"
                    : course.progress > 0
                      ? "В процессе"
                      : "Не начат"
                }
                statusVariant={
                  course.progress === 100
                    ? "completed"
                    : course.progress > 0
                      ? "inProgress"
                      : "notStarted"
                }
                thumbnailGradient="from-secondary to-primary"
                href={`/course/${course.slug}`}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border/60 bg-muted/30 py-12">
            <BookOpen className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Вы пока не записаны ни на один курс
            </p>
            <a
              href="/catalog"
              className="inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Перейти в каталог
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        )}
      </section>

      {/* ========== Certificates ========== */}
      {earnedCerts.length > 0 && (
        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Сертификаты</h2>
            <a
              href="/certificates"
              className="flex items-center gap-1 text-sm font-medium text-accent transition-colors hover:text-accent/80"
            >
              Все сертификаты
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {earnedCerts.map((cert) => (
              <a
                key={cert.id}
                href={cert.courseHref}
                className="flex items-center gap-3 rounded-xl border border-border/50 bg-card p-4 shadow-[var(--shadow-card)] boty-transition hover:shadow-[var(--shadow-card-hover)]"
              >
                <Award className="h-8 w-8 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {cert.courseName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    № {cert.certificateNumber}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* ========== Shop Recommendations ========== */}
      {shopProducts.length > 0 && (
        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Рекомендуем</h2>
            <a
              href="/shop"
              className="flex items-center gap-1 text-sm font-medium text-accent transition-colors hover:text-accent/80"
            >
              В магазин
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
            {shopProducts.map((p) => (
              <a
                key={p.id}
                href={p.slug ? `/shop` : "/shop"}
                className="group rounded-xl border border-border/50 bg-card p-3 shadow-[var(--shadow-card)] boty-transition hover:shadow-[var(--shadow-card-hover)]"
              >
                <div className="mb-2 flex h-20 items-center justify-center rounded-lg bg-muted/50">
                  {p.imageUrl ? (
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="h-full w-full rounded-lg object-cover"
                    />
                  ) : (
                    <ShoppingBag className="h-8 w-8 text-muted-foreground/40" />
                  )}
                </div>
                <p className="truncate text-xs font-medium text-foreground">
                  {p.name}
                </p>
                {p.brand && (
                  <p className="truncate text-[10px] text-muted-foreground">
                    {p.brand}
                  </p>
                )}
                {p.price != null && (
                  <p className="mt-1 text-xs font-semibold text-primary">
                    {p.price.toLocaleString("ru-RU", { maximumFractionDigits: 0 })} ₽
                  </p>
                )}
              </a>
            ))}
          </div>
        </section>
      )}
    </DashboardLayout>
  )
}
