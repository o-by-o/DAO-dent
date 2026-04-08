"use client"

/**
 * Дисклеймер по ФЗ-38 «О рекламе» (ст. 24)
 * Обязателен на всех рекламных страницах медицинских услуг.
 */

type Props = {
  variant?: "inline" | "footer" | "banner"
  className?: string
}

export function MedicalDisclaimer({ variant = "inline", className = "" }: Props) {
  const text =
    "Имеются противопоказания. Необходима консультация специалиста. Не является публичной офертой."

  if (variant === "banner") {
    return (
      <div className={`bg-gray-100 py-2 text-center text-[11px] text-gray-500 ${className}`}>
        {text} Лицензия на осуществление медицинской деятельности.
      </div>
    )
  }

  if (variant === "footer") {
    return (
      <div className={`border-t border-gray-200 py-4 text-center text-[11px] text-gray-400 ${className}`}>
        <p>{text}</p>
        <p className="mt-1">
          &copy; {new Date().getFullYear()} ДаоДент. Лицензия на осуществление медицинской деятельности.
        </p>
      </div>
    )
  }

  return (
    <p className={`text-[11px] text-gray-400 ${className}`}>
      * {text}
    </p>
  )
}
