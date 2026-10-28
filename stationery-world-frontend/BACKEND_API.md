# Backend API Contract — Stationery World Portal

This document is the spec for the backend. The frontend already calls
these exact endpoints through `src/api/*.js` — once your backend
matches this contract and you set `VITE_USE_MOCK_API=false` in `.env`,
the app switches over with **no frontend code changes**.

General rules:
- All request/response bodies are JSON (`Content-Type: application/json`).
- All endpoints except `POST /auth/login` require:
  `Authorization: Bearer <token>`
- Errors: return a non-2xx HTTP status with `{ "message": "human-readable reason" }`.
- Base URL is whatever you set as `VITE_API_BASE_URL` (e.g. `https://api.yourdomain.com/api`) — every path below is relative to it.

---

## Auth

### `POST /auth/login`
Request:
```json
{ "id": "RJENT01", "password": "demo123" }
```
Response `200`:
```json
{
  "token": "jwt-or-session-token",
  "user": {
    "id": "RJENT01",
    "name": "Rajesh Kulkarni",
    "org": "RJ Enterprises Pvt. Ltd.",
    "dept": "Administration",
    "phone": "9822011234"
  }
}
```
- `user.id === "ADMIN"` (or add a `role` field if you prefer — see note below) routes the logged-in user to the admin product-management screen instead of the customer dashboard.
- `401` on bad credentials with `{ "message": "Invalid User ID or Password" }`.

Logout is handled client-side (token is discarded) — no endpoint needed unless you want server-side session invalidation, in which case add `POST /auth/logout`.

There is no public self-registration endpoint. Customer accounts are
provisioned only by the admin, via `POST /admin/customers` (see the
"Admin — Customers" section below) — there is no "Create an account"
page on the login screen.

**Suggested improvement for production:** replace the special-cased `id === "ADMIN"` check with a proper `role: "admin" | "customer"` field on the user object, and update the one spot in `StationeryWorldApp.jsx` that checks `user.id === "ADMIN"`.

---

## Products (customer catalog)

### `GET /products`
Response `200`: array of catalog items —
```json
[
  {
    "id": 1,
    "name": "Ball Pen Blue — Pack of 10",
    "price": 60,
    "catId": "writing",
    "catName": "Writing Instruments",
    "unit": "per pack",
    "initial": "B",
    "image": "https://.../ballpen-blue.png",
    "brand": "Cello",
    "swCode": "SW-001",
    "customerCode": "CU-001",
    "mrp": 15,
    "discountPct": 0,
    "tipSize": "0.7 mm",
    "packSize": "Pack of 10",
    "inStock": true
  }
]
```
Consider adding query params for pagination/search/category filtering once the catalog grows past what's comfortable to send in one payload (`?category=writing&search=pen&page=1`).

---

## Admin — Customers

### `GET /admin/customers`
Response `200`: array of registered customers —
```json
[
  {
    "id": "RJENT01",
    "name": "Rajesh Kulkarni",
    "org": "RJ Enterprises Pvt. Ltd.",
    "dept": "Administration",
    "phone": "9822011234",
    "password": "demo123"
  }
]
```
This should return everyone who has an account (all provisioned via `POST /admin/customers` below) — the `ADMIN` account itself excluded.

> **Security note:** the admin Customers table shows each customer's password (behind a show/hide toggle), so this endpoint returns `password` in plain text. That only works if you store passwords in plain text or keep a separate reversible copy for admin display — a normal hashed-password backend (bcrypt, Django's `make_password`, etc.) **cannot** produce this. If you're using standard password hashing, either drop this field and remove the password column from the admin table, or maintain a deliberate, clearly-flagged plaintext/reversible copy for this purpose and treat it as a real security trade-off, not an oversight.


### `POST /admin/customers`
Requires an admin token. Used by the admin panel's "Add Customer" modal to provision a new customer account — the admin stays logged in as `ADMIN`; the new customer is **not** signed in.

