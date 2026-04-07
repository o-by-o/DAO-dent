"use client"

import { useEffect, useState } from "react"
import { X, Gift } from "lucide-react"

export function ExitIntentPopup() {
  const [show, setShow] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Не показываем если уже закрыли
    if (typeof window !== "undefined" && sessionStorage.getItem("exit-popup-dismissed")) {
      setDismissed(true)
      return
    }

    const handleMouseLeave = (e: MouseEvent) => {
      // Курсор уходит вверх — намерение уйти
      if (e.clientY <= 5 && !dismissed) {
        setShow(true)
      }
    }

    document.addEventListener("mouseleave", handleMouseLeave)
    return () => document.removeEventListener("mouseleave", handleMouseLeave)
  }, [dismissed])

  function close() {
    setShow(false)
    setDismissed(true)
    sessionStorage.setItem("exit-popup-dismissed", "1")
  }

  if (!show || dismissed) return null

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm" onClick={close} />
      <div className="fixed left-1/2 top-1/2 z-[60] w-full max-w-md -translate-x-1/2 -translate-y-1/2 animate-scale-fade-in rounded-2xl bg-white p-8 shadow-2xl">
        <button
          onClick={close}
          className="absolute right-4 top-4 rounded-lg p-1 text-gray-400 transition hover:bg-gray-100"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/25">
            <Gift className="h-8 w-8 text-white" />
          </div>

          <h2 className="font-serif text-2xl font-semibold text-gray-900">
            Подождите!
          </h2>
          <p className="mt-2 text-gray-600">
            Специальное предложение для первого визита:
          </p>

          <div className="mt-4 rounded-xl bg-blue-50 p-4">
            <p className="text-xl font-bold text-blue-700">
              Бесплатная консультация + скидка 20% на гигиену
            </p>
            <p className="mt-1 text-sm text-blue-500">
              Только для новых пациентов
            </p>
          </div>

          <a
            href="#appointment"
            onClick={close}
            className="mt-6 block rounded-xl bg-blue-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700"
          >
            Записаться со скидкой
          </a>

          <button
            onClick={close}
            className="mt-3 block w-full py-2 text-sm text-gray-400 transition hover:text-gray-600"
          >
            Нет, спасибо
          </button>
        </div>
      </div>
    </>
  )
}
