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

/** PATCH /api/admin/warehouse/warehouses/[id] */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  const err = adminOnly()(session)
  if (err) return err

  const { id } = await params
  const body = await request.json() as { name?: string; type?: string }
  const data: { name?: string; type?: "MAIN" | "RETAIL" | "TRANSIT" } = {}
  if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim()
  if (["MAIN", "RETAIL", "TRANSIT"].includes(body.type ?? "")) data.type = body.type as "MAIN" | "RETAIL" | "TRANSIT"

  const warehouse = await prisma.warehouse.update({ where: { id }, data })
  return NextResponse.json({
    warehouse: {
      id: warehouse.id,
      name: warehouse.name,
      type: warehouse.type,
    },
  })
}

/** DELETE /api/admin/warehouse/warehouses/[id] */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  const err = adminOnly()(session)
  if (err) return err

  const { id } = await params
  await prisma.warehouse.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
