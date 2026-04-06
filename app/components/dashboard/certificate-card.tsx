"use client"

import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"
import { Download, Share2, Hourglass, Sparkles, ArrowRight } from "lucide-react"
import type { CertificateData } from "./certificate-preview-modal"

/* ------------------------------------------------------------------ */
/*  CertificateCard                                                    */
/* ------------------------------------------------------------------ */

interface CertificateCardProps {
  certificate: CertificateData
  /** Called when user clicks an earned certificate to open preview */
  onPreview?: () => void
}

export function CertificateCard({ certificate, onPreview }: CertificateCardProps) {
  const isEarned = certificate.status === "earned"

  /* ---- In-progress variant ---- */
  if (!isEarned) {
    return (
      <article className="flex flex-col overflow-hidden rounded-xl border-2 border-dashed border-border bg-card/60 transition-shadow hover:shadow-sm">
        {/* Dimmed header */}
        <div className="flex flex-col items-center gap-3 px-6 pt-8 pb-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Hourglass className="h-5 w-5 text-muted-foreground" />
          </div>
          <h3 className="text-base font-semibold text-card-foreground/70">
            {certificate.courseName}
          </h3>
          <p className="text-xs text-muted-foreground">
            Завершите курс, чтобы получить сертификат
          </p>
        </div>

        {/* Progress */}
        <div className="flex flex-col gap-2 px-6 py-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Прогресс</span>
            <span className="text-xs font-bold text-primary-foreground">
              {certificate.progress ?? 0}%
            </span>
          </div>
          <Progress
            value={certificate.progress ?? 0}
            className="h-2"
            indicatorClassName="bg-gradient-to-r from-primary to-primary/70"
          />
        </div>

        {/* Action */}
        <div className="border-t border-border px-6 py-4">
          <a
            href={certificate.courseHref || "/courses"}
            className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-muted text-sm font-medium text-card-foreground transition-colors hover:bg-muted/80"
          >
            Продолжить обучение
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </article>
    )
  }

  /* ---- Earned variant ---- */
  return (
    <article
      className="group flex cursor-pointer flex-col overflow-hidden rounded-xl border border-accent/40 bg-card transition-shadow hover:shadow-lg"
      onClick={onPreview}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onPreview?.()
      }}
      role="button"
      tabIndex={0}
      aria-label={`Просмотреть сертификат: ${certificate.courseName}`}
    >
      {/* Mini certificate preview */}
      <div className="px-5 pt-5">
        <div className="rounded-lg bg-gradient-to-br from-accent/10 via-accent/5 to-transparent p-[2px]">
          <div className="flex flex-col items-center gap-2 rounded-md border border-accent/20 bg-card px-4 py-6 text-center">
            {/* Mini header */}
            <p className="text-[10px] font-semibold tracking-[0.25em] text-accent">
              DIB ACADEMY
            </p>

            {/* Course name */}
            <p className="text-sm font-bold text-card-foreground leading-snug">
              {certificate.courseName}
            </p>

            {/* Student name */}
            <p className="text-xs italic text-muted-foreground">
              {certificate.studentName}
            </p>

            {/* Date */}
            <p className="text-[10px] text-muted-foreground">
              {certificate.issuedDate}
            </p>

            {/* Mini seal */}
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-accent/30">
              <Sparkles className="h-3 w-3 text-accent/40" />
            </div>
          </div>
        </div>
      </div>

      {/* Info below preview */}
      <div className="flex flex-1 flex-col gap-2 px-5 pt-4 pb-2">
        <h3 className="text-base font-semibold text-card-foreground group-hover:text-primary-foreground">
          {certificate.courseName}
        </h3>
        <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
          <span>Дата выдачи: {certificate.issuedDate}</span>
          <span>Номер: {certificate.certificateNumber}</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 border-t border-border px-5 py-3">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            /* Download logic */
          }}
          className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/80"
        >
          <Download className="h-3.5 w-3.5" />
          Скачать PDF
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            /* Share logic */
          }}
          className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-border bg-transparent px-3 text-xs font-medium text-card-foreground transition-colors hover:bg-muted"
        >
          <Share2 className="h-3.5 w-3.5" />
          Поделиться
        </button>
      </div>
    </article>
  )
}
