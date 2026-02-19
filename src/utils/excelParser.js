import * as XLSX from "xlsx";

const readBuffer = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });

/**
 * Parse an Excel or CSV file into { names: string[], sh: Record<string, object[]> }
 */
export async function parseExcel(file) {
  const buf = await readBuffer(file);
  const wb = XLSX.read(buf, { type: "array" });
  const sh = {};
  wb.SheetNames.forEach((name) => {
    sh[name] = XLSX.utils.sheet_to_json(wb.Sheets[name], { defval: "" });
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
  partNo: ["part", "material", "item no", "sku", "product code", "article", "customer material"],
  description: ["desc", "description", "item name", "product", "goods"],
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
