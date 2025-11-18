import { useMemo, useState } from 'react'

import type { BibleBook, VerseLocation } from '../types'

type Props = {
  books: BibleBook[]
  location: VerseLocation
  onNavigate: (location: VerseLocation) => void
}

const MAX_VERSES_IN_MENU = 60

const makeVerseLabel = (text: string) => {
  if (text.length <= 90) {
    return text
  }
  return `${text.slice(0, 90)}…`
}

export function FisheyeMenu({ books, location, onNavigate }: Props) {
  const [hoverPath, setHoverPath] = useState<VerseLocation | null>(null)

  const safeLocation = useMemo(() => {
    if (!books.length) {
      return { bookIndex: 0, chapterIndex: 0, verseIndex: null }
    }
    const bookIndex = Math.min(Math.max(location.bookIndex, 0), books.length - 1)
    const book = books[bookIndex]
    const chapterIndex = Math.min(
      Math.max(location.chapterIndex, 0),
      Math.max(0, book?.chapters.length - 1),
    )
    const verses = book?.chapters[chapterIndex] ?? []
    const verseIndex =
      location.verseIndex == null
        ? null
        : Math.min(Math.max(location.verseIndex, 0), Math.max(0, verses.length - 1))
    return { bookIndex, chapterIndex, verseIndex }
  }, [books, location])

  const activePath = hoverPath ?? safeLocation
  const activeBook = books[activePath.bookIndex]
  const activeChapters = activeBook?.chapters ?? []
  const activeChapter = activeChapters[activePath.chapterIndex] ?? []
  const versePreview = activeChapter.slice(0, MAX_VERSES_IN_MENU)

  if (!books.length) {
    return null
  }

  const handleMenuLeave = () => setHoverPath(null)

  return (
    <div className="fisheye-menu" onMouseLeave={handleMenuLeave} onBlur={handleMenuLeave}>
      <div className="fisheye-column">
        <div className="fisheye-heading">Books</div>
        <div className="fisheye-items">
          {books.map((book, index) => (
            <button
              key={book.abbrev}
              className={`fisheye-item ${index === activePath.bookIndex ? 'active' : ''}`}
              onMouseEnter={() =>
                setHoverPath({ bookIndex: index, chapterIndex: 0, verseIndex: null })
              }
              onFocus={() =>
                setHoverPath({ bookIndex: index, chapterIndex: 0, verseIndex: null })
              }
              onClick={() =>
                onNavigate({ bookIndex: index, chapterIndex: 0, verseIndex: null })
              }
            >
              <span className="primary">{book.name}</span>
              <span className="secondary">{book.chapters.length} chapters</span>
            </button>
          ))}
        </div>
      </div>

      <div className="fisheye-column">
        <div className="fisheye-heading">
          Chapters{' '}
          {activeBook ? `• ${activeBook.name}` : ''}
        </div>
        <div className="fisheye-items">
          {activeChapters.map((chapter, index) => (
            <button
              key={`chapter-${index}`}
              className={`fisheye-item ${index === activePath.chapterIndex ? 'active' : ''}`}
              onMouseEnter={() =>
                setHoverPath({
                  bookIndex: activePath.bookIndex,
                  chapterIndex: index,
                  verseIndex: null,
                })
              }
              onFocus={() =>
                setHoverPath({
                  bookIndex: activePath.bookIndex,
                  chapterIndex: index,
                  verseIndex: null,
                })
              }
              onClick={() =>
                onNavigate({
                  bookIndex: activePath.bookIndex,
                  chapterIndex: index,
                  verseIndex: null,
                })
              }
            >
              <span className="primary">Chapter {index + 1}</span>
              <span className="secondary">{chapter.length} verses</span>
            </button>
          ))}
          {!activeChapters.length && <p className="muted">Select a book to view chapters.</p>}
        </div>
      </div>

      <div className="fisheye-column">
        <div className="fisheye-heading">
          Verses{' '}
          {activeChapters.length
            ? `• Chapter ${activePath.chapterIndex + 1}`
            : ''}
        </div>
        <div className="fisheye-items">
          {versePreview.map((verse, index) => (
            <button
              key={`verse-${index}`}
              className={`fisheye-item ${index === activePath.verseIndex ? 'active' : ''}`}
              onMouseEnter={() =>
                setHoverPath({
                  bookIndex: activePath.bookIndex,
                  chapterIndex: activePath.chapterIndex,
                  verseIndex: index,
                })
              }
              onFocus={() =>
                setHoverPath({
                  bookIndex: activePath.bookIndex,
                  chapterIndex: activePath.chapterIndex,
                  verseIndex: index,
                })
              }
              onClick={() =>
                onNavigate({
                  bookIndex: activePath.bookIndex,
                  chapterIndex: activePath.chapterIndex,
                  verseIndex: index,
                })
              }
            >
              <span className="primary">Verse {index + 1}</span>
              <span className="secondary">{makeVerseLabel(verse)}</span>
            </button>
          ))}
          {!versePreview.length && (
            <p className="muted">Hover over a chapter to preview its verses.</p>
          )}
          {activeChapter.length > MAX_VERSES_IN_MENU && (
            <p className="muted">
              Showing first {MAX_VERSES_IN_MENU} verses. Jump in to view all verses.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default FisheyeMenu
