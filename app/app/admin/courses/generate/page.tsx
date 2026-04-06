import { redirect } from "next/navigation"

export default async function OpenClawGeneratePage({
  searchParams,
}: {
  searchParams: Promise<{ chat?: string }>
}) {
  const { chat: chatIdParam } = await searchParams
  const query = chatIdParam ? `?chat=${encodeURIComponent(chatIdParam)}` : ""
  redirect(`/admin/agent${query}`)
}
