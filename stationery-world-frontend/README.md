# Stationery World — Customer Ordering Portal

React + Vite frontend for Stationery World's B2B customer ordering
portal. Ships with a self-contained mock backend so it runs and
demos end-to-end today, and is structured so a real backend can be
connected later **without touching any component code**.

## What's included
- Login screen (session persists across page refresh)
- Product catalog (60 sample products across 10 categories, search + filter + sort)
- Cart / quotation builder (add products, adjust quantity)
- Auto-generated quotation with Customer Name, Ordered By, Department,
  Date, product table, GST estimate, and Stationery World branding
- Admin product management (add / edit / delete products)
- Customer dashboard with quotation & order history
- Responsive layout (mobile / tablet / desktop)
- Print / Save-as-PDF for the quotation
- A dedicated API service layer (`src/api/`) with loading/error states
  throughout the UI, ready to swap from mock data to a real backend

## Run locally
```
npm install
cp .env.example .env
npm run dev
```
Then open the printed local URL in your browser.

## Demo login
- User ID: `RJENT01` · Password: `demo123`
- User ID: `SUNPHARMA02` · Password: `demo123`
- Admin: User ID: `ADMIN` · Password: `admin123`

## Architecture — built for backend integration

```
src/
  config.js               – env-driven config (API base URL, mock toggle)
  api/
    client.js              – Axios instance: auth header, timeout, error handling
    auth.js                 – login / logout / restoreSession
    products.js              – catalog fetch + admin product CRUD
    quotations.js            – quotation/order history + create
  data/
    siteContent.js           – static site copy (nav, hero, categories) — not backend data
    mockCatalog.js            – DEMO-ONLY dataset (users, products, quote history)
  StationeryWorldApp.jsx      – UI only; talks to the app through src/api/*, never to mock data directly
  assets/                     – logo + product imagery
```

**The key idea:** `StationeryWorldApp.jsx` never imports mock data
directly — it only calls functions in `src/api/`. Each of those
functions internally checks `VITE_USE_MOCK_API`:
- `true` (default): resolves from local mock logic, persisted to
  `localStorage` so a refresh doesn't lose your session, cart
  history, or admin edits during the demo.
- `false`: calls your real backend at `VITE_API_BASE_URL` using the
  exact same function signature — no other code changes needed.

### Going live with a real backend
1. Build the backend to match **[`BACKEND_API.md`](./BACKEND_API.md)** — the exact endpoint list, request/response shapes, and auth header the frontend already expects.
2. In `.env`, set:
   ```
   VITE_API_BASE_URL=https://api.yourdomain.com/api
   VITE_USE_MOCK_API=false
   ```
3. `npm run build` — done. No component changes required.

### What's still mock/local when `VITE_USE_MOCK_API=true`
- Users, product catalog, and quotation history all live in
  `src/data/mockCatalog.js` and `localStorage` — not a real
  database. This is intentional: it lets the whole team review the
  UX before backend work starts, exactly as this project began.
- Product categories (`src/data/siteContent.js`) are static frontend
  constants either way; move them to an API later only if you expect
  them to change without a redeploy.

## Production build
```
npm run build
```
Outputs a static bundle to `dist/` — deploy it to any static host
(Netlify, Vercel, S3+CloudFront, Nginx, etc.). Because the app is a
pure SPA calling a JSON API, the backend can be hosted completely
separately (different domain/server) as long as CORS is configured
to allow the frontend's origin.

## Project structure
```
src/
  App.jsx                 – app entry, renders the portal
  StationeryWorldApp.jsx  – full portal (login, catalog, cart, quotation, admin)
  api/                    – backend service layer (see above)
  data/                   – static content + mock dataset
  assets/                 – logo + product imagery
  main.jsx                – React root
BACKEND_API.md             – full endpoint contract for the backend team
.env.example                – environment variable template
```
