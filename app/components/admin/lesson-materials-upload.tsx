"use client"

import { useCallback, useRef, useState, type ChangeEvent } from "react"
import {
  Download,
  FileImage,
  FileText,
  Loader2,
  Trash2,
  Upload,
} from "lucide-react"

export interface LessonMaterialItem {
  id: string
  name: string
  url: string
  size: string
  mimeType: string | null
}

interface LessonMaterialsUploadProps {
  courseId: string
  lessonId: string
  materials: LessonMaterialItem[]
  onMaterialsChanged: (materials: LessonMaterialItem[]) => void
}

const INPUT_ACCEPT =
  "image/*,.pdf,.txt,.csv,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.7z,.json"

function MaterialIcon({ mimeType }: { mimeType: string | null }) {
  if (mimeType?.startsWith("image/")) {
    return <FileImage className="h-4 w-4 text-primary" />
  }
  return <FileText className="h-4 w-4 text-primary" />
}

export function LessonMaterialsUpload({
  courseId,
  lessonId,
  materials,
  onMaterialsChanged,
}: LessonMaterialsUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const [uploading, setUploading] = useState(false)
  const [deletingMaterialId, setDeletingMaterialId] = useState<string | null>(null)
  const [error, setError] = useState("")

  const uploadFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return

      setUploading(true)
      setError("")

      try {
        for (const file of files) {
          const formData = new FormData()
          formData.set("lessonId", lessonId)
          formData.set("file", file)

          const res = await fetch(`/api/admin/courses/${courseId}/materials-upload`, {
            method: "POST",
            body: formData,
          })
          const data = await res.json().catch(() => ({}))
          if (!res.ok) {
            throw new Error(data.error || `Ошибка загрузки (${res.status})`)
          }

          onMaterialsChanged(data.materials as LessonMaterialItem[])
        }
      } catch (err) {
        setError((err as Error).message || "Не удалось загрузить файл")
      } finally {
        setUploading(false)
      }
    },
    [courseId, lessonId, onMaterialsChanged],
  )

  const handleFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const nextFiles = event.target.files ? Array.from(event.target.files) : []
      void uploadFiles(nextFiles)
      event.target.value = ""
    },
    [uploadFiles],
  )

  const handleDelete = useCallback(
    async (materialId: string) => {
      if (!confirm("Удалить этот материал?")) return

      setDeletingMaterialId(materialId)
      setError("")
      try {
        const res = await fetch(
          `/api/admin/courses/${courseId}/materials-upload?lessonId=${lessonId}&materialId=${materialId}`,
          { method: "DELETE" },
        )
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          throw new Error(data.error || "Не удалось удалить материал")
        }
        onMaterialsChanged(data.materials as LessonMaterialItem[])
      } catch (err) {
        setError((err as Error).message || "Не удалось удалить материал")
      } finally {
        setDeletingMaterialId(null)
      }
    },
    [courseId, lessonId, onMaterialsChanged],
  )

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-foreground">Материалы урока</p>
          <p className="text-xs text-muted-foreground">
            Фото, PDF, документы и архивы
          </p>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Upload className="h-3.5 w-3.5" />
          )}
          {uploading ? "Загрузка..." : "Добавить файлы"}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={INPUT_ACCEPT}
        className="hidden"
        onChange={handleFileChange}
      />

      {materials.length === 0 ? (
        <p className="rounded-md border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
          Материалы пока не добавлены.
        </p>
      ) : (
        <div className="space-y-2">
          {materials.map((material) => (
            <div
              key={material.id}
              className="flex items-center gap-2 rounded-md border border-border px-2.5 py-2"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
                <MaterialIcon mimeType={material.mimeType} />
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{material.name}</p>
                <p className="text-xs text-muted-foreground">{material.size}</p>
              </div>

              <a
                href={material.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md border border-border p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                title="Скачать"
              >
                <Download className="h-3.5 w-3.5" />
              </a>

              <button
                type="button"
                onClick={() => void handleDelete(material.id)}
                disabled={deletingMaterialId === material.id}
                className="rounded-md border border-border p-1.5 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-900/20"
                title="Удалить"
              >
                {deletingMaterialId === material.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
