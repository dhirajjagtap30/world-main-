import { initDb, withDb } from "./db.js";

/* =====================================================
   SEED DATA
   ---------------------------------------------------
   Mirrors src/data/mockCatalog.js from the frontend repo,
   so the same demo credentials and a similar catalog work
   whether the app is pointed at the mock API or this real
   one. Run once with `npm run seed` (safe to re-run — it
   only seeds when the DB is empty; see seedIfEmpty below).

   Swap or extend this freely — it's just a starting dataset,
   not part of the API contract.
===================================================== */

const CATEGORIES = [
  { id: "writing", name: "Writing Instruments" },
  { id: "notebooks", name: "Notebooks & Diaries" },
  { id: "files", name: "Files & Folders" },
  { id: "art", name: "Art & Craft" },
  { id: "office", name: "Office Supplies" },
  { id: "adhesives", name: "Adhesives & Tapes" },
  { id: "desk", name: "Desk Accessories" },
  { id: "computer", name: "Computer Accessories" },
  { id: "calc", name: "Calculators" },
  { id: "school", name: "School Supplies" },
  { id: "housekeeping", name: "House Keeping" },
  { id: "safety", name: "Safety Products" },
];

const CATALOG_SEED = {
  writing: [["Ball Pen Blue — Pack of 10", 60], ["Gel Pen Premium Black", 18], ["Fountain Pen Classic", 220], ["Pencil HB — Box of 20", 45], ["Whiteboard Marker Set (4 colors)", 95], ["Highlighter Pack — 5 Shades", 85], ["Rollerball Pen, Executive Series", 240], ["Ballpoint Pen, Chrome Finish", 190]],
  notebooks: [["Spiral Notebook A4, 200 pages", 110], ["Long Notebook, Single Line", 35], ["Executive Diary 2026", 340], ["Sticky Notes Set (5 pads)", 70], ["Graph Notebook A5", 55], ["Register Book, 300 pages", 180]],
  files: [["L-Shape Clear File — Pack of 25", 210], ["Ring Binder, 2-inch", 150], ["Box File, Legal Size", 95], ["Expanding File, 12-Pocket", 260], ["Certificate Folder", 65], ["Display Book, 40-Pocket", 175]],
  art: [["Watercolor Set, 12 Shades", 180], ["Oil Pastels — Box of 25", 90], ["Sketch Book A4", 120], ["Craft Scissors", 55], ["Glue Stick — Pack of 6", 75], ["Drawing Sheet Pack, 100 sheets", 160]],
  office: [["Stapler, Medium Duty", 85], ["Punching Machine, Double Hole", 210], ["Paper Clips — Box of 100", 25], ["Rubber Bands — Pack of 250g", 40], ["Correction Pen", 35], ["Steel Scale, 12-inch", 20]],
  adhesives: [["Cello Tape, Transparent — Pack of 6", 90], ["Double Sided Tape", 45], ["Masking Tape Roll", 30], ["Fevicol Bottle, 100g", 55], ["Glue Gun with Sticks", 260], ["Duct Tape Roll", 110]],
  desk: [["Wooden Desk Organizer", 420], ["Metal Pen Stand", 150], ["Paper Tray, 3-Layer", 380], ["Acrylic Name Plate", 180], ["Desk Calendar Stand 2026", 95], ["Clipboard A4 with Cover", 110]],
  computer: [["USB Pen Drive, 32GB", 330], ["Wireless Mouse", 450], ["Printer Ink Cartridge (Black)", 620], ["CD/DVD Pack — 50 pcs", 380], ["Keyboard Dust Cover", 60], ["Laptop Sleeve, 14-inch", 420]],
  calc: [["Scientific Calculator", 650], ["Basic Calculator, 12-Digit", 240], ["Printing Calculator", 1450], ["Pocket Calculator", 110], ["Desktop Calculator, Dual Power", 320], ["Mini Calculator Keychain", 60]],
  school: [["Geometry Box Set", 95], ["School Bag, 20L", 780], ["Water Bottle, 1L", 150], ["Lunch Box, Insulated", 260], ["Compass Box", 65], ["Crayons — Box of 24", 75]],
  housekeeping: [["Cotton Mop with Bucket", 450], ["Floor Cleaner Liquid, 1L", 120], ["Broom, Soft Bristle", 90], ["Dustbin, 15L with Lid", 350], ["Microfiber Cleaning Cloth — Pack of 5", 150], ["Toilet Cleaner, 500ml", 85]],
  safety: [["Safety Helmet, ISI Marked", 220], ["Reflective Safety Vest", 180], ["Safety Goggles, Anti-Fog", 95], ["Nitrile Hand Gloves — Pack of 50", 260], ["N95 Face Mask — Pack of 10", 210], ["First Aid Box, Basic Kit", 480]],
};

