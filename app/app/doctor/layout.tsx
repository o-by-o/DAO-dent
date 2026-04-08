export const dynamic = 'force-dynamic'

import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { DoctorLayoutClient } from "./doctor-layout-client"

export default async function DoctorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const role = (session.user as { role?: string }).role
  if (!["OWNER", "MANAGER", "DOCTOR"].includes(role || "")) {
    redirect("/home")
  }

  return <DoctorLayoutClient role={role || "DOCTOR"}>{children}</DoctorLayoutClient>
}
