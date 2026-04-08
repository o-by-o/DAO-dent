"use client"

import { useEffect, useState } from "react"
import { Phone, Calendar } from "lucide-react"

export function StickyCTA() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      // Показываем после 600px прокрутки
      setVisible(window.scrollY > 600)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-blue-200/50 bg-white/95 px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] backdrop-blur-md md:hidden">
      <div className="flex gap-2">
        <a
          href="#appointment"
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/25"
        >
          <Calendar className="h-4 w-4" />
          Записаться
        </a>
        <a
          href="tel:+74950000000"
          className="flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-700"
          aria-label="Позвонить"
        >
          <Phone className="h-5 w-5" />
        </a>
      </div>
    </div>
  )
}
