"use client"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import {
  MyCourseCard,
  type MyCourseData,
} from "@/components/dashboard/my-course-card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { BookOpen, ArrowRight } from "lucide-react"

const GRADIENTS = [
  "bg-gradient-to-br from-primary/60 to-secondary/80",
  "bg-gradient-to-br from-accent/50 to-secondary/70",
  "bg-gradient-to-br from-green-300/50 to-secondary/60",
  "bg-gradient-to-br from-blue-300/50 to-primary/60",
]

interface UserCourse {
  id: string
  title: string
  slug: string
  author: string
  totalLessons: number
  completedLessons: number
  progress: number
  totalModules: number
  currentModule: { title: string; order: number } | null
  currentLesson: { id: string; title: string } | null
  enrolledAt: string
  completedAt: string | null
}

function toMyCourseData(course: UserCourse, idx: number): MyCourseData {
  const status: MyCourseData["status"] =
    course.progress === 100
      ? "completed"
      : course.progress > 0
        ? "in-progress"
        : "in-progress"

  return {
    id: course.id,
    slug: course.slug,
    title: course.title,
    subtitle: course.currentModule
      ? `Раздел ${course.currentModule.order} из ${course.totalModules} • Урок ${course.completedLessons} из ${course.totalLessons}`
      : `${course.completedLessons} из ${course.totalLessons} уроков`,
    progress: course.progress,
    author: course.author,
    lastAccessed: course.enrolledAt,
    completedAt: course.completedAt || undefined,
    status,
    gradient: GRADIENTS[idx % GRADIENTS.length],
    continueHref: course.currentLesson
      ? `/course/${course.slug}/${course.currentLesson.id}`
      : `/course/${course.slug}`,
    detailsHref: `/course/${course.slug}`,
    ...(course.progress === 100 && { hasCertificate: true }),
  }
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <BookOpen className="h-9 w-9 text-muted-foreground" />
      </div>
      <p className="text-center text-sm text-muted-foreground">{message}</p>
      <a
        href="/catalog"
        className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
      >
        Перейти в каталог
        <ArrowRight className="h-4 w-4" />
      </a>
    </div>
  )
}

function TabBadge({ count }: { count: number }) {
  return (
    <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/20 px-1.5 text-[11px] font-bold text-primary-foreground">
      {count}
    </span>
  )
}

interface Props {
  courses: UserCourse[]
}

export function CoursesClient({ courses }: Props) {
  const myCourses = courses.map(toMyCourseData)
  const inProgress = myCourses.filter((c) => c.status === "in-progress")
  const completed = myCourses.filter((c) => c.status === "completed")
  const allSorted = [...inProgress, ...completed]

  return (
    <DashboardLayout activePath="/courses">
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">
          Отслеживайте прогресс и продолжайте обучение
        </p>
      </div>

      <Tabs defaultValue="in-progress">
        <TabsList className="mb-2 w-full justify-start sm:w-auto">
          <TabsTrigger value="in-progress">
            В процессе
            <TabBadge count={inProgress.length} />
          </TabsTrigger>
          <TabsTrigger value="completed">
            Завершённые
            <TabBadge count={completed.length} />
          </TabsTrigger>
          <TabsTrigger value="all">
            Все курсы
            <TabBadge count={allSorted.length} />
          </TabsTrigger>
        </TabsList>

        <TabsContent value="in-progress">
          {inProgress.length > 0 ? (
            <div className="flex flex-col gap-4">
              {inProgress.map((course) => (
                <MyCourseCard key={course.id} course={course} />
              ))}
            </div>
          ) : (
            <EmptyState message="У вас пока нет курсов в процессе" />
          )}
        </TabsContent>

        <TabsContent value="completed">
          {completed.length > 0 ? (
            <div className="flex flex-col gap-4">
              {completed.map((course) => (
                <MyCourseCard key={course.id} course={course} />
              ))}
            </div>
          ) : (
            <EmptyState message="У вас пока нет завершённых курсов" />
          )}
        </TabsContent>

        <TabsContent value="all">
          {allSorted.length > 0 ? (
            <div className="flex flex-col gap-4">
              {allSorted.map((course) => (
                <MyCourseCard key={course.id} course={course} />
              ))}
            </div>
          ) : (
            <EmptyState message="У вас пока нет курсов" />
          )}
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  )
}
