import { unlink } from "node:fs/promises"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { parseLessonMaterials, resolveMaterialAbsolutePath } from "@/lib/lesson-materials"
import { prisma } from "@/lib/prisma"
import { isDefaultSectionTitle } from "@/lib/course-display"

const ORDER_SHIFT = 10_000

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === "string")
}

/** POST /api/admin/courses/[id]/lessons — добавить урок к модулю */
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
  const { moduleId, title, description, durationMin } = body as {
    moduleId: string
    title: string
    description?: string
    durationMin?: number
  }

  if (!moduleId || !title?.trim()) {
    return NextResponse.json({ error: "Укажите раздел и название" }, { status: 400 })
  }

  // Проверяем, что раздел существует и принадлежит курсу
  const module = await prisma.module.findFirst({
    where: { id: moduleId, courseId },
    select: { id: true, title: true },
  })
  if (!module) {
    return NextResponse.json({ error: "Раздел не найден в этом курсе" }, { status: 404 })
  }

  const normalizedTitle = title.trim()
  const normalizedDescription = description?.trim() || null
  const normalizedDuration = durationMin ?? 0

  const result = await prisma.$transaction(async (tx) => {
    // Определить следующий order
    const lastLesson = await tx.lesson.findFirst({
      where: { moduleId },
      orderBy: { order: "desc" },
      select: { order: true },
    })
    const nextOrder = (lastLesson?.order ?? 0) + 1

    const lesson = await tx.lesson.create({
      data: {
        title: normalizedTitle,
        description: normalizedDescription,
        order: nextOrder,
        durationMin: normalizedDuration,
        moduleId,
      },
    })

    // Если это первый урок в "дефолтном" разделе — переименовать раздел в название видео
    if (!lastLesson) {
      const freshModule = await tx.module.findUnique({
        where: { id: moduleId },
        select: { id: true, title: true },
      })
      if (freshModule && isDefaultSectionTitle(freshModule.title)) {
        const updatedModule = await tx.module.update({
          where: { id: moduleId },
          data: { title: normalizedTitle },
          select: { id: true, title: true },
        })
        return { lesson, module: updatedModule }
      }
    }

    return { lesson }
  })

  return NextResponse.json(result)
}

