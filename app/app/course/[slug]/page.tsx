export const dynamic = 'force-dynamic'

import { use } from "react"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { hasActiveEnrollment } from "@/lib/queries"
import { CourseDetailClient } from "./course-detail-client"

interface Props {
  params: Promise<{ slug: string }>
  searchParams?: Promise<{ preview?: string | string[] }>
}

export default function CoursePage(props: Props) {
  const { slug } = use(props.params)
  const sp = props.searchParams != null ? use(props.searchParams) : undefined
  return <CoursePageContent slug={slug} searchParams={sp} />
}

async function CoursePageContent({
  slug,
  searchParams: sp,
}: {
  slug: string
  searchParams: { preview?: string | string[] } | undefined
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const userId = session.user.id
  const isAdmin = (session.user as { role?: string }).role === "ADMIN"
  const previewRaw = sp?.preview
  const previewValue = Array.isArray(previewRaw) ? previewRaw[0] : previewRaw
  const previewFlag =
    previewValue === "1" || previewValue?.toLowerCase() === "true"
  const isPreview = isAdmin && previewFlag

  const course = await prisma.course.findUnique({
    where: { slug },
    include: {
      modules: {
        include: {
          lessons: {
            select: {
              id: true,
              title: true,
              description: true,
              order: true,
              durationMin: true,
              muxPlaybackId: true,
            },
            orderBy: { order: "asc" },
          },
        },
        orderBy: { order: "asc" },
      },
      _count: {
        select: { enrollments: true },
      },
    },
  })

  if (!course) redirect("/catalog")

  const isEnrolled = await hasActiveEnrollment(userId, course.id)
  const isEnrolledUI = isPreview ? true : isEnrolled
  const isAdminUI = isPreview ? false : isAdmin

  let completedLessonIds: string[] = []
  if (isEnrolled || isAdmin) {
    const progress = await prisma.progress.findMany({
      where: {
        userId,
        completed: true,
        lesson: {
          module: { courseId: course.id },
        },
      },
      select: { lessonId: true },
    })
    completedLessonIds = progress.map((p) => p.lessonId)
  }

  const totalLessons = course.modules.reduce(
    (sum, m) => sum + m.lessons.length,
    0,
  )
  const totalDuration = course.modules.reduce(
    (sum, m) => sum + m.lessons.reduce((s, l) => s + l.durationMin, 0),
    0,
  )

  return (
    <CourseDetailClient
      course={{
        id: course.id,
        title: course.title,
        slug: course.slug,
        description: course.description,
        author: course.author,
        thumbnailUrl: course.thumbnailUrl,
        published: course.published,
        totalLessons,
        totalModules: course.modules.length,
        totalDurationMin: totalDuration,
        studentsCount: course._count.enrollments,
        modules: course.modules.map((m) => ({
          id: m.id,
          title: m.title,
          order: m.order,
          lessons: m.lessons.map((l) => ({
            id: l.id,
            title: l.title,
            description: l.description,
            order: l.order,
            durationMin: l.durationMin,
            hasVideo: !!l.muxPlaybackId,
            isCompleted: completedLessonIds.includes(l.id),
          })),
        })),
      }}
      isEnrolled={isEnrolledUI}
      isAdmin={isAdminUI}
      isPreview={isPreview}
      editorHref={`/admin/courses/${course.id}`}
      completedCount={completedLessonIds.length}
    />
  )
}
