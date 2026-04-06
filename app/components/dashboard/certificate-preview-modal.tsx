"use client"

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Download, Sparkles } from "lucide-react"

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface CertificateData {
  id: string
  courseName: string
  studentName: string
  issuedDate: string
  certificateNumber: string
  status: "earned" | "in-progress"
  /** 0-100 -- only relevant when status = "in-progress" */
  progress?: number
  /** Ссылка на курс */
  courseHref?: string
}

/* ------------------------------------------------------------------ */
/*  Certificate Preview Modal                                          */
/* ------------------------------------------------------------------ */

interface CertificatePreviewModalProps {
  certificate: CertificateData
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CertificatePreviewModal({
  certificate,
  open,
  onOpenChange,
}: CertificatePreviewModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto p-0">
        {/* Accessible title (visually hidden, screen-reader only) */}
        <DialogTitle className="sr-only">
          Сертификат: {certificate.courseName}
        </DialogTitle>

        {/* ----- Certificate design ----- */}
        <div className="p-6 sm:p-8">
          {/* Outer gold gradient border */}
          <div className="rounded-xl bg-gradient-to-br from-accent via-accent/60 to-accent/30 p-[3px]">
            {/* Inner white card */}
            <div className="flex flex-col items-center gap-6 rounded-[10px] bg-card px-6 py-10 text-center sm:px-12 sm:py-14">
              {/* Decorative top border line */}
              <div className="h-px w-24 bg-accent" />

              {/* Academy header */}
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                  <Sparkles className="h-5 w-5 text-primary-foreground" />
                </div>
                <p className="text-xs font-semibold tracking-[0.3em] text-accent">
                  DIB-INTERFARM ACADEMY
                </p>
              </div>

              {/* Certificate title */}
              <h2 className="text-2xl font-bold tracking-wide text-secondary sm:text-3xl">
                {"СЕРТИФИКАТ"}
              </h2>

              {/* Confirmation text */}
              <p className="text-sm text-muted-foreground">
                Настоящим подтверждается, что
              </p>

              {/* Student name -- elegant serif-style */}
              <p className="text-2xl font-semibold italic text-card-foreground sm:text-3xl">
                {certificate.studentName}
              </p>

              {/* Completion text */}
              <p className="text-sm text-muted-foreground">
                успешно завершила курс
              </p>

              {/* Course name */}
              <p className="text-lg font-bold text-card-foreground sm:text-xl">
                {certificate.courseName}
              </p>

              {/* Decorative divider */}
              <div className="flex items-center gap-3">
                <div className="h-px w-12 bg-border" />
                <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                <div className="h-px w-12 bg-border" />
              </div>

              {/* Date & number */}
              <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                <span>Дата выдачи: {certificate.issuedDate}</span>
                <span>Номер: {certificate.certificateNumber}</span>
              </div>

              {/* Signature */}
              <div className="mt-4 flex flex-col items-center gap-1">
                <div className="h-px w-36 bg-border" />
                <p className="text-xs text-muted-foreground">
                  Айхаана Данилова, основатель
                </p>
              </div>

              {/* Seal placeholder */}
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-accent/40">
                <Sparkles className="h-6 w-6 text-accent/50" />
              </div>

              {/* Decorative bottom border line */}
              <div className="h-px w-24 bg-accent" />
            </div>
          </div>
        </div>

        {/* ----- Footer actions ----- */}
        <DialogFooter className="border-t border-border px-6 py-4 sm:px-8">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-card px-5 text-sm font-medium text-card-foreground transition-colors hover:bg-muted"
          >
            Закрыть
          </button>
          <button
            type="button"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
          >
            <Download className="h-4 w-4" />
            Скачать PDF
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
