import { randomUUID } from "node:crypto"
import { mkdir, unlink, writeFile } from "node:fs/promises"
import path from "node:path"
import { Prisma } from "@prisma/client"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import {
  MAX_MATERIAL_FILE_SIZE,
  buildLessonMaterialUrl,
  buildMaterialStoragePath,
  buildStoredFileName,
  formatFileSize,
  isAllowedMaterialFile,
  parseLessonMaterials,
  resolveMaterialAbsolutePath,
  serializeLessonMaterials,
} from "@/lib/lesson-materials"

export const runtime = "nodejs"

async function assertAdmin() {
  const session = await auth()
  const isAdmin = !!session?.user && (session.user as { role?: string }).role === "ADMIN"
  return isAdmin
}

/**
 * POST /api/admin/courses/[id]/materials-upload
 * multipart/form-data: lessonId, file
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await assertAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const contentType = request.headers.get("content-type") ?? ""
  if (!contentType.toLowerCase().includes("multipart/form-data")) {
    return NextResponse.json({ error: "Ожидается multipart/form-data" }, { status: 400 })
  }

  const { id: courseId } = await params
  const formData = await request.formData()
  const lessonId = String(formData.get("lessonId") ?? "").trim()
  const filePart = formData.get("file")

  if (!lessonId) {
    return NextResponse.json({ error: "Укажите lessonId" }, { status: 400 })
  }
  if (!(filePart instanceof File)) {
    return NextResponse.json({ error: "Файл не передан" }, { status: 400 })
  }
  if (!filePart.name.trim()) {
    return NextResponse.json({ error: "Некорректное имя файла" }, { status: 400 })
  }
  if (filePart.size <= 0) {
    return NextResponse.json({ error: "Файл пустой" }, { status: 400 })
  }
  if (filePart.size > MAX_MATERIAL_FILE_SIZE) {
    return NextResponse.json(
      { error: `Файл слишком большой. Максимум ${formatFileSize(MAX_MATERIAL_FILE_SIZE)}.` },
      { status: 400 },
    )
  }
  if (!isAllowedMaterialFile(filePart.name, filePart.type)) {
    return NextResponse.json(
      { error: "Неподдерживаемый формат файла" },
      { status: 400 },
    )
  }

  const lesson = await prisma.lesson.findFirst({
    where: { id: lessonId, module: { courseId } },
    select: { id: true, materials: true },
  })
  if (!lesson) {
    return NextResponse.json({ error: "Урок не найден" }, { status: 404 })
  }

  const materialId = randomUUID()
  const storedFileName = buildStoredFileName(filePart.name)
  const storagePath = buildMaterialStoragePath(lesson.id, storedFileName)
  const absolutePath = resolveMaterialAbsolutePath(storagePath)

  try {
    await mkdir(path.dirname(absolutePath), { recursive: true })
    const arrayBuffer = await filePart.arrayBuffer()
    await writeFile(absolutePath, Buffer.from(arrayBuffer))

    const existingMaterials = parseLessonMaterials(lesson.materials, lesson.id)
    const newMaterial = {
      id: materialId,
      name: filePart.name.trim(),
      url: buildLessonMaterialUrl(lesson.id, materialId),
      size: formatFileSize(filePart.size),
      sizeBytes: filePart.size,
      mimeType: filePart.type || null,
      storagePath,
      uploadedAt: new Date().toISOString(),
    }

    const nextMaterials = [...existingMaterials, newMaterial]

    await prisma.lesson.update({
      where: { id: lesson.id },
      data: { materials: serializeLessonMaterials(nextMaterials) },
    })

    return NextResponse.json({ material: newMaterial, materials: nextMaterials })
  } catch (err) {
    console.error("Ошибка загрузки материалов урока:", err)
    return NextResponse.json({ error: "Не удалось загрузить файл" }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/courses/[id]/materials-upload?lessonId=...&materialId=...
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await assertAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id: courseId } = await params
  const { searchParams } = new URL(request.url)
  const lessonId = searchParams.get("lessonId")?.trim() ?? ""
  const materialId = searchParams.get("materialId")?.trim() ?? ""

  if (!lessonId || !materialId) {
    return NextResponse.json({ error: "Укажите lessonId и materialId" }, { status: 400 })
  }

  const lesson = await prisma.lesson.findFirst({
    where: { id: lessonId, module: { courseId } },
    select: { id: true, materials: true },
  })
  if (!lesson) {
    return NextResponse.json({ error: "Урок не найден" }, { status: 404 })
  }

  const existingMaterials = parseLessonMaterials(lesson.materials, lesson.id)
  const target = existingMaterials.find((item) => item.id === materialId)
  if (!target) {
    return NextResponse.json({ error: "Материал не найден" }, { status: 404 })
  }

  if (target.storagePath) {
    try {
      await unlink(resolveMaterialAbsolutePath(target.storagePath))
    } catch {
      // Файл мог быть удалён вручную, это не критично для очистки записи из БД.
    }
  }

  const nextMaterials = existingMaterials.filter((item) => item.id !== materialId)

  await prisma.lesson.update({
    where: { id: lesson.id },
    data: {
      materials:
        nextMaterials.length > 0
          ? serializeLessonMaterials(nextMaterials)
          : Prisma.DbNull,
    },
  })

  return NextResponse.json({ success: true, materials: nextMaterials })
}
