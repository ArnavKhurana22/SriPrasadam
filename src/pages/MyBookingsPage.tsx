import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import BookingCard from '../components/BookingCard'
import OtpLogin from '../components/OtpLogin'
import { ApiError, api, type Booking } from '../lib/api'
import { useAuth } from '../lib/auth'
import styles from './MyBookingsPage.module.css'

export default function MyBookingsPage() {
  const { user, loading: authLoading, signOut } = useAuth()
  const [bookings, setBookings] = useState<Booking[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    api
      .myBookings()
      .then((res) => {
        if (!cancelled) setBookings(res.bookings)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Could not load your bookings.')
      })
    return () => {
      cancelled = true
    }
  }, [user])

  // Signing out clears the view without needing to reset the fetched list.
  const visible = user ? bookings : null

  return (
    <section className={`section ${styles.wrap}`}>
      <div className="page">
        <div className={styles.head}>
          <div>
            <p className="eyebrow">My Bookings</p>
            <h1>Your offerings and their journey</h1>
            <p className="lede">
              Every booking you have made, the puja video once it is ready, and where your prasadam
              has reached.
            </p>
          </div>
          {user && (
            <div className={styles.account}>
              <p className="muted">+91 {user.mobile}</p>
              <button type="button" className="btn btn--secondary btn--sm" onClick={() => void signOut()}>
                Sign out
              </button>
            </div>
          )}
        </div>

        {authLoading && <p className="muted">Loading…</p>}

        {!authLoading && !user && (
          <div className={styles.loginWrap}>
            <OtpLogin
              title="Sign in with your mobile number"
              blurb="We will send a 6-digit code. Any booking made with this number will appear here."
            />
            <p className={styles.trackHint}>
              Booked without signing in? You can also{' '}
              <Link to="/track">track a booking with its reference</Link>.
            </p>
          </div>
        )}

        {user && error && <div className="notice notice--error">{error}</div>}

        {user && visible && visible.length === 0 && (
          <div className={`card ${styles.empty}`}>
            <h2>No bookings yet</h2>
            <p className="muted">
              When you book a prasadam offering, it will show up here with its full status.
            </p>
            <Link to="/pooja" className="btn btn--primary">
              Book your first offering
            </Link>
          </div>
        )}

        {user && visible && visible.length > 0 && (
          <div className={styles.list}>
            {visible.map((booking) => (
              <BookingCard key={booking.ref} booking={booking} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
