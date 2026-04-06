"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { ArrowLeft, Paperclip, Send, Sparkles, Film, Loader2, CheckCircle2, AlertCircle, ImageIcon, MessageSquarePlus, FileText, RefreshCw, ChevronDown, ChevronUp } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

const ACCEPTED_VIDEO_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-msvideo",
  "video/x-matroska",
]
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]
const MAX_VIDEO_SIZE = 10 * 1024 * 1024 * 1024 // 10 GB
const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10 MB

interface VideoMeta {
  id: string
  fileName: string
  fileSize: number
  uploadId: string
  muxAssetId?: string | null
  muxPlaybackId?: string | null
  muxStatus?: string | null
  duration?: number | null
  progress: number
  error?: string
}

interface ImageMeta {
  id: string
  fileName: string
  url: string
  progress: number
  error?: string
}

function isVideoFile(file: File): boolean {
  return (
    ACCEPTED_VIDEO_TYPES.includes(file.type) ||
    !!file.name.match(/\.(mp4|mov|webm|avi|mkv)$/i)
  )
}

function isImageFile(file: File): boolean {
  return (
    ACCEPTED_IMAGE_TYPES.includes(file.type) ||
    !!file.name.match(/\.(jpg|jpeg|png|webp|gif)$/i)
  )
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`
}

function VideoAttachmentCard({
  video,
  onStatusUpdate,
}: {
  video: VideoMeta
  onStatusUpdate?: (id: string, updates: Partial<VideoMeta>) => void
}) {
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (video.muxStatus === "ready" || video.muxStatus === "errored" || video.error) return

    const poll = async () => {
      try {
        const res = await fetch(
          `/api/admin/ai-chat/upload-video?uploadId=${encodeURIComponent(video.uploadId)}`,
        )
        if (!res.ok) return
        const data = await res.json()
        onStatusUpdate?.(video.id, {
          muxAssetId: data.muxAssetId,
          muxPlaybackId: data.muxPlaybackId,
          muxStatus: data.muxStatus,
          duration: data.duration,
        })
      } catch {
        // ignore
      }
    }

    poll()
    pollRef.current = setInterval(poll, 5000)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [video.uploadId, video.muxStatus, video.error, video.id, onStatusUpdate])

  const statusLabel =
    video.muxStatus === "ready"
      ? "Готово"
      : video.muxStatus === "preparing"
        ? "Обработка"
        : video.muxStatus === "errored" || video.error
          ? "Ошибка"
          : video.progress < 100
            ? `Загрузка ${video.progress}%`
            : "Загрузка..."

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm",
        video.muxStatus === "errored" || video.error ? "border-destructive/50" : "",
      )}
    >
      <Film className="h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{video.fileName}</p>
        <p className="text-xs text-muted-foreground">
          {formatSize(video.fileSize)} · {statusLabel}
        </p>
      </div>
      {video.muxStatus === "ready" && <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />}
      {(video.muxStatus === "errored" || video.error) && (
        <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
      )}
      {video.muxStatus !== "ready" && !video.error && video.progress < 100 && (
        <Progress value={video.progress} className="h-1.5 w-16" />
      )}
    </div>
  )
}

/** Парсит текст ассистента: находит блок с вариантами выбора (список после текста) и возвращает intro + options для кнопок */
function parseChoiceOptions(text: string): { intro: string; options: string[] } | null {
  const lines = text.split(/\r?\n/)
  const options: string[] = []
  let optionStartIndex = -1

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    // Поддерживаем и буллеты, и нумерованные варианты.
    const listMatch = trimmed.match(/^([-•]|\d+[.)])\s+(.+)$/)
    if (listMatch) {
      const optionText = listMatch[2].trim()
      if (
        optionText.length > 0 &&
        optionText.length <= 80 &&
        !optionText.endsWith("?")
      ) {
        if (optionStartIndex === -1) optionStartIndex = i
        options.push(optionText)
      }
    } else if (optionStartIndex !== -1) {
      // Прерываем список при первой не-пункте строке
      break
    }
  }

  if (options.length < 2) return null
  const intro = lines
    .slice(0, optionStartIndex === -1 ? lines.length : optionStartIndex)
    .join("\n")
    .trim()

  return { intro, options }
}

function hideRawJsonDumpInAssistantText(text: string): string {
  const trimmed = text.trim()
  if (!trimmed) return text

  const candidates: string[] = []
  const fencedJsonMatch = trimmed.match(/```json\s*([\s\S]*?)\s*```$/i)
  if (fencedJsonMatch?.[1]) candidates.push(fencedJsonMatch[1].trim())

  const tailObjectMatch = trimmed.match(/\{[\s\S]*\}\s*$/)
  if (tailObjectMatch?.[0]) candidates.push(tailObjectMatch[0].trim())
  const tailArrayMatch = trimmed.match(/\[[\s\S]*\]\s*$/)
  if (tailArrayMatch?.[0]) candidates.push(tailArrayMatch[0].trim())

  for (const candidate of candidates) {
    if (candidate.length < 120) continue
    try {
      const parsed = JSON.parse(candidate) as unknown
      const looksLikeObjectDump =
        parsed &&
        typeof parsed === "object" &&
        !Array.isArray(parsed) &&
        ("modules" in (parsed as Record<string, unknown>) ||
          "lessons" in (parsed as Record<string, unknown>) ||
          "courseId" in (parsed as Record<string, unknown>) ||
          "slug" in (parsed as Record<string, unknown>))
      const looksLikeArrayDump =
        Array.isArray(parsed) &&
        parsed.length > 0 &&
        parsed.every(
          (item) =>
            item &&
            typeof item === "object" &&
            ("id" in (item as Record<string, unknown>) ||
              "title" in (item as Record<string, unknown>) ||
              "slug" in (item as Record<string, unknown>)),
        )
      const looksLikeToolDump = looksLikeObjectDump || looksLikeArrayDump
      if (!looksLikeToolDump) continue

      const withoutDump = trimmed
        .replace(new RegExp(`${candidate.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`), "")
        .replace(/```json\s*$/i, "")
        .trim()

      const statusText =
        parsed &&
        typeof parsed === "object" &&
        !Array.isArray(parsed) &&
        typeof (parsed as { message?: unknown }).message === "string"
          ? String((parsed as { message: string }).message)
          : "Изменение выполнено."
      return withoutDump ? `${withoutDump}\n\n${statusText}` : statusText
    } catch {
      // not JSON
    }
  }

  return text
}

