import { prisma } from "@/lib/prisma"

interface LessonAccessContext {
  lessonId: string
  userId: string
  role?: string
}

function activeEnrollmentWhere(userId: string, courseId: string) {
  const now = new Date()
  return {
    userId,
    courseId,
    revokedAt: null,
    OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
  }
}

export async function canAccessLesson({
  lessonId,
  userId,
  role,
}: LessonAccessContext) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: {
      id: true,
      module: {
        select: { courseId: true },
      },
    },
  })

  if (!lesson) return false
  if (role === "ADMIN") return true

  const enrollment = await prisma.enrollment.findFirst({
    where: activeEnrollmentWhere(userId, lesson.module.courseId),
    select: { id: true },
  })

  return !!enrollment
}
