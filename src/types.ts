export type BibleBook = {
  abbrev: string
  name: string
  chapters: string[][]
}

export type TranslationDefinition = {
  id: string
  name: string
  shortName: string
  description: string
  sourceUrl: string
  color: string
}

export type VerseLocation = {
  bookIndex: number
  chapterIndex: number
  verseIndex: number | null
}

export type TabState = {
  id: string
  location: VerseLocation
  translations: string[]
}

export type RecentLocation = {
  key: string
  location: VerseLocation
  timestamp: number
}
