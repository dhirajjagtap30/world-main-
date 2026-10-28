import React, { useEffect, useMemo, useState } from "react";
import * as quotationsApi from "./api/quotations.js";
import * as dispatchApi from "./api/dispatch.js";
import * as authApi from "./api/auth.js";
import { orderProgress } from "./utils/dispatchLogic.js";
import { inr, InvoiceModal, printInvoice, Thumb, ThumbStyles } from "./InvoiceView.jsx";
import { lineTotal } from "./utils/dispatchLogic.js";

/* =====================================================
   CUSTOMER PAGES (logged-in customer, not admin)
   page = "orders"   → Quotations & Orders list
          "invoices" → Invoices made by the shop
          "dispatch" → Dispatches + Pending report
          "profile"  → edit contact no. and GST no.
===================================================== */

const Stat = ({ label, value, sub, tone, onClick }) => (
  <div className={"cp-stat" + (onClick ? " clickable" : "")} onClick={onClick} role={onClick ? "button" : undefined} tabIndex={onClick ? 0 : undefined}
    onKeyDown={onClick ? (e) => (e.key === "Enter" || e.key === " ") && onClick() : undefined} title={onClick ? "Click to see the detailed list" : undefined}>
    <span className="cp-stat-label">{label}</span>
    <b className="cp-stat-value" style={tone ? { color: tone } : undefined}>{value}</b>
    {sub && <small>{sub}</small>}
    {onClick && <small className="cp-more">View list ›</small>}
  </div>
);

/* Simple line search icon (same style as the top search bar) */
const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
    <circle cx="11" cy="11" r="7" stroke="#5b6b7a" strokeWidth="2" />
    <path d="M21 21l-4.3-4.3" stroke="#5b6b7a" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

/* List view: "3 pcs" + only the FIRST product row (+ "N more" hint).
   The complete item list is shown when the customer presses "View". */
const ItemsCell = ({ items }) => {
  const totalPcs = items.reduce((a, it) => a + Math.max(1, Number(it.qty) || 0), 0);
  const first = items[0];
  if (!first) return <b>0 pcs</b>;
  const more = items.length - 1;
  return (
    <div>
      <b>{totalPcs} pcs</b>
      <ul className="cp-items">
        <li>
          <div className="cp-item-row">
            <span className="cp-item-no">1</span>
            <Thumb item={first} size={30} />
            <span className="cp-item-name">{first.name}</span>
            <span className="mono cp-item-qty">Qty: {first.qty}</span>
          </div>
        </li>
      </ul>
      {more > 0 && <small style={{ color: "var(--ink-soft)" }}>+ {more} more product{more === 1 ? "" : "s"} — press View</small>}
    </div>
  );
};

const sumGrand = (list) => list.reduce((a, q) => a + Number(q.grand || 0), 0);
const sumPcs = (list) => list.reduce((a, q) => a + q.items.reduce((s, it) => s + Number(it.qty), 0), 0);

const Empty = ({ cols, text }) => (<tr><td colSpan={cols} className="admin-empty">{text}</td></tr>);

