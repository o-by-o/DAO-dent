import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { OrderChatClient } from "./order-chat-client"

export default async function OrderChatPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  return <OrderChatClient />
}
