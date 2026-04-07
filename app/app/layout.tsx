import React from "react"
import type { Metadata, Viewport } from "next"
import { Analytics } from "@vercel/analytics/next"
import { DM_Sans, Playfair_Display } from "next/font/google"
import { Providers } from "./providers"
import "./globals.css"
import { cn } from "@/lib/utils"

const dmSans = DM_Sans({
  subsets: ["latin", "latin-ext", "cyrillic"],
  variable: "--font-dm-sans",
  weight: ["300", "400", "500", "600"],
})

const playfair = Playfair_Display({
  subsets: ["latin", "cyrillic"],
  variable: "--font-playfair",
  weight: ["400", "500", "600", "700"],
  display: "swap",
})

export const metadata: Metadata = {
  title: "ДаоДент — Семейная стоматология у м. Семёновская",
  description:
    "Стоматологическая клиника ДаоДент у метро Семёновская. Лечение зубов, имплантация, ортодонтия, детская стоматология. 5 минут пешком от метро. Запись онлайн.",
  keywords: [
    "стоматология семёновская",
    "зубной врач семёновская",
    "стоматологическая клиника соколиная гора",
    "лечение зубов измайлово",
    "имплантация зубов семёновская",
    "детский стоматолог семёновская",
  ],
}

export const viewport: Viewport = {
  themeColor: "#2563EB",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru" className={cn("font-sans", dmSans.variable, playfair.variable)}>
      <body className="font-sans antialiased">
        <Providers>
          {children}
          <Analytics />
        </Providers>
      </body>
    </html>
  )
}
