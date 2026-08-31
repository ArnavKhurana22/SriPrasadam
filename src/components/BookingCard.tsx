import type { Booking } from '../lib/api'
import {
  STATUS_BLURB,
  STATUS_LABEL,
  STATUS_STEPS,
  deityImage,
  deliveryWindow,
  formatDate,
  formatTimestamp,
  rupees,
} from '../lib/format'
import styles from './BookingCard.module.css'

export default function BookingCard({ booking }: { booking: Booking }) {
  const currentIndex = STATUS_STEPS.indexOf(booking.status as (typeof STATUS_STEPS)[number])
  const cancelled = booking.status === 'cancelled'
  const awaiting = booking.status === 'pending_payment'

  return (
    <article className={`card ${styles.card}`}>
      <header className={styles.head}>
        <img src={deityImage(booking.deityId)} alt="" width={56} height={56} />
        <div className={styles.headText}>
          <h3>{booking.deityName}</h3>
          <p className="muted">
            {booking.slabTitle} · {rupees(booking.amount)}
          </p>
        </div>
        <span className={`${styles.status} ${cancelled ? styles.statusOff : ''}`}>
          {STATUS_LABEL[booking.status] ?? booking.status}
        </span>
      </header>

      <p className={styles.blurb}>{STATUS_BLURB[booking.status]}</p>

      {!cancelled && !awaiting && (
        <ol className={styles.timeline} aria-label="Booking progress">
          {STATUS_STEPS.map((step, i) => (
            <li
              key={step}
              className={i <= currentIndex ? styles.done : ''}
              aria-current={i === currentIndex ? 'step' : undefined}
            >
              <span className={styles.dot} aria-hidden="true" />
              <span className={styles.stepLabel}>{STATUS_LABEL[step]}</span>
            </li>
          ))}
        </ol>
      )}

      <dl className={styles.details}>
        <div>
          <dt>Reference</dt>
          <dd className={styles.ref}>{booking.ref}</dd>
        </div>
        <div>
          <dt>Name &amp; gotra</dt>
          <dd>
            {booking.fullName} · {booking.gotra}
          </dd>
        </div>
        <div>
          <dt>Puja date</dt>
          <dd>{formatDate(booking.pujaDate)}</dd>
        </div>
        <div>
          <dt>Delivery by</dt>
          <dd>{deliveryWindow(booking.pujaDate)}</dd>
        </div>
        <div>
          <dt>Includes</dt>
          <dd>{booking.slabItems.join(', ')}</dd>
        </div>
        <div>
          <dt>Delivering to</dt>
          <dd>
            {booking.address}, {booking.city} {booking.pincode}
          </dd>
        </div>
      </dl>

      {booking.videoUrl ? (
        <a className="btn btn--secondary btn--sm" href={booking.videoUrl} target="_blank" rel="noreferrer">
          Watch your puja video
        </a>
      ) : (
        <p className={styles.pendingVideo}>
          The puja video will appear here once the offering is made.
        </p>
      )}

      {booking.history.length > 0 && (
        <details className={styles.history}>
          <summary>Booking history</summary>
          <ul>
            {booking.history.map((entry, i) => (
              <li key={i}>
                <strong>{STATUS_LABEL[entry.status] ?? entry.status}</strong>
                <span className="muted"> — {formatTimestamp(entry.created_at)}</span>
                {entry.note && <p className="muted">{entry.note}</p>}
              </li>
            ))}
          </ul>
        </details>
      )}
    </article>
  )
}
