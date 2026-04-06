import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/** GET /api/admin/courses/[id] — подробности курса (только ADMIN) */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params

  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      modules: {
        include: {
          lessons: {
            orderBy: { order: "asc" },
          },
        },
        orderBy: { order: "asc" },
      },
      _count: {
        select: { enrollments: true },
      },
    },
  })

  if (!course) {
    return NextResponse.json({ error: "Курс не найден" }, { status: 404 })
  }

  return NextResponse.json({ course })
}

/** PUT /api/admin/courses/[id] — обновить курс (только ADMIN) */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json()
  const { title, description, slug, author, thumbnailUrl, published } = body as {
    title?: string
    description?: string
    slug?: string
    author?: string
    thumbnailUrl?: string
    published?: boolean
  }

  // Проверить что курс существует
  const existing = await prisma.course.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: "Курс не найден" }, { status: 404 })
  }

  // Проверить уникальность slug если изменяется
  if (slug && slug.trim() !== existing.slug) {
    const slugExists = await prisma.course.findUnique({ where: { slug: slug.trim() } })
    if (slugExists) {
      return NextResponse.json({ error: "Курс с таким slug уже существует" }, { status: 400 })
    }
  }

  const course = await prisma.course.update({
    where: { id },
    data: {
      ...(title !== undefined && { title: title.trim() }),
      ...(description !== undefined && { description: description.trim() || null }),
      ...(slug !== undefined && { slug: slug.trim() }),
      ...(author !== undefined && { author: author.trim() }),
      ...(thumbnailUrl !== undefined && { thumbnailUrl: thumbnailUrl.trim() || null }),
      ...(published !== undefined && { published }),
    },
  })

  return NextResponse.json({ course })
}

/** DELETE /api/admin/courses/[id] — удалить курс (только ADMIN) */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params

  const existing = await prisma.course.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: "Курс не найден" }, { status: 404 })
  }

  await prisma.course.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
