import { prisma } from "@/lib/prisma"

/**
 * Записать действие в журнал аудита
 */
export async function logAudit({
  userId,
  action,
  entity,
  entityId,
  details,
}: {
  userId: string
  action: string   // "patient.create", "appointment.update", etc.
  entity: string   // "patient", "appointment", "lead", etc.
  entityId?: string
  details?: Record<string, unknown>
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId: entityId || null,
        details: details ? (details as object) : null,
      },
    })
  } catch (err) {
    // Аудит не должен ломать основное действие
    console.error("[audit]", err)
  }
}
