import { createHash, randomUUID } from "node:crypto"
import path from "node:path"

export interface LessonMaterial {
  id: string
  name: string
  url: string
  size: string
  sizeBytes: number | null
  mimeType: string | null
  storagePath: string | null
  uploadedAt: string | null
}

export const MAX_MATERIAL_FILE_SIZE = 200 * 1024 * 1024 // 200 MB

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/zip",
  "application/x-rar-compressed",
  "application/x-7z-compressed",
  "application/json",
])

const ALLOWED_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".svg",
  ".pdf",
  ".txt",
  ".csv",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".zip",
  ".rar",
  ".7z",
  ".json",
])

const EXTENSION_TO_MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
  ".txt": "text/plain",
  ".csv": "text/csv",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".zip": "application/zip",
  ".rar": "application/x-rar-compressed",
  ".7z": "application/x-7z-compressed",
  ".json": "application/json",
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function asString(value: unknown): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function asSizeBytes(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return Math.floor(value)
  }
  return null
}

function createLegacyMaterialId(seed: string): string {
  const hash = createHash("sha256").update(seed).digest("hex").slice(0, 16)
  return `legacy-${hash}`
}

export function getLessonMaterialsRootDir() {
  return process.env.LESSON_MATERIALS_DIR?.trim()
    || path.join(process.cwd(), "uploads", "lesson-materials")
}

export function resolveMaterialAbsolutePath(storagePath: string) {
  const root = path.resolve(getLessonMaterialsRootDir())
  const absolute = path.resolve(root, storagePath)
  if (absolute !== root && !absolute.startsWith(`${root}${path.sep}`)) {
    throw new Error("Invalid material path")
  }
  return absolute
}

export function sanitizeFileName(fileName: string) {
  const cleaned = fileName
    .trim()
    .replace(/[/\\?%*:|"<>]/g, "-")
    .replace(/\s+/g, " ")

  if (!cleaned) return "file"
  return cleaned
}

export function getFileExtension(fileName: string) {
  return path.extname(fileName).toLowerCase()
}

export function guessMimeType(fileName: string) {
  return EXTENSION_TO_MIME[getFileExtension(fileName)] ?? "application/octet-stream"
}

export function isAllowedMaterialFile(fileName: string, mimeType?: string | null) {
  const normalizedMime = (mimeType ?? "").toLowerCase().trim()
  const extension = getFileExtension(fileName)
  const extensionAllowed = ALLOWED_EXTENSIONS.has(extension)
  if (extensionAllowed) return true
  if (normalizedMime && ALLOWED_MIME_TYPES.has(normalizedMime)) {
    return !extension
  }
  return false
}

export function formatFileSize(sizeBytes: number) {
  if (!Number.isFinite(sizeBytes) || sizeBytes < 0) return "0 B"
  if (sizeBytes < 1024) return `${sizeBytes} B`
  if (sizeBytes < 1024 * 1024) return `${(sizeBytes / 1024).toFixed(1)} KB`
  if (sizeBytes < 1024 * 1024 * 1024) return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(sizeBytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

export function buildStoredFileName(originalFileName: string) {
  const safeOriginal = sanitizeFileName(originalFileName)
  const extension = getFileExtension(safeOriginal)
  const basename = extension
    ? safeOriginal.slice(0, -extension.length)
    : safeOriginal

  const normalizedBase = basename
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 70)

  const safeBase = normalizedBase || "material"
  return `${Date.now()}-${randomUUID().slice(0, 8)}-${safeBase}${extension}`
}

export function buildMaterialStoragePath(lessonId: string, storedFileName: string) {
  const safeLessonId = lessonId.replace(/[^a-zA-Z0-9_-]+/g, "")
  return path.posix.join(safeLessonId || "lesson", storedFileName)
}

export function buildLessonMaterialUrl(lessonId: string, materialId: string) {
  return `/api/lessons/${lessonId}/materials/${materialId}`
}

export function parseLessonMaterials(raw: unknown, lessonId?: string): LessonMaterial[] {
  if (!Array.isArray(raw)) return []

  const parsed: LessonMaterial[] = []

  for (let i = 0; i < raw.length; i++) {
    const item = asRecord(raw[i])
    if (!item) continue

    const name = asString(item.name)
    if (!name) continue

    const storagePath = asString(item.storagePath)
    const explicitUrl = asString(item.url)
    const baseId = asString(item.id)
      ?? createLegacyMaterialId(`${name}|${explicitUrl ?? ""}|${storagePath ?? ""}|${i}`)
    const url = explicitUrl
      ?? (lessonId ? buildLessonMaterialUrl(lessonId, baseId) : null)
    if (!url) continue

    const sizeBytes = asSizeBytes(item.sizeBytes)
    const size = asString(item.size) ?? (sizeBytes !== null ? formatFileSize(sizeBytes) : "Размер не указан")
    const mimeType = asString(item.mimeType) ?? guessMimeType(name)
    const uploadedAt = asString(item.uploadedAt)

    parsed.push({
      id: baseId,
      name,
      url,
      size,
      sizeBytes,
      mimeType,
      storagePath,
      uploadedAt,
    })
  }

  return parsed
}

export function serializeLessonMaterials(materials: LessonMaterial[]) {
  return materials.map((material) => ({
    id: material.id,
    name: material.name,
    url: material.url,
    size: material.size,
    sizeBytes: material.sizeBytes,
    mimeType: material.mimeType,
    storagePath: material.storagePath,
    uploadedAt: material.uploadedAt,
  }))
}
