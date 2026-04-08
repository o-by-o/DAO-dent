import { cn } from "@/lib/utils"

interface BrandLogoProps {
  className?: string
  variant?: "full" | "icon" | "collapsed"
  showTagline?: boolean
  withBackground?: boolean
  useCurrentColor?: boolean
}

export function BrandLogo({
  className,
  variant = "full",
  showTagline = true,
  useCurrentColor = false,
}: BrandLogoProps) {
  const accentColor = useCurrentColor ? "currentColor" : "#2563EB"
  const titleColor = useCurrentColor ? "currentColor" : "#1a1a1a"
  const subtitleColor = useCurrentColor ? "currentColor" : "#3f3b36"
  const subtitleOpacity = useCurrentColor ? 0.95 : 1
  const serifStack =
    'var(--font-serif), "Playfair Display", ui-serif, Georgia, serif'

  if (variant === "collapsed") {
    return (
      <svg
        viewBox="0 0 60 60"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="ДаоДент"
        className={cn("block max-h-full max-w-full", className)}
      >
        {/* Стилизованный зуб */}
        <path
          d="M30 8 C20 8 12 16 12 26 C12 36 18 42 22 50 C24 54 26 56 28 56 C29 56 30 54 30 52 C30 54 31 56 32 56 C34 56 36 54 38 50 C42 42 48 36 48 26 C48 16 40 8 30 8Z"
          fill="none"
          stroke={accentColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Инь-ян */}
        <circle cx="30" cy="26" r="6" fill="none" stroke={accentColor} strokeWidth="1.5" />
        <path
          d="M30 20 C27 20 24 23 27 26 C30 29 30 32 30 32 C30 32 30 29 33 26 C36 23 33 20 30 20Z"
          fill={accentColor}
          opacity="0.3"
        />
      </svg>
    )
  }

  if (variant === "icon") {
    return (
      <svg
        viewBox="0 0 310 80"
        role="img"
        aria-label="ДаоДент"
        className={cn("block", className)}
      >
        <path
          d="M40 10 C28 10 18 20 18 32 C18 44 25 50 30 60 C32 64 34 66 36 66 C37 66 38 64 38 62 C38 64 39 66 40 66 C42 66 44 64 46 60 C51 50 58 44 58 32 C58 20 48 10 40 10Z"
          fill="none"
          stroke={accentColor}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <text
          x="72"
          y="45"
          fill={titleColor}
          fontFamily={serifStack}
          fontSize="28"
          fontWeight="600"
          letterSpacing="0.5"
        >
          ДаоДент
        </text>
      </svg>
    )
  }

  return (
    <svg
      viewBox={showTagline ? "0 0 340 100" : "0 0 340 70"}
      role="img"
      aria-label={showTagline ? "ДаоДент — Семейная стоматология" : "ДаоДент"}
      className={cn("block", className)}
    >
      {/* Зуб-символ */}
      <path
        d="M35 6 C24 6 15 15 15 26 C15 37 21 43 26 52 C28 56 30 58 32 58 C33 58 34 56 34 54 C34 56 35 58 36 58 C38 58 40 56 42 52 C47 43 53 37 53 26 C53 15 44 6 35 6Z"
        fill="none"
        stroke={accentColor}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="35" cy="24" r="5" fill="none" stroke={accentColor} strokeWidth="1.2" />
      <path
        d="M35 19 C32.5 19 30 21.5 32.5 24 C35 26.5 35 29 35 29 C35 29 35 26.5 37.5 24 C40 21.5 37.5 19 35 19Z"
        fill={accentColor}
        opacity="0.25"
      />
      {/* Название */}
      <text
        x="65"
        y="38"
        fill={titleColor}
        fontFamily={serifStack}
        fontSize="26"
        fontWeight="600"
        letterSpacing="0.3"
        style={{ textRendering: "optimizeLegibility" }}
      >
        ДаоДент
      </text>
      {showTagline ? (
        <text
          x="65"
          y="72"
          fill={subtitleColor}
          fillOpacity={subtitleOpacity}
          fontFamily={serifStack}
          fontSize="14"
          fontWeight="400"
          letterSpacing="0.05"
          style={{ textRendering: "optimizeLegibility" }}
        >
          Семейная стоматология у м. Семёновская
        </text>
      ) : null}
    </svg>
  )
}
