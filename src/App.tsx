import type { DragEvent as ReactDragEvent } from 'react'
import { Fragment, useEffect, useMemo, useState } from 'react'
import './App.css'
import { translationDefinitions } from './data/translations'
import { FisheyeMenu } from './components/FisheyeMenu'
import { useBibleData } from './hooks/useBibleData'
import type { RecentLocation, TabState, VerseLocation } from './types'

const MAX_TRANSLATIONS = 3
const canonicalTranslationId = translationDefinitions[0].id

const initialTab: TabState = {
  id: 'tab-1',
  location: { bookIndex: 0, chapterIndex: 0, verseIndex: null },
  translations: translationDefinitions.slice(0, 2).map((translation) => translation.id),
}

const makeLocationKey = (location: VerseLocation) =>
  `${location.bookIndex}-${location.chapterIndex}-${location.verseIndex ?? 'all'}`

const escapeRegExp = (input: string) => input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const formatLocation = (location: VerseLocation, bookName?: string) => {
  const chapterLabel = location.chapterIndex + 1
  const verseLabel = location.verseIndex != null ? `:${location.verseIndex + 1}` : ''
  return `${bookName ?? 'Book'} ${chapterLabel}${verseLabel}`
}

type VerseStackTarget = {
  key: string
  location: VerseLocation
  label: string
}

