export const dynamic = 'force-dynamic'

import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { CatalogClient } from "./catalog-client"

export default async function CatalogPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const userId = session.user.id
  const isAdmin = (session.user as { role?: string }).role === "ADMIN"

  // Получаем все опубликованные курсы (или все — для админа)
  const courses = await prisma.course.findMany({
    where: isAdmin ? {} : { published: true },
    include: {
      modules: {
        include: {
          _count: { select: { lessons: true } },
        },
        orderBy: { order: "asc" },
      },
      _count: {
        select: { enrollments: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  // Получаем записи пользователя
  const now = new Date()
  const enrollments = await prisma.enrollment.findMany({
    where: {
      userId,
      revokedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    select: { courseId: true },
  })
  const enrolledCourseIds = new Set(enrollments.map((e) => e.courseId))

  const catalogCourses = courses.map((course) => ({
    id: course.id,
    title: course.title,
    slug: course.slug,
    description: course.description,
    author: course.author,
    thumbnailUrl: course.thumbnailUrl,
    published: course.published,
    totalLessons: course.modules.reduce((sum, m) => sum + m._count.lessons, 0),
    totalModules: course.modules.length,
    studentsCount: course._count.enrollments,
    isEnrolled: enrolledCourseIds.has(course.id),
  }))

  return <CatalogClient courses={catalogCourses} isAdmin={isAdmin} />
}
