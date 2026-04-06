import { cn } from "@/lib/utils"

interface BrandLogoProps {
  className?: string
  variant?: "full" | "icon" | "collapsed"
  showTagline?: boolean
  withBackground?: boolean
  /** Использовать currentColor для линии/текста — цвет задаётся родителем (sidebar, primary и т.д.) */
  useCurrentColor?: boolean
}

export function BrandLogo({
  className,
  variant = "full",
  showTagline = true,
  withBackground = false,
  useCurrentColor = false,
}: BrandLogoProps) {
  const strokeColor = useCurrentColor ? "currentColor" : "#E52C32"
  const titleColor = useCurrentColor ? "currentColor" : "#1a1a1a"
  const subtitleColor = useCurrentColor ? "currentColor" : "#3f3b36"
  const subtitleOpacity = useCurrentColor ? 0.95 : 1
  const sansStack = 'var(--font-sans), "DM Sans", ui-sans-serif, system-ui, sans-serif'
  const serifStack =
    'var(--font-serif), "Playfair Display", ui-serif, Georgia, serif'

  if (variant === "collapsed") {
    /** Тот же префикс пути, что у `icon` / `full`, до горизонтали к тексту — без обрезки «половины» импульса */
    const impulsePath =
      "M9 68H19L26 55L34 76.5L43 23L52 113L64 67.5L68 76L76 57L82 70.5"
    return (
      <svg
        viewBox="3 19 82 98"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Знак ДИБ-ИНТЕРФАРМ"
        className={cn("block max-h-full max-w-full", className)}
        shapeRendering="geometricPrecision"
      >
        <path
          d={impulsePath}
          fill="none"
          stroke={strokeColor}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  if (variant === "icon") {
    return (
      <svg
        viewBox="0 0 310 133"
        role="img"
        aria-label="ДИБ-ИНТЕРФАРМ"
        className={cn("block", className)}
        shapeRendering="geometricPrecision"
      >
        <path
          d="M9 68H19L26 55L34 76.5L43 23L52 113L64 67.5L68 76L76 57L82 70.5H302"
          fill="none"
          stroke={strokeColor}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  return (
    <svg
      viewBox={showTagline ? "0 0 310 148" : "0 0 310 120"}
      role="img"
      aria-label={
        showTagline ? "ДИБ-ИНТЕРФАРМ. Все для косметологии" : "ДИБ-ИНТЕРФАРМ"
      }
      className={cn("block", className)}
      shapeRendering="geometricPrecision"
    >
      <path
        d="M9 68H19L26 55L34 76.5L43 23L52 113L64 67.5L68 76L76 57L82 70.5H302"
        fill="none"
        stroke={strokeColor}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <text
        x="88"
        y="63"
        fill={titleColor}
        fontFamily={serifStack}
        fontSize={showTagline ? "21" : "20"}
        fontWeight="600"
        letterSpacing="0.2"
        style={{ textRendering: "optimizeLegibility" }}
      >
        ДИБ-ИНТЕРФАРМ
      </text>
      {showTagline ? (
        <text
          x="88"
          y="100"
          fill={subtitleColor}
          fillOpacity={subtitleOpacity}
          fontFamily={serifStack}
          fontSize="17"
          fontWeight="500"
          letterSpacing="0.03"
          style={{ textRendering: "optimizeLegibility" }}
        >
          Все для косметологии
        </text>
      ) : null}
    </svg>
  )
}
