/**
 * Generates the next SW-Q-000040 / SW-O-000012 style id for a
 * quotation or order, using (and advancing) the persisted counter.
 * `data` must be the in-memory db.data object from a withDb() call.
 */
export function nextQuotationId(data, type) {
  const key = type === "order" ? "order" : "quotation";
  const prefix = type === "order" ? "SW-O-" : "SW-Q-";
  data.counters[key] = (data.counters[key] || 0) + 1;
  return prefix + String(data.counters[key]).padStart(6, "0");
}

/** SW-D-000001 (dispatch) / SW-I-000001 (invoice) style ids. */
export function nextDocId(data, kind) {
  const prefix = kind === "invoice" ? "SW-I-" : "SW-D-";
  data.counters[kind] = (data.counters[kind] || 0) + 1;
  return prefix + String(data.counters[kind]).padStart(6, "0");
}
