import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { getSkinAnalysisCount } from "@/lib/queries"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { FaceDiagnosticsWidget } from "@/components/face-diagnostics/face-diagnostics-widget"

const FREE_LIMIT = 3

export default async function DiagnosticsPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const role = (session.user as { role?: string }).role
  const isAdmin = role === "ADMIN"
  const analysisCount = await getSkinAnalysisCount(session.user.id)
  const remaining = isAdmin ? Infinity : Math.max(0, FREE_LIMIT - analysisCount)

  return (
    <DashboardLayout activePath="/diagnostics" session={session}>
      <div className="flex flex-col h-full">
        <div className="px-1 pt-1 pb-3">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            AI-диагностика кожи
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Загрузите фото — получите анализ и персональные рекомендации
            {!isAdmin && (
              <span className="ml-2 inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                Осталось: {remaining}/{FREE_LIMIT}
              </span>
            )}
          </p>
        </div>
        <FaceDiagnosticsWidget
          remainingAnalyses={remaining}
          isAdmin={isAdmin}
        />
      </div>
    </DashboardLayout>
  )
}
