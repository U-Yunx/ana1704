# ANA24 — Forex & Crypto Trading Robot

Automated trading platform with a free paper-trading account, strategy
backtester, live signals, auto-tune, and secure live trading through OANDA and
MetaTrader — plus a referral/commission system with manual payouts.

## Stack

- **Frontend** — React 18 + TypeScript + Vite + Tailwind CSS v4
- **Charts** — lightweight-charts (candles, equity curves)
- **Backend** — Supabase (Auth, Postgres, Realtime, Edge Functions)
- **Deploy** — NativelyAI platform (static build via `npm run build`)

## Getting started

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` and fill in `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY` (both public/publishable). Without them the app shows
the "Supabase connection required" screen.

## Scripts

| Script            | Purpose                                   |
| ----------------- | ----------------------------------------- |
| `npm run dev`     | Start the Vite dev server                 |
| `npm run build`   | Production build to `dist/`               |
| `npm test`        | Run the Vitest unit tests                 |

## Architecture

- `src/lib/` — pure logic: trading engine, risk math, strategies, indicators,
  backtests, platform API layer (Supabase), formatting, currency conversion.
- `src/hooks/` — React hooks: auth, market data (realtime quotes), platform
  data, saved strategies, paper account.
- `src/components/` — UI kit + shared components.
- `src/pages/` — routes (Home, Dashboard, Trading, Backtester, Signals,
  Strategies, Performance, Referrals, Gateway, Admin, …).
- `supabase/functions/` — Edge Functions: `market-data` (provider proxy),
  `broker-oanda` / `broker-mt` (live broker bridges), `broker-token`
  (scoped robot API tokens), `news-ticker`.

## Security

- No secrets in the client bundle. API keys (market data providers, brokers,
  AI) live in Supabase Edge Function secrets and are read with `Deno.env.get`.
- Live broker trading is proxied through server-side bridges; broker
  credentials never reach the browser.
- Row Level Security on all user-scoped tables.

## Testing

`npm test` runs Vitest over `src/**/*.test.ts` — engine reducer, risk math,
strategy indicators, backtests, currency and formatting helpers.
