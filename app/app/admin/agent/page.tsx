import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { AgentClient } from "./agent-client"

export default async function AgentPage({
  searchParams,
}: {
  searchParams: Promise<{ chat?: string }>
}) {
  const session = await auth()
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    redirect("/login")
  }

  const userId = session.user.id as string
  const userExists = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  })
  if (!userExists) {
    redirect("/login")
  }

  const { chat: chatIdParam } = await searchParams

  if (!chatIdParam) {
    const chat = await prisma.agentConversation.create({
      data: { userId },
    })
    redirect(`/admin/agent?chat=${chat.id}`)
  }

  const conversation = await prisma.agentConversation.findFirst({
    where: { id: chatIdParam, userId },
    select: { id: true, messages: true },
  })

  if (!conversation) {
    redirect("/admin/agent")
  }

  const initialMessages = Array.isArray(conversation.messages) ? conversation.messages : []

  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col">
      <AgentClient
        chatId={conversation.id}
        initialMessages={initialMessages}
      />
    </div>
  )
}
