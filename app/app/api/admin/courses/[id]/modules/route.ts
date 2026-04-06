import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const ORDER_SHIFT = 10_000

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === "string")
}

/** POST /api/admin/courses/[id]/modules — добавить модуль к курсу */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id: courseId } = await params
  const body = await request.json()
  const { title } = body as { title: string }

  if (!title?.trim()) {
    return NextResponse.json({ error: "Укажите название раздела" }, { status: 400 })
  }

  // Определить следующий order
  const lastModule = await prisma.module.findFirst({
    where: { courseId },
    orderBy: { order: "desc" },
  })
  const nextOrder = (lastModule?.order ?? 0) + 1

  const module = await prisma.module.create({
    data: {
      title: title.trim(),
      order: nextOrder,
      courseId,
    },
    include: {
      lessons: true,
    },
  })

  return NextResponse.json({ module })
}

/**
 * PATCH /api/admin/courses/[id]/modules — переупорядочить модули курса
 * Body: { moduleIds: string[] }
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id: courseId } = await params
  const body = await request.json().catch(() => null)
  const moduleIds = body?.moduleIds as unknown

  if (!isStringArray(moduleIds) || moduleIds.length === 0) {
    return NextResponse.json({ error: "Укажите moduleIds" }, { status: 400 })
  }

  const uniqueIds = Array.from(new Set(moduleIds))
  if (uniqueIds.length !== moduleIds.length) {
    return NextResponse.json({ error: "moduleIds содержит дубликаты" }, { status: 400 })
  }

  const existing = await prisma.module.findMany({
    where: { courseId },
    select: { id: true },
  })
  const existingIds = existing.map((m) => m.id)

  if (existingIds.length !== moduleIds.length) {
    return NextResponse.json(
      { error: "Список moduleIds должен содержать все разделы курса" },
      { status: 400 },
    )
  }

  const existingSet = new Set(existingIds)
  for (const id of moduleIds) {
    if (!existingSet.has(id)) {
      return NextResponse.json({ error: "moduleIds содержит неверный id" }, { status: 400 })
    }
  }

  await prisma.$transaction(async (tx) => {
    // Сдвиг order, чтобы избежать коллизий @@unique([courseId, order])
    await tx.module.updateMany({
      where: { courseId },
      data: { order: { increment: ORDER_SHIFT } },
    })

    for (let i = 0; i < moduleIds.length; i++) {
      await tx.module.update({
        where: { id: moduleIds[i] },
        data: { order: i + 1 },
      })
    }
  })

  return NextResponse.json({ success: true })
}

/** PUT /api/admin/courses/[id]/modules — обновить модуль */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id: courseId } = await params
  const body = await request.json()
  const { moduleId, title } = body as { moduleId: string; title: string }

  if (!moduleId || !title?.trim()) {
    return NextResponse.json({ error: "Укажите moduleId и title" }, { status: 400 })
  }

  if (title.length > 500) {
    return NextResponse.json({ error: "Название слишком длинное" }, { status: 400 })
  }

  // Проверяем принадлежность модуля курсу
  const existing = await prisma.module.findFirst({
    where: { id: moduleId, courseId },
  })
  if (!existing) {
    return NextResponse.json({ error: "Раздел не найден в этом курсе" }, { status: 404 })
  }

  const module = await prisma.module.update({
    where: { id: moduleId },
    data: { title: title.trim() },
    include: { lessons: true },
  })

  return NextResponse.json({ module })
}

/** DELETE /api/admin/courses/[id]/modules — удалить модуль */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id: courseId } = await params
  const { searchParams } = new URL(request.url)
  const moduleId = searchParams.get("moduleId")

  if (!moduleId) {
    return NextResponse.json({ error: "Укажите moduleId" }, { status: 400 })
  }

  // Проверяем принадлежность модуля курсу
  const existing = await prisma.module.findFirst({
    where: { id: moduleId, courseId },
  })
  if (!existing) {
    return NextResponse.json({ error: "Раздел не найден в этом курсе" }, { status: 404 })
  }

  await prisma.$transaction(async (tx) => {
    await tx.module.delete({ where: { id: moduleId } })

    // Нормализуем order 1..N, чтобы не было "дыр" в нумерации
    const remaining = await tx.module.findMany({
      where: { courseId },
      orderBy: { order: "asc" },
      select: { id: true },
    })

    if (remaining.length === 0) return

    await tx.module.updateMany({
      where: { courseId },
      data: { order: { increment: ORDER_SHIFT } },
    })

    for (let i = 0; i < remaining.length; i++) {
      await tx.module.update({
        where: { id: remaining[i].id },
        data: { order: i + 1 },
      })
    }
  })

  return NextResponse.json({ success: true })
}
