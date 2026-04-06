"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X, ShoppingBag, Search, User } from "lucide-react"
import { BrandLogo } from "@/components/brand-logo"

export type SiteHeaderProps = {
  shopHref: string
  catalogHref: string
  diagnosticsHref: string
  cabinetHref: string
  isLoggedIn: boolean
}

export function SiteHeader({
  shopHref,
  catalogHref,
  diagnosticsHref,
  cabinetHref,
  isLoggedIn,
}: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  const linkClass =
    "text-sm tracking-wide text-foreground/70 hover:text-foreground boty-transition"

  return (
    <header className="fixed left-0 right-0 top-0 z-50 px-4 pt-4">
      <nav
        className="animate-scale-fade-in mx-auto max-w-7xl rounded-lg border border-[rgba(255,255,255,0.32)] bg-[rgba(255,255,255,0.4)] px-6 py-0 backdrop-blur-md lg:px-8"
        style={{ boxShadow: "rgba(0, 0, 0, 0.1) 0px 10px 50px" }}
      >
        <div className="flex h-[72px] items-center justify-between text-foreground md:h-[80px]">
          <button
            type="button"
            className="p-2 text-foreground/80 hover:text-foreground lg:hidden boty-transition"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <div className="hidden items-center gap-8 lg:flex">
            <Link href={shopHref} className={linkClass}>
              Магазин
            </Link>
            <Link href={catalogHref} className={linkClass}>
              Курсы
            </Link>
            <Link href={diagnosticsHref} className={linkClass}>
              Диагностика
            </Link>
          </div>

          <Link
            href="/"
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-foreground"
            aria-label="На главную"
          >
            <BrandLogo showTagline className="h-14 w-auto sm:h-16 md:h-[4.5rem]" />
          </Link>

          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/shop"
              className="hidden p-2 text-foreground/70 hover:text-foreground sm:block boty-transition"
              aria-label="Поиск в каталоге"
            >
              <Search className="h-5 w-5" />
            </Link>
            <Link
              href={cabinetHref}
              className="hidden p-2 text-foreground/70 hover:text-foreground sm:block boty-transition"
              aria-label={isLoggedIn ? "Личный кабинет" : "Войти"}
            >
              <User className="h-5 w-5" />
            </Link>
            <Link
              href={shopHref}
              className="relative p-2 text-foreground/70 hover:text-foreground boty-transition"
              aria-label="Магазин"
            >
              <ShoppingBag className="h-5 w-5" />
            </Link>
          </div>
        </div>

        <div
          className={`overflow-hidden boty-transition lg:hidden ${
            menuOpen ? "max-h-72 pb-6" : "max-h-0"
          }`}
        >
          <div className="flex flex-col gap-4 border-t border-border/50 pt-4">
            <Link href={shopHref} className={linkClass} onClick={() => setMenuOpen(false)}>
              Магазин
            </Link>
            <Link href={catalogHref} className={linkClass} onClick={() => setMenuOpen(false)}>
              Курсы
            </Link>
            <Link href={diagnosticsHref} className={linkClass} onClick={() => setMenuOpen(false)}>
              Диагностика
            </Link>
            <Link href={cabinetHref} className={linkClass} onClick={() => setMenuOpen(false)}>
              {isLoggedIn ? "Личный кабинет" : "Войти"}
            </Link>
          </div>
        </div>
      </nav>
    </header>
  )
}
