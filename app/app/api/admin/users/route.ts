import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { AccessGrantError, grantCourseAccess } from "@/lib/access"
import { sendAccessGrantedEmail } from "@/lib/email"

/** GET /api/admin/users — список пользователей (только ADMIN) */
export async function GET() {
  const session = await auth()
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const users = await prisma.user.findMany({
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
  })

  const now = new Date()
  const list = users.map((u) => ({
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

  return NextResponse.json({ users: list })
}

/** POST /api/admin/users — создать пользователя и выдать доступ к курсам */
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { email, name, courseIds, licenseDays } = body as {
      email: string
      name?: string
      courseIds: string[]
      licenseDays?: number
    }

    const result = await grantCourseAccess({
      email,
      name,
      courseIds,
      licenseDays,
    })

    const emailResult = await sendAccessGrantedEmail({
      to: result.user.email,
      name: result.user.name,
      temporaryPassword: result.temporaryPassword,
      courseTitles: result.courses.map((c) => c.title),
    })

    return NextResponse.json({
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        courses: result.courses.map((c) => ({
          title: c.title,
          slug: c.slug,
        })),
      },
      temporaryPassword: result.temporaryPassword,
      emailSent: emailResult.sent,
      emailError: emailResult.sent ? null : emailResult.reason ?? null,
      message: result.createdUser
        ? "Доступ создан. Пользователю отправлено письмо (если email-сервис настроен)."
        : "Доступ обновлён. Пользователю отправлено письмо (если email-сервис настроен).",
    })
  } catch (error) {
    if (error instanceof AccessGrantError) {
      const status =
        error.code === "INVALID_INPUT" || error.code === "ALREADY_ENROLLED"
          ? 400
          : 404
      return NextResponse.json({ error: error.message }, { status })
    }
    return NextResponse.json({ error: "Не удалось выдать доступ" }, { status: 500 })
  }
}
