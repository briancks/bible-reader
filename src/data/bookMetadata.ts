export type Testament = 'OT' | 'NT'

export type BookCategory =
  | 'Pentateuch'
  | 'History'
  | 'Wisdom'
  | 'Major Prophets'
  | 'Minor Prophets'
  | 'Gospels'
  | 'Pauline Epistles'
  | 'General Epistles'
  | 'Revelation'

export type BookMetadata = {
  name: string
  testament: Testament
  category: BookCategory
}

export const bookMetadata: BookMetadata[] = [
  { name: 'Genesis', testament: 'OT', category: 'Pentateuch' },
  { name: 'Exodus', testament: 'OT', category: 'Pentateuch' },
  { name: 'Leviticus', testament: 'OT', category: 'Pentateuch' },
  { name: 'Numbers', testament: 'OT', category: 'Pentateuch' },
  { name: 'Deuteronomy', testament: 'OT', category: 'Pentateuch' },
  { name: 'Joshua', testament: 'OT', category: 'History' },
  { name: 'Judges', testament: 'OT', category: 'History' },
  { name: 'Ruth', testament: 'OT', category: 'History' },
  { name: '1 Samuel', testament: 'OT', category: 'History' },
  { name: '2 Samuel', testament: 'OT', category: 'History' },
  { name: '1 Kings', testament: 'OT', category: 'History' },
  { name: '2 Kings', testament: 'OT', category: 'History' },
  { name: '1 Chronicles', testament: 'OT', category: 'History' },
  { name: '2 Chronicles', testament: 'OT', category: 'History' },
  { name: 'Ezra', testament: 'OT', category: 'History' },
  { name: 'Nehemiah', testament: 'OT', category: 'History' },
  { name: 'Esther', testament: 'OT', category: 'History' },
  { name: 'Job', testament: 'OT', category: 'Wisdom' },
  { name: 'Psalms', testament: 'OT', category: 'Wisdom' },
  { name: 'Proverbs', testament: 'OT', category: 'Wisdom' },
  { name: 'Ecclesiastes', testament: 'OT', category: 'Wisdom' },
  { name: 'Song of Solomon', testament: 'OT', category: 'Wisdom' },
  { name: 'Isaiah', testament: 'OT', category: 'Major Prophets' },
  { name: 'Jeremiah', testament: 'OT', category: 'Major Prophets' },
  { name: 'Lamentations', testament: 'OT', category: 'Major Prophets' },
  { name: 'Ezekiel', testament: 'OT', category: 'Major Prophets' },
  { name: 'Daniel', testament: 'OT', category: 'Major Prophets' },
  { name: 'Hosea', testament: 'OT', category: 'Minor Prophets' },
  { name: 'Joel', testament: 'OT', category: 'Minor Prophets' },
  { name: 'Amos', testament: 'OT', category: 'Minor Prophets' },
  { name: 'Obadiah', testament: 'OT', category: 'Minor Prophets' },
  { name: 'Jonah', testament: 'OT', category: 'Minor Prophets' },
  { name: 'Micah', testament: 'OT', category: 'Minor Prophets' },
  { name: 'Nahum', testament: 'OT', category: 'Minor Prophets' },
  { name: 'Habakkuk', testament: 'OT', category: 'Minor Prophets' },
  { name: 'Zephaniah', testament: 'OT', category: 'Minor Prophets' },
  { name: 'Haggai', testament: 'OT', category: 'Minor Prophets' },
  { name: 'Zechariah', testament: 'OT', category: 'Minor Prophets' },
  { name: 'Malachi', testament: 'OT', category: 'Minor Prophets' },
  { name: 'Matthew', testament: 'NT', category: 'Gospels' },
  { name: 'Mark', testament: 'NT', category: 'Gospels' },
  { name: 'Luke', testament: 'NT', category: 'Gospels' },
  { name: 'John', testament: 'NT', category: 'Gospels' },
  { name: 'Acts', testament: 'NT', category: 'History' },
  { name: 'Romans', testament: 'NT', category: 'Pauline Epistles' },
  { name: '1 Corinthians', testament: 'NT', category: 'Pauline Epistles' },
  { name: '2 Corinthians', testament: 'NT', category: 'Pauline Epistles' },
  { name: 'Galatians', testament: 'NT', category: 'Pauline Epistles' },
  { name: 'Ephesians', testament: 'NT', category: 'Pauline Epistles' },
  { name: 'Philippians', testament: 'NT', category: 'Pauline Epistles' },
  { name: 'Colossians', testament: 'NT', category: 'Pauline Epistles' },
  { name: '1 Thessalonians', testament: 'NT', category: 'Pauline Epistles' },
  { name: '2 Thessalonians', testament: 'NT', category: 'Pauline Epistles' },
  { name: '1 Timothy', testament: 'NT', category: 'Pauline Epistles' },
  { name: '2 Timothy', testament: 'NT', category: 'Pauline Epistles' },
  { name: 'Titus', testament: 'NT', category: 'Pauline Epistles' },
  { name: 'Philemon', testament: 'NT', category: 'Pauline Epistles' },
  { name: 'Hebrews', testament: 'NT', category: 'General Epistles' },
  { name: 'James', testament: 'NT', category: 'General Epistles' },
  { name: '1 Peter', testament: 'NT', category: 'General Epistles' },
  { name: '2 Peter', testament: 'NT', category: 'General Epistles' },
  { name: '1 John', testament: 'NT', category: 'General Epistles' },
  { name: '2 John', testament: 'NT', category: 'General Epistles' },
  { name: '3 John', testament: 'NT', category: 'General Epistles' },
  { name: 'Jude', testament: 'NT', category: 'General Epistles' },
  { name: 'Revelation', testament: 'NT', category: 'Revelation' },
]

export const testamentOrder: Testament[] = ['OT', 'NT']

export const testamentLabels: Record<Testament, string> = {
  OT: 'Old Testament',
  NT: 'New Testament',
}

const buildCategoryMap = () => {
  const map: Record<Testament, BookCategory[]> = { OT: [], NT: [] }
  const seen: Record<Testament, Set<BookCategory>> = {
    OT: new Set(),
    NT: new Set(),
  }
  bookMetadata.forEach((meta) => {
    if (!seen[meta.testament].has(meta.category)) {
      seen[meta.testament].add(meta.category)
      map[meta.testament].push(meta.category)
    }
  })
  return map
}

export const categoriesByTestament = buildCategoryMap()
