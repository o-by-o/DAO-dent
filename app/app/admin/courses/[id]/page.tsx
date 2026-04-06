import { use } from "react"
import { prisma } from "@/lib/prisma"
import { parseLessonMaterials } from "@/lib/lesson-materials"
import { notFound } from "next/navigation"
import { CourseEditorClient } from "./course-editor-client"

interface Props {
  params: Promise<{ id: string }>
}

export default function CourseEditorPage(props: Props) {
  const { id } = use(props.params)
  return <CourseEditorPageContent id={id} />
}

async function CourseEditorPageContent({ id }: { id: string }) {
  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      modules: {
        include: {
          lessons: {
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

  if (!course) {
    notFound()
  }

  const courseData = {
    id: course.id,
    title: course.title,
    slug: course.slug,
    description: course.description,
    thumbnailUrl: course.thumbnailUrl,
    published: course.published,
    author: course.author,
    aiGenerated: course.aiGenerated ?? false,
    createdAt: course.createdAt.toISOString(),
    updatedAt: course.updatedAt.toISOString(),
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
        rotate90: l.rotate90,
        muxAssetId: l.muxAssetId,
        muxPlaybackId: l.muxPlaybackId,
        muxStatus: l.muxStatus,
        aiGenerated: l.aiGenerated ?? false,
        materials: parseLessonMaterials(l.materials, l.id),
      })),
    })),
  }

  return <CourseEditorClient course={courseData} />
}
