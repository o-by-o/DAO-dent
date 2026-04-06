import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/** GET /api/admin/courses — список всех курсов (только ADMIN) */
export async function GET() {
  const session = await auth()
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const courses = await prisma.course.findMany({
    include: {
      modules: {
        include: {
          _count: { select: { lessons: true } },
        },
        orderBy: { order: "asc" },
      },
      _count: {
        select: { enrollments: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  const list = courses.map((c) => ({
    id: c.id,
    title: c.title,
    slug: c.slug,
    description: c.description,
    thumbnailUrl: c.thumbnailUrl,
    published: c.published,
    author: c.author,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    modulesCount: c.modules.length,
    lessonsCount: c.modules.reduce((sum, m) => sum + m._count.lessons, 0),
    studentsCount: c._count.enrollments,
  }))

  return NextResponse.json({ courses: list })
}

/** POST /api/admin/courses — создать курс (только ADMIN) */
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json()
  const { title, description, slug, author, thumbnailUrl, published } = body as {
    title: string
    description?: string
    slug: string
    author?: string
    thumbnailUrl?: string
    published?: boolean
  }

  if (!title?.trim()) {
    return NextResponse.json({ error: "Укажите название курса" }, { status: 400 })
  }

  if (!slug?.trim()) {
    return NextResponse.json({ error: "Укажите slug курса" }, { status: 400 })
  }

  // Валидация формата slug
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug.trim())) {
    return NextResponse.json(
      { error: "Slug может содержать только латинские буквы, цифры и дефисы" },
      { status: 400 },
    )
  }

  // Валидация длины полей
  if (title.trim().length > 200) {
    return NextResponse.json({ error: "Название слишком длинное (максимум 200 символов)" }, { status: 400 })
  }
  if (description && description.trim().length > 5000) {
    return NextResponse.json({ error: "Описание слишком длинное (максимум 5000 символов)" }, { status: 400 })
  }

  // Проверить уникальность slug
  const existing = await prisma.course.findUnique({ where: { slug: slug.trim() } })
  if (existing) {
    return NextResponse.json({ error: "Курс с таким slug уже существует" }, { status: 400 })
  }

  const course = await prisma.course.create({
    data: {
      title: title.trim(),
      description: description?.trim() || null,
      slug: slug.trim(),
      author: author?.trim() || "Айхаана Данилова",
      thumbnailUrl: thumbnailUrl?.trim() || null,
      published: published ?? false,
    },
  })

  return NextResponse.json({ course })
}
