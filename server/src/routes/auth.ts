import crypto from 'node:crypto'
import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'
import { db, findUserByMobile, upsertUser } from '../db.js'
import {
  ADMIN_COOKIE,
  SESSION_COOKIE,
  cookieOptions,
  signAdmin,
  signSession,
} from '../middleware/auth.js'
import { otpText, sendMessage } from '../notify.js'

export const authRouter = Router()

const mobileSchema = z
  .string()
  .trim()
  .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number.')

const otpLimiter = rateLimit({ windowMs: 10 * 60 * 1000, limit: 5, standardHeaders: true })
const verifyLimiter = rateLimit({ windowMs: 10 * 60 * 1000, limit: 10, standardHeaders: true })

const hash = (code: string) => crypto.createHash('sha256').update(code).digest('hex')
const isDev = process.env.NODE_ENV !== 'production'

authRouter.post('/request-otp', otpLimiter, async (req, res) => {
  const parsed = mobileSchema.safeParse(req.body?.mobile)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message })
  const mobile = parsed.data

  const code = String(crypto.randomInt(100000, 1000000))
  const expiresAt = Date.now() + 10 * 60 * 1000

  db.prepare('UPDATE otps SET consumed = 1 WHERE mobile = ? AND consumed = 0').run(mobile)
  db.prepare('INSERT INTO otps (mobile, code_hash, expires_at) VALUES (?, ?, ?)').run(
    mobile,
    hash(code),
    expiresAt,
  )

  await sendMessage({ mobile, text: otpText(code), kind: 'otp' })

  // The code is only echoed back outside production, so the flow is testable without an SMS provider.
  res.json({ ok: true, ...(isDev ? { devCode: code } : {}) })
})

authRouter.post('/verify-otp', verifyLimiter, (req, res) => {
  const schema = z.object({ mobile: mobileSchema, code: z.string().trim().regex(/^\d{6}$/) })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Enter the 6-digit code we sent you.' })
  const { mobile, code } = parsed.data

  const row = db
    .prepare(
      'SELECT * FROM otps WHERE mobile = ? AND consumed = 0 ORDER BY id DESC LIMIT 1',
    )
    .get(mobile) as { id: number; code_hash: string; expires_at: number; attempts: number } | undefined

  if (!row) return res.status(400).json({ error: 'Request a new code to continue.' })
  if (row.expires_at < Date.now()) return res.status(400).json({ error: 'That code has expired. Please request a new one.' })
  if (row.attempts >= 5) return res.status(429).json({ error: 'Too many attempts. Please request a new code.' })

  if (row.code_hash !== hash(code)) {
    db.prepare('UPDATE otps SET attempts = attempts + 1 WHERE id = ?').run(row.id)
    return res.status(400).json({ error: 'That code did not match. Please try again.' })
  }

  db.prepare('UPDATE otps SET consumed = 1 WHERE id = ?').run(row.id)
  const uid = upsertUser(mobile)

  // Any bookings this number made before signing in now belong to the account.
  db.prepare('UPDATE bookings SET user_id = ? WHERE mobile = ? AND user_id IS NULL').run(uid, mobile)

  res.cookie(SESSION_COOKIE, signSession({ uid, mobile }), {
    ...cookieOptions,
    maxAge: 30 * 24 * 60 * 60 * 1000,
  })
  const user = findUserByMobile(mobile)
  res.json({ ok: true, user: { mobile, fullName: user?.full_name ?? null, gotra: user?.gotra ?? null } })
})

authRouter.get('/me', (req, res) => {
  if (!req.session) return res.json({ user: null })
  const user = findUserByMobile(req.session.mobile)
  res.json({
    user: { mobile: req.session.mobile, fullName: user?.full_name ?? null, gotra: user?.gotra ?? null },
  })
})

authRouter.post('/logout', (_req, res) => {
  res.clearCookie(SESSION_COOKIE, cookieOptions)
  res.json({ ok: true })
})

const adminLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true })

authRouter.post('/admin-login', adminLimiter, (req, res) => {
  const password = String(req.body?.password ?? '')
  const expected = process.env.ADMIN_PASSWORD
  if (!expected) return res.status(500).json({ error: 'ADMIN_PASSWORD is not configured on the server.' })

  const a = Buffer.from(password)
  const b = Buffer.from(expected)
  const ok = a.length === b.length && crypto.timingSafeEqual(a, b)
  if (!ok) return res.status(401).json({ error: 'Incorrect password.' })

  res.cookie(ADMIN_COOKIE, signAdmin(), { ...cookieOptions, maxAge: 12 * 60 * 60 * 1000 })
  res.json({ ok: true })
})

authRouter.post('/admin-logout', (_req, res) => {
  res.clearCookie(ADMIN_COOKIE, cookieOptions)
  res.json({ ok: true })
})