/**
 * PATCH /api/admin/courses/[id]/lessons — переупорядочить уроки внутри раздела
 * Body: { moduleId: string, lessonIds: string[] }
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
  const moduleId = body?.moduleId as unknown
  const lessonIds = body?.lessonIds as unknown

  const fromModuleId = body?.fromModuleId as unknown
  const toModuleId = body?.toModuleId as unknown
  const lessonId = body?.lessonId as unknown
  const fromLessonIds = body?.fromLessonIds as unknown
  const toLessonIds = body?.toLessonIds as unknown

  // ---- Mode 1: reorder lessons within a section ----
  if (typeof moduleId === "string") {
    if (!moduleId.trim()) {
      return NextResponse.json({ error: "Укажите moduleId" }, { status: 400 })
    }
    if (!isStringArray(lessonIds) || lessonIds.length === 0) {
      return NextResponse.json({ error: "Укажите lessonIds" }, { status: 400 })
    }

    const uniqueIds = Array.from(new Set(lessonIds))
    if (uniqueIds.length !== lessonIds.length) {
      return NextResponse.json({ error: "lessonIds содержит дубликаты" }, { status: 400 })
    }

    // Проверяем принадлежность раздела курсу
    const module = await prisma.module.findFirst({
      where: { id: moduleId, courseId },
      select: { id: true },
    })
    if (!module) {
      return NextResponse.json({ error: "Раздел не найден в этом курсе" }, { status: 404 })
    }

    const existingLessons = await prisma.lesson.findMany({
      where: { moduleId },
      select: { id: true },
    })
    const existingLessonIds = existingLessons.map((l) => l.id)

    if (existingLessonIds.length !== lessonIds.length) {
      return NextResponse.json(
        { error: "Список lessonIds должен содержать все уроки раздела" },
        { status: 400 },
      )
    }

    const existingSet = new Set(existingLessonIds)
    for (const id of lessonIds) {
      if (!existingSet.has(id)) {
        return NextResponse.json({ error: "lessonIds содержит неверный id" }, { status: 400 })
      }
    }

    await prisma.$transaction(async (tx) => {
      // Сдвиг order, чтобы избежать коллизий @@unique([moduleId, order])
      await tx.lesson.updateMany({
        where: { moduleId },
        data: { order: { increment: ORDER_SHIFT } },
      })

      for (let i = 0; i < lessonIds.length; i++) {
        await tx.lesson.update({
          where: { id: lessonIds[i] },
          data: { order: i + 1 },
        })
      }
    })

    return NextResponse.json({ success: true })
  }

  // ---- Mode 2: move lesson between sections ----
  if (
    typeof fromModuleId !== "string" ||
    !fromModuleId.trim() ||
    typeof toModuleId !== "string" ||
    !toModuleId.trim() ||
    typeof lessonId !== "string" ||
    !lessonId.trim()
  ) {
    return NextResponse.json({ error: "Укажите fromModuleId, toModuleId и lessonId" }, { status: 400 })
  }
  if (fromModuleId === toModuleId) {
    return NextResponse.json({ error: "fromModuleId и toModuleId должны отличаться" }, { status: 400 })
  }
  if (!isStringArray(fromLessonIds)) {
    return NextResponse.json({ error: "Укажите fromLessonIds" }, { status: 400 })
  }
  if (!isStringArray(toLessonIds) || toLessonIds.length === 0) {
    return NextResponse.json({ error: "Укажите toLessonIds" }, { status: 400 })
  }

  const uniqueFrom = Array.from(new Set(fromLessonIds))
  if (uniqueFrom.length !== fromLessonIds.length) {
    return NextResponse.json({ error: "fromLessonIds содержит дубликаты" }, { status: 400 })
  }
  const uniqueTo = Array.from(new Set(toLessonIds))
  if (uniqueTo.length !== toLessonIds.length) {
    return NextResponse.json({ error: "toLessonIds содержит дубликаты" }, { status: 400 })
  }
  if (fromLessonIds.includes(lessonId)) {
    return NextResponse.json({ error: "fromLessonIds не должен содержать lessonId" }, { status: 400 })
  }
  if (!toLessonIds.includes(lessonId)) {
    return NextResponse.json({ error: "toLessonIds должен содержать lessonId" }, { status: 400 })
  }

  const [fromModule, toModule] = await Promise.all([
    prisma.module.findFirst({
      where: { id: fromModuleId, courseId },
      select: { id: true },
    }),
    prisma.module.findFirst({
      where: { id: toModuleId, courseId },
      select: { id: true },
    }),
  ])
  if (!fromModule || !toModule) {
    return NextResponse.json({ error: "Раздел не найден в этом курсе" }, { status: 404 })
  }

  const movingLesson = await prisma.lesson.findFirst({
    where: { id: lessonId, moduleId: fromModuleId, module: { courseId } },
    select: { id: true, title: true },
  })
  if (!movingLesson) {
    return NextResponse.json({ error: "Урок не найден в этом разделе" }, { status: 404 })
  }

  const [existingFrom, existingTo] = await Promise.all([
    prisma.lesson.findMany({ where: { moduleId: fromModuleId }, select: { id: true } }),
    prisma.lesson.findMany({ where: { moduleId: toModuleId }, select: { id: true } }),
  ])
  const existingFromIds = existingFrom.map((l) => l.id)
  const existingToIds = existingTo.map((l) => l.id)

  if (!existingFromIds.includes(lessonId)) {
    return NextResponse.json({ error: "Урок не найден в этом разделе" }, { status: 404 })
  }

  const expectedFrom = new Set(existingFromIds.filter((id) => id !== lessonId))
  const expectedTo = new Set([...existingToIds, lessonId])

  if (fromLessonIds.length !== expectedFrom.size) {
    return NextResponse.json(
      { error: "fromLessonIds должен содержать все уроки исходного раздела (кроме lessonId)" },
      { status: 400 },
    )
  }
  for (const id of fromLessonIds) {
    if (!expectedFrom.has(id)) {
      return NextResponse.json({ error: "fromLessonIds содержит неверный id" }, { status: 400 })
    }
  }

  if (toLessonIds.length !== expectedTo.size) {
    return NextResponse.json(
      { error: "toLessonIds должен содержать все уроки целевого раздела (включая lessonId)" },
      { status: 400 },
    )
  }
  for (const id of toLessonIds) {
    if (!expectedTo.has(id)) {
      return NextResponse.json({ error: "toLessonIds содержит неверный id" }, { status: 400 })
    }
  }

  let renamedModules: { id: string; title: string }[] = []
  await prisma.$transaction(async (tx) => {
    // Сдвиг order, чтобы избежать коллизий @@unique([moduleId, order]) в обоих разделах
    await tx.lesson.updateMany({
      where: { moduleId: fromModuleId },
      data: { order: { increment: ORDER_SHIFT } },
    })
    await tx.lesson.updateMany({
      where: { moduleId: toModuleId },
      data: { order: { increment: ORDER_SHIFT } },
    })

    // Перемещаем урок (и задаём временный order вне диапазона)
    await tx.lesson.update({
      where: { id: lessonId },
      data: { moduleId: toModuleId, order: 0 },
    })

    for (let i = 0; i < fromLessonIds.length; i++) {
      await tx.lesson.update({
        where: { id: fromLessonIds[i] },
        data: { order: i + 1 },
      })
    }

    for (let i = 0; i < toLessonIds.length; i++) {
      await tx.lesson.update({
        where: { id: toLessonIds[i] },
        data: { order: i + 1 },
      })
    }

    // Если целевой раздел стал состоять из одного урока и имеет дефолтное название — переименуем
    if (toLessonIds.length === 1) {
      const currentToModule = await tx.module.findUnique({
        where: { id: toModuleId },
        select: { id: true, title: true },
      })
      if (currentToModule && isDefaultSectionTitle(currentToModule.title)) {
        const updated = await tx.module.update({
          where: { id: toModuleId },
          data: { title: movingLesson.title },
          select: { id: true, title: true },
        })
        renamedModules = [updated]
      }
    }
  })

  return NextResponse.json({
    success: true,
    ...(renamedModules.length > 0 ? { modules: renamedModules } : {}),
  })
}

/** PUT /api/admin/courses/[id]/lessons — обновить урок */
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
  const { lessonId, title, description, durationMin, rotate90 } = body as {
    lessonId: string
    title?: string
    description?: string
    durationMin?: number
    rotate90?: unknown
  }

  if (!lessonId) {
    return NextResponse.json({ error: "Укажите lessonId" }, { status: 400 })
  }

  if (title && title.length > 500) {
    return NextResponse.json({ error: "Название слишком длинное" }, { status: 400 })
  }
  if (description && description.length > 5000) {
    return NextResponse.json({ error: "Описание слишком длинное" }, { status: 400 })
  }
  if (rotate90 !== undefined && typeof rotate90 !== "boolean") {
    return NextResponse.json({ error: "rotate90 должен быть boolean" }, { status: 400 })
  }

  // Проверяем принадлежность урока курсу
  const existing = await prisma.lesson.findFirst({
    where: { id: lessonId, module: { courseId } },
    select: {
      id: true,
      title: true,
      moduleId: true,
      module: { select: { id: true, title: true } },
    },
  })
  if (!existing) {
    return NextResponse.json({ error: "Урок не найден в этом курсе" }, { status: 404 })
  }

  const normalizedTitle = title !== undefined ? title.trim() : undefined
  const normalizedDescription =
    description !== undefined ? description.trim() || null : undefined
  const normalizedDuration = durationMin !== undefined ? durationMin : undefined

  const result = await prisma.$transaction(async (tx) => {
    const lesson = await tx.lesson.update({
      where: { id: lessonId },
      data: {
        ...(normalizedTitle !== undefined && { title: normalizedTitle }),
        ...(normalizedDescription !== undefined && { description: normalizedDescription }),
        ...(normalizedDuration !== undefined && { durationMin: normalizedDuration }),
        ...(rotate90 !== undefined && { rotate90 }),
      },
    })

    // Если в разделе ровно один урок, держим название раздела синхронным с названием видео
    if (normalizedTitle !== undefined && normalizedTitle !== existing.title) {
      const count = await tx.lesson.count({ where: { moduleId: existing.moduleId } })
      if (count === 1) {
        const modTitle = existing.module.title
        if (modTitle === existing.title || isDefaultSectionTitle(modTitle)) {
          const updatedModule = await tx.module.update({
            where: { id: existing.moduleId },
            data: { title: normalizedTitle },
            select: { id: true, title: true },
          })
          return { lesson, module: updatedModule }
        }
      }
    }

    return { lesson }
  })

  return NextResponse.json(result)
}

