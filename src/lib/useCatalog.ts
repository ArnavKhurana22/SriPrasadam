import { useEffect, useState } from 'react'
import { api, type Catalog } from './api'

let cache: Catalog | null = null
let inflight: Promise<Catalog> | null = null

function fetchCatalog() {
  if (cache) return Promise.resolve(cache)
  inflight ??= api.catalog().then((data) => {
    cache = data
    inflight = null
    return data
  })
  return inflight
}

/** The catalog is static per deploy, so it is fetched once and shared across pages. */
export function useCatalog() {
  const [catalog, setCatalog] = useState<Catalog | null>(cache)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (cache) return
    let cancelled = false
    fetchCatalog()
      .then((data) => {
        if (!cancelled) setCatalog(data)
      })
      .catch(() => {
        if (!cancelled) setError('We could not load the offerings. Please refresh the page.')
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { catalog, error, loading: !catalog && !error }
}
