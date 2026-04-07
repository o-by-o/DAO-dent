import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Главная — ДаоДент",
  description: "Панель управления клиники ДаоДент",
}

export default async function HomePage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const role = (session.user as { role?: string }).role

  // Перенаправляем в соответствующий раздел по роли
  switch (role) {
    case "OWNER":
      redirect("/owner/analytics")
    case "MANAGER":
      redirect("/owner/analytics")
    case "DOCTOR":
      redirect("/doctor/appointments")
    case "ADMIN":
      redirect("/leads")
    default:
      redirect("/leads")
  }
}
