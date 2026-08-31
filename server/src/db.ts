import Database from 'better-sqlite3'
import { existsSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const dbPath = process.env.DB_PATH ?? resolve(process.cwd(), 'server/data/app.db')
const dir = dirname(dbPath)
if (!existsSync(dir)) mkdirSync(dir, { recursive: true })

export const db = new Database(dbPath)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mobile TEXT NOT NULL UNIQUE,
  full_name TEXT,
  gotra TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS otps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mobile TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  consumed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_otps_mobile ON otps(mobile);

CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_ref TEXT NOT NULL UNIQUE,
  user_id INTEGER REFERENCES users(id),
  deity_id TEXT NOT NULL,
  deity_name TEXT NOT NULL,
  slab_id TEXT NOT NULL,
  amount_paise INTEGER NOT NULL,
  full_name TEXT NOT NULL,
  gotra TEXT NOT NULL,
  mobile TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Gurugram',
  pincode TEXT NOT NULL,
  puja_date TEXT NOT NULL,
  event_id TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending_payment',
  payment_status TEXT NOT NULL DEFAULT 'pending',
  payment_mode TEXT,
  video_url TEXT,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_bookings_mobile ON bookings(mobile);
CREATE INDEX IF NOT EXISTS idx_bookings_order ON bookings(razorpay_order_id);

CREATE TABLE IF NOT EXISTS booking_status_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_history_booking ON booking_status_history(booking_id);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  mobile TEXT NOT NULL,
  email TEXT,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`)

export type BookingRow = {
  id: number
  booking_ref: string
  user_id: number | null
  deity_id: string
  deity_name: string
  slab_id: string
  amount_paise: number
  full_name: string
  gotra: string
  mobile: string
  address: string
  city: string
  pincode: string
  puja_date: string
  event_id: string | null
  notes: string | null
  status: string
  payment_status: string
  payment_mode: string | null
  video_url: string | null
  razorpay_order_id: string | null
  razorpay_payment_id: string | null
  created_at: string
  updated_at: string
}

export const BOOKING_STATUSES = [
  'pending_payment',
  'booked',
  'puja_done',
  'dispatched',
  'delivered',
  'cancelled',
] as const

export type BookingStatus = (typeof BOOKING_STATUSES)[number]

export function recordStatus(bookingId: number, status: BookingStatus, note?: string) {
  db.prepare(
    'INSERT INTO booking_status_history (booking_id, status, note) VALUES (?, ?, ?)',
  ).run(bookingId, status, note ?? null)
}

export function findUserByMobile(mobile: string) {
  return db.prepare('SELECT * FROM users WHERE mobile = ?').get(mobile) as
    | { id: number; mobile: string; full_name: string | null; gotra: string | null }
    | undefined
}

export function upsertUser(mobile: string, fullName?: string, gotra?: string) {
  const existing = findUserByMobile(mobile)
  if (existing) {
    if (fullName || gotra) {
      db.prepare(
        'UPDATE users SET full_name = COALESCE(?, full_name), gotra = COALESCE(?, gotra) WHERE id = ?',
      ).run(fullName ?? null, gotra ?? null, existing.id)
    }
    return existing.id
  }
  const info = db
    .prepare('INSERT INTO users (mobile, full_name, gotra) VALUES (?, ?, ?)')
    .run(mobile, fullName ?? null, gotra ?? null)
  return Number(info.lastInsertRowid)
}
