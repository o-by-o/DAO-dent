"use client"

import { useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Send, Link2, FileText, CheckCircle2, Loader2 } from "lucide-react"

type HomeworkStatus = "not-submitted" | "reviewing" | "accepted" | "revision"

const statusLabels: Record<HomeworkStatus, { text: string; className: string }> = {
  "not-submitted": {
    text: "Не сдано",
    className: "border-destructive/30 bg-destructive/10 text-destructive",
  },
  reviewing: {
    text: "На проверке",
    className: "border-accent/30 bg-accent/10 text-accent-foreground",
  },
  accepted: {
    text: "Принято",
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700",
  },
  revision: {
    text: "Нужна доработка",
    className: "border-amber-300 bg-amber-50 text-amber-700",
  },
}

interface HomeworkUploadProps {
  lessonId?: string
  initialHomework?: {
    id: string
    fileName: string
    fileUrl: string
    comment: string | null
    status: "SUBMITTED" | "REVIEWED" | "REVISION_NEEDED"
    feedback: string | null
  } | null
}

function mapStatus(value?: "SUBMITTED" | "REVIEWED" | "REVISION_NEEDED"): HomeworkStatus {
  if (value === "REVIEWED") return "accepted"
  if (value === "REVISION_NEEDED") return "revision"
  if (value === "SUBMITTED") return "reviewing"
  return "not-submitted"
}

export function HomeworkUpload({ lessonId, initialHomework }: HomeworkUploadProps) {
  const [fileName, setFileName] = useState(initialHomework?.fileName || "")
  const [fileUrl, setFileUrl] = useState(initialHomework?.fileUrl || "")
  const [comment, setComment] = useState(initialHomework?.comment || "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [latestHomework, setLatestHomework] = useState(initialHomework)

  const status = useMemo(
    () => mapStatus(latestHomework?.status),
    [latestHomework],
  )
  const statusInfo = statusLabels[status]

  async function handleSubmit() {
    if (!fileName.trim() || !fileUrl.trim()) return
    if (!lessonId) {
      setError("Для отправки нужен идентификатор урока")
      return
    }

    setError("")
    setSuccess("")
    setLoading(true)
    try {
      const response = await fetch(`/api/lessons/${lessonId}/homework`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: fileName.trim(),
          fileUrl: fileUrl.trim(),
          comment: comment.trim() || undefined,
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || "Не удалось отправить задание")
        return
      }

      setLatestHomework({
        id: data.homework.id,
        fileName: data.homework.fileName,
        fileUrl: data.homework.fileUrl,
        comment: data.homework.comment ?? null,
        status: data.homework.status,
        feedback: null,
      })
      setSuccess(data.message || "Задание отправлено")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-foreground">
            Практическое задание
          </h4>
          <Badge className={statusInfo.className}>{statusInfo.text}</Badge>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Добавьте ссылку на выполненное задание (Google Drive, Яндекс Диск, Dropbox) и краткое описание вашей работы.
        </p>
      </div>

      <div className="space-y-3 rounded-lg border border-border bg-card p-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Название файла
          </label>
          <div className="relative">
            <FileText className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="homework-lesson-7.pdf"
              className="w-full rounded-lg border border-border bg-background py-2 pl-10 pr-3 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Ссылка на файл
          </label>
          <div className="relative">
            <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="url"
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-lg border border-border bg-background py-2 pl-10 pr-3 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Комментарий
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder="Что вы сделали, какие средства использовали, какие наблюдения получили"
            className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading || !fileName.trim() || !fileUrl.trim()}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-secondary px-4 py-2.5 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {loading ? "Отправка..." : "Отправить на проверку"}
        </button>

        {error && <p className="text-xs text-red-600">{error}</p>}
        {success && (
          <p className="inline-flex items-center gap-1.5 text-xs text-green-700">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {success}
          </p>
        )}
      </div>

      {latestHomework?.feedback && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="font-medium">Комментарий преподавателя:</p>
          <p className="mt-1">{latestHomework.feedback}</p>
        </div>
      )}
    </div>
  )
}
