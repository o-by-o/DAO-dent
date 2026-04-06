import { prisma } from "@/lib/prisma"
import { AdminCoursesClient } from "./admin-courses-client"

export default async function AdminCoursesPage() {
  const courses = await prisma.course.findMany({
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

  const coursesList = courses.map((c) => ({
    id: c.id,
    title: c.title,
    slug: c.slug,
    description: c.description,
    thumbnailUrl: c.thumbnailUrl,
    published: c.published,
    author: c.author,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    modulesCount: c.modules.length,
    lessonsCount: c.modules.reduce((sum, m) => sum + m._count.lessons, 0),
    studentsCount: c._count.enrollments,
  }))

  return <AdminCoursesClient initialCourses={coursesList} />
}
