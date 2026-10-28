import { Router } from "express";
import jwt from "jsonwebtoken";
import { withDb } from "../db.js";
import { JWT_SECRET, JWT_EXPIRES_IN } from "../config.js";
import { ApiError, asyncRoute } from "../middleware/errorHandler.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

/* POST /auth/login — see BACKEND_API.md "Auth" section.
   Body: { id, password } → 200 { token, user } | 401 { message } */
router.post(
  "/login",
  asyncRoute(async (req, res) => {
    const { id, password } = req.body || {};
    if (!id || !password) {
      throw new ApiError(400, "User ID and password are required.");
    }

    const cleanId = String(id).trim().toUpperCase();

    const user = await withDb(async (data) => data.users.find((u) => u.id === cleanId));

    if (!user || user.password !== password) {
      throw new ApiError(401, "Invalid User ID or Password");
    }

    const token = jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    const { password: _pass, role: _role, ...safeUser } = user;
    res.status(200).json({ token, user: safeUser });
  })
);

/* PUT /auth/me — the logged-in user edits their own contact number and GST number.
   Body: { phone, gstNo } (gstNo may be "" to clear it) → 200 safe user */
router.put(
  "/me",
  requireAuth,
  asyncRoute(async (req, res) => {
    const phone = String(req.body?.phone ?? "").replace(/[\s-]/g, "");
    const gstNo = String(req.body?.gstNo ?? "").trim().toUpperCase();
    if (!/^(\+?91)?\d{10}$/.test(phone)) throw new ApiError(400, "Enter a valid 10-digit contact number.");
    if (gstNo && !/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gstNo)) {
      throw new ApiError(400, "GST number must be 15 characters, e.g. 27ABCDE1234F1Z5.");
    }
    const updated = await withDb(async (data) => {
      const user = data.users.find((u) => u.id === req.user.id);
      if (!user) throw new ApiError(404, "User not found.");
      user.phone = phone.slice(-10);
      user.gstNo = gstNo;
      return user;
    });
    const { password: _p, role: _r, ...safeUser } = updated;
    res.status(200).json(safeUser);
  })
);

export default router;
