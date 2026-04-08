import type { Metadata } from "next"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { MarketingDashboard } from "@/components/owner/marketing-dashboard"

export const metadata: Metadata = {
  title: "Маркетинг — ДаоДент",
}

export default async function OwnerMarketingPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const role = (session.user as { role: string }).role
  if (role !== "OWNER") redirect("/home")

  const hasToken = !!process.env.YANDEX_DIRECT_TOKEN

  return <MarketingDashboard yandexDirectConnected={hasToken} />
}
