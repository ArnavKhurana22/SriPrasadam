import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError, api } from '../lib/api'
import { HOURS, PHONE_DISPLAY, PHONE_HREF } from '../lib/format'
import styles from './ContactPage.module.css'

type Fields = { name: string; mobile: string; email: string; message: string }

const EMPTY: Fields = { name: '', mobile: '', email: '', message: '' }

export default function ContactPage() {
  const [fields, setFields] = useState<Fields>(EMPTY)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!/^[6-9]\d{9}$/.test(fields.mobile)) {
      setError('Enter a valid 10-digit mobile number.')
      return
    }
    if (fields.message.trim().length < 5) {
      setError('Please write your message.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await api.sendMessage({
        name: fields.name.trim(),
        mobile: fields.mobile.trim(),
        email: fields.email.trim() || undefined,
        message: fields.message.trim(),
      })
      setSent(true)
      setFields(EMPTY)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not send your message. Please call us instead.')
    } finally {
      setBusy(false)
    }
  }

  function set<K extends keyof Fields>(key: K, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <section className={`section ${styles.wrap}`}>
      <div className="page">
        <p className="eyebrow">Contact us</p>
        <h1>We are here to help you offer</h1>
        <p className="lede">
          Call us to book over the phone, ask about a booking, or request a puja we have not listed.
        </p>

        <div className={styles.layout}>
          <div className={styles.info}>
            <div className={`card ${styles.infoCard}`}>
              <h2>Phone</h2>
              <a href={PHONE_HREF} className={styles.phone}>
                {PHONE_DISPLAY}
              </a>
              <p className="muted">{HOURS}</p>
            </div>

            <div className={`card ${styles.infoCard}`}>
              <h2>Service area</h2>
              <p>Gurugram, Haryana</p>
              <p className="muted">
                We deliver within Gurugram at present. If you are elsewhere, call us — we will tell
                you when we reach your city.
              </p>
            </div>

            <div className={`card ${styles.infoCard}`}>
              <h2>Existing booking</h2>
              <p className="muted">
                Track your prasadam with its reference number, or sign in to see everything you have
                booked.
              </p>
              <div className={styles.infoActions}>
                <Link to="/track" className="btn btn--secondary btn--sm">
                  Track a booking
                </Link>
                <Link to="/my-bookings" className="btn btn--secondary btn--sm">
                  My bookings
                </Link>
              </div>
            </div>
          </div>

          <form className={`card ${styles.form}`} onSubmit={submit} noValidate>
            <h2>Send us a message</h2>
            {sent ? (
              <div className="notice notice--info" role="status">
                Thank you — we have your message and will call you back during working hours.
              </div>
            ) : (
              <>
                <div className="field">
                  <label htmlFor="c-name">Your name</label>
                  <input
                    id="c-name"
                    autoComplete="name"
                    value={fields.name}
                    onChange={(e) => set('name', e.target.value)}
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="c-mobile">Mobile number</label>
                  <input
                    id="c-mobile"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    autoComplete="tel-national"
                    value={fields.mobile}
                    onChange={(e) => set('mobile', e.target.value.replace(/\D/g, ''))}
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="c-email">Email (optional)</label>
                  <input
                    id="c-email"
                    type="email"
                    autoComplete="email"
                    value={fields.email}
                    onChange={(e) => set('email', e.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor="c-message">Your message</label>
                  <textarea
                    id="c-message"
                    value={fields.message}
                    onChange={(e) => set('message', e.target.value)}
                    maxLength={1000}
                    required
                  />
                </div>
                {error && (
                  <div className="notice notice--error" role="alert">
                    {error}
                  </div>
                )}
                <button type="submit" className="btn btn--primary" disabled={busy}>
                  {busy ? 'Sending…' : 'Send message'}
                </button>
              </>
            )}
          </form>
        </div>
      </div>
    </section>
  )
}
