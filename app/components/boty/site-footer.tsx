"use client"

import Link from "next/link"
import { BrandLogo } from "@/components/brand-logo"
import {
  clinicSocial,
  clinicWorkingHours,
} from "@/lib/dib-interfarm-content"

export type SiteFooterProps = {
  footerPhone: string
  footerPhoneSecondary: string
  footerAddress: string
  footerEmail: string
}

export function SiteFooter({
  footerPhone,
  footerPhoneSecondary,
  footerAddress,
  footerEmail,
}: SiteFooterProps) {
  return (
    <footer className="relative overflow-hidden bg-gray-900 pb-10 pt-20 text-gray-300">
      <div className="pointer-events-none absolute bottom-0 left-1/2 z-0 -translate-x-1/2 select-none">
        <span className="whitespace-nowrap font-serif text-[72px] font-bold leading-none text-white/[0.03] sm:text-[120px] md:text-[200px]">
          ДаоДент
        </span>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mb-16 grid grid-cols-2 gap-10 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-block">
              <BrandLogo showTagline useCurrentColor className="h-10 w-auto text-white" />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-gray-400">
              Семейная стоматология у метро Семёновская. Безболезненное лечение для
              всей семьи с применением современных технологий.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {clinicSocial.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-gray-700 bg-gray-800 px-4 py-2 text-xs font-medium text-gray-300 transition hover:border-blue-500 hover:text-white"
                >
                  {s.label}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-4 font-medium text-white">Разделы</h3>
            <ul className="space-y-3">
              <li><a href="#services" className="text-sm text-gray-400 transition hover:text-white">Услуги</a></li>
              <li><a href="#doctors" className="text-sm text-gray-400 transition hover:text-white">Врачи</a></li>
              <li><a href="#reviews" className="text-sm text-gray-400 transition hover:text-white">Отзывы</a></li>
              <li><a href="#appointment" className="text-sm text-gray-400 transition hover:text-white">Запись</a></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-medium text-white">Режим работы</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>{clinicWorkingHours.weekdays}</li>
              <li>{clinicWorkingHours.saturday}</li>
              <li>{clinicWorkingHours.sunday}</li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-medium text-white">Контакты</h3>
            <div className="space-y-2 text-sm text-gray-400">
              <p className="leading-relaxed">{footerAddress}</p>
              <a
                href={`tel:${footerPhone.replace(/\s/g, "")}`}
                className="block transition hover:text-white"
              >
                {footerPhone}
              </a>
              <a
                href={`tel:${footerPhoneSecondary.replace(/\s/g, "")}`}
                className="block transition hover:text-white"
              >
                {footerPhoneSecondary}
              </a>
              <a href={`mailto:${footerEmail}`} className="block transition hover:text-white">
                {footerEmail}
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-10">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} ДаоДент. Все права защищены.
            </p>
            <p className="text-xs text-gray-600">
              Имеются противопоказания. Необходима консультация специалиста.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
