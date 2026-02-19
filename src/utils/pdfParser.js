/**
 * PDF text extraction for Bill of Lading and other shipment documents.
 * Uses pdfjs-dist to extract positioned text, then applies pattern matching
 * to pull out structured B/L metadata.
 */
import * as pdfjsLib from "pdfjs-dist/build/pdf.mjs";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

/**
 * Read a File object into an ArrayBuffer.
 */
const readBuffer = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });

/**
 * Extract all text items with position from a PDF file.
 * Returns array of { text, x, y, page } sorted top-to-bottom.
 */
async function extractTextItems(file) {
  const buf = await readBuffer(file);
  const data = new Uint8Array(buf);
  const doc = await pdfjsLib.getDocument({ data }).promise;
  const allItems = [];

  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    content.items.forEach((item) => {
      if (item.str.trim()) {
        allItems.push({
          text: item.str.trim(),
          x: Math.round(item.transform[4]),
          y: Math.round(item.transform[5]),
          page: p,
        });
      }
    });
  }

  return allItems;
}

/**
 * Group text items by Y coordinate (rows) and concatenate items on the same row.
 * Returns array of { y, texts: [{x, text}] } sorted top-to-bottom (descending Y).
 */
function groupByRows(items) {
  const byY = {};
  items.forEach((item) => {
    if (!(item.y in byY)) byY[item.y] = [];
    byY[item.y].push({ x: item.x, text: item.text });
  });

  return Object.entries(byY)
    .map(([y, texts]) => ({
      y: Number(y),
      texts: texts.sort((a, b) => a.x - b.x),
      full: texts.sort((a, b) => a.x - b.x).map((t) => t.text).join(" "),
    }))
    .sort((a, b) => b.y - a.y); // descending Y = top to bottom in page order
}

/**
 * Get text at a specific X region from a row's text items.
 * @param {Array} texts - row.texts array [{x, text}]
 * @param {number} xMin - minimum X
 * @param {number} xMax - maximum X
 */
function textInRange(texts, xMin, xMax) {
  return texts
    .filter((t) => t.x >= xMin && t.x < xMax)
    .map((t) => t.text)
    .join(" ")
    .trim();
}

/**
 * Extract Bill of Lading metadata from a PDF file.
 * Uses position-aware parsing to handle the structured B/L grid layout.
 *
 * Typical B/L layout (3 columns):
 *   Row: "Place of Receipt" (x~35) | "Pre-carriage by" (x~170) | "Port of Loading" (x~304)
 *   Row: "ZHONGSHAN (DOOR)" (x~37) | [empty]                  | "SHEKOU" (x~306)    + "B/L No." (x~448)
 *   Row: "Vessel" (x~35)           | "Voyage No." (x~170)     | "Port of Transshipment" (x~304)
 *   Row: "CHANA BHUM" (x~37)       | "910S" (x~170)           | [empty]              + "1070749239" (x~448)
 *
 * B/L Number label is in column 4 (x>400), value is on the next value row at same X.
 */