/** DELETE /api/admin/courses/[id]/lessons — удалить урок */
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
  const lessonId = searchParams.get("lessonId")

  if (!lessonId) {
    return NextResponse.json({ error: "Укажите lessonId" }, { status: 400 })
  }

  // Проверяем принадлежность урока курсу
  const existing = await prisma.lesson.findFirst({
    where: { id: lessonId, module: { courseId } },
  })
  if (!existing) {
    return NextResponse.json({ error: "Урок не найден в этом курсе" }, { status: 404 })
  }

  await prisma.$transaction(async (tx) => {
    await tx.lesson.delete({ where: { id: lessonId } })

    // Нормализуем order 1..N, чтобы не было "дыр" (влияет на сортировку/переходы)
    const remaining = await tx.lesson.findMany({
      where: { moduleId: existing.moduleId },
      orderBy: { order: "asc" },
      select: { id: true },
    })

    if (remaining.length === 0) return

    await tx.lesson.updateMany({
      where: { moduleId: existing.moduleId },
      data: { order: { increment: ORDER_SHIFT } },
    })

    for (let i = 0; i < remaining.length; i++) {
      await tx.lesson.update({
        where: { id: remaining[i].id },
        data: { order: i + 1 },
      })
    }
  })

  const materials = parseLessonMaterials(existing.materials, existing.id)
  await Promise.all(
    materials
      .map((material) => material.storagePath)
      .filter((storagePath): storagePath is string => !!storagePath)
      .map(async (storagePath) => {
        try {
          await unlink(resolveMaterialAbsolutePath(storagePath))
        } catch {
          // Игнорируем: файл мог быть удалён ранее.
        }
      }),
  )

  return NextResponse.json({ success: true })
}
