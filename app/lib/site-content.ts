import { prisma } from "@/lib/prisma"

const DEFAULTS: Record<string, string> = {
  shop_title: "Профессиональная косметика",
  shop_subtitle: "Косметика ведущих клиник Южной Кореи — оптовые поставки по всей России",
  hero_title: "Профессиональная корейская косметика",
  hero_subtitle:
    "Ваш проводник в мир передовой корейской косметологии для профессионалов России. Эксклюзивные бренды, аппараты, обучение и поддержка.",
  footer_phone: "+7 (984) 113-12-20",
  footer_email: "dib-interfarm@mail.ru",
  about_text:
    "Мы — ваш надёжный партнёр, открывающий доступ к инновационным южнокорейским разработкам в уходе за кожей и аппаратном омоложении. Наша миссия — сделать эти решения доступными специалистам и их клиентам по всей стране.",
}

// Prisma client может не иметь siteContent до перезапуска после prisma generate
const siteContent =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prisma && typeof (prisma as any).siteContent?.findUnique === "function"
    ? (prisma as any).siteContent
    : null

/** Получить значение контента по ключу. Fallback на дефолт. */
export async function getSiteContent(key: string): Promise<string> {
  try {
    if (!siteContent) return DEFAULTS[key] ?? ""
    const row = await siteContent.findUnique({ where: { key } })
    return row?.value ?? DEFAULTS[key] ?? ""
  } catch {
    return DEFAULTS[key] ?? ""
  }
}

/** Получить все ключи контента как Map */
export async function getSiteContentMap(): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  for (const [k, v] of Object.entries(DEFAULTS)) {
    map.set(k, v)
  }
  try {
    if (!siteContent) return map
    const rows = await siteContent.findMany({ select: { key: true, value: true } })
    for (const r of rows) {
      map.set(r.key, r.value)
    }
  } catch {
    // ignore
  }
  return map
}
