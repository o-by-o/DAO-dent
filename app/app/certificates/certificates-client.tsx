"use client"

import { useMemo, useState } from "react"
import type { Session } from "next-auth"
import { Award } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { CertificateCard } from "@/components/dashboard/certificate-card"
import {
  CertificatePreviewModal,
  type CertificateData,
} from "@/components/dashboard/certificate-preview-modal"

interface CertificatesClientProps {
  certificates: Array<
    CertificateData & {
      courseHref: string
      studentName: string
    }
  >
  session: Session | null
}

export function CertificatesClient({ certificates, session }: CertificatesClientProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selectedCertificate = useMemo(
    () => certificates.find((certificate) => certificate.id === selectedId) ?? null,
    [certificates, selectedId],
  )

  return (
    <DashboardLayout activePath="/certificates" session={session}>
      <div className="space-y-6">
        <div>
          <p className="text-sm text-muted-foreground">
            Здесь отображаются ваши сертификаты после завершения курсов.
          </p>
        </div>

        {certificates.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card py-14">
            <Award className="h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              Пока нет доступных сертификатов.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {certificates.map((certificate) => (
              <CertificateCard
                key={certificate.id}
                certificate={certificate}
                onPreview={
                  certificate.status === "earned"
                    ? () => setSelectedId(certificate.id)
                    : undefined
                }
              />
            ))}
          </div>
        )}
      </div>

      {selectedCertificate && (
        <CertificatePreviewModal
          certificate={selectedCertificate}
          open={!!selectedCertificate}
          onOpenChange={(open) => {
            if (!open) setSelectedId(null)
          }}
        />
      )}
    </DashboardLayout>
  )
}
