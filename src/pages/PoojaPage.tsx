import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import DeityGrid from '../components/DeityGrid'
import SlabChooser from '../components/SlabChooser'
import type { Deity } from '../lib/api'
import { rupees } from '../lib/format'
import { useCatalog } from '../lib/useCatalog'
import styles from './PoojaPage.module.css'

export default function PoojaPage() {
  const { catalog, error, loading } = useCatalog()
  const [query, setQuery] = useState('')
  // `undefined` means the visitor has not touched the grid yet, so the deity in
  // the URL (from the home page or the events calendar) decides what is open.
  const [chosen, setChosen] = useState<Deity | null | undefined>(undefined)
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const eventId = params.get('event')
  const presetDeity = params.get('deity')

  const presetFromUrl = useMemo(() => {
    if (!catalog) return null
    const fromEvent = eventId ? catalog.events.find((e) => e.id === eventId)?.deityId : null
    const target = presetDeity ?? fromEvent
    return target ? (catalog.deities.find((d) => d.id === target) ?? null) : null
  }, [catalog, presetDeity, eventId])

  const active = chosen === undefined ? presetFromUrl : chosen

  const deities = useMemo(() => {
    if (!catalog) return []
    const q = query.trim().toLowerCase()
    if (!q) return catalog.deities
    return catalog.deities.filter((d) =>
      [d.name, d.epithet, ...d.keywords].some((v) => v.toLowerCase().includes(q)),
    )
  }, [catalog, query])

  return (
    <>
      <section className={`section ${styles.intro}`}>
        <div className="page">
          <p className="eyebrow">Pooja &amp; Prasad</p>
          <h1>Choose the God you wish to offer to</h1>
          <p className="lede">
            Select a deity, then pick your chadawa. The puja is performed in your name and gotra, a
            video is shared with you, and the prasadam reaches your home in Gurugram within 4–5 days.
          </p>

          <div className={styles.searchRow}>
            <div className={styles.search}>
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
                <path d="M16 16l4.5 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name — Ganesha, Hanuman, Lakshmi…"
                aria-label="Search for a deity by name"
              />
            </div>
            {catalog && (
              <p className={styles.count}>
                {deities.length} {deities.length === 1 ? 'deity' : 'deities'}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className={`section ${styles.gridSection}`}>
        <div className="page">
          {loading && <p className="muted">Loading the offerings…</p>}
          {error && <div className="notice notice--error">{error}</div>}
          {catalog && (
            <DeityGrid deities={deities} onSelect={setChosen} selectedId={active?.id ?? null} />
          )}
        </div>
      </section>

      {catalog && (
        <section className={`section section--wash ${styles.slabSection}`}>
          <div className="page">
            <p className="eyebrow">Chadawa &amp; Prasadam</p>
            <h2>Four ways to offer</h2>
            <p className="lede">
              Every slab includes mauli, roli and Ganga jal from the puja itself. Pick a deity above
              to book any of these.
            </p>
            <ul className={styles.slabList}>
              {catalog.slabs.map((slab) => (
                <li key={slab.id} className={`card ${styles.slabCard}`}>
                  <p className={styles.slabPrice}>{rupees(slab.amount)}</p>
                  <h3>{slab.title}</h3>
                  <ul className={styles.itemList}>
                    {slab.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  <p className={styles.slabTag}>{slab.tagline}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {active && catalog && (
        <SlabChooser
          deity={active}
          slabs={catalog.slabs}
          onClose={() => setChosen(null)}
          onConfirm={(slab) => {
            const search = new URLSearchParams({ deity: active.id, slab: slab.id })
            if (eventId) search.set('event', eventId)
            navigate(`/book?${search.toString()}`)
          }}
        />
      )}
    </>
  )
}
