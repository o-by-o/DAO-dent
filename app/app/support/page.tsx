"use client"

import { FAQAccordion } from "@/components/dashboard/faq-accordion"
import { ContactForm } from "@/components/dashboard/contact-form"
import { HelpCircle } from "lucide-react"

export default function SupportPage() {
  return (
    <>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
          <HelpCircle className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <p className="text-sm text-gray-500">
            Ответы на вопросы и обратная связь
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <FAQAccordion />
        </div>
        <div className="lg:col-span-2">
          <ContactForm />
        </div>
      </div>
    </>
  )
}
