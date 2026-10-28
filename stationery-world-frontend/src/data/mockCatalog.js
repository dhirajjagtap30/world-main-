/* =====================================================
   MOCK BACKEND DATASET
   ---------------------------------------------------
   Everything in this file is DEMO DATA ONLY. It exists so
   the app runs end-to-end with zero backend. Once a real
   backend is connected (VITE_USE_MOCK_API=false), none of
   this ships — the equivalent data comes from your API
   instead. See BACKEND_API.md for the exact contract this
   data is standing in for.
===================================================== */
import imgFountainPen from "../assets/products/fountain-pen-classic.png";
import imgRollerballPen from "../assets/products/rollerball-pen.png";
import imgBallpointPen from "../assets/products/ballpoint-pen.png";
import imgBallpenBlue from "../assets/products/ballpen-blue.png";
import imgGelpenBlack from "../assets/products/gelpen-black.png";
import imgPencilHbBox20 from "../assets/products/pencil-hb-box20.png";
import imgWhiteboardMarkers4Color from "../assets/products/whiteboard-markers-4color.png";
import imgHighlighterPack from "../assets/products/highlighter-pack.png";
import { CATEGORIES, CATEGORY_IMAGES } from "./siteContent.js";

/* ---------- mock user directory (stands in for /auth/login) ---------- */
export const DUMMY_USERS = [
  { id: "RJENT01", pass: "demo123", name: "Rajesh Kulkarni", org: "RJ Enterprises Pvt. Ltd.", dept: "Administration", phone: "9822011234" },
  { id: "SUNPHARMA02", pass: "demo123", name: "Sneha Patil", org: "Sunrise Pharma Distributors", dept: "Procurement", phone: "9922145678" },
  { id: "ADMIN", pass: "admin123", name: "Admin User", org: "Stationery World", dept: "Sales", phone: "9370534398" },
];

/* ---------- mock catalog seed (stands in for GET /products) ---------- */
const CATALOG_SEED = {
  writing: [["Ball Pen Blue — Pack of 10", 60, imgBallpenBlue], ["Gel Pen Premium Black", 18, imgGelpenBlack], ["Fountain Pen Classic", 220, imgFountainPen], ["Pencil HB — Box of 20", 45, imgPencilHbBox20], ["Whiteboard Marker Set (4 colors)", 95, imgWhiteboardMarkers4Color], ["Highlighter Pack — 5 Shades", 85, imgHighlighterPack], ["Rollerball Pen, Executive Series", 240, imgRollerballPen], ["Ballpoint Pen, Chrome Finish", 190, imgBallpointPen]],
  notebooks: [["Spiral Notebook A4, 200 pages", 110], ["Long Notebook, Single Line", 35], ["Executive Diary 2026", 340], ["Sticky Notes Set (5 pads)", 70], ["Graph Notebook A5", 55], ["Register Book, 300 pages", 180]],
  files: [["L-Shape Clear File — Pack of 25", 210], ["Ring Binder, 2-inch", 150], ["Box File, Legal Size", 95], ["Expanding File, 12-Pocket", 260], ["Certificate Folder", 65], ["Display Book, 40-Pocket", 175]],
  art: [["Watercolor Set, 12 Shades", 180], ["Oil Pastels — Box of 25", 90], ["Sketch Book A4", 120], ["Craft Scissors", 55], ["Glue Stick — Pack of 6", 75], ["Drawing Sheet Pack, 100 sheets", 160]],
  office: [["Stapler, Medium Duty", 85], ["Punching Machine, Double Hole", 210], ["Paper Clips — Box of 100", 25], ["Rubber Bands — Pack of 250g", 40], ["Correction Pen", 35], ["Steel Scale, 12-inch", 20]],
  adhesives: [["Cello Tape, Transparent — Pack of 6", 90], ["Double Sided Tape", 45], ["Masking Tape Roll", 30], ["Fevicol Bottle, 100g", 55], ["Glue Gun with Sticks", 260], ["Duct Tape Roll", 110]],
  desk: [["Wooden Desk Organizer", 420], ["Metal Pen Stand", 150], ["Paper Tray, 3-Layer", 380], ["Acrylic Name Plate", 180], ["Desk Calendar Stand 2026", 95], ["Clipboard A4 with Cover", 110]],
  computer: [["USB Pen Drive, 32GB", 330], ["Wireless Mouse", 450], ["Printer Ink Cartridge (Black)", 620], ["CD/DVD Pack — 50 pcs", 380], ["Keyboard Dust Cover", 60], ["Laptop Sleeve, 14-inch", 420]],
  calc: [["Scientific Calculator", 650], ["Basic Calculator, 12-Digit", 240], ["Printing Calculator", 1450], ["Pocket Calculator", 110], ["Desktop Calculator, Dual Power", 320], ["Mini Calculator Keychain", 60]],
  school: [["Geometry Box Set", 95], ["School Bag, 20L", 780], ["Water Bottle, 1L", 150], ["Lunch Box, Insulated", 260], ["Compass Box", 65], ["Crayons — Box of 24", 75]],
  housekeeping: [["Cotton Mop with Bucket", 450], ["Floor Cleaner Liquid, 1L", 120], ["Broom, Soft Bristle", 90], ["Dustbin, 15L with Lid", 350], ["Microfiber Cleaning Cloth — Pack of 5", 150], ["Toilet Cleaner, 500ml", 85], ["Room Freshener Spray", 110], ["Glass Cleaner, 500ml", 95]],
  safety: [["Safety Helmet, ISI Marked", 220], ["Reflective Safety Vest", 180], ["Safety Goggles, Anti-Fog", 95], ["Nitrile Hand Gloves — Pack of 50", 260], ["N95 Face Mask — Pack of 10", 210], ["First Aid Box, Basic Kit", 480], ["Safety Shoes, Steel Toe", 950], ["Fire Extinguisher, 2kg ABC", 1250]],
};

