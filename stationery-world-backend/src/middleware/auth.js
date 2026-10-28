import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config.js";

/* =====================================================
   AUTH MIDDLEWARE
   ---------------------------------------------------
   Every endpoint except POST /auth/login requires
   `Authorization: Bearer <token>` (see BACKEND_API.md).
   On success, attaches { id, role } to req.user.
===================================================== */

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "Missing or invalid Authorization header." });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token. Please log in again." });
  }
}

/** Chain after requireAuth on routes only the admin may call. */
export function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Admin access required." });
  }
  next();
}
