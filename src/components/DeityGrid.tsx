import type { Deity } from '../lib/api'
import { deityImage } from '../lib/format'
import styles from './DeityGrid.module.css'

type Props = {
  deities: Deity[]
  onSelect: (deity: Deity) => void
  selectedId?: string | null
}

export default function DeityGrid({ deities, onSelect, selectedId }: Props) {
  if (deities.length === 0) {
    return (
      <p className={styles.empty}>
        No deity matched that name. Try another spelling, or call us and we will help you choose.
      </p>
    )
  }

  return (
    <ul className={styles.grid}>
      {deities.map((deity) => (
        <li key={deity.id}>
          <button
            type="button"
            className={`${styles.card} ${selectedId === deity.id ? styles.selected : ''}`}
            onClick={() => onSelect(deity)}
            aria-label={`Choose ${deity.name} and see the offerings`}
          >
            <span className={styles.frame}>
              <img src={deityImage(deity.id)} alt="" width={200} height={200} loading="lazy" />
            </span>
            <span className={styles.name}>{deity.name}</span>
            <span className={styles.epithet}>{deity.epithet}</span>
          </button>
        </li>
      ))}
    </ul>
  )
}
