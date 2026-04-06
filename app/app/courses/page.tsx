import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { getUserCourses } from "@/lib/queries"
import { CoursesClient } from "./courses-client"

export default async function CoursesPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const courses = await getUserCourses(session.user.id)

  return <CoursesClient courses={courses} />
}
