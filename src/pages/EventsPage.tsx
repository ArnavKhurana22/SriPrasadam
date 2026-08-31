import { Link } from 'react-router-dom'
import { deityImage, formatDate } from '../lib/format'
import { useCatalog } from '../lib/useCatalog'
import styles from './EventsPage.module.css'

const today = new Date().toISOString().slice(0, 10)

export default function EventsPage() {
  const { catalog, error, loading } = useCatalog()

  const events = (catalog?.events ?? [])
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
  const upcoming = events.filter((e) => e.date >= today)
  const past = events.filter((e) => e.date < today).reverse()

  return (
    <>
      <section className={`section ${styles.intro}`}>
        <div className="page">
          <p className="eyebrow">Events</p>
          <h1>The puja calendar</h1>
          <p className="lede">
            On these days we perform a special puja and offer the chadawa of everyone who has booked,
            each by name and gotra. Book ahead so your offering is included.
          </p>
        </div>
      </section>

      <section className={`section ${styles.list}`}>
        <div className="page">
          {loading && <p className="muted">Loading the calendar…</p>}
          {error && <div className="notice notice--error">{error}</div>}

          {upcoming.length > 0 && (
            <ul className={styles.grid}>
              {upcoming.map((event) => {
                const deity = catalog?.deities.find((d) => d.id === event.deityId)
                return (
                  <li key={event.id} className={`card ${styles.card}`}>
                    <div className={styles.cardHead}>
                      <img src={deityImage(event.deityId)} alt="" width={48} height={48} />
                      <div>
                        <p className={styles.date}>{formatDate(event.date)}</p>
                        <h2 className={styles.name}>{event.name}</h2>
                      </div>
                    </div>
                    <p className={styles.deity}>{deity?.name ?? event.deityId}</p>
                    <p className={styles.body}>{event.description}</p>
                    <Link
                      to={`/pooja?event=${event.id}`}
                      className="btn btn--primary btn--sm"
                    >
                      Book this puja
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}

          {!loading && upcoming.length === 0 && !error && (
            <p className="muted">
              No pujas are listed right now. Please check back soon, or call us to arrange one.
            </p>
          )}

          {past.length > 0 && (
            <div className={styles.past}>
              <h2>Recently performed</h2>
              <ul className={styles.pastList}>
                {past.map((event) => (
                  <li key={event.id}>
                    <span className={styles.pastDate}>{formatDate(event.date)}</span>
                    <span>{event.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className={styles.note}>
            Festival dates follow the panchang and may shift by a day. We confirm the exact date with
            you before the puja.
          </p>
        </div>
      </section>
    </>
  )
}
