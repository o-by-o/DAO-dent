/**
 * Web Worker для загрузки видео в Mux.
 * Загрузка может продолжаться при переключении вкладки (браузер меньше троттлит воркеры).
 */
self.onmessage = function (e) {
  const { type, uploadUrl, fileData, mimeType, id } = e.data
  if (type !== "upload" || !uploadUrl || !fileData) return

  const xhr = new XMLHttpRequest()
  const blob = new Blob([fileData], { type: mimeType || "video/mp4" })

  xhr.upload.addEventListener("progress", (ev) => {
    if (ev.lengthComputable) {
      self.postMessage({
        type: "progress",
        id,
        progress: Math.round((ev.loaded / ev.total) * 100),
      })
    }
  })

  xhr.addEventListener("load", () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      self.postMessage({ type: "done", id })
    } else {
      self.postMessage({ type: "error", id, error: `HTTP ${xhr.status}` })
    }
  })

  xhr.addEventListener("error", () => {
    self.postMessage({ type: "error", id, error: "Network error" })
  })

  xhr.open("PUT", uploadUrl)
  xhr.setRequestHeader("Content-Type", mimeType || "video/mp4")
  xhr.send(blob)
}
