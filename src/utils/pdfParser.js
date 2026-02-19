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
 * Returns array of { y, texts: [{x, text}] } sorted top-to-bottom.
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
    .sort((a, b) => b.y - a.y); // descending Y = top to bottom
}

/**
 * Extract Bill of Lading metadata from a PDF file.
 * Parses the structured B/L format with labeled fields.
 *
 * Returns: { blNo, vessel, voyage, pol, pod, shipper, consignee,
 *            taxId, packages, pkgUnit, grossWeight, eta, origin }
 */
export async function extractBLMetadata(file) {
  const meta = {};

  try {
    const items = await extractTextItems(file);
    if (!items.length) return meta;

    const rows = groupByRows(items.filter((i) => i.page === 1));
    const fullText = rows.map((r) => r.full).join("\n");

    // === STRATEGY ===
    // B/L PDFs have labeled sections. We find the label row, then the value row below it.
    // The layout is: label rows have field names like "Vessel", "Port of Discharge", etc.
    // Value rows are directly below (lower Y value) with the actual data.

    // Find rows containing specific labels and grab the row below
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const nextRow = rows[i + 1];
      const prevRow = i > 0 ? rows[i - 1] : null;

      // Shipper — labeled section, value spans multiple rows below
      if (row.full === "Shipper" && nextRow) {
        // Collect shipper lines until we hit "Consignee"
        const lines = [];
        for (let j = i + 1; j < rows.length && j < i + 6; j++) {
          if (rows[j].full.includes("Consignee") || rows[j].full.includes("Notify")) break;
          const line = rows[j].texts.filter((t) => t.x < 280).map((t) => t.text).join(" ");
          if (line) lines.push(line);
        }
        if (lines.length) meta.shipper = lines.join(", ").replace(/,\s*$/, "");
      }

      // Consignee — labeled section
      if (row.full.startsWith("Consignee") && nextRow) {
        const lines = [];
        for (let j = i + 1; j < rows.length && j < i + 6; j++) {
          if (rows[j].full.includes("Notify Party") || rows[j].full.includes("Delivery")) break;
          const line = rows[j].texts.filter((t) => t.x < 280).map((t) => t.text).join(" ");
          if (line) lines.push(line);
        }
        if (lines.length) meta.consignee = lines[0]; // First line is company name
      }

      // Port of Loading — look for label, then value below
      if (row.full.includes("Port of Loading") && nextRow) {
        // Port of Loading is typically at x > 350 in the label row
        // and value is at similar x in next row
        const loadingTexts = nextRow.texts.filter((t) => t.x > 250 && t.x < 500);
        if (loadingTexts.length) {
          const pol = loadingTexts.map((t) => t.text).join(" ");
          if (pol && !pol.includes("B/L")) meta.pol = pol;
        }
        // Sometimes Port of Loading label is standalone and value is on the right of same row
      }

      // Place of Receipt / Port of Loading / B/L No row
      if (row.full.includes("Place of Receipt") && row.full.includes("Port of Loading")) {
        // Values on next row
        if (nextRow) {
          // Parse the next row: typically "ZHONGSHAN (DOOR) | SHEKOU | B/L No."
          // or values: place of receipt at left, POL in middle, B/L label on right
          const vals = nextRow.texts;
          if (vals.length >= 1) {
            // Left portion = place of receipt, skip for now
            // Look for port of loading
          }
        }
      }

      // B/L No — often appears as a label, with value on the row below
      if (row.full.includes("B/L No") && nextRow) {
        // The B/L number could be in the next row at right-side x position
        const blTexts = nextRow.texts.filter((t) => t.x > 350);
        if (blTexts.length) {
          const bn = blTexts.map((t) => t.text).join("").trim();
          if (bn && /\d{5,}/.test(bn)) meta.blNo = bn;
        }
      }

      // Vessel + Voyage — labeled row, values below
      if (row.full.includes("Vessel") && row.full.includes("Voyage")) {
        if (nextRow) {
          const vals = nextRow.texts;
          // Vessel is typically at x < 200, Voyage at middle position
          const vesselTexts = vals.filter((t) => t.x < 200);
          const voyageTexts = vals.filter((t) => t.x >= 200 && t.x < 400);
          if (vesselTexts.length) meta.vessel = vesselTexts.map((t) => t.text).join(" ");
          if (voyageTexts.length) meta.voyage = voyageTexts.map((t) => t.text).join("");
        }
      }

      // Port of Discharge + Place of Delivery + Movement
      if (row.full.includes("Port of Discharge") && row.full.includes("Place of Delivery")) {
        if (nextRow) {
          const vals = nextRow.texts;
          // POD at left, Place of Delivery middle, Movement right
          const podTexts = vals.filter((t) => t.x < 150);
          if (podTexts.length) meta.pod = podTexts.map((t) => t.text).join(" ");
        }
      }

      // Tax ID pattern: **TAX ID:0105520015634
      const taxMatch = row.full.match(/TAX\s*ID\s*[:\s]\s*(\d{10,})/i);
      if (taxMatch) meta.taxId = taxMatch[1];

      // Packages: "29   CARTON(S)"
      const pkgMatch = row.full.match(/(\d+)\s+(CARTON|PALLET|PACKAGE|CASE|BOX|CRATE|DRUM|BAG|BUNDLE|PIECE|UNIT)/i);
      if (pkgMatch && !meta.packages) {
        meta.packages = parseInt(pkgMatch[1]);
        meta.pkgUnit = pkgMatch[2].toUpperCase().replace(/\(S\)$/i, "");
      }

      // Gross weight: "234.500" kgs
      const gwMatch = row.full.match(/(\d+\.?\d*)\s*(?:kgs?|KGS?)/);
      if (gwMatch && !meta.grossWeight) {
        meta.grossWeight = parseFloat(gwMatch[1]);
      }
    }

    // Regex fallbacks on full text for fields not yet found

    // B/L number — try regex on full text
    if (!meta.blNo) {
      const blMatch = fullText.match(/B\/L\s*No\.?\s*\n?\s*(\d{7,})/i);
      if (blMatch) meta.blNo = blMatch[1];
    }

    // Date — look for date patterns near "Date:" label
    const dateMatch = fullText.match(/(?:Date|Shipped on board)[:\s]*\n?\s*(\d{1,2}[.\/-]\d{1,2}[.\/-]\d{2,4})/i);
    if (dateMatch) {
      const raw = dateMatch[1];
      // Handle DD.MM.YYYY format
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

    // Vessel from "Shipped on Board Vessel:" section
    if (!meta.vessel) {
      const vesselMatch = fullText.match(/Shipped on Board Vessel:\s*\n?\s*([A-Z][A-Z\s]+)/i);
      if (vesselMatch) meta.vessel = vesselMatch[1].trim();
    }

    // Port of Loading from "Shipped from Port of Loading:" section
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
