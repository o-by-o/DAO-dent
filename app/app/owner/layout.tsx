export const dynamic = 'force-dynamic'

import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { OwnerLayoutClient } from "./owner-layout-client"

export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const role = (session.user as { role?: string }).role
  if (role !== "OWNER" && role !== "MANAGER") {
    redirect("/home")
  }

  return <OwnerLayoutClient role={role || "OWNER"}>{children}</OwnerLayoutClient>
}