export default function CustomerPages({ page, user, search: topSearch, setSearch: setTopSearch, onViewQuote, onNewQuotation, onNewOrder, onProfileSaved, setToast }) {
  const [quotes, setQuotes] = useState([]);
  const [dispatches, setDispatches] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listTab, setListTab] = useState("orders");
  const [dispTab, setDispTab] = useState("pending");
  const [onlyPending, setOnlyPending] = useState(true);
  const [viewInvoice, setViewInvoice] = useState(null);
  /* Orders page: searched from the top header bar. Invoices page keeps its own box. */
  const [localSearch, setLocalSearch] = useState("");
  const useTop = page === "orders" && typeof setTopSearch === "function";
  const search = useTop ? (topSearch || "") : localSearch;
  const setSearch = useTop ? setTopSearch : setLocalSearch;
  const [viewQuote, setViewQuote] = useState(null);
  const [detail, setDetail] = useState(null); // orders | quotations | invoices | amount | gst
  const [phone, setPhone] = useState(user.phone || "");
  const [gstNo, setGstNo] = useState(user.gstNo || "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  /* reload whenever the customer opens a different page so numbers are fresh */
  useEffect(() => {
    if (page === "profile") return;
    let cancelled = false;
    setLoading(true);
    Promise.all([
      quotationsApi.getQuotationHistory(user.id),
      dispatchApi.getDispatches(undefined, user.id),
      dispatchApi.getInvoices(undefined, user.id),
    ])
      .then(([q, d, i]) => { if (!cancelled) { setQuotes(q); setDispatches(d); setInvoices(i); } })
      .catch(() => !cancelled && setToast("Could not load your data ✕"))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [page, user.id]);

  useEffect(() => { setPhone(user.phone || ""); setGstNo(user.gstNo || ""); setErr(""); }, [user.phone, user.gstNo, page]);

  const orders = useMemo(() => quotes.filter((q) => q.type === "order"), [quotes]);
  const quotations = useMemo(() => quotes.filter((q) => q.type !== "order"), [quotes]);
  const term = search.trim().toLowerCase();
  const matches = (x) =>
    !term ||
    [x.id, x.orderId, x.fromQuotation, x.date].some((v) => String(v || "").toLowerCase().includes(term)) ||
    x.items.some((it) => String(it.name || "").toLowerCase().includes(term) || String(it.swCode || "").toLowerCase().includes(term));
  // while searching, look in orders AND quotations together so a number is found wherever it is
  const listItems = term ? [...orders, ...quotations].filter(matches) : listTab === "orders" ? orders : quotations;
  const invoicesShown = invoices.filter(matches);
  const imageOf = (l) => {
    for (const q of quotes) { const f = q.items.find((it) => it.id === l.id); if (f) return f; }
    return {};
  };

  const pendingRows = useMemo(() => {
    const rows = [];
    for (const o of orders) {
      for (const r of orderProgress(o, dispatches)) rows.push({ order: o, ...r });
    }
    return onlyPending ? rows.filter((r) => r.remaining > 0) : rows;
  }, [orders, dispatches, onlyPending]);
  const pendingPcs = pendingRows.reduce((a, r) => a + r.remaining, 0);

  /* grand totals for the summary cards (not affected by the "only pending" filter) */
  const totals = useMemo(() => {
    let ordered = 0, dispatched = 0, pending = 0, pendingOrders = 0;
    for (const o of orders) {
      const rows = orderProgress(o, dispatches);
      const p = rows.reduce((a, r) => a + r.remaining, 0);
      ordered += rows.reduce((a, r) => a + r.ordered, 0);
      dispatched += rows.reduce((a, r) => a + r.dispatched, 0);
      pending += p;
      if (p > 0) pendingOrders += 1;
    }
    return { ordered, dispatched, pending, pendingOrders };
  }, [orders, dispatches]);

  async function saveProfile(e) {
    e.preventDefault();
    if (saving) return;
    const problem = authApi.validateProfile({ phone, gstNo });
    if (problem) { setErr(problem); return; }
    setSaving(true);
    setErr("");
    try {
      const updated = await authApi.updateMyProfile(user, { phone, gstNo });
      onProfileSaved(updated);
      setToast("Profile updated ✓");
    } catch (ex) {
      setErr(ex.message || "Could not save your profile.");
    } finally {
      setSaving(false);
    }
  }

  const title = { orders: "Quotations & Orders", invoices: "Invoices", dispatch: "Dispatch & Pending Report", profile: "My Profile" }[page];
  const sub = {
    orders: "Every quotation and order you have made.",
    invoices: "Invoices raised for the goods dispatched to you.",
    dispatch: "What has been sent to you and what is still pending.",
    profile: "Keep your contact number and GST number up to date.",
  }[page];

  return (
    <div className="main-wrap">
      <div className="page-header" style={{ padding: 0, marginBottom: 22 }}>
        <h1>{title}</h1>
        <p>{sub}</p>
      </div>

      <style>{`
        .cp-stats{ display:grid; grid-template-columns:repeat(auto-fit,minmax(190px,1fr)); gap:14px; margin-bottom:20px; }
        .cp-stat{ background:#fff; border:1px solid var(--line); border-radius:14px; padding:14px 18px; display:flex; flex-direction:column; gap:3px; box-shadow:0 2px 10px rgba(22,48,79,.04); }
        .cp-stat-label{ font-size:11.5px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:var(--ink-soft); }
        .cp-stat-value{ font-size:22px; color:var(--navy); font-family:'Fraunces',serif; }
        .cp-stat small{ font-size:12.5px; color:var(--ink-soft); }
        .cp-stat.clickable{ cursor:pointer; transition:transform .15s, box-shadow .15s, border-color .15s; }
        .cp-stat.clickable:hover{ transform:translateY(-2px); border-color:var(--navy-2); box-shadow:0 6px 16px rgba(22,48,79,.12); }
        .cp-more{ color:var(--navy-2) !important; font-weight:700; margin-top:2px; }
        .cp-detail{ max-width:820px !important; }
        .cp-btns{ display:flex; gap:6px; }
        .cp-items{ list-style:none; margin:4px 0 0; padding:0; font-size:12.5px; color:var(--ink-soft); line-height:1.5; }
        .cp-items li{ white-space:normal; }
        .cp-item-row{ display:flex; align-items:center; gap:8px; }
        .cp-item-no{ font-weight:700; color:var(--navy); min-width:14px; }
        .cp-item-name{ color:var(--ink); }
        .cp-item-qty{ margin-left:auto; padding-left:14px; white-space:nowrap; }
        .cp-pdf{ background:var(--navy); color:#fff; border:none; border-radius:8px; padding:6px 14px; font-size:13px; font-weight:600; cursor:pointer; }
        .cp-pdf:hover{ background:var(--navy-2); }
      `}</style>

      {!loading && page === "orders" && (
        <div className="cp-stats">
          <Stat label="Total Orders" value={orders.length} sub={`${sumPcs(orders)} pcs · ${inr(sumGrand(orders))}`} onClick={() => setDetail("orders")} />
          <Stat label="Total Quotations" value={quotations.length} sub={`${sumPcs(quotations)} pcs · ${inr(sumGrand(quotations))}`} onClick={() => setDetail("quotations")} />
        </div>
      )}
      {!loading && page === "invoices" && (
        <div className="cp-stats">
          <Stat label="Total Invoices" value={invoices.length} sub={`${sumPcs(invoices)} pcs invoiced`} onClick={() => setDetail("invoices")} />
          <Stat label="Total Invoice Amount" value={inr(sumGrand(invoices))} sub="including GST" onClick={() => setDetail("amount")} />
          <Stat label="Total GST Paid" value={inr(invoices.reduce((a, i) => a + Number(i.gst || 0), 0))} sub="18% GST" onClick={() => setDetail("gst")} />
        </div>
      )}
      {!loading && page === "dispatch" && (
        <div className="cp-stats">
          <Stat label="Total Dispatches" value={dispatches.length} sub={`${totals.dispatched} pcs sent of ${totals.ordered} ordered`} />
          <Stat label="Total Pending" value={`${totals.pending} pcs`} tone={totals.pending ? "#b3441f" : "#1c7a3e"} sub={totals.pending ? `across ${totals.pendingOrders} order${totals.pendingOrders === 1 ? "" : "s"}` : "nothing pending ✓"} />
        </div>
      )}

      {page === "orders" && (
        <>
          <div className="admin-toolbar">
            <div className="dash-tab-group">
              <button className={"dash-tab-btn" + (listTab === "orders" ? " active" : "")} onClick={() => setListTab("orders")}>Orders ({orders.length})</button>
              <button className={"dash-tab-btn" + (listTab === "quotations" ? " active" : "")} onClick={() => setListTab("quotations")}>Quotations ({quotations.length})</button>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button className="admin-add-btn" onClick={onNewQuotation}>+ New Quotation</button>
              <button className="admin-add-btn" onClick={onNewOrder}>+ New Order</button>
            </div>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>{listTab === "orders" ? "Order No." : "Quote No."}</th><th>Date</th><th>Items</th><th className="num">Total</th><th></th></tr></thead>
              <tbody>
                {loading ? <Empty cols={5} text="Loading…" /> : listItems.length === 0 ? (
                  <Empty cols={5} text={term ? "Nothing matches your search." : listTab === "orders" ? "No orders yet." : "No quotations yet."} />
                ) : listItems.map((q) => (
                  <tr key={q.id}>
                    <td className="mono">{q.id}{term && <span className="eq-tag">{q.type === "order" ? "order" : "quotation"}</span>}{q.type !== "order" && (q.orderId || quotes.some((x) => x.fromQuotation === q.id)) && <span className="eq-tag eq-tag-green">order done</span>}</td>
                    <td>{q.date}</td>
                    <td><ItemsCell items={q.items} /></td>
                    <td className="mono num">{inr(q.grand)}</td>
                    <td><button className="dash-view-btn" onClick={() => setViewQuote(q)}>View</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {page === "invoices" && (
        <>
          <div className="admin-search-wrap" style={{ marginBottom: 14, maxWidth: 560 }}>
            <div className="admin-search">
              <SearchIcon />
              <input type="text" placeholder="Search by invoice / order number or product name" value={search} onChange={(e) => setSearch(e.target.value)} />
              {search && <button type="button" className="admin-search-clear" aria-label="Clear search" onClick={() => setSearch("")}>✕</button>}
            </div>
          </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Invoice No.</th><th>Order No.</th><th>Date</th><th>Pieces</th><th className="num">Total (with GST)</th><th></th></tr></thead>
            <tbody>
              {loading ? <Empty cols={6} text="Loading…" /> : invoicesShown.length === 0 ? (
                <Empty cols={6} text={term ? "No invoice matches your search." : "No invoices yet — one appears here once your goods are dispatched and billed."} />
              ) : invoicesShown.map((inv) => (
                <tr key={inv.id}>
                  <td className="mono">{inv.id}</td>
                  <td className="mono">{inv.orderId}</td>
                  <td>{inv.date}</td>
                  <td><ItemsCell items={inv.items} /></td>
                  <td className="mono num">{inr(inv.grand)}</td>
                  <td><button className="dash-view-btn" onClick={() => setViewInvoice(inv)}>View / Print</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}

      {page === "dispatch" && (
        <>
          <div className="admin-toolbar">
            <div className="dash-tab-group">
              <button className={"dash-tab-btn" + (dispTab === "pending" ? " active" : "")} onClick={() => setDispTab("pending")}>Pending Report</button>
              <button className={"dash-tab-btn" + (dispTab === "dispatched" ? " active" : "")} onClick={() => setDispTab("dispatched")}>Dispatched ({dispatches.length})</button>
            </div>
            {dispTab === "pending" && (
              <label style={{ fontSize: 13.5, display: "flex", gap: 8, alignItems: "center" }}>
                <input type="checkbox" checked={onlyPending} onChange={(e) => setOnlyPending(e.target.checked)} /> Show only pending items
              </label>
            )}
          </div>

          {dispTab === "pending" ? (
            <>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead><tr><th>Order No.</th><th>Product</th><th className="num">Ordered</th><th className="num">Dispatched</th><th className="num">Pending</th></tr></thead>
                  <tbody>
                    {loading ? <Empty cols={5} text="Loading…" /> : pendingRows.length === 0 ? (
                      <Empty cols={5} text={onlyPending ? "Nothing pending — everything ordered has been dispatched ✓" : "No orders yet."} />
                    ) : pendingRows.map((r) => (
                      <tr key={r.order.id + "-" + r.id}>
                        <td className="mono">{r.order.id}</td>
                        <td>{r.name}</td>
                        <td className="mono num">{r.ordered}</td>
                        <td className="mono num">{r.dispatched}</td>
                        <td className="mono num" style={{ fontWeight: 700, color: r.remaining ? "#b3441f" : "#1c7a3e" }}>{r.remaining || "Done ✓"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!loading && onlyPending && pendingRows.length > 0 && <p style={{ marginTop: 12, fontSize: 13.5 }}>Total pending: <b>{pendingPcs} pcs</b></p>}
            </>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr><th>Dispatch No.</th><th>Order No.</th><th>Date</th><th>Items sent</th><th>Invoice</th></tr></thead>
                <tbody>
                  {loading ? <Empty cols={5} text="Loading…" /> : dispatches.length === 0 ? (
                    <Empty cols={5} text="Nothing has been dispatched yet." />
                  ) : dispatches.map((d) => (
                    <tr key={d.id}>
                      <td className="mono">{d.id}</td>
                      <td className="mono">{d.orderId}</td>
                      <td>{d.date}</td>
                      <td>{d.items.map((it) => `${it.name} × ${it.qty}`).join(", ")}</td>
                      <td>{d.invoiceId ? <span className="eq-tag eq-tag-green">{d.invoiceId}</span> : <span className="eq-tag">not invoiced</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {page === "profile" && (
        <form onSubmit={saveProfile} style={{ maxWidth: 520, background: "#fff", border: "1px solid var(--line)", borderRadius: 14, padding: 24 }}>
          <div className="field"><label>Name</label><input type="text" value={user.name} disabled /></div>
          <div className="field"><label>Organization</label><input type="text" value={user.org || ""} disabled /></div>
          <div className="field"><label>User ID</label><input type="text" value={user.id} disabled /></div>
          <div className="field"><label htmlFor="pPhone">Contact No.</label>
            <input id="pPhone" type="tel" inputMode="numeric" placeholder="10-digit mobile number" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="field"><label htmlFor="pGst">GST No. (GSTIN)</label>
            <input id="pGst" type="text" maxLength={15} placeholder="e.g. 27ABCDE1234F1Z5" value={gstNo} onChange={(e) => setGstNo(e.target.value.toUpperCase())} style={{ textTransform: "uppercase" }} />
          </div>
          {err && <p style={{ color: "#b3441f", fontSize: 13.5, margin: "0 0 12px" }}>{err}</p>}
          <button type="submit" className="admin-add-btn" disabled={saving}>{saving ? "Saving…" : "Save Profile"}</button>
          <p style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 12 }}>Name, organization and User ID can only be changed by the shop admin. Your GST number is printed on your invoices.</p>
        </form>
      )}


      {detail && (() => {
        const isInv = detail === "invoices" || detail === "amount" || detail === "gst";
        const list = detail === "orders" ? orders : detail === "quotations" ? quotations : invoices;
        const heading = { orders: "All Orders", quotations: "All Quotations", invoices: "All Invoices", amount: "Invoice Amount", gst: "GST Paid on Invoices" }[detail];
        const valueOf = (x) => (detail === "gst" ? x.gst : x.grand);
        const valueLabel = detail === "gst" ? "GST (18%)" : "Total";
        const total = list.reduce((a, x) => a + Number(valueOf(x) || 0), 0);
        const headingForPdf = (x) => (isInv ? "TAX INVOICE" : x.type === "order" ? "ORDER" : "QUOTATION");
        return (
          <div className="admin-modal-overlay" onClick={() => setDetail(null)}>
            <div className="admin-modal eq-modal cp-detail" onClick={(e) => e.stopPropagation()}>
              <div className="admin-modal-head">
                <h3>{heading} ({list.length})</h3>
                <button aria-label="Close" onClick={() => setDetail(null)}>✕</button>
              </div>
              <div className="eq-scroll">
                <table className="admin-table">
                  <thead><tr><th>#</th><th>{isInv ? "Invoice No." : detail === "orders" ? "Order No." : "Quote No."}</th><th>Date</th><th>Items</th><th className="num">{valueLabel}</th><th>Actions</th></tr></thead>
                  <tbody>
                    {list.length === 0 ? <Empty cols={6} text="Nothing here yet." /> : list.map((x, i) => (
                      <tr key={x.id}>
                        <td>{i + 1})</td>
                        <td className="mono">{x.id}</td>
                        <td>{x.date}</td>
                        <td><ItemsCell items={x.items} /></td>
                        <td className="mono num">{inr(valueOf(x))}</td>
                        <td>
                          <div className="cp-btns">
                            <button className="dash-view-btn" onClick={() => { if (isInv) { setDetail(null); setViewInvoice(x); } else { setDetail(null); setViewQuote(x); } }}>View</button>
                            <button className="cp-pdf" onClick={() => printInvoice(x, headingForPdf(x))}>PDF</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="lk-totals"><span>{detail === "gst" ? "Total GST" : "Total"}: <b className="mono">{inr(total)}</b></span></div>
              <div className="eq-actions"><button type="button" className="dash-view-btn" onClick={() => setDetail(null)}>Close</button></div>
            </div>
          </div>
        );
      })()}

      {viewQuote && (() => {
        const q = viewQuote;
        const isOrder = q.type === "order";
        const gross = q.items.reduce((a, it) => a + Number(it.price || 0) * Number(it.qty || 0), 0);
        const discount = q.discount != null ? q.discount : Math.round((gross - q.items.reduce((a, it) => a + lineTotal(it), 0)) * 100) / 100;
        return (
          <div className="admin-modal-overlay" onClick={() => setViewQuote(null)}>
            <div className="admin-modal eq-modal cp-detail" onClick={(e) => e.stopPropagation()}>
              <div className="admin-modal-head">
                <h3>{isOrder ? "Order" : "Quotation"} · <span className="mono">{q.id}</span></h3>
                <button aria-label="Close" onClick={() => setViewQuote(null)}>✕</button>
              </div>
              <p style={{ margin: "0 0 12px", fontSize: 14 }}>
                <b>{q.customer}</b> ({q.customerId}) · {q.date}
                {q.fromQuotation && <><br />Made from quotation <span className="mono">{q.fromQuotation}</span></>}
                <br /><b>{q.items.length} product{q.items.length === 1 ? "" : "s"}</b> · {q.items.reduce((a, it) => a + Number(it.qty), 0)} pcs
              </p>
              <div className="eq-scroll">
                <table className="admin-table">
                  <thead><tr><th>#</th><th>Product</th><th>Item Code</th><th className="num">Qty</th><th className="num">Rate</th><th className="num">Disc.</th><th className="num">Amount</th></tr></thead>
                  <tbody>
                    {q.items.flatMap((it) => {
                      /* one row for every single piece: qty 3 → 3 rows of Qty 1 */
                      const n = Math.max(1, Number(it.qty) || 0);
                      const perPiece = lineTotal(it) / n;
                      return Array.from({ length: n }, () => ({ it, perPiece }));
                    }).map(({ it, perPiece }, i) => (
                      <tr key={it.id + "-" + i}>
                        <td>{i + 1}</td>
                        <td><div className="cp-prod"><Thumb item={it} size={44} /><span>{it.name}</span></div></td>
                        <td className="mono">{it.swCode || "—"}</td>
                        <td className="mono num">1</td>
                        <td className="mono num">{inr(it.price)}</td>
                        <td className="mono num">{it.discountPct ? it.discountPct + "%" : "—"}</td>
                        <td className="mono num">{inr(perPiece)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="lk-totals">
                {discount > 0 && <span>Discount: <b className="mono" style={{ color: "#1c7a3e" }}>−{inr(discount)}</b></span>}
                <span>Subtotal: <b className="mono">{inr(q.subtotal)}</b></span>
                <span>GST (18%): <b className="mono">{inr(q.gst)}</b></span>
                <span>Total: <b className="mono">{inr(q.grand)}</b></span>
              </div>
              <div className="eq-actions">
                <button type="button" className="dash-view-btn" onClick={() => setViewQuote(null)}>Close</button>
                {!isOrder && <button type="button" className="dash-view-btn" onClick={() => { setViewQuote(null); onViewQuote(q); }}>Open full page</button>}
                <button type="button" className="admin-add-btn" onClick={() => printInvoice(q, isOrder ? "ORDER" : "QUOTATION")}>🖨️ PDF</button>
              </div>
            </div>
          </div>
        );
      })()}

      {viewInvoice && <InvoiceModal invoice={viewInvoice} onClose={() => setViewInvoice(null)} imageOf={imageOf} />}
      <ThumbStyles />
    </div>
  );
}
