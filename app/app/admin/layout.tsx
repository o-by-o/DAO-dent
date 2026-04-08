export const dynamic = 'force-dynamic'

import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { AdminLayoutClient } from "./admin-layout-client"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const role = (session.user as { role?: string }).role
  // Владелец и управляющий имеют доступ к админке
  if (role !== "OWNER" && role !== "MANAGER") {
    redirect("/home")
  }

  return <AdminLayoutClient>{children}</AdminLayoutClient>
}
