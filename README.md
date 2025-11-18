# Parallel Bible Reader

A responsive web experience for browsing and reading the Bible with multiple tabs, multi-translation comparison, search, and quick navigation. Built with React, TypeScript, and Vite.

## Highlights

- 📚 **Finger-friendly navigation** – large tappable tiles for books, a scrollable chapter rail, and a new fisheye hover navigator make it easy to locate passages.
- 🗂️ **Unlimited tabs** – open as many contexts as you like; each tab tracks its own book, chapter, verse, and translation preferences.
- 📝 **Compare translations** – toggle up to three translations per view (KJV, BBE, RVR, NVI, APEE) and read the verses side by side.
- 🔍 **Full-text search** – search across the entire Bible (KJV) and jump directly to matching verses.
- 🕓 **Recent history** – the “Recently viewed” panel remembers the latest chapters/verses you opened for quick recall.
- ⚡ **Client-side caching** – translation data is cached in `localStorage` after the first load to keep subsequent sessions instant.

Bible text is fetched at runtime from the public-domain datasets maintained in [`thiagobodruk/bible`](https://github.com/thiagobodruk/bible) on GitHub.

## Getting Started

```bash
npm install
npm run dev
```

Then open the printed URL (usually `http://localhost:5173`) in your browser.  
Use `npm run build` to create a production build.

## Project Structure

- `src/App.tsx` – core UI and interaction logic (tab system, verse rendering, navigation, search, recents).
- `src/hooks/useBibleData.ts` – loads translation files, strips BOMs, and caches results per translation.
- `src/data/translations.ts` – metadata (names, sources, colors) for each translation.
- `src/types.ts` – shared TypeScript models for books, tabs, and verse locations.
- `src/App.css` & `src/index.css` – responsive layout, typography, and tactile-friendly styling.

## Notes & Next Steps

- The search index currently uses the KJV dataset for speed. It’s straightforward to extend this to other translations by updating `useMemo` in `App.tsx`.
- Additional translations can be added by editing `src/data/translations.ts`; the UI will automatically allow toggling them (still max 3 at a time).
- Because translation data is fetched from GitHub, ensure the runtime environment allows outgoing HTTPS requests.
