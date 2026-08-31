import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ApiError, api, type BookingInput } from '../lib/api'
import { useAuth } from '../lib/auth'
import { deityImage, deliveryWindow, formatDate, rupees } from '../lib/format'
import { payForBooking } from '../lib/razorpay'
import { useCatalog } from '../lib/useCatalog'
import styles from './BookingPage.module.css'

type Fields = {
  fullName: string
  gotra: string
  mobile: string
  address: string
  pincode: string
  pujaDate: string
  notes: string
}

const today = new Date().toISOString().slice(0, 10)

const EMPTY: Fields = {
  fullName: '',
  gotra: '',
  mobile: '',
  address: '',
  pincode: '',
  pujaDate: today,
  notes: '',
}

function validate(fields: Fields) {
  const errors: Partial<Record<keyof Fields, string>> = {}
  if (fields.fullName.trim().length < 2) errors.fullName = 'Please enter your full name.'
  if (fields.gotra.trim().length < 2) errors.gotra = 'Gotra is needed for the sankalp during the puja.'
  if (!/^[6-9]\d{9}$/.test(fields.mobile.trim())) errors.mobile = 'Enter a valid 10-digit mobile number.'
  if (fields.address.trim().length < 10) errors.address = 'Please enter a complete delivery address.'
  if (!/^\d{6}$/.test(fields.pincode.trim())) errors.pincode = 'Enter a valid 6-digit pincode.'
  else if (!/^12[23]\d{3}$/.test(fields.pincode.trim()))
    errors.pincode = 'We currently deliver only within Gurugram.'
  if (!fields.pujaDate) errors.pujaDate = 'Choose a date for the puja.'
  else if (fields.pujaDate < today) errors.pujaDate = 'Choose today or a later date.'
  return errors
}

