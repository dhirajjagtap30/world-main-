import React, { useEffect, useMemo, useState } from "react";
import * as quotationsApi from "./api/quotations.js";
import * as dispatchApi from "./api/dispatch.js";
import { orderProgress } from "./utils/dispatchLogic.js";
import { inr, InvoiceModal, ThumbStyles } from "./InvoiceView.jsx";

/* =====================================================
   ADMIN → DISPATCH TAB
   1. Select an order (customer shows next to it)
   2. For every item: Ordered / Dispatched / Remaining,
      type how many pcs to send now and press Dispatch
   3. "Make Invoice" bills everything dispatched but not
      yet invoiced — price + 18% GST
   4. Invoice opens in a window you can print / save as PDF
===================================================== */

export default function DispatchPanel({ setToast }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orderId, setOrderId] = useState("");
  const [dispatches, setDispatches] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [qtyInput, setQtyInput] = useState({}); // itemId -> text typed in the box
  const [busy, setBusy] = useState(false);
  const [viewInvoice, setViewInvoice] = useState(null);

  /* all orders (admin sees everyone's) */
  useEffect(() => {
    let cancelled = false;
    quotationsApi
      .getQuotationHistory()
      .then((list) => !cancelled && setOrders(list.filter((q) => q.type === "order")))
      .catch(() => !cancelled && setToast("Could not load orders ✕"))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, []);

  /* dispatches + invoices of the selected order */
  useEffect(() => {
    setQtyInput({});
    if (!orderId) { setDispatches([]); setInvoices([]); return; }
    let cancelled = false;
    Promise.all([dispatchApi.getDispatches(orderId), dispatchApi.getInvoices(orderId)])
      .then(([d, i]) => { if (!cancelled) { setDispatches(d); setInvoices(i); } })
      .catch(() => !cancelled && setToast("Could not load dispatch details ✕"));
    return () => { cancelled = true; };
  }, [orderId]);

  const order = useMemo(() => orders.find((o) => o.id === orderId) || null, [orders, orderId]);
  const rows = useMemo(() => (order ? orderProgress(order, dispatches) : []), [order, dispatches]);
  const pendingDispatches = dispatches.filter((d) => !d.invoiceId);
  const pendingPcs = pendingDispatches.reduce((a, d) => a + d.items.reduce((s, it) => s + it.qty, 0), 0);
  const totalRemaining = rows.reduce((a, r) => a + r.remaining, 0);

  async function dispatchRow(r) {
    const qty = Number(qtyInput[r.id]);
    if (!Number.isInteger(qty) || qty < 1) { setToast("Enter how many pcs to dispatch (1 or more) ✕"); return; }
    if (qty > r.remaining) { setToast(`Only ${r.remaining} pcs of ${r.name} are left ✕`); return; }
    setBusy(true);
    try {
      const d = await dispatchApi.createDispatch(orderId, [{ id: r.id, qty }]);
      setDispatches((prev) => [d, ...prev]);
      setQtyInput((p) => ({ ...p, [r.id]: "" }));
      setToast(`${qty} pcs of ${r.name} dispatched ✓`);
    } catch (err) {
      setToast(err.message || "Could not dispatch ✕");
    } finally {
      setBusy(false);
    }
  }

  async function makeInvoice() {
    if (pendingPcs === 0) { setToast("Dispatch some items first ✕"); return; }
    setBusy(true);
    try {
      const { invoice } = await dispatchApi.createInvoice(orderId);
      setInvoices((prev) => [invoice, ...prev]);
      setDispatches((prev) => prev.map((d) => (invoice.dispatchIds.includes(d.id) ? { ...d, invoiceId: invoice.id } : d)));
      setViewInvoice(invoice);
      setToast(`Invoice ${invoice.id} created ✓`);
    } catch (err) {
      setToast(err.message || "Could not make invoice ✕");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <style>{`
        .dp-select{ display:flex; gap:14px; align-items:center; flex-wrap:wrap; margin-bottom:18px; }
        .dp-select select{ min-width:260px; padding:11px 14px; border:1.5px solid var(--line); border-radius:10px; font-size:14px; font-family:inherit; background:#fff; }
        .dp-cust{ padding:10px 14px; background:#fff; border:1.5px solid var(--line); border-radius:10px; font-size:14px; }
        .dp-section{ margin-top:22px; } .dp-section h3{ font-size:16px; color:var(--navy); margin:0 0 10px; }
        .dp-act{ display:flex; gap:8px; align-items:center; }
        .dp-btn{ background:var(--navy); color:#fff; border:none; border-radius:8px; padding:8px 16px; font-size:13px; font-weight:600; cursor:pointer; }
        .dp-btn:disabled{ opacity:.4; cursor:default; } .dp-btn:not(:disabled):hover{ background:var(--navy-2); }
        .dp-invoice-bar{ display:flex; align-items:center; gap:14px; flex-wrap:wrap; margin-top:18px; padding:14px 16px; background:#fff; border:1px solid var(--line); border-radius:12px; }
        .dp-make{ background:#1c7a3e; color:#fff; border:none; border-radius:10px; padding:11px 22px; font-size:14px; font-weight:700; cursor:pointer; }
        .dp-make:disabled{ opacity:.4; cursor:default; }
        .dp-zero{ color:#1c7a3e; font-weight:700; }
      `}</style>

      <div className="dp-select">
        <select value={orderId} onChange={(e) => setOrderId(e.target.value)} disabled={loading}>
          <option value="">{loading ? "Loading orders…" : orders.length ? "Select order…" : "No orders yet"}</option>
          {orders.map((o) => (<option key={o.id} value={o.id}>{o.id} · {o.customer}</option>))}
        </select>
        {order && <div className="dp-cust"><b>Customer:</b> {order.customer} <span className="mono">({order.customerId})</span></div>}
      </div>

      {!order ? (
        <div className="admin-table-wrap"><table className="admin-table"><tbody><tr><td className="admin-empty">Select an order above to start dispatching.</td></tr></tbody></table></div>
      ) : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Item Code</th><th>Product</th><th className="num">Ordered</th><th className="num">Dispatched</th><th className="num">Remaining</th><th>Dispatch now</th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="mono">{r.swCode || "—"}</td>
                    <td>{r.name}</td>
                    <td className="mono num">{r.ordered}</td>
                    <td className="mono num">{r.dispatched}</td>
                    <td className="mono num">{r.remaining === 0 ? <span className="dp-zero">Done ✓</span> : r.remaining}</td>
                    <td>
                      <div className="dp-act">
                        <input className="eq-num" type="number" min="1" max={r.remaining} step="1" placeholder="Qty"
                          disabled={r.remaining === 0 || busy} value={qtyInput[r.id] ?? ""}
                          onChange={(e) => setQtyInput((p) => ({ ...p, [r.id]: e.target.value }))}
                          onKeyDown={(e) => e.key === "Enter" && dispatchRow(r)} />
                        <button className="dp-btn" disabled={r.remaining === 0 || busy} onClick={() => dispatchRow(r)}>Dispatch</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="dp-invoice-bar">
            <button className="dp-make" disabled={busy || pendingPcs === 0} onClick={makeInvoice}>🧾 Make Invoice</button>
            <span>
              {pendingPcs > 0
                ? <>{pendingPcs} pcs dispatched and not yet invoiced — the invoice will show price with 18% GST.</>
                : <>Nothing waiting to be invoiced.</>}
              {totalRemaining === 0 && <> &nbsp;<b className="dp-zero">Order fully dispatched ✓</b></>}
            </span>
          </div>

          <div className="dp-section">
            <h3>Dispatch history</h3>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr><th>Dispatch No.</th><th>Date</th><th>Items sent</th><th>Invoice</th></tr></thead>
                <tbody>
                  {dispatches.length === 0 ? (
                    <tr><td colSpan={4} className="admin-empty">Nothing dispatched for this order yet.</td></tr>
                  ) : dispatches.map((d) => (
                    <tr key={d.id}>
                      <td className="mono">{d.id}</td>
                      <td>{d.date}</td>
                      <td>{d.items.map((it) => `${it.name} × ${it.qty}`).join(", ")}</td>
                      <td>{d.invoiceId ? <span className="eq-tag eq-tag-green">{d.invoiceId}</span> : <span className="eq-tag">not invoiced</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="dp-section">
            <h3>Invoices</h3>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr><th>Invoice No.</th><th>Date</th><th>Pieces</th><th className="num">Total (with GST)</th><th>Actions</th></tr></thead>
                <tbody>
                  {invoices.length === 0 ? (
                    <tr><td colSpan={5} className="admin-empty">No invoices made for this order yet.</td></tr>
                  ) : invoices.map((inv) => (
                    <tr key={inv.id}>
                      <td className="mono">{inv.id}</td>
                      <td>{inv.date}</td>
                      <td>{inv.items.reduce((a, it) => a + it.qty, 0)} pcs</td>
                      <td className="mono num">{inr(inv.grand)}</td>
                      <td><button className="dash-view-btn" onClick={() => setViewInvoice(inv)}>View / Print</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {viewInvoice && <InvoiceModal invoice={viewInvoice} onClose={() => setViewInvoice(null)} imageOf={(l) => order?.items.find((x) => x.id === l.id) || {}} />}
      <ThumbStyles />
    </>
  );
}
