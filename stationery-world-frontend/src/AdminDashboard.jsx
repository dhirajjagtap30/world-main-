import React, { useEffect, useMemo, useState } from "react";
import * as quotationsApi from "./api/quotations.js";
import * as dispatchApi from "./api/dispatch.js";
import * as productsApi from "./api/products.js";
import * as authApi from "./api/auth.js";
import { inr } from "./InvoiceView.jsx";
import { dispatchedMap } from "./utils/dispatchLogic.js";

/* Orders that still have pieces waiting to be dispatched (shared by Dashboard + Pending tab). */
export function pendingRows(orders, dispatches) {
  return orders
    .map((o) => {
      const done = dispatchedMap(dispatches, o.id);
      const ordered = o.items.reduce((a, it) => a + Number(it.qty || 0), 0);
      const sent = o.items.reduce((a, it) => a + Math.min(Number(it.qty || 0), done[it.id] || 0), 0);
      return { order: o, ordered, sent, remaining: ordered - sent };
    })
    .filter((r) => r.remaining > 0);
}

export function useAdminData(setToast) {
  const [state, setState] = useState({ loading: true, quotes: [], dispatches: [], invoices: [], products: [], customers: [] });
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      quotationsApi.getQuotationHistory(),
      dispatchApi.getDispatches(),
      dispatchApi.getInvoices(),
      productsApi.getAdminProducts(),
      authApi.getCustomers(),
    ])
      .then(([quotes, dispatches, invoices, products, customers]) => !cancelled && setState({ loading: false, quotes, dispatches, invoices, products, customers }))
      .catch(() => { if (!cancelled) { setToast("Could not load data ✕"); setState((s) => ({ ...s, loading: false })); } });
    return () => { cancelled = true; };
  }, []);
  return state;
}

export function AdminDashboard({ setToast, onGo }) {
  const d = useAdminData(setToast);
  const quotations = d.quotes.filter((q) => q.type !== "order");
  const orders = d.quotes.filter((q) => q.type === "order");
  const pending = useMemo(() => pendingRows(orders, d.dispatches), [d.quotes, d.dispatches]);
  const invoiced = d.invoices.reduce((a, i) => a + Number(i.grand || 0), 0);
  const cards = [
    { label: "Quotations", value: quotations.length, tab: "quotations" },
    { label: "Orders", value: orders.length, tab: "orders" },
    { label: "Pending dispatch", value: pending.length, tab: "pending", warn: pending.length > 0 },
    { label: "Invoices", value: d.invoices.length, sub: inr(invoiced), tab: "invoices" },
    { label: "Product items", value: d.products.length, tab: "products" },
    { label: "Customers", value: d.customers.length, tab: "customers" },
  ];
  const recent = [...d.quotes].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.id.localeCompare(a.id))).slice(0, 8);

  return (
    <>
      <style>{`
        .ad-cards{ display:grid; grid-template-columns:repeat(auto-fit,minmax(170px,1fr)); gap:14px; margin-bottom:22px; }
        .ad-card{ text-align:left; background:#fff; border:1px solid var(--line); border-radius:14px; padding:16px 18px; cursor:pointer; box-shadow:0 2px 10px rgba(22,48,79,.04); font-family:inherit; }
        .ad-card:hover{ border-color:var(--navy-2); }
        .ad-card small{ display:block; color:var(--ink-soft); font-weight:600; font-size:12.5px; }
        .ad-card b{ display:block; font-size:30px; color:var(--navy); margin-top:4px; }
        .ad-card em{ font-style:normal; font-size:12.5px; color:var(--ink-soft); }
        .ad-card.warn b{ color:#c2570c; }
      `}</style>
      {d.loading ? <div className="admin-empty" style={{ padding: 30 }}>Loading dashboard…</div> : (
        <>
          <div className="ad-cards">
            {cards.map((c) => (
              <button key={c.label} type="button" className={"ad-card" + (c.warn ? " warn" : "")} onClick={() => onGo(c.tab)}>
                <small>{c.label}</small><b>{c.value}</b>{c.sub && <em>{c.sub} billed</em>}
              </button>
            ))}
          </div>
          <h3 style={{ margin: "0 0 10px" }}>Latest quotations &amp; orders</h3>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>No.</th><th>Type</th><th>Date</th><th>Customer</th><th className="num">Total</th></tr></thead>
              <tbody>
                {recent.length === 0 ? <tr><td colSpan={5} className="admin-empty">Nothing yet.</td></tr> : recent.map((q) => (
                  <tr key={q.id}>
                    <td className="mono">{q.id}</td>
                    <td>{q.type === "order" ? "Order" : "Quotation"}</td>
                    <td>{q.date}</td>
                    <td>{q.customer} <small className="mono" style={{ color: "var(--ink-soft)" }}>({q.customerId})</small></td>
                    <td className="mono num">{inr(q.grand)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}

/* Admin → Pending tab: orders with pieces still to dispatch */
export function PendingPanel({ setToast, onGo }) {
  const d = useAdminData(setToast);
  const rows = useMemo(() => pendingRows(d.quotes.filter((q) => q.type === "order"), d.dispatches), [d.quotes, d.dispatches]);
  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead><tr><th>Order No.</th><th>Date</th><th>Customer</th><th>Ordered</th><th>Dispatched</th><th>Pending</th><th>Action</th></tr></thead>
        <tbody>
          {d.loading ? (
            <tr><td colSpan={7} className="admin-empty">Loading…</td></tr>
          ) : rows.length === 0 ? (
            <tr><td colSpan={7} className="admin-empty">No pending orders — everything has been dispatched ✓</td></tr>
          ) : rows.map(({ order: o, ordered, sent, remaining }) => (
            <tr key={o.id}>
              <td className="mono">{o.id}</td>
              <td>{o.date}</td>
              <td>{o.customer} <small className="mono" style={{ color: "var(--ink-soft)" }}>({o.customerId})</small></td>
              <td>{ordered} pcs</td>
              <td>{sent} pcs</td>
              <td><span className="eq-tag">{remaining} pcs</span></td>
              <td><button className="dash-view-btn" onClick={() => onGo("dispatch")}>Dispatch</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
