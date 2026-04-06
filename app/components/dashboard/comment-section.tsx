"use client"

import { useMemo, useState } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MessageCircle, Reply, Send } from "lucide-react"

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Comment {
  id: string
  author: string
  initials: string
  date: string
  text: string
}

/* ------------------------------------------------------------------ */
/*  Sample data                                                        */
/* ------------------------------------------------------------------ */

const sampleComments: Comment[] = [
  {
    id: "c1",
    author: "Мария К.",
    initials: "МК",
    date: "2 дня назад",
    text: "Очень полезный урок! Наконец-то поняла разницу между гидрофильным маслом и мицеллярной водой. Спасибо за подробное объяснение техники массажных линий.",
  },
  {
    id: "c2",
    author: "Алина В.",
    initials: "АВ",
    date: "5 дней назад",
    text: "Подскажите, а для жирной кожи тоже подходит гидрофильное масло? Или лучше использовать бальзам для первого этапа очищения?",
  },
  {
    id: "c3",
    author: "Екатерина Д.",
    initials: "ЕД",
    date: "1 неделю назад",
    text: "Попробовала технику двойного очищения по этому уроку — кожа стала заметно чище уже через неделю. Рекомендую всем!",
  },
]

/* ------------------------------------------------------------------ */
/*  Single comment                                                     */
/* ------------------------------------------------------------------ */

function CommentItem({ comment }: { comment: Comment }) {
  return (
    <div className="flex gap-3">
      <Avatar className="h-9 w-9 shrink-0">
        <AvatarFallback className="bg-primary/20 text-xs font-medium text-primary-foreground">
          {comment.initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">
            {comment.author}
          </span>
          <span className="text-xs text-muted-foreground">{comment.date}</span>
        </div>
        <p className="text-sm leading-relaxed text-foreground/80">
          {comment.text}
        </p>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          <Reply className="h-3.5 w-3.5" />
          Ответить
        </button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  CommentSection                                                     */
/* ------------------------------------------------------------------ */

export function CommentSection({
  lessonId,
  currentUserName,
  initialComments,
}: {
  lessonId?: string
  currentUserName?: string
  initialComments?: Array<{
    id: string
    text: string
    userName: string
    avatarUrl?: string | null
    createdAt: string
  }>
}) {
  const [newComment, setNewComment] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const userInitials = useMemo(
    () =>
      (currentUserName || "Я")
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
    [currentUserName],
  )
  const [comments, setComments] = useState<Comment[]>(
    initialComments && initialComments.length > 0
      ? initialComments.map((comment) => ({
          id: comment.id,
          author: comment.userName,
          initials: comment.userName
            .split(" ")
            .map((part) => part[0])
            .join("")
            .slice(0, 2)
            .toUpperCase(),
          date: new Date(comment.createdAt).toLocaleDateString("ru-RU", {
            day: "numeric",
            month: "short",
          }),
          text: comment.text,
        }))
      : sampleComments,
  )

  const handleSubmit = async () => {
    if (!newComment.trim()) return
    setError("")

    if (!lessonId) {
      const localComment: Comment = {
        id: `c${Date.now()}`,
        author: currentUserName || "Пользователь",
        initials: userInitials,
        date: "Только что",
        text: newComment.trim(),
      }
      setComments((prev) => [localComment, ...prev])
      setNewComment("")
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`/api/lessons/${lessonId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newComment.trim() }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || "Не удалось отправить комментарий")
        return
      }
      const created = data.comment as {
        id: string
        text: string
        userName: string
        createdAt: string
      }
      setComments((prev) => [
        {
          id: created.id,
          author: created.userName,
          initials: created.userName
            .split(" ")
            .map((part) => part[0])
            .join("")
            .slice(0, 2)
            .toUpperCase(),
          date: "Только что",
          text: created.text,
        },
        ...prev,
      ])
      setNewComment("")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-muted-foreground" />
        <h4 className="text-sm font-medium text-foreground">
          Комментарии ({comments.length})
        </h4>
      </div>

      {/* New comment input */}
      <div className="flex gap-3">
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarFallback className="bg-secondary text-xs font-medium text-secondary-foreground">
            {userInitials}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-1 flex-col gap-2">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Написать комментарий..."
            rows={3}
            className="w-full resize-none rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!newComment.trim() || submitting}
              className="inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {submitting ? "Отправка..." : "Отправить"}
            </button>
          </div>
          {error && (
            <p className="text-xs text-red-600">{error}</p>
          )}
        </div>
      </div>

      {/* Comment list */}
      <div className="space-y-5">
        {comments.map((comment) => (
          <CommentItem key={comment.id} comment={comment} />
        ))}
      </div>
    </div>
  )
}
