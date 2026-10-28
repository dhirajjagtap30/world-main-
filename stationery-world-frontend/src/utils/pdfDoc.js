/* Tiny dependency-free PDF maker for quotations / orders / invoices.
   buildPdfBlob(doc, heading) → Blob (application/pdf)
   viewPdf(doc, heading)      → opens the PDF in a new browser tab
   downloadPdf(doc, heading)  → saves <number>.pdf
   Uses the built-in Helvetica fonts, so the rupee sign is written as "Rs.". */
import { lineTotal } from "./dispatchLogic.js";

const W = 595, H = 842, M = 40;
const NAVY = "0.086 0.188 0.31", GOLD = "0.96 0.66 0";
export const clean = (s) => String(s ?? "").replace(/[^\x20-\x7e]/g, (c) => (c === "₹" ? "Rs." : c === "—" || c === "–" ? "-" : c === "·" ? "-" : "?"));
export const esc = (s) => clean(s).replace(/([\\()])/g, "\\$1");
export const money = (n) => "Rs. " + Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
/* rough Helvetica widths (1/1000 em): digits 556, space/.,: 278, caps ~680, others ~520 */
const cw = (c) => (/[0-9]/.test(c) ? 556 : /[ .,:;'|!il]/.test(c) ? 278 : /[A-Z]/.test(c) ? 680 : /[mwMW]/.test(c) ? 800 : 520);
export const tw = (s, size) => (clean(s).split("").reduce((a, c) => a + cw(c), 0) * size) / 1000;
export function fit(s, size, max) {
  let t = clean(s);
  if (tw(t, size) <= max) return t;
  while (t.length > 1 && tw(t + "...", size) > max) t = t.slice(0, -1);
  return t + "...";
}

export function buildPdfBlob(inv, heading = "QUOTATION") {
  const pages = [];
  let ops, y;
  const newPage = () => { ops = []; pages.push(ops); y = H - M; };
  const text = (s, x, yy, { size = 10, bold = false, align = "l", color = "0.13 0.19 0.25" } = {}) => {
    const w = tw(s, size);
    const px = align === "r" ? x - w : align === "c" ? x - w / 2 : x;
    ops.push(`BT /${bold ? "F2" : "F1"} ${size} Tf ${color} rg ${px.toFixed(1)} ${yy.toFixed(1)} Td (${esc(s)}) Tj ET`);
  };
  const rect = (x, yy, w, h, color) => ops.push(`${color} rg ${x} ${yy} ${w} ${h} re f`);
  const line = (x1, yy, x2, color = "0.85 0.85 0.85") => ops.push(`${color} RG 0.6 w ${x1} ${yy} m ${x2} ${yy} l S`);

  const cols = [
    { h: "#", x: M + 4, w: 22 },
    { h: "Item Code", x: M + 30, w: 62 },
    { h: "Product", x: M + 96, w: 190 },
    { h: "Qty", x: M + 330, w: 0, r: true },
    { h: "Rate", x: M + 395, w: 0, r: true },
    { h: "Disc.", x: M + 440, w: 0, r: true },
    { h: "Amount", x: W - M - 4, w: 0, r: true },
  ];
  const tableHead = () => {
    rect(M, y - 18, W - 2 * M, 22, NAVY);
    cols.forEach((c) => text(c.h, c.x, y - 11, { size: 9.5, bold: true, color: "1 1 1", align: c.r ? "r" : "l" }));
    y -= 22;
  };

  newPage();
  text("Stationery World", M, y - 18, { size: 22, bold: true, color: NAVY });
  text(heading, M, y - 36, { size: 11, color: "0.35 0.42 0.48" });
  text(inv.id, W - M, y - 14, { size: 13, bold: true, align: "r" });
  text("Date: " + (inv.date || ""), W - M, y - 30, { size: 10, align: "r" });
  if (inv.orderId) text("Order: " + inv.orderId, W - M, y - 44, { size: 10, align: "r" });
  y -= 54;
  rect(M, y, W - 2 * M, 2.5, GOLD);
  y -= 22;
  text("Billed to:", M, y, { size: 10, bold: true });
  text(`${inv.customer || ""} (${inv.customerId || ""})`, M + 52, y, { size: 10 });
  y -= 14;
  if (inv.gstNo) { text("GSTIN: " + inv.gstNo, M, y, { size: 10 }); y -= 14; }
  const who = [inv.orderedBy, inv.dept].filter(Boolean).join(" - ");
  if (who) { text(who, M, y, { size: 10 }); y -= 14; }
  if (inv.contact) { text("Contact: " + inv.contact, M, y, { size: 10 }); y -= 14; }
  if (inv.fromQuotation) { text("From quotation: " + inv.fromQuotation, M, y, { size: 10 }); y -= 14; }
  y -= 10;
  tableHead();

  (inv.items || []).forEach((it, i) => {
    if (y < M + 150) { newPage(); tableHead(); }
    if (i % 2) rect(M, y - 20, W - 2 * M, 22, "0.97 0.96 0.93");
    const base = y - 13;
    text(String(i + 1), cols[0].x, base, { size: 9.5 });
    text(fit(it.swCode || "", 9.5, cols[1].w), cols[1].x, base, { size: 9.5 });
    text(fit(it.name, 9.5, 205), cols[2].x, base, { size: 9.5 });
    text(String(it.qty), cols[3].x, base, { size: 9.5, align: "r" });
    text(money(it.price), cols[4].x, base, { size: 9.5, align: "r" });
    text(it.discountPct ? it.discountPct + "%" : "-", cols[5].x, base, { size: 9.5, align: "r" });
    text(money(lineTotal({ ...it, price: Number(it.price), qty: Number(it.qty) })), cols[6].x, base, { size: 9.5, align: "r" });
    line(M, y - 21, W - M);
    y -= 22;
  });

  if (y < M + 90) newPage();
  y -= 12;
  const tx = W - M - 230, tr = W - M - 4;
  const row = (label, val, bold = false) => { text(label, tx, y, { size: bold ? 12 : 10, bold }); text(val, tr, y, { size: bold ? 12 : 10, bold, align: "r" }); y -= bold ? 20 : 16; };
  if (Number(inv.discount) > 0) row("Discount", "- " + money(inv.discount));
  row("Subtotal", money(inv.subtotal));
  row("GST (18%)", money(inv.gst));
  line(tx, y + 10, W - M, "0.09 0.19 0.31");
  y -= 2;
  row("Total (incl. GST)", money(inv.grand), true);
  y -= 24;
  text("Thank you for your business.", M, y, { size: 9.5, color: "0.35 0.42 0.48" });

  return assemblePdf(pages, W, H);
}

/* pages = array of arrays of PDF drawing operators; adds "Page n of N" and returns a Blob */
export function assemblePdf(pages, pw, ph) {
  const objs = [];
  const add = (body) => { objs.push(body); return objs.length; };
  add("<< /Type /Catalog /Pages 2 0 R >>");
  add(""); // pages, filled below
  add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
  add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");
  const kids = [];
  pages.forEach((p, idx) => {
    const stream = p.join("\n") + `\nBT /F1 8 Tf 0.5 0.5 0.5 rg ${pw / 2 - 20} 22 Td (Page ${idx + 1} of ${pages.length}) Tj ET`;
    const c = add(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
    const pg = add(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pw} ${ph}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${c} 0 R >>`);
    kids.push(pg + " 0 R");
  });
  objs[1] = `<< /Type /Pages /Kids [${kids.join(" ")}] /Count ${kids.length} >>`;
  let out = "%PDF-1.4\n";
  const offs = [];
  objs.forEach((b, i) => { offs.push(out.length); out += `${i + 1} 0 obj\n${b}\nendobj\n`; });
  const xref = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offs.map((o) => String(o).padStart(10, "0") + " 00000 n \n").join("");
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  const bytes = new Uint8Array(out.length);
  for (let i = 0; i < out.length; i++) bytes[i] = out.charCodeAt(i) & 0xff;
  return new Blob([bytes], { type: "application/pdf" });
}

export function viewPdf(inv, heading) {
  const url = URL.createObjectURL(buildPdfBlob(inv, heading));
  const w = window.open(url, "_blank");
  if (!w) alert("Please allow pop-ups to view the PDF.");
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

export function downloadPdf(inv, heading) {
  const url = URL.createObjectURL(buildPdfBlob(inv, heading));
  const a = document.createElement("a");
  a.href = url;
  a.download = (inv.id || "document") + ".pdf";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
