export default function AgentLoading() {
  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col items-center justify-center gap-4 text-muted-foreground">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <p>Загрузка Агента...</p>
    </div>
  )
}
