"use client"

import { useState } from "react"

type ToothStatus =
  | "HEALTHY"
  | "CARIES"
  | "FILLED"
  | "CROWN"
  | "MISSING"
  | "IMPLANT"
  | "ROOT_CANAL"
  | "BRIDGE"
  | "PERIDONTAL"
  | "EXTRACTION_NEEDED"

type ToothData = {
  toothNumber: number
  status: ToothStatus
  notes?: string | null
}

const STATUS_COLORS: Record<ToothStatus, string> = {
  HEALTHY: "#22c55e",
  CARIES: "#ef4444",
  FILLED: "#3b82f6",
  CROWN: "#a855f7",
  MISSING: "#9ca3af",
  IMPLANT: "#06b6d4",
  ROOT_CANAL: "#f97316",
  BRIDGE: "#8b5cf6",
  PERIDONTAL: "#dc2626",
  EXTRACTION_NEEDED: "#b91c1c",
}

const STATUS_LABELS: Record<ToothStatus, string> = {
  HEALTHY: "Здоров",
  CARIES: "Кариес",
  FILLED: "Пломба",
  CROWN: "Коронка",
  MISSING: "Отсутствует",
  IMPLANT: "Имплант",
  ROOT_CANAL: "Депульпирован",
  BRIDGE: "Мост",
  PERIDONTAL: "Пародонтит",
  EXTRACTION_NEEDED: "Требует удаления",
}

// ISO 3950: верхняя челюсть 18-11, 21-28; нижняя 48-41, 31-38
const UPPER_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11]
const UPPER_LEFT = [21, 22, 23, 24, 25, 26, 27, 28]
const LOWER_LEFT = [31, 32, 33, 34, 35, 36, 37, 38]
const LOWER_RIGHT = [48, 47, 46, 45, 44, 43, 42, 41]

type Props = {
  teeth: ToothData[]
  onToothClick?: (toothNumber: number) => void
  onStatusChange?: (toothNumber: number, status: ToothStatus) => void
  editable?: boolean
  patientId?: string
}

function ToothIcon({
  number,
  status,
  selected,
  onClick,
}: {
  number: number
  status: ToothStatus
  selected: boolean
  onClick: () => void
}) {
  const color = STATUS_COLORS[status]
  const isMissing = status === "MISSING"

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex flex-col items-center gap-1 transition ${
        selected ? "scale-110" : "hover:scale-105"
      }`}
      title={`${number}: ${STATUS_LABELS[status]}`}
    >
      <span className="text-[10px] font-medium text-gray-400">{number}</span>
      <svg viewBox="0 0 30 36" className="h-10 w-8">
        <path
          d="M15 2 C10 2 5 7 5 14 C5 21 8 25 11 31 C12 33 13 34 14 34 C14.5 34 15 33 15 32 C15 33 15.5 34 16 34 C17 34 18 33 19 31 C22 25 25 21 25 14 C25 7 20 2 15 2Z"
          fill={isMissing ? "none" : color}
          fillOpacity={isMissing ? 0 : 0.15}
          stroke={color}
          strokeWidth={selected ? 2.5 : 1.5}
          strokeDasharray={isMissing ? "3 2" : "none"}
        />
        {status === "IMPLANT" && (
          <line x1="15" y1="10" x2="15" y2="28" stroke={color} strokeWidth="2" />
        )}
        {status === "CROWN" && (
          <circle cx="15" cy="14" r="5" fill="none" stroke={color} strokeWidth="1.5" />
        )}
        {status === "FILLED" && (
          <rect x="11" y="10" width="8" height="8" rx="2" fill={color} fillOpacity="0.4" />
        )}
        {status === "CARIES" && (
          <circle cx="15" cy="14" r="4" fill={color} fillOpacity="0.5" />
        )}
      </svg>
    </button>
  )
}

export function DentalChart({ teeth, onToothClick, onStatusChange, editable = false, patientId }: Props) {
  const [saving, setSaving] = useState(false)
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null)

  const getStatus = (num: number): ToothStatus => {
    const tooth = teeth.find((t) => t.toothNumber === num)
    return tooth?.status || "HEALTHY"
  }

  const handleClick = (num: number) => {
    setSelectedTooth(num === selectedTooth ? null : num)
    onToothClick?.(num)
  }

  const renderRow = (numbers: number[]) =>
    numbers.map((num) => (
      <ToothIcon
        key={num}
        number={num}
        status={getStatus(num)}
        selected={selectedTooth === num}
        onClick={() => handleClick(num)}
      />
    ))

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-center text-sm font-medium text-gray-500">Верхняя челюсть</h3>
        <div className="flex justify-center gap-1">
          <div className="flex gap-1">{renderRow(UPPER_RIGHT)}</div>
          <div className="w-px bg-gray-200" />
          <div className="flex gap-1">{renderRow(UPPER_LEFT)}</div>
        </div>

        <div className="my-4 border-t border-dashed border-gray-200" />

        <div className="flex justify-center gap-1">
          <div className="flex gap-1">{renderRow(LOWER_RIGHT)}</div>
          <div className="w-px bg-gray-200" />
          <div className="flex gap-1">{renderRow(LOWER_LEFT)}</div>
        </div>
        <h3 className="mt-4 text-center text-sm font-medium text-gray-500">Нижняя челюсть</h3>
      </div>

      {/* Легенда */}
      <div className="flex flex-wrap justify-center gap-3">
        {Object.entries(STATUS_LABELS).map(([key, label]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: STATUS_COLORS[key as ToothStatus] }}
            />
            <span className="text-xs text-gray-500">{label}</span>
          </div>
        ))}
      </div>

      {/* Редактирование выбранного зуба */}
      {selectedTooth && editable && (
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
          <p className="mb-2 text-sm font-medium text-blue-900">
            Зуб {selectedTooth} — {STATUS_LABELS[getStatus(selectedTooth)]}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(STATUS_LABELS) as ToothStatus[]).map((st) => (
              <button
                key={st}
                type="button"
                disabled={saving}
                onClick={async () => {
                  if (patientId) {
                    setSaving(true)
                    await fetch(`/api/admin/patients/${patientId}/dental-chart`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ toothNumber: selectedTooth, status: st }),
                    })
                    setSaving(false)
                  }
                  onStatusChange?.(selectedTooth, st)
                }}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                  getStatus(selectedTooth) === st
                    ? "ring-2 ring-blue-500 ring-offset-1"
                    : "hover:opacity-80"
                }`}
                style={{
                  backgroundColor: STATUS_COLORS[st] + "20",
                  color: STATUS_COLORS[st],
                  borderWidth: 1,
                  borderColor: STATUS_COLORS[st] + "40",
                }}
              >
                {STATUS_LABELS[st]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
