# Stationery World — Backend

Node.js/Express backend for the Stationery World customer ordering
portal. Implements **exactly** the contract in the frontend repo's
`BACKEND_API.md` — every path, method, request/response shape, and
error format matches, so the existing React app works against this
with **zero frontend code changes**.

## Quick start
```bash
npm install
cp .env.example .env
npm run dev
```
The server listens on `http://localhost:5000` by default and seeds
itself with demo data on first run (see "Demo logins" below) — no
separate migration step needed.

## Connect the frontend
In the frontend's `.env`:
```
VITE_API_BASE_URL=http://localhost:5000
VITE_USE_MOCK_API=false
```
Then `npm run dev` (or `npm run build`) the frontend as usual. No
component code changes are required — see the frontend's
`BACKEND_API.md` and `README.md` for how that wiring works.

## Demo logins (seeded automatically)
| User ID       | Password  | Role     |
|---------------|-----------|----------|
| `RJENT01`     | demo123   | customer |
| `SUNPHARMA02` | demo123   | customer |
| `ADMIN`       | admin123  | admin    |

## Project structure
```
src/
  server.js                 – entrypoint: seeds DB, starts HTTP server
  app.js                    – Express app: middleware + route mounting
  config.js                 – env-driven config, single source of truth
  db.js                     – lowdb (JSON-file) database wrapper
  seed.js                   – demo users + catalog, mirrors the frontend's mock data
  middleware/
    auth.js                  – JWT verification (requireAuth, requireAdmin)
    errorHandler.js           – consistent { message } error responses
  routes/
    auth.routes.js            – POST /auth/login
    products.routes.js        – GET /products (customer catalog)
    adminCustomers.routes.js  – GET/POST/PUT/DELETE /admin/customers
    adminProducts.routes.js   – GET/POST/PUT/DELETE /admin/products
    quotations.routes.js      – GET/POST /quotations
  utils/ids.js               – SW-Q-000040 / SW-O-000012 id generator
data/db.json                 – the "database" (gitignored, created on first run)
```

## Data storage
This ships with a flat-file JSON database (via [lowdb](https://github.com/typicode/lowdb))
so it runs with zero external services — good enough for a small B2B
portal and easy to deploy anywhere Node runs. Every route talks to
`src/db.js` only, never to the JSON file directly, so **swapping in
Postgres/MySQL/Mongo later means rewriting `src/db.js` alone** — no
route files need to change.

## Auth
Stateless JWT. `POST /auth/login` returns a token; every other
endpoint requires `Authorization: Bearer <token>` and 401s without
one. Admin-only endpoints (`/admin/*`) additionally 403 for a
non-admin token. There's no refresh-token flow — tokens simply
expire after `JWT_EXPIRES_IN` (default 7 days) and the frontend
re-prompts for login, matching how the frontend already handles a
401 from any call.

## ⚠️ Before deploying this for real
- **Set a real `JWT_SECRET`** in `.env` — the app refuses to start in
  `NODE_ENV=production` with the default one.
- **Passwords are stored in plain text.** This is intentional and
  documented in `BACKEND_API.md`'s security note: the admin panel's
  Customers table displays each customer's password behind a
  show/hide toggle, which a normal hashed-password backend can't
  support. If that requirement changes, hash passwords (bcrypt) and
  drop the `password` field from `GET/POST/PUT /admin/customers`
  responses and the admin table's reveal feature together.
- **Lock down `CORS_ORIGIN`** to your real frontend domain(s).
- Consider moving off the JSON-file store to a real database before
  meaningful traffic — see "Data storage" above.
- Product images are seeded as placeholder URLs
  (`placehold.co`) — replace with real product photography /
  a CDN/object-storage URL before going live.

## Scripts
- `npm run dev` — start with auto-restart on file change (Node's
  built-in `--watch`)
- `npm start` — start normally
- `npm run seed` — force a seed pass (only fills empty collections;
  safe to run anytime)
