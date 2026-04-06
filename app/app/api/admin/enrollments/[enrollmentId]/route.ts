import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * PATCH /api/admin/enrollments/[enrollmentId] — отозвать или восстановить доступ
 * Body: { action: "revoke" | "restore" }
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ enrollmentId: string }> },
) {
  const session = await auth()
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { enrollmentId } = await params
  const body = await request.json()
  const { action } = body as { action: "revoke" | "restore" }

  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: { course: { select: { title: true } }, user: { select: { email: true } } },
  })

  if (!enrollment) {
    return NextResponse.json({ error: "Запись не найдена" }, { status: 404 })
  }

  if (action === "revoke") {
    const updated = await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { revokedAt: new Date() },
    })
    return NextResponse.json({
      enrollment: updated,
      message: `Доступ к курсу «${enrollment.course.title}» отозван для ${enrollment.user.email}`,
    })
  }

  if (action === "restore") {
    const now = new Date()
    const shouldClearExpiration =
      !!enrollment.expiresAt && enrollment.expiresAt <= now

    const updated = await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: {
        revokedAt: null,
        ...(shouldClearExpiration ? { expiresAt: null } : {}),
      },
    })
    return NextResponse.json({
      enrollment: updated,
      message: `Доступ к курсу «${enrollment.course.title}» восстановлен для ${enrollment.user.email}`,
    })
  }

  return NextResponse.json({ error: "Неизвестное действие" }, { status: 400 })
}

/**
 * DELETE /api/admin/enrollments/[enrollmentId] — полностью удалить запись (enrollment)
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ enrollmentId: string }> },
) {
  const session = await auth()
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { enrollmentId } = await params

  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
  })

  if (!enrollment) {
    return NextResponse.json({ error: "Запись не найдена" }, { status: 404 })
  }

  await prisma.enrollment.delete({
    where: { id: enrollmentId },
  })

  return NextResponse.json({ message: "Запись удалена" })
}
