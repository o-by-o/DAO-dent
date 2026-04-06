import { ScanFace, ArrowRight } from "lucide-react"

const FREE_LIMIT = 3

interface DiagnosticsCTAWidgetProps {
  analysisCount: number
}

export function DiagnosticsCTAWidget({ analysisCount }: DiagnosticsCTAWidgetProps) {
  const remaining = Math.max(0, FREE_LIMIT - analysisCount)
  const limitReached = remaining === 0

  return (
    <div className="flex items-center gap-4 rounded-xl border border-border/50 bg-card p-5 shadow-[var(--shadow-card)] boty-transition hover:shadow-[var(--shadow-card-hover)]">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
        <ScanFace className="h-6 w-6 text-primary" />
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-semibold text-foreground">
          AI-диагностика кожи
        </h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {limitReached
            ? "Бесплатные анализы использованы"
            : `Загрузите фото — получите персональный анализ. Осталось ${remaining} из ${FREE_LIMIT}`}
        </p>
      </div>
      <a
        href="/diagnostics"
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium boty-transition ${
          limitReached
            ? "bg-muted text-muted-foreground"
            : "bg-primary text-primary-foreground hover:bg-primary/90"
        }`}
      >
        {limitReached ? "Подробнее" : "Попробовать"}
        <ArrowRight className="h-3.5 w-3.5" />
      </a>
    </div>
  )
}
