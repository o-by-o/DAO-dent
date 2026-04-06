import Mux from "@mux/mux-node"

let _mux: Mux | null = null

/**
 * Ленивая инициализация Mux SDK.
 * Бросает ошибку только при первом реальном обращении, а не при импорте модуля.
 */
export function getMux(): Mux {
  if (_mux) return _mux

  if (!process.env.MUX_TOKEN_ID || !process.env.MUX_TOKEN_SECRET) {
    throw new Error("MUX_TOKEN_ID и MUX_TOKEN_SECRET должны быть заданы в .env")
  }

  _mux = new Mux({
    tokenId: process.env.MUX_TOKEN_ID,
    tokenSecret: process.env.MUX_TOKEN_SECRET,
  })

  return _mux
}

