import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { canAccessLesson } from "@/lib/access-control"
import { issueCertificateIfEligible } from "@/lib/certificates"

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { lessonId, completed } = await request.json()

  if (!lessonId || typeof completed !== "boolean") {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 })
  }

  const hasAccess = await canAccessLesson({
    lessonId,
    userId: session.user.id,
    role: (session.user as { role?: string }).role,
  })
  if (!hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const progress = await prisma.progress.upsert({
    where: {
      userId_lessonId: {
        userId: session.user.id,
        lessonId,
      },
    },
    update: {
      completed,
      completedAt: completed ? new Date() : null,
    },
    create: {
      userId: session.user.id,
      lessonId,
      completed,
      completedAt: completed ? new Date() : null,
    },
    include: {
      lesson: {
        include: {
          module: {
            select: {
              courseId: true,
            },
          },
        },
      },
    },
  })

  // Если урок отмечен как выполненный, проверить завершен ли курс
  // и выдать сертификат если это последний урок
  let certificateInfo = null
  if (completed) {
    const courseId = progress.lesson.module.courseId
    const result = await issueCertificateIfEligible(session.user.id, courseId)
    if (result.issued) {
      certificateInfo = {
        certificateId: result.certificateId,
        certificateNumber: result.certificateNumber,
      }
    }
  }

  return NextResponse.json({
    success: true,
    progress,
    certificate: certificateInfo,
  })
}
