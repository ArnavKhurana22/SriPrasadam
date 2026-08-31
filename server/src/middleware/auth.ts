import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET ?? 'dev-only-insecure-secret-change-me'
export const SESSION_COOKIE = 'sp_session'
export const ADMIN_COOKIE = 'sp_admin'

export type SessionPayload = { uid: number; mobile: string }

export function signSession(payload: SessionPayload) {
  return jwt.sign(payload, SECRET, { expiresIn: '30d' })
}

export function signAdmin() {
  return jwt.sign({ role: 'admin' }, SECRET, { expiresIn: '12h' })
}

/**
 * `secure` cookies are only sent over HTTPS, so they must be off when the site
 * is served over plain HTTP — a LAN address such as http://192.168.1.5:5174.
 * Defaults to on in production; set COOKIE_SECURE=false to serve over HTTP.
 * Always leave it on once the site is behind TLS.
 */
const secureCookies =
  process.env.COOKIE_SECURE !== undefined
    ? process.env.COOKIE_SECURE === 'true'
    : process.env.NODE_ENV === 'production'

export const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: secureCookies,
  path: '/',
}

declare module 'express-serve-static-core' {
  interface Request {
    session?: SessionPayload
  }
}

/** Attaches req.session when a valid cookie is present; never rejects. */
export function readSession(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.[SESSION_COOKIE]
  if (token) {
    try {
      req.session = jwt.verify(token, SECRET) as SessionPayload
    } catch {
      // expired or tampered — treated as logged out
    }
  }
  next()
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session) return res.status(401).json({ error: 'Please sign in to continue.' })
  next()
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[ADMIN_COOKIE]
  if (!token) return res.status(401).json({ error: 'Admin sign-in required.' })
  try {
    const claims = jwt.verify(token, SECRET) as { role?: string }
    if (claims.role !== 'admin') throw new Error('not admin')
    next()
  } catch {
    res.status(401).json({ error: 'Admin session expired.' })
  }
}
