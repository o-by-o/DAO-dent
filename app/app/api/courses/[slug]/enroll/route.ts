import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * POST /api/courses/[slug]/enroll
 *
 * Проверяет наличие активного enrollment.
 * Доступ предоставляется только через admin-панель (grant-access).
 * Студенты не могут самостоятельно записаться.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { slug } = await params

  const course = await prisma.course.findUnique({
    where: { slug },
    select: { id: true, published: true },
  })

  if (!course || !course.published) {
    return NextResponse.json({ error: "Курс не найден" }, { status: 404 })
  }

  const existing = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId: session.user.id,
        courseId: course.id,
      },
    },
  })

  if (!existing) {
    return NextResponse.json(
      { error: "Доступ к курсу не предоставлен. Обратитесь к администратору." },
      { status: 403 },
    )
  }

  const isRevoked = !!existing.revokedAt
  const isExpired =
    !!existing.expiresAt && existing.expiresAt <= new Date()

  if (isRevoked || isExpired) {
    return NextResponse.json(
      { error: "Доступ к курсу истёк или отозван. Обратитесь к администратору." },
      { status: 403 },
    )
  }

  return NextResponse.json({
    enrolled: true,
    message: "Вы записаны на этот курс",
  })
}
