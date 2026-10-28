import { apiRequest } from "./client.js";
import { USE_MOCK_API, STORAGE_KEYS } from "../config.js";
import { PRODUCTS as MOCK_CATALOG, ADMIN_PRODUCTS_SEED } from "../data/mockCatalog.js";

/* =====================================================
   PRODUCTS API
   ---------------------------------------------------
   getCatalogProducts()   → customer-facing browse/search list
   getAdminProducts()     → admin product-management table
   createProduct/update/delete → admin CRUD

   Mock mode persists admin edits to localStorage so they
   survive a page refresh during the demo. Real mode hits
   the endpoints documented in BACKEND_API.md.
===================================================== */

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function loadAdminStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ADMIN_PRODUCTS);
    if (raw) {
      // Older saved data may not have item codes yet — fill them in so
      // every product always shows an SW Item Code and Customer Item Code.
      const list = JSON.parse(raw);
      let changed = false;
      const fixed = list.map((p) => {
        const simple = String(p.id).padStart(3, "0");
        const swCode = p.swCode || "SW-" + simple;
        const customerCode = p.customerCode || "CU-" + simple;
        if (swCode !== p.swCode || customerCode !== p.customerCode) changed = true;
        return { ...p, swCode, customerCode };
      });
      if (changed) saveAdminStore(fixed);
      return fixed;
    }
  } catch {
    /* corrupted storage — fall through to reseed */
  }
  saveAdminStore(ADMIN_PRODUCTS_SEED);
  return ADMIN_PRODUCTS_SEED;
}
function saveAdminStore(list) {
  try {
    localStorage.setItem(STORAGE_KEYS.ADMIN_PRODUCTS, JSON.stringify(list));
  } catch {
    /* storage full/unavailable — edits stay in-memory for this session */
  }
}

export async function getCatalogProducts() {
  if (USE_MOCK_API) {
    await delay(250);
    return MOCK_CATALOG;
  }
  return apiRequest("/products");
}

export async function getAdminProducts() {
  if (USE_MOCK_API) {
    await delay(250);
    return loadAdminStore();
  }
  return apiRequest("/admin/products");
}

export async function createProduct(data) {
  if (USE_MOCK_API) {
    await delay(300);
    const list = loadAdminStore();
    const nextId = list.length ? Math.max(...list.map((p) => p.id)) + 1 : 1;
    const simple = String(nextId).padStart(3, "0");
    const record = { id: nextId, swCode: "SW-" + simple, ...data, customerCode: (data.customerCode || "").trim() || "CU-" + simple };
    saveAdminStore([...list, record]);
    return record;
  }
  return apiRequest("/admin/products", { method: "POST", body: data });
}

export async function updateProduct(id, data) {
  if (USE_MOCK_API) {
    await delay(300);
    const list = loadAdminStore();
    const next = list.map((p) => (p.id === id ? { ...p, ...data } : p));
    saveAdminStore(next);
    return next.find((p) => p.id === id);
  }
  return apiRequest(`/admin/products/${id}`, { method: "PUT", body: data });
}

export async function deleteProduct(id) {
  if (USE_MOCK_API) {
    await delay(300);
    const list = loadAdminStore();
    saveAdminStore(list.filter((p) => p.id !== id));
    return { success: true };
  }
  return apiRequest(`/admin/products/${id}`, { method: "DELETE" });
}
