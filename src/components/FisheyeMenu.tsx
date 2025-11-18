import { useMemo, useState } from 'react'

import {
  bookMetadata,
  categoriesByTestament,
  testamentLabels,
  testamentOrder,
  type BookCategory,
  type Testament,
} from '../data/bookMetadata'
import type { BibleBook, VerseLocation } from '../types'

type Props = {
  books: BibleBook[]
  location: VerseLocation
  onNavigate: (location: VerseLocation) => void
}

const MAX_VERSES_IN_MENU = 60
const ALL_TESTAMENT = 'ALL' as const
const ALL_CATEGORY = 'ALL' as const

type TestamentFilter = Testament | typeof ALL_TESTAMENT
type CategoryFilter = BookCategory | typeof ALL_CATEGORY

const testamentChoices: TestamentFilter[] = [ALL_TESTAMENT, ...testamentOrder]
const allCategories = Array.from(new Set(bookMetadata.map((meta) => meta.category)))

const makeVerseLabel = (text: string) => {
  if (text.length <= 90) {
    return text
  }
  return `${text.slice(0, 90)}…`
}

type FisheyePath = {
  testament: TestamentFilter
  category: CategoryFilter
  bookIndex: number
  chapterIndex: number
  verseIndex: number | null
}

const getCategoriesForFilter = (testament: TestamentFilter) =>
  testament === ALL_TESTAMENT ? allCategories : categoriesByTestament[testament]

const labelForTestament = (testament: TestamentFilter) =>
  testament === ALL_TESTAMENT ? 'All Testaments' : testamentLabels[testament]

const resolveCategoryForTestament = (
  testament: TestamentFilter,
  category: CategoryFilter,
): CategoryFilter => {
  if (
    category !== ALL_CATEGORY &&
    testament !== ALL_TESTAMENT &&
    !categoriesByTestament[testament].includes(category)
  ) {
    return ALL_CATEGORY
  }
  return category
}

const computeFilteredIndices = (
  testament: TestamentFilter,
  category: CategoryFilter,
) =>
  bookMetadata.reduce<number[]>((acc, meta, index) => {
    const matchesTestament =
      testament === ALL_TESTAMENT || meta.testament === testament
    const matchesCategory =
      category === ALL_CATEGORY || meta.category === category
    if (matchesTestament && matchesCategory) {
      acc.push(index)
    }
    return acc
  }, [])

