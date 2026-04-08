import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"

// /patients — редирект на /admin/patients
export default async function PatientsRedirect() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  redirect("/admin/patients")
}
