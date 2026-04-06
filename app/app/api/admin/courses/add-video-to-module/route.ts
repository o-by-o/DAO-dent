import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

interface VideoInput {
  fileName: string
  muxAssetId?: string | null
  muxPlaybackId?: string | null
  muxStatus?: string | null
  duration?: number | null
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = (await request.json().catch(() => null)) as
    | {
        courseId?: string
        moduleOrder?: number
        lessonTitle?: string
        lessonDescription?: string
        video?: VideoInput
      }
    | null

  if (!body?.courseId || typeof body.moduleOrder !== "number" || !body.video) {
    return NextResponse.json(
      { error: "Укажите courseId, moduleOrder и video" },
      { status: 400 },
    )
  }

  const { courseId, moduleOrder, lessonTitle, lessonDescription, video } = body
  if (moduleOrder < 1) {
    return NextResponse.json({ error: "moduleOrder должен быть >= 1" }, { status: 400 })
  }

  if (!video.muxAssetId || !video.muxPlaybackId || video.muxStatus !== "ready") {
    return NextResponse.json(
      { error: `Видео "${video.fileName}" ещё не готово для добавления.` },
      { status: 400 },
    )
  }

  const module_ = await prisma.module.findFirst({
    where: { courseId, order: moduleOrder },
    select: { id: true, title: true, order: true },
  })
  if (!module_) {
    return NextResponse.json(
      { error: `Модуль №${moduleOrder} не найден в выбранном курсе` },
      { status: 404 },
    )
  }

  const nextOrder = await prisma.lesson
    .aggregate({ where: { moduleId: module_.id }, _max: { order: true } })
    .then((r) => (r._max.order ?? 0) + 1)

  // Предпочитаем прикреплять видео к уже существующему уроку без видео,
  // чтобы в учебном интерфейсе модуль "оживал" без появления лишних дублей уроков.
  const lessonWithoutVideo = await prisma.lesson.findFirst({
    where: { moduleId: module_.id, muxPlaybackId: null },
    orderBy: { order: "asc" },
    select: { id: true, title: true, description: true },
  })

  const lesson = lessonWithoutVideo
    ? await prisma.lesson.update({
        where: { id: lessonWithoutVideo.id },
        data: {
          ...(lessonTitle?.trim() ? { title: lessonTitle.trim() } : {}),
          ...(lessonDescription !== undefined
            ? { description: lessonDescription.trim() || null }
            : {}),
          muxAssetId: video.muxAssetId,
          muxPlaybackId: video.muxPlaybackId,
          muxStatus: "ready",
          durationMin: video.duration ? Math.ceil(video.duration / 60) : 0,
        },
        select: { id: true, title: true },
      })
    : await prisma.lesson.create({
        data: {
          moduleId: module_.id,
          title:
            lessonTitle?.trim() ||
            `Видеоурок: ${video.fileName.replace(/\.[^.]+$/, "")}`,
          description: lessonDescription?.trim() || null,
          order: nextOrder,
          aiGenerated: true,
          muxAssetId: video.muxAssetId,
          muxPlaybackId: video.muxPlaybackId,
          muxStatus: "ready",
          durationMin: video.duration ? Math.ceil(video.duration / 60) : 0,
        },
        select: { id: true, title: true },
      })

  return NextResponse.json({
    success: true,
    message: lessonWithoutVideo
      ? `Видео прикреплено к уроку "${lesson.title}" в модуле ${module_.order}.`
      : `Видео добавлено в модуль ${module_.order}: "${module_.title}"`,
    moduleId: module_.id,
    lessonId: lesson.id,
    lessonTitle: lesson.title,
    attachedToExistingLesson: !!lessonWithoutVideo,
  })
}
