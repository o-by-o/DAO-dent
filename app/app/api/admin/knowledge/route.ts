/**
 * API для управления базой знаний (RAG)
 *
 * GET  /api/admin/knowledge — список записей
 * POST /api/admin/knowledge — добавить запись
 */

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const source = searchParams.get("source")
  const search = searchParams.get("search")
  const limit = parseInt(searchParams.get("limit") ?? "50", 10)

  const where: Record<string, unknown> = {}
  if (source) where.source = source
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { content: { contains: search, mode: "insensitive" } },
    ]
  }

  const items = await prisma.knowledgeChunk.findMany({
    where,
    select: {
      id: true,
      source: true,
      sourceId: true,
      title: true,
      content: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  })

  return NextResponse.json(items)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  const { source, sourceId, title, content, metadata } = body

  if (!source || !title || !content) {
    return NextResponse.json(
      { error: "source, title и content обязательны" },
      { status: 400 },
    )
  }

  // Попробуем создать с embedding если доступно
  try {
    const { indexDocument } = await import("@/lib/rag")
    const result = await indexDocument({
      source,
      sourceId,
      title,
      content,
      metadata,
    })
    return NextResponse.json(result, { status: 201 })
  } catch (e) {
    // Проверяем, были ли уже созданы какие-то чанки (частичный сбой)
    const existing = await prisma.knowledgeChunk.findFirst({
      where: { source, title },
      orderBy: { createdAt: "desc" },
    })
    if (existing) {
      // Частичный сбой — чанки уже есть, не дублируем
      return NextResponse.json(
        { error: "Частичная индексация — некоторые чанки созданы без embedding", chunkId: existing.id },
        { status: 207 },
      )
    }
    // Полный сбой — создаём без embedding
    const chunk = await prisma.knowledgeChunk.create({
      data: {
        source,
        sourceId: sourceId ?? null,
        title,
        content,
        metadata: metadata ?? {},
      },
    })
    return NextResponse.json({ chunkId: chunk.id }, { status: 201 })
  }
}
