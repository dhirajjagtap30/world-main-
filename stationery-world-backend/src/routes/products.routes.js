import { Router } from "express";
import { withDb } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncRoute } from "../middleware/errorHandler.js";

const router = Router();

/* GET /products — customer catalog. See BACKEND_API.md "Products
   (customer catalog)". Requires auth like every other endpoint
   except /auth/login.

   TODO (noted in BACKEND_API.md): once the catalog grows, add
   ?category=&search=&page= query params here instead of always
   returning everything. */
router.get(
  "/",
  requireAuth,
  asyncRoute(async (req, res) => {
    const products = await withDb(async (data) =>
      data.products.map(
        ({
          id,
          name,
          price,
          catId,
          catName,
          unit,
          initial,
          image,
          brand,
          swCode,
          customerCode,
          mrp,
          discountPct,
          tipSize,
          packSize,
          inStock,
        }) => ({
          id,
          name,
          price,
          catId,
          catName,
          unit,
          initial,
          image,
          brand,
          swCode,
          customerCode,
          mrp,
          discountPct,
          tipSize,
          packSize,
          inStock,
        })
      )
    );
    res.status(200).json(products);
  })
);

export default router;
