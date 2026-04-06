import { randomUUID } from "node:crypto"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
])
const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10 MB

function getAgentTempDir() {
  return path.join(process.cwd(), "uploads", "agent-temp")
}

/**
 * POST /api/admin/ai-chat/upload-image
 *
 * Загружает изображение для чата с Агентом. Сохраняет во временную папку.
 */
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const contentType = req.headers.get("content-type") ?? ""
  if (!contentType.toLowerCase().includes("multipart/form-data")) {
    return NextResponse.json({ error: "Ожидается multipart/form-data" }, { status: 400 })
  }

  const formData = await req.formData()
  const filePart = formData.get("file")

  if (!(filePart instanceof File)) {
    return NextResponse.json({ error: "Файл не передан" }, { status: 400 })
  }

  if (!ALLOWED_IMAGE_TYPES.has(filePart.type) && !filePart.name.match(/\.(jpg|jpeg|png|webp|gif)$/i)) {
    return NextResponse.json(
      { error: "Поддерживаются только изображения: JPG, PNG, WebP, GIF" },
      { status: 400 },
    )
  }

  if (filePart.size > MAX_IMAGE_SIZE) {
    return NextResponse.json(
      { error: "Изображение слишком большое. Максимум 10 МБ." },
      { status: 400 },
    )
  }

  try {
    const ext = path.extname(filePart.name) || ".jpg"
    const fileName = `${randomUUID()}${ext}`
    const dir = getAgentTempDir()
    await mkdir(dir, { recursive: true })

    const buffer = Buffer.from(await filePart.arrayBuffer())
    const filePath = path.join(dir, fileName)
    await writeFile(filePath, buffer)

    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3001"
    const url = `${baseUrl}/api/admin/ai-chat/serve-image?path=${encodeURIComponent(fileName)}`

    return NextResponse.json({ url, fileName: filePart.name })
  } catch (err) {
    console.error("Agent image upload error:", err)
    return NextResponse.json(
      { error: "Не удалось загрузить изображение" },
      { status: 500 },
    )
  }
}
