"use client"

import { useState, useCallback } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { VideoPlayer } from "@/components/dashboard/video-player"
import {
  LessonList,
  type Module,
} from "@/components/dashboard/lesson-list"
import { CommentSection } from "@/components/dashboard/comment-section"
import { HomeworkUpload } from "@/components/dashboard/homework-upload"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  FileText,
  Download,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  ListOrdered,
  Clock,
  BookOpen,
} from "lucide-react"

/* ------------------------------------------------------------------ */
/*  Course data (static for demo)                                      */
/* ------------------------------------------------------------------ */

const modules: Module[] = [
  {
    id: "mod-1",
    title: "Раздел 1: Введение в K-beauty",
    lessons: [
      { id: "l1", title: "Урок 1: Философия корейского ухода", duration: "8 мин", status: "completed" },
      { id: "l2", title: "Урок 2: Типы кожи по корейской системе", duration: "12 мин", status: "completed" },
      { id: "l3", title: "Урок 3: 10-ступенчатый ритуал", duration: "15 мин", status: "completed" },
      { id: "l4", title: "Урок 4: Тест раздела 1", duration: "5 мин", status: "completed" },
    ],
  },
  {
    id: "mod-2",
    title: "Раздел 2: Очищение",
    lessons: [
      { id: "l5", title: "Урок 5: Гидрофильные масла", duration: "10 мин", status: "completed" },
      { id: "l6", title: "Урок 6: Пенки и гели", duration: "11 мин", status: "completed" },
    ],
  },
  {
    id: "mod-3",
    title: "Раздел 3: Ежедневный уход",
    lessons: [
      { id: "l7", title: "Урок 7: Двойное очищение — техника и средства", duration: "12 мин", status: "current" },
      { id: "l8", title: "Урок 8: Тонеры и эссенции", duration: "14 мин", status: "locked" },
      { id: "l9", title: "Урок 9: Сыворотки", duration: "13 мин", status: "locked" },
      { id: "l10", title: "Урок 10: Увлажняющие кремы", duration: "11 мин", status: "locked" },
      { id: "l11", title: "Урок 11: Тест раздела 3", duration: "5 мин", status: "locked" },
    ],
  },
  {
    id: "mod-4",
    title: "Раздел 4: Профессиональные протоколы",
    lessons: [
      { id: "l12", title: "Урок 12: Кислотные пилинги", duration: "16 мин", status: "locked" },
      { id: "l13", title: "Урок 13: Маски и патчи", duration: "12 мин", status: "locked" },
      { id: "l14", title: "Урок 14: Массаж лица", duration: "18 мин", status: "locked" },
      { id: "l15", title: "Урок 15: Итоговый экзамен", duration: "10 мин", status: "locked" },
    ],
  },
]