export async function extractBLMetadata(file) {
  const meta = {};

  try {
    const items = await extractTextItems(file);
    if (!items.length) return meta;

    const rows = groupByRows(items.filter((i) => i.page === 1));
    const fullText = rows.map((r) => r.full).join("\n");

    // Build a structured understanding of the B/L grid
    // Find label rows and their corresponding value rows
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const nextRow = rows[i + 1];

      // === SHIPPER ===
      if (row.full === "Shipper" && nextRow) {
        const lines = [];
        for (let j = i + 1; j < rows.length && j < i + 6; j++) {
          if (rows[j].full.includes("Consignee") || rows[j].full.includes("Notify")) break;
          const line = textInRange(rows[j].texts, 0, 280);
          if (line) lines.push(line);
        }
        if (lines.length) meta.shipper = lines.join(", ").replace(/,\s*$/, "");
      }

      // === CONSIGNEE ===
      if (row.full.startsWith("Consignee") && nextRow) {
        const lines = [];
        for (let j = i + 1; j < rows.length && j < i + 6; j++) {
          if (rows[j].full.includes("Notify Party") || rows[j].full.includes("Delivery")) break;
          const line = textInRange(rows[j].texts, 0, 280);
          if (line) lines.push(line);
        }
        if (lines.length) meta.consignee = lines[0];
      }

      // === PORT OF LOADING + B/L NO (label row) ===
      // Label row: "Place of Receipt ... | Pre-carriage by | Port of Loading"
      // Value row: "ZHONGSHAN (DOOR)"    | [empty]         | "SHEKOU"         | "B/L No."
      // Next label: "Vessel"             | "Voyage No."    | "Port of Transshipment"
      // Next value: "CHANA BHUM"         | "910S"          |                  | "1070749239"
      if (row.full.includes("Place of Receipt") && row.full.includes("Port of Loading") && nextRow) {
        // Value row is nextRow (i+1)
        // Port of Loading: get text in x range 280-430 (column 3)
        const polVal = textInRange(nextRow.texts, 280, 430);
        if (polVal && polVal.length > 1) meta.pol = polVal;

        // B/L No label might be at x>430 on this value row
        // The actual B/L NUMBER is 2 rows below (the next value row)
        // Find it: skip the next label row (Vessel/Voyage), get the value row after that
        if (i + 3 < rows.length) {
          const blValueRow = rows[i + 3]; // value row after Vessel/Voyage labels
          const blNo = textInRange(blValueRow.texts, 400, 600);
          if (blNo && /^\d{5,}$/.test(blNo.trim())) {
            meta.blNo = blNo.trim();
          }
        }
      }

      // === VESSEL + VOYAGE (label row) ===
      if (row.full.includes("Vessel") && row.full.includes("Voyage") && !row.full.includes("Board") && nextRow) {
        // Vessel: column 1 (x < 160)
        const vesselVal = textInRange(nextRow.texts, 0, 160);
        if (vesselVal) meta.vessel = vesselVal;

        // Voyage: column 2 (x 160-300)
        const voyageVal = textInRange(nextRow.texts, 160, 300);
        if (voyageVal) meta.voyage = voyageVal;
      }

      // === PORT OF DISCHARGE (label row) ===
      if (row.full.includes("Port of Discharge") && row.full.includes("Place of Delivery") && nextRow) {
        // POD: column 1 (x < 160)
        const podVal = textInRange(nextRow.texts, 0, 160);
        if (podVal) meta.pod = podVal;
      }

      // === TAX ID ===
      const taxMatch = row.full.match(/TAX\s*ID\s*[:\s]\s*(\d{10,})/i);
      if (taxMatch) meta.taxId = taxMatch[1];

      // === PACKAGES ===
      const pkgMatch = row.full.match(/(\d+)\s+(CARTON|PALLET|PACKAGE|CASE|BOX|CRATE|DRUM|BAG|BUNDLE|PIECE|UNIT)/i);
      if (pkgMatch && !meta.packages) {
        meta.packages = parseInt(pkgMatch[1]);
        meta.pkgUnit = pkgMatch[2].toUpperCase().replace(/\(S\)$/i, "");
      }

      // === GROSS WEIGHT ===
      const gwMatch = row.full.match(/(\d+\.?\d*)\s*(?:kgs?|KGS?)/);
      if (gwMatch && !meta.grossWeight) {
        meta.grossWeight = parseFloat(gwMatch[1]);
      }
    }

    // === FALLBACK REGEX on full text ===

    // B/L number — scan all rows for a standalone long number at x > 400
    if (!meta.blNo) {
      for (const row of rows) {
        for (const t of row.texts) {
          if (t.x > 400 && /^\d{7,}$/.test(t.text.trim())) {
            meta.blNo = t.text.trim();
            break;
          }
        }
        if (meta.blNo) break;
      }
    }

    // B/L number — last resort regex
    if (!meta.blNo) {
      const blMatch = fullText.match(/B\/L\s*No\.?\s*\n?\s*(\d{7,})/i);
      if (blMatch) meta.blNo = blMatch[1];
    }

    // Date — look for date patterns
    const dateMatch = fullText.match(/(?:Date|Shipped on board)[:\s]*\n?\s*(\d{1,2}[.\/-]\d{1,2}[.\/-]\d{2,4})/i);
    if (dateMatch) {
      const raw = dateMatch[1];
      const parts = raw.split(/[.\/-]/);
      if (parts.length === 3) {
        const [d, m, y] = parts;
        const yr = y.length === 2 ? "20" + y : y;
        const dateStr = `${yr}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
        const dt = new Date(dateStr);
        if (!isNaN(dt.getTime())) meta.eta = dateStr;
      }
    }

    // Origin — infer from shipper address
    const originMatch = fullText.match(/\b(CHINA|JAPAN|KOREA|TAIWAN|VIETNAM|INDONESIA|MALAYSIA|INDIA|GERMANY|USA|ITALY)\b/i);
    if (originMatch) {
      const countryMap = {
        CHINA: "CN", JAPAN: "JP", KOREA: "KR", TAIWAN: "TW",
        VIETNAM: "VN", INDONESIA: "ID", MALAYSIA: "MY", INDIA: "IN",
        GERMANY: "DE", USA: "US", ITALY: "IT",
      };
      meta.origin = countryMap[originMatch[1].toUpperCase()] || originMatch[1].substring(0, 2).toUpperCase();
    }

    // Vessel from "Shipped on Board Vessel:" at bottom of B/L
    if (!meta.vessel) {
      const vesselMatch = fullText.match(/Shipped on Board Vessel:\s*\n?\s*([A-Z][A-Z\s]+)/i);
      if (vesselMatch) meta.vessel = vesselMatch[1].trim();
    }

    // Port of Loading fallback from "Shipped from Port of Loading:" at bottom
    if (!meta.pol) {
      const polMatch = fullText.match(/(?:Shipped from )?Port of Loading:\s*\n?\s*([A-Z][A-Z\s]+)/i);
      if (polMatch) {
        const p = polMatch[1].trim();
        if (p.length > 2 && p.length < 30) meta.pol = p;
      }
    }

  } catch (err) {
    console.warn("B/L PDF parse error:", err.message);
  }

  return meta;
}

/**
 * Extract any readable text from a PDF for basic content detection.
 * Returns the first ~2000 chars of text content.
 */
export async function extractPDFText(file) {
  try {
    const items = await extractTextItems(file);
    return items.map((i) => i.text).join(" ").substring(0, 2000);
  } catch {
    return "";
  }
}
