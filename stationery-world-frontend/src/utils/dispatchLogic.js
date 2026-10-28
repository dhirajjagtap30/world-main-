/* Pure helpers for the Dispatch + Invoice module (no React, no network).
   Used by the mock API and by the Dispatch screen. The real backend
   (stationery-world-backend/src/routes/dispatch.routes.js) applies the same rules. */

export const GST_RATE = 0.18;
const round2 = (n) => Math.round(n * 100) / 100;

/** { itemId: totalPiecesDispatched } for one order. */
export function dispatchedMap(dispatches, orderId) {
  const map = {};
  for (const d of dispatches) {
    if (d.orderId !== orderId) continue;
    for (const it of d.items) map[it.id] = (map[it.id] || 0) + Number(it.qty);
  }
  return map;
}

/** Rows for the Dispatch table: ordered / dispatched / remaining per item. */
export function orderProgress(order, dispatches) {
  const done = dispatchedMap(dispatches, order.id);
  return order.items.map((it) => {
    const ordered = Number(it.qty);
    const dispatched = done[it.id] || 0;
    return { ...it, ordered, dispatched, remaining: Math.max(0, ordered - dispatched) };
  });
}

/** Validates the entered quantities and returns the lines for a new dispatch. Throws Error with a readable message. */
export function buildDispatchLines(order, dispatches, entries) {
  const done = dispatchedMap(dispatches, order.id);
  const lines = [];
  for (const row of entries) {
    const qty = Number(row.qty);
    if (!Number.isInteger(qty) || qty < 1) throw new Error("Dispatch quantity must be a whole number of at least 1.");
    const it = order.items.find((x) => x.id === row.id);
    if (!it) throw new Error("An item you are dispatching is not part of this order.");
    const remaining = Number(it.qty) - (done[it.id] || 0);
    if (qty > remaining) throw new Error(`Only ${remaining} pcs of "${it.name}" are left to dispatch (you entered ${qty}).`);
    lines.push({
      id: it.id, name: it.name, swCode: it.swCode, customerCode: it.customerCode,
      price: Number(it.price), discountPct: Number(it.discountPct) || 0, qty,
    });
  }
  return lines;
}

/** Merges the lines of several dispatches and adds discount, 18% GST and the grand total. */
export function buildInvoiceTotals(pendingDispatches) {
  const lines = [];
  for (const d of pendingDispatches) {
    for (const it of d.items) {
      const line = lines.find((l) => l.id === it.id);
      if (line) line.qty += Number(it.qty);
      else lines.push({ ...it, qty: Number(it.qty) });
    }
  }
  const gross = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const subtotal = round2(lines.reduce((s, l) => s + l.price * l.qty * (1 - l.discountPct / 100), 0));
  const discount = round2(gross - subtotal);
  const gst = Math.round(subtotal * GST_RATE);
  return { items: lines, subtotal, discount, gst, grand: subtotal + gst };
}

export const lineTotal = (l) => round2(l.price * l.qty * (1 - (l.discountPct || 0) / 100));

/** Re-calculates an invoice after the admin edits its lines. Throws Error with a readable message. */
export function recalcInvoice(items) {
  if (!Array.isArray(items) || items.length === 0) throw new Error("An invoice needs at least one item.");
  const lines = items.map((it) => {
    const price = Number(it.price), qty = Number(it.qty);
    const discountPct = it.discountPct === undefined || it.discountPct === "" || it.discountPct === null ? 0 : Number(it.discountPct);
    if (!Number.isFinite(price) || price < 0 || !Number.isInteger(qty) || qty < 1) throw new Error("Every item needs a valid rate and a whole-number quantity of at least 1.");
    if (!Number.isFinite(discountPct) || discountPct < 0 || discountPct > 100) throw new Error("Discount must be between 0 and 100 percent.");
    return { ...it, price, qty, discountPct };
  });
  const gross = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const subtotal = round2(lines.reduce((s, l) => s + l.price * l.qty * (1 - l.discountPct / 100), 0));
  const discount = round2(gross - subtotal);
  const gst = Math.round(subtotal * GST_RATE);
  return { items: lines, subtotal, discount, gst, grand: subtotal + gst };
}
