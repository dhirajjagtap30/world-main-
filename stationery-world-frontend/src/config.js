/* =====================================================
   APP CONFIG
   ---------------------------------------------------
   Everything that changes between "demo with mock data"
   and "connected to the real backend" lives here, driven
   by environment variables (see .env.example).

   To go live against a real backend:
     1. Set VITE_API_BASE_URL to your API's base URL
     2. Set VITE_USE_MOCK_API=false
     3. Build (`npm run build`) — no other code changes needed.
===================================================== */

// Base URL for every real API call made via src/api/client.js
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// When true (default for this demo), src/api/* serve data from
// in-browser mock logic instead of calling a real backend.
// Flip to false once a backend exists at API_BASE_URL.
export const USE_MOCK_API =
  (import.meta.env.VITE_USE_MOCK_API ?? "true").toString().trim().toLowerCase() === "true";

// How long a real API call is allowed to hang before we surface
// a friendly timeout error instead of a frozen UI.
export const REQUEST_TIMEOUT_MS = 15000;

// Single source of truth for the localStorage keys the app uses,
// so the API layer and the app never drift out of sync.
export const STORAGE_KEYS = {
  TOKEN: "sw_token",
  USER: "sw_user",
  QUOTE_HISTORY: "sw_quote_history",
  ADMIN_PRODUCTS: "sw_admin_products",
  MOCK_USERS: "sw_mock_users",
  DISPATCHES: "sw_dispatches",
  INVOICES: "sw_invoices",
};