function renderGenericToolOutput(output: unknown) {
  const raw = String(output ?? "")
  try {
    const parsed = JSON.parse(raw)

    if (Array.isArray(parsed)) {
      const coursesLike = parsed.every(
        (item) =>
          item &&
          typeof item === "object" &&
          "title" in item &&
          "slug" in item &&
          "published" in item,
      )
      if (coursesLike) {
        return (
          <div className="rounded-lg border border-border bg-background p-3 text-sm">
            <p className="mb-2 font-medium">Курсы найдены.</p>
            <ul className="space-y-1">
              {parsed.slice(0, 5).map((item, idx) => (
                <li key={idx} className="break-words text-muted-foreground">
                  — {String((item as { title?: unknown }).title ?? "Курс")}
                </li>
              ))}
            </ul>
            {parsed.length > 5 && (
              <p className="mt-2 text-xs text-muted-foreground">
                И еще {parsed.length - 5} курсов.
              </p>
            )}
          </div>
        )
      }

      const productsLike = parsed.every(
        (item) =>
          item &&
          typeof item === "object" &&
          "name" in item &&
          "price" in item,
      )

      if (productsLike) {
        return (
          <div className="rounded-lg border border-border bg-background p-3 text-sm">
            <p className="mb-2 font-medium">Список товаров:</p>
            <ul className="space-y-1">
              {parsed.map((item, idx) => (
                <li key={idx} className="break-words text-muted-foreground">
                  — {String((item as { name?: unknown }).name ?? "Товар")}{" "}
                  {(item as { sku?: unknown }).sku ? `(${String((item as { sku?: unknown }).sku)})` : ""}{" "}
                  — {String((item as { price?: unknown }).price ?? "—")} ₽
                </li>
              ))}
            </ul>
          </div>
        )
      }

      return (
        <pre className="overflow-auto rounded-lg border border-border bg-background p-3 text-xs">
          {JSON.stringify(parsed, null, 2)}
        </pre>
      )
    }

    if (parsed && typeof parsed === "object") {
      if (typeof (parsed as { message?: unknown }).message === "string") {
        return (
          <div className="rounded-lg border border-border bg-background p-3 text-sm">
            <p>{String((parsed as { message: string }).message)}</p>
          </div>
        )
      }

      const courseStructureLike =
        "modules" in parsed && Array.isArray((parsed as { modules?: unknown }).modules)
      if (courseStructureLike) {
        const p = parsed as {
          title?: string
          modules?: Array<{ lessons?: unknown[] }>
        }
        const modulesCount = p.modules?.length ?? 0
        const lessonsCount =
          p.modules?.reduce((sum, m) => sum + (Array.isArray(m.lessons) ? m.lessons.length : 0), 0) ?? 0
        return (
          <div className="rounded-lg border border-border bg-background p-3 text-sm">
            <p className="font-medium">Структура курса получена.</p>
            <p className="text-muted-foreground">
              {p.title ? `${p.title} · ` : ""}
              Модулей: {modulesCount}, уроков: {lessonsCount}
            </p>
          </div>
        )
      }

      return (
        <pre className="overflow-auto rounded-lg border border-border bg-background p-3 text-xs">
          {JSON.stringify(parsed, null, 2)}
        </pre>
      )
    }
  } catch {
    // not json
  }

  return (
    <pre className="overflow-auto rounded-lg border border-border bg-background p-3 text-xs">
      {raw}
    </pre>
  )
}

function ImageAttachmentCard({ image }: { image: ImageMeta }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm">
      <ImageIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{image.fileName}</p>
        <p className="text-xs text-muted-foreground">
          {image.error ? "Ошибка" : "Готово"}
        </p>
      </div>
      {!image.error && image.url && (
        <img
          src={image.url}
          alt={image.fileName}
          className="h-10 w-10 shrink-0 rounded object-cover"
        />
      )}
    </div>
  )
}

interface ChatItem {
  id: string
  title: string
  updatedAt: string
}

function canAutoRenameChatTitle(title: string): boolean {
  const normalized = title.trim().toLowerCase()
  if (!normalized) return true
  if (normalized === "новый чат" || normalized.startsWith("новый чат ")) return true
  if (normalized.length <= 48 && (normalized.includes("курс") || normalized.includes("созда"))) {
    return true
  }
  return false
}

interface OpenClawChatClientProps {
  chatId: string
  initialMessages?: unknown[]
  initialActiveCourse?: unknown
  initialAttachments?: unknown
}

interface StructureDraft {
  title: string
  description?: string
  author?: string
  slug?: string
  modules?: Array<{
    title: string
    lessons?: Array<{ title: string; description?: string; videoIndex?: number }>
  }>
}

interface ActiveCourseMeta {
  courseId: string
  title: string
  slug?: string
  editorUrl?: string
}

interface CourseModuleMeta {
  id: string
  title: string
  order: number
}

interface CourseOption {
  id: string
  title: string
  slug: string
}

interface PersistedAttachments {
  videos: VideoMeta[]
  images: ImageMeta[]
}

function normalizeActiveCourse(value: unknown): ActiveCourseMeta | null {
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

function normalizeAttachments(value: unknown): PersistedAttachments {
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
            duration:
              typeof item.duration === "number" || item.duration === null
                ? item.duration
                : undefined,
            progress: typeof item.progress === "number" ? item.progress : 100,
            error: typeof item.error === "string" ? item.error : undefined,
          } satisfies VideoMeta
        })
        .filter(Boolean) as VideoMeta[]
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
          } satisfies ImageMeta
        })
        .filter(Boolean) as ImageMeta[]
    : []
  return { videos, images }
}

function normalizeInitialMessagesForChat(messages: unknown[]) {
  const normalized: Array<{ id: string; role: "user" | "assistant" | "system"; parts: Array<Record<string, unknown>> }> = []

  for (const msg of messages) {
    if (!msg || typeof msg !== "object") continue

    const message = msg as { id?: unknown; role?: unknown; parts?: unknown[] }
    const role = typeof message.role === "string" ? message.role : null
    if (role !== "user" && role !== "assistant" && role !== "system") continue

    const rawParts = Array.isArray(message.parts) ? message.parts : []
    const safeParts: Array<Record<string, unknown>> = []

    for (const part of rawParts) {
      if (!part || typeof part !== "object") continue
      const p = part as { type?: unknown; text?: unknown; state?: unknown }
      if (typeof p.type !== "string") continue

      if (p.type === "text" && typeof p.text === "string") {
        if (p.state === "streaming") continue
        const textPart: Record<string, unknown> = { type: "text", text: p.text }
        if (typeof p.state === "string") textPart.state = p.state
        safeParts.push(textPart)
        continue
      }

      if (p.type.startsWith("tool-")) {
        const toolPart: Record<string, unknown> = { ...(part as Record<string, unknown>) }
        if (typeof p.state !== "string") {
          toolPart.state = "output" in p ? "output-available" : "input-available"
        }
        safeParts.push(toolPart)
        continue
      }

      safeParts.push(part as Record<string, unknown>)
    }

    if (safeParts.length === 0) continue
    normalized.push({
      id: typeof message.id === "string" ? message.id : crypto.randomUUID(),
      role,
      parts: safeParts,
    })
  }

  return normalized
}

