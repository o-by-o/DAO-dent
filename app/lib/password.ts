/**
 * Генерация временного пароля для новых пользователей.
 * Показывается админу один раз при создании доступа.
 */
import crypto from "crypto"

const CHARS = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789"

export function generateTemporaryPassword(length = 12): string {
  const bytes = crypto.randomBytes(length)
  let result = ""
  for (let i = 0; i < length; i++) {
    result += CHARS[bytes[i] % CHARS.length]
  }
  return result
}
