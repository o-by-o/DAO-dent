import { NextResponse } from "next/server"
import { getSiteContentMap } from "@/lib/site-content"

/** GET /api/site-content — все ключи контента (публичный, для SSR) */
export async function GET() {
  const map = await getSiteContentMap()
  const obj = Object.fromEntries(map)
  return NextResponse.json(obj)
}