export function OpenClawChatClient({
  chatId,
  initialMessages = [],
  initialActiveCourse,
  initialAttachments,
}: OpenClawChatClientProps) {
  const [input, setInput] = useState("")
  const [videos, setVideos] = useState<VideoMeta[]>([])
  const [images, setImages] = useState<ImageMeta[]>([])
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [chatList, setChatList] = useState<ChatItem[]>([])
  const [approvalInFlightIds, setApprovalInFlightIds] = useState<string[]>([])
  const [approvalErrors, setApprovalErrors] = useState<Record<string, string>>({})
  const [directDraftState, setDirectDraftState] = useState<
    Record<string, { loading: boolean; error?: string; editorUrl?: string }>
  >({})
  const [activeCourse, setActiveCourse] = useState<ActiveCourseMeta | null>(null)
  const [courseOptions, setCourseOptions] = useState<CourseOption[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState<string>("")
  const [courseOptionsLoading, setCourseOptionsLoading] = useState(false)
  const [activeCourseModules, setActiveCourseModules] = useState<CourseModuleMeta[]>([])
  const [selectedVideoId, setSelectedVideoId] = useState<string>("")
  const [selectedModuleOrder, setSelectedModuleOrder] = useState<string>("")
  const [directAttachState, setDirectAttachState] = useState<{
    loading: boolean
    error?: string
    success?: string
  }>({ loading: false })
  const [contentCheckOpen, setContentCheckOpen] = useState(false)
  const [contentCheckData, setContentCheckData] = useState<{ content: Array<{ key: string; value: string }>; hint?: string } | null>(null)
  const [contentCheckLoading, setContentCheckLoading] = useState(false)
  const [contentCheckError, setContentCheckError] = useState<string | null>(null)
  const [attachmentsExpanded, setAttachmentsExpanded] = useState(false)
  const [stateBootstrapped, setStateBootstrapped] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const lastSentRef = useRef<{ text: string; at: number } | null>(null)

  const fetchContentCheck = useCallback(async () => {
    setContentCheckLoading(true)
    setContentCheckError(null)
    try {
      const res = await fetch("/api/admin/ai-chat/content-check")
      const data = await res.json()
      if (!res.ok) {
        setContentCheckError(data?.error === "Forbidden" ? "Нет доступа. Войди в админку под учёткой админа." : (data?.error ?? "Ошибка"))
        setContentCheckData(null)
        return
      }
      setContentCheckData(data)
    } catch (e) {
      setContentCheckError(e instanceof Error ? e.message : "Ошибка запроса")
      setContentCheckData(null)
    } finally {
      setContentCheckLoading(false)
    }
  }, [])

  useEffect(() => {
    if (contentCheckOpen) fetchContentCheck()
  }, [contentCheckOpen, fetchContentCheck])

  useEffect(() => {
    fetch("/api/admin/agent-chats")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => data?.chats && setChatList(data.chats))
      .catch(() => {})
  }, [chatId])

  const updateVideo = useCallback((id: string, updates: Partial<VideoMeta>) => {
    setVideos((prev) =>
      prev.map((v) => (v.id === id ? { ...v, ...updates } : v)),
    )
  }, [])

  const processPendingFiles = useCallback(async () => {
    if (pendingFiles.length === 0) return
    setIsUploading(true)
    const files = [...pendingFiles]
    setPendingFiles([])

    for (const file of files) {
      if (isImageFile(file)) {
        if (file.size > MAX_IMAGE_SIZE) {
          setImages((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              fileName: file.name,
              url: "",
              progress: 100,
              error: "Макс. 10 МБ",
            },
          ])
          continue
        }
        const meta: ImageMeta = {
          id: crypto.randomUUID(),
          fileName: file.name,
          url: "",
          progress: 0,
        }
        setImages((prev) => [...prev, meta])
        try {
          const formData = new FormData()
          formData.append("file", file)
          const res = await fetch("/api/admin/ai-chat/upload-image", {
            method: "POST",
            body: formData,
          })
          if (!res.ok) throw new Error("Ошибка")
          const { url } = await res.json()
          setImages((prev) =>
            prev.map((i) => (i.id === meta.id ? { ...i, url, progress: 100 } : i)),
          )
        } catch (err) {
          setImages((prev) =>
            prev.map((i) =>
              i.id === meta.id
                ? { ...i, error: err instanceof Error ? err.message : "Ошибка" }
                : i,
            ),
          )
        }
        continue
      }

      if (!isVideoFile(file) || file.size > MAX_VIDEO_SIZE) continue

      const meta: VideoMeta = {
        id: crypto.randomUUID(),
        fileName: file.name,
        fileSize: file.size,
        uploadId: "",
        progress: 0,
      }
      setVideos((prev) => [...prev, meta])

      try {
        const res = await fetch("/api/admin/ai-chat/upload-video", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileName: file.name }),
        })
        if (!res.ok) throw new Error("Ошибка")

        const { uploadUrl, uploadId } = await res.json()
        meta.uploadId = uploadId

        await new Promise<void>((resolve, reject) => {
          const worker = new Worker("/upload-worker.js")
          worker.onmessage = (ev) => {
            const { type, progress, error } = ev.data
            if (type === "progress") {
              setVideos((prev) =>
                prev.map((v) =>
                  v.id === meta.id ? { ...v, progress } : v,
                ),
              )
            } else if (type === "done") {
              setVideos((prev) =>
                prev.map((v) =>
                  v.id === meta.id
                    ? { ...v, progress: 100, muxStatus: "preparing" }
                    : v,
                ),
              )
              worker.terminate()
              resolve()
            } else if (type === "error") {
              worker.terminate()
              reject(new Error(error))
            }
          }
          worker.onerror = () => {
            worker.terminate()
            reject(new Error("Worker error"))
          }
          file.arrayBuffer().then((buf) => {
            worker.postMessage(
              {
                type: "upload",
                uploadUrl,
                fileData: buf,
                mimeType: file.type || "video/mp4",
                id: meta.id,
              },
              [buf],
            )
          })
        })
      } catch (err) {
        setVideos((prev) =>
          prev.map((v) =>
            v.id === meta.id
              ? { ...v, error: err instanceof Error ? err.message : "Ошибка" }
              : v,
          ),
        )
      }
    }

    setIsUploading(false)
  }, [pendingFiles])

  useEffect(() => {
    processPendingFiles()
  }, [processPendingFiles])

  const videosRef = useRef(videos)
  videosRef.current = videos
  const imagesRef = useRef(images)
  imagesRef.current = images
  const activeCourseRef = useRef<ActiveCourseMeta | null>(activeCourse)
  activeCourseRef.current = activeCourse

  const normalizedInitialActiveCourse = useMemo(
    () => normalizeActiveCourse(initialActiveCourse),
    [initialActiveCourse],
  )
  const normalizedInitialAttachments = useMemo(
    () => normalizeAttachments(initialAttachments),
    [initialAttachments],
  )

  const activeCourseStorageKey = useMemo(
    () => `agent-active-course:${chatId}`,
    [chatId],
  )
  const attachmentsStorageKey = useMemo(
    () => `agent-attachments:${chatId}`,
    [chatId],
  )

  useEffect(() => {
    const serverActive = normalizedInitialActiveCourse
    let nextActive = serverActive

    if (!nextActive) {
      try {
        const raw = localStorage.getItem(activeCourseStorageKey)
        nextActive = raw ? normalizeActiveCourse(JSON.parse(raw)) : null
      } catch {
        nextActive = null
      }
    }
    setActiveCourse(nextActive)

    const serverAttachments = normalizedInitialAttachments
    let nextVideos = serverAttachments.videos
    let nextImages = serverAttachments.images

    if (nextVideos.length === 0 && nextImages.length === 0) {
      try {
        const raw = localStorage.getItem(attachmentsStorageKey)
        if (raw) {
          const parsed = normalizeAttachments(JSON.parse(raw))
          nextVideos = parsed.videos
          nextImages = parsed.images
        }
      } catch {
        // ignore parse fallback errors
      }
    }
    setVideos(nextVideos)
    setImages(nextImages)
    setStateBootstrapped(true)
  }, [
    activeCourseStorageKey,
    attachmentsStorageKey,
    normalizedInitialActiveCourse,
    normalizedInitialAttachments,
  ])

  useEffect(() => {
    if (!stateBootstrapped) return
    try {
      if (activeCourse) {
        localStorage.setItem(activeCourseStorageKey, JSON.stringify(activeCourse))
      } else {
        localStorage.removeItem(activeCourseStorageKey)
      }
    } catch {
      // ignore persistence errors
    }
  }, [activeCourse, activeCourseStorageKey, stateBootstrapped])

  const bindCourseToChat = useCallback(() => {
    const picked = courseOptions.find((c) => c.id === selectedCourseId)
    if (!picked) {
      setDirectAttachState({ loading: false, error: "Выберите курс для привязки." })
      return
    }
    setActiveCourse({
      courseId: picked.id,
      title: picked.title,
      slug: picked.slug,
      editorUrl: `/admin/courses/${picked.id}`,
    })
    setDirectAttachState({ loading: false, success: `Курс "${picked.title}" выбран для этого чата.` })
  }, [courseOptions, selectedCourseId])

  useEffect(() => {
    if (!activeCourse?.courseId) {
      setActiveCourseModules([])
      setSelectedModuleOrder("")
      return
    }
    fetch(`/api/admin/courses/${activeCourse.courseId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const modules = Array.isArray(data?.course?.modules) ? data.course.modules : []
        const normalized = modules
          .map((m: { id?: unknown; title?: unknown; order?: unknown }) => ({
            id: typeof m.id === "string" ? m.id : "",
            title: typeof m.title === "string" ? m.title : "Модуль",
            order: typeof m.order === "number" ? m.order : 0,
          }))
          .filter((m: CourseModuleMeta) => !!m.id && m.order > 0)
          .sort((a: CourseModuleMeta, b: CourseModuleMeta) => a.order - b.order)
        setActiveCourseModules(normalized)
        setSelectedModuleOrder((prev) =>
          prev || (normalized.length > 0 ? String(normalized[0].order) : ""),
        )
      })
      .catch(() => {
        setActiveCourseModules([])
      })
  }, [activeCourse?.courseId])

  const readyVideos = useMemo(
    () => videos.filter((v) => v.muxStatus === "ready" && !v.error && !!v.muxAssetId && !!v.muxPlaybackId),
    [videos],
  )
  const readyVideosForMenu = useMemo(
    () => [...readyVideos].reverse(),
    [readyVideos],
  )
  const prevReadyVideoIdsRef = useRef<string[]>([])

  useEffect(() => {
    if (readyVideos.length === 0) {
      setSelectedVideoId("")
      prevReadyVideoIdsRef.current = []
      return
    }

    const currentIds = readyVideos.map((v) => v.id)
    const prevIds = prevReadyVideoIdsRef.current
    prevReadyVideoIdsRef.current = currentIds

    // Если появилось новое готовое видео — выбираем его автоматически.
    const newlyReadyIds = currentIds.filter((id) => !prevIds.includes(id))
    if (newlyReadyIds.length > 0) {
      for (let i = currentIds.length - 1; i >= 0; i--) {
        const id = currentIds[i]
        if (newlyReadyIds.includes(id)) {
          setSelectedVideoId(id)
          return
        }
      }
    }

    setSelectedVideoId((prev) => (prev && currentIds.includes(prev) ? prev : currentIds[currentIds.length - 1]))
  }, [readyVideos])

  useEffect(() => {
    if (readyVideos.length === 0) return
    setCourseOptionsLoading(true)
    fetch("/api/admin/courses")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const list = Array.isArray(data?.courses) ? data.courses : []
        const normalized = list
          .map((c: { id?: unknown; title?: unknown; slug?: unknown }) => ({
            id: typeof c.id === "string" ? c.id : "",
            title: typeof c.title === "string" ? c.title : "Курс",
            slug: typeof c.slug === "string" ? c.slug : "",
          }))
          .filter((c: CourseOption) => !!c.id)
        setCourseOptions(normalized)
        if (!activeCourse?.courseId) {
          setSelectedCourseId((prev) =>
            prev && normalized.some((c: CourseOption) => c.id === prev)
              ? prev
              : (normalized[0]?.id ?? ""),
          )
        }
      })
      .catch(() => {
        setCourseOptions([])
      })
      .finally(() => {
        setCourseOptionsLoading(false)
      })
  }, [readyVideos.length, activeCourse?.courseId])

  useEffect(() => {
    if (!stateBootstrapped) return
    try {
      localStorage.setItem(
        attachmentsStorageKey,
        JSON.stringify({
          videos,
          images,
        }),
      )
    } catch {
      // ignore persistence errors
    }
  }, [videos, images, attachmentsStorageKey, stateBootstrapped])

  useEffect(() => {
    if (!stateBootstrapped) return
    const timer = setTimeout(() => {
      fetch(`/api/admin/agent-chats/${chatId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activeCourse,
          attachments: { videos, images },
        }),
      }).catch(() => {
        // ignore sync errors
      })
    }, 500)
    return () => clearTimeout(timer)
  }, [chatId, activeCourse, videos, images, stateBootstrapped])

  const [transport] = useState(
    () =>
      new DefaultChatTransport({
        api: "/api/admin/ai-chat",
        body: {},
        prepareSendMessagesRequest: ({ id, messages: msgs }) => ({
          body: {
            id,
            messages: msgs,
            videos: videosRef.current.map((v) => ({
              fileName: v.fileName,
              fileSize: v.fileSize,
              uploadId: v.uploadId,
              muxAssetId: v.muxAssetId,
              muxPlaybackId: v.muxPlaybackId,
              muxStatus: v.muxStatus,
              duration: v.duration,
            })),
            images: imagesRef.current
              .filter((i) => i.url)
              .map((i) => ({ fileName: i.fileName, url: i.url })),
            activeCourse: activeCourseRef.current,
          },
        }),
      }),
  )

  const normalizedInitialMessages = normalizeInitialMessagesForChat(initialMessages)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { messages, sendMessage, status, addToolApprovalResponse, error } = useChat({
    id: chatId,
    messages: normalizedInitialMessages as any,
    transport,
  })

  const sendMessageDedup = useCallback(
    (text: string) => {
      const normalized = text.trim()
      if (!normalized) return
      const now = Date.now()
      const last = lastSentRef.current
      // Защита от двойного клика/двойной отправки одинакового ответа.
      if (last && last.text === normalized && now - last.at < 1500) return
      lastSentRef.current = { text: normalized, at: now }
      sendMessage({ text: normalized })
    },
    [sendMessage],
  )

  const approvalTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const clearApprovalTimer = useCallback((approvalId: string) => {
    const timer = approvalTimersRef.current[approvalId]
    if (timer) {
      clearTimeout(timer)
      delete approvalTimersRef.current[approvalId]
    }
  }, [])

  const clearApprovalState = useCallback(
    (approvalId: string) => {
      clearApprovalTimer(approvalId)
      setApprovalInFlightIds((prev) => prev.filter((id) => id !== approvalId))
      setApprovalErrors((prev) => {
        if (!(approvalId in prev)) return prev
        const next = { ...prev }
        delete next[approvalId]
        return next
      })
    },
    [clearApprovalTimer],
  )

  const submitApproval = useCallback(
    (approvalId: string, approved: boolean) => {
      setApprovalErrors((prev) => {
        if (!(approvalId in prev)) return prev
        const next = { ...prev }
        delete next[approvalId]
        return next
      })
      setApprovalInFlightIds((prev) => (prev.includes(approvalId) ? prev : [...prev, approvalId]))
      clearApprovalTimer(approvalId)
      approvalTimersRef.current[approvalId] = setTimeout(() => {
        setApprovalInFlightIds((prev) => prev.filter((id) => id !== approvalId))
        setApprovalErrors((prev) => ({
          ...prev,
          [approvalId]:
            "Не получили ответ от сервера. Нажмите «Повторить создание» или отправьте подтверждение ещё раз.",
        }))
      }, 25000)

      addToolApprovalResponse({ id: approvalId, approved })
      setTimeout(
        () =>
          sendMessageDedup(
            approved
              ? "Подтверждаю создание черновика курса."
              : "Отменяю создание черновика курса.",
          ),
        0,
      )
    },
    [addToolApprovalResponse, clearApprovalTimer, sendMessageDedup],
  )

  const createDraftDirectly = useCallback(
    async (cardKey: string, structure: StructureDraft) => {
      const modules = Array.isArray(structure.modules) ? structure.modules : []
      if (!structure.title?.trim() || modules.length === 0) {
        setDirectDraftState((prev) => ({
          ...prev,
          [cardKey]: { loading: false, error: "Невалидная структура курса. Сгенерируйте её заново." },
        }))
        return
      }

      setDirectDraftState((prev) => ({
        ...prev,
        [cardKey]: { loading: true },
      }))

      try {
        const res = await fetch("/api/admin/courses/create-draft", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chatId,
            structure: {
              title: structure.title,
              description: structure.description,
              author: structure.author,
              slug: structure.slug,
              modules: modules.map((m) => ({
                title: m.title,
                lessons: (m.lessons ?? []).map((l) => ({
                  title: l.title,
                  description: l.description,
                  videoIndex: l.videoIndex,
                })),
              })),
            },
            videos: videosRef.current.map((v) => ({
              fileName: v.fileName,
              muxAssetId: v.muxAssetId,
              muxPlaybackId: v.muxPlaybackId,
              muxStatus: v.muxStatus,
              duration: v.duration,
            })),
          }),
        })

        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          throw new Error(
            typeof data?.error === "string" ? data.error : "Не удалось создать черновик курса.",
          )
        }

        setDirectDraftState((prev) => ({
          ...prev,
          [cardKey]: { loading: false, editorUrl: data.editorUrl },
        }))
        if (typeof data.courseId === "string" && data.courseId) {
          setActiveCourse({
            courseId: data.courseId,
            title: structure.title,
            slug: typeof data.slug === "string" ? data.slug : undefined,
            editorUrl: typeof data.editorUrl === "string" ? data.editorUrl : undefined,
          })
          setChatList((prev) =>
            prev.map((c) =>
              c.id === chatId && canAutoRenameChatTitle(c.title)
                ? { ...c, title: structure.title, updatedAt: new Date().toISOString() }
                : c,
            ),
          )
        }
      } catch (e) {
        setDirectDraftState((prev) => ({
          ...prev,
          [cardKey]: {
            loading: false,
            error: e instanceof Error ? e.message : "Не удалось создать черновик курса.",
          },
        }))
      }
    },
    [chatId],
  )

  const attachVideoToModuleDirectly = useCallback(async () => {
    if (!activeCourse?.courseId) {
      setDirectAttachState({ loading: false, error: "Сначала создайте или выберите активный курс." })
      return
    }
    const moduleOrder = Number(selectedModuleOrder)
    if (!Number.isFinite(moduleOrder) || moduleOrder < 1) {
      setDirectAttachState({ loading: false, error: "Выберите модуль." })
      return
    }
    const video = readyVideos.find((v) => v.id === selectedVideoId)
    if (!video) {
      setDirectAttachState({ loading: false, error: "Выберите готовое видео." })
      return
    }

    setDirectAttachState({ loading: true })
    try {
      const res = await fetch("/api/admin/courses/add-video-to-module", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: activeCourse.courseId,
          moduleOrder,
          video: {
            fileName: video.fileName,
            muxAssetId: video.muxAssetId,
            muxPlaybackId: video.muxPlaybackId,
            muxStatus: video.muxStatus,
            duration: video.duration,
          },
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(typeof data?.error === "string" ? data.error : "Не удалось добавить видео.")
      }
      setDirectAttachState({
        loading: false,
        success: typeof data?.message === "string" ? data.message : "Видео добавлено в модуль.",
      })
      // Обновим список модулей/уроков в памяти (на случай изменения структуры).
      fetch(`/api/admin/courses/${activeCourse.courseId}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((payload) => {
          const modules = Array.isArray(payload?.course?.modules) ? payload.course.modules : []
          const normalized = modules
            .map((m: { id?: unknown; title?: unknown; order?: unknown }) => ({
              id: typeof m.id === "string" ? m.id : "",
              title: typeof m.title === "string" ? m.title : "Модуль",
              order: typeof m.order === "number" ? m.order : 0,
            }))
            .filter((m: CourseModuleMeta) => !!m.id && m.order > 0)
            .sort((a: CourseModuleMeta, b: CourseModuleMeta) => a.order - b.order)
          setActiveCourseModules(normalized)
        })
        .catch(() => {})
    } catch (e) {
      setDirectAttachState({
        loading: false,
        error: e instanceof Error ? e.message : "Не удалось добавить видео в модуль.",
      })
    }
  }, [activeCourse, readyVideos, selectedModuleOrder, selectedVideoId])

  useEffect(
    () => () => {
      Object.values(approvalTimersRef.current).forEach(clearTimeout)
      approvalTimersRef.current = {}
    },
    [],
  )

  useEffect(() => {
    for (const message of messages) {
      for (const part of message.parts ?? []) {
        if (!part || typeof part !== "object") continue
        const p = part as { type?: string; state?: string; approval?: { id?: string } }
        if (p.type !== "tool-createDraftCourse" && p.type !== "tool-courses_create_draft") continue
        const approvalId = typeof p.approval?.id === "string" ? p.approval.id : null
        if (!approvalId) continue

        if (p.state === "output-available" || p.state === "output-error") {
          clearApprovalState(approvalId)
        }
      }
    }
  }, [messages, clearApprovalState])

  useEffect(() => {
    if (!error || approvalInFlightIds.length === 0) return
    setApprovalErrors((prev) => {
      const next = { ...prev }
      for (const id of approvalInFlightIds) {
        next[id] = error.message || "Ошибка при создании черновика курса."
      }
      return next
    })
    setApprovalInFlightIds([])
    for (const id of approvalInFlightIds) clearApprovalTimer(id)
  }, [error, approvalInFlightIds, clearApprovalTimer])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (status === "streaming") return
      const text = input.trim()
      if (!text && videos.length === 0 && images.length === 0) return
      sendMessageDedup(text || (videos.length > 0 || images.length > 0 ? "Файлы прикреплены" : ""))
      setInput("")
    },
    [input, videos.length, images.length, sendMessageDedup, status],
  )

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files?.length) return
    setPendingFiles((prev) => [...prev, ...Array.from(files)])
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const files = e.dataTransfer.files
      if (files.length) handleFileSelect(files)
    },
    [handleFileSelect],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const formatChatDate = (iso: string) => {
    const d = new Date(iso)
    const now = new Date()
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
    }
    return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" })
  }

  const visibleMessages = useMemo(() => {
    const getAssistantText = (msg: (typeof messages)[number]): string | null => {
      if (msg.role !== "assistant") return null
      const textParts = (msg.parts ?? [])
        .filter((p): p is { type: "text"; text: string } => p?.type === "text" && typeof p.text === "string")
        .map((p) => p.text.trim())
        .filter(Boolean)
      const hasToolParts = (msg.parts ?? []).some((p) => typeof p?.type === "string" && p.type.startsWith("tool-"))
      if (hasToolParts || textParts.length === 0) return null
      return textParts.join("\n").trim()
    }

    const filtered: typeof messages = []
    for (const msg of messages) {
      const prev = filtered[filtered.length - 1]
      const currentText = getAssistantText(msg)
      const prevText = prev ? getAssistantText(prev) : null
      if (currentText && prevText && currentText === prevText) {
        continue
      }
      filtered.push(msg)
    }
    return filtered
  }, [messages])

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="hidden">
        <div className="flex flex-1 items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <Dialog open={contentCheckOpen} onOpenChange={(open) => { setContentCheckOpen(open); if (!open) setContentCheckError(null) }}>
          <DialogTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
            >
              <FileText className="h-4 w-4" />
              Контент сайта
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-xl max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                Контент сайта (как видит OpenClaw)
                <button
                  type="button"
                  className="rounded p-1.5 hover:bg-muted disabled:opacity-50"
                  onClick={(e) => { e.preventDefault(); fetchContentCheck() }}
                  disabled={contentCheckLoading}
                  aria-label="Обновить"
                >
                  <RefreshCw className={cn("h-4 w-4", contentCheckLoading && "animate-spin")} />
                </button>
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto space-y-3">
              {contentCheckError && (
                <p className="text-sm text-destructive">{contentCheckError}</p>
              )}
              {contentCheckLoading && !contentCheckData && (
                <p className="text-sm text-muted-foreground">Загрузка…</p>
              )}
              {contentCheckData?.content && (
                <>
                  {contentCheckData.hint && (
                    <p className="text-xs text-muted-foreground">{contentCheckData.hint}</p>
                  )}
                  <ul className="space-y-2 text-sm">
                    {contentCheckData.content.map(({ key, value }) => (
                      <li key={key} className="rounded border border-border bg-muted/30 px-3 py-2">
                        <span className="font-medium text-muted-foreground">{key}:</span>{" "}
                        <span className="break-words">{value || "(пусто)"}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar: список чатов */}
        <aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-muted/30 sm:flex">
          <Link
            href="/admin/agent"
            className="flex items-center gap-2 border-b border-border px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
          >
            <MessageSquarePlus className="h-4 w-4" />
            Новый чат
          </Link>
          <div className="flex-1 overflow-y-auto p-2">
            {chatList.map((c) => (
              <Link
                key={c.id}
                href={`/admin/agent?chat=${c.id}`}
                className={cn(
                  "mb-1 flex flex-col rounded-lg px-3 py-2 text-left text-sm transition-colors",
                  c.id === chatId
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <span className="truncate font-medium">{c.title}</span>
                <span className="text-xs opacity-80">{formatChatDate(c.updatedAt)}</span>
              </Link>
            ))}
          </div>
        </aside>

        {/* Messages */}
        <div className="flex flex-1 flex-col min-h-0">
      <div
        className="flex-1 overflow-y-auto p-4"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        {error && (
          <div className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Ошибка: {error.message}
          </div>
        )}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-4 py-16 text-center text-muted-foreground">
            <Sparkles className="h-12 w-12" />
            <p className="max-w-sm">
              Привет! Я Агент. Прикрепите видео или фото (📎 или перетащите) и
              расскажите, какой курс хотите создать.
            </p>
          </div>
        )}

        <div className="space-y-4">
          {visibleMessages.map((message, idx) => (
            <div
              key={message.id ? `${message.id}-${idx}` : `msg-${idx}`}
              className={cn(
                "flex gap-3",
                message.role === "user" ? "justify-end" : "justify-start",
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-xl px-4 py-3",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted",
                )}
              >
                <div className="space-y-2">
                  {message.parts?.map((part, i) => {
                    if (!part) return null
                    if (part.type === "text") {
                      const safeText = message.role === "assistant"
                        ? hideRawJsonDumpInAssistantText(part.text)
                        : part.text
                      // Дедупликация: пропускаем текст, идентичный предыдущей text-части (цикл maxSteps)
                      const prevTextPart = message.parts
                        ?.slice(0, i)
                        .reverse()
                        .find((p): p is { type: "text"; text: string } => p?.type === "text")
                      if (
                        message.role === "assistant" &&
                        prevTextPart &&
                        hideRawJsonDumpInAssistantText(prevTextPart.text) === safeText
                      ) {
                        return null
                      }
                      const choice = message.role === "assistant" ? parseChoiceOptions(safeText) : null
                      if (choice) {
                        return (
                          <div
                            key={`${message.id}-text-${i}`}
                            className="space-y-3"
                          >
                            <div className="whitespace-pre-wrap break-words">
                              {choice.intro}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {choice.options.map((option) => (
                                <button
                                  key={option}
                                  type="button"
                                  className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                                  disabled={status === "streaming"}
                                  onClick={() => {
                                    if (status === "streaming") return
                                    sendMessageDedup(option)
                                  }}
                                >
                                  {option}
                                </button>
                              ))}
                            </div>
                          </div>
                        )
                      }
                      return (
                        <div
                          key={`${message.id}-text-${i}`}
                          className="whitespace-pre-wrap break-words"
                        >
                          {safeText}
                        </div>
                      )
                    }

                    if (
                      part?.type === "tool-createDraftCourse" &&
                      (part as { state?: string })?.state === "approval-requested" &&
                      part &&
                      "approval" in part
                    ) {
                      const approvalId = (part as { approval: { id: string } }).approval.id
                      const approvalInFlight = approvalInFlightIds.includes(approvalId)
                      const approvalError = approvalErrors[approvalId]
                      return (
                        <div key={`${message.id}-approval-${i}`} className="space-y-2">
                          <p className="text-sm font-medium">Создать курс?</p>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                              disabled={approvalInFlight}
                              onClick={() => {
                                if (approvalInFlight) return
                                submitApproval(approvalId, true)
                              }}
                            >
                              {approvalInFlight ? "Отправляю..." : "Создать"}
                            </button>
                            <button
                              type="button"
                              className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted"
                              disabled={approvalInFlight}
                              onClick={() => {
                                if (approvalInFlight) return
                                submitApproval(approvalId, false)
                              }}
                            >
                              Отмена
                            </button>
                          </div>
                          {approvalInFlight && (
                            <p className="text-xs text-muted-foreground">
                              Создаю черновик... обычно это занимает 5-20 секунд.
                            </p>
                          )}
                          {approvalError && (
                            <div className="space-y-2">
                              <p className="text-xs text-destructive">{approvalError}</p>
                              <button
                                type="button"
                                className="rounded-lg border border-destructive/40 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10"
                                onClick={() => submitApproval(approvalId, true)}
                              >
                                Повторить создание
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    }

                    if (
                      (part?.type === "tool-createDraftCourse" ||
                        part?.type === "tool-courses_create_draft") &&
                      (part as { state?: string })?.state === "output-available" &&
                      part &&
                      "output" in part
                    ) {
                      let editorUrl: string | null = null
                      try {
                        const parsed = JSON.parse(String((part as { output: unknown }).output))
                        editorUrl = parsed.editorUrl ?? null
                      } catch {
                        // ignore
                      }
                      return (
                        <div key={`${message.id}-output-${i}`} className="space-y-2">
                          <p className="text-sm text-green-600">Курс создан!</p>
                          {editorUrl && (
                            <Link
                              href={editorUrl}
                              className="inline-flex items-center gap-1 text-sm font-medium underline"
                            >
                              Открыть в редакторе →
                            </Link>
                          )}
                        </div>
                      )
                    }

                    if (
                      part.type === "tool-generateCourseStructure" &&
                      "output" in part
                    ) {
                      try {
                        const structure = JSON.parse(
                          String((part as { output: unknown }).output),
                        ) as StructureDraft
                        const cardKey = `${message.id}-structure-${i}`
                        const directState = directDraftState[cardKey]
                        return (
                          <div
                            key={cardKey}
                            className="rounded-lg border border-border bg-background p-3 text-sm"
                          >
                            <p className="mb-2 font-medium">{structure.title}</p>
                            {structure.description && (
                              <p className="mb-2 text-muted-foreground">
                                {structure.description}
                              </p>
                            )}
                            <div className="space-y-1">
                              {structure.modules?.map?.(
                                (
                                  mod: { title: string; lessons?: Array<{ title: string }> },
                                  mi: number,
                                ) => (
                                  <div key={mi}>
                                    <p className="font-medium">
                                      Модуль {mi + 1}: {mod.title}
                                    </p>
                                    {mod.lessons?.map?.(
                                      (les: { title: string }, li: number) => (
                                        <p
                                          key={li}
                                          className="ml-4 text-muted-foreground"
                                        >
                                          — {les.title}
                                        </p>
                                      ),
                                    )}
                                  </div>
                                ),
                              )}
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <button
                                type="button"
                                className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                                disabled={status === "streaming" || !!directState?.loading}
                                onClick={() => {
                                  if (status === "streaming" || directState?.loading) return
                                  createDraftDirectly(cardKey, structure)
                                }}
                              >
                                {directState?.loading ? "Создаю..." : "Создать курс"}
                              </button>
                              <button
                                type="button"
                                className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted disabled:opacity-50"
                                disabled={status === "streaming" || !!directState?.loading}
                                onClick={() => {
                                  if (status === "streaming" || directState?.loading) return
                                  sendMessageDedup("Изменить структуру курса")
                                }}
                              >
                                Изменить структуру
                              </button>
                            </div>
                            {directState?.error && (
                              <p className="mt-2 text-xs text-destructive">{directState.error}</p>
                            )}
                            {directState?.editorUrl && (
                              <div className="mt-2">
                                <p className="text-xs text-green-600">Черновик создан успешно.</p>
                                <Link
                                  href={directState.editorUrl}
                                  className="text-xs font-medium underline"
                                >
                                  Открыть курс в редакторе →
                                </Link>
                              </div>
                            )}
                          </div>
                        )
                      } catch {
                        return (
                          <pre
                            key={`${message.id}-raw-${i}`}
                            className="overflow-auto text-xs"
                          >
                            {String((part as { output: unknown }).output)}
                          </pre>
                        )
                      }
                    }

                    if (
                      typeof part.type === "string" &&
                      part.type.startsWith("tool-") &&
                      (part as { state?: string })?.state === "output-available" &&
                      "output" in part
                    ) {
                      return (
                        <div key={`${message.id}-tool-${i}`} className="space-y-2">
                          {renderGenericToolOutput((part as { output: unknown }).output)}
                        </div>
                      )
                    }

                    return null
                  })}
                </div>
              </div>
            </div>
          ))}

          {status === "streaming" && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-xl bg-muted px-4 py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Печатает...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Attached files preview */}
      {(videos.length > 0 || images.length > 0) && (
        <div className="shrink-0 border-t border-border bg-muted/30 px-4 py-2">
          <button
            type="button"
            className="flex w-full items-center justify-between rounded-md px-1 py-1 text-left text-sm hover:bg-muted/60"
            onClick={() => setAttachmentsExpanded((prev) => !prev)}
          >
            <span className="font-medium">
              Вложения: {videos.length + images.length}
            </span>
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              {videos.some((v) => v.progress < 100 && !v.error) ? "Идёт загрузка" : "Готово"}
              {attachmentsExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </span>
          </button>
          {attachmentsExpanded && (
            <div className="mt-2">
              {videos.some((v) => v.progress < 100 && !v.error) && (
                <p className="mb-2 text-xs text-muted-foreground">
                  Загрузка продолжается в фоне. Можно переключать вкладки.
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {videos.map((v) => (
                  <VideoAttachmentCard
                    key={v.id}
                    video={v}
                    onStatusUpdate={updateVideo}
                  />
                ))}
                {images.map((img) => (
                  <ImageAttachmentCard key={img.id} image={img} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {readyVideos.length > 0 && (
        <div className="shrink-0 border-t border-border bg-card px-4 py-3">
          <div className="rounded-lg border border-border bg-background p-3">
            <p className="text-sm font-medium">Быстрое добавление видео в модуль</p>
            {activeCourse?.courseId ? (
              <>
                <p className="text-xs text-muted-foreground">Курс: {activeCourse.title}</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  <select
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                    value={selectedVideoId}
                    onChange={(e) => {
                      setSelectedVideoId(e.target.value)
                      setDirectAttachState({ loading: false })
                    }}
                    disabled={directAttachState.loading || readyVideos.length === 0}
                  >
                    {readyVideosForMenu.length === 0 ? (
                      <option value="">Нет готовых видео</option>
                    ) : (
                      readyVideosForMenu.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.fileName}
                        </option>
                      ))
                    )}
                  </select>

                  <select
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                    value={selectedModuleOrder}
                    onChange={(e) => {
                      setSelectedModuleOrder(e.target.value)
                      setDirectAttachState({ loading: false })
                    }}
                    disabled={directAttachState.loading || activeCourseModules.length === 0}
                  >
                    {activeCourseModules.length === 0 ? (
                      <option value="">Нет модулей</option>
                    ) : (
                      activeCourseModules.map((m) => (
                        <option key={m.id} value={String(m.order)}>
                          Модуль {m.order}: {m.title}
                        </option>
                      ))
                    )}
                  </select>

                  <button
                    type="button"
                    className="h-9 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    onClick={attachVideoToModuleDirectly}
                    disabled={
                      directAttachState.loading ||
                      !selectedVideoId ||
                      !selectedModuleOrder ||
                      readyVideos.length === 0 ||
                      activeCourseModules.length === 0
                    }
                  >
                    {directAttachState.loading ? "Добавляю..." : "Добавить видео в модуль"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">
                  Выберите курс, к которому нужно привязать загруженное видео.
                </p>
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  <select
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                    value={selectedVideoId}
                    onChange={(e) => {
                      setSelectedVideoId(e.target.value)
                      setDirectAttachState({ loading: false })
                    }}
                    disabled={directAttachState.loading || readyVideos.length === 0}
                  >
                    {readyVideosForMenu.length === 0 ? (
                      <option value="">Нет готовых видео</option>
                    ) : (
                      readyVideosForMenu.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.fileName}
                        </option>
                      ))
                    )}
                  </select>

                  <select
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                    value={selectedCourseId}
                    onChange={(e) => {
                      setSelectedCourseId(e.target.value)
                      setDirectAttachState({ loading: false })
                    }}
                    disabled={directAttachState.loading || courseOptionsLoading || courseOptions.length === 0}
                  >
                    {courseOptionsLoading ? (
                      <option value="">Загружаю курсы...</option>
                    ) : courseOptions.length === 0 ? (
                      <option value="">Нет доступных курсов</option>
                    ) : (
                      courseOptions.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title}
                        </option>
                      ))
                    )}
                  </select>

                  <button
                    type="button"
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-muted disabled:opacity-50"
                    onClick={bindCourseToChat}
                    disabled={
                      directAttachState.loading ||
                      !selectedVideoId ||
                      !selectedCourseId ||
                      courseOptions.length === 0
                    }
                  >
                    Выбрать курс
                  </button>
                </div>
              </>
            )}
            {directAttachState.error && (
              <p className="mt-2 text-xs text-destructive">{directAttachState.error}</p>
            )}
            {directAttachState.success && (
              <p className="mt-2 text-xs text-green-600">{directAttachState.success}</p>
            )}
          </div>
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="shrink-0 border-t border-border bg-card p-4"
      >
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/quicktime,video/webm,video/x-msvideo,video/x-matroska,.mp4,.mov,.webm,.avi,.mkv,image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
            multiple
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
          />
          <button
            type="button"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border hover:bg-muted disabled:opacity-50"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <Paperclip className="h-4 w-4" />
          </button>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Сообщение для Агента..."
            className="min-h-[44px] resize-none"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSubmit(e as unknown as React.FormEvent)
              }
            }}
          />
          <button
            type="submit"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            disabled={status === "streaming"}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
        </div>
      </div>
    </div>
  )
}
