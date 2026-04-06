export const dynamic = 'force-dynamic'

import { use } from "react"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { parseLessonMaterials } from "@/lib/lesson-materials"
import { prisma } from "@/lib/prisma"
import { getLesson, getCourseWithLessons, hasActiveEnrollment } from "@/lib/queries"
import { LessonPlayerClient } from "./lesson-player-client"

interface Props {
  params: Promise<{ slug: string; lessonId: string }>
  searchParams?: Promise<{ preview?: string | string[] }>
}

export default function LessonPage(props: Props) {
  const { slug, lessonId } = use(props.params)
  const sp = props.searchParams != null ? use(props.searchParams) : undefined
  return (
    <LessonPageContent
      slug={slug}
      lessonId={lessonId}
      searchParams={sp}
    />
  )
}

async function LessonPageContent({
  slug,
  lessonId,
  searchParams: sp,
}: {
  slug: string
  lessonId: string
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
  const isAdminUI = isPreview ? false : isAdmin

  const course_ = await prisma.course.findUnique({ where: { slug }, select: { id: true } })
  if (!course_) redirect("/courses")
  if (!isAdmin) {
    const enrolled = await hasActiveEnrollment(userId, course_.id)
    if (!enrolled) redirect(`/course/${slug}`)
  }

  const [lesson, course] = await Promise.all([
    getLesson(lessonId, userId),
    getCourseWithLessons(slug, userId),
  ])

  if (!lesson || !course) redirect("/courses")

  const allLessons = course.modules.flatMap((m) =>
    m.lessons.map((l) => ({
      ...l,
      moduleTitle: m.title,
      moduleOrder: m.order,
    })),
  )
  const currentIdx = allLessons.findIndex((l) => l.id === lessonId)
  const prevLesson = currentIdx > 0 ? allLessons[currentIdx - 1] : null
  const nextLesson =
    currentIdx < allLessons.length - 1 ? allLessons[currentIdx + 1] : null

  return (
    <LessonPlayerClient
      isPreview={isPreview}
      editorHref={`/admin/courses/${course_.id}`}
      isAdmin={isAdminUI}
      lesson={{
        id: lesson.id,
        title: lesson.title,
        description: lesson.description,
        durationMin: lesson.durationMin,
        rotate90: lesson.rotate90,
        muxPlaybackId: lesson.muxPlaybackId,
        materials: parseLessonMaterials(lesson.materials, lesson.id),
        isCompleted: lesson.progress.length > 0 && lesson.progress[0].completed,
        homework: lesson.homeworks[0]
          ? {
              id: lesson.homeworks[0].id,
              fileName: lesson.homeworks[0].fileName,
              fileUrl: lesson.homeworks[0].fileUrl,
              comment: lesson.homeworks[0].comment,
              status: lesson.homeworks[0].status,
              feedback: lesson.homeworks[0].feedback,
            }
          : null,
      }}
      module={{
        title: lesson.module.title,
        order: lesson.module.order,
      }}
      course={{
        title: course.title,
        slug: slug,
        progress: course.progress,
        modules: course.modules.map((m) => ({
          id: m.id,
          title: m.title,
          order: m.order,
          lessons: m.lessons.map((l) => ({
            id: l.id,
            title: l.title,
            durationMin: l.durationMin,
            isCompleted: l.progress.length > 0 && l.progress[0].completed,
            isCurrent: l.id === lessonId,
            hasVideo: !!l.muxPlaybackId,
          })),
        })),
      }}
      navigation={{
        prev: prevLesson
          ? { id: prevLesson.id, title: prevLesson.title, slug }
          : null,
        next: nextLesson
          ? { id: nextLesson.id, title: nextLesson.title, slug }
          : null,
      }}
      comments={lesson.comments.map((c) => ({
        id: c.id,
        text: c.text,
        userName: c.user.name || "Аноним",
        avatarUrl: c.user.avatarUrl,
        createdAt: c.createdAt.toISOString(),
      }))}
      currentUserName={session.user.name || "Студент"}
    />
  )
}