/* Cosmetic catalog metadata (brand / MRP / specs) shown in the search
   preview panel — purely descriptive, doesn't affect pricing logic. */
const BRAND_BY_KEYWORD = [
  [/ball ?pen|ballpoint|chrome finish/i, "Cello"],
  [/gel pen/i, "Cello"],
  [/fountain pen/i, "Parker"],
  [/rollerball/i, "Parker"],
  [/pencil/i, "Natraj"],
  [/marker|highlighter/i, "Camlin"],
  [/notebook|diary|register|sticky|graph/i, "Classmate"],
  [/file|folder|binder|clipboard/i, "Solo"],
  [/watercolor|oil pastel|sketch|craft|glue stick|drawing sheet/i, "Camlin"],
  [/stapler|punch|clip|rubber band|correction|scale/i, "Kangaro"],
  [/tape|fevicol|glue gun|duct/i, "Fevicol"],
  [/organizer|pen stand|tray|name plate|calendar/i, "Nayasa"],
  [/pen drive|mouse|cartridge|cd\/dvd|dust cover|laptop sleeve/i, "HP"],
  [/calculator/i, "Casio"],
  [/geometry|school bag|water bottle|lunch box|compass|crayon/i, "Camlin"],
  [/mop|bucket|floor cleaner|broom|dustbin|microfiber|toilet cleaner|freshener|glass cleaner/i, "Scotch-Brite"],
  [/helmet|safety vest|goggles|hand gloves|face mask|first aid|safety shoes|fire extinguisher/i, "3M"],
];
function brandFor(name) {
  const hit = BRAND_BY_KEYWORD.find(([re]) => re.test(name));
  return hit ? hit[1] : "Stationery World";
}
function packSizeFor(name) {
  const m = name.match(/(Pack of \d+|Box of \d+|\d+[- ]?pocket|\d+ colou?rs?|\d+ shades?|\d+g\b)/i);
  return m ? m[0].replace(/^\w/, (c) => c.toUpperCase()) : "Single unit";
}
function tipSizeFor(catId, name) {
  if (catId !== "writing" || !/pen\b/i.test(name) || /marker|highlighter/i.test(name)) return null;
  if (/fountain/i.test(name)) return "Fine (F)";
  if (/gel/i.test(name) || /rollerball/i.test(name)) return "0.5 mm";
  return "0.7 mm";
}

