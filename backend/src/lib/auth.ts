import crypto from "node:crypto"
import type { Request, Response, NextFunction } from "express"
import type { ActorRole } from "./workflow.js"

const AUTH_SECRET = process.env.AUTH_SECRET || "matram-ai-demo-auth-secret-change-me"

export type AuthUser = {
  email: string
  role: ActorRole
  contractorId?: string
  name?: string
}

type TokenPayload = AuthUser & { exp: number }

function b64url(input: Buffer | string): string {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input)
  return buf.toString("base64url")
}

function sign(payload: TokenPayload): string {
  const body = b64url(JSON.stringify(payload))
  const sig = crypto.createHmac("sha256", AUTH_SECRET).update(body).digest("base64url")
  return `${body}.${sig}`
}

export function verifyToken(token: string): AuthUser | null {
  const [body, sig] = token.split(".")
  if (!body || !sig) return null
  const expected = crypto.createHmac("sha256", AUTH_SECRET).update(body).digest("base64url")
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as TokenPayload
    if (payload.exp < Date.now()) return null
    return { email: payload.email, role: payload.role, contractorId: payload.contractorId, name: payload.name }
  } catch {
    return null
  }
}

export function issueToken(user: AuthUser, ttlMs = 12 * 60 * 60 * 1000): string {
  return sign({ ...user, exp: Date.now() + ttlMs })
}

export function hashSecret(value: string): string {
  return crypto.scryptSync(value, "matram-ai-demo-salt", 32).toString("hex")
}

export function verifySecret(value: string, hash: string): boolean {
  const incoming = hashSecret(value)
  const a = Buffer.from(incoming)
  const b = Buffer.from(hash)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

const ADMIN_EMAIL = "civic123@gmail.com"
const ADMIN_PASSWORD = "12345"

export function authenticateOfficial(email: string, password: string): AuthUser | null {
  const normalized = email.trim().toLowerCase()
  if (normalized === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    return { email: normalized, role: "admin", name: "Central Admin" }
  }
  if (normalized.endsWith("@civic.gov") && (password === ADMIN_PASSWORD || password === "pass123")) {
    const role: ActorRole = normalized.includes("pwd") || normalized.includes("dept") ? "department" : "department"
    return { email: normalized, role, name: normalized }
  }
  return null
}

export interface AuthedRequest extends Request {
  authUser?: AuthUser
}

export function optionalAuth(req: AuthedRequest, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  if (header?.startsWith("Bearer ")) {
    const user = verifyToken(header.slice(7))
    if (user) req.authUser = user
  }
  next()
}

export function requireAuth(roles?: ActorRole[]) {
  return (req: AuthedRequest, res: Response, next: NextFunction): void => {
    const header = req.headers.authorization
    const token = header?.startsWith("Bearer ") ? header.slice(7) : ""
    const user = token ? verifyToken(token) : null
    if (!user) {
      res.status(401).json({ success: false, message: "Authorization required." })
      return
    }
    if (roles && !roles.includes(user.role)) {
      res.status(403).json({ success: false, message: "Insufficient role for this action." })
      return
    }
    req.authUser = user
    next()
  }
}
