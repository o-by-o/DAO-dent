import React from "react"
import type { Metadata, Viewport } from "next"
import { Providers } from "./providers"
import "./globals.css"

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
    <html lang="ru">
      <head>
        {/* Подключаем шрифты через link — не блокирует билд без сети */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Playfair+Display:wght@400;500;600;700&display=swap&subset=cyrillic"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
