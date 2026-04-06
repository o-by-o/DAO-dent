import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"

function hasAgentStateFieldsError(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  return (
    error.message.includes("Unknown field `activeCourse`") ||
    error.message.includes("Unknown field `attachments`")
  )
}

function normalizeActiveCourse(value: unknown) {
  if (!value || typeof value !== "object") return null
  const item = value as {
    courseId?: unknown
    title?: unknown
    slug?: unknown
    editorUrl?: unknown
  }
  if (typeof item.courseId !== "string" || typeof item.title !== "string") return null
  return {
    courseId: item.courseId,
    title: item.title,
    ...(typeof item.slug === "string" ? { slug: item.slug } : {}),
    ...(typeof item.editorUrl === "string" ? { editorUrl: item.editorUrl } : {}),
  }
}

function normalizeAttachments(value: unknown) {
  if (!value || typeof value !== "object") return { videos: [], images: [] }
  const input = value as { videos?: unknown; images?: unknown }
  const videos = Array.isArray(input.videos)
    ? input.videos
        .map((v) => {
          if (!v || typeof v !== "object") return null
          const item = v as {
            id?: unknown
            fileName?: unknown
            fileSize?: unknown
            uploadId?: unknown
            muxAssetId?: unknown
            muxPlaybackId?: unknown
            muxStatus?: unknown
            duration?: unknown
            progress?: unknown
            error?: unknown
          }
          if (typeof item.fileName !== "string") return null
          return {
            id: typeof item.id === "string" ? item.id : crypto.randomUUID(),
            fileName: item.fileName,
            fileSize: typeof item.fileSize === "number" ? item.fileSize : 0,
            uploadId: typeof item.uploadId === "string" ? item.uploadId : "",
            muxAssetId:
              typeof item.muxAssetId === "string" || item.muxAssetId === null
                ? item.muxAssetId
                : undefined,
            muxPlaybackId:
              typeof item.muxPlaybackId === "string" || item.muxPlaybackId === null
                ? item.muxPlaybackId
                : undefined,
            muxStatus:
              typeof item.muxStatus === "string" || item.muxStatus === null
                ? item.muxStatus
                : undefined,
            duration: typeof item.duration === "number" || item.duration === null ? item.duration : undefined,
            progress: typeof item.progress === "number" ? item.progress : 100,
            error: typeof item.error === "string" ? item.error : undefined,
          }
        })
        .filter(Boolean)
    : []
  const images = Array.isArray(input.images)
    ? input.images
        .map((i) => {
          if (!i || typeof i !== "object") return null
          const item = i as {
            id?: unknown
            fileName?: unknown
            url?: unknown
            progress?: unknown
            error?: unknown
          }
          if (typeof item.fileName !== "string") return null
          return {
            id: typeof item.id === "string" ? item.id : crypto.randomUUID(),
            fileName: item.fileName,
            url: typeof item.url === "string" ? item.url : "",
            progress: typeof item.progress === "number" ? item.progress : 100,
            error: typeof item.error === "string" ? item.error : undefined,
          }
        })
        .filter(Boolean)
    : []
  return { videos, images }
}

/** GET /api/admin/agent-chats/[id] — сообщения чата (только свой) */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  let chat:
    | { messages: unknown; title: string; activeCourse: unknown; attachments: unknown }
    | { messages: unknown; title: string; activeCourse: null; attachments: { videos: []; images: [] } }
    | null = null
  try {
    const next = await prisma.agentConversation.findFirst({
      where: { id, userId: session.user.id },
      select: { messages: true, title: true, activeCourse: true, attachments: true },
    })
    chat = next
  } catch (error) {
    if (!hasAgentStateFieldsError(error)) throw error
    const legacy = await prisma.agentConversation.findFirst({
      where: { id, userId: session.user.id },
      select: { messages: true, title: true },
    })
    chat = legacy
      ? { ...legacy, activeCourse: null, attachments: { videos: [], images: [] } }
      : null
  }

  if (!chat) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const messages = Array.isArray(chat.messages) ? chat.messages : []
  return NextResponse.json({
    messages,
    title: chat.title,
    activeCourse: normalizeActiveCourse(chat.activeCourse),
    attachments: normalizeAttachments(chat.attachments),
  })
}

/** PATCH /api/admin/agent-chats/[id] — обновить состояние чата (activeCourse/attachments) */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  let body: { activeCourse?: unknown; attachments?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const activeCourse = normalizeActiveCourse(body.activeCourse)
  const attachments = normalizeAttachments(body.attachments)

  let updated
  try {
    updated = await prisma.agentConversation.updateMany({
      where: { id, userId: session.user.id },
      data: {
        activeCourse: activeCourse ? JSON.parse(JSON.stringify(activeCourse)) : Prisma.DbNull,
        attachments,
        updatedAt: new Date(),
      },
    })
  } catch (error) {
    if (!hasAgentStateFieldsError(error)) throw error
    // На старой схеме игнорируем state-sync, но не ломаем UI.
    updated = await prisma.agentConversation.updateMany({
      where: { id, userId: session.user.id },
      data: { updatedAt: new Date() },
    })
  }

  if (updated.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}
