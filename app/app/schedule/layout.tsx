export const dynamic = 'force-dynamic'

import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { ScheduleLayoutClient } from "./schedule-layout-client"

export default async function ScheduleLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const role = (session.user as { role?: string }).role || "ADMIN"

  return <ScheduleLayoutClient role={role}>{children}</ScheduleLayoutClient>
}