function buildProducts() {
  let idCounter = 1;
  const list = [];
  for (const [catId, items] of Object.entries(CATALOG_SEED)) {
    const catName = CATEGORIES.find((c) => c.id === catId).name;
    for (const [name, price] of items) {
      const id = idCounter++;
      const mrp = Math.ceil((price * 1.18) / 5) * 5;
      const discountPct = mrp > price ? Math.round((1 - price / mrp) * 100) : 0;
      list.push({
        id,
        name,
        price,
        catId,
        catName,
        unit: /Pack|Box of|Set/.test(name) ? "per pack" : "per pc",
        initial: (name.replace(/[^A-Za-z]/g, "")[0] || "S"),
        image: `https://placehold.co/300x300?text=${encodeURIComponent(name.split(",")[0].split("—")[0].trim())}`,
        brand: "Stationery World",
        swCode: "SW-" + String(id).padStart(3, "0"),
        customerCode: "CU-" + String(id).padStart(3, "0"),
        mrp,
        discountPct,
        packSize: /Pack of \d+|Box of \d+/i.exec(name)?.[0] || "Single unit",
        tipSize: catId === "writing" && /pen\b/i.test(name) && !/marker|highlighter/i.test(name) ? "0.7 mm" : null,
        inStock: true,
        // admin-management fields (see GET/POST/PUT /admin/products)
        category: catName,
        qty: 100,
      });
    }
  }
  return list;
}

const SEED_USERS = [
  { id: "RJENT01", password: "demo123", name: "Rajesh Kulkarni", org: "RJ Enterprises Pvt. Ltd.", dept: "Administration", phone: "9822011234", role: "customer" },
  { id: "SUNPHARMA02", password: "demo123", name: "Sneha Patil", org: "Sunrise Pharma Distributors", dept: "Procurement", phone: "9922145678", role: "customer" },
  { id: "ADMIN", password: "admin123", name: "Admin User", org: "Stationery World", dept: "Sales", phone: "9370534398", role: "admin" },
];

/** Only seeds when the DB is empty — safe to call on every server start. */
export async function seedIfEmpty() {
  await withDb(async (data) => {
    if (data.users.length === 0) {
      data.users.push(...SEED_USERS);
    }
    if (data.products.length === 0) {
      data.products.push(...buildProducts());
    }
    // backfill: existing databases created before customerCode existed
    for (const p of data.products) {
      // convert old auto-generated codes (SW-1025 / CU-5001) to the simple format;
      // codes typed manually by the admin are left untouched
      const simple = String(p.id).padStart(3, "0");
      if (!p.swCode || /^SW-1\d{3}$/.test(p.swCode)) p.swCode = "SW-" + simple;
      if (p.customerCode === undefined || /^CU-5\d{3}$/.test(p.customerCode)) p.customerCode = "CU-" + simple;
    }
  });
}

// Allow `npm run seed` to force-seed directly (only fills empty collections).
if (import.meta.url === `file://${process.argv[1]}`) {
  await initDb();
  await seedIfEmpty();
  console.log("Seed complete.");
  process.exit(0);
}