function buildProducts() {
  let idCounter = 1;
  const list = [];
  Object.entries(CATALOG_SEED).forEach(([catId, items]) => {
    const catName = CATEGORIES.find((c) => c.id === catId).name;
    items.forEach(([name, price, image]) => {
      const id = idCounter++;
      const mrp = Math.ceil((price * 1.18) / 5) * 5;
      const discountPct = mrp > price ? Math.round((1 - price / mrp) * 100) : 0;
      list.push({
        id,
        name,
        price,
        catId,
        catName,
        unit: /Pack|Box of|Set|pieces|pcs/.test(name) ? "per pack" : "per pc",
        initial: (name.replace(/[^A-Za-z]/g, "")[0] || "S"),
        image: image || CATEGORY_IMAGES[catId],
        brand: brandFor(name),
        swCode: "SW-" + String(id).padStart(3, "0"),
        customerCode: "CU-" + String(id).padStart(3, "0"),
        mrp,
        discountPct,
        tipSize: tipSizeFor(catId, name),
        packSize: packSizeFor(name),
        inStock: true,
      });
    });
  });
  return list;
}

export const PRODUCTS = buildProducts();
export const PRICE_MIN = Math.min(...PRODUCTS.map((p) => p.price));
export const PRICE_MAX = Math.max(...PRODUCTS.map((p) => p.price));

/* Seed for the admin product-management table (stands in for GET /admin/products) */
export const ADMIN_PRODUCTS_SEED = PRODUCTS.map((p) => ({
  id: p.id, name: p.name, category: p.catName, price: p.price, qty: 100, image: p.image, initial: p.initial, swCode: p.swCode, customerCode: p.customerCode,
}));

/* ---------- mock past quotations (stands in for GET /quotations) ---------- */
function makeQuoteRecord(idNum, customerId, org, orderedBy, dept, dateStr, itemDefs, contact) {
  const items = itemDefs.map(([pid, qty]) => {
    const p = PRODUCTS.find((pp) => pp.id === pid);
    return { id: p.id, name: p.name, catName: p.catName, price: p.price, image: p.image, initial: p.initial, swCode: p.swCode, customerCode: p.customerCode, qty };
  });
  const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0);
  const gst = Math.round(subtotal * 0.18);
  const grand = subtotal + gst;
  return { id: "SW-Q-" + String(idNum).padStart(6, "0"), type: "quotation", customerId, customer: org, orderedBy, dept, date: dateStr, contact: contact || "", items, subtotal, gst, grand };
}

export const INITIAL_QUOTE_HISTORY = [
  makeQuoteRecord(39, "RJENT01", "RJ Enterprises Pvt. Ltd.", "Rajesh Kulkarni", "Administration", "2026-07-15", [[6, 8], [12, 15], [29, 4]]),
  makeQuoteRecord(36, "RJENT01", "RJ Enterprises Pvt. Ltd.", "Rajesh Kulkarni", "Administration", "2026-06-28", [[3, 5], [15, 10], [45, 2]]),
  makeQuoteRecord(31, "RJENT01", "RJ Enterprises Pvt. Ltd.", "Rajesh Kulkarni", "Administration", "2026-06-02", [[1, 20], [9, 10], [27, 5]]),
  makeQuoteRecord(34, "SUNPHARMA02", "Sunrise Pharma Distributors", "Sneha Patil", "Procurement", "2026-07-05", [[8, 10], [11, 8], [33, 10]]),
  makeQuoteRecord(28, "SUNPHARMA02", "Sunrise Pharma Distributors", "Sneha Patil", "Procurement", "2026-06-10", [[2, 30], [16, 6], [51, 3]]),
];
