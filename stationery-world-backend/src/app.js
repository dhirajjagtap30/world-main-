import express from "express";
import cors from "cors";
import morgan from "morgan";
import { CORS_ORIGIN } from "./config.js";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler.js";

import authRoutes from "./routes/auth.routes.js";
import productsRoutes from "./routes/products.routes.js";
import adminCustomersRoutes from "./routes/adminCustomers.routes.js";
import adminProductsRoutes from "./routes/adminProducts.routes.js";
import quotationsRoutes from "./routes/quotations.routes.js";
import dispatchRoutes from "./routes/dispatch.routes.js";

export const app = express();

app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: false,
  })
);
// Raised from Express's 100kb default so a product image sent as a
// base64 data URL (frontend's admin image picker, up to ~1.5MB of
// raw image data) fits in the request body.
app.use(express.json({ limit: "3mb" }));
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// Simple liveness/readiness check — not part of BACKEND_API.md,
// but handy for uptime monitors and deploy platforms.
app.get("/health", (req, res) => res.status(200).json({ status: "ok" }));

// Every route below is mounted relative to the app's base URL —
// whatever you set VITE_API_BASE_URL to on the frontend
// (e.g. https://api.yourdomain.com/api) should point at wherever
// this app is served from.
app.use("/auth", authRoutes);
app.use("/products", productsRoutes);
app.use("/admin/customers", adminCustomersRoutes);
app.use("/admin/products", adminProductsRoutes);
app.use("/quotations", quotationsRoutes);
// Admin-only: /dispatches and /invoices (auth is applied per route inside)
app.use(dispatchRoutes);

app.use(notFoundHandler);
app.use(errorHandler);
