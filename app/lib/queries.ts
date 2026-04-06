import { unstable_cache } from "next/cache"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"

/**
 * Фильтр для активных enrollment'ов:
 * - не отозван (revokedAt = null)
 * - не истёк (expiresAt = null ИЛИ expiresAt > now)
 */
function activeEnrollmentFilter(userId: string): Prisma.EnrollmentWhereInput {
  const now = new Date()
  return {
    userId,
    revokedAt: null,
    OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
  }
}

/**
 * Проверить, есть ли у пользователя активный доступ к курсу
 */
export async function hasActiveEnrollment(userId: string, courseId: string) {
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      ...activeEnrollmentFilter(userId),
      courseId,
    },
  })
  return !!enrollment
}

/**
 * Получить полные данные курса для плеера
 */
export async function getCourseWithLessons(slug: string, userId: string) {
  const course = await prisma.course.findUnique({
    where: { slug },
    include: {
      modules: {
        include: {
          lessons: {
            include: {
              progress: { where: { userId } },
            },
            orderBy: { order: "asc" },
          },
        },
        orderBy: { order: "asc" },
      },
    },
  })

  if (!course) return null

  const allLessons = course.modules.flatMap((moduleItem) => moduleItem.lessons)
  const completedLessons = allLessons.filter(
    (lessonItem) => lessonItem.progress.length > 0 && lessonItem.progress[0].completed,
  )

  return {
    ...course,
    totalLessons: allLessons.length,
    completedLessons: completedLessons.length,
    progress:
      allLessons.length > 0
        ? Math.round((completedLessons.length / allLessons.length) * 100)
        : 0,
  }
}

/**
 * Получить данные урока
 */
export async function getLesson(lessonId: string, userId: string) {
  return prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      module: {
        include: {
          course: true,
          lessons: { orderBy: { order: "asc" } },
        },
      },
      progress: { where: { userId } },
      comments: {
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } },
        },
        where: { parentId: null },
        orderBy: { createdAt: "desc" },
      },
      homeworks: {
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  })
}

/**
 * Получить все опубликованные курсы для каталога
 */
