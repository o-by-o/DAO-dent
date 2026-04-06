import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { postStockDocument } from "@/lib/warehouse"

function adminOnly() {
  return (session: { user?: { role?: string } } | null) => {
    if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    return null
  }
}

/** POST /api/admin/warehouse/documents/[id]/post — провести документ */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  const err = adminOnly()(session)
  if (err) return err

  const { id } = await params
  try {
    await postStockDocument(id)
    return NextResponse.json({ ok: true, message: "Документ проведён" })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ошибка проведения"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
