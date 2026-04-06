"use client"

import Link from "next/link"
import { BrandLogo } from "@/components/brand-logo"

export type SiteFooterProps = {
  footerPhone: string
  footerPhone2: string
  footerAddress: string
  footerEmail: string
  shopHref: string
  catalogHref: string
  diagnosticsHref: string
}

const social = [
  { label: "Telegram", href: "https://t.me/dib_interfarm" },
  { label: "VK", href: "https://vk.com" },
]

export function SiteFooter({
  footerPhone,
  footerPhone2,
  footerAddress,
  footerEmail,
  shopHref,
  catalogHref,
  diagnosticsHref,
}: SiteFooterProps) {
  return (
    <footer className="relative overflow-hidden bg-card pb-10 pt-20">
      <div className="pointer-events-none absolute bottom-0 left-1/2 z-0 -translate-x-1/2 select-none">
        <span className="whitespace-nowrap font-serif text-[72px] font-bold leading-none text-white/25 sm:text-[120px] md:text-[200px] lg:text-[260px]">
          DIB-INTERFARM
        </span>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mb-16 grid grid-cols-2 gap-10 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-block">
              <BrandLogo showTagline className="h-8 w-auto max-w-[200px] opacity-90" />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Профессиональная косметика, курсы для косметологов и AI-диагностика лица. Ваш партнёр в
              красоте.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {social.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-border/60 bg-background px-4 py-2 text-xs font-medium text-foreground/70 boty-transition boty-shadow hover:text-foreground"
                >
                  {s.label}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-4 font-medium text-foreground">Разделы</h3>
            <ul className="space-y-3">
              <li>
                <Link href={shopHref} className="text-sm text-muted-foreground boty-transition hover:text-foreground">
                  Магазин
                </Link>
              </li>
              <li>
                <Link
                  href={catalogHref}
                  className="text-sm text-muted-foreground boty-transition hover:text-foreground"
                >
                  Курсы
                </Link>
              </li>
              <li>
                <Link
                  href={diagnosticsHref}
                  className="text-sm text-muted-foreground boty-transition hover:text-foreground"
                >
                  Диагностика
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-sm text-muted-foreground boty-transition hover:text-foreground">
                  Вход
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-medium text-foreground">Поддержка</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/support" className="text-sm text-muted-foreground boty-transition hover:text-foreground">
                  Поддержка
                </Link>
              </li>
              <li>
                <Link
                  href="/settings"
                  className="text-sm text-muted-foreground boty-transition hover:text-foreground"
                >
                  Настройки
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-medium text-foreground">Контакты</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="leading-relaxed">{footerAddress}</p>
              <a
                href={`tel:${footerPhone.replace(/\s/g, "")}`}
                className="block boty-transition hover:text-foreground"
              >
                {footerPhone}
              </a>
              <a
                href={`tel:${footerPhone2.replace(/\s/g, "")}`}
                className="block boty-transition hover:text-foreground"
              >
                {footerPhone2}
              </a>
              <a href={`mailto:${footerEmail}`} className="block boty-transition hover:text-foreground">
                {footerEmail}
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-border/50 pt-10">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} DIB-INTERFARM. Все права защищены.
            </p>
            <div className="flex gap-6">
              <span className="text-sm text-muted-foreground/80">DIB Academy</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