export async function getCatalogCourses() {
  const courses = await prisma.course.findMany({
    where: { published: true },
    include: {
      modules: {
        include: {
          _count: { select: { lessons: true } },
        },
      },
      _count: {
        select: { enrollments: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return courses.map((course) => ({
    id: course.id,
    title: course.title,
    slug: course.slug,
    description: course.description,
    author: course.author,
    thumbnailUrl: course.thumbnailUrl,
    totalLessons: course.modules.reduce(
      (sum, moduleItem) => sum + moduleItem._count.lessons,
      0,
    ),
    totalModules: course.modules.length,
    studentsCount: course._count.enrollments,
  }))
}

/**
 * Курсы пользователя с прогрессом (внутренняя, без кэша)
 */
async function getUserCoursesUncached(userId: string) {
  const enrollments = await prisma.enrollment.findMany({
    where: activeEnrollmentFilter(userId),
    include: {
      course: {
        include: {
          modules: {
            include: {
              lessons: {
                include: {
                  progress: {
                    where: { userId },
                    select: { completed: true, completedAt: true },
                  },
                },
                orderBy: { order: "asc" },
              },
            },
            orderBy: { order: "asc" },
          },
        },
      },
    },
  })

  return enrollments.map((enrollment) => {
    const course = enrollment.course
    const allLessons = course.modules.flatMap((moduleItem) => moduleItem.lessons)
    const completedLessons = allLessons.filter(
      (lessonItem) => lessonItem.progress.length > 0 && lessonItem.progress[0].completed,
    )
    const totalLessons = allLessons.length
    const progress =
      totalLessons > 0
        ? Math.round((completedLessons.length / totalLessons) * 100)
        : 0
    const currentLesson = allLessons.find(
      (lessonItem) =>
        lessonItem.progress.length === 0 || !lessonItem.progress[0].completed,
    )
    const currentModule = currentLesson
      ? course.modules.find((moduleItem) =>
          moduleItem.lessons.some((lessonItem) => lessonItem.id === currentLesson.id),
        )
      : null

    const completionDates = allLessons
      .map((lessonItem) => lessonItem.progress[0]?.completedAt)
      .filter((dateItem): dateItem is Date => !!dateItem)
      .sort((a, b) => b.getTime() - a.getTime())
    const isCompleted = totalLessons > 0 && completedLessons.length === totalLessons
    const completedAt = isCompleted
      ? completionDates[0] ?? enrollment.createdAt
      : null

    return {
      id: course.id,
      title: course.title,
      slug: course.slug,
      description: course.description,
      author: course.author,
      thumbnailUrl: course.thumbnailUrl,
      totalLessons,
      completedLessons: completedLessons.length,
      progress,
      currentLesson: currentLesson
        ? { id: currentLesson.id, title: currentLesson.title }
        : null,
      currentModule: currentModule
        ? { title: currentModule.title, order: currentModule.order }
        : null,
      totalModules: course.modules.length,
      enrolledAt: enrollment.createdAt.toISOString(),
      completedAt: completedAt?.toISOString() ?? null,
    }
  })
}

/**
 * Статистика дашборда (внутренняя, без кэша)
 */
async function getDashboardStatsUncached(userId: string) {
  const [enrollmentsCount, completedLessons, totalHours, certificatesCount] = await Promise.all(
    [
      prisma.enrollment.count({ where: activeEnrollmentFilter(userId) }),
      prisma.progress.count({ where: { userId, completed: true } }),
      prisma.progress
        .findMany({
          where: { userId, completed: true },
          include: { lesson: { select: { durationMin: true } } },
        })
        .then((progressItems) =>
          progressItems.reduce(
            (sum, progressItem) => sum + (progressItem.lesson.durationMin || 0),
            0,
          ),
        ),
      prisma.certificate.count({ where: { userId } }),
    ],
  )

  return {
    courses: enrollmentsCount,
    completedLessons,
    certificates: certificatesCount,
    hoursLearned: Math.round(totalHours / 60),
  }
}

/**
 * Статистика дашборда (кэш 30 с, чтобы не дергать БД при каждом заходе)
 */
export async function getDashboardStats(userId: string) {
  return unstable_cache(
    () => getDashboardStatsUncached(userId),
    [`dashboard-stats-${userId}`],
    { revalidate: 30, tags: [`dashboard-${userId}`] },
  )()
}

/**
 * Получить курсы пользователя с прогрессом.
 * Кэш 30 с — повторные заходы на главную не дергают БД.
 */
export async function getUserCourses(userId: string) {
  return unstable_cache(
    () => getUserCoursesUncached(userId),
    [`user-courses-${userId}`],
    { revalidate: 30, tags: [`dashboard-${userId}`] },
  )()
}

export interface UserCertificateItem {
  id: string
  courseName: string
  issuedDate: string
  certificateNumber: string
  status: "earned" | "in-progress"
  progress?: number
  courseHref: string
  certificateId?: string // ID записи сертификата в БД (только для earned)
}

function formatRuDate(date: Date | string) {
  const dateObj = typeof date === "string" ? new Date(date) : date
  return dateObj.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

/**
 * Получить все сертификаты пользователя (выданные + в процессе)
 */
export async function getUserCertificates(userId: string) {
  // Получить все курсы пользователя
  const courses = await getUserCourses(userId)

  // Получить все выданные сертификаты
  const earnedCertificates = await prisma.certificate.findMany({
    where: { userId },
    include: {
      course: {
        select: {
          id: true,
          slug: true,
        },
      },
    },
  })

  // Создать Map для быстрого поиска сертификатов по courseId
  const certificateMap = new Map(
    earnedCertificates.map((cert) => [cert.courseId, cert]),
  )

  return courses.map((course): UserCertificateItem => {
    const certificate = certificateMap.get(course.id)

    // Если есть реальный сертификат из БД - используем его
    if (certificate) {
      return {
        id: course.id,
        certificateId: certificate.id,
        courseName: course.title,
        issuedDate: formatRuDate(certificate.issuedAt),
        certificateNumber: certificate.certificateNumber,
        status: "earned",
        courseHref: `/course/${course.slug}`,
      }
    }

    // Иначе показываем курс в процессе прохождения
    return {
      id: course.id,
      courseName: course.title,
      issuedDate: formatRuDate(course.enrolledAt),
      certificateNumber: "—",
      status: "in-progress",
      progress: course.progress,
      courseHref: course.currentLesson
        ? `/course/${course.slug}/${course.currentLesson.id}`
        : `/course/${course.slug}`,
    }
  })
}

export type SkinAnalysisRow = {
  id: string
  imageUrl: string
  result: unknown
  createdAt: Date
}

/**
 * Последние AI-диагностики пользователя (для лендинга / превью в ЛК).
 */
export async function getRecentSkinAnalysesForUser(
  userId: string,
  limit = 4,
): Promise<SkinAnalysisRow[]> {
  return prisma.skinAnalysis.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { id: true, imageUrl: true, result: true, createdAt: true },
  })
}

export async function getSkinAnalysisCount(userId: string): Promise<number> {
  return prisma.skinAnalysis.count({ where: { userId } })
}

// ============================================
// Admin dashboard stats
// ============================================

export type AdminDashboardStats = {
  totalStudents: number
  newStudentsThisWeek: number
  revenueThisMonth: number
  ordersThisMonth: number
  publishedCourses: number
  lowStockCount: number
}

export const getAdminDashboardStats = unstable_cache(
  async (): Promise<AdminDashboardStats> => {
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const [
      totalStudents,
      newStudentsThisWeek,
      publishedCourses,
      ordersThisMonth,
      revenueAgg,
      lowStockCount,
    ] = await Promise.all([
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.user.count({
        where: { role: "STUDENT", createdAt: { gte: weekAgo } },
      }),
      prisma.course.count({ where: { published: true } }),
      prisma.order.count({
        where: { status: "PAID", createdAt: { gte: monthStart } },
      }),
      prisma.order.aggregate({
        where: { status: "PAID", createdAt: { gte: monthStart } },
        _sum: { totalAmount: true },
      }),
      prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(DISTINCT s."productId")::bigint as count
        FROM stocks s
        WHERE s.quantity < 5
      `.then((r) => Number(r[0]?.count ?? 0)),
    ])

    return {
      totalStudents,
      newStudentsThisWeek,
      revenueThisMonth: Number(revenueAgg._sum.totalAmount ?? 0),
      ordersThisMonth,
      publishedCourses,
      lowStockCount,
    }
  },
  ["admin-dashboard-stats"],
  { revalidate: 60 },
)

export type PopularCourse = {
  id: string
  title: string
  slug: string
  enrollmentCount: number
}

export async function getPopularCourses(limit = 5): Promise<PopularCourse[]> {
  const courses = await prisma.course.findMany({
    where: { published: true },
    select: {
      id: true,
      title: true,
      slug: true,
      _count: { select: { enrollments: true } },
    },
    orderBy: { enrollments: { _count: "desc" } },
    take: limit,
  })

  return courses.map((c) => ({
    id: c.id,
    title: c.title,
    slug: c.slug,
    enrollmentCount: c._count.enrollments,
  }))
}

export type RecentEnrollment = {
  id: string
  userName: string | null
  userEmail: string
  courseTitle: string
  createdAt: Date
}

export async function getRecentEnrollments(
  limit = 5,
): Promise<RecentEnrollment[]> {
  const enrollments = await prisma.enrollment.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      createdAt: true,
      user: { select: { name: true, email: true } },
      course: { select: { title: true } },
    },
  })

  return enrollments.map((e) => ({
    id: e.id,
    userName: e.user.name,
    userEmail: e.user.email,
    courseTitle: e.course.title,
    createdAt: e.createdAt,
  }))
}

// ============================================
// Upcoming alerts (calls + birthdays within N days)
// ============================================

export interface UpcomingAlert {
  id: string
  type: "call" | "birthday"
  title: string
  clientId: string
  date: string
}

export async function getUpcomingAlerts(days = 7): Promise<UpcomingAlert[]> {
  const now = new Date()
  const end = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
  const alerts: UpcomingAlert[] = []

  // Call reminders
  const notes = await prisma.clientNote.findMany({
    where: { callAt: { gte: now, lte: end } },
    include: { client: { select: { id: true, name: true } } },
    orderBy: { callAt: "asc" },
  })
  for (const n of notes) {
    alerts.push({
      id: `call-${n.id}`,
      type: "call",
      title: `Звонок: ${n.client.name}`,
      clientId: n.client.id,
      date: n.callAt!.toISOString(),
    })
  }

  // Birthdays within next N days
  const clients = await prisma.client.findMany({
    where: { birthDate: { not: null } },
    select: { id: true, name: true, birthDate: true },
  })
  for (const c of clients) {
    if (!c.birthDate) continue
    const bd = new Date(now.getFullYear(), c.birthDate.getMonth(), c.birthDate.getDate())
    if (bd < now) bd.setFullYear(bd.getFullYear() + 1)
    if (bd <= end) {
      alerts.push({
        id: `bday-${c.id}`,
        type: "birthday",
        title: `День рождения: ${c.name}`,
        clientId: c.id,
        date: bd.toISOString(),
      })
    }
  }

  alerts.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  return alerts
}
