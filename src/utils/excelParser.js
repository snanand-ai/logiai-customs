import * as XLSX from "xlsx";

const readBuffer = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });

/**
 * Known keywords that indicate a real header row (case-insensitive).
 * If a row contains 3+ of these, it's very likely the header.
 */
const HEADER_KEYWORDS = [
  "part", "material", "article", "sku", "product",
  "desc", "description", "item", "goods",
  "qty", "quantity", "pcs", "units",
  "price", "unit price", "amount", "value", "cost",
  "weight", "n.w", "g.w", "nw", "gw",
  "po", "purchase order", "order",
  "hs", "tariff", "harmonized",
  "duty", "rate", "tax",
  "thai", "origin", "country",
  "cif", "vat", "customs",
];

/**
 * Scan a sheet's raw cells to find the header row.
 * Returns the 0-based row index, or 0 if no clear header found.
 */
function detectHeaderRow(sheet) {
  const ref = sheet["!ref"];
  if (!ref) return 0;
  const range = XLSX.utils.decode_range(ref);
  const maxScanRow = Math.min(range.e.r, 30); // scan first 30 rows only
  let bestRow = 0;
  let bestScore = 0;

  for (let r = 0; r <= maxScanRow; r++) {
    let score = 0;
    let nonEmpty = 0;
    for (let c = range.s.c; c <= Math.min(range.e.c, 30); c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      const cell = sheet[addr];
      if (!cell || cell.v === "" || cell.v === undefined) continue;
      nonEmpty++;
      const val = String(cell.v).toLowerCase().trim();
      for (const kw of HEADER_KEYWORDS) {
        if (val.includes(kw)) { score++; break; }
      }
    }
    // Require at least 3 keyword matches and at least 3 non-empty cells
    if (score > bestScore && score >= 3 && nonEmpty >= 3) {
      bestScore = score;
      bestRow = r;
    }
  }
  return bestRow;
}

/**
 * Parse a single sheet starting from the detected header row.
 * Returns an array of row objects keyed by header values.
 */
function parseSheetWithHeaderDetection(sheet) {
  const headerRow = detectHeaderRow(sheet);
  // Use sheet_to_json with a range starting from the header row
  const ref = sheet["!ref"];
  if (!ref) return [];
  const range = XLSX.utils.decode_range(ref);
  range.s.r = headerRow; // set start row to detected header
  const newRef = XLSX.utils.encode_range(range);
  // Create a shallow copy with adjusted ref
  const adjusted = Object.assign({}, sheet, { "!ref": newRef });
  return XLSX.utils.sheet_to_json(adjusted, { defval: "" });
}

/**
 * Parse an Excel or CSV file into { names: string[], sh: Record<string, object[]> }
 * Handles merged-cell files by auto-detecting the header row.
 */
export async function parseExcel(file) {
  const buf = await readBuffer(file);
  const wb = XLSX.read(buf, { type: "array" });
  const sh = {};
  wb.SheetNames.forEach((name) => {
    const sheet = wb.Sheets[name];
    const defaultParse = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    // Check if default parse produced usable headers
    if (defaultParse.length > 0) {
      const headers = Object.keys(defaultParse[0]);
      const junkHeaders = headers.filter((h) => /^__EMPTY/.test(h)).length;
      // If >50% of headers are __EMPTY, try smart header detection
      if (junkHeaders > headers.length * 0.5) {
        const smartParse = parseSheetWithHeaderDetection(sheet);
        if (smartParse.length > 0) {
          const smartHeaders = Object.keys(smartParse[0]);
          const realHeaders = smartHeaders.filter((h) => !/^__EMPTY/.test(h)).length;
          // Accept smart parse if it found at least 3 real column headers
          // (wide merged-cell files may still have many __EMPTY columns)
          if (realHeaders >= 3) {
            sh[name] = smartParse;
            return;
          }
        }
      }
    }
    sh[name] = defaultParse;
  });
  return { names: wb.SheetNames, sh };
}

/**
 * Find a column header matching any of the given patterns (case-insensitive substring match).
 * Returns the original header string or null.
 */
export function findColumn(headers, patterns) {
  const lower = headers.map((s) => String(s).toLowerCase().trim());
  for (const pat of patterns) {
    const idx = lower.findIndex((h) => h.includes(pat));
    if (idx >= 0) return headers[idx];
  }
  return null;
}

// Column detection patterns per the spec
export const CI_COLUMNS = {
  // "customer material" first — this is typically the key used for master data matching
  partNo: ["customer material", "material", "part", "item no", "sku", "product code", "article"],
  description: ["part name", "desc", "description", "item name", "product", "goods"],
  quantity: ["qty", "quantity", "pcs", "units", "order qty"],
  unitPrice: ["unit price", "price", "unit cost", "rate"],
  amount: ["amount", "total", "value", "ext. price"],
  netWeight: ["net weight", "n.w", "nw"],
  grossWeight: ["gross weight", "g.w", "gw"],
  poNumber: ["po", "purchase order", "po number", "order no"],
};

export const MASTER_COLUMNS = {
  partNo: ["part", "material", "item", "sku", "product", "article", "customer material"],
  hsCode: ["hs", "tariff", "hts", "customs code", "harmonized"],
  thaiDesc: ["thai", "th desc", "คำอธิบาย", "รายละเอียด", "local desc"],
  dutyRate: ["duty", "rate", "tax rate"],
  origin: ["origin", "country", "coo"],
};
