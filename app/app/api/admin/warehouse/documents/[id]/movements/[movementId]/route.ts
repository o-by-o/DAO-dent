import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

function adminOnly() {
  return (session: { user?: { role?: string } } | null) => {
    if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    return null
  }
}

/** DELETE /api/admin/warehouse/documents/[id]/movements/[movementId] — удалить строку (только DRAFT) */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; movementId: string }> }
) {
  const session = await auth()
  const err = adminOnly()(session)
  if (err) return err

  const { id: documentId, movementId } = await params
  const doc = await prisma.stockDocument.findUnique({ where: { id: documentId } })
  if (!doc) return NextResponse.json({ error: "Документ не найден" }, { status: 404 })
  if (doc.status !== "DRAFT") {
    return NextResponse.json({ error: "Можно удалять строки только в черновике" }, { status: 400 })
  }

  const mov = await prisma.stockMovement.findFirst({
    where: { id: movementId, documentId },
  })
  if (!mov) return NextResponse.json({ error: "Строка не найдена" }, { status: 404 })

  await prisma.stockMovement.delete({ where: { id: movementId } })
  return NextResponse.json({ ok: true })
}
