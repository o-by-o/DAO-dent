import { readFile } from "node:fs/promises"
import path from "node:path"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

function getAgentTempDir() {
  return path.join(process.cwd(), "uploads", "agent-temp")
}

/**
 * GET /api/admin/ai-chat/serve-image?path=xxx
 *
 * Отдаёт загруженное изображение (только для авторизованных админов).
 */
export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const relPath = searchParams.get("path")
  if (!relPath || relPath.includes("..") || relPath.includes("/")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 })
  }

  try {
    const dir = getAgentTempDir()
    const filePath = path.join(dir, relPath)
    const buffer = await readFile(filePath)

    const ext = path.extname(relPath).toLowerCase()
    const mime =
      ext === ".png"
        ? "image/png"
        : ext === ".webp"
          ? "image/webp"
          : ext === ".gif"
            ? "image/gif"
            : "image/jpeg"

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": mime,
        "Cache-Control": "private, max-age=3600",
      },
    })
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
}
