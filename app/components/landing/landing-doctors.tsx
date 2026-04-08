"use client"

import { UserCircle } from "lucide-react"
import type { LandingDoctorTeaser } from "./landing-types"

export function LandingDoctors({ doctors }: { doctors: LandingDoctorTeaser[] }) {
  return (
    <section id="doctors" className="bg-gray-50 py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="mb-4 inline-block rounded-full bg-blue-50 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-blue-600">
            Наши врачи
          </span>
          <h2 className="font-serif text-3xl font-semibold text-gray-900 md:text-4xl">
            Опытные специалисты
          </h2>
          <p className="mt-4 text-gray-600">
            Каждый врач — профессионал с многолетним стажем и постоянным повышением квалификации
          </p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {doctors.map((doctor) => (
            <div
              key={doctor.id}
              className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:shadow-md"
            >
              <div className="flex h-48 items-center justify-center bg-gradient-to-br from-blue-50 to-sky-50">
                {doctor.avatarUrl ? (
                  <img
                    src={doctor.avatarUrl}
                    alt={doctor.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <UserCircle className="h-24 w-24 text-blue-200" />
                )}
              </div>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900">{doctor.name}</h3>
                <p className="mt-1 text-sm font-medium text-blue-600">{doctor.specialization}</p>
                <p className="mt-1 text-xs text-gray-400">Стаж: {doctor.experience}</p>
                <p className="mt-3 text-sm leading-relaxed text-gray-500">{doctor.description}</p>
                <a
                  href="#appointment"
                  className="mt-4 inline-flex items-center text-sm font-medium text-blue-600 transition hover:text-blue-800"
                >
                  Записаться к врачу &rarr;
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
