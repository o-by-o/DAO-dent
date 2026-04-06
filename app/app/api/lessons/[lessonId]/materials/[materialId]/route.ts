import { readFile } from "node:fs/promises"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { canAccessLesson } from "@/lib/access-control"
import {
  parseLessonMaterials,
  resolveMaterialAbsolutePath,
} from "@/lib/lesson-materials"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

function contentDisposition(fileName: string, inline: boolean) {
  const safeFileName = fileName.replace(/["\r\n]/g, "")
  const encodedFileName = encodeURIComponent(fileName)
  const kind = inline ? "inline" : "attachment"
  return `${kind}; filename="${safeFileName}"; filename*=UTF-8''${encodedFileName}`
}

function shouldUseInline(mimeType: string | null) {
  if (!mimeType) return false
  if (mimeType.startsWith("image/")) return true
  if (mimeType === "application/pdf") return true
  return false
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ lessonId: string; materialId: string }> },
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { lessonId, materialId } = await params
  if (!lessonId || !materialId) {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 })
  }

  const hasAccess = await canAccessLesson({
    lessonId,
    userId: session.user.id,
    role: (session.user as { role?: string }).role,
  })
  if (!hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { id: true, materials: true },
  })
  if (!lesson) {
    return NextResponse.json({ error: "Урок не найден" }, { status: 404 })
  }

  const materials = parseLessonMaterials(lesson.materials, lesson.id)
  const material = materials.find((item) => item.id === materialId)
  if (!material) {
    return NextResponse.json({ error: "Материал не найден" }, { status: 404 })
  }

  if (!material.storagePath) {
    if (/^https?:\/\//i.test(material.url)) {
      return NextResponse.redirect(material.url)
    }
    return NextResponse.json({ error: "Файл недоступен" }, { status: 404 })
  }

  try {
    const absolutePath = resolveMaterialAbsolutePath(material.storagePath)
    const fileBuffer = await readFile(absolutePath)

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": material.mimeType || "application/octet-stream",
        "Content-Length": String(fileBuffer.byteLength),
        "Content-Disposition": contentDisposition(
          material.name,
          shouldUseInline(material.mimeType),
        ),
        "Cache-Control": "private, max-age=3600",
      },
    })
  } catch {
    return NextResponse.json({ error: "Файл не найден на диске" }, { status: 404 })
  }
}

