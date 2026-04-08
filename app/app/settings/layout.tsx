export const dynamic = 'force-dynamic'

import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { SettingsLayoutClient } from "./settings-layout-client"

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect("/login")
  const role = (session.user as { role?: string }).role || "ADMIN"
  return <SettingsLayoutClient role={role}>{children}</SettingsLayoutClient>
}
