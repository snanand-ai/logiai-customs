/**
 * Auto-detect file type using two-pass approach:
 * Pass 1: Filename pattern matching
 * Pass 2: Content inspection (Excel/CSV column headers)
 */
export function detectFileType(file, sheetData) {
  const name = file.name.toLowerCase();
  const ext = name.split(".").pop();

  // PDF files — detect by filename only
  if (ext === "pdf") {
    if (name.includes("bl") || name.includes("b/l") || name.includes("lading") || name.includes("bal_bl") || name.includes("specimen"))
      return "bl";
    if (name.includes("frt") || name.includes("freight") || name.includes("debit") || name.includes("charge"))
      return "freight";
    if (name.includes("drkw") || name.includes("99/1") || name.includes("declaration") || name.includes("customs"))
      return "drkw";
    if (name.includes("ci") || name.includes("invoice") || name.includes("cipl"))
      return "ci";
    return "other_pdf";
  }

  // Excel/CSV files — inspect content
  if (["xlsx", "xls", "csv", "tsv"].includes(ext) && sheetData) {
    const { names, sh } = sheetData;
    const allHeaders = [];
    names.forEach((n) => {
      if (sh[n]?.length > 0) {
        const headers = Object.keys(sh[n][0]).map((h) => h.toLowerCase());
        allHeaders.push(...headers);
        // Also scan values in first few rows for keywords (handles merged-cell files)
        sh[n].slice(0, 5).forEach((row) => {
          Object.values(row).forEach((v) => {
            if (v && typeof v === "string") allHeaders.push(v.toLowerCase());
          });
        });
      }
    });
    const joined = allHeaders.join(" ");

    // Check for key column patterns
    const hasHS = joined.includes("hs") || joined.includes("tariff") || joined.includes("harmonized") || joined.includes("customs code");
    const hasPart = joined.includes("part") || joined.includes("material") || joined.includes("article") || joined.includes("sku");
    const hasThai = joined.includes("thai") || joined.includes("คำ") || joined.includes("รายละเอียด") || joined.includes("local");
    const totalRows = names.reduce((s, n) => s + (sh[n]?.length || 0), 0);

    // Master data: HS codes + part numbers + (Thai text OR many rows)
    if (hasHS && hasPart && (hasThai || totalRows > 100)) return "master";
    if (name.includes("master") || name.includes("masterdata") || name.includes("logistics_master")) return "master";

    // DRKW: has CIF + duty + HS columns
    const hasCIF = joined.includes("cif") || joined.includes("cifthb");
    const hasDuty = joined.includes("duty") || joined.includes("vat") || joined.includes("tax");
    if (name.includes("drkw")) return "drkw";
    if (hasCIF && hasDuty && hasHS) return "drkw";

    // Commercial Invoice: has qty + price + description/part
    const hasQty = joined.includes("qty") || joined.includes("quantity") || joined.includes("pcs");
    const hasPrice = joined.includes("price") || joined.includes("amount") || joined.includes("value") || joined.includes("cost");
    const hasDesc = joined.includes("desc") || joined.includes("description") || joined.includes("goods") || joined.includes("item");
    if (name.includes("cipl") || name.includes("ci_") || name.includes("invoice")) return "ci";
    if (hasQty && hasPrice && (hasDesc || hasPart)) return "ci";

    // Freight
    if (name.includes("frt") || name.includes("freight")) return "freight";

    // Fallbacks
    if (hasPart && hasPrice) return "ci";
    if (hasHS) return "master";
  }

  return "unknown";
}
