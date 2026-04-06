"use client"

import {
  useState,
  useCallback,
  useEffect,
  useRef,
  type PointerEvent as ReactPointerEvent,
} from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Pencil,
  GripVertical,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Clock,
  Sparkles,
  MessageSquare,
  GraduationCap,
  Layers,
  Users,
  Check,
  Film,
  Upload,
  RotateCw,
  ImageIcon,
  X,
} from "lucide-react"
import { VideoUpload } from "@/components/admin/video-upload"
import {
  LessonMaterialsUpload,
  type LessonMaterialItem,
} from "@/components/admin/lesson-materials-upload"
import { stripSectionPrefix } from "@/lib/course-display"

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface LessonData {
  id: string
  title: string
  description: string | null
  order: number
  durationMin: number
  rotate90: boolean
  muxAssetId: string | null
  muxPlaybackId: string | null
  muxStatus: string | null
  aiGenerated?: boolean
  materials: LessonMaterialItem[]
}

interface ModuleData {
  id: string
  title: string
  order: number
  lessons: LessonData[]
}

interface CourseData {
  id: string
  title: string
  slug: string
  description: string | null
  thumbnailUrl: string | null
  published: boolean
  author: string
  aiGenerated?: boolean
  createdAt: string
  updatedAt: string
  studentsCount: number
  modules: ModuleData[]
}

interface Props {
  course: CourseData
}

/* ------------------------------------------------------------------ */
/*  DnD Sortable Items (без внешних зависимостей)                       */
/* ------------------------------------------------------------------ */

