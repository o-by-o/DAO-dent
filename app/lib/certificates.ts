import { prisma } from "@/lib/prisma"

/**
 * Генерация уникального номера сертификата
 * Формат: DIB-YYYY-XXXX-YYYY
 * где XXXX - последние 4 символа userId, YYYY - последние 4 символа courseId
 */
function generateCertificateNumber(userId: string, courseId: string): string {
  const crypto = require("crypto")
  const year = new Date().getFullYear()
  const hash = crypto
    .createHash("sha256")
    .update(`${userId}:${courseId}:${year}`)
    .digest("hex")
    .slice(0, 8)
    .toUpperCase()
  return `DIB-${year}-${hash}`
}

/**
 * Проверить, завершил ли пользователь курс (все уроки отмечены как completed)
 */
async function hasCompletedCourse(userId: string, courseId: string): Promise<boolean> {
  // Получить все уроки курса
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      modules: {
        include: {
          lessons: {
            select: { id: true },
          },
        },
      },
    },
  })

  if (!course) return false

  const allLessonIds = course.modules.flatMap((module) =>
    module.lessons.map((lesson) => lesson.id),
  )

  if (allLessonIds.length === 0) return false

  // Проверить прогресс пользователя
  const completedCount = await prisma.progress.count({
    where: {
      userId,
      lessonId: { in: allLessonIds },
      completed: true,
    },
  })

  return completedCount === allLessonIds.length
}

/**
 * Выдать сертификат пользователю за завершение курса
 * Вызывается автоматически при отметке последнего урока как completed
 */
export async function issueCertificateIfEligible(
  userId: string,
  courseId: string,
): Promise<{ issued: boolean; certificateId?: string; certificateNumber?: string }> {
  // Проверить, есть ли уже сертификат
  const existing = await prisma.certificate.findUnique({
    where: {
      userId_courseId: { userId, courseId },
    },
  })

  if (existing) {
    return { issued: false }
  }

  // Проверить, завершен ли курс
  const completed = await hasCompletedCourse(userId, courseId)

  if (!completed) {
    return { issued: false }
  }

  // Выдать сертификат
  const certificateNumber = generateCertificateNumber(userId, courseId)

  const certificate = await prisma.certificate.create({
    data: {
      userId,
      courseId,
      certificateNumber,
      issuedAt: new Date(),
    },
  })

  return {
    issued: true,
    certificateId: certificate.id,
    certificateNumber: certificate.certificateNumber,
  }
}

/**
 * Получить все сертификаты пользователя
 */
export async function getUserCertificates(userId: string) {
  return prisma.certificate.findMany({
    where: { userId },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          slug: true,
          thumbnailUrl: true,
        },
      },
    },
    orderBy: { issuedAt: "desc" },
  })
}

/**
 * Получить конкретный сертификат по ID
 */
export async function getCertificateById(certificateId: string) {
  return prisma.certificate.findUnique({
    where: { id: certificateId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      course: {
        select: {
          id: true,
          title: true,
          slug: true,
          author: true,
        },
      },
    },
  })
}
