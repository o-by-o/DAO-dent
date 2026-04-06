import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { canAccessLesson } from "@/lib/access-control"

/**
 * GET /api/lessons/[lessonId]/homework
 * Возвращает последнее домашнее задание текущего пользователя по уроку.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ lessonId: string }> },
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { lessonId } = await params

  const hasAccess = await canAccessLesson({
    lessonId,
    userId: session.user.id,
    role: (session.user as { role?: string }).role,
  })
  if (!hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const homework = await prisma.homework.findFirst({
    where: { lessonId, userId: session.user.id },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({
    homework: homework
      ? {
          id: homework.id,
          fileName: homework.fileName,
          fileUrl: homework.fileUrl,
          comment: homework.comment,
          status: homework.status,
          feedback: homework.feedback,
          grade: homework.grade,
          createdAt: homework.createdAt.toISOString(),
        }
      : null,
  })
}

/**
 * POST /api/lessons/[lessonId]/homework
 * Body: { fileName: string, fileUrl: string, comment?: string }
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ lessonId: string }> },
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { lessonId } = await params

  const hasAccess = await canAccessLesson({
    lessonId,
    userId: session.user.id,
    role: (session.user as { role?: string }).role,
  })
  if (!hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const fileName = (body?.fileName as string | undefined)?.trim()
  const fileUrl = (body?.fileUrl as string | undefined)?.trim()
  const comment = (body?.comment as string | undefined)?.trim()

  if (!fileName || !fileUrl) {
    return NextResponse.json(
      { error: "Укажите имя файла и ссылку на файл" },
      { status: 400 },
    )
  }

  // Валидация URL — только https
  try {
    const parsed = new URL(fileUrl)
    if (parsed.protocol !== "https:") {
      return NextResponse.json(
        { error: "Ссылка на файл должна использовать HTTPS" },
        { status: 400 },
      )
    }
  } catch {
    return NextResponse.json(
      { error: "Некорректная ссылка на файл" },
      { status: 400 },
    )
  }

  if (fileName.length > 255) {
    return NextResponse.json(
      { error: "Имя файла слишком длинное" },
      { status: 400 },
    )
  }

  if (comment && comment.length > 2000) {
    return NextResponse.json(
      { error: "Комментарий слишком длинный (максимум 2000 символов)" },
      { status: 400 },
    )
  }

  const created = await prisma.homework.create({
    data: {
      lessonId,
      userId: session.user.id,
      fileName,
      fileUrl,
      comment: comment || null,
      status: "SUBMITTED",
    },
  })

  return NextResponse.json({
    homework: {
      id: created.id,
      fileName: created.fileName,
      fileUrl: created.fileUrl,
      comment: created.comment,
      status: created.status,
      createdAt: created.createdAt.toISOString(),
    },
    message: "Домашнее задание отправлено на проверку",
  })
}
