import { Link } from 'react-router-dom'
import { HOURS, PHONE_DISPLAY, PHONE_HREF } from '../lib/format'
import Logo from './Logo'
import styles from './Footer.module.css'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`page ${styles.inner}`}>
        <div className={styles.brandCol}>
          <div className={styles.brand}>
            <Logo size={30} />
            <strong>SriPrasadam</strong>
          </div>
          <p className="muted">
            Prasadam offered to God in puja on your behalf, in your name and gotra, and delivered to
            your door in Gurugram.
          </p>
        </div>

        <nav className={styles.col} aria-label="Footer">
          <h4>Explore</h4>
          <Link to="/pooja">Pooja &amp; Prasad</Link>
          <Link to="/events">Events</Link>
          <Link to="/my-bookings">My Bookings</Link>
          <Link to="/track">Track a Booking</Link>
        </nav>

        <div className={styles.col}>
          <h4>Reach us</h4>
          <a href={PHONE_HREF}>{PHONE_DISPLAY}</a>
          <p className="muted">{HOURS}</p>
          <p className="muted">Serving Gurugram, Haryana</p>
          <Link to="/contact">Contact us</Link>
        </div>
      </div>

      <div className={`page ${styles.legal}`}>
        <p className="muted">© {new Date().getFullYear()} SriPrasadam. All rights reserved.</p>
        <p className="muted">Payments secured by Razorpay</p>
      </div>
    </footer>
  )
}