export default function BookingPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { catalog, loading } = useCatalog()
  const { user } = useAuth()

  const deityId = params.get('deity') ?? ''
  const slabId = params.get('slab') ?? ''
  const eventId = params.get('event')

  const [fields, setFields] = useState<Fields>(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<keyof Fields, string>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState<{ ref: string; paid: boolean } | null>(null)

  const deity = catalog?.deities.find((d) => d.id === deityId)
  const slab = catalog?.slabs.find((s) => s.id === slabId)
  const event = catalog?.events.find((e) => e.id === eventId)

  // Prefill once from the signed-in account and once from the chosen festival,
  // adjusted during render so anything the visitor has typed is never overwritten.
  const [prefilledFrom, setPrefilledFrom] = useState<string | null>(null)
  const prefillKey = `${user?.mobile ?? ''}|${event?.id ?? ''}`
  if ((user || event) && prefilledFrom !== prefillKey) {
    setPrefilledFrom(prefillKey)
    setFields((prev) => ({
      ...prev,
      fullName: prev.fullName || user?.fullName || '',
      gotra: prev.gotra || user?.gotra || '',
      mobile: prev.mobile || user?.mobile || '',
      pujaDate: event && event.date >= today ? event.date : prev.pujaDate,
    }))
  }

  const missingSelection = Boolean(catalog) && (!deity || !slab)

  const summaryDate = useMemo(() => deliveryWindow(fields.pujaDate), [fields.pujaDate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!deity || !slab) return
    const found = validate(fields)
    setErrors(found)
    if (Object.keys(found).length > 0) {
      const first = document.querySelector<HTMLElement>('[aria-invalid="true"]')
      first?.focus()
      return
    }

    setSubmitting(true)
    setFormError(null)
    try {
      const payload: BookingInput = {
        deityId: deity.id,
        slabId: slab.id,
        eventId: event?.id ?? null,
        fullName: fields.fullName.trim(),
        gotra: fields.gotra.trim(),
        mobile: fields.mobile.trim(),
        address: fields.address.trim(),
        pincode: fields.pincode.trim(),
        pujaDate: fields.pujaDate,
        notes: fields.notes.trim() || undefined,
      }
      const created = await api.createBooking(payload)
      const ref = await payForBooking(created, deity.name)
      setConfirmed({ ref, paid: created.razorpayEnabled })
    } catch (err) {
      setFormError(
        err instanceof ApiError || err instanceof Error
          ? err.message
          : 'We could not complete the booking. Please try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  function set<K extends keyof Fields>(key: K, value: Fields[K]) {
    setFields((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  if (confirmed) {
    return (
      <section className={`section ${styles.confirmWrap}`}>
        <div className="page">
          <div className={`card ${styles.confirmCard}`}>
            <span className={styles.tickMark} aria-hidden="true">
              ✓
            </span>
            <p className="eyebrow">Booking confirmed</p>
            <h1>Your prasadam is booked</h1>
            <p className={styles.refLine}>
              Reference <strong>{confirmed.ref}</strong>
            </p>
            <p className="lede">
              {deity?.name} will be offered your chadawa on {formatDate(fields.pujaDate)} in the name
              of <strong>{fields.fullName}</strong>, gotra <strong>{fields.gotra}</strong>. We will
              share the puja video with you, and the prasadam reaches you between {summaryDate}.
            </p>
            {!confirmed.paid && (
              <div className="notice notice--info">
                Online payment is not enabled yet on this site. Our team will call you on +91{' '}
                {fields.mobile} to complete the payment.
              </div>
            )}
            <div className={styles.confirmActions}>
              <Link to="/my-bookings" className="btn btn--primary">
                View my bookings
              </Link>
              <Link to="/pooja" className="btn btn--secondary">
                Book another offering
              </Link>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className={`section ${styles.wrap}`}>
      <div className="page">
        <p className="eyebrow">Booking</p>
        <h1>Your details for the sankalp</h1>
        <p className="lede">
          The pandit ji takes your name and gotra during the puja, so please enter them as you would
          say them aloud.
        </p>

        {loading && <p className="muted">Loading…</p>}

        {missingSelection && (
          <div className={`notice notice--info ${styles.pickFirst}`}>
            Please choose a deity and an offering first.{' '}
            <Link to="/pooja">Go to Pooja &amp; Prasad →</Link>
          </div>
        )}

        {deity && slab && (
          <div className={styles.layout}>
            <form id="booking-form" className={styles.form} onSubmit={handleSubmit} noValidate>
              <div className="grid-form grid-form--2">
                <div className="field">
                  <label htmlFor="fullName">Full name</label>
                  <input
                    id="fullName"
                    autoComplete="name"
                    value={fields.fullName}
                    onChange={(e) => set('fullName', e.target.value)}
                    aria-invalid={errors.fullName ? 'true' : undefined}
                    aria-describedby={errors.fullName ? 'fullName-err' : undefined}
                  />
                  {errors.fullName && (
                    <span className="error" id="fullName-err">
                      {errors.fullName}
                    </span>
                  )}
                </div>

                <div className="field">
                  <label htmlFor="gotra">Gotra</label>
                  <input
                    id="gotra"
                    value={fields.gotra}
                    onChange={(e) => set('gotra', e.target.value)}
                    placeholder="e.g. Kashyap"
                    aria-invalid={errors.gotra ? 'true' : undefined}
                    aria-describedby={errors.gotra ? 'gotra-err' : 'gotra-hint'}
                  />
                  {errors.gotra ? (
                    <span className="error" id="gotra-err">
                      {errors.gotra}
                    </span>
                  ) : (
                    <span className="hint" id="gotra-hint">
                      Written on the sankalp and read out during the puja.
                    </span>
                  )}
                </div>

                <div className="field">
                  <label htmlFor="mobile">Mobile number</label>
                  <input
                    id="mobile"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    maxLength={10}
                    value={fields.mobile}
                    onChange={(e) => set('mobile', e.target.value.replace(/\D/g, ''))}
                    aria-invalid={errors.mobile ? 'true' : undefined}
                    aria-describedby={errors.mobile ? 'mobile-err' : 'mobile-hint'}
                  />
                  {errors.mobile ? (
                    <span className="error" id="mobile-err">
                      {errors.mobile}
                    </span>
                  ) : (
                    <span className="hint" id="mobile-hint">
                      Updates and the puja video are sent here.
                    </span>
                  )}
                </div>

                <div className="field">
                  <label htmlFor="pujaDate">Date of puja</label>
                  <input
                    id="pujaDate"
                    type="date"
                    min={today}
                    value={fields.pujaDate}
                    onChange={(e) => set('pujaDate', e.target.value)}
                    aria-invalid={errors.pujaDate ? 'true' : undefined}
                    aria-describedby={errors.pujaDate ? 'pujaDate-err' : undefined}
                  />
                  {errors.pujaDate && (
                    <span className="error" id="pujaDate-err">
                      {errors.pujaDate}
                    </span>
                  )}
                </div>

                <div className="field span-2">
                  <label htmlFor="address">Delivery address</label>
                  <textarea
                    id="address"
                    autoComplete="street-address"
                    value={fields.address}
                    onChange={(e) => set('address', e.target.value)}
                    placeholder="House / flat, street, sector, landmark"
                    aria-invalid={errors.address ? 'true' : undefined}
                    aria-describedby={errors.address ? 'address-err' : undefined}
                  />
                  {errors.address && (
                    <span className="error" id="address-err">
                      {errors.address}
                    </span>
                  )}
                </div>

                <div className="field">
                  <label htmlFor="pincode">Pincode</label>
                  <input
                    id="pincode"
                    inputMode="numeric"
                    maxLength={6}
                    autoComplete="postal-code"
                    value={fields.pincode}
                    onChange={(e) => set('pincode', e.target.value.replace(/\D/g, ''))}
                    aria-invalid={errors.pincode ? 'true' : undefined}
                    aria-describedby={errors.pincode ? 'pincode-err' : 'pincode-hint'}
                  />
                  {errors.pincode ? (
                    <span className="error" id="pincode-err">
                      {errors.pincode}
                    </span>
                  ) : (
                    <span className="hint" id="pincode-hint">
                      We deliver within Gurugram only.
                    </span>
                  )}
                </div>

                <div className="field">
                  <label htmlFor="city">City</label>
                  <input id="city" value="Gurugram" readOnly aria-readonly="true" />
                </div>

                <div className="field span-2">
                  <label htmlFor="notes">Anything you would like mentioned in the prayer (optional)</label>
                  <textarea
                    id="notes"
                    value={fields.notes}
                    onChange={(e) => set('notes', e.target.value)}
                    maxLength={300}
                    placeholder="A wish, a family member's name, or a special request"
                  />
                </div>
              </div>

              {formError && (
                <div className="notice notice--error" role="alert">
                  {formError}
                </div>
              )}

              <p className={styles.terms}>
                By booking you agree that the puja is performed on the chosen date and the prasadam is
                delivered within 4–5 days after it.
              </p>
            </form>

            <aside className={styles.summary}>
              <div className={`card ${styles.summaryCard}`}>
                <div className={styles.summaryHead}>
                  <img src={deityImage(deity.id)} alt="" width={52} height={52} />
                  <div>
                    <p className="eyebrow">Your offering</p>
                    <h2 className={styles.summaryTitle}>{deity.name}</h2>
                  </div>
                </div>

                {event && <p className={`chip ${styles.eventChip}`}>{event.name}</p>}

                <dl className={styles.summaryList}>
                  <div>
                    <dt>Chadawa</dt>
                    <dd>{slab.title}</dd>
                  </div>
                  <div>
                    <dt>Includes</dt>
                    <dd>{slab.items.join(', ')}</dd>
                  </div>
                  <div>
                    <dt>Puja date</dt>
                    <dd>{formatDate(fields.pujaDate)}</dd>
                  </div>
                  <div>
                    <dt>Delivery by</dt>
                    <dd>{summaryDate}</dd>
                  </div>
                </dl>

                <div className={styles.total}>
                  <span>Total payable</span>
                  <strong>{rupees(slab.amount)}</strong>
                </div>

                <button
                  type="submit"
                  form="booking-form"
                  className="btn btn--primary btn--block"
                  disabled={submitting}
                >
                  {submitting ? 'Please wait…' : `Pay ${rupees(slab.amount)} securely`}
                </button>

                <button
                  type="button"
                  className={`btn btn--ghost btn--block ${styles.changeBtn}`}
                  onClick={() => navigate('/pooja')}
                >
                  Change deity or offering
                </button>
              </div>
            </aside>
          </div>
        )}
      </div>
    </section>
  )
}
