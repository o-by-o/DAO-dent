export const dynamic = 'force-dynamic'

import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { SupportLayoutClient } from "./support-layout-client"

export default async function SupportLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect("/login")
  const role = (session.user as { role?: string }).role || "ADMIN"
  return <SupportLayoutClient role={role}>{children}</SupportLayoutClient>
}
