/**
 * Единый интерфейс для постинга в соцсети
 */

export { postToTelegram } from "./telegram"
export type { TelegramPostResult } from "./telegram"

export { postToVK } from "./vk"
export type { VKPostResult } from "./vk"
