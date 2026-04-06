import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { ScheduleClient } from "./schedule-client"

export default async function SchedulePage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  return <ScheduleClient />
}
