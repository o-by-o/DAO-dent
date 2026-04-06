import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateSlug } from "@/lib/utils"

interface DraftLessonInput {
  title: string
  description?: string
  videoIndex?: number
}

interface DraftModuleInput {
  title: string
  lessons: DraftLessonInput[]
}

interface DraftStructureInput {
  title: string
  description?: string
  author?: string
  slug?: string
  modules: DraftModuleInput[]
}

interface VideoMetaInput {
  fileName: string
  muxAssetId?: string | null
  muxPlaybackId?: string | null
  muxStatus?: string | null
  duration?: number | null
}

function canAutoRenameChatTitle(title: string | null | undefined): boolean {
  const normalized = (title ?? "").trim().toLowerCase()
  if (!normalized) return true
  if (normalized === "новый чат" || normalized.startsWith("новый чат ")) return true

  // Автогенерируемые названия из первого сообщения пользователя.
  // Их можно безопасно заменять на фактическое название созданного курса.
  if (normalized.length <= 48 && (normalized.includes("курс") || normalized.includes("созда"))) {
    return true
  }

  return false
}

async function getUniqueSlug(base: string): Promise<string> {
  const normalized = (base || "course").trim()
  const initial = generateSlug(normalized) || "course"

  let candidate = initial
  let suffix = 2
  while (await prisma.course.findUnique({ where: { slug: candidate }, select: { id: true } })) {
    candidate = `${initial}-${suffix++}`
  }
  return candidate
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  let body: { structure?: DraftStructureInput; videos?: VideoMetaInput[]; chatId?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const structure = body.structure
  const videos = Array.isArray(body.videos) ? body.videos : []
  const chatId = typeof body.chatId === "string" ? body.chatId : null

  if (!structure || typeof structure !== "object") {
    return NextResponse.json({ error: "Не передана структура курса" }, { status: 400 })
  }
  if (!structure.title?.trim()) {
    return NextResponse.json({ error: "Укажите название курса" }, { status: 400 })
  }
  if (!Array.isArray(structure.modules) || structure.modules.length === 0) {
    return NextResponse.json({ error: "Структура курса пуста" }, { status: 400 })
  }

  const videoIndices = new Set<number>()
  for (const mod of structure.modules) {
    if (!mod?.title?.trim()) {
      return NextResponse.json({ error: "У одного из модулей нет названия" }, { status: 400 })
    }
    if (!Array.isArray(mod.lessons) || mod.lessons.length === 0) {
      return NextResponse.json({ error: `Модуль "${mod.title}" не содержит уроков` }, { status: 400 })
    }
    for (const les of mod.lessons) {
      if (!les?.title?.trim()) {
        return NextResponse.json({ error: `В модуле "${mod.title}" есть урок без названия` }, { status: 400 })
      }
      if (typeof les.videoIndex === "number") {
        videoIndices.add(les.videoIndex)
      }
    }
  }

  for (const idx of videoIndices) {
    const v = videos[idx]
    if (!v) {
      return NextResponse.json({ error: `Видео с индексом ${idx} не найдено` }, { status: 400 })
    }
    if (!v.muxAssetId || !v.muxPlaybackId || v.muxStatus !== "ready") {
      return NextResponse.json(
        {
          error: `Видео "${v.fileName}" ещё не готово (статус: ${v.muxStatus ?? "unknown"}).`,
        },
        { status: 400 },
      )
    }
  }

  const slug = await getUniqueSlug(structure.slug?.trim() || structure.title)

  const course = await prisma.$transaction(async (tx) => {
    const created = await tx.course.create({
      data: {
        title: structure.title.trim(),
        slug,
        description: structure.description?.trim() || null,
        author: structure.author?.trim() || "Айхаана Данилова",
        published: false,
        aiGenerated: true,
        aiMetadata: {
          generatedAt: new Date().toISOString(),
          generatedVia: "agent-direct-create",
          videoCount: videos.length,
        },
      },
    })

    let moduleOrder = 1
    for (const mod of structure.modules) {
      const createdModule = await tx.module.create({
        data: {
          title: mod.title.trim(),
          order: moduleOrder++,
          courseId: created.id,
        },
      })

      let lessonOrder = 1
      for (const les of mod.lessons) {
        const video = typeof les.videoIndex === "number" ? videos[les.videoIndex] : null
        await tx.lesson.create({
          data: {
            title: les.title.trim(),
            description: les.description?.trim() || null,
            order: lessonOrder++,
            moduleId: createdModule.id,
            aiGenerated: true,
            ...(video
              ? {
                  muxAssetId: video.muxAssetId!,
                  muxPlaybackId: video.muxPlaybackId!,
                  muxStatus: "ready",
                  durationMin: video.duration ? Math.ceil(video.duration / 60) : 0,
                }
              : {}),
          },
        })
      }
    }

    return created
  })

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3001"

  if (chatId) {
    try {
      const ownedChat = await prisma.agentConversation.findFirst({
        where: { id: chatId, userId: session.user.id },
        select: { id: true, title: true },
      })
      if (ownedChat && canAutoRenameChatTitle(ownedChat.title)) {
        await prisma.agentConversation.update({
          where: { id: chatId },
          data: { title: course.title, updatedAt: new Date() },
        })
      }
    } catch {
      // ignore chat title update errors
    }
  }

  return NextResponse.json({
    courseId: course.id,
    slug,
    editorUrl: `${baseUrl}/admin/courses/${course.id}`,
    message: `Черновик курса "${course.title}" создан.`,
  })
}
