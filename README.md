# Dutch Bros Sticker Vault

Collector SaaS for tracking Dutch Bros sticker drops, market prices, and your personal inventory.

## Quick start

```bash
npm run install:app
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Deploy (Vercel — recommended)

1. Import this repo in [Vercel](https://vercel.com/new).
2. Set **Root Directory** to `dutch-bros-tracker`.
3. Build command: `npm run build` (default)
4. Output directory: `dist`
5. Optional env vars (see `.env.example` in `dutch-bros-tracker/`):
   - `VITE_FIRECRAWL_API_KEY` — live eBay sold-listing scrape fallback
   - `VITE_EBAY_API_KEY` — eBay Browse API (dev proxy only; production needs a server proxy)

The app ships with **pre-seeded guide prices** for every catalog sticker — works with zero API keys.

## Features

- **148 sticker catalog** (2020–2026): monthly drops, holidays, fundraisers, regionals, grand openings, collabs, scavenger hunts, surprise drops
- **Pre-seeded market guides** (low / median / high) from sold listing research
- **Live price refresh** via eBay Browse API or Firecrawl
- **Inventory & collection stats** (owned, missing, value, completion %)
- **Camera scanner** (visual match index) for quick ID in-store

## Project layout

```
dutch-bros-tracker/   # Vite + React + Tailwind app
  src/data/stickers.ts   # Catalog
  src/data/prices.ts     # Pre-seeded comps
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
