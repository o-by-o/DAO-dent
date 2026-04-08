"use client"

import { useState } from "react"
import {
  FileText,
  Stethoscope,
  Camera,
  Image as ImageIcon,
  Plus,
  ChevronDown,
  ChevronUp,
  Calendar,
} from "lucide-react"

const TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  consultation: { label: "Консультация", icon: Stethoscope, color: "bg-blue-100 text-blue-600 border-blue-200" },
  treatment: { label: "Лечение", icon: FileText, color: "bg-green-100 text-green-600 border-green-200" },
  xray: { label: "Рентген / КТ", icon: ImageIcon, color: "bg-purple-100 text-purple-600 border-purple-200" },
  photo_protocol: { label: "Фотопротокол", icon: Camera, color: "bg-amber-100 text-amber-600 border-amber-200" },
}

type MedicalRecordRow = {
  id: string
  date: Date | string
  type: string
  content: string
  attachments: unknown
  createdAt: Date | string
}

type Props = {
  patientId: string
  records: MedicalRecordRow[]
  editable?: boolean
}

export function MedicalRecords({ patientId, records, editable = false }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [formType, setFormType] = useState("consultation")
  const [formContent, setFormContent] = useState("")
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formContent.trim()) return
    setSaving(true)

    await fetch(`/api/admin/patients/${patientId}/medical-records`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: formType, content: formContent }),
    })

    setSaving(false)
    setFormContent("")
    setShowForm(false)
    window.location.reload()
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-semibold text-gray-900">
          <FileText className="h-4 w-4 text-blue-600" />
          Электронная медицинская карта
        </h3>
        {editable && (
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-100"
          >
            <Plus className="h-3 w-3" /> Добавить запись
          </button>
        )}
      </div>

      {/* Форма добавления */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
          <div className="mb-3 flex gap-2">
            {Object.entries(TYPE_CONFIG).map(([key, cfg]) => {
              const Icon = cfg.icon
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFormType(key)}
                  className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                    formType === key ? cfg.color : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {cfg.label}
                </button>
              )
            })}
          </div>
          <textarea
            value={formContent}
            onChange={(e) => setFormContent(e.target.value)}
            rows={4}
            placeholder="Описание осмотра, диагноз, проведённые процедуры, назначения..."
            className="mb-3 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving || !formContent.trim()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Сохранение..." : "Сохранить запись"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
            >
              Отмена
            </button>
          </div>
        </form>
      )}

      {/* Таймлайн записей */}
      {records.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-400">
          Записей в медицинской карте нет
        </p>
      ) : (
        <div className="relative space-y-0">
          {/* Вертикальная линия таймлайна */}
          <div className="absolute bottom-0 left-5 top-0 w-px bg-gray-200" />

          {records.map((record, i) => {
            const cfg = TYPE_CONFIG[record.type] || TYPE_CONFIG["consultation"]!
            const Icon = cfg.icon
            const isExpanded = expandedId === record.id
            const date = new Date(record.date)
            const content = record.content

            return (
              <div key={record.id} className="relative flex gap-4 pb-4">
                {/* Точка таймлайна */}
                <div className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 bg-white ${cfg.color}`}>
                  <Icon className="h-4 w-4" />
                </div>

                {/* Карточка записи */}
                <div className="flex-1 rounded-xl border border-gray-100 bg-gray-50 p-4 transition hover:bg-white hover:shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${cfg.color}`}>
                          {cfg.label}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Calendar className="h-3 w-3" />
                          {date.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
                        </span>
                      </div>

                      {/* Превью / полный текст */}
                      <p className={`mt-2 text-sm leading-relaxed text-gray-700 ${
                        !isExpanded && content.length > 200 ? "line-clamp-3" : ""
                      }`}>
                        {content}
                      </p>

                      {content.length > 200 && (
                        <button
                          type="button"
                          onClick={() => setExpandedId(isExpanded ? null : record.id)}
                          className="mt-1 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                        >
                          {isExpanded ? (
                            <><ChevronUp className="h-3 w-3" /> Свернуть</>
                          ) : (
                            <><ChevronDown className="h-3 w-3" /> Читать полностью</>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Вложения */}
                  {(() => {
                    const atts = Array.isArray(record.attachments) ? (record.attachments as Array<Record<string, string>>) : []
                    return atts.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {atts.map((att, j) => (
                        <a
                          key={j}
                          href={att["url"] || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 rounded-lg bg-white border border-gray-200 px-2.5 py-1 text-xs text-gray-600 transition hover:border-blue-300 hover:text-blue-600"
                        >
                          {(att["type"] || "").includes("image") ? <ImageIcon className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                          {att["name"] || "Файл"}
                        </a>
                      ))}
                    </div>
                  ) : null
                  })()}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
