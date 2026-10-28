import { Router } from "express";
import { withDb } from "../db.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { ApiError, asyncRoute } from "../middleware/errorHandler.js";

const router = Router();
router.use(requireAuth, requireAdmin);

function toAdminShape(p) {
  return { id: p.id, name: p.name, category: p.category ?? p.catName, price: p.price, qty: p.qty ?? 0, image: p.image, initial: p.initial, swCode: p.swCode, customerCode: p.customerCode ?? "" };
}

/* GET /admin/products — see BACKEND_API.md "Products (admin management)". */
router.get(
  "/",
  asyncRoute(async (req, res) => {
    const products = await withDb(async (data) => data.products.map(toAdminShape));
    res.status(200).json(products);
  })
);

/* POST /admin/products — body: { name, category, price, qty, image? } → 201 created row.
   `image` is optional: a URL or a base64 data: URL (the frontend's
   file picker sends a data URL directly — no separate upload
   endpoint needed). Falls back to a placeholder when omitted. */
router.post(
  "/",
  asyncRoute(async (req, res) => {
    const { name, category, price, qty, image, customerCode } = req.body || {};
    if (!name || !category || price == null || qty == null) {
      throw new ApiError(400, "name, category, price and qty are required.");
    }

    const created = await withDb(async (data) => {
      const nextId = data.products.length ? Math.max(...data.products.map((p) => p.id)) + 1 : 1;
      const record = {
        id: nextId,
        name,
        category,
        price: Number(price),
        qty: Number(qty),
        image: image || `https://placehold.co/300x300?text=${encodeURIComponent(name.split(",")[0].trim())}`,
        initial: name.replace(/[^A-Za-z]/g, "")[0] || "S",
        // keep the catalog-facing fields sane defaults so GET /products
        // (which reads from this same collection) doesn't choke on a
        // product created purely through the admin panel.
        catId: category.toLowerCase().replace(/[^a-z]+/g, "-"),
        catName: category,
        unit: "per pc",
        brand: "Stationery World",
        swCode: "SW-" + String(nextId).padStart(3, "0"),
        customerCode: (customerCode || "").trim() || "CU-" + String(nextId).padStart(3, "0"),
        mrp: Number(price),
        discountPct: 0,
        tipSize: null,
        packSize: "Single unit",
        inStock: true,
      };
      data.products.push(record);
      return record;
    });

    res.status(201).json(toAdminShape(created));
  })
);

/* PUT /admin/products/:id — body: same shape as POST → 200 updated row.
   `image` is optional — omit/leave blank to keep the existing image. */
router.put(
  "/:id",
  asyncRoute(async (req, res) => {
    const id = Number(req.params.id);
    const { name, category, price, qty, image, customerCode } = req.body || {};
    if (!name || !category || price == null || qty == null) {
      throw new ApiError(400, "name, category, price and qty are required.");
    }

    const updated = await withDb(async (data) => {
      const product = data.products.find((p) => p.id === id);
      if (!product) throw new ApiError(404, "Product not found.");
      Object.assign(product, {
        name,
        category,
        catName: category,
        price: Number(price),
        qty: Number(qty),
        ...(customerCode !== undefined ? { customerCode: String(customerCode).trim() } : {}),
        ...(image ? { image } : {}),
      });
      return product;
    });

    res.status(200).json(toAdminShape(updated));
  })
);

/* DELETE /admin/products/:id → 200 { success: true }. */
router.delete(
  "/:id",
  asyncRoute(async (req, res) => {
    const id = Number(req.params.id);
    await withDb(async (data) => {
      const before = data.products.length;
      data.products = data.products.filter((p) => p.id !== id);
      if (data.products.length === before) throw new ApiError(404, "Product not found.");
    });
    res.status(200).json({ success: true });
  })
);

export default router;
