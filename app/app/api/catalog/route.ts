import { NextResponse } from "next/server"
import { getCatalogCourses } from "@/lib/queries"

/** GET /api/catalog — список опубликованных курсов (публичный) */
export async function GET() {
  try {
    const courses = await getCatalogCourses()
    return NextResponse.json({ courses })
  } catch (error) {
    console.error("Error fetching catalog courses:", error)
    return NextResponse.json({ courses: [] })
  }
}
