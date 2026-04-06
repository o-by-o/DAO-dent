import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { generateTemporaryPassword } from "@/lib/password"

export class AccessGrantError extends Error {
  code: "INVALID_INPUT" | "COURSE_NOT_FOUND" | "ALREADY_ENROLLED"

  constructor(
    code: "INVALID_INPUT" | "COURSE_NOT_FOUND" | "ALREADY_ENROLLED",
    message: string,
  ) {
    super(message)
    this.code = code
  }
}

export interface GrantCourseAccessInput {
  email: string
  name?: string | null
  courseIds: string[]
  licenseDays?: number
}

export interface GrantedCourseInfo {
  id: string
  title: string
  slug: string
}

export interface GrantCourseAccessResult {
  user: {
    id: string
    email: string
    name: string | null
  }
  temporaryPassword: string | null
  createdUser: boolean
  addedCourseIds: string[]
  reactivatedCourseIds: string[]
  courses: GrantedCourseInfo[]
}

function toExpiresAt(licenseDays?: number): Date | null {
  if (!licenseDays || licenseDays <= 0) return null
  return new Date(Date.now() + licenseDays * 24 * 60 * 60 * 1000)
}

export async function grantCourseAccess(
  input: GrantCourseAccessInput,
): Promise<GrantCourseAccessResult> {
  const email = input.email?.trim().toLowerCase()
  const name = input.name?.trim() || null
  const courseIds = [...new Set(input.courseIds ?? [])]

  if (!email) {
    throw new AccessGrantError("INVALID_INPUT", "Укажите email")
  }
  if (courseIds.length === 0) {
    throw new AccessGrantError("INVALID_INPUT", "Выберите хотя бы один курс")
  }

  const courses = await prisma.course.findMany({
    where: { id: { in: courseIds } },
    select: { id: true, title: true, slug: true },
  })
  if (courses.length !== courseIds.length) {
    throw new AccessGrantError("COURSE_NOT_FOUND", "Один или несколько курсов не найдены")
  }

  const expiresAt = toExpiresAt(input.licenseDays)

  return prisma.$transaction(async (tx) => {
    const existingUser = await tx.user.findUnique({
      where: { email },
      include: {
        enrollments: {
          select: { id: true, courseId: true, expiresAt: true, revokedAt: true },
        },
      },
    })

    if (!existingUser) {
      const temporaryPassword = generateTemporaryPassword(12)
      const hashedPassword = await bcrypt.hash(temporaryPassword, 12)

      const created = await tx.user.create({
        data: {
          email,
          name,
          hashedPassword,
          role: "STUDENT",
          enrollments: {
            create: courseIds.map((courseId) => ({ courseId, expiresAt })),
          },
        },
        select: { id: true, email: true, name: true },
      })

      return {
        user: created,
        temporaryPassword,
        createdUser: true,
        addedCourseIds: courseIds,
        reactivatedCourseIds: [],
        courses,
      }
    }

    if (name && name !== existingUser.name) {
      await tx.user.update({
        where: { id: existingUser.id },
        data: { name },
      })
      existingUser.name = name
    }

    const now = new Date()
    const enrollmentsByCourse = new Map(
      existingUser.enrollments.map((e) => [e.courseId, e]),
    )
    const addedCourseIds: string[] = []
    const reactivatedCourseIds: string[] = []

    for (const courseId of courseIds) {
      const existingEnrollment = enrollmentsByCourse.get(courseId)

      if (!existingEnrollment) {
        await tx.enrollment.create({
          data: {
            userId: existingUser.id,
            courseId,
            expiresAt,
          },
        })
        addedCourseIds.push(courseId)
        continue
      }

      const isRevoked = !!existingEnrollment.revokedAt
      const isExpired =
        !!existingEnrollment.expiresAt && existingEnrollment.expiresAt <= now

      if (isRevoked || isExpired) {
        await tx.enrollment.update({
          where: { id: existingEnrollment.id },
          data: {
            revokedAt: null,
            expiresAt,
          },
        })
        reactivatedCourseIds.push(courseId)
      }
    }

    if (addedCourseIds.length === 0 && reactivatedCourseIds.length === 0) {
      throw new AccessGrantError(
        "ALREADY_ENROLLED",
        "Пользователь уже записан на выбранные курсы",
      )
    }

    return {
      user: {
        id: existingUser.id,
        email: existingUser.email,
        name: existingUser.name,
      },
      temporaryPassword: null,
      createdUser: false,
      addedCourseIds,
      reactivatedCourseIds,
      courses,
    }
  })
}
