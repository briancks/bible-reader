import { Fragment, useMemo, useRef, useState } from 'react'
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

function App() {
  const { booksByTranslation, loading, error, reload } = useBibleData(translationDefinitions)
  const canonicalBooks = booksByTranslation[canonicalTranslationId] ?? []
  const [tabs, setTabs] = useState<TabState[]>([initialTab])
  const [activeTabId, setActiveTabId] = useState(initialTab.id)
  const [searchTerm, setSearchTerm] = useState('')
  const [recent, setRecent] = useState<RecentLocation[]>([])
  const [hoveredVerse, setHoveredVerse] = useState<number | null>(null)
  const nextTabId = useRef(2)

  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? tabs[0]

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
    setRecent((prev) => {
      const key = makeLocationKey(location)
      const nextEntries = [
        { key, location, timestamp: Date.now() },
        ...prev.filter((entry) => entry.key !== key),
      ]
      return nextEntries.slice(0, 10)
    })
  }

  const updateTabLocation = (tabId: string, changes: Partial<VerseLocation>) => {
    let nextLocation: VerseLocation | null = null
    setTabs((prevTabs) =>
      prevTabs.map((tab) => {
        if (tab.id !== tabId) {
          return tab
        }
        const proposed: VerseLocation = {
          bookIndex: changes.bookIndex ?? tab.location.bookIndex,
          chapterIndex:
            changes.bookIndex !== undefined
              ? 0
              : changes.chapterIndex ?? tab.location.chapterIndex,
          verseIndex:
            changes.bookIndex !== undefined || changes.chapterIndex !== undefined
              ? changes.verseIndex ?? null
              : changes.verseIndex ?? tab.location.verseIndex,
        }

        const clamped = clampLocation(proposed)
        nextLocation = clamped
        return { ...tab, location: clamped }
      }),
    )

    if (nextLocation) {
      registerRecent(nextLocation)
    }
  }

  const toggleTranslation = (tabId: string, translationId: string) => {
    setTabs((prevTabs) =>
      prevTabs.map((tab) => {
        if (tab.id !== tabId) {
          return tab
        }
        const isActive = tab.translations.includes(translationId)
        if (isActive) {
          if (tab.translations.length === 1) {
            return tab
          }
          return {
            ...tab,
            translations: tab.translations.filter((id) => id !== translationId),
          }
        }

        if (tab.translations.length >= MAX_TRANSLATIONS) {
          return tab
        }

        return { ...tab, translations: [...tab.translations, translationId] }
      }),
    )
  }

  const addTab = () => {
    const newTab: TabState = {
      id: `tab-${nextTabId.current}`,
      location: { bookIndex: 0, chapterIndex: 0, verseIndex: null },
      translations: translationDefinitions.slice(0, 2).map((translation) => translation.id),
    }
    nextTabId.current += 1
    setTabs((prevTabs) => [...prevTabs, newTab])
    setActiveTabId(newTab.id)
    setHoveredVerse(null)
  }

  const closeTab = (tabId: string) => {
    if (tabs.length === 1) {
      return
    }
    const index = tabs.findIndex((tab) => tab.id === tabId)
    const updatedTabs = tabs.filter((tab) => tab.id !== tabId)
    setTabs(updatedTabs)
    if (activeTabId === tabId) {
      const fallback = updatedTabs[Math.max(0, index - 1)]
      setActiveTabId(fallback.id)
    }
  }

  const bookList = canonicalBooks
  const activeBook = bookList[activeTab.location.bookIndex]
  const activeChapterCount = activeBook?.chapters.length ?? 0
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
    setHoveredVerse(location.verseIndex ?? null)
  }

  const handleVerseInteraction = (verseIndex: number) => {
    if (!activeTab) {
      return
    }
    updateTabLocation(activeTab.id, { verseIndex })
    setHoveredVerse(verseIndex)
  }

  const recentItems = recent.map((entry) => {
    const bookName = bookList[entry.location.bookIndex]?.name
    return {
      ...entry,
      label: formatLocation(entry.location, bookName),
    }
  })

  const columnStyle = {
    gridTemplateColumns: `repeat(${activeTab.translations.length}, minmax(240px, 1fr))`,
  }

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
            placeholder="Search for text, e.g. “in the beginning”"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
      </header>

      <div className="layout">
        <section className="workspace">
          <div className="tab-bar">
            {tabs.map((tab) => {
              const bookName = bookList[tab.location.bookIndex]?.abbrev?.toUpperCase()
              const label = formatLocation(tab.location, bookName)
              const translationsLabel = tab.translations
                .map((id) => translationDefinitions.find((definition) => definition.id === id)?.shortName ?? id)
                .join(' / ')
              return (
                <button
                  key={tab.id}
                  className={`tab ${tab.id === activeTabId ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTabId(tab.id)
                    setHoveredVerse(null)
                  }}
                  title={translationsLabel}
                >
                  <div className="tab-label">
                    <span>{label}</span>
                    <small>{translationsLabel}</small>
                  </div>
                  {tabs.length > 1 && (
                    <span
                      className="tab-close"
                      role="button"
                      aria-label="Close tab"
                      onClick={(event) => {
                        event.stopPropagation()
                        closeTab(tab.id)
                      }}
                    >
                      ×
                    </span>
                  )}
                </button>
              )
            })}
            <button className="add-tab" onClick={addTab}>
              + New tab
            </button>
          </div>

          <div className="tab-content">
            {error && (
              <div className="status callout error">
                <p>{error}</p>
                <button onClick={reload}>Try again</button>
              </div>
            )}
            {!error && loading && (
              <div className="status callout muted">
                <p>Loading translations…</p>
              </div>
            )}

            <div className="navigation-panel">
              <div className="fisheye-wrapper">
                <div className="section-header">
                  <h3>Fisheye navigator</h3>
                  <p>Glide from books to chapters to verses with a cascading hover.</p>
                </div>
                <FisheyeMenu
                  books={bookList}
                  location={activeTab.location}
                  onNavigate={handleSearchNavigate}
                />
              </div>
              <div className="book-grid" role="tablist" aria-label="Bible books">
                {bookList.map((book, index) => (
                  <button
                    key={book.abbrev}
                    className={index === activeTab.location.bookIndex ? 'active' : ''}
                    onClick={() => updateTabLocation(activeTab.id, { bookIndex: index })}
                    title={book.name}
                  >
                    <span className="book-name">{book.name}</span>
                    <span className="book-abbrev">{book.abbrev.toUpperCase()}</span>
                  </button>
                ))}
              </div>
              <div className="chapter-scroll" aria-label="Chapters">
                {Array.from({ length: activeChapterCount }).map((_, index) => (
                  <button
                    key={`chapter-${index}`}
                    className={index === activeTab.location.chapterIndex ? 'active' : ''}
                    onClick={() => updateTabLocation(activeTab.id, { chapterIndex: index })}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            </div>

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

            <div className="verse-columns" style={columnStyle}>
              {activeTab.translations.map((translationId) => {
                const translation = translationDefinitions.find(
                  (definition) => definition.id === translationId,
                )
                const books = booksByTranslation[translationId]
                const book = books?.[activeTab.location.bookIndex]
                const chapter = book?.chapters[activeTab.location.chapterIndex] ?? []
                return (
                  <div key={translationId} className="verse-column">
                    <div className="column-header" style={{ borderColor: translation?.color }}>
                      <h3>{translation?.name ?? translationId}</h3>
                      <p className="column-subtitle">{translation?.description}</p>
                    </div>
                    <div className="verses">
                      {chapter.map((verse, index) => {
                        const isActive = activeTab.location.verseIndex === index
                        const isHovered = hoveredVerse === index
                        return (
                          <button
                            key={`${translationId}-${index}`}
                            className={`verse ${isActive ? 'selected' : ''} ${isHovered ? 'hovered' : ''}`}
                            onMouseEnter={() => setHoveredVerse(index)}
                            onFocus={() => setHoveredVerse(index)}
                            onMouseLeave={() => setHoveredVerse(null)}
                            onBlur={() => setHoveredVerse(null)}
                            onClick={() => handleVerseInteraction(index)}
                          >
                            <span className="verse-number">{index + 1}</span>
                            <span className="verse-text">{verse}</span>
                          </button>
                        )
                      })}
                      {!chapter.length && (
                        <p className="muted">Select a book and chapter to start reading.</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <aside className="side-panel">
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

          <section>
            <h2>Recently viewed</h2>
            {!recentItems.length && <p className="muted">Jump to a verse to build your list.</p>}
            <ul className="recent-list">
              {recentItems.map((entry) => (
                <li key={entry.key}>
                  <button onClick={() => handleSearchNavigate(entry.location)}>
                    {entry.label}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  )
}

export default App
