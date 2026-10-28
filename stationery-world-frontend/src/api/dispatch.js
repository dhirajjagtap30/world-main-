import { apiRequest } from "./client.js";
import { USE_MOCK_API, STORAGE_KEYS } from "../config.js";
import { getQuotationHistory } from "./quotations.js";
import { buildDispatchLines, buildInvoiceTotals, recalcInvoice } from "../utils/dispatchLogic.js";

/* =====================================================
   DISPATCH + INVOICE API (admin only)
   ---------------------------------------------------
   getDispatches(orderId)         → shipments made against an order
   createDispatch(orderId, items) → items = [{ id, qty }]
   getInvoices(orderId)           → invoices of an order
   createInvoice(orderId)         → invoice for all not-yet-invoiced dispatches

   Mock mode keeps everything in localStorage; real mode calls
   the endpoints in BACKEND_API.md.
===================================================== */

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

function load(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
}
function save(key, list) {
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch {
    /* storage unavailable — data stays in memory for this session only */
  }
}
const pad = (n) => String(n).padStart(6, "0");

async function findOrder(orderId) {
  const all = await getQuotationHistory();
  const order = all.find((q) => q.id === orderId);
  if (!order) throw new Error("Order not found.");
  if (order.type !== "order") throw new Error("Only orders can be dispatched (this is a quotation).");
  return order;
}

/* customerId: mock mode only (the real backend already limits a customer to their own records) */
export async function getDispatches(orderId, customerId) {
  if (USE_MOCK_API) {
    await delay(200);
    let list = load(STORAGE_KEYS.DISPATCHES);
    if (customerId) list = list.filter((d) => d.customerId === customerId);
    return orderId ? list.filter((d) => d.orderId === orderId) : list;
  }
  return apiRequest(`/dispatches${orderId ? `?orderId=${encodeURIComponent(orderId)}` : ""}`);
}

export async function createDispatch(orderId, items) {
  if (USE_MOCK_API) {
    await delay(300);
    const order = await findOrder(orderId);
    const list = load(STORAGE_KEYS.DISPATCHES);
    const lines = buildDispatchLines(order, list, items);
    const record = {
      id: "SW-D-" + pad(list.length + 1),
      orderId,
      customerId: order.customerId,
      customer: order.customer,
      date: new Date().toISOString().slice(0, 10),
      items: lines,
      invoiceId: null,
    };
    save(STORAGE_KEYS.DISPATCHES, [record, ...list]);
    return record;
  }
  return apiRequest("/dispatches", { method: "POST", body: { orderId, items } });
}

export async function getInvoices(orderId, customerId) {
  if (USE_MOCK_API) {
    await delay(200);
    let list = load(STORAGE_KEYS.INVOICES);
    if (customerId) list = list.filter((i) => i.customerId === customerId);
    return orderId ? list.filter((i) => i.orderId === orderId) : list;
  }
  return apiRequest(`/invoices${orderId ? `?orderId=${encodeURIComponent(orderId)}` : ""}`);
}

/** Returns { invoice, dispatches } — dispatches are the ones that got invoiced. */
export async function createInvoice(orderId) {
  if (USE_MOCK_API) {
    await delay(350);
    const order = await findOrder(orderId);
    const dispatches = load(STORAGE_KEYS.DISPATCHES);
    const pending = dispatches.filter((d) => d.orderId === orderId && !d.invoiceId);
    if (pending.length === 0) throw new Error("Nothing to invoice — dispatch some items first.");
    const invoices = load(STORAGE_KEYS.INVOICES);
    const invoice = {
      id: "SW-I-" + pad(invoices.length + 1),
      orderId,
      dispatchIds: pending.map((d) => d.id),
      customerId: order.customerId,
      customer: order.customer,
      orderedBy: order.orderedBy,
      dept: order.dept,
      contact: order.contact,
      gstNo: (load(STORAGE_KEYS.MOCK_USERS).find((u) => u.id === order.customerId) || {}).gstNo || "",
      date: new Date().toISOString().slice(0, 10),
      ...buildInvoiceTotals(pending),
    };
    save(STORAGE_KEYS.INVOICES, [invoice, ...invoices]);
    const marked = dispatches.map((d) => (invoice.dispatchIds.includes(d.id) ? { ...d, invoiceId: invoice.id } : d));
    save(STORAGE_KEYS.DISPATCHES, marked);
    return { invoice, dispatches: marked.filter((d) => invoice.dispatchIds.includes(d.id)) };
  }
  return apiRequest("/invoices", { method: "POST", body: { orderId } });
}

/** Admin: edit an invoice. data = { items, date?, contact?, gstNo? }. Totals are re-calculated. */
export async function updateInvoice(id, data) {
  if (USE_MOCK_API) {
    await delay(300);
    const list = load(STORAGE_KEYS.INVOICES);
    if (!list.some((i) => i.id === id)) throw new Error("Invoice not found.");
    const totals = recalcInvoice(data.items);
    const next = list.map((i) => (i.id === id ? {
      ...i, ...totals,
      ...(data.date ? { date: data.date } : {}),
      ...(data.contact !== undefined ? { contact: data.contact } : {}),
      ...(data.gstNo !== undefined ? { gstNo: data.gstNo } : {}),
      editedByAdmin: true,
    } : i));
    save(STORAGE_KEYS.INVOICES, next);
    return next.find((i) => i.id === id);
  }
  return apiRequest(`/invoices/${encodeURIComponent(id)}`, { method: "PUT", body: data });
}

/** Admin: delete an invoice. Its dispatches become "not invoiced" again so they can be re-invoiced. */
export async function deleteInvoice(id) {
  if (USE_MOCK_API) {
    await delay(250);
    const list = load(STORAGE_KEYS.INVOICES);
    if (!list.some((i) => i.id === id)) throw new Error("Invoice not found.");
    save(STORAGE_KEYS.INVOICES, list.filter((i) => i.id !== id));
    save(STORAGE_KEYS.DISPATCHES, load(STORAGE_KEYS.DISPATCHES).map((d) => (d.invoiceId === id ? { ...d, invoiceId: null } : d)));
    return { ok: true };
  }
  return apiRequest(`/invoices/${encodeURIComponent(id)}`, { method: "DELETE" });
}
