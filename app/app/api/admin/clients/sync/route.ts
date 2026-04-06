import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { syncClientsFromUsers } from "@/lib/clients"

/** POST /api/admin/clients/sync — синхронизировать клиентов из пользователей (STUDENT) */
export async function POST() {
  const session = await auth()
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { created } = await syncClientsFromUsers()
  return NextResponse.json({ created, message: `Создано записей: ${created}` })
}
