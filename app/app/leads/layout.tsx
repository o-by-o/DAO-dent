export const dynamic = 'force-dynamic'

import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { LeadsLayoutClient } from "./leads-layout-client"

export default async function LeadsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const role = (session.user as { role?: string }).role || "ADMIN"

  return <LeadsLayoutClient role={role}>{children}</LeadsLayoutClient>
}
