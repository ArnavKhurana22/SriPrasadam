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

export const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
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