const materials = [
  { name: "Протокол двойного очищения.pdf", size: "2.4 МБ" },
  { name: "Чек-лист средств.pdf", size: "1.1 МБ" },
  { name: "Презентация урока.pdf", size: "5.8 МБ" },
]

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function CoursePlayerPage() {
  const [lessonCompleted, setLessonCompleted] = useState(false)

  const toggleCompleted = useCallback(() => {
    setLessonCompleted((v) => !v)
  }, [])

  return (
    <DashboardLayout activePath="/courses">
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* ============================================================ */}
        {/*  LEFT PANEL -- Video + Tabs                                   */}
        {/* ============================================================ */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Video -- pass a real src URL when available */}
          <VideoPlayer
            title="Двойное очищение — техника и средства"
          />

          {/* Lesson title & meta */}
          <div className="space-y-1.5">
            <h2 className="text-xl font-bold text-foreground leading-snug text-balance">
              Урок 7: Двойное очищение — техника и средства
            </h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BookOpen className="h-4 w-4" />
              <span>Раздел 3: Ежедневный уход</span>
              <span>&middot;</span>
              <Clock className="h-4 w-4" />
              <span>12 мин</span>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="description">
            <TabsList className="w-full flex-wrap">
              <TabsTrigger value="description">Описание</TabsTrigger>
              <TabsTrigger value="materials">Материалы</TabsTrigger>
              <TabsTrigger value="homework">Задания</TabsTrigger>
              <TabsTrigger value="comments">Комментарии</TabsTrigger>
            </TabsList>

            {/* -- Description -- */}
            <TabsContent value="description" className="space-y-4">
              <div className="prose prose-sm max-w-none text-foreground/85 leading-relaxed">
                <p>
                  Двойное очищение — это краеугольный камень корейской системы ухода
                  за кожей. В этом уроке мы разберём, почему одного этапа очищения
                  недостаточно и как правильно сочетать масляное и водное очищение
                  для достижения идеально чистой и подготовленной к дальнейшему
                  уходу кожи.
                </p>
                <p>
                  Вы узнаете, какие средства лучше всего подходят для первого этапа
                  (гидрофильные масла, бальзамы, мицеллярная вода), а какие — для
                  второго (пенки, гели, энзимные пудры). Мы подробно разберём
                  технику нанесения каждого средства, оптимальное время массажа и
                  правильные движения по массажным линиям.
                </p>
                <p>
                  Особое внимание уделим выбору средств в зависимости от типа кожи:
                  сухая, жирная, комбинированная, чувствительная. После прохождения
                  урока вы сможете составить индивидуальный протокол очищения для
                  своих клиентов или для себя.
                </p>
              </div>
            </TabsContent>

            {/* -- Materials -- */}
            <TabsContent value="materials">
              <div className="space-y-3">
                {materials.map((mat) => (
                  <div
                    key={mat.name}
                    className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-muted/30"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {mat.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{mat.size}</p>
                    </div>
                    <button
                      type="button"
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                      aria-label={`Скачать ${mat.name}`}
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* -- Homework -- */}
            <TabsContent value="homework">
              <HomeworkUpload />
            </TabsContent>

            {/* -- Comments -- */}
            <TabsContent value="comments">
              <CommentSection />
            </TabsContent>
          </Tabs>

          {/* Lesson navigation */}
          <div className="flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <a
                href="#"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted/50"
              >
                <ChevronLeft className="h-4 w-4" />
                Предыдущий урок
              </a>
              <a
                href="#"
                className="inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2.5 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/90"
              >
                Следующий урок
                <ChevronRight className="h-4 w-4" />
              </a>
            </div>
            <label className="flex cursor-pointer items-center gap-2 select-none">
              <button
                type="button"
                onClick={toggleCompleted}
                className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${
                  lessonCompleted
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : "border-border bg-card text-transparent hover:border-primary"
                }`}
                aria-label="Отметить как пройденный"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
              </button>
              <span className="text-sm text-foreground">
                Отметить урок как пройденный
              </span>
            </label>
          </div>
        </div>

        {/* ============================================================ */}
        {/*  RIGHT SIDEBAR -- Lesson list (desktop)                       */}
        {/* ============================================================ */}
        <aside className="hidden w-[320px] shrink-0 lg:block">
          <div className="sticky top-24 rounded-xl border border-border bg-card p-4">
            <LessonList
              courseTitle="Корейские протоколы ухода за кожей"
              overallProgress={58}
              modules={modules}
            />

            {/* Next lesson CTA */}
            <div className="mt-4 border-t border-border pt-4">
              <a
                href="#"
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-secondary px-4 py-2.5 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/90"
              >
                Следующий урок
                <ChevronRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </aside>

        {/* ============================================================ */}
        {/*  MOBILE -- Lesson list drawer trigger                         */}
        {/* ============================================================ */}
        <div className="fixed bottom-4 right-4 z-50 lg:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <button
                type="button"
                className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-secondary-foreground shadow-lg transition-transform hover:scale-105"
                aria-label="Открыть список уроков"
              >
                <ListOrdered className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[320px] overflow-y-auto border-none bg-card p-4">
              <SheetTitle className="sr-only">Список уроков</SheetTitle>
              <LessonList
                courseTitle="Корейские протоколы ухода за кожей"
                overallProgress={58}
                modules={modules}
              />
              <div className="mt-4 border-t border-border pt-4">
                <a
                  href="#"
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-secondary px-4 py-2.5 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/90"
                >
                  Следующий урок
                  <ChevronRight className="h-4 w-4" />
                </a>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </DashboardLayout>
  )
}
