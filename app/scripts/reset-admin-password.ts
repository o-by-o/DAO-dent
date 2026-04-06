/**
 * Сброс пароля админа (генерирует случайный пароль)
 * Запуск: pnpm exec tsx scripts/reset-admin-password.ts
 */
import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import crypto from "crypto"

const prisma = new PrismaClient()
const ADMIN_EMAIL = "admin@dib-interfarm.ru"

function generateSecurePassword(): string {
  return crypto.randomBytes(16).toString("base64url")
}

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL },
  })
  if (!user) {
    console.error("Пользователь admin@dib-interfarm.ru не найден. Сначала выполни: pnpm db:seed")
    process.exit(1)
  }

  const newPassword = process.argv[2] || generateSecurePassword()
  const hashedPassword = await bcrypt.hash(newPassword, 12)
  await prisma.user.update({
    where: { email: ADMIN_EMAIL },
    data: { hashedPassword },
  })
  console.log("Пароль админа сброшен.")
  console.log(`   Вход: ${ADMIN_EMAIL}`)
  console.log(`   Пароль: ${newPassword}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
