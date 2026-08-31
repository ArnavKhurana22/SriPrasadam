import { Link } from 'react-router-dom'
import DeityGrid from '../components/DeityGrid'
import { HOURS, PHONE_DISPLAY, PHONE_HREF, formatDate, rupees } from '../lib/format'
import { useCatalog } from '../lib/useCatalog'
import { useNavigate } from 'react-router-dom'
import styles from './HomePage.module.css'

const STEPS = [
  {
    n: '01',
    title: 'Choose your God',
    body: 'Pick the deity you wish to offer to, and the chadawa that feels right — from ₹101 to ₹1100.',
  },
  {
    n: '02',
    title: 'Give your sankalp',
    body: 'Your name and gotra go with the offering, so the prayer is made on your behalf.',
  },
  {
    n: '03',
    title: 'The puja is performed',
    body: 'Your chadawa is offered on the date you chose, and a video of the puja is shared with you.',
  },
  {
    n: '04',
    title: 'Prasadam reaches you',
    body: 'The blessed prasadam is delivered to your home in Gurugram within 4–5 days.',
  },
]

export default function HomePage() {
  const { catalog } = useCatalog()
  const navigate = useNavigate()
  const upcoming = catalog?.events
    .filter((e) => e.date >= new Date().toISOString().slice(0, 10))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3)

  return (
    <>
      {/* ---------- hero ---------- */}
      <section className={styles.hero}>
        <div className={`page ${styles.heroInner}`}>
          <div className={styles.heroText}>
            <p className="eyebrow">Gurugram · Puja and prasadam delivery</p>
            <h1>
              Offer your prayer today.
              <span className={styles.heroAccent}> Receive the blessing at home.</span>
            </h1>
            <p className="lede">
              We perform the puja in your name and gotra, offer your chadawa at the feet of the God
              you choose, and deliver the blessed prasadam to your door within 4–5 days.
            </p>
            <div className={styles.heroActions}>
              <Link to="/pooja" className="btn btn--primary">
                Book prasadam
              </Link>
              <Link to="/events" className="btn btn--secondary">
                See upcoming pujas
              </Link>
            </div>
            <ul className={styles.assurances}>
              <li>Video of your puja</li>
              <li>Name &amp; gotra in the sankalp</li>
              <li>Delivery in 4–5 days</li>
            </ul>
          </div>

          <div className={styles.heroAside} aria-hidden="true">
            <div className={styles.thali}>
              <div className={styles.thaliRing} />
              <div className={styles.thaliRingInner} />
              <span className={styles.om}>ॐ</span>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- mission ---------- */}
      <section className={`section ${styles.mission}`}>
        <div className={`page ${styles.missionInner}`}>
          <div>
            <p className="eyebrow">Our thought</p>
            <h2>A few minutes in the service of God</h2>
          </div>
          <div className={styles.missionBody}>
            <p>
              In order to maintain inner peace and well being it is important to spend a few minutes
              or hours in the service of God, thereby achieving success in the current world and in
              the next world where we will go once we leave this world after completing our lifespan.
            </p>
            <p>
              Currently we are living in a modern world where many people feel that worldly greed,
              conflict and the loss of values match ancient predictions of Kalyug. On the other side,
              modern human rights, scientific progress and global connectivity show that humanity is
              thriving rather than purely declining.
            </p>
            <p>
              Promoting bhakti — which is important for individual self-liberation, inner peace and
              well being — includes your family as well as your friends and the whole community. Let
              us join together and help individuals offer their prayer to God and take godly
              blessings from the supreme power through regular worship, bhakti and sadhana.
            </p>
            <p className={styles.missionPull}>
              Our mission at SriPrasadam is that all human beings living in this world should bow in
              front of God through puja or the offering of food, receive the pure blessings of the
              supreme power, and attain inner peace and mental well being — for themselves and for
              the whole community.
            </p>
          </div>
        </div>
      </section>

      {/* ---------- how it works ---------- */}
      <section className={`section section--wash ${styles.steps}`}>
        <div className="page">
          <p className="eyebrow">How it works</p>
          <h2>From your sankalp to your doorstep</h2>
          <ol className={styles.stepList}>
            {STEPS.map((step) => (
              <li key={step.n} className={styles.step}>
                <span className={styles.stepNum}>{step.n}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------- deities ---------- */}
      <section className={`section ${styles.deities}`}>
        <div className="page">
          <div className={styles.sectionHead}>
            <div>
              <p className="eyebrow">Choose a God</p>
              <h2>Where would you like your offering to go?</h2>
            </div>
            <Link to="/pooja" className="btn btn--secondary btn--sm">
              View all
            </Link>
          </div>
          {catalog && (
            <DeityGrid
              deities={catalog.deities.slice(0, 6)}
              onSelect={(deity) => navigate(`/pooja?deity=${deity.id}`)}
            />
          )}
        </div>
      </section>

      {/* ---------- slabs ---------- */}
      {catalog && (
        <section className={`section ${styles.pricing}`}>
          <div className="page">
            <p className="eyebrow">Chadawa &amp; prasadam</p>
            <h2>Four offerings, one intention</h2>
            <p className="lede">Mauli, roli and Ganga jal from the puja come with every offering.</p>
            <ul className={styles.priceList}>
              {catalog.slabs.map((slab) => (
                <li key={slab.id} className={`card ${styles.priceCard}`}>
                  <p className={styles.price}>{rupees(slab.amount)}</p>
                  <h3>{slab.title}</h3>
                  <ul>
                    {slab.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  <Link to="/pooja" className="btn btn--secondary btn--sm">
                    Choose a God
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ---------- upcoming ---------- */}
      {upcoming && upcoming.length > 0 && (
        <section className={`section section--wash ${styles.events}`}>
          <div className="page">
            <div className={styles.sectionHead}>
              <div>
                <p className="eyebrow">Upcoming</p>
                <h2>Pujas we are preparing for</h2>
              </div>
              <Link to="/events" className="btn btn--secondary btn--sm">
                Full calendar
              </Link>
            </div>
            <ul className={styles.eventList}>
              {upcoming.map((event) => (
                <li key={event.id} className={`card ${styles.eventCard}`}>
                  <p className={styles.eventDate}>{formatDate(event.date)}</p>
                  <h3>{event.name}</h3>
                  <p className="muted">{event.description}</p>
                  <Link to={`/book?deity=${event.deityId}&slab=251&event=${event.id}`} className="btn btn--secondary btn--sm">
                    Book this puja
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ---------- closing ---------- */}
      <section className={`section ${styles.closing}`}>
        <div className="page">
          <div className={styles.closingCard}>
            <h2>Prefer to book over a call?</h2>
            <p className="lede">
              Call us on {PHONE_DISPLAY}, {HOURS}. We will take your details and place the booking
              for you.
            </p>
            <div className={styles.closingActions}>
              <a href={PHONE_HREF} className="btn btn--primary">
                Call {PHONE_DISPLAY}
              </a>
              <Link to="/contact" className="btn btn--secondary">
                Send a message
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
