/**
 * Добавить пользователя в локальную БД (или обновить пароль).
 * Чтобы локально входить теми же логином/паролем, что и на проде:
 *
 *   pnpm exec tsx scripts/add-local-user.ts твой@email.ru твой_пароль
 *
 * Роль по умолчанию ADMIN. Если пользователь уже есть — обновится только пароль.
 */
import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const email = process.argv[2]?.trim()
  const password = process.argv[3]

  if (!email || !password) {
    console.error("Использование: pnpm exec tsx scripts/add-local-user.ts <email> <пароль>")
    console.error("Пример: pnpm exec tsx scripts/add-local-user.ts admin@dib-interfarm.ru admin123")
    process.exit(1)
  }

  const hashedPassword = await bcrypt.hash(password, 12)
  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      hashedPassword,
      role: "ADMIN",
    },
    update: { hashedPassword },
  })

  console.log("Готово. Пользователь в локальной БД:")
  console.log("  Email:", user.email)
  console.log("  Роль:", user.role)
  console.log("  Пароль обновлён / пользователь создан. Можешь входить на http://localhost:3001 с этими данными.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