export function FisheyeMenu({ books, location, onNavigate }: Props) {
  const [hoverPath, setHoverPath] = useState<FisheyePath | null>(null)

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

  const basePath: FisheyePath = {
    testament: ALL_TESTAMENT,
    category: ALL_CATEGORY,
    bookIndex: safeLocation.bookIndex,
    chapterIndex: safeLocation.chapterIndex,
    verseIndex: safeLocation.verseIndex,
  }

  const activePath = hoverPath ?? basePath

  const filteredBookIndices = computeFilteredIndices(
    activePath.testament,
    activePath.category,
  )
  const fallbackIndices = filteredBookIndices.length
    ? filteredBookIndices
    : [safeLocation.bookIndex]
  const effectiveBookIndex = fallbackIndices.includes(activePath.bookIndex)
    ? activePath.bookIndex
    : fallbackIndices[0]
  const clampedBookIndex = Math.min(
    Math.max(effectiveBookIndex ?? 0, 0),
    books.length - 1,
  )
  const activeBook = books[clampedBookIndex]
  const activeChapters = activeBook?.chapters ?? []
  const clampedChapterIndex = Math.min(
    Math.max(activePath.chapterIndex, 0),
    Math.max(activeChapters.length - 1, 0),
  )
  const activeChapter = activeChapters[clampedChapterIndex] ?? []
  const clampedVerseIndex =
    activePath.verseIndex == null
      ? null
      : Math.min(Math.max(activePath.verseIndex, 0), Math.max(activeChapter.length - 1, 0))
  const versePreview = activeChapter.slice(0, MAX_VERSES_IN_MENU)

  if (!books.length) {
    return null
  }

  const handleMenuLeave = () => setHoverPath(null)

  const categoryBooks = fallbackIndices
    .filter((index) => index < books.length)
    .map((index) => ({ index, book: books[index] }))
    .filter((entry): entry is { index: number; book: BibleBook } => Boolean(entry.book))

  const categoryChoices: CategoryFilter[] = [
    ALL_CATEGORY,
    ...getCategoriesForFilter(activePath.testament),
  ]

  const handleTestamentHover = (testament: TestamentFilter) => {
    const resolvedCategory = resolveCategoryForTestament(testament, activePath.category)
    const indices = computeFilteredIndices(testament, resolvedCategory)
    const nextBookIndex = indices.includes(activePath.bookIndex)
      ? activePath.bookIndex
      : indices[0] ?? safeLocation.bookIndex
    setHoverPath({
      testament,
      category: resolvedCategory,
      bookIndex: nextBookIndex,
      chapterIndex: 0,
      verseIndex: null,
    })
  }

  const handleCategoryHover = (category: CategoryFilter) => {
    const indices = computeFilteredIndices(activePath.testament, category)
    const nextBookIndex = indices.includes(activePath.bookIndex)
      ? activePath.bookIndex
      : indices[0] ?? safeLocation.bookIndex
    setHoverPath({
      ...activePath,
      category,
      bookIndex: nextBookIndex,
      chapterIndex: 0,
      verseIndex: null,
    })
  }

  const handleBookHover = (index: number) => {
    setHoverPath({
      ...activePath,
      bookIndex: index,
      chapterIndex: 0,
      verseIndex: null,
    })
  }

  return (
    <div className="fisheye-menu" onMouseLeave={handleMenuLeave} onBlur={handleMenuLeave}>
      <div className="fisheye-section">
        <p className="fisheye-label">Testaments</p>
        <div className="fisheye-row horizontal">
          <div className="fisheye-items horizontal">
            {testamentChoices.map((testament) => (
              <button
                key={testament}
                className={`fisheye-item ${
                  testament === activePath.testament ? 'active' : ''
                }`}
                onMouseEnter={() => handleTestamentHover(testament)}
                onFocus={() => handleTestamentHover(testament)}
                onClick={() => {
                  const resolvedCategory = resolveCategoryForTestament(
                    testament,
                    activePath.category,
                  )
                  const indices = computeFilteredIndices(testament, resolvedCategory)
                  const nextIndex = indices[0] ?? safeLocation.bookIndex
                  onNavigate({ bookIndex: nextIndex, chapterIndex: 0, verseIndex: null })
                }}
              >
                <span className="primary">{labelForTestament(testament)}</span>
                <span className="secondary">
                  {testament === ALL_TESTAMENT
                    ? `${bookMetadata.length} books`
                    : `${categoriesByTestament[testament].length} categories`}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="fisheye-section">
        <div className="fisheye-label stacked">
          <span className="title">Categories</span>
          <span className="subtitle">{labelForTestament(activePath.testament)}</span>
        </div>
        <div className="fisheye-row horizontal">
          <div className="fisheye-items horizontal categories">
            {categoryChoices.map((category) => (
              <button
                key={category}
                className={`fisheye-item ${category === activePath.category ? 'active' : ''}`}
                onMouseEnter={() => handleCategoryHover(category)}
                onFocus={() => handleCategoryHover(category)}
                onClick={() => {
                  const indices = computeFilteredIndices(activePath.testament, category)
                  const nextIndex = indices[0] ?? safeLocation.bookIndex
                  onNavigate({ bookIndex: nextIndex, chapterIndex: 0, verseIndex: null })
                }}
              >
                <span className="primary">
                  {category === ALL_CATEGORY ? 'All categories' : category}
                </span>
                <span className="secondary">
                  {computeFilteredIndices(activePath.testament, category).length} books
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="fisheye-row">
        <div className="fisheye-column">
          <div className="fisheye-heading">Books</div>
          <div className="fisheye-items">
            {categoryBooks.map(({ book, index }) => (
              <button
                key={`${book.abbrev}-${index}`}
                className={`fisheye-item ${index === clampedBookIndex ? 'active' : ''}`}
                onMouseEnter={() => handleBookHover(index)}
                onFocus={() => handleBookHover(index)}
                onClick={() => onNavigate({ bookIndex: index, chapterIndex: 0, verseIndex: null })}
              >
                <span className="primary">{book.name}</span>
                <span className="secondary">{book.chapters.length} chapters</span>
              </button>
            ))}
            {!categoryBooks.length && (
              <p className="muted">No books found for this category.</p>
            )}
          </div>
        </div>

        <div className="fisheye-column">
          <div className="fisheye-heading">
            Chapters {activeBook ? `• ${activeBook.name}` : ''}
          </div>
          <div className="fisheye-items">
            {activeChapters.map((chapter, index) => (
              <button
                key={`chapter-${index}`}
                className={`fisheye-item ${index === clampedChapterIndex ? 'active' : ''}`}
                onMouseEnter={() =>
                  setHoverPath({
                    ...activePath,
                    bookIndex: clampedBookIndex,
                    chapterIndex: index,
                    verseIndex: null,
                  })
                }
                onFocus={() =>
                  setHoverPath({
                    ...activePath,
                    bookIndex: clampedBookIndex,
                    chapterIndex: index,
                    verseIndex: null,
                  })
                }
                onClick={() =>
                  onNavigate({
                    bookIndex: clampedBookIndex,
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
            Verses {activeChapters.length ? `• Chapter ${clampedChapterIndex + 1}` : ''}
          </div>
          <div className="fisheye-items">
            {versePreview.map((verse, index) => (
              <button
                key={`verse-${index}`}
                className={`fisheye-item ${index === clampedVerseIndex ? 'active' : ''}`}
                onMouseEnter={() =>
                  setHoverPath({
                    ...activePath,
                    bookIndex: clampedBookIndex,
                    chapterIndex: clampedChapterIndex,
                    verseIndex: index,
                  })
                }
                onFocus={() =>
                  setHoverPath({
                    ...activePath,
                    bookIndex: clampedBookIndex,
                    chapterIndex: clampedChapterIndex,
                    verseIndex: index,
                  })
                }
                onClick={() =>
                  onNavigate({
                    bookIndex: clampedBookIndex,
                    chapterIndex: clampedChapterIndex,
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
    </div>
  )
}

export default FisheyeMenu
