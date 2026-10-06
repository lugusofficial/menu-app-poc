# menu-app-poc

QR code menu for restaurants, with the bill split at the table.

A diner points their camera at the code on the table, the menu opens on that
table in the browser, everyone at the table adds what they want, and at the end
the bill splits three ways: evenly, by what each person actually had, or by
amounts the table types in. No app to install.

**Live demo:** https://lugusofficial.github.io/menu-app-poc/

This is a proof of concept. It is frontend only and runs on mock data; there is
no backend, no payment and nothing is sent to a kitchen. The table state lives
in the browser's local storage, so a second tab on the same table behaves like a
second phone.

## What it does

| | |
|---|---|
| Scan a table | `/t/:venueSlug/:tableId` is the QR target. The home page prints a working QR code for each demo table. |
| Join | Each person enters a name. Items are then attributed to whoever added them. |
| Order | Browse by category or search, set quantity and a note, send the order to the kitchen. |
| Split evenly | The whole bill divided by the number of people. |
| Split by item | Tap who had each dish. A dish tapped by two people is split between them. |
| Split by amount | Each person types what they will pay; the page says what is still missing or over. |
| Service fee | The 10% Brazilian service charge can be dropped, and the split follows. |

The split is the point, so it is the part that is most carefully built:

- Every amount is an integer number of cents. No float ever holds a price.
- A share that does not divide evenly is settled with the largest remainder, so
  the shares always add back up to the bill, to the cent.
- Food nobody has claimed is reported, never silently absorbed into someone's share.
- `src/features/bill/split.ts` is pure and has no React in it. It is covered by
  its own test suite, including the cases where the cents do not divide.

## Running it

```bash
cd frontend
npm install
npm run dev            # http://localhost:5173/menu-app-poc/
```

To reach it from a phone on the same network (which is how you would scan a
real QR code), run `npm run dev -- --host` and open the address Vite prints.

## Checks

```bash
cd frontend
npm run lint           # eslint
npm run test:run       # vitest, unit and component tests
npm run test:e2e       # playwright, builds and previews the app first
npm run build          # tsc + vite build + the Pages 404 fallback
```

`npm run test:e2e` needs the browser once: `npx playwright install chromium`.

## How it is laid out

```
frontend/src/
├── app/            App, routes, TableLayout (header, tabs, table session)
├── features/
│   ├── menu/       the menu: types, mock data, api, MenuPage, item card, item sheet
│   ├── session/    who is at the table: reducer, storage, context, JoinTablePage
│   ├── order/      OrderPage: the table's order and its totals
│   ├── bill/       split.ts (the engine), BillPage, the money field
│   └── home/       the landing page and its QR codes
├── shared/         money, useAsync, Toast, diner colours, i18n (pt and en), design tokens
└── test/           vitest setup and the render helper pages are tested through
frontend/e2e/       playwright specs, run on a phone viewport
```

The app talks to `features/menu/api.ts`, which today reads `mockData.ts` behind
an artificial delay. Pages are written against the loading and error states that
delay produces, so swapping in a real HTTP client is a change to that one file.

## Deployment

GitHub Pages serves static files, which is all a Vite build is, so the SPA works
there. Deep links need one trick: Pages has no file behind `/t/cantina-do-porto/12`
and falls back to `404.html`, so the build copies `index.html` there
(`scripts/spa-fallback.mjs`). The app then boots on the real URL and React Router
reads the path, which is what makes a QR code able to point straight at a table.

`vite.config.ts` sets `base` to `/menu-app-poc/` for the project page. Building
for another host is `BASE_PATH=/ npm run build`.

Pushing to `main` runs the checks and deploys (`.github/workflows/`).

## Not built yet

A backend and a real menu per venue; payment; the kitchen side; live sync
between phones over the network (today it is local storage, so it syncs only
between tabs on one device); accounts; a venue admin.
