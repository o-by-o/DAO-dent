import crypto from "crypto"

interface PasswordResetTokenPayload {
  sub: string
  email: string
  exp: number
  pwd: string
}

const DEFAULT_TTL_SECONDS = 60 * 60

function getSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) {
    throw new Error("NEXTAUTH_SECRET не задан")
  }
  return secret
}

function toBase64Url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url")
}

function fromBase64Url(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8")
}

function sign(payloadB64: string): string {
  return crypto
    .createHmac("sha256", getSecret())
    .update(payloadB64)
    .digest("base64url")
}

function safeEqual(a: string, b: string): boolean {
  try {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b))
  } catch {
    return false
  }
}

export function passwordFingerprint(hashedPassword: string): string {
  return crypto.createHash("sha256").update(hashedPassword).digest("hex")
}

export function createPasswordResetToken(args: {
  userId: string
  email: string
  hashedPassword: string
  ttlSeconds?: number
}): string {
  const payload: PasswordResetTokenPayload = {
    sub: args.userId,
    email: args.email,
    exp: Math.floor(Date.now() / 1000) + (args.ttlSeconds ?? DEFAULT_TTL_SECONDS),
    pwd: passwordFingerprint(args.hashedPassword),
  }

  const payloadJson = JSON.stringify(payload)
  const payloadB64 = toBase64Url(payloadJson)
  const signature = sign(payloadB64)
  return `${payloadB64}.${signature}`
}

export function verifyPasswordResetToken(
  token: string,
): PasswordResetTokenPayload | null {
  const [payloadB64, signature] = token.split(".")
  if (!payloadB64 || !signature) return null

  const expectedSignature = sign(payloadB64)
  if (!safeEqual(signature, expectedSignature)) return null

  try {
    const payload = JSON.parse(fromBase64Url(payloadB64)) as PasswordResetTokenPayload
    if (!payload.sub || !payload.email || !payload.exp || !payload.pwd) return null

    const now = Math.floor(Date.now() / 1000)
    if (payload.exp < now) return null
    return payload
  } catch {
    return null
  }
}
