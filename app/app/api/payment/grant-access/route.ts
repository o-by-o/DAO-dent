import crypto from "crypto"
import { NextResponse } from "next/server"
import { AccessGrantError, grantCourseAccess } from "@/lib/access"
import { sendAccessGrantedEmail } from "@/lib/email"
import { createOrder } from "@/lib/orders"

function validateWebhookSecret(request: Request): boolean {
  const configuredSecret = process.env.PAYMENT_WEBHOOK_SECRET
  if (!configuredSecret) return false

  const incomingSecret = request.headers.get("x-payment-secret") || ""
  if (!incomingSecret) return false

  try {
    return crypto.timingSafeEqual(
      Buffer.from(incomingSecret),
      Buffer.from(configuredSecret),
    )
  } catch {
    return false
  }
}

/**
 * POST /api/payment/grant-access
 * Выдать доступ после успешной оплаты (webhook от платежной системы).
 *
 * Headers:
 * - x-payment-secret: <PAYMENT_WEBHOOK_SECRET>
 *
 * Body:
 * {
 *   email: string,
 *   name?: string,
 *   courseId?: string,
 *   courseIds?: string[],
 *   licenseDays?: number,
 *   paymentId?: string
 * }
 */
export async function POST(request: Request) {
  if (!validateWebhookSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const {
      email,
      name,
      courseId,
      courseIds,
      licenseDays,
      paymentId,
    } = body as {
      email: string
      name?: string
      courseId?: string
      courseIds?: string[]
      licenseDays?: number
      paymentId?: string
    }

    const normalizedCourseIds =
      courseIds && courseIds.length > 0
        ? courseIds
        : courseId
          ? [courseId]
          : []

    const result = await grantCourseAccess({
      email,
      name,
      courseIds: normalizedCourseIds,
      licenseDays,
    })

    // Создаём заказ для трекинга
    try {
      if (result.addedCourseIds.length > 0 || result.reactivatedCourseIds.length > 0) {
        const grantedIds = [...result.addedCourseIds, ...result.reactivatedCourseIds]
        await createOrder({
          userId: result.user.id,
          type: "COURSE",
          paymentId: paymentId ?? undefined,
          items: result.courses
            .filter((c) => grantedIds.includes(c.id))
            .map((c) => ({ courseId: c.id, unitPrice: 0 })),
        })
      }
    } catch (orderErr) {
      console.error("Failed to create order record:", orderErr)
    }

    const emailResult = await sendAccessGrantedEmail({
      to: result.user.email,
      name: result.user.name,
      temporaryPassword: result.temporaryPassword,
      courseTitles: result.courses.map((c) => c.title),
    })

    return NextResponse.json({
      ok: true,
      paymentId: paymentId ?? null,
      userId: result.user.id,
      createdUser: result.createdUser,
      coursesGranted: [...result.addedCourseIds, ...result.reactivatedCourseIds],
      emailSent: emailResult.sent,
      emailError: emailResult.sent ? null : emailResult.reason ?? null,
    })
  } catch (error) {
    if (error instanceof AccessGrantError) {
      const status =
        error.code === "INVALID_INPUT" || error.code === "ALREADY_ENROLLED"
          ? 400
          : 404
      return NextResponse.json({ error: error.message }, { status })
    }
    console.error("payment/grant-access error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
