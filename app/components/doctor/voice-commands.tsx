"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Mic, MicOff, Volume2 } from "lucide-react"

/**
 * Голосовые команды через Web Speech API (бесплатно, встроен в Chrome).
 * Слушает непрерывно, распознаёт ключевые фразы и вызывает callback.
 *
 * Поддерживаемые команды:
 * - "начать приём" / "начать запись" → onCommand("start_appointment")
 * - "закрыть приём" / "завершить приём" → onCommand("complete_appointment")
 * - "стоп" / "закончить" → onCommand("stop_recording")
 * - "начать запись" / "диктовать" → onCommand("start_dictation")
 * - "следующий визит" / "записать визит" → onCommand("next_visit")
 * - "сохранить" → onCommand("save")
 * - "добавить диагноз ..." → onCommand("add_diagnosis", payload)
 * - "назначить визит через ..." → onCommand("schedule_visit", payload)
 */

export type VoiceCommand =
  | "start_appointment"
  | "complete_appointment"
  | "stop_recording"
  | "start_dictation"
  | "next_visit"
  | "save"
  | "add_diagnosis"
  | "schedule_visit"
  | "unknown"

type Props = {
  /** Вызывается при распознании команды */
  onCommand: (command: VoiceCommand, payload?: string) => void
  /** Включить/выключить слушание */
  enabled?: boolean
}

// Паттерны команд
const COMMAND_PATTERNS: { patterns: RegExp[]; command: VoiceCommand }[] = [
  {
    command: "start_appointment",
    patterns: [
      /начать\s+при[её]м/i,
      /начинаем\s+при[её]м/i,
      /открыть\s+при[её]м/i,
    ],
  },
  {
    command: "complete_appointment",
    patterns: [
      /закрыть\s+при[её]м/i,
      /завершить\s+при[её]м/i,
      /закончить\s+при[её]м/i,
      /при[её]м\s+завершен/i,
    ],
  },
  {
    command: "start_dictation",
    patterns: [
      /начать\s+запись/i,
      /начинаю\s+диктовать/i,
      /диктовать/i,
      /голосовой\s+ввод/i,
    ],
  },
  {
    command: "stop_recording",
    patterns: [
      /стоп/i,
      /остановить/i,
      /закончить\s+запись/i,
      /хватит/i,
    ],
  },
  {
    command: "next_visit",
    patterns: [
      /следующий\s+визит/i,
      /записать\s+визит/i,
      /назначить\s+визит/i,
      /назначить\s+следующий/i,
    ],
  },
  {
    command: "save",
    patterns: [
      /сохранить/i,
      /сохрани/i,
    ],
  },
  {
    command: "add_diagnosis",
    patterns: [
      /добавить\s+диагноз\s+(.*)/i,
      /диагноз\s+(.*)/i,
    ],
  },
  {
    command: "schedule_visit",
    patterns: [
      /назначить\s+(?:следующий\s+)?визит\s+через\s+(.*)/i,
      /записать\s+через\s+(.*)/i,
    ],
  },
]

function matchCommand(text: string): { command: VoiceCommand; payload?: string } | null {
  const lower = text.toLowerCase().trim()

  for (const { patterns, command } of COMMAND_PATTERNS) {
    for (const pattern of patterns) {
      const match = lower.match(pattern)
      if (match) {
        return {
          command,
          payload: match[1]?.trim() || undefined,
        }
      }
    }
  }

  return null
}

export function VoiceCommands({ onCommand, enabled = true }: Props) {
  const [listening, setListening] = useState(false)
  const [supported, setSupported] = useState(true)
  const [lastCommand, setLastCommand] = useState<string | null>(null)
  const [interimText, setInterimText] = useState("")
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const startListening = useCallback(() => {
    if (!supported || !enabled) return

    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: typeof window.SpeechRecognition }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: typeof window.SpeechRecognition }).webkitSpeechRecognition

    if (!SpeechRecognition) {
      setSupported(false)
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = "ru-RU"
    recognition.continuous = true
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setListening(true)
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = ""
      let final = ""

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          final += transcript
        } else {
          interim += transcript
        }
      }

      setInterimText(interim)

      if (final) {
        const result = matchCommand(final)
        if (result) {
          setLastCommand(final.trim())
          onCommand(result.command, result.payload)

          // Показать команду на 3 секунды
          setTimeout(() => setLastCommand(null), 3000)
        }
      }
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      // "no-speech" и "aborted" — нормальные ситуации, перезапускаем
      if (event.error === "no-speech" || event.error === "aborted") {
        // Тихо перезапустим
        return
      }
      console.error("[VoiceCommands] error:", event.error)
      if (event.error === "not-allowed") {
        setSupported(false)
      }
    }

    recognition.onend = () => {
      setListening(false)
      setInterimText("")

      // Авто-перезапуск если enabled
      if (enabled) {
        restartTimerRef.current = setTimeout(() => {
          startListening()
        }, 500)
      }
    }

    recognitionRef.current = recognition

    try {
      recognition.start()
    } catch {
      // Уже запущен — игнорируем
    }
  }, [supported, enabled, onCommand])

  const stopListening = useCallback(() => {
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current)
      restartTimerRef.current = null
    }
    if (recognitionRef.current) {
      recognitionRef.current.onend = null // Предотвращаем авто-рестарт
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setListening(false)
    setInterimText("")
  }, [])

  // Запуск/остановка при изменении enabled
  useEffect(() => {
    if (enabled) {
      startListening()
    } else {
      stopListening()
    }

    return () => {
      stopListening()
    }
  }, [enabled, startListening, stopListening])

  // Проверка поддержки при монтировании
  useEffect(() => {
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: typeof window.SpeechRecognition }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: typeof window.SpeechRecognition }).webkitSpeechRecognition

    if (!SpeechRecognition) {
      setSupported(false)
    }
  }, [])

  if (!supported) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-xs text-gray-500">
        <MicOff className="h-3.5 w-3.5" />
        <span>Голосовые команды не поддерживаются в этом браузере</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      {/* Индикатор статуса */}
      <div
        className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition ${
          listening
            ? "bg-green-50 text-green-700 border border-green-200"
            : "bg-gray-100 text-gray-500"
        }`}
      >
        {listening ? (
          <>
            <Volume2 className="h-3.5 w-3.5 animate-pulse" />
            <span>Слушаю команды</span>
          </>
        ) : (
          <>
            <MicOff className="h-3.5 w-3.5" />
            <span>Микрофон выкл</span>
          </>
        )}
      </div>

      {/* Промежуточный текст */}
      {interimText && (
        <span className="max-w-xs truncate text-xs text-gray-400 italic">
          {interimText}
        </span>
      )}

      {/* Последняя команда */}
      {lastCommand && (
        <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700 animate-pulse">
          &laquo;{lastCommand}&raquo;
        </span>
      )}

      {/* Подсказки */}
      <div className="hidden lg:flex items-center gap-1.5">
        {["Начать приём", "Диктовать", "Стоп", "Сохранить"].map((cmd) => (
          <span
            key={cmd}
            className="rounded bg-gray-50 px-1.5 py-0.5 text-[10px] text-gray-400 border border-gray-100"
          >
            {cmd}
          </span>
        ))}
      </div>
    </div>
  )
}
