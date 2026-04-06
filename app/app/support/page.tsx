"use client"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { FAQAccordion } from "@/components/dashboard/faq-accordion"
import { ContactForm } from "@/components/dashboard/contact-form"
import { ChatWidget } from "@/components/dashboard/chat-widget"
import { HelpCircle } from "lucide-react"

export default function SupportPage() {
  return (
    <DashboardLayout activePath="/support">
      {/* Page header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
          <HelpCircle className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">
            Ответы на вопросы, обратная связь и контакты
          </p>
        </div>
      </div>

      {/* Two-column layout on desktop: FAQ left, contacts right */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* FAQ -- wider column */}
        <div className="lg:col-span-3">
          <FAQAccordion />
        </div>

        {/* Contact form + contacts */}
        <div className="lg:col-span-2">
          <ContactForm />
        </div>
      </div>

      {/* Floating chat widget */}
      <ChatWidget />
    </DashboardLayout>
  )
}
