import { useState } from 'react'
import BookingCard from '../components/BookingCard'
import { ApiError, api, type Booking } from '../lib/api'
import styles from './TrackPage.module.css'

export default function TrackPage() {
  const [ref, setRef] = useState('')
  const [mobile, setMobile] = useState('')
  const [booking, setBooking] = useState<Booking | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setBooking(null)
    try {
      const res = await api.trackBooking(ref.trim().toUpperCase(), mobile.trim())
      setBooking(res.booking)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not find that booking.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className={`section ${styles.wrap}`}>
      <div className="page">
        <p className="eyebrow">Track a booking</p>
        <h1>Where is my prasadam?</h1>
        <p className="lede">
          Enter your booking reference and the mobile number you booked with.
        </p>

        <form className={`card ${styles.form}`} onSubmit={submit} noValidate>
          <div className="field">
            <label htmlFor="track-ref">Booking reference</label>
            <input
              id="track-ref"
              value={ref}
              onChange={(e) => setRef(e.target.value.toUpperCase())}
              placeholder="SP-XXXXXX"
              autoComplete="off"
            />
          </div>
          <div className="field">
            <label htmlFor="track-mobile">Mobile number</label>
            <input
              id="track-mobile"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
              placeholder="10-digit number"
            />
          </div>
          <button type="submit" className="btn btn--primary" disabled={busy || !ref || !mobile}>
            {busy ? 'Looking…' : 'Track booking'}
          </button>
        </form>

        {error && (
          <div className={`notice notice--error ${styles.result}`} role="alert">
            {error}
          </div>
        )}
        {booking && (
          <div className={styles.result}>
            <BookingCard booking={booking} />
          </div>
        )}
      </div>
    </section>
  )
}
