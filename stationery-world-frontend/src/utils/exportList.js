/* Export a table (the list currently shown on screen) as a PDF report or an Excel (.xlsx) file.
   spec = { title, subtitle?, filename, columns: [{ h, w, num? }], rows: [[...cells]], totalRow?: [...cells] }
   - w   = relative column width
   - num = right-aligned numeric column (kept as a real number in Excel); money = show with 2 decimals in the PDF
   No libraries: the PDF uses the built-in Helvetica font and the .xlsx is written as a small zip by hand. */
import { assemblePdf, clean, esc, tw, fit } from "./pdfDoc.js";

function save(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
const stamp = () => new Date().toISOString().slice(0, 10);

/* ---------------- PDF (A4 landscape) ---------------- */
export function exportListPdf(spec) {
  const W = 842, H = 595, M = 36, NAVY = "0.086 0.188 0.31";
  const usable = W - 2 * M;
  const totalW = spec.columns.reduce((a, c) => a + (c.w || 1), 0);
  const xs = []; let acc = M;
  spec.columns.forEach((c) => { xs.push(acc); acc += ((c.w || 1) / totalW) * usable; });
  const widths = spec.columns.map((c) => ((c.w || 1) / totalW) * usable);
  const pages = []; let ops, y;
  const text = (s, x, yy, { size = 9, bold = false, align = "l", color = "0.13 0.19 0.25" } = {}) => {
    const w = tw(s, size);
    ops.push(`BT /${bold ? "F2" : "F1"} ${size} Tf ${color} rg ${(align === "r" ? x - w : x).toFixed(1)} ${yy.toFixed(1)} Td (${esc(s)}) Tj ET`);
  };
  const head = () => {
    ops.push(`${NAVY} rg ${M} ${y - 18} ${usable} 22 re f`);
    spec.columns.forEach((c, i) => text(c.h, c.num ? xs[i] + widths[i] - 4 : xs[i] + 4, y - 11, { size: 9, bold: true, color: "1 1 1", align: c.num ? "r" : "l" }));
    y -= 22;
  };
  const newPage = (first) => {
    ops = []; pages.push(ops); y = H - M;
    if (first) {
      text("Stationery World", M, y - 14, { size: 18, bold: true, color: NAVY });
      text(spec.title, M, y - 32, { size: 11 });
      text("Exported " + stamp() + (spec.subtitle ? "  |  " + spec.subtitle : ""), W - M, y - 14, { size: 9, align: "r", color: "0.35 0.42 0.48" });
      ops.push(`0.96 0.66 0 rg ${M} ${y - 42} ${usable} 2 re f`);
      y -= 54;
    }
    head();
  };
  newPage(true);
  const drawRow = (cells, bold = false, shade = false) => {
    if (y < M + 40) newPage(false);
    if (shade) ops.push(`0.97 0.96 0.93 rg ${M} ${y - 18} ${usable} 20 re f`);
    cells.forEach((v, i) => {
      const c = spec.columns[i];
      const shown = typeof v === "number" ? (c.money ? v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : v.toLocaleString("en-IN")) : String(v ?? "");
      const t = fit(shown, 9, widths[i] - 8);
      text(t, c.num ? xs[i] + widths[i] - 4 : xs[i] + 4, y - 11, { size: 9, bold, align: c.num ? "r" : "l" });
    });
    ops.push(`0.85 0.85 0.85 RG 0.5 w ${M} ${y - 19} m ${W - M} ${y - 19} l S`);
    y -= 20;
  };
  if (spec.rows.length === 0) drawRow(["No records"].concat(spec.columns.slice(1).map(() => "")));
  spec.rows.forEach((r, i) => drawRow(r, false, i % 2 === 1));
  if (spec.totalRow) drawRow(spec.totalRow, true);
  save(assemblePdf(pages, W, H), `${spec.filename}-${stamp()}.pdf`);
}

/* ---------------- Excel (.xlsx) ---------------- */
const crcTable = (() => { const t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = (b) => { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = crcTable[(c ^ b[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const utf8 = (s) => new TextEncoder().encode(s);

function zipStore(files) { // files: [{ name, data:Uint8Array }] — "stored" (no compression)
  const parts = [], central = []; let offset = 0;
  const u16 = (n) => [n & 255, (n >> 8) & 255];
  const u32 = (n) => [n & 255, (n >> 8) & 255, (n >> 16) & 255, (n >>> 24) & 255];
  for (const f of files) {
    const name = utf8(f.name), crc = crc32(f.data), size = f.data.length;
    const local = new Uint8Array([0x50, 0x4b, 3, 4, ...u16(20), ...u16(0), ...u16(0), ...u16(0), ...u16(0x21), ...u32(crc), ...u32(size), ...u32(size), ...u16(name.length), ...u16(0)]);
    parts.push(local, name, f.data);
    central.push(new Uint8Array([0x50, 0x4b, 1, 2, ...u16(20), ...u16(20), ...u16(0), ...u16(0), ...u16(0), ...u16(0x21), ...u32(crc), ...u32(size), ...u32(size), ...u16(name.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(offset)]), name);
    offset += local.length + name.length + size;
  }
  const cdSize = central.reduce((a, b) => a + b.length, 0);
  const end = new Uint8Array([0x50, 0x4b, 5, 6, ...u16(0), ...u16(0), ...u16(files.length), ...u16(files.length), ...u32(cdSize), ...u32(offset), ...u16(0)]);
  return new Blob([...parts, ...central, end], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

const xmlEsc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "");
const colName = (i) => String.fromCharCode(65 + i);

export function exportListXlsx(spec) {
  const all = [spec.columns.map((c) => c.h), ...spec.rows, ...(spec.totalRow ? [spec.totalRow] : [])];
  const rowsXml = all.map((r, ri) => {
    const cells = r.map((v, ci) => {
      const ref = colName(ci) + (ri + 1);
      const style = ri === 0 ? ' s="1"' : (spec.totalRow && ri === all.length - 1 ? ' s="1"' : "");
      const col = spec.columns[ci];
      if (ri > 0 && col.num && v !== "" && v !== null && !isNaN(Number(v))) return `<c r="${ref}"${style}><v>${Number(v)}</v></c>`;
      return `<c r="${ref}" t="inlineStr"${style}><is><t xml:space="preserve">${xmlEsc(v ?? "")}</t></is></c>`;
    }).join("");
    return `<row r="${ri + 1}">${cells}</row>`;
  }).join("");
  const cols = spec.columns.map((c, i) => `<col min="${i + 1}" max="${i + 1}" width="${Math.max(10, Math.round((c.w || 1) * 12))}" customWidth="1"/>`).join("");
  const sheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${cols}</cols><sheetData>${rowsXml}</sheetData></worksheet>`;
  const files = [
    { name: "[Content_Types].xml", data: utf8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`) },
    { name: "_rels/.rels", data: utf8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`) },
    { name: "xl/workbook.xml", data: utf8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${xmlEsc(spec.sheetName || "Export").slice(0, 31)}" sheetId="1" r:id="rId1"/></sheets></workbook>`) },
    { name: "xl/_rels/workbook.xml.rels", data: utf8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`) },
    { name: "xl/styles.xml", data: utf8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`) },
    { name: "xl/worksheets/sheet1.xml", data: utf8(sheet) },
  ];
  save(zipStore(files), `${spec.filename}-${stamp()}.xlsx`);
}