Request:
```json
{
  "id": "RJENT01",
  "password": "demo123",
  "name": "Rajesh Kulkarni",
  "org": "RJ Enterprises Pvt. Ltd.",
  "dept": "Administration",
  "phone": "9822011234"
}
```
Response `201` — the created customer, echoing the password back so the admin table can display it (see the security note on `GET /admin/customers` above):
```json
{
  "id": "RJENT01",
  "name": "Rajesh Kulkarni",
  "org": "RJ Enterprises Pvt. Ltd.",
  "dept": "Administration",
  "phone": "9822011234",
  "password": "demo123"
}
```
- `409` if `id` is already taken (or reserved, e.g. `ADMIN`) with `{ "message": "This User ID is already taken. Please choose another." }`.
- `400` on missing/invalid fields with `{ "message": "human-readable reason" }`.

In mock mode (`VITE_USE_MOCK_API=true`), admin-added customers are kept in the browser's `localStorage` (separate from the seeded demo users), purely for local preview — swap to a real backend before going live.

### `PUT /admin/customers/:id`
Requires an admin token. Used by the admin panel's "Edit Customer" modal. `password` is optional — omit it (or send an empty string) to leave the existing password unchanged; the User ID itself is not editable.

Request:
```json
{
  "password": "",
  "name": "Rajesh Kulkarni",
  "org": "RJ Enterprises Pvt. Ltd.",
  "dept": "Administration",
  "phone": "9822011234"
}
```
Response `200`: the updated customer (with `password`, same as above), same shape as `POST /admin/customers`.
- `404` if the customer doesn't exist, with `{ "message": "Customer not found." }`.
- `400` on missing/invalid fields.

### `DELETE /admin/customers/:id`
Requires an admin token. Used by the 🗑️ action in the admin Customers table.
Response `204` (no body) on success. `404` if the customer doesn't exist.

---

## Products (admin management)

### `GET /admin/products`
Response `200`: array of admin rows —
```json
[{ "id": 1, "name": "Ball Pen Blue — Pack of 10", "category": "Writing Instruments", "price": 60, "qty": 100, "image": "...", "initial": "B" }]
```

