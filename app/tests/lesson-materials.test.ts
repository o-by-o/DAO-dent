import assert from "node:assert/strict"
import test from "node:test"
import {
  buildStoredFileName,
  formatFileSize,
  isAllowedMaterialFile,
  parseLessonMaterials,
  resolveMaterialAbsolutePath,
} from "../lib/lesson-materials"

test("isAllowedMaterialFile accepts supported types", () => {
  assert.equal(isAllowedMaterialFile("manual.pdf", "application/pdf"), true)
  assert.equal(isAllowedMaterialFile("photo.png", "image/png"), true)
  assert.equal(isAllowedMaterialFile("archive.7z", "application/x-7z-compressed"), true)
})

test("isAllowedMaterialFile rejects unsupported types", () => {
  assert.equal(isAllowedMaterialFile("malware.exe", "application/x-msdownload"), false)
  assert.equal(isAllowedMaterialFile("script.sh", "text/x-shellscript"), false)
})

test("buildStoredFileName keeps extension and sanitizes base", () => {
  const fileName = buildStoredFileName("  Presentation 2026!.PDF ")
  assert.match(fileName, /^[0-9]+-[a-z0-9]{8}-presentation-2026\.pdf$/)
})

test("parseLessonMaterials normalizes old and new records", () => {
  const parsed = parseLessonMaterials(
    [
      {
        name: "Guide.pdf",
        url: "https://cdn.example.com/guide.pdf",
        size: "1.4 MB",
      },
      {
        id: "abc",
        name: "Photo.png",
        sizeBytes: 1024,
        mimeType: "image/png",
        storagePath: "lesson-1/file.png",
      },
    ],
    "lesson-1",
  )

  assert.equal(parsed.length, 2)
  assert.match(parsed[0].id, /^legacy-/)
  assert.equal(parsed[0].url, "https://cdn.example.com/guide.pdf")
  assert.equal(parsed[1].id, "abc")
  assert.equal(parsed[1].url, "/api/lessons/lesson-1/materials/abc")
  assert.equal(parsed[1].size, "1.0 KB")
})

test("resolveMaterialAbsolutePath blocks traversal", () => {
  const previousDir = process.env.LESSON_MATERIALS_DIR
  process.env.LESSON_MATERIALS_DIR = "/tmp/lesson-materials-tests"

  try {
    assert.throws(
      () => resolveMaterialAbsolutePath("../../etc/passwd"),
      /Invalid material path/,
    )
  } finally {
    process.env.LESSON_MATERIALS_DIR = previousDir
  }
})

test("formatFileSize uses readable units", () => {
  assert.equal(formatFileSize(15), "15 B")
  assert.equal(formatFileSize(2048), "2.0 KB")
  assert.equal(formatFileSize(5 * 1024 * 1024), "5.0 MB")
})

