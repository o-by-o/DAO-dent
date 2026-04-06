import { Skeleton } from "@/components/ui/skeleton"

/**
 * Показывается пока загружается страница (auth + запросы к БД).
 * Скелетон повторяет структуру дашборда — меньше «прыжка» при появлении контента.
 */
export default function Loading() {
  return (
    <div className="flex min-h-dvh w-full bg-background">
      {/* Сайдбар-скелетон */}
      <aside className="hidden w-14 flex-shrink-0 flex-col border-r border-border bg-card lg:flex lg:w-56">
        <div className="flex h-14 items-center gap-2 border-b border-border px-3">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="hidden h-6 flex-1 lg:block" />
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-9 w-full rounded-md" />
          ))}
        </nav>
      </aside>

      {/* Основная область */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Хедер-скелетон */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4">
          <Skeleton className="h-8 w-32 rounded-md" />
          <Skeleton className="h-9 w-9 rounded-full" />
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-5xl space-y-8">
            {/* Заголовок */}
            <section>
              <Skeleton className="mb-2 h-8 w-64 rounded-md" />
              <Skeleton className="h-4 w-96 max-w-full rounded-md" />
            </section>

            {/* Карточки статистики */}
            <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </section>

            {/* Блок «Продолжить» / карточки курсов */}
            <section className="space-y-4">
              <Skeleton className="h-6 w-40 rounded-md" />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-36 rounded-xl" />
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}