function App() {
  const { booksByTranslation, loading, error, reload } = useBibleData(translationDefinitions)
  const canonicalBooks = booksByTranslation[canonicalTranslationId] ?? []
  const [activeTab, setActiveTab] = useState<TabState>(initialTab)
  const [searchTerm, setSearchTerm] = useState('')
  const [recent, setRecent] = useState<RecentLocation[]>([])
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [fontSize, setFontSize] = useState(16)
  const [showFisheye, setShowFisheye] = useState(true)
  const [draggingRecent, setDraggingRecent] = useState<string | null>(null)
  const [selectedRecentKeys, setSelectedRecentKeys] = useState<string[]>([])

  const verseSelected = activeTab.location.verseIndex != null

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    document.documentElement.style.setProperty('--reader-font-size', `${fontSize}px`)
  }, [fontSize])

  const buildVerseRowsForLocation = (location: VerseLocation) => {
    const clampedLocation = clampLocation(location)
    const translationData = activeTab.translations.map((translationId) => {
      const translation = translationDefinitions.find(
        (definition) => definition.id === translationId,
      )
      const books = booksByTranslation[translationId]
      const chapter =
        books?.[clampedLocation.bookIndex]?.chapters[clampedLocation.chapterIndex] ?? []
      return { translationId, translation, chapter }
    })
    const verseCount = translationData.reduce(
      (max, entry) => Math.max(max, entry.chapter.length),
      0,
    )
    return Array.from({ length: verseCount }, (_, index) => ({
      verseIndex: index,
      entries: translationData.map((entry) => ({
        translationId: entry.translationId,
        translation: entry.translation,
        text: entry.chapter[index],
      })),
    }))
  }

  useEffect(() => {
    if (verseSelected) {
      setShowFisheye(false)
    }
  }, [verseSelected])



  const clampLocation = (location: VerseLocation): VerseLocation => {
    if (!canonicalBooks.length) {
      return location
    }

    const safeBookIndex = Math.min(
      canonicalBooks.length - 1,
      Math.max(0, location.bookIndex),
    )
    const book = canonicalBooks[safeBookIndex]
    const chapterCount = Math.max(1, book?.chapters.length ?? 1)
    const safeChapterIndex = Math.min(
      chapterCount - 1,
      Math.max(0, location.chapterIndex),
    )
    const verses = book?.chapters[safeChapterIndex] ?? []
    const safeVerseIndex =
      location.verseIndex == null || verses.length === 0
        ? null
        : Math.min(Math.max(location.verseIndex, 0), verses.length - 1)

    return {
      bookIndex: safeBookIndex,
      chapterIndex: safeChapterIndex,
      verseIndex: safeVerseIndex,
    }
  }

  const registerRecent = (location: VerseLocation) => {
    const key = makeLocationKey(location)
    setRecent((prev) => {
      const nextEntries = [
        { key, location, timestamp: Date.now() },
        ...prev.filter((entry) => entry.key !== key),
      ].slice(0, 10)
      setSelectedRecentKeys(() => [key])
      return nextEntries
    })
  }

  const reorderRecents = (fromKey: string, toKey: string) => {
    setRecent((items) => {
      const fromIndex = items.findIndex((entry) => entry.key === fromKey)
      const toIndex = items.findIndex((entry) => entry.key === toKey)
      if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
        return items
      }
      const updated = [...items]
      const [moved] = updated.splice(fromIndex, 1)
      updated.splice(toIndex, 0, moved)
      const orderedKeys = updated.map((entry) => entry.key)
      setSelectedRecentKeys((prevSelected) =>
        prevSelected
          .filter((key) => orderedKeys.includes(key))
          .sort((a, b) => orderedKeys.indexOf(a) - orderedKeys.indexOf(b)),
      )
      return updated
    })
  }

  const updateTabLocation = (_tabId: string, changes: Partial<VerseLocation>) => {
    setActiveTab((prevTab) => {
      const nextBookIndex = changes.bookIndex ?? prevTab.location.bookIndex
      const hasChapterChange = changes.chapterIndex !== undefined
      const hasBookChange = changes.bookIndex !== undefined
      const nextChapterIndex = hasChapterChange
        ? changes.chapterIndex!
        : hasBookChange
          ? 0
          : prevTab.location.chapterIndex
      const shouldResetVerse =
        changes.verseIndex === undefined && (hasChapterChange || hasBookChange)
      const nextVerseIndex =
        changes.verseIndex !== undefined
          ? changes.verseIndex
          : shouldResetVerse
            ? 0
            : prevTab.location.verseIndex

      const proposed: VerseLocation = {
        bookIndex: nextBookIndex,
        chapterIndex: nextChapterIndex,
        verseIndex: nextVerseIndex,
      }

      const clamped = clampLocation(proposed)
      registerRecent(clamped)
      return { ...prevTab, location: clamped }
    })
  }

  const toggleTranslation = (_tabId: string, translationId: string) => {
    setActiveTab((prevTab) => {
      const isActive = prevTab.translations.includes(translationId)
      if (isActive) {
        if (prevTab.translations.length === 1) {
          return prevTab
        }
        return {
          ...prevTab,
          translations: prevTab.translations.filter((id) => id !== translationId),
        }
      }

      if (prevTab.translations.length >= MAX_TRANSLATIONS) {
        return prevTab
      }

      return { ...prevTab, translations: [...prevTab.translations, translationId] }
    })
  }

  const toggleRecentSelection = (key: string) => {
    setSelectedRecentKeys((prevSelected) => {
      if (prevSelected.includes(key)) {
        return prevSelected.filter((selectedKey) => selectedKey !== key)
      }
      const orderedKeys = recent.map((entry) => entry.key)
      const getOrder = (candidate: string) => {
        const index = orderedKeys.indexOf(candidate)
        return index === -1 ? Number.MAX_SAFE_INTEGER : index
      }
      const next = [...prevSelected, key]
      return next.sort((a, b) => getOrder(a) - getOrder(b))
    })
  }

  const handleRecentDragStart = (
    event: ReactDragEvent<HTMLButtonElement>,
    key: string,
  ) => {
    setDraggingRecent(key)
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', key)
  }

  const handleRecentDragOver = (
    event: ReactDragEvent<HTMLButtonElement>,
    targetKey: string,
  ) => {
    event.preventDefault()
    if (draggingRecent && draggingRecent !== targetKey) {
      reorderRecents(draggingRecent, targetKey)
    }
  }

  const handleRecentDrop = (event: ReactDragEvent) => {
    event.preventDefault()
    setDraggingRecent(null)
  }

  const handleRecentDragEnd = () => setDraggingRecent(null)

  const removeRecent = (key: string) => {
    setRecent((items) => items.filter((entry) => entry.key !== key))
    setSelectedRecentKeys((prev) => prev.filter((selectedKey) => selectedKey !== key))
  }

  const bookList = canonicalBooks
  const searchResults = useMemo(() => {
    const trimmed = searchTerm.trim()
    if (!bookList.length || trimmed.length < 2) {
      return []
    }
    const query = trimmed.toLowerCase()
    const matches: {
      location: VerseLocation
      text: string
    }[] = []

    bookList.forEach((book, bookIndex) => {
      book.chapters.forEach((chapter, chapterIndex) => {
        chapter.forEach((verse, verseIndex) => {
          if (verse.toLowerCase().includes(query)) {
            matches.push({
              location: { bookIndex, chapterIndex, verseIndex },
              text: verse,
            })
          }
        })
      })
    })

    return matches.slice(0, 50)
  }, [bookList, searchTerm])

  const highlightedText = (text: string) => {
    const trimmed = searchTerm.trim()
    if (!trimmed) {
      return text
    }
    const safe = escapeRegExp(trimmed)
    const regex = new RegExp(`(${safe})`, 'ig')
    const parts = text.split(regex)
    return parts.map((part, index) => {
      const key = `${part}-${index}`
      if (part.toLowerCase() === trimmed.toLowerCase()) {
        return (
          <mark key={key}>
            {part}
          </mark>
        )
      }
      return <Fragment key={key}>{part}</Fragment>
    })
  }

  const handleSearchNavigate = (location: VerseLocation) => {
    if (!activeTab) {
      return
    }
    updateTabLocation(activeTab.id, location)
  }

  const recentItems = recent.map((entry) => {
    const bookName = bookList[entry.location.bookIndex]?.name
    return {
      ...entry,
      label: formatLocation(entry.location, bookName),
      selected: selectedRecentKeys.includes(entry.key),
    }
  })

  const selectedRecentEntries: VerseStackTarget[] = selectedRecentKeys
    .map((key) => recentItems.find((entry) => entry.key === key))
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
    .map((entry) => ({
      key: entry.key,
      location: entry.location,
      label: entry.label,
    }))

  const fallbackTarget: VerseStackTarget[] =
    !selectedRecentEntries.length && verseSelected
      ? [
          {
            key: makeLocationKey(activeTab.location),
            location: activeTab.location,
            label: formatLocation(
              activeTab.location,
              bookList[activeTab.location.bookIndex]?.name,
            ),
          },
        ]
      : []

  const verseStackTargets: VerseStackTarget[] = selectedRecentEntries.length
    ? selectedRecentEntries
    : fallbackTarget

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Bible browser</p>
          <h1>Parallel Bible Reader</h1>
          <p className="subtitle">
            Jump to any passage, keep multiple tabs open, and compare up to three translations
            side by side.
          </p>
        </div>
        <div className="search-box">
          <input
            type="search"
            placeholder='Search for text, e.g. "in the beginning"'
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
      </header>

      <div className="layout">
        <section className="workspace">

          <div className="tab-content">
            {error && (
              <div className="status callout error">
                <p>{error}</p>
                <button onClick={reload}>Try again</button>
              </div>
            )}
            {!error && loading && (
              <div className="status callout muted">
                <p>Loading translations...</p>
              </div>
            )}

            <div className="navigation-panel">
              <div className="section-header">
                <h3>Navigate</h3>
                <div className="fisheye-controls">
                  <p>Glide from books to chapters to verses with a cascading hover.</p>
                  <button
                    className="ghost"
                    type="button"
                    aria-label={showFisheye ? 'Collapse navigator' : 'Expand navigator'}
                    onClick={() => setShowFisheye((state) => !state)}
                  >
                    {showFisheye ? '-' : '+'}
                  </button>
                </div>
              </div>
              {showFisheye && (
                <div className="fisheye-wrapper">
                  <FisheyeMenu
                    books={bookList}
                    location={activeTab.location}
                    onNavigate={handleSearchNavigate}
                  />
                </div>
              )}
            </div>

            <div className="recent-inline">
              <div className="recent-inline-header">
                <h4>Recently viewed</h4>
                {!recentItems.length && (
                  <p className="muted">Navigate or search to populate this list.</p>
                )}
              </div>
              {recentItems.length > 0 && (
                <div className="recent-inline-list">
                  {recentItems.map((entry) => (
                    <button
                      type="button"
                      key={entry.key}
                      draggable
                      onDragStart={(event) => handleRecentDragStart(event, entry.key)}
                      onDragOver={(event) => handleRecentDragOver(event, entry.key)}
                      onDrop={handleRecentDrop}
                      onDragEnd={handleRecentDragEnd}
                      className={`${draggingRecent === entry.key ? 'dragging' : ''} ${entry.selected ? 'selected' : ''}`}
                      aria-grabbed={draggingRecent === entry.key}
                      aria-pressed={entry.selected}
                      title={entry.label}
                      onClick={() => toggleRecentSelection(entry.key)}
                    >
                      <span
                        className="recent-remove"
                        role="button"
                        aria-label={`Remove ${entry.label}`}
                        onClick={(event) => {
                          event.stopPropagation()
                          removeRecent(entry.key)
                        }}
                      >
                        ×
                      </span>
                      <span className="recent-label">{entry.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {!verseSelected && (
              <div className="status callout muted">
                <p>Select a verse from the navigator to start reading.</p>
              </div>
            )}

            {verseStackTargets.length > 0 && (
              <div className="verse-stack-group">
                {verseStackTargets.map((target) => {
                  const rows = buildVerseRowsForLocation(target.location)
                  return (
                    <div key={target.key} className="verse-stack-block">
                      <div className="verse-stack-block-header">
                        <h4>{target.label}</h4>
                      </div>
                      <div className="verse-stack">
                        {rows.map((row) => {
                          const rowTranslations = row.entries.filter((entry) => entry.text)
                          if (!rowTranslations.length) {
                            return null
                          }
                          const isActive = target.location.verseIndex === row.verseIndex
                          return (
                            <div
                              key={`${target.key}-${row.verseIndex}`}
                              className={`verse-stack-row ${isActive ? 'selected' : ''}`}
                            >
                              <span className="verse-stack-number">{row.verseIndex + 1}</span>
                              <div className="verse-stack-translations">
                        {rowTranslations.map((entry) => {
                          const accent = entry.translation?.color ?? '#4c63ed'
                          return (
                            <article
                              key={`${target.key}-${entry.translationId}-${row.verseIndex}`}
                              className="verse-stack-entry"
                              style={{ borderColor: accent, color: accent }}
                            >
                              <p style={{ color: '#23263b' }}>{entry.text}</p>
                            </article>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </section>

        <aside className="side-panel">
          <section>
            <h2>Settings</h2>
            <div className="setting-group">
              <div className="setting-row">
                <div>
                  <strong>Theme</strong>
                  <p className="muted">Switch between light and dark.</p>
                </div>
                <div className="theme-toggle">
                  <button
                    type="button"
                    className={theme === 'light' ? 'active' : ''}
                    onClick={() => setTheme('light')}
                  >
                    Light
                  </button>
                  <button
                    type="button"
                    className={theme === 'dark' ? 'active' : ''}
                    onClick={() => setTheme('dark')}
                  >
                    Dark
                  </button>
                </div>
              </div>
              <div className="setting-row">
                <div>
                  <strong>Font size</strong>
                  <p className="muted">Adjust verse text size.</p>
                </div>
                <div className="font-slider">
                  <input
                    id="font-size"
                    type="range"
                    min="14"
                    max="22"
                    value={fontSize}
                    onChange={(event) => setFontSize(Number(event.target.value))}
                  />
                  <span>{fontSize}px</span>
                </div>
              </div>
            </div>
            {!verseSelected && (
              <p className="muted">Pick a verse to customize visible translations.</p>
            )}
            {verseSelected && (
              <div className="translation-controls">
                <span>Translations</span>
                <div className="translation-list">
                  {translationDefinitions.map((definition) => {
                    const checked = activeTab.translations.includes(definition.id)
                    const disabled =
                      !checked && activeTab.translations.length >= MAX_TRANSLATIONS
                    return (
                      <label
                        key={definition.id}
                        className={`translation-pill ${checked ? 'selected' : ''}`}
                        style={{ borderColor: definition.color }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={disabled}
                          onChange={() => toggleTranslation(activeTab.id, definition.id)}
                        />
                        <span>{definition.shortName}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
            )}
          </section>
          <section>
            <h2>Search results</h2>
            {searchTerm.trim().length > 0 && searchTerm.trim().length < 2 && (
              <p className="muted">Type at least two characters to search.</p>
            )}
            {!searchResults.length && searchTerm.trim().length >= 2 && (
              <p className="muted">No verses found.</p>
            )}
            <div className="search-results">
              {searchResults.map((result) => {
                const bookName = bookList[result.location.bookIndex]?.name
                const reference = formatLocation(result.location, bookName)
                return (
                  <button
                    key={`${result.location.bookIndex}-${result.location.chapterIndex}-${result.location.verseIndex}`}
                    className="search-result"
                    onClick={() => handleSearchNavigate(result.location)}
                  >
                    <strong>{reference}</strong>
                    <p>{highlightedText(result.text)}</p>
                  </button>
                )
              })}
            </div>
          </section>

        </aside>
      </div>
    </div>
  )
}

export default App








