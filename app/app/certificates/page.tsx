import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { getUserCertificates } from "@/lib/queries"
import { CertificatesClient } from "./certificates-client"

export default async function CertificatesPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const certificates = await getUserCertificates(session.user.id)

  const certificatesWithName = certificates.map((certificate) => ({
    ...certificate,
    studentName: session.user.name || "Студент DIB Academy",
  }))

  return <CertificatesClient certificates={certificatesWithName} session={session} />
}
