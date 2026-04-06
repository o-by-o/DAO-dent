"use client"

import { useEffect, useState, useCallback } from "react"
import {
  Film,
  Link2,
  Check,
  Clock,
  Play,
  X,
  Trash2,
} from "lucide-react"

interface MuxAsset {
  assetId: string
  playbackId: string
  duration: number
  createdAt: string
  thumbnailUrl: string
  linked: boolean
  linkedLesson: string | null
}

interface LessonOption {
  id: string
  title: string
  course: string
  module: string
}

interface Props {}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, "0")}`
}

export function MediaLibraryClient(_props: Props) {
  const [assets, setAssets] = useState<MuxAsset[]>([])
  const [lessons, setLessons] = useState<LessonOption[]>([])
  const [loading, setLoading] = useState(true)
  const [assigningId, setAssigningId] = useState<string | null>(null)
  const [selectedLesson, setSelectedLesson] = useState<string>("")
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [filter, setFilter] = useState<"all" | "unlinked" | "linked">("unlinked")
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (assetId: string) => {
    if (!confirm("Удалить это видео из Mux? Действие необратимо.")) return
    setDeletingId(assetId)
    const res = await fetch("/api/admin/media", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assetId }),
    })
    if (res.ok) {
      setAssets((prev) => prev.filter((a) => a.assetId !== assetId))
    }
    setDeletingId(null)
  }

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/admin/media")
    if (res.ok) {
      const data = await res.json()
      setAssets(data.assets)
      setLessons(data.lessons)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleAssign = async (asset: MuxAsset) => {
    if (!selectedLesson) return
    const res = await fetch("/api/admin/media", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assetId: asset.assetId,
        playbackId: asset.playbackId,
        lessonId: selectedLesson,
      }),
    })
    if (res.ok) {
      setAssigningId(null)
      setSelectedLesson("")
      fetchData()
    }
  }

  const filtered = assets.filter((a) => {
    if (filter === "unlinked") return !a.linked
    if (filter === "linked") return a.linked
    return true
  })

  const unlinkedCount = assets.filter((a) => !a.linked).length

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Медиатека</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Загруженные видео. Привяжите непривязанные видео к урокам.
        </p>
      </div>

      {/* Filter tabs */}
      <div className="mb-6 flex gap-2">
        {(
          [
            { key: "unlinked", label: `Непривязанные (${unlinkedCount})` },
            { key: "linked", label: "Привязанные" },
            { key: "all", label: "Все" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium boty-transition ${
              filter === tab.key
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Загрузка...</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((asset) => (
            <div
              key={asset.assetId}
              className={`group overflow-hidden rounded-xl border bg-card shadow-[var(--shadow-card)] boty-transition ${
                asset.linked ? "border-chart-3/30" : "border-border/50"
              }`}
            >
              {/* Thumbnail */}
              <div
                className="relative aspect-video cursor-pointer overflow-hidden bg-black"
                onClick={() =>
                  setPreviewId(previewId === asset.playbackId ? null : asset.playbackId)
                }
              >
                {previewId === asset.playbackId ? (
                  <iframe
                    src={`https://stream.mux.com/${asset.playbackId}.m3u8?redundant_streams=true`}
                    allow="autoplay"
                    className="h-full w-full"
                    title="Preview"
                  />
                ) : (
                  <>
                    <img
                      src={asset.thumbnailUrl}
                      alt=""
                      className="h-full w-full object-cover boty-transition group-hover:scale-105"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 boty-transition group-hover:opacity-100">
                      <Play className="h-10 w-10 text-white" />
                    </div>
                  </>
                )}
                <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-xs text-white">
                  {formatDuration(asset.duration)}
                </span>
              </div>

              {/* Info */}
              <div className="p-3">
                {asset.linked ? (
                  <div className="flex items-center gap-2 text-xs">
                    <Check className="h-3.5 w-3.5 text-chart-3" />
                    <span className="truncate text-chart-3 font-medium">
                      {asset.linkedLesson}
                    </span>
                  </div>
                ) : assigningId === asset.assetId ? (
                  <div className="space-y-2">
                    <select
                      value={selectedLesson}
                      onChange={(e) => setSelectedLesson(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary"
                    >
                      <option value="">Выберите урок...</option>
                      {lessons.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.course} → {l.module} → {l.title}
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAssign(asset)}
                        disabled={!selectedLesson}
                        className="flex-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground boty-transition hover:bg-primary/90 disabled:opacity-50"
                      >
                        Привязать
                      </button>
                      <button
                        onClick={() => {
                          setAssigningId(null)
                          setSelectedLesson("")
                        }}
                        className="rounded-lg border border-border px-3 py-1.5 text-xs boty-transition hover:bg-muted"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>
                        {new Date(asset.createdAt).toLocaleDateString("ru-RU", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setAssigningId(asset.assetId)}
                        className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary boty-transition hover:bg-primary/20"
                      >
                        <Link2 className="h-3 w-3" />
                        Привязать
                      </button>
                      <button
                        onClick={() => handleDelete(asset.assetId)}
                        disabled={deletingId === asset.assetId}
                        className="inline-flex items-center gap-1 rounded-lg bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive boty-transition hover:bg-destructive/20 disabled:opacity-50"
                        title="Удалить из Mux"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
          <Film className="h-10 w-10 opacity-40" />
          <p className="text-sm">
            {filter === "unlinked"
              ? "Все видео привязаны к урокам"
              : "Нет видео"}
          </p>
        </div>
      )}
    </>
  )
}
