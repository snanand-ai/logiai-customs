import { useRef, useCallback } from "react";
import Icons from "./Icons";
import { s } from "../constants/styles";
import { parseExcel, findColumn, CI_COLUMNS, MASTER_COLUMNS, extractHeaderMetadata } from "../utils/excelParser";
import { detectFileType } from "../utils/fileDetection";
import { extractBLMetadata } from "../utils/pdfParser";
import { uid } from "../utils/format";

const DOC_STATUS_CONFIG = [
  { key: "ci", label: "Commercial Invoice", icon: Icons.grid, required: true, color: "#2563eb" },
  { key: "bl", label: "Bill of Lading", icon: Icons.anchor, required: true, color: "#c6952e" },
  { key: "master", label: "Master Data (HS Codes)", icon: Icons.db, required: false, color: "#7c3aed" },
  { key: "freight", label: "Freight Invoice", icon: Icons.dollar, required: false, color: "#15803d" },
  { key: "drkw", label: "Previous DRKW", icon: Icons.file, required: false, color: "#be185d" },
];

export default function UploadPage({ docs, setDocs, uploadLog, setUploadLog, items, setItems, md, setMd, hdr, setHdr, msg, setPg, onStatusAdvance }) {
  const inputRef = useRef();
  const uploading = useRef(false);

  const processFiles = async (fileList) => {
    if (uploading.current) return;
    uploading.current = true;
    const log = [];
    const newDocs = { ...docs };

    for (const file of fileList) {
      const ext = file.name.split(".").pop().toLowerCase();
      let sheetData = null;

      if (["xlsx", "xls", "csv", "tsv"].includes(ext)) {
        try {
          sheetData = await parseExcel(file);
        } catch (err) {
          log.push({ file: file.name, type: "error", info: err.message, color: "#dc2626" });
          continue;
        }
      }

      const type = detectFileType(file, sheetData);

      switch (type) {
        case "ci": {
          try {
            const { names, sh, wb } = sheetData;
            let sheetName = names[0];
            for (const n of names) {
              const l = n.toLowerCase();
              if (l.includes("ci") || l.includes("invoice") || l.includes("commercial")) { sheetName = n; break; }
            }
            const rows = sh[sheetName];
            if (!rows?.length) throw new Error("No data in sheet");
            const headers = Object.keys(rows[0]);

            const cP = findColumn(headers, CI_COLUMNS.partNo);
            const cD = findColumn(headers, CI_COLUMNS.description);
            const cQ = findColumn(headers, CI_COLUMNS.quantity);
            const cPr = findColumn(headers, CI_COLUMNS.unitPrice);
            const cA = findColumn(headers, CI_COLUMNS.amount);
            const cNW = findColumn(headers, CI_COLUMNS.netWeight);
            const cGW = findColumn(headers, CI_COLUMNS.grossWeight);
            const cPO = findColumn(headers, CI_COLUMNS.poNumber);

            const parsed = rows
              .filter((r) => {
                const pv = cP ? String(r[cP] || "").trim() : "";
                const dv = cD ? String(r[cD] || "").trim() : "";
                return pv.length > 0 || dv.length > 2;
              })
              .map((r) => ({
                id: uid(),
                pn: cP ? String(r[cP] || "").trim() : "",
                desc: cD ? String(r[cD] || "").trim() : "",
                qty: cQ ? parseFloat(r[cQ]) || 1 : 1,
                up: cPr ? parseFloat(r[cPr]) || 0 : cA ? parseFloat(r[cA]) || 0 : 0,
                nw: cNW ? parseFloat(r[cNW]) || 0 : 0,
                gw: cGW ? parseFloat(r[cGW]) || 0 : 0,
                po: cPO ? String(r[cPO] || "").trim() : "",
                hs: "",
                th: "",
                duty: 0,
                org: hdr.origin || "CN",
                ok: false,
              }))
              .filter((i) => i.pn || i.desc);

            if (!parsed.length) throw new Error("No items found — check column headers");
            setItems(parsed);

            if (wb) {
              const meta = extractHeaderMetadata(file, wb);
              if (Object.keys(meta).length > 0) {
                setHdr((prev) => {
                  const updated = { ...prev };
                  if (meta.invNo && !prev.invNo) updated.invNo = meta.invNo;
                  if (meta.invDate && !prev.invDate) updated.invDate = meta.invDate;
                  if (meta.consignee && !prev.consignee) updated.consignee = meta.consignee;
                  if (meta.blNo && !prev.blNo) updated.blNo = meta.blNo;
                  if (meta.vessel && !prev.vessel) updated.vessel = meta.vessel;
                  if (meta.currency && !prev.currency) updated.currency = meta.currency;
                  if (meta.shipper && !prev.shipper) updated.shipper = meta.shipper;
                  if (meta.origin && !prev.origin) updated.origin = meta.origin;
                  if (meta.packages && !prev.pkgs) updated.pkgs = meta.packages;
                  return updated;
                });
              }
            }

            newDocs.ci = { name: file.name, items: parsed.length, sheet: sheetName };
            log.push({ file: file.name, type: "ci", info: `${parsed.length} items extracted`, color: "#2563eb" });
          } catch (e) {
            log.push({ file: file.name, type: "error", info: e.message, color: "#dc2626" });
          }
          break;
        }
        case "master": {
          try {
            const { names, sh } = sheetData;
            const rows = sh[names[0]];
            if (!rows?.length) throw new Error("No data");
            const headers = Object.keys(rows[0]);

            const cP = findColumn(headers, MASTER_COLUMNS.partNo);
            const cH = findColumn(headers, MASTER_COLUMNS.hsCode);
            const cT = findColumn(headers, MASTER_COLUMNS.thaiDesc);
            const cD = findColumn(headers, MASTER_COLUMNS.dutyRate);
            const cO = findColumn(headers, MASTER_COLUMNS.origin);

            if (!cP || !cH) throw new Error("Need Part# + HS columns");
            const entries = {};
            let count = 0;
            rows.forEach((r) => {
              const p = String(r[cP] || "").trim();
              const h = String(r[cH] || "").trim();
              if (p && h) {
                entries[p] = {
                  hs: h,
                  th: cT ? String(r[cT] || "").trim() : "",
                  duty: cD ? parseFloat(r[cD]) || 0 : 0,
                  org: cO ? String(r[cO] || "CN").trim() : "CN",
                };
                count++;
              }
            });
            setMd((prev) => ({ ...prev, ...entries }));
            newDocs.master = { name: file.name, entries: count };
            log.push({ file: file.name, type: "master", info: `${count} HS code mappings`, color: "#7c3aed" });
          } catch (e) {
            log.push({ file: file.name, type: "error", info: e.message, color: "#dc2626" });
          }
          break;
        }
        case "bl": {
          if (ext === "pdf") {
            try {
              const blMeta = await extractBLMetadata(file);
              const fields = Object.keys(blMeta).filter((k) => blMeta[k]);
              newDocs.bl = { name: file.name, fields: fields.length };
              if (fields.length > 0) {
                setHdr((prev) => {
                  const updated = { ...prev };
                  if (blMeta.blNo && !prev.blNo) updated.blNo = blMeta.blNo;
                  if (blMeta.vessel && !prev.vessel) updated.vessel = blMeta.vessel;
                  if (blMeta.voyage && !prev.voyage) updated.voyage = blMeta.voyage;
                  if (blMeta.pol && !prev.pol) updated.pol = blMeta.pol;
                  if (blMeta.pod && !prev.pod) updated.pod = blMeta.pod;
                  if (blMeta.eta && !prev.eta) updated.eta = blMeta.eta;
                  if (blMeta.origin && !prev.origin) updated.origin = blMeta.origin;
                  if (blMeta.shipper && !prev.shipper) updated.shipper = blMeta.shipper;
                  if (blMeta.consignee && !prev.consignee) updated.consignee = blMeta.consignee;
                  if (blMeta.taxId && !prev.taxId) updated.taxId = blMeta.taxId;
                  if (blMeta.packages && !prev.pkgs) updated.pkgs = blMeta.packages;
                  if (blMeta.pkgUnit) updated.pkgUnit = blMeta.pkgUnit;
                  return updated;
                });
                log.push({ file: file.name, type: "bl", info: `B/L parsed — ${fields.length} fields extracted`, color: "#c6952e" });
              } else {
                log.push({ file: file.name, type: "bl", info: "Bill of Lading detected (no fields extracted)", color: "#c6952e" });
              }
            } catch (e) {
              newDocs.bl = { name: file.name };
              log.push({ file: file.name, type: "bl", info: `Bill of Lading detected (PDF parse: ${e.message})`, color: "#c6952e" });
            }
          } else {
            newDocs.bl = { name: file.name };
            log.push({ file: file.name, type: "bl", info: "Bill of Lading detected", color: "#c6952e" });
          }
          break;
        }
        case "freight":
          newDocs.freight = { name: file.name };
          log.push({ file: file.name, type: "freight", info: "Freight invoice detected", color: "#15803d" });
          break;
        case "drkw":
          newDocs.drkw = { name: file.name };
          log.push({ file: file.name, type: "drkw", info: "Previous declaration detected", color: "#be185d" });
          break;
        default:
          newDocs.other = [...(newDocs.other || []), { name: file.name }];
          log.push({ file: file.name, type: "unknown", info: "Could not auto-detect type", color: "#8a8aa0" });
      }
    }

    setDocs(newDocs);
    setUploadLog((prev) => [...prev, ...log]);
    uploading.current = false;
    msg(`Processed ${fileList.length} file${fileList.length > 1 ? "s" : ""}`);
  };

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer?.files || []);
      if (files.length) processFiles(files);
    },
    [docs, md, hdr]
  );

  const handleInput = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length) processFiles(files);
  };

  const clearAll = () => {
    setDocs({ ci: null, bl: null, master: null, freight: null, drkw: null, other: [] });
    setUploadLog([]);
    setItems([]);
    setMd({});
    msg("All cleared");
  };

  const docStatuses = DOC_STATUS_CONFIG.map((cfg) => ({
    ...cfg,
    data: docs[cfg.key],
    detail: cfg.key === "ci" && docs.ci
      ? `${docs.ci.items} items from ${docs.ci.name}`
      : cfg.key === "master" && docs.master
        ? `${docs.master.entries} entries from ${docs.master.name}`
        : cfg.key === "bl" && docs.bl
          ? docs.bl.fields ? `${docs.bl.fields} fields extracted from ${docs.bl.name}` : docs.bl.name
          : docs[cfg.key]?.name || null,
  }));

  const missingRequired = docStatuses.filter((d) => d.required && !d.data);

  return (
    <div style={{ animation: "fadeIn .3s ease" }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 6px", color: "#1a2a5e" }}>Upload Shipment Documents</h2>
      <p style={{ fontSize: 13, color: "#5a5a7a", margin: "0 0 20px" }}>
        Drop all your files at once — LogiAI auto-detects what each document is
      </p>

      {/* Drop zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          border: "2px dashed #c6952e",
          borderRadius: 12,
          padding: "50px 24px",
          textAlign: "center",
          cursor: "pointer",
          background: "#faf8f3",
          transition: "all 0.2s",
          marginBottom: 24,
        }}
      >
        <input ref={inputRef} type="file" multiple accept=".xlsx,.xls,.csv,.pdf" onChange={handleInput} style={{ display: "none" }} />
        <div style={{ color: "#c6952e", marginBottom: 10 }}>{Icons.upload({ sz: 44 })}</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#1a2a5e" }}>Drop all shipment files here</div>
        <div style={{ fontSize: 13, color: "#5a5a7a", marginTop: 8 }}>
          Commercial Invoice (.xlsx) · Bill of Lading (.pdf) · Master Data (.xlsx) · Freight Invoice (.pdf)
        </div>
        <div style={{ fontSize: 12, color: "#8a8aa0", marginTop: 6 }}>
          Select multiple files at once — LogiAI identifies each document automatically
        </div>
      </div>

      {/* Document checklist */}
      <div style={{ ...s.card, marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#1a2a5e", marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>Document Checklist</span>
          {uploadLog.length > 0 && (
            <button onClick={clearAll} style={{ ...s.btnGhost, padding: "4px 10px", fontSize: 11 }}>
              {Icons.trash({ sz: 12 })} Clear All
            </button>
          )}
        </div>
        <div style={{ display: "grid", gap: 8 }}>
          {docStatuses.map((doc) => {
            const done = !!doc.data;
            const missing = doc.required && !done;
            return (
              <div
                key={doc.key}
                style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 8,
                  background: done ? "#f0fdf4" : missing ? "#fef2f2" : "#f8f8fc",
                  border: `1px solid ${done ? "#bbf7d0" : missing ? "#fecaca" : "#e8e7ed"}`,
                }}
              >
                <div
                  style={{
                    width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    background: done ? "#dcfce7" : missing ? "#fee2e2" : "#f0eff5",
                  }}
                >
                  {done ? Icons.check({ sz: 16, c: "#15803d" }) : missing ? Icons.alert({ sz: 16, c: "#dc2626" }) : doc.icon({ sz: 16, c: "#8a8aa0" })}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: done ? "#15803d" : missing ? "#dc2626" : "#5a5a7a" }}>
                    {doc.label}
                    <span style={{ fontSize: 10, color: missing ? "#dc2626" : "#8a8aa0", marginLeft: 6 }}>
                      {doc.required ? "REQUIRED" : "OPTIONAL"}
                    </span>
                  </div>
                  {doc.detail && <div style={{ fontSize: 11, color: "#15803d", marginTop: 2 }}>{doc.detail}</div>}
                  {missing && <div style={{ fontSize: 11, color: "#dc2626", marginTop: 2 }}>Not uploaded yet</div>}
                </div>
                {done && <span style={{ fontSize: 11, color: "#15803d", fontWeight: 600 }}>Loaded</span>}
              </div>
            );
          })}
        </div>
        {missingRequired.length > 0 && (
          <div style={{ marginTop: 12, padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, fontSize: 12, color: "#dc2626", display: "flex", alignItems: "center", gap: 8 }}>
            {Icons.alert({ sz: 16, c: "#dc2626" })} Missing {missingRequired.length} required document{missingRequired.length > 1 ? "s" : ""}:{" "}
            <b>{missingRequired.map((d) => d.label).join(", ")}</b>
          </div>
        )}
        {missingRequired.length === 0 && docs.ci && (
          <div style={{ marginTop: 12, padding: "10px 14px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, fontSize: 12, color: "#15803d", display: "flex", alignItems: "center", gap: 8 }}>
            {Icons.check({ sz: 16, c: "#15803d" })} All required documents uploaded — ready to proceed!
          </div>
        )}
        {!docs.master && docs.ci && (
          <div style={{ marginTop: 8, padding: "10px 14px", background: "#faf5ff", border: "1px solid #e9d5ff", borderRadius: 8, fontSize: 12, color: "#7c3aed", display: "flex", alignItems: "center", gap: 8 }}>
            {Icons.db({ sz: 14, c: "#7c3aed" })}
            <span>No master data? You can enter HS codes manually on the Items page, or search the <b>Thai Customs E-Tariff</b> database.</span>
          </div>
        )}
      </div>

      {/* Processing log */}
      {uploadLog.length > 0 && (
        <div style={s.card}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#1a2a5e", marginBottom: 10 }}>Processing Log</div>
          {uploadLog.map((entry, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: i < uploadLog.length - 1 ? "1px solid #e8e7ed" : "none" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: entry.color, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: "#1a1a2e", fontWeight: 600 }}>{entry.file}</span>
              <span style={{ fontSize: 11, color: entry.color }}>{entry.info}</span>
              <span style={{ fontSize: 10, color: "#8a8aa0", textTransform: "uppercase", marginLeft: "auto" }}>{entry.type}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end", gap: 10 }}>
        {items.length > 0 ? (
          <button onClick={() => { if (onStatusAdvance) onStatusAdvance(); setPg("shipment"); }} style={s.btnPrimary}>
            Continue to Shipment {Icons.zap({ sz: 15 })}
          </button>
        ) : (
          <button onClick={() => setPg("shipment")} style={s.btnGhost}>
            Skip — enter manually
          </button>
        )}
      </div>
    </div>
  );
}
