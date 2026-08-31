import { useState } from 'react'
import { ApiError, api } from '../lib/api'
import { useAuth } from '../lib/auth'
import styles from './OtpLogin.module.css'

export default function OtpLogin({ title, blurb }: { title: string; blurb: string }) {
  const { setUser } = useAuth()
  const [step, setStep] = useState<'mobile' | 'code'>('mobile')
  const [mobile, setMobile] = useState('')
  const [code, setCode] = useState('')
  const [devCode, setDevCode] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function sendOtp(e?: React.FormEvent) {
    e?.preventDefault()
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      setError('Enter a valid 10-digit mobile number.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const res = await api.requestOtp(mobile)
      setDevCode(res.devCode ?? null)
      setStep('code')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not send the code. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const res = await api.verifyOtp(mobile, code)
      setUser(res.user)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not verify the code. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={`card ${styles.card}`}>
      <p className="eyebrow">Sign in</p>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.blurb}>{blurb}</p>

      {step === 'mobile' ? (
        <form onSubmit={sendOtp} className={styles.form} noValidate>
          <div className="field">
            <label htmlFor="login-mobile">Mobile number</label>
            <div className={styles.phoneRow}>
              <span className={styles.prefix}>+91</span>
              <input
                id="login-mobile"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                maxLength={10}
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                placeholder="10-digit number"
              />
            </div>
          </div>
          {error && <div className="notice notice--error">{error}</div>}
          <button type="submit" className="btn btn--primary btn--block" disabled={busy}>
            {busy ? 'Sending…' : 'Send verification code'}
          </button>
        </form>
      ) : (
        <form onSubmit={verify} className={styles.form} noValidate>
          <div className="field">
            <label htmlFor="login-code">Enter the 6-digit code sent to +91 {mobile}</label>
            <input
              id="login-code"
              inputMode="numeric"
              maxLength={6}
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className={styles.codeInput}
              placeholder="••••••"
            />
          </div>
          {devCode && (
            <div className="notice notice--info">
              SMS is not connected yet — your code is <strong>{devCode}</strong>.
            </div>
          )}
          {error && <div className="notice notice--error">{error}</div>}
          <button type="submit" className="btn btn--primary btn--block" disabled={busy || code.length !== 6}>
            {busy ? 'Verifying…' : 'Verify and continue'}
          </button>
          <div className={styles.altRow}>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => {
                setStep('mobile')
                setCode('')
                setError(null)
              }}
            >
              Change number
            </button>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => void sendOtp()} disabled={busy}>
              Resend code
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
