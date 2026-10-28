import { Router } from "express";
import { withDb } from "../db.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { ApiError, asyncRoute } from "../middleware/errorHandler.js";

const router = Router();
router.use(requireAuth, requireAdmin);

/* Security note (also called out in BACKEND_API.md): the admin
   Customers table shows each customer's password behind a
   show/hide toggle, so this API returns it in plain text. That's
   only safe because these are low-stakes internal ordering
   accounts, not end-user logins to something sensitive — it is a
   deliberate trade-off, not an oversight. If that stops being true,
   drop `password` from these responses and the admin table's
   reveal feature along with it. */
function toSafeCustomer({ password, role, ...rest }) {
  return { ...rest, password };
}

/* GET /admin/customers — everyone with an account, ADMIN excluded. */
router.get(
  "/",
  asyncRoute(async (req, res) => {
    const customers = await withDb(async (data) =>
      data.users.filter((u) => u.role !== "admin").map(toSafeCustomer).reverse()
    );
    res.status(200).json(customers);
  })
);

/* POST /admin/customers — provisions a new customer account.
   Admin stays logged in as ADMIN; the new customer is not signed in. */
router.post(
  "/",
  asyncRoute(async (req, res) => {
    const { id, password, name, org, dept, phone } = req.body || {};
    if (!id || !password || !name || !org || !dept || !phone) {
      throw new ApiError(400, "id, password, name, org, dept and phone are all required.");
    }

    const cleanId = String(id).trim().toUpperCase();
    if (cleanId === "ADMIN") {
      throw new ApiError(409, "This User ID is already taken. Please choose another.");
    }

    const created = await withDb(async (data) => {
      if (data.users.some((u) => u.id === cleanId)) {
        throw new ApiError(409, "This User ID is already taken. Please choose another.");
      }
      const record = {
        id: cleanId,
        password,
        name: String(name).trim(),
        org: String(org).trim(),
        dept: String(dept).trim(),
        phone: String(phone).trim(),
        role: "customer",
      };
      data.users.push(record);
      return record;
    });

    res.status(201).json(toSafeCustomer(created));
  })
);

/* PUT /admin/customers/:id — password optional (blank/omitted keeps existing). */
router.put(
  "/:id",
  asyncRoute(async (req, res) => {
    const id = String(req.params.id).toUpperCase();
    const { password, name, org, dept, phone } = req.body || {};
    if (!name || !org || !dept || !phone) {
      throw new ApiError(400, "name, org, dept and phone are required.");
    }

    const updated = await withDb(async (data) => {
      const user = data.users.find((u) => u.id === id && u.role !== "admin");
      if (!user) throw new ApiError(404, "Customer not found.");
      Object.assign(user, {
        name: String(name).trim(),
        org: String(org).trim(),
        dept: String(dept).trim(),
        phone: String(phone).trim(),
        ...(password ? { password } : {}),
      });
      return user;
    });

    res.status(200).json(toSafeCustomer(updated));
  })
);

/* DELETE /admin/customers/:id → 204 No Content. */
router.delete(
  "/:id",
  asyncRoute(async (req, res) => {
    const id = String(req.params.id).toUpperCase();
    await withDb(async (data) => {
      const before = data.users.length;
      data.users = data.users.filter((u) => !(u.id === id && u.role !== "admin"));
      if (data.users.length === before) throw new ApiError(404, "Customer not found.");
    });
    res.status(204).send();
  })
);

export default router;
