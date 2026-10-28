import { Router } from "express";
import { withDb } from "../db.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { ApiError, asyncRoute } from "../middleware/errorHandler.js";
import { nextDocId } from "../utils/ids.js";

/* =====================================================
   DISPATCH + INVOICE (admin only)
   ---------------------------------------------------
   An order can be dispatched in several parts. Each
   dispatch records how many pieces of each item left
   the shop. An invoice is then made from the dispatches
   that have not been invoiced yet (price + 18% GST).

   GET  /dispatches?orderId=SW-O-000042   (admin: all, customer: own only)
   POST /dispatches   { orderId, items: [{ id, qty }] }
   GET  /invoices?orderId=SW-O-000042
   POST /invoices     { orderId }   (invoices all pending dispatches)
   PUT  /invoices/:id { items, date?, contact?, gstNo? }   (admin edit, totals recalculated)
   DELETE /invoices/:id   (its dispatches become not-invoiced again)
===================================================== */

const router = Router();
const guard = [requireAuth, requireAdmin];
const GST_RATE = 0.18;
const round2 = (n) => Math.round(n * 100) / 100;

function findOrder(data, orderId) {
  const order = data.quotations.find((q) => q.id === orderId);
  if (!order) throw new ApiError(404, "Order not found.");
  if (order.type !== "order") throw new ApiError(400, "Only orders can be dispatched (this is a quotation).");
  return order;
}

function dispatchedMap(data, orderId) {
  const map = {};
  for (const d of data.dispatches.filter((x) => x.orderId === orderId)) {
    for (const it of d.items) map[it.id] = (map[it.id] || 0) + it.qty;
  }
  return map;
}

/* Customers can READ their own dispatches/invoices; everything else is admin-only. */
const ownOnly = (req, list) => (req.user.role === "admin" ? list : list.filter((x) => x.customerId === req.user.id));

router.get(
  "/dispatches",
  requireAuth,
  asyncRoute(async (req, res) => {
    const { orderId } = req.query;
    const list = await withDb(async (data) => {
      const all = ownOnly(req, orderId ? data.dispatches.filter((d) => d.orderId === orderId) : data.dispatches);
      return [...all].sort((a, b) => (a.id < b.id ? 1 : -1));
    });
    res.status(200).json(list);
  })
);

router.post(
  "/dispatches",
  ...guard,
  asyncRoute(async (req, res) => {
    const { orderId, items } = req.body || {};
    if (!orderId || !Array.isArray(items) || items.length === 0) {
      throw new ApiError(400, "orderId and at least one item to dispatch are required.");
    }

    const created = await withDb(async (data) => {
      const order = findOrder(data, orderId);
      const already = dispatchedMap(data, orderId);
      const lines = [];

      for (const row of items) {
        const qty = Number(row.qty);
        if (!Number.isInteger(qty) || qty < 1) throw new ApiError(400, "Dispatch quantity must be a whole number of at least 1.");
        const orderItem = order.items.find((it) => it.id === row.id);
        if (!orderItem) throw new ApiError(400, "An item you are dispatching is not part of this order.");
        const remaining = Number(orderItem.qty) - (already[orderItem.id] || 0);
        if (qty > remaining) {
          throw new ApiError(400, `Only ${remaining} pcs of "${orderItem.name}" are left to dispatch (you entered ${qty}).`);
        }
        const existing = lines.find((l) => l.id === orderItem.id);
        if (existing) {
          if (existing.qty + qty > remaining) throw new ApiError(400, `Too many pcs of "${orderItem.name}" in one dispatch.`);
          existing.qty += qty;
        } else {
          lines.push({
            id: orderItem.id,
            name: orderItem.name,
            swCode: orderItem.swCode,
            customerCode: orderItem.customerCode,
            price: Number(orderItem.price),
            discountPct: Number(orderItem.discountPct) || 0,
            qty,
          });
        }
      }

      const record = {
        id: nextDocId(data, "dispatch"),
        orderId,
        customerId: order.customerId,
        customer: order.customer,
        date: new Date().toISOString().slice(0, 10),
        items: lines,
        invoiceId: null,
      };
      data.dispatches.unshift(record);
      return record;
    });

    res.status(201).json(created);
  })
);

