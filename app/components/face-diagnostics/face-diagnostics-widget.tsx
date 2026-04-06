"use client"

import { useState, useRef } from "react"

interface AnalysisResult {
  analysisId: string
  skinType: string
  concerns: string[]
  condition: string
  summary: string
  recommendations: string[]
  productRecommendations: Array<{ title: string; content: string }>
}

interface FaceDiagnosticsWidgetProps {
  remainingAnalyses?: number
  isAdmin?: boolean
}

export function FaceDiagnosticsWidget({
  remainingAnalyses = Infinity,
  isAdmin = false,
}: FaceDiagnosticsWidgetProps) {
  const limitReached = !isAdmin && remainingAnalyses <= 0
  const [image, setImage] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      setError("Пожалуйста, выберите изображение")
      return
    }

    setFileName(file.name)
    setError(null)
    setResult(null)

    const reader = new FileReader()
    reader.onload = (ev) => {
      setImage(ev.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleAnalyze = async () => {
    if (!image) return

    setLoading(true)
    setError(null)

    try {
      const file = fileInputRef.current?.files?.[0]
      if (!file) throw new Error("Файл не выбран")

      const formData = new FormData()
      formData.append("file", file)

      const uploadRes = await fetch("/api/admin/ai-chat/upload-image", {
        method: "POST",
        body: formData,
      })

      if (!uploadRes.ok) throw new Error("Ошибка загрузки изображения")
      const { url } = await uploadRes.json()

      const analysisRes = await fetch("/api/skin-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: url }),
      })

      if (!analysisRes.ok) {
        const err = await analysisRes.json()
        throw new Error(err.error || "Ошибка анализа")
      }

      const data = await analysisRes.json()
      setResult(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Неизвестная ошибка")
    } finally {
      setLoading(false)
    }
  }

  const conditionColor = (condition: string) => {
    if (condition.includes("хорош")) return "text-green-600"
    if (condition.includes("удовлетвор")) return "text-yellow-600"
    return "text-orange-600"
  }

  const conditionBg = (condition: string) => {
    if (condition.includes("хорош")) return "bg-green-50 border-green-200"
    if (condition.includes("удовлетвор")) return "bg-yellow-50 border-yellow-200"
    return "bg-orange-50 border-orange-200"
  }

  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-12rem)]">
      {/* Hidden file input — always rendered so ref is valid in all states */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFileSelect(e)}
      />
      {/* Main content area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        {!result ? (
          /* Upload state */
          <div className="w-full max-w-md flex flex-col items-center">
            {image ? (
              /* Image preview */
              <div className="relative mb-6">
                <img
                  src={image}
                  alt="Фото для анализа"
                  className="max-w-xs w-full rounded-2xl border border-border shadow-sm"
                />
                <button
                  onClick={() => {
                    setImage(null)
                    setResult(null)
                    setFileName("")
                    if (fileInputRef.current) fileInputRef.current.value = ""
                  }}
                  className="absolute top-3 right-3 bg-white/80 backdrop-blur text-foreground rounded-full w-8 h-8 flex items-center justify-center hover:bg-white shadow-sm border border-border transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                {fileName && (
                  <p className="text-xs text-muted-foreground text-center mt-2">{fileName}</p>
                )}

                {/* Analyze button */}
                <div className="flex flex-col items-center gap-2 mt-4">
                  <button
                    onClick={handleAnalyze}
                    disabled={loading || limitReached}
                    className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 disabled:opacity-50 transition-all shadow-sm"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Анализирую...
                      </span>
                    ) : (
                      "Анализировать кожу"
                    )}
                  </button>
                  {limitReached && (
                    <p className="text-sm text-muted-foreground">
                      Лимит бесплатных анализов исчерпан. Обратитесь к нам для дополнительных.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              /* Camera upload area */
              <div onClick={() => fileInputRef.current?.click()} className="cursor-pointer flex flex-col items-center mb-6">
                {/* Camera circle */}
                <div className="w-24 h-24 rounded-full bg-muted/80 border-2 border-border flex items-center justify-center mb-6 hover:bg-muted hover:border-primary/30 transition-all">
                  <svg className="w-10 h-10 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>

                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Загрузите фото для анализа кожи
                </h2>
                <p className="text-sm text-muted-foreground text-center">
                  AI проанализирует состояние кожи и подберёт рекомендации
                </p>

              </div>
            )}

            {error && (
              <div className="w-full mt-2 p-3 bg-destructive/10 text-destructive rounded-xl text-sm text-center">
                {error}
              </div>
            )}
          </div>
        ) : (
          /* Results */
          <div className="w-full max-w-2xl space-y-5 py-4">
            {/* Header with image */}
            <div className="flex items-start gap-4">
              {image && (
                <img
                  src={image}
                  alt="Анализируемое фото"
                  className="w-20 h-20 rounded-xl object-cover border border-border"
                />
              )}
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-foreground">Результаты анализа</h2>
                <p className="text-sm text-muted-foreground mt-0.5">{result.summary}</p>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-card border border-border text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Тип кожи</p>
                <p className="text-sm font-semibold text-foreground">{result.skinType}</p>
              </div>
              <div className={`p-3 rounded-xl border text-center ${conditionBg(result.condition)}`}>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Состояние</p>
                <p className={`text-sm font-semibold ${conditionColor(result.condition)}`}>
                  {result.condition}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-card border border-border text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Проблемы</p>
                <p className="text-sm font-semibold text-foreground">{result.concerns.length}</p>
              </div>
            </div>

            {/* Concerns tags */}
            {result.concerns.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {result.concerns.map((c, i) => (
                  <span key={i} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                    {c}
                  </span>
                ))}
              </div>
            )}

            {/* Recommendations */}
            <div className="rounded-xl bg-card border border-border p-4">
              <h3 className="text-sm font-semibold text-primary mb-3">Рекомендации по уходу</h3>
              <ul className="space-y-2">
                {result.recommendations.map((r, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex gap-2">
                    <span className="text-primary mt-0.5 shrink-0">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>

            {/* Product recommendations */}
            {result.productRecommendations.length > 0 && (
              <div className="rounded-xl bg-card border border-border p-4">
                <h3 className="text-sm font-semibold text-primary mb-3">Рекомендуемые продукты</h3>
                <div className="space-y-3">
                  {result.productRecommendations.map((p, i) => (
                    <div key={i} className="flex gap-3 items-start">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{p.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{p.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New analysis button */}
            <div className="flex justify-center pt-2">
              <button
                onClick={() => {
                  setImage(null)
                  setResult(null)
                  setFileName("")
                  setError(null)
                  if (fileInputRef.current) fileInputRef.current.value = ""

                }}
                className="text-sm text-primary font-medium hover:underline"
              >
                Новый анализ
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom bar — quick photo upload */}
      <div className="sticky bottom-0 bg-background border-t border-border px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 h-10 rounded-xl border border-border bg-card flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Загрузить фото
          </button>
        </div>
      </div>
    </div>
  )
}
