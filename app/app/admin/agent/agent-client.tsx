"use client"

import { OpenClawChatClient } from "@/app/admin/courses/generate/openclaw-chat-client"

interface AgentClientProps {
  chatId: string
  initialMessages?: unknown[]
}

export function AgentClient({ chatId, initialMessages = [] }: AgentClientProps) {
  return <OpenClawChatClient chatId={chatId} initialMessages={initialMessages} />
}
