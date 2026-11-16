# Marktplatz: Paisley Christmas Market

Proof-of-concept site for UWS COMP10020 Internet Technologies, Coursework 2.

Marktplatz is a reusable platform for markets and similar events. Paisley
Christmas Market is the first client. A second event (Paisley Spring Makers
Market) runs on the same code with a different theme to show that the pattern
can be applied to other customers.

The scenario is fictitious. Every trader in the demonstration data is invented.

## What it does

| Who | Can |
| --- | --- |
| Visitor | Read about the market, browse and filter confirmed stalls, find a stall on the pitch map |
| Trader | Apply for a pitch, check progress with a reference, download or withdraw the application, ask for their details to be deleted |
| Organiser (admin) | Sign in, review applications, approve / waiting-list / reject, allocate pitches, erase personal data, edit market details, add another market |

## Technology

- React Router 8 in framework mode (React 19, TypeScript, Vite), server-rendered
- MongoDB with Mongoose (MongoDB Atlas when deployed)
- Tailwind CSS 4, with an iOS-style interface: system typeface (self-hosted Inter as the fallback), grouped cards, a translucent navigation bar and a tab bar on phones
- Cookie session for organisers, passwords hashed with bcrypt
- Zod for form validation on the server
- Optional cookieless analytics with Umami

## Run it locally

Needs Node.js 22 or newer.

```bash
npm install
npm run dev:local
```

Open http://localhost:5173.

`dev:local` starts a MongoDB server on your own computer (downloaded
automatically the first time), fills it with demonstration data and starts the
site. The data is kept in `.data/` between runs.

Organiser sign-in details for the demonstration data are in `.env.example`.

### Use MongoDB Atlas instead

```bash
cp .env.example .env      # then edit .env
npm run seed              # adds the demonstration data once
npm run dev
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev:local` | Development server with a local database, no account needed |
| `npm run dev` | Development server using `MONGODB_URI` from `.env` |
| `npm run seed` | Adds demonstration data if the database is empty (`-- --reset` replaces it) |
| `npm test` | Unit tests for the validation rules |
| `npm run typecheck` | TypeScript check |
| `npm run build` then `npm start` | Production build and server |

## Project layout

```
app/
  routes.ts            every URL and the file that handles it
  routes/market/       public pages of one market (home, stalls, map, apply)
  routes/admin/        organiser area (each loader and action checks the session)
  routes/status.tsx    trader self-service: progress, export, withdraw, deletion
  lib/models.server.ts Mongoose schemas: Market, Pitch, Application, User
  lib/data.server.ts   every database query
  lib/validation.ts    form rules
  lib/session.server.ts sign-in and the session cookie
  lib/theme.ts         turns a market's colours into CSS variables
  components/          shared UI (header, forms, pitch map)
scripts/               seed data and the local development launcher
tests/                 unit tests
```

## Environment variables

See `.env.example`. `MONGODB_URI` and `SESSION_SECRET` are required when deployed.
