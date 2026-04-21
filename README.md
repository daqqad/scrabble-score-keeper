# Scrabble Score Keeper

A mobile-friendly web app for keeping score during family Scrabble games. Hosted at [scrabble.daqfx.com](https://scrabble.daqfx.com).

## Features

- **Word-based scoring** — type the word played and the score is calculated automatically from standard Scrabble letter values
- **Multipliers** — tap any tile to cycle through normal, Double Letter (DL), Triple Letter (TL), and Blank (0 pts); set Double Word (DW) or Triple Word (TW) per play
- **Bingo bonus** — +50 checkbox appears automatically when 7+ letters are played
- **Dictionary validation** — words are checked against the 172k-word ENABLE list (bundled, no external API calls); invalid words can still be added with "Add Anyway"
- **Turn-based play** — players rotate in order; pass turn supported
- **Save & resume** — games auto-save to `localStorage` for same-device resume; tap **Share** to save to Cloudflare KV and get a link that opens the game on any device
- **Shareable links** — `scrabble.daqfx.com/?game=<id>`; once shared, every new turn auto-syncs so the link stays current

## Stack

- React (Create React App)
- Cloudflare Pages (static hosting + CI/CD from GitHub)
- Cloudflare Pages Functions (serverless API for cloud save/load)
- Cloudflare KV (game state storage, 90-day TTL)

## Development

```bash
npm install
npm start        # dev server at localhost:3000
npm run build    # production build to ./build
```

The Pages Functions (`functions/`) require a KV namespace binding named `GAMES`. For local testing with the API routes, use `wrangler pages dev`.

## Deployment

Pushes to `main` automatically deploy via Cloudflare Pages CI.
