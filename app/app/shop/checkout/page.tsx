import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { CheckoutClient } from "./checkout-client"

export default async function CheckoutPage() {
  const session = await auth()
  if (!session?.user) redirect("/login?callbackUrl=/shop/checkout")

  return <CheckoutClient session={session} />
}
