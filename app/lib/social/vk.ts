/**
 * VK API — постинг в сообщество (wall.post)
 */

const VK_API_VERSION = "5.199"

export interface VKPostResult {
  ok: boolean
  postId?: number
  error?: string
}

/**
 * Загружает фото на стену сообщества VK и возвращает attachment-строку.
 * Поток: getWallUploadServer → скачать картинку → загрузить на VK → saveWallPhoto
 */
async function uploadWallPhoto(
  imageUrl: string,
  groupId: string,
  accessToken: string,
): Promise<string | null> {
  try {
    // 1. Получаем URL для загрузки
    const serverParams = new URLSearchParams({
      group_id: groupId,
      access_token: accessToken,
      v: VK_API_VERSION,
    })
    const serverRes = await fetch("https://api.vk.com/method/photos.getWallUploadServer", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: serverParams.toString(),
    })
    const serverData = await serverRes.json()
    if (serverData.error || !serverData.response?.upload_url) return null

    // 2. Скачиваем изображение
    const imgRes = await fetch(imageUrl)
    if (!imgRes.ok) return null
    const imgBlob = await imgRes.blob()

    // Определяем расширение из Content-Type
    const contentType = imgRes.headers.get("content-type") || "image/jpeg"
    const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg"

    // 3. Загружаем на VK
    const formData = new FormData()
    formData.append("photo", imgBlob, `photo.${ext}`)

    const uploadRes = await fetch(serverData.response.upload_url, {
      method: "POST",
      body: formData,
    })
    const uploadData = await uploadRes.json()
    if (!uploadData.photo || uploadData.photo === "[]") return null

    // 4. Сохраняем фото
    const saveParams = new URLSearchParams({
      group_id: groupId,
      photo: uploadData.photo,
      server: String(uploadData.server),
      hash: uploadData.hash,
      access_token: accessToken,
      v: VK_API_VERSION,
    })
    const saveRes = await fetch("https://api.vk.com/method/photos.saveWallPhoto", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: saveParams.toString(),
    })
    const saveData = await saveRes.json()
    const photo = saveData.response?.[0]
    if (!photo) return null

    return `photo${photo.owner_id}_${photo.id}`
  } catch {
    return null
  }
}

export async function postToVK(
  text: string,
  imageUrl?: string,
): Promise<VKPostResult> {
  const accessToken = process.env.VK_ACCESS_TOKEN
  const groupId = process.env.VK_GROUP_ID

  if (!accessToken || !groupId) {
    return { ok: false, error: "VK_ACCESS_TOKEN или VK_GROUP_ID не настроены" }
  }

  try {
    const params = new URLSearchParams({
      owner_id: `-${groupId}`,
      message: text,
      from_group: "1",
      access_token: accessToken,
      v: VK_API_VERSION,
    })

    // Загружаем фото через VK API (photos.getWallUploadServer → upload → saveWallPhoto)
    if (imageUrl) {
      const attachment = await uploadWallPhoto(imageUrl, groupId, accessToken)
      if (attachment) {
        params.set("attachments", attachment)
      }
      // Если загрузка не удалась — публикуем без фото, текст важнее
    }

    const res = await fetch("https://api.vk.com/method/wall.post", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    })

    const data = await res.json()

    if (data.error) {
      return {
        ok: false,
        error: data.error.error_msg || `VK error ${data.error.error_code}`,
      }
    }

    return {
      ok: true,
      postId: data.response?.post_id,
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Ошибка сети" }
  }
}
