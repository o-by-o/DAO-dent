"use client"

import React from "react"

import { useState, useCallback } from "react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Mail,
  Send as SendIcon,
  Upload,
  Clock,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react"

/* ------------------------------------------------------------------ */
/*  Feedback Form                                                      */
/* ------------------------------------------------------------------ */

export function ContactForm() {
  const [fileName, setFileName] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) setFileName(file.name)
    },
    [],
  )

  const handleSubmit = useCallback(() => {
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 3000)
  }, [])

  return (
    <div className="space-y-6">
      {/* Feedback card */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="mb-5 flex items-center gap-2">
          <Mail className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-card-foreground">
            Обратная связь
          </h2>
        </div>

        <div className="space-y-4">
          {/* Topic select */}
          <div className="space-y-1.5">
            <Label>Тема</Label>
            <Select defaultValue="tech">
              <SelectTrigger>
                <SelectValue placeholder="Выберите тему..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tech">Техническая проблема</SelectItem>
                <SelectItem value="course">Вопрос по курсу</SelectItem>
                <SelectItem value="payment">Оплата</SelectItem>
                <SelectItem value="suggestion">Предложение</SelectItem>
                <SelectItem value="other">Другое</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Message textarea */}
          <div className="space-y-1.5">
            <Label htmlFor="supportMsg">Сообщение</Label>
            <Textarea
              id="supportMsg"
              rows={4}
              placeholder="Опишите вашу проблему или вопрос..."
            />
          </div>

          {/* File upload */}
          <div className="space-y-1.5">
            <Label>Прикрепить файл</Label>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border bg-background px-4 py-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:bg-muted/50">
              <Upload className="h-4 w-4" />
              <span>{fileName ?? "Выберите файл или перетащите сюда"}</span>
              <input
                type="file"
                className="sr-only"
                onChange={handleFileChange}
                accept="image/*,.pdf,.doc,.docx"
              />
            </label>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitted}
              className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/80 disabled:opacity-60"
            >
              {submitted ? (
                <>
                  <Check className="h-4 w-4" />
                  Отправлено
                </>
              ) : (
                <>
                  <SendIcon className="h-4 w-4" />
                  Отправить
                </>
              )}
            </button>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              Среднее время ответа: 2 часа
            </div>
          </div>
        </div>
      </div>

      {/* Contacts card */}
      <ContactsCard />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Contacts Card                                                      */
/* ------------------------------------------------------------------ */

function ContactsCard() {
  const [copied, setCopied] = useState(false)

  const copyEmail = useCallback(() => {
    navigator.clipboard.writeText("support@dib-academy.ru")
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [])

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h2 className="mb-5 text-lg font-semibold text-card-foreground">
        Контакты
      </h2>

      <div className="space-y-4">
        {/* Email */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15">
              <Mail className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="text-sm font-medium text-card-foreground">
                support@dib-academy.ru
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={copyEmail}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Копировать email"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Telegram */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
              <SendIcon className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Telegram</p>
              <p className="text-sm font-medium text-card-foreground">
                @dib_support
              </p>
            </div>
          </div>
          <a
            href="https://t.me/dib_support"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Открыть Telegram"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>

        {/* WhatsApp */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100">
              <SendIcon className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">WhatsApp</p>
              <p className="text-sm font-medium text-card-foreground">
                +7 (999) 000-00-00
              </p>
            </div>
          </div>
          <a
            href="https://wa.me/79990000000"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Открыть WhatsApp"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>

        {/* Working hours */}
        <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-4 py-3">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-card-foreground">Время работы:</span>{" "}
            {"Пн-Пт, 10:00 — 19:00 МСК"}
          </p>
        </div>
      </div>
    </div>
  )
}
