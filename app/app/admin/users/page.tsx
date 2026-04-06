import { prisma } from "@/lib/prisma"
import { AdminUsersClient } from "./admin-users-client"

export default async function AdminUsersPage() {
  const now = new Date()

  const [users, courses] = await Promise.all([
    prisma.user.findMany({
      where: { role: "STUDENT" },
      include: {
        enrollments: {
          include: {
            course: { select: { id: true, title: true, slug: true } },
          },
        },
        _count: { select: { progress: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.course.findMany({
      where: { published: true },
      select: { id: true, title: true, slug: true },
      orderBy: { title: "asc" },
    }),
  ])

  const usersList = users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    createdAt: u.createdAt.toISOString(),
    courses: u.enrollments.map((e) => {
      const isRevoked = !!e.revokedAt
      const isExpired = !!e.expiresAt && new Date(e.expiresAt) < now
      return {
        id: e.course.id,
        title: e.course.title,
        slug: e.course.slug,
        enrollmentId: e.id,
        expiresAt: e.expiresAt?.toISOString() ?? null,
        revokedAt: e.revokedAt?.toISOString() ?? null,
        status: isRevoked ? "revoked" as const : isExpired ? "expired" as const : "active" as const,
      }
    }),
    completedLessons: u._count.progress,
  }))

  const coursesList = courses.map((c) => ({
    id: c.id,
    title: c.title,
    slug: c.slug,
  }))

  return (
    <AdminUsersClient
      initialUsers={usersList}
      courses={coursesList}
    />
  )
}
