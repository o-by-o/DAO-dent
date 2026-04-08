import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getCampaigns, createCampaign } from "@/lib/yandex-direct"

/** GET /api/admin/marketing/campaigns — список кампаний */
export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 })

  const role = (session.user as { role: string }).role
  if (role !== "OWNER") return NextResponse.json({ error: "Только владелец" }, { status: 403 })

  try {
    const campaigns = await getCampaigns()
    return NextResponse.json({ campaigns })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ошибка Яндекс.Директ" },
      { status: 500 },
    )
  }
}

/** POST /api/admin/marketing/campaigns — создать кампанию */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 })

  const role = (session.user as { role: string }).role
  if (role !== "OWNER") return NextResponse.json({ error: "Только владелец" }, { status: 403 })

  const body = await req.json()

  try {
    const result = await createCampaign({
      name: body.name,
      dailyBudgetMicros: (body.dailyBudget || 1000) * 1_000_000,
      startDate: body.startDate || new Date().toISOString().split("T")[0],
      regionIds: [1], // Москва
    })
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ошибка" },
      { status: 500 },
    )
  }
}
