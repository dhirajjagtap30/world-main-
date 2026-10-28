import { Router } from "express";
import { withDb } from "../db.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { ApiError, asyncRoute } from "../middleware/errorHandler.js";
import { nextQuotationId } from "../utils/ids.js";

const router = Router();
router.use(requireAuth);

/* GET /quotations?customerId=RJENT01 — newest first. Omit the query
   param to return everything (admin use case). See BACKEND_API.md. */
router.get(
  "/",
  asyncRoute(async (req, res) => {
    // Customers only ever see their own records; the admin sees everyone's
    // (optionally narrowed with ?customerId=).
    const customerId = req.user.role === "admin" ? req.query.customerId : req.user.id;
    const list = await withDb(async (data) => {
      const all = customerId ? data.quotations.filter((q) => q.customerId === customerId) : data.quotations;
      // newest first
      return [...all].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
    });
    res.status(200).json(list);
  })
);

/* POST /quotations — body: a record minus `id` (server assigns it).
   type: "quotation" | "order" decides the SW-Q-/SW-O- prefix. */
router.post(
  "/",
  asyncRoute(async (req, res) => {
    const body = req.body || {};
    const { type, customerId, customer, orderedBy, dept, date, contact, items, subtotal, gst, discount, grand, fromQuotation } = body;

    if (!type || !customerId || !Array.isArray(items) || items.length === 0) {
      throw new ApiError(400, "type, customerId and a non-empty items array are required.");
    }

    const created = await withDb(async (data) => {
      const record = {
        id: nextQuotationId(data, type),
        type,
        customerId,
        customer,
        orderedBy,
        dept,
        date,
        contact,
        items,
        subtotal,
        gst,
        ...(discount ? { discount } : {}),
        grand,
        ...(fromQuotation ? { fromQuotation } : {}),
      };
      data.quotations.unshift(record);
      return record;
    });

    res.status(201).json(created);
  })
);

/* PUT /quotations/:id — ADMIN ONLY. Edit a quotation/order a customer
   submitted. Body: { items, contact?, orderedBy?, dept?, customer?, date? }.
   Totals are recalculated here (never trusted from the client).
   Each item may carry `discountPct` (0–100); GST is charged on the discounted subtotal. */
router.put(
  "/:id",
  requireAdmin,
  asyncRoute(async (req, res) => {
    const { items, contact, orderedBy, dept, customer, date } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      throw new ApiError(400, "A quotation needs at least one item.");
    }
    const cleanItems = items.map((it) => {
      const price = Number(it.price);
      const qty = Number(it.qty);
      const discountPct = it.discountPct === undefined || it.discountPct === "" ? 0 : Number(it.discountPct);
      if (!Number.isFinite(price) || price < 0 || !Number.isInteger(qty) || qty < 1) {
        throw new ApiError(400, "Every item needs a valid rate and a whole-number quantity of at least 1.");
      }
      if (!Number.isFinite(discountPct) || discountPct < 0 || discountPct > 100) {
        throw new ApiError(400, "Discount must be between 0 and 100 percent.");
      }
      return { ...it, price, qty, discountPct };
    });
    const gross = cleanItems.reduce((s, it) => s + it.price * it.qty, 0);
    const subtotal = Math.round(cleanItems.reduce((s, it) => s + it.price * it.qty * (1 - it.discountPct / 100), 0) * 100) / 100;
    const discount = Math.round((gross - subtotal) * 100) / 100;
    const gst = Math.round(subtotal * 0.18);

    const updated = await withDb(async (data) => {
      const record = data.quotations.find((q) => q.id === req.params.id);
      if (!record) throw new ApiError(404, "Quotation not found.");
      Object.assign(record, {
        items: cleanItems,
        subtotal,
        gst,
        discount,
        grand: subtotal + gst,
        ...(contact !== undefined ? { contact } : {}),
        ...(orderedBy !== undefined ? { orderedBy } : {}),
        ...(dept !== undefined ? { dept } : {}),
        ...(customer !== undefined ? { customer } : {}),
        ...(date ? { date } : {}),
        editedByAdmin: true,
        updatedAt: new Date().toISOString(),
      });
      return record;
    });

    res.status(200).json(updated);
  })
);

/* POST /quotations/:id/make-order — ADMIN ONLY. Converts a (usually just
   edited) quotation into an order for the same customer. The order copies
   the quotation's current items and totals, is marked `fromQuotation`
   and `createdByAdmin`, and the quotation gets `status: "ordered"` +
   `orderId`. Refuses (409) if an order was already made from it.
   Returns { order, quotation }. */
router.post(
  "/:id/make-order",
  requireAdmin,
  asyncRoute(async (req, res) => {
    const result = await withDb(async (data) => {
      const quotation = data.quotations.find((q) => q.id === req.params.id);
      if (!quotation) throw new ApiError(404, "Quotation not found.");
      if (quotation.type === "order") throw new ApiError(400, "This is already an order.");
      if (quotation.orderId || data.quotations.some((q) => q.fromQuotation === quotation.id)) {
        throw new ApiError(409, "An order has already been made for this quotation.");
      }

      const { id, type, editedByAdmin, updatedAt, status, orderId, ...rest } = quotation;
      const order = {
        ...rest,
        id: nextQuotationId(data, "order"),
        type: "order",
        date: new Date().toISOString().slice(0, 10),
        fromQuotation: quotation.id,
        createdByAdmin: true,
      };
      data.quotations.unshift(order);
      quotation.status = "ordered";
      quotation.orderId = order.id;
      return { order, quotation };
    });
    res.status(201).json(result);
  })
);

export default router;
