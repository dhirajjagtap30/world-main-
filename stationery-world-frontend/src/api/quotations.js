import { apiRequest } from "./client.js";
import { USE_MOCK_API, STORAGE_KEYS } from "../config.js";
import { INITIAL_QUOTE_HISTORY } from "../data/mockCatalog.js";

/* =====================================================
   QUOTATIONS / ORDERS API
   ---------------------------------------------------
   getQuotationHistory(customerId) → list for the dashboard
   createQuotation(payload)        → save a new quotation or order

   Mock mode persists to localStorage so history survives a
   refresh. Real mode hits the endpoints in BACKEND_API.md.
===================================================== */

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function loadStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.QUOTE_HISTORY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* corrupted storage — fall through to reseed */
  }
  saveStore(INITIAL_QUOTE_HISTORY);
  return INITIAL_QUOTE_HISTORY;
}
function saveStore(list) {
  try {
    localStorage.setItem(STORAGE_KEYS.QUOTE_HISTORY, JSON.stringify(list));
  } catch {
    /* storage full/unavailable — history stays in-memory for this session */
  }
}

export async function getQuotationHistory(customerId) {
  if (USE_MOCK_API) {
    await delay(300);
    const list = loadStore();
    return customerId ? list.filter((q) => q.customerId === customerId) : list;
  }
  const query = customerId ? `?customerId=${encodeURIComponent(customerId)}` : "";
  return apiRequest(`/quotations${query}`);
}

/* Admin: edit a quotation/order. Totals are recalculated from the items. */
export async function updateQuotation(id, data) {
  const items = data.items.map((it) => ({ ...it, price: Number(it.price), qty: Number(it.qty), discountPct: Number(it.discountPct) || 0 }));
  const gross = items.reduce((s, it) => s + it.price * it.qty, 0);
  const subtotal = Math.round(items.reduce((s, it) => s + it.price * it.qty * (1 - it.discountPct / 100), 0) * 100) / 100;
  const gst = Math.round(subtotal * 0.18);
  const discount = Math.round((gross - subtotal) * 100) / 100;
  const body = { ...data, items, subtotal, gst, discount, grand: subtotal + gst };
  if (USE_MOCK_API) {
    await delay(300);
    const list = loadStore();
    const next = list.map((q) =>
      q.id === id ? { ...q, ...body, editedByAdmin: true, updatedAt: new Date().toISOString() } : q
    );
    saveStore(next);
    return next.find((q) => q.id === id);
  }
  return apiRequest(`/quotations/${encodeURIComponent(id)}`, { method: "PUT", body });
}

/* Admin: convert a quotation into an order for the same customer. */
export async function makeOrderFromQuotation(id) {
  if (USE_MOCK_API) {
    await delay(350);
    const list = loadStore();
    const quotation = list.find((q) => q.id === id);
    if (!quotation) throw new Error("Quotation not found.");
    if (quotation.type === "order") throw new Error("This is already an order.");
    if (quotation.orderId || list.some((q) => q.fromQuotation === id)) {
      throw new Error("An order has already been made for this quotation.");
    }
    const { id: _id, type: _t, editedByAdmin: _e, updatedAt: _u, status: _s, orderId: _o, ...rest } = quotation;
    const order = {
      ...rest,
      id: "SW-O-" + String(Math.max(42, ...list.map((q) => Number(String(q.id).replace(/\D/g, "")) || 0)) + 1).padStart(6, "0"),
      type: "order",
      date: new Date().toISOString().slice(0, 10),
      fromQuotation: id,
      createdByAdmin: true,
    };
    const updatedQuotation = { ...quotation, status: "ordered", orderId: order.id };
    saveStore([order, ...list.map((q) => (q.id === id ? updatedQuotation : q))]);
    return { order, quotation: updatedQuotation };
  }
  return apiRequest(`/quotations/${encodeURIComponent(id)}/make-order`, { method: "POST" });
}

export async function createQuotation(payload) {
  if (USE_MOCK_API) {
    await delay(400);
    const list = loadStore();
    const nextNum = Math.max(42, ...list.map((q) => Number(String(q.id).replace(/\D/g, "")) || 0)) + 1;
    const prefix = payload.type === "order" ? "SW-O-" : "SW-Q-";
    const record = { ...payload, id: prefix + String(nextNum).padStart(6, "0") };
    saveStore([record, ...list]);
    return record;
  }
  return apiRequest("/quotations", { method: "POST", body: payload });
}
