import { useCallback, useEffect, useState } from 'react'
import { ApiError, api, type Booking } from '../lib/api'
import { STATUS_LABEL, formatDate, formatTimestamp, rupees } from '../lib/format'
import styles from './AdminPage.module.css'

const FILTERS = [
  { value: '', label: 'All' },
  { value: 'booked', label: 'Booked' },
  { value: 'puja_done', label: 'Puja done' },
  { value: 'dispatched', label: 'Dispatched' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'pending_payment', label: 'Awaiting payment' },
  { value: 'cancelled', label: 'Cancelled' },
]

const NEXT_STATUS = ['booked', 'puja_done', 'dispatched', 'delivered', 'cancelled']

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState<string | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [counts, setCounts] = useState<{ status: string; n: number }[]>([])
  const [status, setStatus] = useState('')
  const [query, setQuery] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busyRef, setBusyRef] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await api.adminBookings({ status, q: query })
      setBookings(res.bookings)
      setCounts(res.counts)
      setError(null)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) setAuthed(false)
      else setError(err instanceof ApiError ? err.message : 'Could not load bookings.')
    }
  }, [status, query])

  // An admin cookie may already be present from an earlier visit.
  useEffect(() => {
    api
      .adminBookings()
      .then((res) => {
        setBookings(res.bookings)
        setCounts(res.counts)
        setAuthed(true)
      })
      .catch(() => setAuthed(false))
  }, [])

  useEffect(() => {
    if (!authed) return
    const timer = setTimeout(() => void load(), 200)
    return () => clearTimeout(timer)
  }, [authed, load])

  async function signIn(e: React.FormEvent) {
    e.preventDefault()
    setLoginError(null)
    try {
      await api.adminLogin(password)
      setPassword('')
      setAuthed(true)
    } catch (err) {
      setLoginError(err instanceof ApiError ? err.message : 'Could not sign in.')
    }
  }

  async function update(ref: string, payload: { status?: string; videoUrl?: string }) {
    setBusyRef(ref)
    try {
      const res = await api.adminUpdateBooking(ref, payload)
      setBookings((prev) => prev.map((b) => (b.ref === ref ? res.booking : b)))
      setError(null)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update that booking.')
    } finally {
      setBusyRef(null)
    }
  }

  if (!authed) {
    return (
      <section className={`section ${styles.wrap}`}>
        <div className="page">
          <p className="eyebrow">Admin</p>
          <h1>Sign in</h1>
          <form className={`card ${styles.login}`} onSubmit={signIn}>
            <div className="field">
              <label htmlFor="admin-password">Password</label>
              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {loginError && <div className="notice notice--error">{loginError}</div>}
            <button type="submit" className="btn btn--primary">
              Sign in
            </button>
          </form>
        </div>
      </section>
    )
  }

  return (
    <section className={`section ${styles.wrap}`}>
      <div className="page">
        <div className={styles.head}>
          <div>
            <p className="eyebrow">Admin</p>
            <h1>Bookings</h1>
          </div>
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={() => {
              void api.adminLogout()
              setAuthed(false)
            }}
          >
            Sign out
          </button>
        </div>

        <div className={styles.counts}>
          {counts.map((c) => (
            <span key={c.status} className="chip">
              {STATUS_LABEL[c.status] ?? c.status}: {c.n}
            </span>
          ))}
        </div>

        <div className={styles.controls}>
          <div className="field">
            <label htmlFor="admin-status">Status</label>
            <select id="admin-status" value={status} onChange={(e) => setStatus(e.target.value)}>
              {FILTERS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="admin-search">Search</label>
            <input
              id="admin-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Reference, name or mobile"
            />
          </div>
        </div>

        {error && (
          <div className="notice notice--error" role="alert">
            {error}
          </div>
        )}

        {bookings.length === 0 ? (
          <p className="muted">No bookings match this filter.</p>
        ) : (
          <ul className={styles.list}>
            {bookings.map((booking) => (
              <li key={booking.ref} className={`card ${styles.row}`}>
                <div className={styles.rowMain}>
                  <div className={styles.rowTop}>
                    <strong className={styles.ref}>{booking.ref}</strong>
                    <span className="chip">{STATUS_LABEL[booking.status] ?? booking.status}</span>
                    <span className={styles.amount}>{rupees(booking.amount)}</span>
                    <span className={styles.payment}>{booking.paymentStatus}</span>
                  </div>
                  <p className={styles.who}>
                    {booking.fullName} · gotra {booking.gotra} · +91 {booking.mobile}
                  </p>
                  <p className={styles.what}>
                    {booking.deityName} · {booking.slabTitle} · puja on {formatDate(booking.pujaDate)}
                  </p>
                  <p className={styles.address}>
                    {booking.address}, {booking.city} {booking.pincode}
                  </p>
                  {booking.notes && <p className={styles.notes}>Note: {booking.notes}</p>}
                  <p className="muted">Booked {formatTimestamp(booking.createdAt)}</p>
                </div>

                <div className={styles.rowActions}>
                  <div className="field">
                    <label htmlFor={`status-${booking.ref}`}>Status</label>
                    <select
                      id={`status-${booking.ref}`}
                      value={booking.status}
                      disabled={busyRef === booking.ref}
                      onChange={(e) => void update(booking.ref, { status: e.target.value })}
                    >
                      {(booking.status === 'pending_payment'
                        ? ['pending_payment', ...NEXT_STATUS]
                        : NEXT_STATUS
                      ).map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABEL[s] ?? s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <VideoField
                    initial={booking.videoUrl ?? ''}
                    busy={busyRef === booking.ref}
                    onSave={(url) => void update(booking.ref, { videoUrl: url })}
                    id={booking.ref}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

function VideoField({
  initial,
  busy,
  onSave,
  id,
}: {
  initial: string
  busy: boolean
  onSave: (url: string) => void
  id: string
}) {
  const [value, setValue] = useState(initial)
  const [savedValue, setSavedValue] = useState(initial)
  if (savedValue !== initial) {
    setSavedValue(initial)
    setValue(initial)
  }

  return (
    <div className={styles.videoField}>
      <div className="field">
        <label htmlFor={`video-${id}`}>Puja video link</label>
        <input
          id={`video-${id}`}
          type="url"
          value={value}
          placeholder="https://…"
          onChange={(e) => setValue(e.target.value)}
        />
      </div>
      <button
        type="button"
        className="btn btn--secondary btn--sm"
        disabled={busy || value === initial}
        onClick={() => onSave(value)}
      >
        Save link
      </button>
    </div>
  )
}