### `POST /admin/products`
Request: `{ "name": "...", "category": "...", "price": 60, "qty": 100, "image": "..." }`
- `image` is **optional**. The admin panel's "Add/Edit Product" modal lets the admin pick a file, which the frontend converts client-side into a `data:image/...;base64,...` URL and sends as an ordinary string — no separate file-upload endpoint needed. A plain image URL works the same way. Omit it (or send `""`) to fall back to a placeholder.
- Because of this, request bodies can run to a couple of MB — make sure your JSON body-size limit is raised accordingly (e.g. Express's default `express.json()` 100kb limit is too small; use something like `express.json({ limit: "3mb" })`).
Response `201`: the created row (with server-assigned `id`).

### `PUT /admin/products/:id`
Request: same shape as POST. `image` is optional here too — omit/leave blank to keep the existing image.
Response `200`: the updated row.

### `DELETE /admin/products/:id`
Response `200`: `{ "success": true }`

---

## Quotations & Orders

A "quotation" and an "order" are the same shape; only `type` differs (`"quotation"` | `"order"`).

### `GET /quotations?customerId=RJENT01`
Response `200`: array of records, newest first —
```json
[
  {
    "id": "SW-Q-000039",
    "type": "quotation",
    "customerId": "RJENT01",
    "customer": "RJ Enterprises Pvt. Ltd.",
    "orderedBy": "Rajesh Kulkarni",
    "dept": "Administration",
    "date": "2026-07-15",
    "contact": "9822011234",
    "items": [
      { "id": 6, "name": "...", "catName": "...", "price": 240, "image": "...", "initial": "R", "swCode": "SW-006", "customerCode": "CU-006", "qty": 8 }
    ],
    "subtotal": 1920,
    "gst": 346,
    "grand": 2266
  }
]
```
Omit `customerId` query param to return everything (admin use case, if needed later).

### `POST /quotations`
Request body: same shape as one record above, minus `id` (server assigns it — e.g. `SW-Q-000040` / `SW-O-000012`).
Response `201`: the created record including its new `id`.

---

## Where this maps in the frontend

| Frontend call                              | Endpoint                     |
|---------------------------------------------|-------------------------------|
| `authApi.login(id, password)`                | `POST /auth/login`            |
| `authApi.getCustomers()`                     | `GET /admin/customers`         |
| `authApi.createCustomer(payload)`            | `POST /admin/customers`        |
| `authApi.updateCustomer(id, payload)`        | `PUT /admin/customers/:id`     |
| `authApi.deleteCustomer(id)`                 | `DELETE /admin/customers/:id`  |
| `productsApi.getCatalogProducts()`           | `GET /products`                |
| `productsApi.getAdminProducts()`             | `GET /admin/products`          |
| `productsApi.createProduct(data)`            | `POST /admin/products`         |
| `productsApi.updateProduct(id, data)`        | `PUT /admin/products/:id`      |
| `productsApi.deleteProduct(id)`              | `DELETE /admin/products/:id`   |
| `quotationsApi.getQuotationHistory(custId)`  | `GET /quotations?customerId=`  |
| `quotationsApi.createQuotation(payload)`     | `POST /quotations`             |
| `quotationsApi.updateQuotation(id, data)`    | `PUT /quotations/:id` (admin)  |

All of these live in `src/api/*.js`. Each function already has the mock-vs-real branch built in — building the backend to match this doc is the only remaining step.


---

## Admin — Edit a quotation / order

`PUT /quotations/:id` — **admin only** (403 for customers).

Body: `{ "items": [ { "id": 1, "name": "...", "price": 55, "qty": 5, "swCode": "SW-001", "customerCode": "CU-001" } ], "contact": "...", "orderedBy": "...", "dept": "...", "customer": "...", "date": "2026-10-19" }`

- `items` must be non-empty; each item needs a rate (`price` >= 0) and a whole-number `qty` >= 1 (otherwise 400).
- Each item may include `discountPct` (0–100, default 0; otherwise 400). `subtotal` is the total **after** discounts, `discount` is the total amount discounted, `gst` (18%) is charged on the discounted subtotal, and `grand` = subtotal + gst. All are recalculated by the server.
- The record gets `editedByAdmin: true` and an `updatedAt` timestamp.
- Returns the updated record (200); 404 if the id doesn't exist.

`POST /quotations` also accepts optional `discount` and `fromQuotation` (the quotation number an order was created from — used for the "Place Order" button on a past quotation).

### Admin — Make an order from a quotation

`POST /quotations/:id/make-order` — **admin only**. No body.

Creates an order for the same customer from the quotation's current items/totals (so edit + save the quotation first). The new order has `type: "order"`, `fromQuotation: "<quotation id>"` and `createdByAdmin: true`; the quotation gets `status: "ordered"` and `orderId`. Returns `201 { order, quotation }`. `409` if an order was already made from that quotation, `400` if the record is already an order, `404` if not found.

`GET /quotations` — customers only ever receive their own records; the admin receives everyone's (optionally filtered with `?customerId=`).

---

## Dispatch & Invoice (admin only)

All four endpoints need `Authorization: Bearer <admin token>` (403 for customers).

| Frontend function (`src/api/dispatch.js`) | Endpoint |
| --- | --- |
| `getDispatches(orderId)`        | `GET /dispatches?orderId=SW-O-000042` |
| `createDispatch(orderId, items)`| `POST /dispatches` — body `{ orderId, items: [{ id, qty }] }` → 201 dispatch `{ id: "SW-D-000001", orderId, customerId, customer, date, items, invoiceId: null }` |
| `getInvoices(orderId)`          | `GET /invoices?orderId=SW-O-000042` |
| `createInvoice(orderId)`        | `POST /invoices` — body `{ orderId }` → 201 `{ invoice, dispatches }` |

Rules: only orders (not quotations) can be dispatched; a dispatch can never exceed the remaining quantity of an item (400 with a readable message); an invoice (`SW-I-000001`) covers every dispatch of the order that is not invoiced yet and adds 18% GST on the discounted subtotal (409 if nothing is pending).

### Customer side additions
- `GET /dispatches` and `GET /invoices` — a **customer** token now returns only that customer's own records (admin still sees all). `POST` stays admin-only.
- `PUT /auth/me` — body `{ phone, gstNo }` (`gstNo` may be `""`). Validates a 10-digit phone and a 15-character GSTIN; returns the updated user. The GST number is copied onto new invoices as `gstNo`.
