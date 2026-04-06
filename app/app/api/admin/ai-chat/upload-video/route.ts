import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getMux } from "@/lib/mux"

/**
 * POST /api/admin/ai-chat/upload-video
 *
 * Создаёт Mux Direct Upload URL для загрузки видео в чате OpenClaw.
 * Не привязан к lessonId — уроки создаются позже при createDraftCourse.
 */
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  let body: { fileName?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const fileName = body.fileName ?? "video.mp4"

  try {
    const mux = getMux()

    const upload = await mux.video.uploads.create({
      new_asset_settings: {
        playback_policy: ["public"],
        encoding_tier: "baseline",
        passthrough: JSON.stringify({ source: "openclaw-wizard" }),
      },
      cors_origin: process.env.NEXTAUTH_URL ?? "https://dibinterfarm.ru",
      timeout: 3600,
    })

    return NextResponse.json({
      uploadUrl: upload.url,
      uploadId: upload.id,
    })
  } catch (err) {
    console.error("OpenClaw upload-video error:", err)
    return NextResponse.json(
      { error: "Не удалось создать ссылку для загрузки видео" },
      { status: 500 },
    )
  }
}

/**
 * GET /api/admin/ai-chat/upload-video?uploadId=xxx
 *
 * Проверяет статус загрузки в Mux. Возвращает muxAssetId, muxPlaybackId, muxStatus, duration.
 */
export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const uploadId = searchParams.get("uploadId")

  if (!uploadId) {
    return NextResponse.json({ error: "Укажите uploadId" }, { status: 400 })
  }

  try {
    const mux = getMux()
    const upload = await mux.video.uploads.retrieve(uploadId)

    if (!upload.asset_id) {
      return NextResponse.json({
        muxStatus: "uploading",
        muxAssetId: null,
        muxPlaybackId: null,
        duration: null,
      })
    }

    const asset = await mux.video.assets.retrieve(upload.asset_id)
    const playbackId = asset.playback_ids?.[0]?.id ?? null
    const status =
      asset.status === "ready"
        ? "ready"
        : asset.status === "errored"
          ? "errored"
          : "preparing"

    return NextResponse.json({
      muxStatus: status,
      muxAssetId: upload.asset_id,
      muxPlaybackId: playbackId,
      duration: asset.duration ?? null,
    })
  } catch (err) {
    console.error("OpenClaw upload-video status error:", err)
    return NextResponse.json(
      { error: "Не удалось проверить статус загрузки" },
      { status: 500 },
    )
  }
}
