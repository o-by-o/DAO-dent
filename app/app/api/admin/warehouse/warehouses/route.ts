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

/** GET /api/admin/warehouse/warehouses */
export async function GET() {
  const session = await auth()
  const err = adminOnly()(session)
  if (err) return err

  const warehouses = await prisma.warehouse.findMany({
    orderBy: { name: "asc" },
  })
  return NextResponse.json({
    warehouses: warehouses.map((w) => ({
      id: w.id,
      name: w.name,
      type: w.type,
      createdAt: w.createdAt.toISOString(),
    })),
  })
}

/** POST /api/admin/warehouse/warehouses */
export async function POST(request: Request) {
  const session = await auth()
  const err = adminOnly()(session)
  if (err) return err

  const body = await request.json() as { name: string; type?: string }
  const name = (body.name ?? "").trim()
  if (!name) {
    return NextResponse.json({ error: "Название обязательно" }, { status: 400 })
  }
  const type = ["MAIN", "CABINET"].includes(body.type ?? "")
    ? (body.type as "MAIN" | "CABINET")
    : "MAIN"

  const warehouse = await prisma.warehouse.create({
    data: { name, type },
  })
  return NextResponse.json({
    warehouse: {
      id: warehouse.id,
      name: warehouse.name,
      type: warehouse.type,
    },
  })
}
