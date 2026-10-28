import React, { useEffect, useMemo, useState } from "react";
import * as dispatchApi from "./api/dispatch.js";
import { inr, Thumb, ThumbStyles } from "./InvoiceView.jsx";
import { viewPdf, downloadPdf } from "./utils/pdfDoc.js";
import { recalcInvoice } from "./utils/dispatchLogic.js";
import { exportListPdf, exportListXlsx } from "./utils/exportList.js";

/* Admin → Invoices tab: every invoice made from Dispatch, newest first.
   Search by invoice / order number, customer name or id; View / Print opens the invoice. */
export default function InvoicesPanel({ setToast }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [term, setTerm] = useState("");
  const [editing, setEditing] = useState(null); // { id, date, contact, gstNo, items:[...] }
  const [deleting, setDeleting] = useState(null); // invoice
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    dispatchApi
      .getInvoices()
      .then((list) => !cancelled && setInvoices([...list].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.id.localeCompare(a.id)))))
      .catch(() => !cancelled && setToast("Could not load invoices ✕"))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, []);

  const shown = useMemo(() => {
    const t = term.trim().toLowerCase();
    if (!t) return invoices;
    return invoices.filter((i) => [i.id, i.orderId, i.customer, i.customerId, i.date].some((v) => String(v || "").toLowerCase().includes(t)));
  }, [term, invoices]);

  function openEdit(inv) {
    setEditing({ id: inv.id, customer: inv.customer, customerId: inv.customerId, orderId: inv.orderId, date: inv.date || "", contact: inv.contact || "", gstNo: inv.gstNo || "",
      items: inv.items.map((it) => ({ ...it, discountPct: it.discountPct || 0 })) });
  }
  const setLine = (i, patch) => setEditing((e) => ({ ...e, items: e.items.map((l, idx) => (idx === i ? { ...l, ...patch } : l)) }));
  let preview = null, previewErr = "";
  if (editing) { try { preview = recalcInvoice(editing.items); } catch (err) { previewErr = err.message; } }

  async function saveEdit() {
    if (!preview || busy) { setToast(previewErr || "Fix the highlighted values ✕"); return; }
    setBusy(true);
    try {
      const updated = await dispatchApi.updateInvoice(editing.id, { items: editing.items, date: editing.date, contact: editing.contact, gstNo: editing.gstNo });
      setInvoices((list) => list.map((i) => (i.id === updated.id ? updated : i)));
      setEditing(null);
      setToast("Invoice " + updated.id + " updated ✓");
    } catch (err) { setToast(err.message || "Could not update the invoice ✕"); }
    finally { setBusy(false); }
  }

  async function confirmDelete() {
    if (!deleting || busy) return;
    setBusy(true);
    try {
      await dispatchApi.deleteInvoice(deleting.id);
      setInvoices((list) => list.filter((i) => i.id !== deleting.id));
      setToast("Invoice " + deleting.id + " deleted ✓");
      setDeleting(null);
    } catch (err) { setToast(err.message || "Could not delete the invoice ✕"); }
    finally { setBusy(false); }
  }

  const exportSpec = () => ({
    title: "Invoices list", sheetName: "Invoices", filename: "invoices",
    subtitle: shown.length + " invoices" + (term.trim() ? ' | search: "' + term.trim() + '"' : ""),
    columns: [
      { h: "Invoice No.", w: 1.5 }, { h: "Date", w: 1.1 }, { h: "Customer", w: 2.6 }, { h: "Customer ID", w: 1.4 }, { h: "Order No.", w: 1.5 },
      { h: "Pieces", w: 0.8, num: true }, { h: "Subtotal (Rs.)", w: 1.4, num: true, money: true }, { h: "GST (Rs.)", w: 1.2, num: true, money: true }, { h: "Total (Rs.)", w: 1.4, num: true, money: true },
    ],
    rows: shown.map((i) => [i.id, i.date, i.customer, i.customerId, i.orderId, (i.items || []).reduce((a, it) => a + Number(it.qty || 0), 0), Number(i.subtotal || 0), Number(i.gst || 0), Number(i.grand || 0)]),
    totalRow: ["Total", "", "", "", "", shown.reduce((a, i) => a + (i.items || []).reduce((s2, it) => s2 + Number(it.qty || 0), 0), 0), shown.reduce((a, i) => a + Number(i.subtotal || 0), 0), shown.reduce((a, i) => a + Number(i.gst || 0), 0), shown.reduce((a, i) => a + Number(i.grand || 0), 0)],
  });

  const total = shown.reduce((a, i) => a + Number(i.grand || 0), 0);

  return (
    <>
      <div className="admin-toolbar">
        <div className="admin-search-wrap">
          <div className="admin-search">
            <input type="text" placeholder="Search invoice no., order no. or customer…" value={term} onChange={(e) => setTerm(e.target.value)} />
            {term && <button type="button" className="admin-search-clear" aria-label="Clear" onClick={() => setTerm("")}>✕</button>}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button type="button" className="btn-outline" disabled={shown.length === 0} onClick={() => exportListPdf(exportSpec())}>⬇️ Export PDF</button>
          <button type="button" className="btn-outline" disabled={shown.length === 0} onClick={() => exportListXlsx(exportSpec())}>⬇️ Export Excel</button>
        </div>
        <span style={{ fontSize: 14 }}>{shown.length} invoice{shown.length === 1 ? "" : "s"} · Total <b className="mono">{inr(total)}</b></span>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Invoice No.</th><th>Date</th><th>Customer</th><th>Order</th><th>Pieces</th><th className="num">Total (with GST)</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="admin-empty">Loading invoices…</td></tr>
            ) : shown.length === 0 ? (
              <tr><td colSpan={7} className="admin-empty">{invoices.length ? "No invoice matches your search." : "No invoices yet — make one from the Dispatch tab."}</td></tr>
            ) : shown.map((inv) => (
              <tr key={inv.id}>
                <td className="mono">{inv.id}</td>
                <td>{inv.date}</td>
                <td>{inv.customer}{inv.editedByAdmin && <span className="eq-tag" style={{ marginLeft: 6 }}>edited</span>} <small className="mono" style={{ color: "var(--ink-soft)" }}>({inv.customerId})</small></td>
                <td className="mono">{inv.orderId}</td>
                <td>{(inv.items || []).reduce((a, it) => a + Number(it.qty || 0), 0)} pcs</td>
                <td className="mono num">{inr(inv.grand)}</td>
                <td>
                  <div className="admin-actions">
                    <button aria-label="View PDF" title="View PDF" onClick={() => viewPdf(inv, "TAX INVOICE")}>👁️</button>
                    <button aria-label="Download PDF" title="Download PDF" onClick={() => downloadPdf(inv, "TAX INVOICE")}>⬇️</button>
                    <button aria-label="Edit" title="Edit" onClick={() => openEdit(inv)}>✏️</button>
                    <button aria-label="Delete" title="Delete" onClick={() => setDeleting(inv)}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="admin-modal-overlay" onClick={() => !busy && setEditing(null)}>
          <div className="admin-modal eq-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-head">
              <h3>Edit invoice · <span className="mono">{editing.id}</span></h3>
              <button aria-label="Close" onClick={() => setEditing(null)}>✕</button>
            </div>
            <p style={{ margin: "0 0 12px", fontSize: 14 }}><b>{editing.customer}</b> ({editing.customerId}) · Order {editing.orderId}</p>
            <div className="field-row">
              <div className="field"><label>Date</label><input type="date" value={editing.date} onChange={(e) => setEditing({ ...editing, date: e.target.value })} /></div>
              <div className="field"><label>Contact</label><input value={editing.contact} onChange={(e) => setEditing({ ...editing, contact: e.target.value })} /></div>
            </div>
            <div className="field"><label>GSTIN</label><input value={editing.gstNo} onChange={(e) => setEditing({ ...editing, gstNo: e.target.value.toUpperCase() })} /></div>
            <div className="eq-scroll">
              <table className="admin-table">
                <thead><tr><th>Product</th><th>Qty</th><th>Rate (₹)</th><th>Disc. %</th><th className="num">Amount</th><th></th></tr></thead>
                <tbody>
                  {editing.items.map((l, i) => {
                    const num = (v) => (v === "" ? "" : Number(v));
                    const badQty = !Number.isInteger(Number(l.qty)) || Number(l.qty) < 1;
                    const badPrice = l.price === "" || !(Number(l.price) >= 0);
                    const badDisc = !(Number(l.discountPct) >= 0 && Number(l.discountPct) <= 100);
                    const amt = badQty || badPrice || badDisc ? null : Number(l.price) * Number(l.qty) * (1 - Number(l.discountPct) / 100);
                    const box = (bad) => ({ width: 78, padding: 7, border: "1.5px solid " + (bad ? "#d33" : "var(--line)"), borderRadius: 8, fontFamily: "inherit", fontSize: 14, textAlign: "center" });
                    return (
                      <tr key={l.id + "-" + i}>
                        <td><div className="cp-prod"><Thumb item={l} /><span>{l.name}<br /><small className="mono" style={{ color: "var(--ink-soft)" }}>{l.swCode}</small></span></div></td>
                        <td><input type="number" min="1" step="1" style={box(badQty)} value={l.qty} onChange={(e) => setLine(i, { qty: num(e.target.value) })} /></td>
                        <td><input type="number" min="0" step="0.01" style={box(badPrice)} value={l.price} onChange={(e) => setLine(i, { price: num(e.target.value) })} /></td>
                        <td><input type="number" min="0" max="100" step="0.5" style={box(badDisc)} value={l.discountPct} onChange={(e) => setLine(i, { discountPct: num(e.target.value) })} /></td>
                        <td className="mono num">{amt === null ? "—" : inr(amt)}</td>
                        <td><button type="button" className="dash-view-btn" title="Remove this line" onClick={() => setEditing((e) => ({ ...e, items: e.items.filter((_, idx) => idx !== i) }))}>🗑️</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="lk-totals">
              {preview ? (<>
                {preview.discount > 0 && <span>Discount: <b className="mono">−{inr(preview.discount)}</b></span>}
                <span>Subtotal: <b className="mono">{inr(preview.subtotal)}</b></span>
                <span>GST (18%): <b className="mono">{inr(preview.gst)}</b></span>
                <span>Total: <b className="mono">{inr(preview.grand)}</b></span>
              </>) : <span style={{ color: "#c22" }}>{previewErr}</span>}
            </div>
            <div className="eq-actions">
              <button type="button" className="dash-view-btn" onClick={() => setEditing(null)}>Cancel</button>
              <button type="button" className="admin-add-btn" disabled={busy || !preview} onClick={saveEdit}>{busy ? "Saving…" : "Save changes"}</button>
            </div>
          </div>
        </div>
      )}

      {deleting && (
        <div className="admin-modal-overlay" onClick={() => !busy && setDeleting(null)}>
          <div className="admin-modal" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-head">
              <h3>Delete invoice?</h3>
              <button aria-label="Close" onClick={() => setDeleting(null)}>✕</button>
            </div>
            <p style={{ fontSize: 14.5, lineHeight: 1.5 }}>
              <b className="mono">{deleting.id}</b> ({deleting.customer}, {inr(deleting.grand)}) will be removed for good.
              Its dispatches go back to “not invoiced”, so you can make a fresh invoice for them from the Dispatch tab.
            </p>
            <div className="eq-actions">
              <button type="button" className="dash-view-btn" onClick={() => setDeleting(null)}>Cancel</button>
              <button type="button" className="admin-add-btn" style={{ background: "#c22" }} disabled={busy} onClick={confirmDelete}>{busy ? "Deleting…" : "Yes, delete"}</button>
            </div>
          </div>
        </div>
      )}
      <ThumbStyles />
    </>
  );
}
