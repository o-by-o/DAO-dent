import { mkdir, unlink, writeFile } from "node:fs/promises"
import path from "node:path"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]
const MAX_SIZE = 5 * 1024 * 1024 // 5 MB

function getCoverDir() {
  return path.join(process.cwd(), "public", "uploads", "course-covers")
}

function getCoverPath(courseId: string, ext: string) {
  return path.join(getCoverDir(), `${courseId}${ext}`)
}

function getCoverUrl(courseId: string, ext: string) {
  return `/uploads/course-covers/${courseId}${ext}`
}

async function assertAdmin() {
  const session = await auth()
  const isAdmin =
    !!session?.user && (session.user as { role?: string }).role === "ADMIN"
  return isAdmin
}

/**
 * POST /api/admin/courses/[id]/cover
 * multipart/form-data: file (image)
 * Saves to public/uploads/course-covers/{courseId}.{ext}, updates course.thumbnailUrl
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
    return NextResponse.json(
      { error: "Ожидается multipart/form-data" },
      { status: 400 },
    )
  }

  const { id: courseId } = await params
  const formData = await request.formData()
  const filePart = formData.get("file")

  if (!(filePart instanceof File)) {
    return NextResponse.json(
      { error: "Файл не передан" },
      { status: 400 },
    )
  }
  if (filePart.size <= 0) {
    return NextResponse.json({ error: "Файл пустой" }, { status: 400 })
  }
  if (filePart.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "Файл слишком большой. Максимум 5 МБ." },
      { status: 400 },
    )
  }
  if (!ALLOWED_TYPES.includes(filePart.type)) {
    return NextResponse.json(
      { error: "Разрешены только JPEG, PNG, WebP" },
      { status: 400 },
    )
  }

  const existing = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, thumbnailUrl: true },
  })
  if (!existing) {
    return NextResponse.json({ error: "Курс не найден" }, { status: 404 })
  }

  const ext =
    filePart.type === "image/png"
      ? ".png"
      : filePart.type === "image/webp"
        ? ".webp"
        : ".jpg"
  const absolutePath = getCoverPath(courseId, ext)
  const thumbnailUrl = getCoverUrl(courseId, ext)

  try {
    const dir = getCoverDir()
    await mkdir(dir, { recursive: true })
    // Remove previous cover if it had another extension
    for (const oldExt of [".jpg", ".jpeg", ".png", ".webp"]) {
      if (oldExt === ext) continue
      try {
        await unlink(getCoverPath(courseId, oldExt))
      } catch {
        // ignore
      }
    }
    const arrayBuffer = await filePart.arrayBuffer()
    await writeFile(absolutePath, Buffer.from(arrayBuffer))

    await prisma.course.update({
      where: { id: courseId },
      data: { thumbnailUrl },
    })

    return NextResponse.json({ thumbnailUrl })
  } catch (err) {
    console.error("Course cover upload error:", err)
    return NextResponse.json(
      { error: "Ошибка сохранения обложки" },
      { status: 500 },
    )
  }
}

/**
 * DELETE /api/admin/courses/[id]/cover
 * Removes cover file and sets course.thumbnailUrl to null
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await assertAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id: courseId } = await params

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, thumbnailUrl: true },
  })
  if (!course) {
    return NextResponse.json({ error: "Курс не найден" }, { status: 404 })
  }

  if (course.thumbnailUrl) {
    try {
      const urlPath = course.thumbnailUrl
      const fileName = path.basename(urlPath)
      const absolutePath = path.join(getCoverDir(), fileName)
      await unlink(absolutePath)
    } catch (e) {
      // ignore if file already missing
    }
  }

  await prisma.course.update({
    where: { id: courseId },
    data: { thumbnailUrl: null },
  })

  return NextResponse.json({ thumbnailUrl: null })
}
