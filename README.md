# Hand Tracker

A mobile-first poker hand logger built with React + Vite.

Track hands quickly at the table, then edit details later:
- 7-step hand logger (Hero -> Villains -> Preflop -> Flop -> Turn -> River -> Result)
- Fast action entry with inline timeline editing
- Saved hand list with summaries and timestamps
- Full read-only hand detail view with edit/delete
- Local persistence via browser `localStorage`
- PWA-ready metadata + GitHub Pages deploy workflow

## Tech Stack

- React
- Vite
- Plain CSS
- GitHub Actions (Pages deployment)

## Local Development

```bash
npm install
npm run dev
```

Open the local URL shown by Vite (usually `http://localhost:5173`).

## Production Build

```bash
npm run build
npm run preview
```

Build output is generated in `dist/`.

## Deployment (GitHub Pages)

This project includes `.github/workflows/deploy.yml` for automatic Pages deployment.

1. Push to `main`
2. In GitHub repo settings:
   - Go to **Settings -> Pages**
   - Set **Source = GitHub Actions**

For this repo, the app will be hosted at:
- [https://kamdarsk23.github.io/hand_tracker/](https://kamdarsk23.github.io/hand_tracker/)

## Data Model (hand object)

```js
{
  id,
  createdAt,
  updatedAt,
  heroPosition,
  heroStack,
  heroCards,
  villains,
  flop,
  turn,
  river,
  preflopActions,
  flopActions,
  turnActions,
  riverActions,
  result,
  potSize,
  villainShowdown,
  notes
}
```

## Notes

- Data is stored locally in browser storage.
- Clearing browser site data will remove saved hands.
