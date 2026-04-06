import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { MyClientsClient } from "./my-clients-client"

export default async function MyClientsPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  return <MyClientsClient />
}
