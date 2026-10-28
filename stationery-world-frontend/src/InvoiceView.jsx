import React from "react";
import { lineTotal } from "./utils/dispatchLogic.js";

/* Shared invoice helpers: INR formatting, printable window, and the on-screen invoice modal.
   Used by the admin Dispatch tab and the customer Invoices page. */

export const inr = (n) => "₹" + Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* Small square product picture; falls back to the first letter when there is no image. */
export function Thumb({ item, size = 34 }) {
  return (
    <span className="cp-thumb" style={{ width: size, height: size }}>
      {item?.image ? <img src={item.image} alt="" loading="lazy" /> : (item?.initial || (item?.name || "?").charAt(0))}
    </span>
  );
}

/* heading: "TAX INVOICE" (default) or "QUOTATION" / "ORDER" — the same printable layout serves all three */
export function printInvoice(inv, heading = "TAX INVOICE") {
  const rows = inv.items
    .map(
      (l, i) => `<tr><td>${i + 1}</td><td>${esc(l.swCode || "")}</td><td>${esc(l.name)}</td><td class="r">${l.qty}</td>
      <td class="r">${inr(l.price)}</td><td class="r">${l.discountPct ? l.discountPct + "%" : "—"}</td><td class="r">${inr(lineTotal(l))}</td></tr>`
    )
    .join("");
  const w = window.open("", "_blank", "width=900,height=700");
  if (!w) {
    alert("Please allow pop-ups to print the invoice.");
    return;
  }
  w.document.write(`<!doctype html><html><head><title>${esc(inv.id)}</title><style>
    body{font-family:Arial,sans-serif;color:#22303f;margin:32px}
    h1{margin:0;color:#16304f} .top{display:flex;justify-content:space-between;border-bottom:3px solid #f5a800;padding-bottom:12px;margin-bottom:18px}
    table{width:100%;border-collapse:collapse;font-size:13px} th{background:#16304f;color:#fff;text-align:left;padding:8px;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    td{padding:8px;border-bottom:1px solid #ddd} .r{text-align:right} .tot{margin-left:auto;width:300px;margin-top:14px;font-size:14px}
    .tot div{display:flex;justify-content:space-between;padding:4px 0} .grand{border-top:2px solid #16304f;font-weight:700;font-size:16px}
  </style></head><body>
    <div class="top"><div><h1>Stationery World</h1><div>${esc(heading)}</div></div>
    <div style="text-align:right"><b>${esc(inv.id)}</b><br/>Date: ${esc(inv.date)}${inv.orderId ? "<br/>Order: " + esc(inv.orderId) : ""}</div></div>
    <p><b>Billed to:</b> ${esc(inv.customer)} (${esc(inv.customerId)})${inv.gstNo ? "<br/>GSTIN: " + esc(inv.gstNo) : ""}<br/>${esc(inv.orderedBy || "")}${inv.dept ? " · " + esc(inv.dept) : ""}${inv.contact ? "<br/>Contact: " + esc(inv.contact) : ""}</p>
    <table><thead><tr><th>#</th><th>Item Code</th><th>Product</th><th class="r">Qty</th><th class="r">Rate</th><th class="r">Disc.</th><th class="r">Amount</th></tr></thead><tbody>${rows}</tbody></table>
    <div class="tot">
      ${inv.discount > 0 ? `<div><span>Discount</span><span>−${inr(inv.discount)}</span></div>` : ""}
      <div><span>Subtotal</span><span>${inr(inv.subtotal)}</span></div>
      <div><span>GST (18%)</span><span>${inr(inv.gst)}</span></div>
      <div class="grand"><span>Total (incl. GST)</span><span>${inr(inv.grand)}</span></div>
    </div>
    <p style="margin-top:40px;font-size:12px;color:#5b6b7a">Thank you for your business.</p>
    <script>window.onload=function(){window.print()}</script></body></html>`);
  w.document.close();
}


/* imageOf(item) → { image, initial } lets the caller supply product pictures (invoice lines do not store them) */
export function InvoiceModal({ invoice: viewInvoice, onClose, imageOf }) {
  const invoice = viewInvoice;
  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal eq-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-head">
          <h3>Invoice · <span className="mono">{invoice.id}</span></h3>
          <button aria-label="Close" onClick={onClose}>✕</button>
        </div>
        <p style={{ margin: "0 0 12px", fontSize: 14 }}>
          <b>{invoice.customer}</b> ({invoice.customerId}){invoice.gstNo ? <><br />GSTIN: <span className="mono">{invoice.gstNo}</span></> : null}
          <br />Order {invoice.orderId} · {invoice.date}
        </p>
        <div className="eq-scroll">
          <table className="admin-table">
            <thead><tr><th>Product</th><th className="num">Qty</th><th className="num">Rate</th><th className="num">Disc.</th><th className="num">Amount</th></tr></thead>
            <tbody>
              {invoice.items.map((l) => (
                <tr key={l.id}>
                  <td><div className="cp-prod"><Thumb item={{ ...l, ...(imageOf ? imageOf(l) : {}) }} /><span>{l.name}</span></div></td><td className="mono num">{l.qty}</td><td className="mono num">{inr(l.price)}</td>
                  <td className="mono num">{l.discountPct ? l.discountPct + "%" : "—"}</td><td className="mono num">{inr(lineTotal(l))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="lk-totals">
          {invoice.discount > 0 && <span>Discount: <b className="mono" style={{ color: "#1c7a3e" }}>−{inr(invoice.discount)}</b></span>}
          <span>Subtotal: <b className="mono">{inr(invoice.subtotal)}</b></span>
          <span>GST (18%): <b className="mono">{inr(invoice.gst)}</b></span>
          <span>Total: <b className="mono">{inr(invoice.grand)}</b></span>
        </div>
        <div className="eq-actions">
          <button type="button" className="dash-view-btn" onClick={onClose}>Close</button>
          <button type="button" className="admin-add-btn" onClick={() => printInvoice(invoice)}>🖨️ Print / Save PDF</button>
        </div>
      </div>
    </div>
  );
}

/* CSS shared by the product thumbnails / rows (render once near the top of any page that uses them) */
export function ThumbStyles() {
  return (
    <style>{`
      .cp-thumb{ display:inline-flex; align-items:center; justify-content:center; flex:none; border-radius:8px; overflow:hidden;
        background:var(--paper-2); border:1px solid var(--line); font-weight:700; color:var(--navy); font-size:13px; }
      .cp-thumb img{ width:100%; height:100%; object-fit:contain; }
      .cp-prod{ display:flex; align-items:center; gap:10px; }
    `}</style>
  );
}
