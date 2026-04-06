import { NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { nextDocumentNumber } from "@/lib/warehouse"

function adminOnly() {
  return (session: { user?: { role?: string } } | null) => {
    if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    return null
  }
}

/** GET /api/admin/warehouse/documents — список документов */
export async function GET(request: Request) {
  const session = await auth()
  const err = adminOnly()(session)
  if (err) return err

  const { searchParams } = new URL(request.url)
  const type = searchParams.get("type") ?? ""
  const status = searchParams.get("status") ?? ""

  const where: Prisma.StockDocumentWhereInput = {}
  if (["RECEIPT", "WRITE_OFF", "TRANSFER", "INVENTORY"].includes(type)) {
    where.type = type as "RECEIPT" | "WRITE_OFF" | "TRANSFER" | "INVENTORY"
  }
  if (["DRAFT", "POSTED"].includes(status)) {
    where.status = status as "DRAFT" | "POSTED"
  }

  const docs = await prisma.stockDocument.findMany({
    where,
    include: { _count: { select: { movements: true } } },
    orderBy: { documentDate: "desc" },
  })

  return NextResponse.json({
    documents: docs.map((d) => ({
      id: d.id,
      type: d.type,
      number: d.number,
      documentDate: d.documentDate.toISOString(),
      status: d.status,
      comment: d.comment,
      movementsCount: d._count.movements,
      createdAt: d.createdAt.toISOString(),
    })),
  })
}

/** POST /api/admin/warehouse/documents — создать черновик документа */
export async function POST(request: Request) {
  const session = await auth()
  const err = adminOnly()(session)
  if (err) return err

  const body = await request.json() as { type: string; documentDate?: string; comment?: string }
  const type = body.type as "RECEIPT" | "WRITE_OFF" | "TRANSFER" | "INVENTORY"
  if (!["RECEIPT", "WRITE_OFF", "TRANSFER", "INVENTORY"].includes(type)) {
    return NextResponse.json({ error: "Недопустимый тип документа" }, { status: 400 })
  }

  const number = await nextDocumentNumber(type)
  const documentDate = body.documentDate
    ? new Date(body.documentDate)
    : new Date()
  const comment = typeof body.comment === "string" ? body.comment.trim() || null : null
  const userId = (session?.user as { id?: string })?.id ?? null

  const doc = await prisma.stockDocument.create({
    data: {
      type,
      number,
      documentDate,
      status: "DRAFT",
      comment,
      createdById: userId,
    },
  })

  return NextResponse.json({
    document: {
      id: doc.id,
      type: doc.type,
      number: doc.number,
      documentDate: doc.documentDate.toISOString(),
      status: doc.status,
      comment: doc.comment,
    },
  })
}
