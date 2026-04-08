import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: "OWNER" | "MANAGER" | "DOCTOR" | "ADMIN"
    } & DefaultSession["user"]
  }

  interface User {
    role: "OWNER" | "MANAGER" | "DOCTOR" | "ADMIN"
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: "OWNER" | "MANAGER" | "DOCTOR" | "ADMIN"
  }
}
