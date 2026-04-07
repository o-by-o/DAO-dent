"use client"

import { useState } from "react"
import { Plus, Trash2, Save, X } from "lucide-react"

type Service = { id: string; name: string; price: { toString(): string } }

type StepInput = {
  description: string
  serviceId: string
  toothNumber: string
  cost: string
}

type Props = {
  patientId: string
  patientName: string
  services: Service[]
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

const emptyStep = (): StepInput => ({
  description: "",
  serviceId: "",
  toothNumber: "",
  cost: "",
})

export function TreatmentPlanForm({ patientId, patientName, services, open, onClose, onSuccess }: Props) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [steps, setSteps] = useState<StepInput[]>([emptyStep()])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  if (!open) return null

  const totalCost = steps.reduce((sum, s) => sum + (Number(s.cost) || 0), 0)

  function addStep() {
    setSteps([...steps, emptyStep()])
  }

  function removeStep(index: number) {
    setSteps(steps.filter((_, i) => i !== index))
  }

  function updateStep(index: number, field: keyof StepInput, value: string) {
    const updated = [...steps]
    updated[index] = { ...updated[index], [field]: value }

    // Автозаполнение стоимости при выборе услуги
    if (field === "serviceId" && value) {
      const service = services.find((s) => s.id === value)
      if (service) {
        updated[index].cost = String(Number(service.price))
        if (!updated[index].description) {
          updated[index].description = service.name
        }
      }
    }

    setSteps(updated)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      setError("Введите название плана")
      return
    }
    if (steps.length === 0 || !steps.some((s) => s.description.trim())) {
      setError("Добавьте хотя бы один шаг")
      return
    }

    setLoading(true)
    setError("")

    try {
      const res = await fetch(`/api/admin/patients/${patientId}/treatment-plans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          steps: steps
            .filter((s) => s.description.trim())
            .map((s) => ({
              description: s.description,
              serviceId: s.serviceId || undefined,
              toothNumber: s.toothNumber ? Number(s.toothNumber) : undefined,
              cost: Number(s.cost) || 0,
            })),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Ошибка создания плана")
      }

      onClose()
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl overflow-y-auto bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Новый план лечения</h2>
            <p className="text-sm text-gray-500">{patientName}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {/* Основные данные */}
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Название плана *</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Например: Лечение кариеса зубов 36, 37"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Описание</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Дополнительные комментарии к плану"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Шаги плана */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Этапы лечения</h3>
              <button
                type="button"
                onClick={addStep}
                className="flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-100"
              >
                <Plus className="h-3 w-3" /> Добавить этап
              </button>
            </div>

            <div className="space-y-3">
              {steps.map((step, i) => (
                <div key={i} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-400">Этап {i + 1}</span>
                    {steps.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeStep(i)}
                        className="rounded p-1 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <select
                        value={step.serviceId}
                        onChange={(e) => updateStep(i, "serviceId", e.target.value)}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
                      >
                        <option value="">Выберите услугу (опционально)</option>
                        {services.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} — {Number(s.price).toLocaleString("ru-RU")} ₽
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <input
                        value={step.description}
                        onChange={(e) => updateStep(i, "description", e.target.value)}
                        placeholder="Описание этапа *"
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <input
                        value={step.toothNumber}
                        onChange={(e) => updateStep(i, "toothNumber", e.target.value)}
                        placeholder="Номер зуба (11-48)"
                        type="number"
                        min="11"
                        max="48"
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <input
                        value={step.cost}
                        onChange={(e) => updateStep(i, "cost", e.target.value)}
                        placeholder="Стоимость, ₽"
                        type="number"
                        min="0"
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Итого */}
          <div className="flex items-center justify-between rounded-xl bg-blue-50 p-4">
            <span className="font-semibold text-gray-900">Итого по плану:</span>
            <span className="text-xl font-bold text-blue-600">
              {totalCost.toLocaleString("ru-RU")} &#8381;
            </span>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {loading ? "Сохранение..." : "Создать план лечения"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 px-6 py-3 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
