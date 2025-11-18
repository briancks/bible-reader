import { useEffect, useState } from 'react'

import type { BibleBook, TranslationDefinition } from '../types'

const STORAGE_VERSION = 'v1'

const cacheKey = (translationId: string) =>
  `bible-data-${translationId}-${STORAGE_VERSION}`

type UseBibleDataResult = {
  booksByTranslation: Record<string, BibleBook[]>
  loading: boolean
  error: string | null
  reload: () => void
}

const sanitizeJson = (text: string) => text.replace(/^\uFEFF/, '')

const readCache = (key: string) => {
  if (typeof window === 'undefined') {
    return null
  }
  try {
    return window.localStorage.getItem(key)
  } catch (err) {
    console.warn('Unable to read cached translation data', err)
    return null
  }
}

const writeCache = (key: string, payload: BibleBook[]) => {
  if (typeof window === 'undefined') {
    return
  }
  try {
    window.localStorage.setItem(key, JSON.stringify(payload))
  } catch (err) {
    console.warn('Unable to cache translation data', err)
  }
}

async function fetchTranslation(def: TranslationDefinition): Promise<BibleBook[]> {
  const response = await fetch(def.sourceUrl)
  if (!response.ok) {
    throw new Error(`Unable to load ${def.shortName}`)
  }
  const raw = await response.text()
  return JSON.parse(sanitizeJson(raw)) as BibleBook[]
}

export function useBibleData(
  definitions: TranslationDefinition[],
): UseBibleDataResult {
  const [booksByTranslation, setBooksByTranslation] = useState<
    Record<string, BibleBook[]>
  >({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadFlag, setReloadFlag] = useState(0)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const entries = await Promise.all(
          definitions.map(async (definition) => {
            const key = cacheKey(definition.id)
            const cached = readCache(key)

            if (cached) {
              try {
                return [definition.id, JSON.parse(cached) as BibleBook[]] as const
              } catch (parseErr) {
                console.warn('Invalid cached bible data, clearing entry', parseErr)
                if (typeof window !== 'undefined') {
                  window.localStorage.removeItem(key)
                }
              }
            }

            const books = await fetchTranslation(definition)
            writeCache(key, books)

            return [definition.id, books] as const
          }),
        )

        if (!cancelled) {
          setBooksByTranslation(Object.fromEntries(entries))
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : 'Unable to load translations'
          setError(message)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [definitions, reloadFlag])

  const reload = () => setReloadFlag((flag) => flag + 1)

  return { booksByTranslation, loading, error, reload }
}
