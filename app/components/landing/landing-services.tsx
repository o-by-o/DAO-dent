"use client"

import { Sparkles, Scissors, Baby, SmilePlus, Syringe, ShieldCheck } from "lucide-react"
import type { LandingServiceTeaser } from "./landing-types"

const iconMap: Record<string, React.ElementType> = {
  tooth: ShieldCheck,
  sparkles: Sparkles,
  implant: Syringe,
  smile: SmilePlus,
  scissors: Scissors,
  baby: Baby,
}

export function LandingServices({ services }: { services: LandingServiceTeaser[] }) {
  return (
    <section id="services" className="bg-white py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="mb-4 inline-block rounded-full bg-blue-50 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-blue-600">
            Наши услуги
          </span>
          <h2 className="font-serif text-3xl font-semibold text-gray-900 md:text-4xl">
            Полный спектр стоматологических услуг
          </h2>
          <p className="mt-4 text-gray-600">
            От профилактики до сложной имплантации — всё в одной клинике у метро Семёновская
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => {
            const Icon = iconMap[service.icon] || ShieldCheck
            return (
              <div
                key={service.id}
                className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:border-blue-100 hover:shadow-md"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="mb-1 text-xs font-medium uppercase tracking-wider text-blue-600">
                  {service.category}
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900">{service.name}</h3>
                <p className="mb-4 text-sm leading-relaxed text-gray-500">{service.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-blue-600">{service.priceLabel}</span>
                  <a
                    href="#appointment"
                    className="text-sm font-medium text-blue-600 transition hover:text-blue-800"
                  >
                    Записаться &rarr;
                  </a>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400">
            * Точная стоимость определяется после консультации врача.
            Имеются противопоказания. Необходима консультация специалиста.
          </p>
        </div>
      </div>
    </section>
  )
}