function arrayMove<T>(array: T[], from: number, to: number): T[] {
  const next = array.slice()
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

function findClosestIdByY(
  orderedIds: string[],
  getEl: (id: string) => HTMLElement | null | undefined,
  y: number,
): string | null {
  let closestId: string | null = null
  let closestDist = Number.POSITIVE_INFINITY

  for (const id of orderedIds) {
    const el = getEl(id)
    if (!el) continue
    const rect = el.getBoundingClientRect()

    if (y >= rect.top && y <= rect.bottom) return id

    const centerY = rect.top + rect.height / 2
    const dist = Math.abs(y - centerY)
    if (dist < closestDist) {
      closestDist = dist
      closestId = id
    }
  }

  return closestId
}

function findInsertIndexByY(
  orderedIds: string[],
  getEl: (id: string) => HTMLElement | null | undefined,
  y: number,
): number {
  let lastIndex = 0
  for (let i = 0; i < orderedIds.length; i++) {
    const el = getEl(orderedIds[i])
    if (!el) continue
    const rect = el.getBoundingClientRect()
    const centerY = rect.top + rect.height / 2
    if (y < centerY) return i
    lastIndex = i + 1
  }
  return lastIndex
}

type DragState =
  | { type: "module"; activeModuleId: string; startModules: ModuleData[] }
  | { type: "lesson"; startModuleId: string; activeLessonId: string; startModules: ModuleData[] }

interface SortableLessonItemProps {
  lesson: LessonData
  lessonIdx: number
  isDragging: boolean
  registerLessonRef: (el: HTMLDivElement | null) => void
  onDragHandlePointerDown: (e: ReactPointerEvent<HTMLButtonElement>) => void
  onRequestVideoUpload: (lesson: LessonData) => void
  onRequestEditLesson: (lesson: LessonData) => void
  onRequestDeleteLesson: (lessonId: string) => void
}

function SortableLessonItem({
  lesson,
  lessonIdx,
  isDragging,
  registerLessonRef,
  onDragHandlePointerDown,
  onRequestVideoUpload,
  onRequestEditLesson,
  onRequestDeleteLesson,
}: SortableLessonItemProps) {
  return (
    <div
      ref={registerLessonRef}
      className={`flex items-center gap-3 border-b border-border/30 px-5 py-2.5 pl-14 last:border-b-0 ${
        isDragging ? "bg-muted/40 opacity-70" : ""
      }`}
    >
      <button
        type="button"
        onPointerDown={onDragHandlePointerDown}
        style={{ touchAction: "none" }}
        className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
        title="Перетащить урок"
        aria-label="Перетащить урок"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-muted text-[10px] font-semibold text-muted-foreground">
        {lessonIdx + 1}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground truncate">{lesson.title}</p>
        {lesson.description && (
          <p className="text-xs text-muted-foreground truncate">{lesson.description}</p>
        )}
      </div>
      {lesson.durationMin > 0 && (
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {lesson.durationMin} мин
        </span>
      )}
      {lesson.muxStatus && (
        <span
          className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
            lesson.muxStatus === "ready"
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              : lesson.muxStatus === "preparing" || lesson.muxStatus === "waiting_for_upload"
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
          }`}
        >
          {lesson.muxStatus === "ready"
            ? "Видео готово"
            : lesson.muxStatus === "preparing" || lesson.muxStatus === "waiting_for_upload"
              ? "Обработка"
              : "Ошибка"}
        </span>
      )}
      <button
        type="button"
        onClick={() => onRequestVideoUpload(lesson)}
        className={`rounded-lg p-1 transition-colors ${
          lesson.muxPlaybackId
            ? "text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20"
            : "text-muted-foreground hover:bg-muted hover:text-primary"
        }`}
        title={lesson.muxPlaybackId ? "Управление видео" : "Загрузить видео"}
      >
        {lesson.muxPlaybackId ? <Film className="h-3.5 w-3.5" /> : <Upload className="h-3.5 w-3.5" />}
      </button>
      <button
        type="button"
        onClick={() => onRequestEditLesson(lesson)}
        className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        title="Редактировать урок"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => onRequestDeleteLesson(lesson.id)}
        className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
        title="Удалить урок"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

interface SortableModuleItemProps {
  module: ModuleData
  moduleIdx: number
  isExpanded: boolean
  isDragging: boolean
  draggingLessonId: string | null
  toggleModule: (moduleId: string) => void
  registerModuleRef: (el: HTMLDivElement | null) => void
  onModuleDragHandlePointerDown: (e: ReactPointerEvent<HTMLButtonElement>) => void
  registerLessonRef: (lessonId: string, el: HTMLDivElement | null) => void
  onLessonDragHandlePointerDown: (
    e: ReactPointerEvent<HTMLButtonElement>,
    lessonId: string,
  ) => void
  onRequestEditModule: (module: ModuleData) => void
  onRequestDeleteModule: (moduleId: string) => void
  onRequestAddLesson: (moduleId: string) => void
  onRequestVideoUpload: (lesson: LessonData) => void
  onRequestEditLesson: (lesson: LessonData) => void
  onRequestDeleteLesson: (lessonId: string) => void
}

function SortableModuleItem({
  module,
  moduleIdx,
  isExpanded,
  isDragging,
  draggingLessonId,
  toggleModule,
  registerModuleRef,
  onModuleDragHandlePointerDown,
  registerLessonRef,
  onLessonDragHandlePointerDown,
  onRequestEditModule,
  onRequestDeleteModule,
  onRequestAddLesson,
  onRequestVideoUpload,
  onRequestEditLesson,
  onRequestDeleteLesson,
}: SortableModuleItemProps) {
  return (
    <div ref={registerModuleRef} className={isDragging ? "opacity-70" : ""}>
      {/* Module header */}
      <div
        className="flex items-center gap-2 bg-muted/10 px-5 py-3 hover:bg-muted/20"
      >
        <button
          type="button"
          onClick={() => toggleModule(module.id)}
          className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground"
        >
          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>

        <button
          type="button"
        onPointerDown={onModuleDragHandlePointerDown}
        style={{ touchAction: "none" }}
        className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
        title="Перетащить раздел"
        aria-label="Перетащить раздел"
      >
        <GripVertical className="h-4 w-4" />
      </button>

	        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-primary/10 text-xs font-bold text-primary">
	          {moduleIdx + 1}
	        </span>
	        <span className="flex-1 text-sm font-medium text-foreground">
	          {stripSectionPrefix(module.title) || module.title}
	        </span>
	        <span className="text-xs text-muted-foreground">{module.lessons.length} уроков</span>
        <button
          type="button"
          onClick={() => onRequestEditModule(module)}
          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          title="Переименовать"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onRequestDeleteModule(module.id)}
          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
          title="Удалить раздел"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Lessons */}
      {isExpanded && (
        <div className="border-t border-border/50 bg-muted/20">
          {module.lessons.length === 0 ? (
            <div className="px-5 py-4 pl-14 text-xs text-muted-foreground">
              Уроков пока нет. Добавьте урок и загрузите видео.
            </div>
          ) : (
            module.lessons.map((lesson, lessonIdx) => (
              <SortableLessonItem
                key={lesson.id}
                lesson={lesson}
                lessonIdx={lessonIdx}
                isDragging={draggingLessonId === lesson.id}
                registerLessonRef={(el) => registerLessonRef(lesson.id, el)}
                onDragHandlePointerDown={(e) => onLessonDragHandlePointerDown(e, lesson.id)}
                onRequestVideoUpload={onRequestVideoUpload}
                onRequestEditLesson={onRequestEditLesson}
                onRequestDeleteLesson={onRequestDeleteLesson}
              />
            ))
          )}

          {/* Add lesson button */}
          <div className="px-5 py-2.5 pl-14">
            <button
              type="button"
              onClick={() => onRequestAddLesson(module.id)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <Plus className="h-3 w-3" />
              Добавить урок
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Course cover block                                                 */
/* ------------------------------------------------------------------ */

function CourseCoverBlock({
  courseId,
  thumbnailUrl,
  onThumbnailChange,
}: {
  courseId: string
  thumbnailUrl: string | null
  onThumbnailChange: (url: string | null) => void
}) {
  const [uploading, setUploading] = useState(false)
  const [coverError, setCoverError] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        setCoverError("Выберите изображение (JPEG, PNG или WebP)")
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        setCoverError("Размер файла не более 5 МБ")
        return
      }
      setCoverError("")
      setUploading(true)
      try {
        const form = new FormData()
        form.append("file", file)
        const res = await fetch(`/api/admin/courses/${courseId}/cover`, {
          method: "POST",
          body: form,
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          onThumbnailChange(null)
          setCoverError((data as { error?: string }).error || "Ошибка загрузки")
          return
        }
        onThumbnailChange((data as { thumbnailUrl: string }).thumbnailUrl)
      } finally {
        setUploading(false)
        if (inputRef.current) inputRef.current.value = ""
      }
    },
    [courseId, onThumbnailChange],
  )

  const removeCover = useCallback(async () => {
    setCoverError("")
    setUploading(true)
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/cover`, {
        method: "DELETE",
      })
      if (res.ok) {
        onThumbnailChange(null)
      } else {
        const data = await res.json().catch(() => ({}))
        setCoverError((data as { error?: string }).error || "Ошибка удаления")
      }
    } finally {
      setUploading(false)
    }
  }, [courseId, onThumbnailChange])

  return (
    <div id="cover" className="rounded-xl border border-border bg-card">
      <div className="border-b border-border px-5 py-4">
        <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
          <ImageIcon className="h-5 w-5 text-primary" />
          Обложка курса
        </h2>
      </div>
      <div className="space-y-3 p-5">
        {thumbnailUrl ? (
          <div className="relative inline-block">
            <img
              src={thumbnailUrl}
              alt="Обложка курса"
              className="h-40 w-auto max-w-full rounded-lg border border-border object-cover"
            />
            <button
              type="button"
              onClick={removeCover}
              disabled={uploading}
              className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80 disabled:opacity-50"
              title="Удалить обложку"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30">
            <span className="text-sm text-muted-foreground">
              Обложка не загружена
            </span>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void handleFile(f)
            }}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
          >
            <Upload className="h-4 w-4" />
            {uploading ? "Загрузка…" : thumbnailUrl ? "Заменить обложку" : "Загрузить обложку"}
          </button>
        </div>
        {coverError && (
          <p className="text-sm text-red-600 dark:text-red-400">{coverError}</p>
        )}
        <p className="text-xs text-muted-foreground">
          JPEG, PNG или WebP, до 5 МБ. Отображается в каталоге и на странице курса.
        </p>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function CourseEditorClient({ course: initialCourse }: Props) {
  const [course, setCourse] = useState(initialCourse)
  const [saving, setSaving] = useState(false)
  const [publishLoading, setPublishLoading] = useState(false)
  const [error, setError] = useState("")
  const [aiLoading, setAiLoading] = useState(false)
  const [aiPrompt, setAiPrompt] = useState("")

  // Editable fields
  const [title, setTitle] = useState(course.title)
  const [slug, setSlug] = useState(course.slug)
  const [description, setDescription] = useState(course.description || "")
  const [author, setAuthor] = useState(course.author)

  // Module/Lesson dialogs
  const [addModuleOpen, setAddModuleOpen] = useState(false)
  const [newModuleTitle, setNewModuleTitle] = useState("")
  const [editModuleId, setEditModuleId] = useState<string | null>(null)
  const [editModuleTitle, setEditModuleTitle] = useState("")
  const [deleteModuleId, setDeleteModuleId] = useState<string | null>(null)

  const [addLessonModuleId, setAddLessonModuleId] = useState<string | null>(null)
  const [newLessonTitle, setNewLessonTitle] = useState("")
  const [newLessonDescription, setNewLessonDescription] = useState("")
  const [newLessonDuration, setNewLessonDuration] = useState(0)

  const [editLesson, setEditLesson] = useState<LessonData | null>(null)
  const [editLessonTitle, setEditLessonTitle] = useState("")
  const [editLessonDescription, setEditLessonDescription] = useState("")
  const [editLessonDuration, setEditLessonDuration] = useState(0)
  const [deleteLessonId, setDeleteLessonId] = useState<string | null>(null)

  // Module collapse state
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set(course.modules.map((m) => m.id)),
  )
  const expandedModulesBeforeLessonDragRef = useRef<Set<string> | null>(null)

  // Video upload dialog
  const [videoUploadLesson, setVideoUploadLesson] = useState<LessonData | null>(null)

  const [moduleActionLoading, setModuleActionLoading] = useState(false)
  const [rotationActionLoading, setRotationActionLoading] = useState(false)
  const [lessonAiLoading, setLessonAiLoading] = useState(false)

  const toggleModule = useCallback((moduleId: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev)
      if (next.has(moduleId)) {
        next.delete(moduleId)
      } else {
        next.add(moduleId)
      }
      return next
    })
  }, [])

  const courseRef = useRef(course)
  useEffect(() => {
    courseRef.current = course
  }, [course])

  const autosaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const saveRequestIdRef = useRef(0)
  const inFlightSaveIdRef = useRef(0)

  const moduleRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const lessonRefs = useRef<Record<string, Record<string, HTMLDivElement | null>>>({})
  const dragRef = useRef<DragState | null>(null)

  const [draggingModuleId, setDraggingModuleId] = useState<string | null>(null)
  const [draggingLessonId, setDraggingLessonId] = useState<string | null>(null)

  const registerModuleRef = useCallback((moduleId: string, el: HTMLDivElement | null) => {
    moduleRefs.current[moduleId] = el
  }, [])

  const registerLessonRef = useCallback(
    (moduleId: string, lessonId: string, el: HTMLDivElement | null) => {
      if (!lessonRefs.current[moduleId]) lessonRefs.current[moduleId] = {}
      lessonRefs.current[moduleId][lessonId] = el
    },
    [],
  )

  const handleModuleDragStart = useCallback(
    (e: ReactPointerEvent<HTMLButtonElement>, moduleId: string) => {
      if (e.button !== 0) return
      if (dragRef.current) return
      if (courseRef.current.modules.length < 2) return
      e.preventDefault()
      e.currentTarget.setPointerCapture(e.pointerId)
      document.body.style.userSelect = "none"
      dragRef.current = {
        type: "module",
        activeModuleId: moduleId,
        startModules: courseRef.current.modules,
      }
      setDraggingModuleId(moduleId)
    },
    [],
  )

  const handleLessonDragStart = useCallback(
    (e: ReactPointerEvent<HTMLButtonElement>, moduleId: string, lessonId: string) => {
      if (e.button !== 0) return
      if (dragRef.current) return
      const mod = courseRef.current.modules.find((m) => m.id === moduleId)
      if (!mod) return
      const canReorderWithin = mod.lessons.length >= 2
      const canMoveBetween = courseRef.current.modules.length >= 2
      if (!canReorderWithin && !canMoveBetween) return
      e.preventDefault()
      e.currentTarget.setPointerCapture(e.pointerId)
      document.body.style.userSelect = "none"
      // Expand all sections while dragging a lesson so drop targets are always available.
      setExpandedModules((prev) => {
        expandedModulesBeforeLessonDragRef.current = new Set(prev)
        return new Set(courseRef.current.modules.map((m) => m.id))
      })
      dragRef.current = {
        type: "lesson",
        startModuleId: moduleId,
        activeLessonId: lessonId,
        startModules: courseRef.current.modules,
      }
      setDraggingLessonId(lessonId)
    },
    [],
  )

  useEffect(() => {
    if (!draggingModuleId && !draggingLessonId) return

    const onMove = (ev: PointerEvent) => {
      const dragState = dragRef.current
      if (!dragState) return
      ev.preventDefault()

      if (dragState.type === "module") {
        const modules = courseRef.current.modules
        const ids = modules.map((m) => m.id)
        const overId = findClosestIdByY(ids, (id) => moduleRefs.current[id], ev.clientY)
        if (!overId || overId === dragState.activeModuleId) return

        const oldIndex = ids.indexOf(dragState.activeModuleId)
        const newIndex = ids.indexOf(overId)
        if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return

        const nextModules = arrayMove(modules, oldIndex, newIndex).map((m, idx) => ({
          ...m,
          order: idx + 1,
        }))
        courseRef.current = { ...courseRef.current, modules: nextModules }
        setCourse((prev) => ({ ...prev, modules: nextModules }))
      }

      if (dragState.type === "lesson") {
        const modules = courseRef.current.modules
        const activeLessonId = dragState.activeLessonId

        const currentModule = modules.find((m) =>
          m.lessons.some((l) => l.id === activeLessonId),
        )
        if (!currentModule) return

        const currentModuleId = currentModule.id
        const currentIndex = currentModule.lessons.findIndex((l) => l.id === activeLessonId)
        if (currentIndex === -1) return

        const moduleIds = modules.map((m) => m.id)
        const overModuleId = findClosestIdByY(
          moduleIds,
          (id) => moduleRefs.current[id] ?? null,
          ev.clientY,
        )
        if (!overModuleId) return

        const targetModule = modules.find((m) => m.id === overModuleId)
        if (!targetModule) return

        const activeLesson = currentModule.lessons[currentIndex]
        const targetOtherIds = targetModule.lessons
          .map((l) => l.id)
          .filter((id) => id !== activeLessonId)

        const insertIndex = findInsertIndexByY(
          targetOtherIds,
          (id) => lessonRefs.current[overModuleId]?.[id] ?? null,
          ev.clientY,
        )

        // Reorder within the same section
        if (currentModuleId === overModuleId) {
          if (insertIndex === currentIndex) return
          const others = currentModule.lessons.filter((l) => l.id !== activeLessonId)
          const nextLessons = [
            ...others.slice(0, insertIndex),
            { ...activeLesson },
            ...others.slice(insertIndex),
          ].map((l, idx) => ({ ...l, order: idx + 1 }))

          const nextModules = modules.map((m) =>
            m.id === currentModuleId ? { ...m, lessons: nextLessons } : m,
          )
          courseRef.current = { ...courseRef.current, modules: nextModules }
          setCourse((prev) => ({ ...prev, modules: nextModules }))
          return
        }

        // Move between sections
        const sourceLessons = currentModule.lessons.filter((l) => l.id !== activeLessonId)
        const targetLessons = targetModule.lessons

        const nextTarget = [
          ...targetLessons.slice(0, insertIndex),
          { ...activeLesson },
          ...targetLessons.slice(insertIndex),
        ].map((l, idx) => ({ ...l, order: idx + 1 }))

        const nextSource = sourceLessons.map((l, idx) => ({ ...l, order: idx + 1 }))

        const nextModules = modules.map((m) => {
          if (m.id === currentModuleId) return { ...m, lessons: nextSource }
          if (m.id === overModuleId) return { ...m, lessons: nextTarget }
          return m
        })

        courseRef.current = { ...courseRef.current, modules: nextModules }
        setCourse((prev) => ({ ...prev, modules: nextModules }))
      }
    }

    const onEnd = () => {
      const dragState = dragRef.current
      if (!dragState) return

      dragRef.current = null
      document.body.style.userSelect = ""
      setDraggingModuleId(null)
      setDraggingLessonId(null)
      if (expandedModulesBeforeLessonDragRef.current) {
        setExpandedModules(expandedModulesBeforeLessonDragRef.current)
        expandedModulesBeforeLessonDragRef.current = null
      }

      void (async () => {
        if (dragState.type === "module") {
          const startIds = dragState.startModules.map((m) => m.id)
          const endIds = courseRef.current.modules.map((m) => m.id)
          if (startIds.join("|") === endIds.join("|")) return

          setError("")
          try {
            const res = await fetch(`/api/admin/courses/${courseRef.current.id}/modules`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ moduleIds: endIds }),
            })
            const data = await res.json().catch(() => ({}))
            if (!res.ok) {
              setCourse((prev) => ({ ...prev, modules: dragState.startModules }))
              setError(data.error || "Не удалось сохранить порядок разделов")
            }
          } catch {
            setCourse((prev) => ({ ...prev, modules: dragState.startModules }))
            setError("Не удалось сохранить порядок разделов")
          }
          return
        }

        const activeLessonId = dragState.activeLessonId
        const startModuleId = dragState.startModuleId
        const endModule = courseRef.current.modules.find((m) =>
          m.lessons.some((l) => l.id === activeLessonId),
        )
        if (!endModule) return

        const endModuleId = endModule.id

        // No changes: same section and same order
        if (endModuleId === startModuleId) {
          const startModule = dragState.startModules.find((m) => m.id === startModuleId)
          if (!startModule) return
          const startIds = startModule.lessons.map((l) => l.id)
          const endIds = endModule.lessons.map((l) => l.id)
          if (startIds.join("|") === endIds.join("|")) return

          setError("")
          try {
            const res = await fetch(`/api/admin/courses/${courseRef.current.id}/lessons`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ moduleId: startModuleId, lessonIds: endIds }),
            })
            const data = await res.json().catch(() => ({}))
            if (!res.ok) {
              setCourse((prev) => ({ ...prev, modules: dragState.startModules }))
              setError(data.error || "Не удалось сохранить порядок уроков")
            }
          } catch {
            setCourse((prev) => ({ ...prev, modules: dragState.startModules }))
            setError("Не удалось сохранить порядок уроков")
          }
          return
        }

        // Cross-section move
        const fromModule = courseRef.current.modules.find((m) => m.id === startModuleId)
        const toModule = courseRef.current.modules.find((m) => m.id === endModuleId)
        if (!fromModule || !toModule) return

        const fromLessonIdsFinal = fromModule.lessons.map((l) => l.id)
        const toLessonIdsFinal = toModule.lessons.map((l) => l.id)

        setError("")
        try {
          const res = await fetch(`/api/admin/courses/${courseRef.current.id}/lessons`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fromModuleId: startModuleId,
              toModuleId: endModuleId,
              lessonId: activeLessonId,
              fromLessonIds: fromLessonIdsFinal,
              toLessonIds: toLessonIdsFinal,
            }),
          })
          const data = await res.json().catch(() => ({}))
          if (!res.ok) {
            setCourse((prev) => ({ ...prev, modules: dragState.startModules }))
            setError(data.error || "Не удалось сохранить порядок уроков")
            return
          }
          if (Array.isArray(data.modules) && data.modules.length > 0) {
            setCourse((prev) => ({
              ...prev,
              modules: prev.modules.map((m) => {
                const updated = data.modules.find((x: { id: string }) => x.id === m.id)
                return updated ? { ...m, title: updated.title } : m
              }),
            }))
          }
        } catch {
          setCourse((prev) => ({ ...prev, modules: dragState.startModules }))
          setError("Не удалось сохранить порядок уроков")
        }
      })()
    }

    window.addEventListener("pointermove", onMove, { passive: false })
    window.addEventListener("pointerup", onEnd)
    window.addEventListener("pointercancel", onEnd)

    return () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onEnd)
      window.removeEventListener("pointercancel", onEnd)
    }
  }, [draggingModuleId, draggingLessonId])

  /* ---- Save course details ---- */
  const normalizedTitle = title.trim()
  const normalizedSlug = slug.trim()
  const normalizedDescription = description.trim()
  const normalizedAuthor = author.trim()

  const slugIsValid = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalizedSlug)
  const canAutosave =
    normalizedTitle.length > 0 && normalizedAuthor.length > 0 && slugIsValid

  const isDirty =
    normalizedTitle !== course.title ||
    normalizedSlug !== course.slug ||
    normalizedDescription !== (course.description || "") ||
    normalizedAuthor !== course.author

  const saveCourseDetails = useCallback(async () => {
    if (!canAutosave) return false

    const requestId = ++saveRequestIdRef.current
    inFlightSaveIdRef.current = requestId

    setSaving(true)
    setError("")
    try {
      const res = await fetch(`/api/admin/courses/${course.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: normalizedTitle,
          slug: normalizedSlug,
          description: normalizedDescription,
          author: normalizedAuthor,
        }),
      })
      const data = await res.json().catch(() => ({}))

      // Ignore outdated responses.
      if (inFlightSaveIdRef.current !== requestId) return false

      if (!res.ok) {
        setError((data as { error?: string }).error || "Ошибка сохранения")
        return false
      }

      setCourse((prev) => ({
        ...prev,
        title: (data as { course: CourseData }).course.title,
        slug: (data as { course: CourseData }).course.slug,
        description: (data as { course: CourseData }).course.description,
        author: (data as { course: CourseData }).course.author,
        updatedAt: (data as { course: CourseData }).course.updatedAt,
      }))
      return true
    } catch {
      if (inFlightSaveIdRef.current === requestId) {
        setError("Ошибка сохранения")
      }
      return false
    } finally {
      if (inFlightSaveIdRef.current === requestId) {
        setSaving(false)
      }
    }
  }, [
    canAutosave,
    course.id,
    normalizedAuthor,
    normalizedDescription,
    normalizedSlug,
    normalizedTitle,
  ])

  // Autosave (debounced) for main course fields.
  useEffect(() => {
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current)
      autosaveTimeoutRef.current = null
    }

    if (!isDirty || !canAutosave) return

    autosaveTimeoutRef.current = setTimeout(() => {
      void saveCourseDetails()
    }, 800)

    return () => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current)
        autosaveTimeoutRef.current = null
      }
    }
  }, [
    canAutosave,
    isDirty,
    normalizedAuthor,
    normalizedDescription,
    normalizedSlug,
    normalizedTitle,
    saveCourseDetails,
  ])

  const flushAutosave = useCallback(async () => {
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current)
      autosaveTimeoutRef.current = null
    }
    if (!isDirty || !canAutosave) return false
    return saveCourseDetails()
  }, [canAutosave, isDirty, saveCourseDetails])

  /* ---- Toggle publish ---- */
  const handleTogglePublish = useCallback(async () => {
    if (publishLoading) return

    setPublishLoading(true)
    try {
      const nextPublished = !courseRef.current.published
      const res = await fetch(`/api/admin/courses/${course.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: nextPublished }),
      })
      if (res.ok) {
        setCourse((prev) => ({ ...prev, published: nextPublished }))
      }
    } catch {
      // ignore
    } finally {
      setPublishLoading(false)
    }
  }, [course.id, publishLoading])

  /* ---- AI description ---- */
  const handleGenerateDescription = useCallback(async () => {
    if (!title.trim()) return
    setAiLoading(true)
    try {
      const moduleNames = course.modules.map((m) => m.title)
      const res = await fetch("/api/admin/ai-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          modules: moduleNames.length > 0 ? moduleNames : undefined,
          type: "course",
          customPrompt: aiPrompt.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (data.description) {
        setDescription(data.description)
      }
    } catch {
      // ignore
    } finally {
      setAiLoading(false)
    }
  }, [title, course.modules, aiPrompt])

  /* ---- Add module ---- */
  const handleAddModule = useCallback(async () => {
    if (!newModuleTitle.trim()) return
    setModuleActionLoading(true)
    try {
      const res = await fetch(`/api/admin/courses/${course.id}/modules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newModuleTitle.trim() }),
      })
      const data = await res.json()
      if (res.ok) {
        setCourse((prev) => ({
          ...prev,
          modules: [...prev.modules, { ...data.module, lessons: data.module.lessons || [] }],
        }))
        setExpandedModules((prev) => new Set([...prev, data.module.id]))
        setAddModuleOpen(false)
        setNewModuleTitle("")
      }
    } finally {
      setModuleActionLoading(false)
    }
  }, [course.id, newModuleTitle])

  /* ---- Edit module ---- */
  const handleEditModule = useCallback(async () => {
    if (!editModuleId || !editModuleTitle.trim()) return
    setModuleActionLoading(true)
    try {
      const res = await fetch(`/api/admin/courses/${course.id}/modules`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleId: editModuleId,
          title: editModuleTitle.trim(),
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setCourse((prev) => ({
          ...prev,
          modules: prev.modules.map((m) =>
            m.id === editModuleId ? { ...m, title: data.module.title } : m,
          ),
        }))
        setEditModuleId(null)
      }
    } finally {
      setModuleActionLoading(false)
    }
  }, [course.id, editModuleId, editModuleTitle])

  /* ---- Delete module ---- */
  const handleDeleteModule = useCallback(async () => {
    if (!deleteModuleId) return
    setModuleActionLoading(true)
    try {
      const res = await fetch(
        `/api/admin/courses/${course.id}/modules?moduleId=${deleteModuleId}`,
        { method: "DELETE" },
      )
      if (res.ok) {
        setCourse((prev) => ({
          ...prev,
          modules: prev.modules.filter((m) => m.id !== deleteModuleId),
        }))
        setDeleteModuleId(null)
      }
    } finally {
      setModuleActionLoading(false)
    }
  }, [course.id, deleteModuleId])

  /* ---- Add lesson ---- */
  const handleAddLesson = useCallback(async () => {
    if (!addLessonModuleId || !newLessonTitle.trim()) return
    setModuleActionLoading(true)
    try {
      const res = await fetch(`/api/admin/courses/${course.id}/lessons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleId: addLessonModuleId,
          title: newLessonTitle.trim(),
          description: newLessonDescription.trim() || undefined,
          durationMin: newLessonDuration,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        const createdLesson: LessonData = {
          ...data.lesson,
          materials: Array.isArray(data.lesson?.materials)
            ? data.lesson.materials
            : [],
        }
        setCourse((prev) => ({
          ...prev,
          modules: prev.modules.map((m) => {
            const nextTitle =
              data.module && data.module.id === m.id ? data.module.title : m.title
            return m.id === addLessonModuleId
              ? { ...m, title: nextTitle, lessons: [...m.lessons, createdLesson] }
              : { ...m, title: nextTitle }
          }),
        }))
        setAddLessonModuleId(null)
        setNewLessonTitle("")
        setNewLessonDescription("")
        setNewLessonDuration(0)
      }
    } finally {
      setModuleActionLoading(false)
    }
  }, [course.id, addLessonModuleId, newLessonTitle, newLessonDescription, newLessonDuration])

  /* ---- Edit lesson ---- */
  const handleEditLesson = useCallback(async () => {
    if (!editLesson) return
    setModuleActionLoading(true)
    try {
      const res = await fetch(`/api/admin/courses/${course.id}/lessons`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId: editLesson.id,
          title: editLessonTitle.trim(),
          description: editLessonDescription.trim(),
          durationMin: editLessonDuration,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setCourse((prev) => ({
          ...prev,
          modules: prev.modules.map((m) => {
            const nextTitle =
              data.module && data.module.id === m.id ? data.module.title : m.title
            return {
              ...m,
              title: nextTitle,
              lessons: m.lessons.map((l) =>
                l.id === editLesson.id
                  ? {
                      ...l,
                      title: data.lesson.title,
                      description: data.lesson.description,
                      durationMin: data.lesson.durationMin,
                    }
                  : l,
              ),
            }
          }),
        }))
        setEditLesson(null)
      }
    } finally {
      setModuleActionLoading(false)
    }
  }, [course.id, editLesson, editLessonTitle, editLessonDescription, editLessonDuration])

  /* ---- Delete lesson ---- */
  const handleDeleteLesson = useCallback(async () => {
    if (!deleteLessonId) return
    setModuleActionLoading(true)
    try {
      const res = await fetch(
        `/api/admin/courses/${course.id}/lessons?lessonId=${deleteLessonId}`,
        { method: "DELETE" },
      )
      if (res.ok) {
        setCourse((prev) => ({
          ...prev,
          modules: prev.modules.map((m) => ({
            ...m,
            lessons: m.lessons.filter((l) => l.id !== deleteLessonId),
          })),
        }))
        setDeleteLessonId(null)
      }
    } finally {
      setModuleActionLoading(false)
    }
  }, [course.id, deleteLessonId])

  /* ---- Toggle lesson video rotation ---- */
  const handleToggleLessonRotation = useCallback(async () => {
    if (!videoUploadLesson) return

    const nextRotate90 = !videoUploadLesson.rotate90
    setRotationActionLoading(true)
    setError("")

    try {
      const res = await fetch(`/api/admin/courses/${course.id}/lessons`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId: videoUploadLesson.id,
          rotate90: nextRotate90,
        }),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError((data as { error?: string }).error || "Не удалось сохранить ориентацию видео")
        return
      }

      const lessonFromResponse = (data as { lesson?: { rotate90?: boolean } }).lesson
      const persistedRotate90 =
        typeof lessonFromResponse?.rotate90 === "boolean"
          ? lessonFromResponse.rotate90
          : nextRotate90

      setCourse((prev) => ({
        ...prev,
        modules: prev.modules.map((moduleItem) => ({
          ...moduleItem,
          lessons: moduleItem.lessons.map((lessonItem) =>
            lessonItem.id === videoUploadLesson.id
              ? { ...lessonItem, rotate90: persistedRotate90 }
              : lessonItem,
          ),
        })),
      }))
      setVideoUploadLesson((prev) =>
        prev ? { ...prev, rotate90: persistedRotate90 } : null,
      )
    } catch {
      setError("Не удалось сохранить ориентацию видео")
    } finally {
      setRotationActionLoading(false)
    }
  }, [course.id, videoUploadLesson])

  /* ---- AI lesson description ---- */
  const handleGenerateLessonDescription = useCallback(
    async (lessonTitle: string, setter: (value: string) => void) => {
      if (!lessonTitle.trim()) return
      setLessonAiLoading(true)
      try {
        const res = await fetch("/api/admin/ai-description", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: lessonTitle, type: "lesson" }),
        })
        const data = await res.json()
        if (data.description) {
          setter(data.description)
        }
      } catch {
        // ignore
      } finally {
        setLessonAiLoading(false)
      }
    },
    [],
  )

  const allLessons = course.modules.flatMap((m) => m.lessons)
  const totalLessons = allLessons.length

  // Setup progress (4 steps)
  const stepBasic =
    normalizedTitle.length > 0 && normalizedAuthor.length > 0 && slugIsValid
  const stepContent = course.modules.length > 0 && totalLessons > 0
  const stepAccess = course.published
  const stepReview = (() => {
    if (!stepBasic || !stepContent) return false
    if (!allLessons.every((l) => !!l.muxPlaybackId)) return false
    if (!allLessons.every((l) => l.muxStatus !== "errored")) return false
    // If status is present, it must be "ready" to pass review.
    if (!allLessons.every((l) => !l.muxStatus || l.muxStatus === "ready")) return false
    return true
  })()

  const setupPercent = Math.round(
    (([stepBasic, stepContent, stepAccess, stepReview].filter(Boolean).length /
      4) *
      100),
  )

  const saveStatusText = saving
    ? "Сохранение..."
    : isDirty && canAutosave
      ? "Автосохранение..."
      : isDirty && !canAutosave
        ? "Заполните название/URL, чтобы сохранить"
        : "Все изменения сохранены"

  const scrollToSection = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [])

  const handleOpenStudentPreview = useCallback(async () => {
    let slugForPreview = course.slug

    if (isDirty && canAutosave) {
      const ok = await flushAutosave()
      slugForPreview = ok ? normalizedSlug : course.slug
    } else if (canAutosave) {
      slugForPreview = normalizedSlug
    }

    if (!slugForPreview) return
    window.open(
      `/course/${slugForPreview}?preview=1`,
      "_blank",
      "noopener,noreferrer",
    )
  }, [canAutosave, course.slug, flushAutosave, isDirty, normalizedSlug])

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <a
              href="/admin/courses"
              className="rounded-lg border border-border p-2 transition-colors hover:bg-muted"
            >
              <ArrowLeft className="h-4 w-4" />
            </a>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  {title.trim() ? title : "Без названия"}
                </h1>
                {course.aiGenerated && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    <Sparkles className="h-3 w-3" />
                    AI
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                /course/{slug.trim() ? slug.trim() : "..."}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <span className="text-xs text-muted-foreground" aria-live="polite">
              {saveStatusText}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTogglePublish}
                disabled={publishLoading}
                className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 ${
                  course.published
                    ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400"
                    : "border-green-200 bg-green-50 text-green-700 hover:bg-green-100 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400"
                }`}
              >
                {course.published ? (
                  <>
                    <EyeOff className="h-4 w-4" />
                    Снять с публикации
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4" />
                    Опубликовать курс
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleOpenStudentPreview}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                <Eye className="h-4 w-4" />
                Посмотреть как студент
              </button>
            </div>
          </div>
        </div>

        {/* Setup progress */}
        <div className="rounded-xl border border-border bg-card px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-foreground">
                Готовность курса
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Заполните обязательные данные, добавьте контент и проверьте курс перед публикацией.
              </p>
            </div>
            <div className="text-sm font-semibold text-primary">
              {setupPercent}%
            </div>
          </div>
          <div className="mt-3">
            <Progress value={setupPercent} className="h-2" />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => scrollToSection("basic")}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                stepBasic
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400"
                  : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {stepBasic ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <span className="flex h-4 w-4 items-center justify-center rounded bg-muted text-[10px] font-semibold text-muted-foreground">
                  1
                </span>
              )}
              Основная информация
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("content")}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                stepContent
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400"
                  : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {stepContent ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <span className="flex h-4 w-4 items-center justify-center rounded bg-muted text-[10px] font-semibold text-muted-foreground">
                  2
                </span>
              )}
              Контент
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("access")}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                stepAccess
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400"
                  : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {stepAccess ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <span className="flex h-4 w-4 items-center justify-center rounded bg-muted text-[10px] font-semibold text-muted-foreground">
                  3
                </span>
              )}
              Доступ и публикация
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("review")}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                stepReview
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400"
                  : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {stepReview ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <span className="flex h-4 w-4 items-center justify-center rounded bg-muted text-[10px] font-semibold text-muted-foreground">
                  4
                </span>
              )}
              Проверка
            </button>
          </div>
        </div>

        {/* Status badge */}
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
              course.published
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
            }`}
          >
            {course.published ? (
              <Eye className="h-3 w-3" />
            ) : (
              <EyeOff className="h-3 w-3" />
            )}
            {course.published ? "Опубликован" : "Черновик"}
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Layers className="h-3.5 w-3.5" />
            {course.modules.length} разделов
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <BookOpen className="h-3.5 w-3.5" />
            {totalLessons} уроков
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            {course.studentsCount} студентов
          </span>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Course details form */}
        <div id="basic" className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-5 py-4">
            <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
              <GraduationCap className="h-5 w-5 text-primary" />
              Основная информация
            </h2>
          </div>
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-foreground">
                Название курса
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                URL-адрес (slug)
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Автор
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-foreground">
                Описание
              </label>

              {/* AI prompt block */}
              <div className="mb-2 rounded-lg border border-violet-200 bg-violet-50/50 p-3 dark:border-violet-800 dark:bg-violet-950/30">
                <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-violet-700 dark:text-violet-300">
                  <MessageSquare className="h-3.5 w-3.5" />
                  Промпт для ИИ
                </div>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  rows={2}
                  className="w-full rounded-md border border-violet-200 bg-white px-3 py-2 text-sm resize-none placeholder:text-violet-300 focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-400 dark:border-violet-700 dark:bg-violet-950/50 dark:placeholder:text-violet-600"
                  placeholder="Напиши подробное описание с акцентом на практические навыки..."
                />
                <div className="mt-1.5 flex items-center justify-between">
                  <p className="text-[11px] text-violet-500 dark:text-violet-400">
                    {aiPrompt.trim() ? "Будет использован ваш промпт" : "Без промпта — описание сгенерируется автоматически по названию курса"}
                  </p>
                  <button
                    type="button"
                    onClick={handleGenerateDescription}
                    disabled={!title.trim() || aiLoading}
                    className="inline-flex items-center gap-1.5 rounded-md bg-gradient-to-r from-violet-500 to-purple-600 px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    <Sparkles className="h-3 w-3" />
                    {aiLoading ? "Генерация..." : "Сгенерировать с ИИ"}
                  </button>
                </div>
              </div>

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none"
                placeholder="Описание курса..."
              />
            </div>
          </div>
        </div>

        {/* Course cover */}
        <CourseCoverBlock
          courseId={course.id}
          thumbnailUrl={course.thumbnailUrl}
          onThumbnailChange={(url) =>
            setCourse((prev) => ({ ...prev, thumbnailUrl: url }))
          }
        />

        {/* Content */}
        <div id="content" className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
              <Layers className="h-5 w-5 text-primary" />
              Контент
            </h2>
	            <button
	              type="button"
	              onClick={() => {
	                const nextOrder =
	                  courseRef.current.modules.reduce(
	                    (max, m) => Math.max(max, m.order),
	                    0,
	                  ) + 1
	                setNewModuleTitle(`Раздел ${nextOrder}`)
	                setAddModuleOpen(true)
	              }}
	              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
	            >
              <Plus className="h-3.5 w-3.5" />
              Добавить раздел
            </button>
          </div>

          {course.modules.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Layers className="mb-2 h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm font-medium text-muted-foreground">
                Разделов пока нет
              </p>
              <p className="mt-1 max-w-sm text-center text-xs text-muted-foreground/70">
                Раздел это контейнер для уроков. Добавьте первый раздел и создайте в нем уроки.
              </p>
            </div>
	          ) : (
	            <div className="divide-y divide-border">
	              {course.modules.map((module, moduleIdx) => (
	                <SortableModuleItem
	                  key={module.id}
	                  module={module}
		                  moduleIdx={moduleIdx}
		                  isExpanded={expandedModules.has(module.id)}
		                  isDragging={draggingModuleId === module.id}
		                  draggingLessonId={draggingLessonId}
		                  toggleModule={toggleModule}
		                  registerModuleRef={(el) => registerModuleRef(module.id, el)}
		                  onModuleDragHandlePointerDown={(e) => handleModuleDragStart(e, module.id)}
	                  registerLessonRef={(lessonId, el) =>
	                    registerLessonRef(module.id, lessonId, el)
	                  }
	                  onLessonDragHandlePointerDown={(e, lessonId) =>
	                    handleLessonDragStart(e, module.id, lessonId)
	                  }
	                  onRequestEditModule={(m) => {
	                    setEditModuleId(m.id)
	                    setEditModuleTitle(m.title)
	                  }}
	                  onRequestDeleteModule={(moduleId) => setDeleteModuleId(moduleId)}
	                  onRequestAddLesson={(moduleId) => {
	                    setAddLessonModuleId(moduleId)
	                    setNewLessonTitle("")
	                    setNewLessonDescription("")
	                    setNewLessonDuration(0)
	                  }}
	                  onRequestVideoUpload={(lesson) => setVideoUploadLesson(lesson)}
	                  onRequestEditLesson={(lesson) => {
	                    setEditLesson(lesson)
	                    setEditLessonTitle(lesson.title)
	                    setEditLessonDescription(lesson.description || "")
	                    setEditLessonDuration(lesson.durationMin)
	                  }}
	                  onRequestDeleteLesson={(lessonId) => setDeleteLessonId(lessonId)}
	                />
	              ))}
	            </div>
	          )}
        </div>

        {/* Access & publish */}
        <div id="access" className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-5 py-4">
            <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
              <Eye className="h-5 w-5 text-primary" />
              Доступ и публикация
            </h2>
          </div>
          <div className="space-y-3 p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                    course.published
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                  }`}
                >
                  {course.published ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                  {course.published ? "Опубликован" : "Черновик"}
                </span>
                <p className="text-xs text-muted-foreground">
                  {course.published
                    ? "Курс виден в каталоге и доступен студентам."
                    : "Курс не виден в каталоге до публикации."}
                </p>
              </div>
              <button
                type="button"
                onClick={handleTogglePublish}
                disabled={publishLoading}
                className={`inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 ${
                  course.published
                    ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400"
                    : "border-green-200 bg-green-50 text-green-700 hover:bg-green-100 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400"
                }`}
              >
                {course.published ? (
                  <>
                    <EyeOff className="h-4 w-4" />
                    Снять с публикации
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4" />
                    Опубликовать курс
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              После публикации курс появится в каталоге. Предпросмотр доступен в любой момент.
            </p>
          </div>
        </div>

        {/* Review */}
        <div id="review" className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-5 py-4">
            <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
              <Check className="h-5 w-5 text-primary" />
              Проверка
            </h2>
          </div>
          <div className="space-y-3 p-5">
            <div className="grid gap-2 text-sm">
              <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/10 px-3 py-2">
                <span className="text-foreground">Основная информация заполнена</span>
                {stepBasic ? (
                  <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                    Готово
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">Нужно заполнить</span>
                )}
              </div>
              <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/10 px-3 py-2">
                <span className="text-foreground">Добавлен контент (разделы и уроки)</span>
                {stepContent ? (
                  <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                    Готово
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">Нужно добавить</span>
                )}
              </div>
              <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/10 px-3 py-2">
                <span className="text-foreground">Видео загружено для всех уроков</span>
                {totalLessons > 0 && allLessons.every((l) => !!l.muxPlaybackId) ? (
                  <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                    Готово
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {totalLessons === 0
                      ? "Нет уроков"
                      : `Не хватает видео: ${allLessons.filter((l) => !l.muxPlaybackId).length}`}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/10 px-3 py-2">
                <span className="text-foreground">Нет ошибок обработки видео</span>
                {allLessons.every((l) => l.muxStatus !== "errored") ? (
                  <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                    Готово
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    Ошибок: {allLessons.filter((l) => l.muxStatus === "errored").length}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/10 px-3 py-2">
                <span className="text-foreground">Видео готовы к просмотру</span>
                {allLessons.every((l) => !l.muxStatus || l.muxStatus === "ready") ? (
                  <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                    Готово
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    В обработке:{" "}
                    {
                      allLessons.filter(
                        (l) =>
                          !!l.muxStatus &&
                          l.muxStatus !== "ready" &&
                          l.muxStatus !== "errored",
                      ).length
                    }
                  </span>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
              {stepReview ? (
                <p className="text-emerald-700 dark:text-emerald-400">
                  Курс готов: можно публиковать.
                </p>
              ) : (
                <p className="text-muted-foreground">
                  Проверьте пункты выше: после загрузки и подготовки видео курс будет готов к публикации.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ---- DIALOGS ---- */}

      {/* Add module dialog */}
      <Dialog open={addModuleOpen} onOpenChange={setAddModuleOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Добавить раздел</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Название раздела
              </label>
	              <input
	                type="text"
	                value={newModuleTitle}
	                onChange={(e) => setNewModuleTitle(e.target.value)}
	                placeholder="Например: Введение в курс"
	                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
	                autoFocus
	                onKeyDown={(e) => {
	                  if (e.key === "Enter") handleAddModule()
	                }}
	              />
	              <p className="mt-1 text-xs text-muted-foreground">
	                Если оставить «Раздел N», название автоматически заменится на название первого видео.
	              </p>
	            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAddModuleOpen(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleAddModule}
                disabled={moduleActionLoading || !newModuleTitle.trim()}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                {moduleActionLoading ? "Добавление..." : "Добавить"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit module dialog */}
      <Dialog
        open={editModuleId !== null}
        onOpenChange={() => setEditModuleId(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Переименовать раздел</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Название раздела
              </label>
              <input
                type="text"
                value={editModuleTitle}
                onChange={(e) => setEditModuleTitle(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleEditModule()
                }}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditModuleId(null)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleEditModule}
                disabled={moduleActionLoading || !editModuleTitle.trim()}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                {moduleActionLoading ? "Сохранение..." : "Сохранить"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete module confirmation */}
      <Dialog
        open={deleteModuleId !== null}
        onOpenChange={() => setDeleteModuleId(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Удалить раздел?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Все уроки в этом разделе также будут удалены. Действие необратимо.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setDeleteModuleId(null)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={handleDeleteModule}
              disabled={moduleActionLoading}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {moduleActionLoading ? "Удаление..." : "Удалить"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add lesson dialog */}
      <Dialog
        open={addLessonModuleId !== null}
        onOpenChange={() => setAddLessonModuleId(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Добавить урок
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Название урока *
              </label>
              <input
                type="text"
                value={newLessonTitle}
                onChange={(e) => setNewLessonTitle(e.target.value)}
                placeholder="Например: Анатомия лица"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                autoFocus
              />
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">
                  Описание урока
                </label>
                <button
                  type="button"
                  onClick={() =>
                    handleGenerateLessonDescription(
                      newLessonTitle,
                      setNewLessonDescription,
                    )
                  }
                  disabled={!newLessonTitle.trim() || lessonAiLoading}
                  className="inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-violet-500 to-purple-600 px-2 py-0.5 text-[10px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  <Sparkles className="h-2.5 w-2.5" />
                  {lessonAiLoading ? "..." : "ИИ"}
                </button>
              </div>
              <textarea
                value={newLessonDescription}
                onChange={(e) => setNewLessonDescription(e.target.value)}
                placeholder="Описание урока..."
                rows={2}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Длительность (мин)
              </label>
              <input
                type="number"
                min={0}
                value={newLessonDuration}
                onChange={(e) =>
                  setNewLessonDuration(parseInt(e.target.value) || 0)
                }
                className="w-32 rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAddLessonModuleId(null)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleAddLesson}
                disabled={moduleActionLoading || !newLessonTitle.trim()}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                {moduleActionLoading ? "Добавление..." : "Добавить"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit lesson dialog */}
      <Dialog
        open={editLesson !== null}
        onOpenChange={() => setEditLesson(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Редактировать урок
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Название урока
              </label>
              <input
                type="text"
                value={editLessonTitle}
                onChange={(e) => setEditLessonTitle(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                autoFocus
              />
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">
                  Описание
                </label>
                <button
                  type="button"
                  onClick={() =>
                    handleGenerateLessonDescription(
                      editLessonTitle,
                      setEditLessonDescription,
                    )
                  }
                  disabled={!editLessonTitle.trim() || lessonAiLoading}
                  className="inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-violet-500 to-purple-600 px-2 py-0.5 text-[10px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  <Sparkles className="h-2.5 w-2.5" />
                  {lessonAiLoading ? "..." : "ИИ"}
                </button>
              </div>
              <textarea
                value={editLessonDescription}
                onChange={(e) => setEditLessonDescription(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Длительность (мин)
              </label>
              <input
                type="number"
                min={0}
                value={editLessonDuration}
                onChange={(e) =>
                  setEditLessonDuration(parseInt(e.target.value) || 0)
                }
                className="w-32 rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Видео загружается и заменяется по иконке плёнки/загрузки у урока в списке «Контент».
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditLesson(null)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleEditLesson}
                disabled={moduleActionLoading || !editLessonTitle.trim()}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                {moduleActionLoading ? "Сохранение..." : "Сохранить"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete lesson confirmation */}
      <Dialog
        open={deleteLessonId !== null}
        onOpenChange={() => setDeleteLessonId(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Удалить урок?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Это действие удалит урок и все связанные данные (прогресс, домашние
            задания, комментарии). Действие необратимо.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setDeleteLessonId(null)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={handleDeleteLesson}
              disabled={moduleActionLoading}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {moduleActionLoading ? "Удаление..." : "Удалить"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Video upload dialog */}
      <Dialog
        open={videoUploadLesson !== null}
        onOpenChange={() => setVideoUploadLesson(null)}
      >
        <DialogContent className="min-w-0 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Film className="h-5 w-5 text-primary" />
              Видео и материалы урока
            </DialogTitle>
          </DialogHeader>
          {videoUploadLesson && (
            <div className="min-w-0 space-y-4">
              <div className="min-w-0 rounded-lg bg-muted/50 px-3 py-2">
                <p className="break-words text-sm font-medium text-foreground">
                  {videoUploadLesson.title}
                </p>
                {videoUploadLesson.description && (
                  <p className="mt-0.5 break-words text-xs text-muted-foreground">
                    {videoUploadLesson.description}
                  </p>
                )}
              </div>

              <VideoUpload
                courseId={course.id}
                lessonId={videoUploadLesson.id}
                muxStatus={videoUploadLesson.muxStatus}
                muxPlaybackId={videoUploadLesson.muxPlaybackId}
                onUploadStarted={() => {
                  // Обновляем статус урока в локальном стейте
                  setCourse((prev) => ({
                    ...prev,
                    modules: prev.modules.map((m) => ({
                      ...m,
                      lessons: m.lessons.map((l) =>
                        l.id === videoUploadLesson.id
                          ? { ...l, muxStatus: "preparing", muxPlaybackId: null, muxAssetId: null }
                          : l,
                      ),
                    })),
                  }))
                  setVideoUploadLesson((prev) =>
                    prev ? { ...prev, muxStatus: "preparing", muxPlaybackId: null, muxAssetId: null } : null,
                  )
                }}
                onVideoDeleted={() => {
                  // Очищаем видео-поля в локальном стейте
                  setCourse((prev) => ({
                    ...prev,
                    modules: prev.modules.map((m) => ({
                      ...m,
                      lessons: m.lessons.map((l) =>
                        l.id === videoUploadLesson.id
                          ? { ...l, muxStatus: null, muxPlaybackId: null, muxAssetId: null }
                          : l,
                      ),
                    })),
                  }))
                  setVideoUploadLesson((prev) =>
                    prev ? { ...prev, muxStatus: null, muxPlaybackId: null, muxAssetId: null } : null,
                  )
                }}
                onStatusChanged={(statusData) => {
                  setCourse((prev) => ({
                    ...prev,
                    modules: prev.modules.map((moduleItem) => ({
                      ...moduleItem,
                      lessons: moduleItem.lessons.map((lessonItem) =>
                        lessonItem.id === videoUploadLesson.id
                          ? {
                              ...lessonItem,
                              muxStatus: statusData.muxStatus,
                              muxPlaybackId: statusData.muxPlaybackId,
                            }
                          : lessonItem,
                      ),
                    })),
                  }))
                  setVideoUploadLesson((prev) =>
                    prev
                      ? {
                          ...prev,
                          muxStatus: statusData.muxStatus,
                          muxPlaybackId: statusData.muxPlaybackId,
                        }
                      : null,
                  )
                }}
              />

              <LessonMaterialsUpload
                courseId={course.id}
                lessonId={videoUploadLesson.id}
                materials={videoUploadLesson.materials}
                onMaterialsChanged={(nextMaterials) => {
                  setCourse((prev) => ({
                    ...prev,
                    modules: prev.modules.map((moduleItem) => ({
                      ...moduleItem,
                      lessons: moduleItem.lessons.map((lessonItem) =>
                        lessonItem.id === videoUploadLesson.id
                          ? { ...lessonItem, materials: nextMaterials }
                          : lessonItem,
                      ),
                    })),
                  }))
                  setVideoUploadLesson((prev) =>
                    prev ? { ...prev, materials: nextMaterials } : null,
                  )
                }}
              />

              {/* Превью и ссылка «Посмотреть урок» когда видео готово */}
              {videoUploadLesson.muxPlaybackId && videoUploadLesson.muxStatus === "ready" && (
                <div className="min-w-0 space-y-2">
                  <div className="min-w-0 overflow-hidden rounded-lg border border-border">
                    <div className="aspect-video bg-foreground">
                      <img
                        src={`https://image.mux.com/${videoUploadLesson.muxPlaybackId}/thumbnail.jpg?time=5`}
                        alt="Превью видео"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex flex-col gap-2 border-t border-border bg-muted/30 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 text-xs text-muted-foreground">
                        Playback ID:{" "}
                        <code className="inline-block max-w-full break-all whitespace-normal rounded bg-muted px-1 py-0.5 font-mono text-[10px]">
                          {videoUploadLesson.muxPlaybackId}
                        </code>
                      </div>
                      <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
                        <button
                          type="button"
                          onClick={handleToggleLessonRotation}
                          disabled={rotationActionLoading}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
                        >
                          <RotateCw className="h-3.5 w-3.5" />
                          {rotationActionLoading
                            ? "Сохранение..."
                            : videoUploadLesson.rotate90
                              ? "Вернуть обычный вид"
                              : "Повернуть на 90°"}
                        </button>
                        <a
                          href={`/course/${course.slug}/${videoUploadLesson.id}?preview=1`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Посмотреть урок
                        </a>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Чтобы заменить видео — загрузите новый файл выше. Редактировать название и описание урока можно по кнопке с карандашом у урока.
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
