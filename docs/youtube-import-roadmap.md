# Roadmap: YouTube-like data import and simulation in MyTube

## Goal
Build an offline mode where a user can recreate a YouTube-like page from public data:
- video metadata (title, channel, views, publication date)
- reactions (likes/dislikes where available)
- comments, replies, and reaction counters
- editable thumbnail
- optional auto-import by URL (without manual HTML export)

## Direct answers

### 1) Import from saved HTML page
**Yes, feasible with constraints.**

What works well:
- Parse locally selected `.html` file in browser (`FileReader` + `DOMParser`), no backend required.
- Extract data from embedded JSON blobs (`ytInitialData`, `ytInitialPlayerResponse`).
- Save normalized result to IndexedDB and render in current watch view.

Main constraints:
- YouTube HTML structure changes often, parser needs versioned extractors and fallback logic.
- Some counters (especially dislikes) may be absent in current public page payloads.
- Dynamic comments may be partially loaded in saved HTML if the page was not fully scrolled before saving.

### 2) Edit thumbnail for any video
**Yes, straightforward.**

Implementation idea:
- Add `thumbnailSource` and `thumbnailCustom` fields for video records.
- In video card/watch page add action "Change thumbnail".
- Let user choose image file and store preview as data URL (or Blob in IndexedDB).

### 3) Auto-import by URL (instead of HTML)
**Partially feasible in browser-only app; fully feasible with small backend.**

Options:
- Browser-only: fetch public oEmbed/OpenGraph data (title/thumbnail) if CORS allows. Usually not enough for comments.
- Preferred: lightweight backend endpoint that resolves URL and extracts metadata/comments using stable server-side flow.
- Hybrid: try browser fetch first, then fallback to backend.

Important: comments/replies at scale are usually easier and more stable through backend or API integration.

## Suggested implementation phases

1. **Parser MVP (HTML import)**
   - Add "Import HTML" button in profile section.
   - Parse and map data into internal schema.
   - Populate comments tree and counters on watch page.

2. **Interactive comment simulation**
   - Support reply, like/dislike toggles per comment.
   - Keep imported counters as base values + local deltas.

3. **Thumbnail editor**
   - Upload/select thumbnail per video.
   - Add reset to imported/default thumbnail.

4. **URL ingestion**
   - Add URL input.
   - Implement backend extractor endpoint.
   - Merge imported payload with existing video record.

## Minimal data schema extension

```js
video.imported = {
  source: "youtube_html" | "youtube_url",
  sourceVideoId: "...",
  sourceUrl: "...",
  importedAt: 0,
  stats: {
    views: 0,
    likes: null,
    dislikes: null,
    comments: 0,
  },
  comments: [
    {
      id: "...",
      author: "...",
      text: "...",
      likes: 0,
      publishedText: "...",
      replies: [],
      localState: { liked: false, disliked: false }
    }
  ]
}
```

## UX notes

- Show badge "Imported from YouTube HTML" with import timestamp.
- If some fields are missing, show "data unavailable" instead of zeros.
- Keep imported data immutable and apply user interactions as overlay state.

## Risks and maintenance

- HTML parser fragility due to upstream markup changes.
- Large HTML files can be heavy; parse asynchronously and show progress.
- Need deduplication (same video imported multiple times).

## Recommendation
Start from HTML import + thumbnail editor (highest value, no backend), then add URL import with backend for reliability.
