import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { DB_FILE } from "./config.js";

/* =====================================================
   DATABASE
   ---------------------------------------------------
   This is a flat-file JSON "database" (via lowdb) so the
   whole backend runs with zero external services — good
   enough for a small B2B portal, and easy to demo/deploy.

   IMPORTANT for whoever picks this up: every route talks
   to the functions below (or to `db.data` after `db.read()`),
   never to the JSON file directly. That means swapping this
   file for Postgres/Mongo/MySQL later is a one-file change —
   no route code needs to move.
===================================================== */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const resolvedDbFile = path.isAbsolute(DB_FILE) ? DB_FILE : path.join(__dirname, "..", DB_FILE);

fs.mkdirSync(path.dirname(resolvedDbFile), { recursive: true });

const defaultData = {
  users: [], // { id, password, name, org, dept, phone, role: "admin" | "customer" }
  products: [], // catalog products — see src/seed.js for the shape
  quotations: [], // quotations + orders (type differs)
  dispatches: [], // partial/full shipments made against an order
  invoices: [], // invoices raised from one or more dispatches
  counters: { quotation: 0, order: 0, dispatch: 0, invoice: 0 },
};

const adapter = new JSONFile(resolvedDbFile);
export const db = new Low(adapter, defaultData);

/** Call once at startup before the server accepts requests. */
export async function initDb() {
  await db.read();
  db.data ||= structuredClone(defaultData);
  // backfill: databases created before the Dispatch module existed
  db.data.dispatches ||= [];
  db.data.invoices ||= [];
  db.data.counters ||= {};
  for (const k of ["quotation", "order", "dispatch", "invoice"]) db.data.counters[k] ||= 0;
  await db.write();
}

/** Convenience so routes don't each repeat db.read()/db.write(). */
export async function withDb(fn) {
  await db.read();
  const result = await fn(db.data);
  await db.write();
  return result;
}
