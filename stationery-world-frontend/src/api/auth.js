import { apiRequest } from "./client.js";
import { USE_MOCK_API, STORAGE_KEYS } from "../config.js";
import { DUMMY_USERS } from "../data/mockCatalog.js";

/* =====================================================
   AUTH API
   ---------------------------------------------------
   login()/logout()/restoreSession() are what the UI calls.
   Internals branch on USE_MOCK_API so the component layer
   never needs to change when a real backend goes live.
   Real-mode contract: POST /auth/login → { token, user }
   See BACKEND_API.md.
===================================================== */

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function persistSession(token, user) {
  localStorage.setItem(STORAGE_KEYS.TOKEN, token);
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
}

/* ---------- mock-mode only: customer directory ----------
   In real mode this is irrelevant — the backend owns user storage.
   In mock mode, every non-ADMIN customer (both the seeded demo
   accounts and anything the admin adds/edits/removes) lives in this
   single localStorage-backed store, so admin edits and deletes work
   the same way on seed data as on freshly-added customers. It's
   lazily seeded from DUMMY_USERS the first time it's read. */
function loadMockUsers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MOCK_USERS);
    if (raw) return JSON.parse(raw);
  } catch {
    /* corrupted storage — fall through to reseed */
  }
  const seeded = DUMMY_USERS.filter((u) => u.id !== "ADMIN");
  saveMockUsers(seeded);
  return seeded;
}

function saveMockUsers(users) {
  localStorage.setItem(STORAGE_KEYS.MOCK_USERS, JSON.stringify(users));
}

export async function login(id, password) {
  if (USE_MOCK_API) {
    await delay(400);
    const cleanId = id.trim().toUpperCase();
    const admin = DUMMY_USERS.find((u) => u.id === "ADMIN");
    const found = [admin, ...loadMockUsers()].find(
      (u) => u && u.id === cleanId && u.pass === password
    );
    if (!found) throw Object.assign(new Error("Invalid User ID or Password"), { status: 401 });
    const { pass, ...safeUser } = found;
    const token = "mock-" + btoa(`${safeUser.id}:${Date.now()}`);
    persistSession(token, safeUser);
    return safeUser;
  }

  const data = await apiRequest("/auth/login", {
    method: "POST",
    body: { id, password },
    auth: false,
  });
  persistSession(data.token, data.user);
  return data.user;
}

export function logout() {
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER);
}

/* Called once on app load to silently resume a saved session
   (so a page refresh doesn't force the user to log in again). */
export function restoreSession() {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    const rawUser = localStorage.getItem(STORAGE_KEYS.USER);
    if (token && rawUser) return JSON.parse(rawUser);
  } catch {
    /* corrupted storage — ignore and fall through to null */
  }
  return null;
}

/* ---------- admin: customer list ----------
   Real-mode contract: GET /admin/customers → array of customers
   (see BACKEND_API.md). Used by the admin panel's "Customers" tab.
   Includes `password` in plain text so the admin table can show it —
   see the note in BACKEND_API.md about the security trade-off this
   implies for a real backend. */
export async function getCustomers() {
  if (USE_MOCK_API) {
    await delay(300);
    return loadMockUsers()
      .map(({ pass, ...safe }) => ({ ...safe, password: pass }))
      .reverse(); // newest first
  }

  return apiRequest("/admin/customers", { method: "GET" });
}

/* ---------- admin: create customer ----------
   Real-mode contract: POST /admin/customers → created customer (no password)
   (see BACKEND_API.md). Used by the admin panel's "Add Customer" modal.
   This does NOT sign the admin out of their own session — the admin
   stays logged in as ADMIN, the new customer is not signed in. */
export async function createCustomer({ id, password, name, org, dept, phone }) {
  if (USE_MOCK_API) {
    await delay(500);
    const cleanId = id.trim().toUpperCase();
    if (!cleanId) {
      throw Object.assign(new Error("Please choose a User ID."), { status: 400 });
    }
    if (cleanId === "ADMIN") {
      throw Object.assign(new Error("That User ID is reserved. Please choose another."), { status: 409 });
    }
    const mockUsers = loadMockUsers();
    const taken = mockUsers.some((u) => u.id === cleanId);
    if (taken) {
      throw Object.assign(new Error("This User ID is already taken. Please choose another."), { status: 409 });
    }
    const newUser = {
      id: cleanId,
      pass: password,
      name: name.trim(),
      org: org.trim(),
      dept: dept.trim(),
      phone: phone.trim(),
    };
    mockUsers.push(newUser);
    saveMockUsers(mockUsers);
    const { pass, ...safeUser } = newUser;
    return { ...safeUser, password: pass };
  }

  return apiRequest("/admin/customers", {
    method: "POST",
    body: { id, password, name, org, dept, phone },
  });
}

/* ---------- admin: update customer ----------
   Real-mode contract: PUT /admin/customers/:id → updated customer (no password)
   (see BACKEND_API.md). Used by the admin panel's "Edit Customer" modal.
   `password` is optional — omit/leave blank to keep the existing one. */
export async function updateCustomer(id, { password, name, org, dept, phone }) {
  if (USE_MOCK_API) {
    await delay(400);
    const mockUsers = loadMockUsers();
    const idx = mockUsers.findIndex((u) => u.id === id);
    if (idx === -1) {
      throw Object.assign(new Error("Customer not found."), { status: 404 });
    }
    const updated = {
      ...mockUsers[idx],
      name: name.trim(),
      org: org.trim(),
      dept: dept.trim(),
      phone: phone.trim(),
      ...(password ? { pass: password } : {}),
    };
    mockUsers[idx] = updated;
    saveMockUsers(mockUsers);
    const { pass, ...safeUser } = updated;
    return { ...safeUser, password: pass };
  }

  return apiRequest(`/admin/customers/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: { password, name, org, dept, phone },
  });
}

/* ---------- admin: delete customer ----------
   Real-mode contract: DELETE /admin/customers/:id → 204 No Content
   (see BACKEND_API.md). Used by the admin panel's Customers table. */
export async function deleteCustomer(id) {
  if (USE_MOCK_API) {
    await delay(300);
    const mockUsers = loadMockUsers();
    const next = mockUsers.filter((u) => u.id !== id);
    saveMockUsers(next);
    return true;
  }

  await apiRequest(`/admin/customers/${encodeURIComponent(id)}`, { method: "DELETE" });
  return true;
}

/* ---------- customer: edit own contact no. + GST no. ----------
   Real-mode contract: PUT /auth/me  body { phone, gstNo } → updated user */
export function validateProfile({ phone, gstNo }) {
  const digits = String(phone || "").replace(/[\s-]/g, "");
  if (!/^(\+?91)?\d{10}$/.test(digits)) return "Enter a valid 10-digit contact number.";
  const g = String(gstNo || "").trim().toUpperCase();
  if (g && !/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(g)) return "GST number must be 15 characters, e.g. 27ABCDE1234F1Z5.";
  return "";
}

export async function updateMyProfile(current, { phone, gstNo }) {
  const err = validateProfile({ phone, gstNo });
  if (err) throw new Error(err);
  const clean = { phone: String(phone).replace(/[\s-]/g, "").slice(-10), gstNo: String(gstNo || "").trim().toUpperCase() };
  let user;
  if (USE_MOCK_API) {
    await delay(300);
    const users = loadMockUsers().map((u) => (u.id === current.id ? { ...u, ...clean } : u));
    saveMockUsers(users);
    user = { ...current, ...clean };
  } else {
    user = await apiRequest("/auth/me", { method: "PUT", body: clean });
  }
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  return user;
}
