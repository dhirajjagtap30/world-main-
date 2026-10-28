import "dotenv/config";

/* =====================================================
   CONFIG
   ---------------------------------------------------
   Everything environment-specific lives here, read once
   from process.env (see .env.example). Every other file
   imports from here instead of touching process.env
   directly, so there's a single place to check when
   something is misconfigured.
===================================================== */

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const PORT = Number(process.env.PORT || 5000);

export const JWT_SECRET = required(
  "JWT_SECRET",
  process.env.NODE_ENV === "production" ? undefined : "dev-only-insecure-secret"
);

export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

export const CORS_ORIGIN = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export const DB_FILE = process.env.DB_FILE || "./data/db.json";

if (process.env.NODE_ENV === "production" && JWT_SECRET === "dev-only-insecure-secret") {
  throw new Error("Refusing to start in production with the default JWT_SECRET. Set a real one in .env.");
}
