import React, { useEffect, useMemo, useState } from "react";
import * as quotationsApi from "./api/quotations.js";
import * as productsApi from "./api/products.js";
import { inr, Thumb, ThumbStyles } from "./InvoiceView.jsx";

/* =====================================================
   NEW QUOTATION  (customer)
   1. Type a quotation / order number (e.g. 0084 or SW-Q-000084)
   2. Its products appear as a list: tick box, number, image, name, qty, rate
   3. Tick the ones you want, change the qty if needed, press Generate
   → a brand-new quotation is saved with only the ticked items.
===================================================== */

const digitsOf = (s) => String(s || "").replace(/\D/g, "");

export default function NewQuotation({ kind = "quotation", user, onCreated, onBrowseCatalog, setToast }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [term, setTerm] = useState("");
  const [pickedId, setPickedId] = useState(null);
  const [rows, setRows] = useState([]); // { ...item, checked, qty }
  const [saving, setSaving] = useState(false);
  const [catalog, setCatalog] = useState([]);
  const [addTerm, setAddTerm] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  useEffect(() => { productsApi.getCatalogProducts().then(setCatalog).catch(() => {}); }, []);
  const addMatches = useMemo(() => {
    const t = addTerm.toLowerCase().trim();
    if (!showAdd) return [];
    const list = !t ? catalog : catalog.filter((p) => [p.name, p.catName, p.swCode, p.customerCode].some((v) => String(v || "").toLowerCase().includes(t)));
    return list.slice(0, 30);
  }, [catalog, addTerm, showAdd]);
  function addProduct(p) {
    setRows((rs) => {
      const at = rs.findIndex((r) => r.id === p.id);
      if (at >= 0) return rs.map((r, i) => (i === at ? { ...r, checked: true, qty: (Number(r.qty) || 0) + 1 } : r));
      return [...rs, { id: p.id, name: p.name, catName: p.catName, price: p.price, image: p.image, initial: p.initial, swCode: p.swCode, customerCode: p.customerCode, checked: true, qty: 1 }];
    });
  }

  useEffect(() => {
    let cancelled = false;
    quotationsApi
      .getQuotationHistory(user.id)
      .then((list) => !cancelled && setHistory(list))
      .catch(() => !cancelled && setToast("Could not load your quotations ✕"))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [user.id]);

  /* every quotation/order whose number contains what was typed ("84", "0084", "SW-Q-000084") */
  const matches = useMemo(() => {
    const t = term.trim().toLowerCase();
    if (!t) return [];
    const d = digitsOf(t);
    return history.filter((q) => {
      if (q.id.toLowerCase().includes(t)) return true;
      // typed digits like "0084" match SW-Q-000084 / SW-O-000084 by their number
      return d && /^\d+$/.test(t) && Number(digitsOf(q.id)) === Number(d);
    });
  }, [term, history]);

  /* first match is picked automatically; if the picked one stops matching, fall back to the first */
  useEffect(() => {
    if (matches.length === 0) { setPickedId(null); return; }
    if (!matches.some((q) => q.id === pickedId)) setPickedId(matches[0].id);
  }, [matches]);

  const picked = matches.find((q) => q.id === pickedId) || null;

  useEffect(() => {
    if (picked) setRows(picked.items.map((it) => ({ ...it, checked: true, qty: Number(it.qty) })));
  }, [pickedId]);

  const removeRow = (i) => setRows((rs) => rs.filter((_, idx) => idx !== i));
  const setRow = (i, patch) => setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const chosen = rows.filter((r) => r.checked);
  const allChecked = rows.length > 0 && chosen.length === rows.length;
  const badQty = chosen.some((r) => !Number.isInteger(Number(r.qty)) || Number(r.qty) < 1);
  const subtotal = chosen.reduce((a, r) => a + Number(r.price || 0) * (Number(r.qty) || 0), 0);
  const gst = Math.round(subtotal * 0.18);
  const grand = subtotal + gst;

  async function generate() {
    if (saving) return;
    if (chosen.length === 0) { setToast("Tick at least one product ✕"); return; }
    if (badQty) { setToast("Quantity must be a whole number of 1 or more ✕"); return; }
    setSaving(true);
    try {
      const items = chosen.map(({ checked, discountPct, ...it }) => ({ ...it, qty: Number(it.qty) }));
      const record = await quotationsApi.createQuotation({
        type: kind,
        customerId: user.id,
        customer: user.org,
        orderedBy: user.name,
        dept: user.dept,
        date: new Date().toISOString().slice(0, 10),
        contact: user.phone || "",
        items,
        subtotal,
        gst,
        grand,
      });
      onCreated(record);
      setToast((kind === "order" ? "Order " : "Quotation ") + record.id + (kind === "order" ? " placed ✓" : " generated ✓"));
    } catch (err) {
      setToast(err.message || "Could not generate the quotation ✕");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="main-wrap">
      <style>{`
        .nq-panel{ background:#fff; border:1px solid var(--line); border-radius:14px; box-shadow:0 2px 10px rgba(22,48,79,.04); overflow:hidden; }
        .nq-head{ display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap; padding:14px 18px; background:var(--paper-2); border-bottom:1px solid var(--line); }
        .nq-row,.nq-thead{ display:grid; grid-template-columns:70px 1fr 140px 80px; align-items:center; gap:10px; padding:10px 18px; border-bottom:1px solid var(--line); }
        .nq-thead{ background:var(--paper-2); font-weight:700; color:var(--navy); }
        .nq-thead .c-sel,.nq-row .c-sel,.nq-thead .c-act,.nq-row .c-act{ text-align:center; }
        .nq-row .c-item{ display:flex; align-items:center; gap:14px; min-width:0; }
        .nq-qty.bad{ border-color:#d33; }
        .nq-del{ width:38px; height:38px; border:1px solid var(--line); background:var(--paper-2); border-radius:10px; color:var(--navy); cursor:pointer; display:inline-flex; align-items:center; justify-content:center; }
        .nq-del:hover{ background:#fde8e8; color:#c22; border-color:#f0b4b4; }
        @media(max-width:560px){ .nq-row,.nq-thead{ grid-template-columns:44px 1fr 90px 48px; padding:10px 8px; } .nq-qty{ width:80px; } }
        .nq-row.off{ opacity:.5; }
        .nq-row input[type=checkbox]{ width:20px; height:20px; accent-color:var(--navy); flex:none; }
        .nq-no{ font-weight:700; color:var(--navy); min-width:22px; }
        .nq-name{ flex:1; min-width:0; }
        .nq-name small{ display:block; color:var(--ink-soft); font-size:12px; }
        .nq-qty{ width:100px; padding:8px; border:1.5px solid var(--line); border-radius:8px; font-size:14px; font-family:inherit; text-align:center; }
        .nq-rate{ min-width:90px; text-align:right; }
        .nq-foot{ display:flex; justify-content:space-between; align-items:center; gap:14px; flex-wrap:wrap; padding:16px 18px; }
        .nq-addsearch{ width:100%; padding:11px 14px; border:1.5px solid var(--line); border-radius:10px; font-family:inherit; font-size:14.5px; }
        .nq-addlist{ max-height:340px; overflow-y:auto; margin-top:10px; border:1px solid var(--line); border-radius:10px; }
        .nq-addrow{ display:flex; align-items:center; gap:12px; padding:8px 12px; border-bottom:1px solid var(--line); }
        .nq-addrow:last-child{ border-bottom:none; }
        .nq-chips{ display:flex; gap:8px; flex-wrap:wrap; margin:0 0 14px; }
        .nq-link{ background:none; border:none; color:var(--navy-2); font-weight:700; text-decoration:underline; cursor:pointer; font-size:14px; padding:0; font-family:inherit; }
      `}</style>

      <div className="page-header" style={{ padding: 0, marginBottom: 22 }}>
        <h1>{kind === "order" ? "New Order" : "New Quotation"}</h1>
        <p>Type an old quotation or order number, tick the products you want again and press {kind === "order" ? "Place Order" : "Generate"}.</p>
      </div>

      <div className="admin-search-wrap" style={{ marginBottom: 14, maxWidth: 560 }}>
        <div className="admin-search">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}><circle cx="11" cy="11" r="7" stroke="#5b6b7a" strokeWidth="2" /><path d="M21 21l-4.3-4.3" stroke="#5b6b7a" strokeWidth="2" strokeLinecap="round" /></svg>
          <input type="text" autoFocus placeholder="Quotation / order number, e.g. 0084" value={term} onChange={(e) => setTerm(e.target.value)} disabled={loading} />
          {term && <button type="button" className="admin-search-clear" aria-label="Clear" onClick={() => setTerm("")}>✕</button>}
        </div>
      </div>

      {matches.length > 1 && (
        <div className="nq-chips">
          {matches.slice(0, 12).map((q) => (
            <button key={q.id} type="button" className={"dash-tab-btn" + (q.id === pickedId ? " active" : "")} onClick={() => setPickedId(q.id)}>
              {q.id}
            </button>
          ))}
        </div>
      )}

      {rows.length === 0 ? (
        <div className="nq-panel"><div className="admin-empty" style={{ padding: 34, textAlign: "center", color: "var(--ink-soft)" }}>
          {loading ? "Loading your quotations…" : term.trim() && !picked ? <>No quotation or order of yours matches “{term}”.</> : "Type an old number above, or use “+ Add products” below to build a list from scratch."}
        </div></div>
      ) : (
        <div className="nq-panel">
          <div className="nq-head">
            <label style={{ display: "flex", gap: 10, alignItems: "center", fontWeight: 700 }}>
              <input type="checkbox" style={{ width: 20, height: 20, accentColor: "var(--navy)" }} checked={allChecked} onChange={(e) => setRows((rs) => rs.map((r) => ({ ...r, checked: e.target.checked })))} />
              Select all
            </label>
            <span>{picked ? <><b className="mono">{picked.id}</b> · {picked.type === "order" ? "Order" : "Quotation"} · {picked.date} · </> : <b>New list · </b>}{rows.length} product{rows.length === 1 ? "" : "s"}</span>
          </div>

          <div className="nq-thead">
            <span className="c-sel">Select</span><span className="c-item">Item</span><span className="c-qty">Qty</span><span className="c-act">Action</span>
          </div>
          {rows.length === 0 && <div style={{ padding: 28, textAlign: "center", color: "var(--ink-soft)" }}>All products removed. Search the number again to start over.</div>}
          {rows.map((r, i) => {
            const qtyBad = r.checked && (!Number.isInteger(Number(r.qty)) || Number(r.qty) < 1);
            return (
              <div key={r.id} className={"nq-row" + (r.checked ? "" : " off")}>
                <span className="c-sel"><input type="checkbox" checked={r.checked} onChange={(e) => setRow(i, { checked: e.target.checked })} aria-label={"Select " + r.name} /></span>
                <span className="c-item"><Thumb item={r} size={64} /><span className="nq-name">{r.name}<small className="mono">{r.swCode || ""} · {inr(r.price)}</small></span></span>
                <span className="c-qty">
                  <input className={"nq-qty" + (qtyBad ? " bad" : "")} type="number" min="1" step="1" placeholder="Enter Qty" value={r.qty} disabled={!r.checked}
                    onChange={(e) => setRow(i, { qty: e.target.value === "" ? "" : Number(e.target.value) })} />
                </span>
                <span className="c-act">
                  <button type="button" className="nq-del" aria-label={"Remove " + r.name} title="Remove" onClick={() => removeRow(i)}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 002 2h6a2 2 0 002-2l1-12M9 7V4h6v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                </span>
              </div>
            );
          })}

          <div className="nq-foot">
            <div style={{ fontSize: 14 }}>
              {chosen.length} of {rows.length} selected · Subtotal <b className="mono">{inr(subtotal)}</b> · GST 18% <b className="mono">{inr(gst)}</b> · Total <b className="mono">{inr(grand)}</b>
            </div>
            <button type="button" className="admin-add-btn" disabled={saving || chosen.length === 0} onClick={generate}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ marginRight: 8, verticalAlign: "-3px" }}><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" stroke="currentColor" strokeWidth="1.6"/></svg>{saving ? (kind === "order" ? "Placing…" : "Generating…") : (kind === "order" ? "Place Order" : "Generate")}
            </button>
          </div>
        </div>
      )}

      <div className="nq-panel" style={{ marginTop: 16 }}>
        <div className="nq-head">
          <b>{kind === "order" ? "Add products to this order" : "Add products to this quotation"}</b>
          <button type="button" className="admin-add-btn" onClick={() => setShowAdd((v) => !v)}>{showAdd ? "Close" : "+ Add products"}</button>
        </div>
        {showAdd && (
          <div style={{ padding: "12px 18px" }}>
            <input className="nq-addsearch" type="text" autoFocus placeholder="Search by product name, SW code or customer code — add as many as you like" value={addTerm} onChange={(e) => setAddTerm(e.target.value)} />
            <div className="nq-addlist">
              {addMatches.length === 0 ? <div style={{ padding: 16, color: "var(--ink-soft)" }}>{catalog.length ? "No matching product." : "Loading products…"}</div> : addMatches.map((p) => {
                const inList = rows.find((r) => r.id === p.id);
                return (
                  <div className="nq-addrow" key={p.id}>
                    <Thumb item={p} size={48} />
                    <div className="nq-name">{p.name}<small className="mono">{p.swCode || ""} · {p.customerCode || ""} · {inr(p.price)}</small></div>
                    {inList && <span style={{ fontSize: 12, color: "#1c7a3e", fontWeight: 700 }}>In list × {inList.qty}</span>}
                    <button type="button" className="dash-view-btn" onClick={() => addProduct(p)}>+ Add</button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <p style={{ marginTop: 18, fontSize: 14 }}>
        Want something new instead? <button type="button" className="nq-link" onClick={onBrowseCatalog}>Browse the catalog</button>
      </p>
      <ThumbStyles />
    </div>
  );
}
