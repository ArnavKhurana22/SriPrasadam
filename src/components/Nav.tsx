import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { PHONE_DISPLAY, PHONE_HREF } from '../lib/format'
import Logo from './Logo'
import styles from './Nav.module.css'

const LINKS = [
  { to: '/pooja', label: 'Pooja & Prasad' },
  { to: '/events', label: 'Events' },
  { to: '/my-bookings', label: 'My Bookings' },
  { to: '/contact', label: 'Contact' },
]

export default function Nav() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const { user } = useAuth()

  // Close the menu when the route changes, adjusted during render rather than
  // in an effect so no extra paint shows the stale open menu.
  const [lastPath, setLastPath] = useState(pathname)
  if (lastPath !== pathname) {
    setLastPath(pathname)
    setOpen(false)
  }

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <header className={styles.header}>
      <div className={`page ${styles.bar}`}>
        <Link to="/" className={styles.brand} aria-label="SriPrasadam home">
          <Logo />
          <span>
            <strong>SriPrasadam</strong>
            <em>Prasad, offered and delivered</em>
          </span>
        </Link>

        <nav className={styles.desktopNav} aria-label="Primary">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => (isActive ? `${styles.link} ${styles.active}` : styles.link)}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className={styles.actions}>
          <a className={styles.phone} href={PHONE_HREF}>
            {PHONE_DISPLAY}
          </a>
          <Link to="/pooja" className="btn btn--primary btn--sm">
            Book Prasadam
          </Link>
          <button
            type="button"
            className={styles.toggle}
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="visually-hidden">{open ? 'Close menu' : 'Open menu'}</span>
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
              {open ? (
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div className={styles.mobileNav} id="mobile-nav">
          <nav aria-label="Primary mobile">
            {LINKS.map((link) => (
              <NavLink key={link.to} to={link.to} className={styles.mobileLink}>
                {link.label}
              </NavLink>
            ))}
            <NavLink to="/track" className={styles.mobileLink}>
              Track a Booking
            </NavLink>
          </nav>
          <div className={styles.mobileFoot}>
            {user && <p className="muted">Signed in as +91 {user.mobile}</p>}
            <a href={PHONE_HREF} className="btn btn--secondary btn--block">
              Call {PHONE_DISPLAY}
            </a>
          </div>
        </div>
      )}
    </header>
  )
}
