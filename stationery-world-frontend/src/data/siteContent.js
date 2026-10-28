/* =====================================================
   SITE CONTENT
   ---------------------------------------------------
   Static, rarely-changing UI copy and taxonomy. This is
   NOT mock backend data — it's fine to keep this as
   frontend constants even after a real backend is
   connected. (If you later want marketing/homepage copy
   editable without a redeploy, this is the file to turn
   into a CMS/API-driven fetch.)
===================================================== */
import imgWriting from "../assets/products/writing.svg";
import imgNotebooks from "../assets/products/notebooks.svg";
import imgFiles from "../assets/products/files.svg";
import imgArt from "../assets/products/art.svg";
import imgOffice from "../assets/products/office.svg";
import imgAdhesives from "../assets/products/adhesives.svg";
import imgDesk from "../assets/products/desk.svg";
import imgComputer from "../assets/products/computer.svg";
import imgCalc from "../assets/products/calc.svg";
import imgSchool from "../assets/products/school.svg";
import imgHousekeeping from "../assets/products/housekeeping.svg";
import imgSafety from "../assets/products/safety.svg";

/* Placeholder product imagery — one representative icon per category.
   Swap these for real photography whenever you have product shots. */
export const CATEGORY_IMAGES = {
  writing: imgWriting,
  notebooks: imgNotebooks,
  files: imgFiles,
  art: imgArt,
  office: imgOffice,
  adhesives: imgAdhesives,
  desk: imgDesk,
  computer: imgComputer,
  calc: imgCalc,
  school: imgSchool,
  housekeeping: imgHousekeeping,
  safety: imgSafety,
};

export const CATEGORIES = [
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

export const NAV_LINKS = [
  { label: "Home", view: "home" },
  { label: "Shop", view: "catalog" },
  { label: "Office Stationery", view: "catalog", cat: "office" },
  { label: "House Keeping", view: "catalog", cat: "housekeeping" },
  { label: "Safety Products", view: "catalog", cat: "safety" },
];

/* Navigation shown to logged-in customers (admin keeps NAV_LINKS above) */
export const CUSTOMER_NAV = [
  { label: "Quotations & Orders", view: "myorders" },
  { label: "Invoices", view: "myinvoices" },
  { label: "Dispatch & Pending Report", view: "mydispatch" },
  { label: "My Profile", view: "profile" },
];

export const HERO_SLIDES = [
  {
    title: "One Stop Solution for All Your Needs",
    body: "Search a growing catalog of writing, office, art and school essentials, and turn your picks into a ready-to-share quotation in minutes.",
  },
  {
    title: "Bulk Orders, Simplified",
    body: "Build a cart across every category, then generate a clean, printable quotation for your organization in a single click.",
  },
  {
    title: "Trusted by Organizations Like Yours",
    body: "Sign in with your registered login to see your catalog, place your selections, and request pricing instantly.",
  },
];

export const WHY_US = [
  { title: "Verified Organization Logins", desc: "Every account is issued directly by our team, so pricing and access stay controlled." },
  { title: "1,000+ Products", desc: "Writing, office, art, computer and school essentials — all under one catalog." },
  { title: "Instant Quotations", desc: "Build a selection and generate a clean, printable quotation in a single click." },
  { title: "Dedicated Support", desc: "Our sales team confirms pricing, availability and delivery before dispatch." },
];

export const SERVICES = [
  { title: "Bulk & Corporate Orders", desc: "Volume pricing and consolidated billing for organizations of any size." },
  { title: "Custom Quotations", desc: "Generate a branded, itemized quotation straight from your cart, ready to share." },
  { title: "Scheduled Reordering", desc: "Set up recurring supply runs for the items your team uses most." },
  { title: "Dedicated Account Support", desc: "A named contact for pricing, availability and delivery questions." },
];
