import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Mux from "@mux/mux-node"
import { NextResponse } from "next/server"

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
})

/** GET /api/admin/media — все Mux-ассеты + уроки без видео */
export async function GET() {
  const session = await auth()
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const [muxAssets, linkedAssetIds, lessonsWithoutVideo] = await Promise.all([
    mux.video.assets.list({ limit: 100 }).then((r) => r.data),
    prisma.lesson.findMany({
      where: { muxAssetId: { not: null } },
      select: { muxAssetId: true, title: true },
    }),
    prisma.lesson.findMany({
      where: { muxPlaybackId: null },
      select: {
        id: true,
        title: true,
        module: {
          select: {
            title: true,
            course: { select: { title: true } },
          },
        },
      },
      orderBy: [{ module: { course: { title: "asc" } } }, { order: "asc" }],
    }),
  ])

  const linkedSet = new Set(linkedAssetIds.map((l) => l.muxAssetId))

  const assets = muxAssets
    .filter((a) => a.status === "ready" && a.playback_ids?.length)
    .map((a) => {
      const playbackId = a.playback_ids![0].id
      const linked = linkedSet.has(a.id)
      const linkedLesson = linked
        ? linkedAssetIds.find((l) => l.muxAssetId === a.id)?.title
        : null

      return {
        assetId: a.id,
        playbackId,
        duration: a.duration ? Math.round(a.duration) : 0,
        createdAt: a.created_at,
        thumbnailUrl: `https://image.mux.com/${playbackId}/thumbnail.jpg?width=320&height=180&fit_mode=smartcrop`,
        linked,
        linkedLesson,
      }
    })
    .sort((a, b) => (a.linked ? 1 : 0) - (b.linked ? 1 : 0))

  const lessons = lessonsWithoutVideo.map((l) => ({
    id: l.id,
    title: l.title,
    course: l.module.course.title,
    module: l.module.title,
  }))

  return NextResponse.json({ assets, lessons })
}

/** DELETE /api/admin/media — удалить ассет из Mux и отвязать от урока */
export async function DELETE(req: Request) {
  const session = await auth()
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { assetId } = await req.json()
  if (!assetId) {
    return NextResponse.json({ error: "Missing assetId" }, { status: 400 })
  }

  // Отвязываем от урока если привязан
  await prisma.lesson.updateMany({
    where: { muxAssetId: assetId },
    data: { muxAssetId: null, muxPlaybackId: null, muxStatus: null },
  })

  // Удаляем из Mux
  try {
    await mux.video.assets.delete(assetId)
  } catch (e) {
    console.error("Mux delete error:", e)
    return NextResponse.json({ error: "Ошибка удаления из Mux" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

/** POST /api/admin/media — привязать видео к уроку */
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { assetId, playbackId, lessonId } = await req.json()

  if (!assetId || !playbackId || !lessonId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  }

  await prisma.lesson.update({
    where: { id: lessonId },
    data: {
      muxAssetId: assetId,
      muxPlaybackId: playbackId,
      muxStatus: "ready",
    },
  })

  return NextResponse.json({ ok: true })
}