router.get(
  "/invoices",
  requireAuth,
  asyncRoute(async (req, res) => {
    const { orderId } = req.query;
    const list = await withDb(async (data) => {
      const all = ownOnly(req, orderId ? data.invoices.filter((i) => i.orderId === orderId) : data.invoices);
      return [...all].sort((a, b) => (a.id < b.id ? 1 : -1));
    });
    res.status(200).json(list);
  })
);

router.post(
  "/invoices",
  ...guard,
  asyncRoute(async (req, res) => {
    const { orderId } = req.body || {};
    if (!orderId) throw new ApiError(400, "orderId is required.");

    const result = await withDb(async (data) => {
      const order = findOrder(data, orderId);
      const pending = data.dispatches.filter((d) => d.orderId === orderId && !d.invoiceId);
      if (pending.length === 0) throw new ApiError(409, "Nothing to invoice — dispatch some items first.");

      // merge the pending dispatches into one set of invoice lines
      const lines = [];
      for (const d of pending) {
        for (const it of d.items) {
          const line = lines.find((l) => l.id === it.id);
          if (line) line.qty += it.qty;
          else lines.push({ ...it });
        }
      }
      const gross = lines.reduce((s, l) => s + l.price * l.qty, 0);
      const subtotal = round2(lines.reduce((s, l) => s + l.price * l.qty * (1 - l.discountPct / 100), 0));
      const discount = round2(gross - subtotal);
      const gst = Math.round(subtotal * GST_RATE);

      const invoice = {
        id: nextDocId(data, "invoice"),
        orderId,
        dispatchIds: pending.map((d) => d.id),
        customerId: order.customerId,
        customer: order.customer,
        orderedBy: order.orderedBy,
        dept: order.dept,
        contact: order.contact,
        gstNo: data.users.find((u) => u.id === order.customerId)?.gstNo || "",
        date: new Date().toISOString().slice(0, 10),
        items: lines,
        subtotal,
        discount,
        gst,
        grand: subtotal + gst,
      };
      data.invoices.unshift(invoice);
      for (const d of pending) d.invoiceId = invoice.id;
      return { invoice, dispatches: pending };
    });

    res.status(201).json(result);
  })
);

router.put(
  "/invoices/:id",
  ...guard,
  asyncRoute(async (req, res) => {
    const { items, date, contact, gstNo } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) throw new ApiError(400, "An invoice needs at least one item.");
    const lines = items.map((it) => {
      const price = Number(it.price);
      const qty = Number(it.qty);
      const discountPct = it.discountPct === undefined || it.discountPct === "" || it.discountPct === null ? 0 : Number(it.discountPct);
      if (!Number.isFinite(price) || price < 0 || !Number.isInteger(qty) || qty < 1) throw new ApiError(400, "Every item needs a valid rate and a whole-number quantity of at least 1.");
      if (!Number.isFinite(discountPct) || discountPct < 0 || discountPct > 100) throw new ApiError(400, "Discount must be between 0 and 100 percent.");
      return { ...it, price, qty, discountPct };
    });
    const gross = lines.reduce((s, l) => s + l.price * l.qty, 0);
    const subtotal = round2(lines.reduce((s, l) => s + l.price * l.qty * (1 - l.discountPct / 100), 0));
    const discount = round2(gross - subtotal);
    const gst = Math.round(subtotal * GST_RATE);

    const updated = await withDb(async (data) => {
      const inv = data.invoices.find((i) => i.id === req.params.id);
      if (!inv) throw new ApiError(404, "Invoice not found.");
      Object.assign(inv, {
        items: lines, subtotal, discount, gst, grand: subtotal + gst,
        ...(date ? { date } : {}),
        ...(contact !== undefined ? { contact } : {}),
        ...(gstNo !== undefined ? { gstNo } : {}),
        editedByAdmin: true,
      });
      return inv;
    });
    res.status(200).json(updated);
  })
);

router.delete(
  "/invoices/:id",
  ...guard,
  asyncRoute(async (req, res) => {
    await withDb(async (data) => {
      const idx = data.invoices.findIndex((i) => i.id === req.params.id);
      if (idx === -1) throw new ApiError(404, "Invoice not found.");
      data.invoices.splice(idx, 1);
      for (const d of data.dispatches) if (d.invoiceId === req.params.id) d.invoiceId = null;
    });
    res.status(200).json({ ok: true });
  })
);

export default router;
