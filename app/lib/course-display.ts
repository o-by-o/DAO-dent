export function stripSectionPrefix(title: string): string {
  const trimmed = title.trim()
  if (!trimmed) return ""

  // "Модуль 3: Тема" -> "Тема", "Раздел 2. Тема" -> "Тема", "Section 1 - Intro" -> "Intro"
  return trimmed
    .replace(
      /^(?:модуль|раздел|module|section)\s+\d+\s*[:.\-–—]?\s*/i,
      "",
    )
    .trim()
}

export function formatSectionHeading(order: number, title: string): string {
  const topic = stripSectionPrefix(title)
  return topic ? `Раздел ${order}: ${topic}` : `Раздел ${order}`
}

export function isDefaultSectionTitle(title: string): boolean {
  const t = title.trim().toLowerCase()
  return /^(раздел|модуль|section|module)\s+\d+$/.test(t)
}

