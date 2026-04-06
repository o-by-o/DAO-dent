/**
 * RAG (Retrieval Augmented Generation) — база знаний DIB Academy
 *
 * Используется pgvector для семантического поиска.
 * Embedding: OpenAI text-embedding-3-small (1536 dims).
 */

import { prisma } from "@/lib/prisma"

/**
 * Получить embedding для текста через OpenAI-совместимый API
 */
export async function embedText(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY обязателен для embeddings")
  }

  const apiBaseUrl = (
    process.env.OPENAI_API_BASE_URL ||
    process.env.OPENAI_API_URL ||
    "https://api.openai.com/v1"
  )
    .replace(/\/(embeddings|chat\/completions)\/?$/i, "")
    .replace(/\/+$/, "")
  const embeddingsUrl =
    process.env.OPENAI_EMBEDDINGS_URL || `${apiBaseUrl}/embeddings`
  const model = process.env.EMBEDDING_MODEL || "text-embedding-3-small"

  const res = await fetch(embeddingsUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      input: text.slice(0, 8000), // limit input length
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Embedding API error: ${res.status} ${err}`)
  }

  const data = await res.json()
  return data.data[0].embedding as number[]
}

/**
 * Семантический поиск по базе знаний
 */
export async function searchKnowledge(
  query: string,
  options?: { limit?: number; source?: string },
): Promise<
  Array<{
    id: string
    title: string
    content: string
    source: string
    score: number
  }>
> {
  const limit = options?.limit ?? 5

  try {
    const embedding = await embedText(query)
    const vectorStr = `[${embedding.join(",")}]`

    let results: Array<{ id: string; title: string; content: string; source: string; score: number }>

    if (options?.source) {
      results = await prisma.$queryRawUnsafe<typeof results>(
        `SELECT id, title, content, source,
                1 - (embedding <=> $1::vector) as score
         FROM knowledge_chunks
         WHERE embedding IS NOT NULL
           AND source = $2
         ORDER BY embedding <=> $1::vector
         LIMIT $3::int`,
        vectorStr,
        options.source,
        limit,
      )
    } else {
      results = await prisma.$queryRawUnsafe<typeof results>(
        `SELECT id, title, content, source,
                1 - (embedding <=> $1::vector) as score
         FROM knowledge_chunks
         WHERE embedding IS NOT NULL
         ORDER BY embedding <=> $1::vector
         LIMIT $2::int`,
        vectorStr,
        limit,
      )
    }

    // Если vector-поиск вернул пустой результат (нет embeddings) — fallback на текст
    if (results.length === 0) {
      return searchKnowledgeText(query, limit, options?.source)
    }

    return results
  } catch (error) {
    // Fallback: текстовый поиск если pgvector недоступен
    console.warn("pgvector search failed, falling back to text search:", error)
    return searchKnowledgeText(query, limit, options?.source)
  }
}

/**
 * Fallback: текстовый поиск (ILIKE) для случаев когда pgvector недоступен
 */
async function searchKnowledgeText(
  query: string,
  limit: number,
  source?: string,
): Promise<
  Array<{
    id: string
    title: string
    content: string
    source: string
    score: number
  }>
> {
  const words = query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .slice(0, 5)

  if (words.length === 0) return []

  const where: Record<string, unknown> = {
    OR: words.map((word) => ({
      OR: [
        { title: { contains: word, mode: "insensitive" } },
        { content: { contains: word, mode: "insensitive" } },
      ],
    })),
  }
  if (source) where.source = source

  const results = await prisma.knowledgeChunk.findMany({
    where,
    select: { id: true, title: true, content: true, source: true },
    take: limit,
  })

  return results.map((r, i) => ({
    ...r,
    score: Math.max(0.1, 1 - i * 0.1), // approximate relevance, floor at 0.1
  }))
}

/**
 * Индексация документа: разбивка на чанки и сохранение с embeddings
 */
export async function indexDocument(params: {
  source: string
  sourceId?: string
  title: string
  content: string
  metadata?: Record<string, unknown>
}): Promise<{ chunkId: string }> {
  // Разбиваем длинный контент на чанки по ~1000 символов
  const chunks = splitIntoChunks(params.content, 1000)

  const results: string[] = []

  for (let i = 0; i < chunks.length; i++) {
    const chunkTitle =
      chunks.length > 1 ? `${params.title} (часть ${i + 1})` : params.title

    let embeddingVector: number[] | null = null
    try {
      embeddingVector = await embedText(`${chunkTitle}\n\n${chunks[i]}`)
    } catch {
      // Сохраняем без embedding — текстовый поиск будет работать
      console.warn(`Failed to embed chunk "${chunkTitle}", saving without embedding`)
    }

    const vectorStr = embeddingVector
      ? `[${embeddingVector.join(",")}]`
      : null

    if (vectorStr) {
      // Создаём запись через Prisma (генерирует CUID), затем обновляем embedding через raw SQL
      const chunk = await prisma.knowledgeChunk.create({
        data: {
          source: params.source,
          sourceId: params.sourceId ?? null,
          title: chunkTitle,
          content: chunks[i],
          metadata: (params.metadata ?? {}) as any,
        },
      })
      await prisma.$queryRawUnsafe(
        `UPDATE knowledge_chunks SET embedding = $1::vector WHERE id = $2`,
        vectorStr,
        chunk.id,
      )
      results.push(chunk.id)
    } else {
      // Без embedding — через Prisma
      const chunk = await prisma.knowledgeChunk.create({
        data: {
          source: params.source,
          sourceId: params.sourceId ?? null,
          title: chunkTitle,
          content: chunks[i],
          metadata: (params.metadata ?? {}) as any,
        },
      })
      results.push(chunk.id)
    }
  }

  return { chunkId: results[0] }
}

/**
 * Разбивка текста на чанки с перекрытием
 */
function splitIntoChunks(text: string, maxChunkSize: number): string[] {
  if (text.length <= maxChunkSize) return [text]

  const chunks: string[] = []
  const paragraphs = text.split(/\n\n+/)
  let current = ""

  for (const para of paragraphs) {
    if (current.length + para.length > maxChunkSize && current.length > 0) {
      chunks.push(current.trim())
      // Overlap: keep last 200 chars for context, but cap total size
      const overlap = current.slice(-200)
      current = overlap + "\n\n" + para
      // If a single paragraph exceeds maxChunkSize, push it immediately
      if (current.length > maxChunkSize * 1.5) {
        chunks.push(current.trim())
        current = ""
      }
    } else {
      current += (current ? "\n\n" : "") + para
    }
  }

  if (current.trim()) {
    chunks.push(current.trim())
  }

  return chunks.length > 0 ? chunks : [text]
}
