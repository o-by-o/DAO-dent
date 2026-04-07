/**
 * Ролевая модель доступа ДаоДент
 *
 * OWNER    — полный доступ ко всем модулям
 * MANAGER  — расписание, CRM, отчёты, видео. Без финансов владельца и маркетинга
 * DOCTOR   — своё расписание, свои пациенты, зубная формула, голосовой ввод
 * ADMIN    — CRM, запись пациентов, расписание всех врачей, обработка заявок
 */

type Role = "OWNER" | "MANAGER" | "DOCTOR" | "ADMIN"

export function canAccessOwnerPanel(role: string): boolean {
  return role === "OWNER"
}

export function canAccessManagerPanel(role: string): boolean {
  return role === "OWNER" || role === "MANAGER"
}

export function canAccessDoctorPanel(role: string): boolean {
  return role === "OWNER" || role === "MANAGER" || role === "DOCTOR"
}

export function canManagePatients(role: string): boolean {
  return ["OWNER", "MANAGER", "ADMIN"].includes(role)
}

export function canViewFinancials(role: string): boolean {
  return role === "OWNER"
}

export function canManageMarketing(role: string): boolean {
  return role === "OWNER"
}

export function canViewMedicalRecords(role: string): boolean {
  return role === "OWNER" || role === "MANAGER" || role === "DOCTOR"
}

export function canManageSchedule(role: string): boolean {
  return ["OWNER", "MANAGER", "ADMIN"].includes(role)
}

export function canManageUsers(role: string): boolean {
  return role === "OWNER" || role === "MANAGER"
}

export function canViewVideo(role: string): boolean {
  return role === "OWNER" || role === "MANAGER"
}

export function canManageWarehouse(role: string): boolean {
  return role === "OWNER" || role === "MANAGER"
}

export function isOwnerOrManager(role: string): boolean {
  return role === "OWNER" || role === "MANAGER"
}
