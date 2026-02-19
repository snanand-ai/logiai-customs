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
  return { names: wb.SheetNames, sh, wb };
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

/**
 * Extract shipment header metadata from both the area ABOVE the data header row
 * and the FOOTER area below the data (totals, shipper/beneficiary info, bank details).
 * Scans raw cells for patterns like "INVOICE NO:", "DATE:", "B/L", consignee name,
 * shipper/beneficiary name, total packages, total weight, etc.
 */
export function extractHeaderMetadata(file, wb) {
  const meta = {};
  // Only process Excel files
  const ext = file.name.split(".").pop().toLowerCase();
  if (!["xlsx", "xls"].includes(ext)) return meta;

  // Find the CI sheet
  let sheetName = wb.SheetNames[0];
  for (const n of wb.SheetNames) {
    const l = n.toLowerCase();
    if (l.includes("ci") || l.includes("invoice") || l.includes("commercial")) { sheetName = n; break; }
  }
  const sheet = wb.Sheets[sheetName];
  if (!sheet || !sheet["!ref"]) return meta;

  const headerRow = detectHeaderRow(sheet);
  const range = XLSX.utils.decode_range(sheet["!ref"]);

  // Collect all text from the area ABOVE the data header row
  const headerText = [];
  for (let r = 0; r < headerRow; r++) {
    for (let c = range.s.c; c <= Math.min(range.e.c, 20); c++) {
      const cell = sheet[XLSX.utils.encode_cell({ r, c })];
      if (cell && cell.v !== "" && cell.v !== undefined) {
        headerText.push({ r, c, v: String(cell.v).trim() });
      }
    }
  }

  // Collect all text from the FOOTER area (below data)
  const footerText = [];
  for (let r = headerRow + 1; r <= range.e.r; r++) {
    for (let c = range.s.c; c <= Math.min(range.e.c, 20); c++) {
      const cell = sheet[XLSX.utils.encode_cell({ r, c })];
      if (cell && cell.v !== "" && cell.v !== undefined) {
        footerText.push({ r, c, v: String(cell.v).trim() });
      }
    }
  }

  // --- HEADER AREA ---
  for (const { r, c, v } of headerText) {
    const vl = v.toLowerCase();

    // Invoice number: "INVOICE NO: 251030" or "INV-251030"
    const invMatch = v.match(/invoice\s*(?:no\.?|number|#)?\s*[:\s]\s*(.+)/i);
    if (invMatch) meta.invNo = invMatch[1].trim();

    // Date: "DATE:DEC 12,2025" or "DATE: 2025-12-15"
    const dateMatch = v.match(/date\s*[:\s]\s*(.+)/i);
    if (dateMatch) {
      const raw = dateMatch[1].trim();
      const d = new Date(raw);
      if (!isNaN(d.getTime())) {
        meta.invDate = d.toISOString().split("T")[0];
      }
    }

    // Consignee: typically the cell after "Name" label
    if (vl === "name") {
      const nameCell = headerText.find((t) => t.r === r && t.c > c);
      if (nameCell && nameCell.v.length > 3) meta.consignee = nameCell.v;
    }

    // Address (for reference)
    if (vl === "address") {
      const addrCell = headerText.find((t) => t.r === r && t.c > c);
      if (addrCell && addrCell.v.length > 5) meta.consigneeAddr = addrCell.v;
    }

    // B/L number
    const blMatch = v.match(/b\/?l\s*(?:no\.?|number|#)?\s*[:\s]\s*(.+)/i);
    if (blMatch) meta.blNo = blMatch[1].trim();

    // Vessel
    const vesselMatch = v.match(/vessel\s*[:\s]\s*(.+)/i);
    if (vesselMatch) meta.vessel = vesselMatch[1].trim();

    // Currency detection from "Unit price (USD)" style headers or "USD" mentions
    const curMatch = v.match(/\b(USD|EUR|GBP|JPY|CNY|SGD)\b/i);
    if (curMatch && !meta.currency) meta.currency = curMatch[1].toUpperCase();
  }

  // --- FOOTER AREA ---
  // Look for: totals row, shipper/beneficiary info, payment terms
  let foundTotal = false;
  let foundBeneficiary = false;

  for (const { r, c, v } of footerText) {
    const vl = v.toLowerCase();

    // Totals row: "TOTAL：" or "TOTAL" — grab packages (CTNS col), net/gross weight
    if (vl.includes("total") && !foundTotal) {
      // Find numeric values on the same row (packages, weights, amount)
      const rowCells = footerText.filter((t) => t.r === r && t.c > c);
      foundTotal = true;

      // Packages (CTNS column — typically around column G/index 6)
      // Look for small integer (packages count) followed by larger weight values
      const nums = rowCells
        .map((t) => ({ c: t.c, n: parseFloat(t.v) }))
        .filter((t) => !isNaN(t.n));

      if (nums.length >= 2) {
        // First small integer is likely packages, last large number is total amount
        const sorted = [...nums].sort((a, b) => a.c - b.c);
        // Packages: first numeric value that's a reasonable package count (1-9999)
        for (const { c: col, n } of sorted) {
          if (n > 0 && n < 10000 && Number.isInteger(n) && !meta.packages) {
            meta.packages = n;
            break;
          }
        }
      }
    }

    // Beneficiary/Shipper name
    if (vl.includes("beneficiary name") || vl.includes("shipper")) {
      foundBeneficiary = true;
    }
    // The shipper name is typically on the row after "Beneficiary Name:"
    if (foundBeneficiary && !meta.shipper) {
      // Check if this is a company name (contains CO, LTD, CORP, INC, etc.)
      if (/\b(CO\.?\s*LTD|CORP|INC|LLC|LIMITED|ENTERPRISE|TRADING|MANUFACTURING)\b/i.test(v)) {
        meta.shipper = v.replace(/\s+/g, " ");
      }
    }

    // Payment terms
    if (vl.includes("payment terms") || vl.includes("payment term")) {
      const ptMatch = v.match(/payment\s*terms?\s*[:\s]\s*(.+)/i);
      if (ptMatch) meta.paymentTerms = ptMatch[1].trim();
    }

    // Origin detection from footer text (e.g., "CHINA", "GUANGDONG, CHINA")
    if (!meta.origin) {
      const originMatch = v.match(/\b(CHINA|JAPAN|KOREA|TAIWAN|VIETNAM|INDONESIA|MALAYSIA|INDIA|GERMANY|ITALY|HONG\s*KONG)\b/i);
      if (originMatch) {
        const countryMap = {
          CHINA: "CN", JAPAN: "JP", KOREA: "KR", TAIWAN: "TW",
          VIETNAM: "VN", INDONESIA: "ID", MALAYSIA: "MY", INDIA: "IN",
          GERMANY: "DE", ITALY: "IT", "HONG KONG": "HK",
        };
        const key = originMatch[1].toUpperCase();
        meta.origin = countryMap[key] || key.substring(0, 2);
      }
    }
  }

  // Also check the PL (packing list) sheet for additional metadata
  for (const n of wb.SheetNames) {
    const nl = n.toLowerCase();
    if (nl.includes("pl") || nl.includes("packing")) {
      const plSheet = wb.Sheets[n];
      if (!plSheet || !plSheet["!ref"]) continue;
      const plRange = XLSX.utils.decode_range(plSheet["!ref"]);

      // Scan PL footer for package/weight totals
      for (let r = Math.max(0, plRange.e.r - 20); r <= plRange.e.r; r++) {
        for (let col = plRange.s.c; col <= Math.min(plRange.e.c, 15); col++) {
          const cell = plSheet[XLSX.utils.encode_cell({ r, c: col })];
          if (!cell || cell.v === "" || cell.v === undefined) continue;
          const cv = String(cell.v).trim().toLowerCase();
          if (cv.includes("total")) {
            // Grab values from same row
            const rowVals = [];
            for (let rc = col + 1; rc <= Math.min(plRange.e.c, 15); rc++) {
              const vc = plSheet[XLSX.utils.encode_cell({ r, c: rc })];
              if (vc && vc.v !== "" && typeof vc.v === "number") {
                rowVals.push({ c: rc, v: vc.v });
              }
            }
            // CBM is typically the volume column
            if (!meta.cbm) {
              const cbmVal = rowVals.find((v) => v.v > 0 && v.v < 100);
              // Use the value around the CBM column position
            }
          }
        }
      }
      break; // Only process first PL sheet
    }
  }

  return meta;
}

export const MASTER_COLUMNS = {
  partNo: ["part", "material", "item", "sku", "product", "article", "customer material"],
  hsCode: ["hs", "tariff", "hts", "customs code", "harmonized"],
  thaiDesc: ["thai", "th desc", "คำอธิบาย", "รายละเอียด", "local desc"],
  dutyRate: ["duty", "rate", "tax rate"],
  origin: ["origin", "country", "coo"],
};
