import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getMux } from "@/lib/mux"

/**
 * GET /api/admin/courses/[id]/video-upload?lessonId=xxx
 *
 * Проверяет статус видео в Mux и обновляет БД.
 * Используется вместо вебхуков при локальной разработке.
 */
export async function GET(
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

  const lesson = await prisma.lesson.findFirst({
    where: { id: lessonId, module: { courseId } },
  })

  if (!lesson) {
    return NextResponse.json({ error: "Урок не найден" }, { status: 404 })
  }

  // Если нет ассета — пробуем получить asset_id через uploadId (для localhost без вебхуков)
  if (!lesson.muxAssetId) {
    const uploadId = searchParams.get("uploadId")
    if (!uploadId) {
      return NextResponse.json({
        muxStatus: lesson.muxStatus,
        muxPlaybackId: lesson.muxPlaybackId,
        muxAssetId: lesson.muxAssetId,
      })
    }

    try {
      const mux = getMux()
      const upload = await mux.video.uploads.retrieve(uploadId)

      if (upload.asset_id) {
        // Загрузка завершена, ассет создан — сохраняем в БД
        await prisma.lesson.update({
          where: { id: lessonId },
          data: {
            muxAssetId: upload.asset_id,
            muxStatus: "preparing",
          },
        })
        // Теперь проверяем сам ассет
        const asset = await mux.video.assets.retrieve(upload.asset_id)
        const playbackId = asset.playback_ids?.[0]?.id ?? null
        const newStatus = asset.status === "ready"
          ? "ready"
          : asset.status === "errored"
            ? "errored"
            : "preparing"

        const updateData: Record<string, unknown> = { muxStatus: newStatus }
        if (playbackId) updateData.muxPlaybackId = playbackId
        if (asset.duration && newStatus === "ready") {
          updateData.durationMin = Math.ceil(asset.duration / 60)
        }

        await prisma.lesson.update({
          where: { id: lessonId },
          data: updateData,
        })

        return NextResponse.json({
          muxStatus: newStatus,
          muxPlaybackId: playbackId,
          muxAssetId: upload.asset_id,
          duration: asset.duration,
        })
      }

      // Ассет ещё не создан — загрузка в процессе
      return NextResponse.json({
        muxStatus: lesson.muxStatus ?? "waiting_for_upload",
        muxPlaybackId: null,
        muxAssetId: null,
      })
    } catch (err) {
      console.error("Ошибка проверки upload в Mux:", err)
      return NextResponse.json({
        muxStatus: lesson.muxStatus,
        muxPlaybackId: lesson.muxPlaybackId,
        muxAssetId: lesson.muxAssetId,
      })
    }
  }

  try {
    const mux = getMux()
    const asset = await mux.video.assets.retrieve(lesson.muxAssetId)

    const playbackId = asset.playback_ids?.[0]?.id ?? null
    const newStatus = asset.status === "ready"
      ? "ready"
      : asset.status === "errored"
        ? "errored"
        : "preparing"

    // Обновляем БД если статус изменился
    const updateData: Record<string, unknown> = {}
    if (newStatus !== lesson.muxStatus) updateData.muxStatus = newStatus
    if (playbackId && playbackId !== lesson.muxPlaybackId) updateData.muxPlaybackId = playbackId
    if (asset.duration && newStatus === "ready") {
      updateData.durationMin = Math.ceil(asset.duration / 60)
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.lesson.update({
        where: { id: lessonId },
        data: updateData,
      })
    }

    return NextResponse.json({
      muxStatus: newStatus,
      muxPlaybackId: playbackId,
      muxAssetId: lesson.muxAssetId,
      duration: asset.duration,
    })
  } catch (err) {
    console.error("Ошибка проверки статуса Mux:", err)
    return NextResponse.json({
      muxStatus: lesson.muxStatus,
      muxPlaybackId: lesson.muxPlaybackId,
      muxAssetId: lesson.muxAssetId,
      error: "Не удалось проверить статус в Mux",
    })
  }
}

/**
 * POST /api/admin/courses/[id]/video-upload
 *
 * Создаёт Mux Direct Upload URL для загрузки видео напрямую из браузера.
 * Только для администраторов.
 *
 * Body: { lessonId: string }
 * Response: { uploadUrl: string, uploadId: string }
 */
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
  const { lessonId } = body as { lessonId: string }

  if (!lessonId) {
    return NextResponse.json({ error: "Укажите lessonId" }, { status: 400 })
  }

  // Проверяем, что урок существует и принадлежит курсу
  const lesson = await prisma.lesson.findFirst({
    where: {
      id: lessonId,
      module: { courseId },
    },
  })

  if (!lesson) {
    return NextResponse.json(
      { error: "Урок не найден или не принадлежит этому курсу" },
      { status: 404 },
    )
  }

  try {
    const mux = getMux()

    // Если у урока уже есть видео, удаляем старый ассет
    if (lesson.muxAssetId) {
      try {
        await mux.video.assets.delete(lesson.muxAssetId)
      } catch {
        // Ассет мог быть уже удалён — игнорируем
      }
    }

    // Создаём Direct Upload URL
    const upload = await mux.video.uploads.create({
      new_asset_settings: {
        playback_policy: ["public"],
        encoding_tier: "baseline",
        // Передаём метаданные для webhook
        passthrough: JSON.stringify({ lessonId, courseId }),
      },
      cors_origin: process.env.NEXTAUTH_URL || "https://dibinterfarm.ru",
      // Тайм-аут загрузки: 1 час
      timeout: 3600,
    })

    // Обновляем статус урока
    await prisma.lesson.update({
      where: { id: lessonId },
      data: {
        muxAssetId: null,
        muxPlaybackId: null,
        muxStatus: "waiting_for_upload",
      },
    })

    return NextResponse.json({
      uploadUrl: upload.url,
      uploadId: upload.id,
    })
  } catch (err) {
    console.error("Ошибка создания Mux upload:", err)
    return NextResponse.json(
      { error: "Не удалось создать ссылку для загрузки видео" },
      { status: 500 },
    )
  }
}

/**
 * DELETE /api/admin/courses/[id]/video-upload?lessonId=xxx
 *
 * Удаляет видео (Mux ассет) у урока. Только для администраторов.
 */
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

  // Проверяем урок
  const lesson = await prisma.lesson.findFirst({
    where: {
      id: lessonId,
      module: { courseId },
    },
  })

  if (!lesson) {
    return NextResponse.json({ error: "Урок не найден" }, { status: 404 })
  }

  // Удаляем ассет в Mux
  if (lesson.muxAssetId) {
    try {
      const mux = getMux()
      await mux.video.assets.delete(lesson.muxAssetId)
    } catch {
      // Ассет мог быть уже удалён — игнорируем
    }
  }

  // Очищаем поля в БД
  await prisma.lesson.update({
    where: { id: lessonId },
    data: {
      muxAssetId: null,
      muxPlaybackId: null,
      muxStatus: null,
    },
  })

  return NextResponse.json({ success: true })
}
