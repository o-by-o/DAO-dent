"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import {
  Upload,
  Film,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  RefreshCw,
} from "lucide-react"

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type UploadStatus =
  | "idle"
  | "requesting_url"
  | "uploading"
  | "processing"
  | "ready"
  | "error"

interface VideoUploadProps {
  courseId: string
  lessonId: string
  /** Текущий статус Mux: null | "waiting_for_upload" | "preparing" | "ready" | "errored" */
  muxStatus: string | null
  muxPlaybackId: string | null
  /** Вызывается после успешного начала загрузки (для обновления UI) */
  onUploadStarted?: () => void
  /** Вызывается при удалении видео */
  onVideoDeleted?: () => void
  /** Вызывается когда статус видео изменился (например, стал ready) */
  onStatusChanged?: (data: { muxStatus: string; muxPlaybackId: string | null }) => void
}

/* ------------------------------------------------------------------ */
/*  Допустимые типы файлов                                            */
/* ------------------------------------------------------------------ */

const ACCEPTED_TYPES = [
  "video/mp4",
  "video/quicktime",   // .mov
  "video/webm",
  "video/x-msvideo",   // .avi
  "video/x-matroska",  // .mkv
]

const MAX_FILE_SIZE = 10 * 1024 * 1024 * 1024 // 10 GB

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function VideoUpload({
  courseId,
  lessonId,
  muxStatus,
  muxPlaybackId,
  onUploadStarted,
  onVideoDeleted,
  onStatusChanged,
}: VideoUploadProps) {
  const [status, setStatus] = useState<UploadStatus>(() => {
    if (muxStatus === "ready" && muxPlaybackId) return "ready"
    if (muxStatus === "preparing") return "processing"
    if (muxStatus === "errored") return "error"
    return "idle"
  })
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState("")
  const [fileName, setFileName] = useState("")
  const [isDragging, setIsDragging] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [checking, setChecking] = useState(false)
  const [playbackId, setPlaybackId] = useState(muxPlaybackId)

  const [uploadId, setUploadId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const xhrRef = useRef<XMLHttpRequest | null>(null)
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  /* ---- Синхронизация с внешним состоянием (родитель обновил урок) ---- */
  useEffect(() => {
    setPlaybackId(muxPlaybackId)
    if (muxStatus === "ready" && muxPlaybackId) {
      setStatus("ready")
      return
    }
    if (muxStatus === "preparing") {
      setStatus("processing")
      return
    }
    if (muxStatus === "errored") {
      setStatus("error")
      return
    }
    if (!muxStatus) {
      setStatus("idle")
    }
  }, [muxStatus, muxPlaybackId])

  /* ---- Check status (polling Mux через наш API) ---- */

  const checkStatus = useCallback(async () => {
    setChecking(true)
    try {
      const params = new URLSearchParams({ lessonId })
      if (uploadId) params.set("uploadId", uploadId)
      const res = await fetch(
        `/api/admin/courses/${courseId}/video-upload?${params}`,
      )
      if (!res.ok) return

      const data = await res.json()

      if (data.muxStatus === "ready") {
        setStatus("ready")
        setPlaybackId(data.muxPlaybackId)
        onStatusChanged?.({ muxStatus: "ready", muxPlaybackId: data.muxPlaybackId })
      } else if (data.muxStatus === "errored") {
        setStatus("error")
        setError("Mux не смог обработать видео")
        onStatusChanged?.({ muxStatus: "errored", muxPlaybackId: null })
      }
      // если всё ещё "preparing" — ничего не меняем
    } catch {
      // ignore — следующий poll попробует
    } finally {
      setChecking(false)
    }
  }, [courseId, lessonId, uploadId, onStatusChanged])

  /* ---- Auto-poll в статусе processing (каждые 10 сек) ---- */

  useEffect(() => {
    if (status !== "processing") {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current)
        pollTimerRef.current = null
      }
      return
    }

    // Первая проверка через 8 секунд, потом каждые 10 секунд
    const timer = setInterval(() => {
      checkStatus()
    }, 10_000)

    pollTimerRef.current = timer

    // Первая проверка через 8 секунд
    const firstCheck = setTimeout(checkStatus, 8_000)

    return () => {
      clearInterval(timer)
      clearTimeout(firstCheck)
      pollTimerRef.current = null
    }
  }, [status, checkStatus])

  /* ---- Upload flow ---- */

  const startUpload = useCallback(
    async (file: File) => {
      // Валидация
      if (!ACCEPTED_TYPES.includes(file.type) && !file.name.match(/\.(mp4|mov|webm|avi|mkv)$/i)) {
        setError("Неподдерживаемый формат. Используйте MP4, MOV, WebM, AVI или MKV.")
        return
      }

      if (file.size > MAX_FILE_SIZE) {
        setError("Файл слишком большой. Максимум 10 ГБ.")
        return
      }

      setError("")
      setFileName(file.name)
      setStatus("requesting_url")
      setProgress(0)

      try {
        // 1. Запрашиваем Direct Upload URL у нашего API
        const res = await fetch(`/api/admin/courses/${courseId}/video-upload`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lessonId }),
        })

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || `Ошибка ${res.status}`)
        }

        const { uploadUrl, uploadId: newUploadId } = await res.json()
        setUploadId(newUploadId)

        // 2. Загружаем файл напрямую в Mux через PUT
        setStatus("uploading")
        onUploadStarted?.()

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest()
          xhrRef.current = xhr

          xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) {
              const pct = Math.round((e.loaded / e.total) * 100)
              setProgress(pct)
            }
          })

          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve()
            } else {
              reject(new Error(`Upload failed: ${xhr.status}`))
            }
          })

          xhr.addEventListener("error", () => {
            reject(new Error("Сетевая ошибка при загрузке"))
          })

          xhr.addEventListener("abort", () => {
            reject(new Error("Загрузка отменена"))
          })

          xhr.open("PUT", uploadUrl)
          xhr.send(file)
        })

        // 3. Файл загружен, ждём обработки Mux
        setStatus("processing")
        xhrRef.current = null
      } catch (err) {
        xhrRef.current = null
        if ((err as Error).message === "Загрузка отменена") {
          setStatus("idle")
          setFileName("")
        } else {
          setStatus("error")
          setError((err as Error).message || "Ошибка загрузки")
        }
      }
    },
    [courseId, lessonId, onUploadStarted],
  )

  /* ---- Cancel upload ---- */

  const cancelUpload = useCallback(() => {
    if (xhrRef.current) {
      xhrRef.current.abort()
    }
  }, [])

  /* ---- Delete video ---- */

  const handleDelete = useCallback(async () => {
    if (!confirm("Удалить видео у этого урока?")) return
    setDeleting(true)
    try {
      const res = await fetch(
        `/api/admin/courses/${courseId}/video-upload?lessonId=${lessonId}`,
        { method: "DELETE" },
      )
      if (res.ok) {
        setStatus("idle")
        setFileName("")
        setProgress(0)
        onVideoDeleted?.()
      }
    } catch {
      setError("Не удалось удалить видео")
    } finally {
      setDeleting(false)
    }
  }, [courseId, lessonId, onVideoDeleted])

  /* ---- Drag & Drop handlers ---- */

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) startUpload(file)
    },
    [startUpload],
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) startUpload(file)
      // Очищаем input чтобы можно было выбрать тот же файл повторно
      e.target.value = ""
    },
    [startUpload],
  )

  /* ---- Render ---- */

  // Видео уже загружено и готово
  if (status === "ready") {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50/50 p-4 dark:border-green-800 dark:bg-green-950/20">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-green-700 dark:text-green-300">
                Видео загружено
              </p>
              <p className="break-all whitespace-normal text-xs text-green-600/70 dark:text-green-400/70">
                Playback ID: {playbackId}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex self-start shrink-0 items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 sm:self-auto dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
          >
            {deleting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
            {deleting ? "Удаление..." : "Удалить видео"}
          </button>
        </div>
      </div>
    )
  }

  // Видео обрабатывается Mux
  if (status === "processing") {
    return (
      <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-800 dark:bg-blue-950/20">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
              Видео обрабатывается
            </p>
            <p className="text-xs text-blue-600/70 dark:text-blue-400/70">
              Mux обрабатывает видео. Это может занять 1–5 минут.
              {fileName && ` Файл: ${fileName}`}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Загрузка файла в Mux
  if (status === "uploading") {
    return (
      <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Film className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              Загрузка: {fileName}
            </span>
          </div>
          <button
            type="button"
            onClick={cancelUpload}
            className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="Отменить загрузку"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="mb-2 h-2.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">{progress}% загружено</p>
      </div>
    )
  }

  // Запрос URL (кратковременное состояние)
  if (status === "requesting_url") {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed border-border p-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Подготовка к загрузке...
        </div>
      </div>
    )
  }

  // Ошибка
  if (status === "error") {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50/50 p-4 dark:border-red-800 dark:bg-red-950/20">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-red-700 dark:text-red-300">
                Ошибка загрузки
              </p>
              <p className="break-words text-xs text-red-600/70 dark:text-red-400/70">
                {error || "Произошла неизвестная ошибка"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setStatus("idle")
              setError("")
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Попробовать снова
          </button>
        </div>
      </div>
    )
  }

  // Состояние по умолчанию: зона перетаскивания
  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-6 transition-colors ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-muted/30"
        }`}
      >
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl ${
            isDragging
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground"
          }`}
        >
          <Upload className="h-6 w-6" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">
            {isDragging ? "Отпустите файл для загрузки" : "Загрузить видео"}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Перетащите файл сюда или нажмите для выбора
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground/60">
            MP4, MOV, WebM, AVI, MKV — до 10 ГБ
          </p>
        </div>
      </div>

      {error && (
        <p className="mt-2 text-xs text-red-500">{error}</p>
      )}
    </div>
  )
}
