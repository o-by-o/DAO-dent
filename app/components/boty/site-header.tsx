"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X, Phone, User } from "lucide-react"
import { BrandLogo } from "@/components/brand-logo"

export type SiteHeaderProps = {
  isLoggedIn: boolean
}

export function SiteHeader({ isLoggedIn }: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  const linkClass =
    "text-sm tracking-wide text-gray-600 hover:text-blue-600 transition"

  return (
    <header className="fixed left-0 right-0 top-0 z-50 px-4 pt-4">
      <nav
        className="animate-scale-fade-in mx-auto max-w-7xl rounded-2xl border border-white/40 bg-white/80 px-6 py-0 backdrop-blur-xl"
        style={{ boxShadow: "rgba(0, 0, 0, 0.06) 0px 4px 30px" }}
      >
        <div className="flex h-[72px] items-center justify-between">
          <button
            type="button"
            className="p-2 text-gray-600 hover:text-gray-900 lg:hidden transition"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <div className="hidden items-center gap-8 lg:flex">
            <a href="#services" className={linkClass}>Услуги</a>
            <a href="#doctors" className={linkClass}>Врачи</a>
            <a href="#reviews" className={linkClass}>Отзывы</a>
            <a href="#contacts" className={linkClass}>Контакты</a>
          </div>

          <Link
            href="/"
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            aria-label="ДаоДент — на главную"
          >
            <BrandLogo showTagline={false} className="h-12 w-auto" />
          </Link>

          <div className="flex items-center gap-3">
            <a
              href="tel:+74950000000"
              className="hidden items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100 sm:flex"
            >
              <Phone className="h-4 w-4" />
              +7 (495) 000-00-00
            </a>
            <a
              href="#appointment"
              className="hidden rounded-full bg-blue-600 px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 md:block"
            >
              Записаться
            </a>
            {isLoggedIn && (
              <Link
                href="/home"
                className="p-2 text-gray-500 hover:text-blue-600 transition"
                aria-label="Личный кабинет"
              >
                <User className="h-5 w-5" />
              </Link>
            )}
          </div>
        </div>

        <div
          className={`overflow-hidden transition-all lg:hidden ${
            menuOpen ? "max-h-72 pb-6" : "max-h-0"
          }`}
        >
          <div className="flex flex-col gap-4 border-t border-gray-100 pt-4">
            <a href="#services" className={linkClass} onClick={() => setMenuOpen(false)}>Услуги</a>
            <a href="#doctors" className={linkClass} onClick={() => setMenuOpen(false)}>Врачи</a>
            <a href="#reviews" className={linkClass} onClick={() => setMenuOpen(false)}>Отзывы</a>
            <a href="#contacts" className={linkClass} onClick={() => setMenuOpen(false)}>Контакты</a>
            <a
              href="#appointment"
              className="rounded-full bg-blue-600 px-5 py-2.5 text-center text-sm font-medium text-white"
              onClick={() => setMenuOpen(false)}
            >
              Записаться на приём
            </a>
          </div>
        </div>
      </nav>
    </header>
  )
}
