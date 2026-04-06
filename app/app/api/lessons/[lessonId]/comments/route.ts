import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { canAccessLesson } from "@/lib/access-control"

/**
 * GET /api/lessons/[lessonId]/comments
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

  const comments = await prisma.comment.findMany({
    where: { lessonId, parentId: null },
    include: {
      user: { select: { id: true, name: true, avatarUrl: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  })

  return NextResponse.json({
    comments: comments.map((comment) => ({
      id: comment.id,
      text: comment.text,
      userId: comment.user.id,
      userName: comment.user.name || "Аноним",
      avatarUrl: comment.user.avatarUrl,
      createdAt: comment.createdAt.toISOString(),
    })),
  })
}

/**
 * POST /api/lessons/[lessonId]/comments
 * Body: { text: string }
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
  const text = (body?.text as string | undefined)?.trim()
  if (!text) {
    return NextResponse.json({ error: "Введите текст комментария" }, { status: 400 })
  }
  if (text.length > 2000) {
    return NextResponse.json(
      { error: "Комментарий слишком длинный (максимум 2000 символов)" },
      { status: 400 },
    )
  }

  const created = await prisma.comment.create({
    data: {
      lessonId,
      userId: session.user.id,
      text,
      parentId: null,
    },
    include: {
      user: { select: { id: true, name: true, avatarUrl: true } },
    },
  })

  return NextResponse.json({
    comment: {
      id: created.id,
      text: created.text,
      userId: created.user.id,
      userName: created.user.name || "Аноним",
      avatarUrl: created.user.avatarUrl,
      createdAt: created.createdAt.toISOString(),
    },
  })
}
