import { useEffect, useRef, useState } from 'react'
import type { Deity, Slab } from '../lib/api'
import { deityImage, rupees } from '../lib/format'
import styles from './SlabChooser.module.css'

type Props = {
  deity: Deity
  slabs: Slab[]
  onClose: () => void
  onConfirm: (slab: Slab) => void
}

export default function SlabChooser({ deity, slabs, onClose, onConfirm }: Props) {
  const [chosen, setChosen] = useState<string>(slabs[1]?.id ?? slabs[0]?.id ?? '')
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeRef.current?.focus()
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  // Escape closes; Tab is trapped inside the dialog.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
        return
      }
      if (event.key !== 'Tab' || !panelRef.current) return
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const selected = slabs.find((s) => s.id === chosen)

  return (
    <div className={styles.overlay} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="slab-title"
        ref={panelRef}
      >
        <header className={styles.head}>
          <img src={deityImage(deity.id)} alt="" width={54} height={54} className={styles.avatar} />
          <div>
            <p className="eyebrow">Choose your chadawa</p>
            <h2 id="slab-title" className={styles.title}>
              {deity.name}
            </h2>
            <p className={styles.blessing}>{deity.blessing}</p>
          </div>
          <button ref={closeRef} type="button" className={styles.close} onClick={onClose}>
            <span className="visually-hidden">Close</span>
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        <div className={styles.body}>
          <fieldset className={styles.options}>
            <legend className="visually-hidden">Select an offering</legend>
            {slabs.map((slab) => (
              <label
                key={slab.id}
                className={`${styles.option} ${chosen === slab.id ? styles.optionActive : ''}`}
              >
                <input
                  type="radio"
                  name="slab"
                  value={slab.id}
                  checked={chosen === slab.id}
                  onChange={() => setChosen(slab.id)}
                />
                <span className={styles.optionMain}>
                  <span className={styles.optionTop}>
                    <span className={styles.price}>{rupees(slab.amount)}</span>
                    <span className={styles.optionTitle}>{slab.title}</span>
                  </span>
                  <span className={styles.items}>{slab.items.join(' · ')}</span>
                  <span className={styles.tagline}>{slab.tagline}</span>
                </span>
                <span className={styles.tick} aria-hidden="true" />
              </label>
            ))}
          </fieldset>

          <p className={styles.footnote}>
            Every offering is made in your name and gotra. A video of the puja is shared with you,
            and delivery follows within 4–5 days.
          </p>
        </div>

        <footer className={styles.foot}>
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Back
          </button>
          <button
            type="button"
            className="btn btn--primary"
            disabled={!selected}
            onClick={() => selected && onConfirm(selected)}
          >
            Continue with {selected ? rupees(selected.amount) : ''}
          </button>
        </footer>
      </div>
    </div>
  )
}
