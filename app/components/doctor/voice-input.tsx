"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Mic, MicOff, Loader2, AlertCircle, Check } from "lucide-react"

type ParsedDictation = {
  toothNumbers: number[]
  diagnosis: string | null
  procedures: string[]
  materials: string[]
  rawText: string
}

type Props = {
  /** Вызывается с распознанным текстом */
  onResult: (text: string, parsed: ParsedDictation) => void
  /** Лейбл кнопки */
  label?: string
  /** Дополнительные CSS-классы */
  className?: string
  /** Отключить кнопку */
  disabled?: boolean
}

type RecordingState = "idle" | "recording" | "processing" | "error" | "success"

export function VoiceInput({
  onResult,
  label = "Голосовой ввод",
  className = "",
  disabled = false,
}: Props) {
  const [state, setState] = useState<RecordingState>("idle")
  const [error, setError] = useState("")
  const [duration, setDuration] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Остановить запись при размонтировании
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop()
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
      }
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const startRecording = useCallback(async () => {
    try {
      setError("")
      setState("recording")
      setDuration(0)
      chunksRef.current = []

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 48000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      })
      streamRef.current = stream

      // Пробуем OGG/Opus (Chrome), fallback на WebM/Opus
      const mimeType = MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")
        ? "audio/ogg;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm"

      const recorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        // Остановить таймер
        if (timerRef.current) clearInterval(timerRef.current)

        // Остановить микрофон
        stream.getTracks().forEach((t) => t.stop())

        if (chunksRef.current.length === 0) {
          setState("error")
          setError("Нет записанных данных")
          return
        }

        setState("processing")

        const blob = new Blob(chunksRef.current, { type: mimeType })

        try {
          const res = await fetch("/api/speech-to-text", {
            method: "POST",
            headers: { "Content-Type": mimeType.split(";")[0] },
            body: blob,
          })

          const data = await res.json()

          if (!res.ok) {
            setState("error")
            setError(data.error || "Ошибка распознавания")
            return
          }

          setState("success")
          onResult(data.text, data.parsed)

          // Вернуться в idle через 2 сек
          setTimeout(() => setState("idle"), 2000)
        } catch {
          setState("error")
          setError("Ошибка соединения с сервером")
        }
      }

      recorder.start(250) // chunk каждые 250ms

      // Таймер длительности
      timerRef.current = setInterval(() => {
        setDuration((d) => {
          // Автостоп после 25 секунд (лимит SpeechKit 30 сек)
          if (d >= 25) {
            stopRecording()
            return d
          }
          return d + 1
        })
      }, 1000)
    } catch (err) {
      setState("error")
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        setError("Доступ к микрофону запрещён. Разрешите в настройках браузера.")
      } else {
        setError("Не удалось получить доступ к микрофону")
      }
    }
  }, [onResult])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop()
    }
  }, [])

  const formatDuration = (s: number) => {
    const mins = Math.floor(s / 60)
    const secs = s % 60
    return `${mins}:${String(secs).padStart(2, "0")}`
  }

  const isRecording = state === "recording"
  const isProcessing = state === "processing"

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Кнопка записи */}
      <button
        type="button"
        onClick={isRecording ? stopRecording : startRecording}
        disabled={disabled || isProcessing}
        className={`group relative flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition disabled:opacity-50 ${
          isRecording
            ? "bg-red-600 text-white shadow-lg shadow-red-600/25 hover:bg-red-700"
            : state === "success"
              ? "bg-green-600 text-white"
              : state === "error"
                ? "bg-red-50 text-red-700 border border-red-200"
                : "bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
        }`}
      >
        {isRecording ? (
          <>
            <MicOff className="h-4 w-4" />
            <span>Стоп ({formatDuration(duration)})</span>
            {/* Пульсирующий индикатор */}
            <span className="absolute -right-1 -top-1 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
            </span>
          </>
        ) : isProcessing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Распознавание...</span>
          </>
        ) : state === "success" ? (
          <>
            <Check className="h-4 w-4" />
            <span>Готово</span>
          </>
        ) : state === "error" ? (
          <>
            <AlertCircle className="h-4 w-4" />
            <span>Повторить</span>
          </>
        ) : (
          <>
            <Mic className="h-4 w-4" />
            <span>{label}</span>
          </>
        )}
      </button>

      {/* Ошибка */}
      {error && state === "error" && (
        <span className="text-xs text-red-600">{error}</span>
      )}

      {/* Подсказка */}
      {state === "idle" && (
        <span className="text-xs text-gray-400">
          Нажмите и диктуйте (до 25 сек)
        </span>
      )}
    </div>
  )
}
