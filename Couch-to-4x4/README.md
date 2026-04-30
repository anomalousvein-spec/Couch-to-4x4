# Couch to 4x4

A guided React workout timer for gradually building toward Norwegian 4x4-style high-intensity intervals.

## Getting Started

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Notes

- Progress is stored locally in the browser with `localStorage`.
- Audio cue paths are wired for files under `public/audio/`.
- The current audio files are temporary beep placeholders. Replace them with final cue recordings when ready.
- The service worker caches the workout audio cue files.
