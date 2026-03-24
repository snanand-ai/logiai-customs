import Icons from "./Icons";
import PrivilegeInsight from "./intelligence/PrivilegeInsight";
import { s } from "../constants/styles";
import { fmt, fmtThb } from "../utils/format";
import { calculateDeclaration } from "../utils/calculations";
import { DECLARATION_TYPES } from "../constants/privileges";
import * as XLSX from "xlsx";

const thStyle = {
  padding: "8px 6px", color: "#ffffff", fontWeight: 600, fontSize: 10,
  textTransform: "uppercase", borderBottom: "1px solid #1a2a5e",
  position: "sticky", top: 0, background: "#1a2a5e", whiteSpace: "nowrap",
};

const FV = ({ label, value, wide }) => (
  <div style={wide ? { gridColumn: "1/-1" } : {}}>
    <div style={{ fontSize: 8, color: "#8B6914", textTransform: "uppercase", fontWeight: 700 }}>{label}</div>
    <div style={{ fontSize: 11, color: "#1a1a2e", fontWeight: 500, borderBottom: "1px solid #e8e7ed", paddingBottom: 2, minHeight: 16 }}>
      {value || "—"}
    </div>
  </div>
);

export default function DeclarationPage({ items, hdr, setPg, shipmentId, recordFiling, loadPrivilegeSavings, onStatusAdvance }) {
  if (items.length === 0) {
    return (
      <div style={{ animation: "fadeIn .3s ease" }}>
        <div style={{ ...s.card, textAlign: "center", padding: 60 }}>
          {Icons.file({ sz: 32, c: "#d4d2e0" })}
          <div style={{ fontSize: 15, fontWeight: 600, color: "#5a5a7a", marginTop: 10 }}>No items to declare</div>
          <button onClick={() => setPg("upload")} style={{ ...s.btnPrimary, marginTop: 16 }}>Upload Documents</button>
        </div>
      </div>
    );
  }

  const { details, totals, privilege, declType } = calculateDeclaration(items, hdr);
  const fx = parseFloat(hdr.fx) || 1;
  const totalNW = items.reduce((s, i) => s + (parseFloat(i.nw) || 0), 0);
  const totalGW = items.reduce((s, i) => s + (parseFloat(i.gw) || 0), 0);
  const declInfo = DECLARATION_TYPES.find((d) => d.code === declType) || DECLARATION_TYPES[0];
  const isExport = declType === "EXPORT";
  const isEpz = declType === "EPZ";
  const valuationLabel = isExport ? "FOB" : "CIF";

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();

    const headerData = [
      [`LogiAI Customs — ${declInfo.label}`],
      [],
      ["TRANSPORT"],
      ["B/L Number", hdr.blNo || ""],
      ["Vessel", hdr.vessel || ""],
      ["Voyage", hdr.voyage || ""],
      ["Container", hdr.ctr || ""],
      ["Port of Loading", hdr.pol || ""],
      ["Port of Discharge", hdr.pod || ""],
      ["Arrival Date", hdr.eta || ""],
      ["Origin Country", hdr.origin || ""],
      [],
      ["PARTIES"],
      ["Shipper", hdr.shipper || ""],
      ["Consignee (Importer)", hdr.consignee || ""],
      ["Tax ID", hdr.taxId || ""],
      ["Customs Broker", hdr.broker || ""],
      [],
      ["INVOICE"],
      ["Invoice Number", hdr.invNo || ""],
      ["Invoice Date", hdr.invDate || ""],
      ["Incoterm", hdr.incoterm || "CIF"],
      ["Currency", hdr.currency || "USD"],
      ["FX Rate (1 " + (hdr.currency || "USD") + " = THB)", fx],
      ["Packages", `${hdr.pkgs || 0} ${hdr.pkgUnit || "CARTON"}`],
      ["Freight (" + (hdr.currency || "USD") + ")", parseFloat(hdr.freight) || 0],
      ["Insurance (" + (hdr.currency || "USD") + ")", parseFloat(hdr.insurance) || 0],
      [],
      ["PRIVILEGE"],
      ["Tax Privilege", privilege.label],
      ["Permit / License", hdr.permit || "N/A"],
      [],
      ["TAX SUMMARY"],
      [`Total ${valuationLabel} (THB)`, totals.cif],
      [isExport ? "Export Duty อากรขาออก (THB)" : "Import Duty อากรขาเข้า (THB)", totals.duty],
      ["Excise Tax ภาษีสรรพสามิต (THB)", totals.excise],
      ["Interior Tax ภาษีเพื่อมหาดไทย (THB)", totals.interior],
      ["VAT ภาษีมูลค่าเพิ่ม (THB)", totals.vat],
      ["Total Tax รวมทั้งสิ้น (THB)", totals.tax],
      [],
      ["Total Gross Weight (kg)", totalGW],
      ["Total Net Weight (kg)", totalNW],
      ["Total Invoice Value (" + (hdr.currency || "USD") + ")", totals.invoiceValue],
    ];
    if (privilege.code !== "NONE" && totals.savings > 0) {
      headerData.push(["Savings from " + privilege.label + " (THB)", totals.savings]);
    }

    const wsHeader = XLSX.utils.aoa_to_sheet(headerData);
    wsHeader["!cols"] = [{ wch: 35 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, wsHeader, "Declaration");

    const itemHeaders = [
      "#", "Part Number", "Description", "Thai Description", "HS Code",
      "Origin", "Qty", "Unit Price (" + (hdr.currency || "USD") + ")",
      "Amount (" + (hdr.currency || "USD") + ")", "NW (kg)", "GW (kg)",
      "Freight Alloc", "Insurance Alloc", "CIF (" + (hdr.currency || "USD") + ")",
      "CIF (THB)", "Duty Rate %", "Applied Rate %", "Duty (THB)",
      "VAT (THB)", "Total Tax (THB)", "PO Number",
    ];

    const itemRows = details.map((it) => [
      it.lineNo, it.pn, it.desc, it.th || "", it.hs || "",
      it.org || hdr.origin || "", it.qty, it.up,
      it.amount, it.nw || 0, it.gw || 0,
      it.freightAlloc, it.insuranceAlloc, it.cifInCurrency,
      it.cifTHB, it.normalDutyRate, it.appliedDutyRate, it.dutyAmount,
      it.vatAmount, it.totalTax, it.po || "",
    ]);

    itemRows.push([
      "", "TOTAL", "", "", "",
      "", items.reduce((s, i) => s + i.qty, 0), "",
      totals.invoiceValue, totalNW, totalGW,
      "", "", "", totals.cif, "", "",
      totals.duty, totals.vat, totals.tax, "",
    ]);

    const wsItems = XLSX.utils.aoa_to_sheet([itemHeaders, ...itemRows]);
    wsItems["!cols"] = [
      { wch: 4 }, { wch: 16 }, { wch: 28 }, { wch: 28 }, { wch: 12 },
      { wch: 8 }, { wch: 6 }, { wch: 12 },
      { wch: 14 }, { wch: 10 }, { wch: 10 },
      { wch: 12 }, { wch: 12 }, { wch: 14 },
      { wch: 14 }, { wch: 10 }, { wch: 10 }, { wch: 14 },
      { wch: 14 }, { wch: 14 }, { wch: 14 },
    ];
    XLSX.utils.book_append_sheet(wb, wsItems, "Line Items");

    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Declaration_${hdr.invNo || "draft"}_${new Date().toISOString().split("T")[0]}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);

    if (recordFiling) {
      recordFiling({ hdr, items }, { details, totals, privilege }).catch(
        (err) => console.warn("[Declaration] Intelligence record failed:", err)
      );
    }
    if (onStatusAdvance) onStatusAdvance();
  };

  return (
    <div style={{ animation: "fadeIn .3s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: "#1a2a5e" }}>
            {isExport ? "Export" : isEpz ? "EPZ Transfer" : "Import"} Declaration
          </h2>
          <p style={{ fontSize: 12, color: "#5a5a7a", margin: "3px 0 0" }}>
            {declInfo.formNo} · {items.length} items · {hdr.consignee || "—"}
          </p>
        </div>
        <button onClick={exportExcel} style={{ ...s.btnPrimary, display: "flex", alignItems: "center", gap: 6 }}>
          {Icons.grid({ sz: 15 })} Download Excel
        </button>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: totals.excise > 0 ? "repeat(7,1fr)" : "repeat(5,1fr)", gap: 10, marginBottom: 16 }}>
        {[
          ["Items", items.length, "#1a2a5e"],
          [valuationLabel, fmtThb(totals.cif), "#2563eb"],
          ["Duty", fmtThb(totals.duty), totals.duty > 0 ? "#dc2626" : "#15803d"],
          ...(totals.excise > 0 ? [
            ["Excise", fmtThb(totals.excise), "#dc2626"],
            ["Interior", fmtThb(totals.interior), "#dc2626"],
          ] : []),
          ["VAT", fmtThb(totals.vat), totals.vat > 0 ? "#c6952e" : "#15803d"],
          ["Total Tax", fmtThb(totals.tax), totals.tax > 0 ? "#dc2626" : "#15803d"],
        ].map(([label, value, color], i) => (
          <div key={i} style={{ background: "#ffffff", border: "1px solid #d4d2e0", borderTop: "3px solid " + color, borderRadius: 8, padding: "12px 14px", boxShadow: "0 1px 4px rgba(26,42,94,0.04)" }}>
            <div style={{ fontSize: 10, color: "#8B6914", textTransform: "uppercase", fontWeight: 700 }}>{label}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color, marginTop: 3 }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Weight + Invoice summary row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 16 }}>
        {[
          ["Net Weight", `${fmt(totalNW, 2)} kg`, "#5a5a7a"],
          ["Gross Weight", `${fmt(totalGW, 2)} kg`, "#5a5a7a"],
          ["Invoice Value", `${hdr.currency} ${fmt(totals.invoiceValue)}`, "#c6952e"],
          ["FX Rate", `1 ${hdr.currency} = ${fx} THB`, "#2563eb"],
        ].map(([label, value, color], i) => (
          <div key={i} style={{ background: "#ffffff", border: "1px solid #d4d2e0", borderRadius: 8, padding: "8px 12px" }}>
            <div style={{ fontSize: 9, color: "#8B6914", textTransform: "uppercase", fontWeight: 700 }}>{label}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color, marginTop: 2 }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Savings banner */}
      {privilege.code !== "NONE" && totals.savings > 0 && (
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderLeft: "4px solid #15803d", borderRadius: 8, padding: "10px 18px", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
          {Icons.shield({ sz: 16, c: "#15803d" })}
          <span style={{ fontSize: 13, fontWeight: 600, color: "#15803d" }}>
            {privilege.label} — saving {fmtThb(totals.savings)}
          </span>
        </div>
      )}

      {loadPrivilegeSavings && (
        <div style={{ marginBottom: 14 }}>
          <PrivilegeInsight loadSavings={loadPrivilegeSavings} />
        </div>
      )}

      {/* Detail table */}
      <div style={{ ...s.card, padding: 0, overflow: "hidden", borderTop: "3px solid #1a2a5e", marginBottom: 20 }}>
        <div style={{ overflowX: "auto", maxHeight: 380 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
            <thead>
              <tr>
                {["#", "Part", "HS", "Desc", "Thai", "Origin", "Qty", "NW", "GW", `Amt(${hdr.currency})`, `${valuationLabel}(THB)`, "Duty%", "Duty", "Excise", "Interior", "VAT", "Tax"].map((h, i) => (
                  <th key={i} style={{ ...thStyle, textAlign: i >= 6 ? "right" : "left" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {details.map((it, idx) => (
                <tr key={it.id} style={{ borderBottom: "1px solid #e8e7ed", background: idx % 2 === 0 ? "#ffffff" : "#fafafe" }}>
                  <td style={{ padding: "5px 6px", color: "#8a8aa0" }}>{it.lineNo}</td>
                  <td style={{ padding: "5px 6px", fontFamily: "monospace", color: "#2563eb", fontSize: 10 }}>{it.pn}</td>
                  <td style={{ padding: "5px 6px" }}>
                    {it.hs ? (
                      <span style={{ background: it.normalDutyRate > 0 ? "#fffbeb" : "#f0fdf4", color: it.normalDutyRate > 0 ? "#c6952e" : "#15803d", padding: "2px 5px", borderRadius: 3, fontSize: 10, fontFamily: "monospace", fontWeight: 600, border: `1px solid ${it.normalDutyRate > 0 ? "#fde68a" : "#bbf7d0"}` }}>
                        {it.hs}
                      </span>
                    ) : <span style={{ color: "#dc2626", fontSize: 10 }}>—</span>}
                  </td>
                  <td style={{ padding: "5px 6px", maxWidth: 120, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "#1a1a2e" }}>{it.desc}</td>
                  <td style={{ padding: "5px 6px", maxWidth: 100, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "#7c3aed" }}>{it.th || "—"}</td>
                  <td style={{ padding: "5px 6px", fontSize: 10, color: "#5a5a7a" }}>{it.org || hdr.origin || "—"}</td>
                  <td style={{ padding: "5px 6px", textAlign: "right" }}>{it.qty}</td>
                  <td style={{ padding: "5px 6px", textAlign: "right", fontSize: 10, color: "#5a5a7a" }}>{it.nw ? fmt(it.nw, 2) : "—"}</td>
                  <td style={{ padding: "5px 6px", textAlign: "right", fontSize: 10, color: "#5a5a7a" }}>{it.gw ? fmt(it.gw, 2) : "—"}</td>
                  <td style={{ padding: "5px 6px", textAlign: "right" }}>{fmt(it.amount)}</td>
                  <td style={{ padding: "5px 6px", textAlign: "right", fontWeight: 600 }}>{fmt(it.cifTHB, 0)}</td>
                  <td style={{ padding: "5px 6px", textAlign: "right", color: it.appliedDutyRate > 0 ? "#dc2626" : "#15803d", fontWeight: 600 }}>{it.appliedDutyRate}%</td>
                  <td style={{ padding: "5px 6px", textAlign: "right", color: it.dutyAmount > 0 ? "#dc2626" : "#15803d" }}>{fmt(it.dutyAmount, 0)}</td>
                  <td style={{ padding: "5px 6px", textAlign: "right", color: it.exciseAmount > 0 ? "#dc2626" : "#8a8aa0" }}>{fmt(it.exciseAmount, 0)}</td>
                  <td style={{ padding: "5px 6px", textAlign: "right", color: it.interiorAmount > 0 ? "#dc2626" : "#8a8aa0" }}>{fmt(it.interiorAmount, 0)}</td>
                  <td style={{ padding: "5px 6px", textAlign: "right" }}>{fmt(it.vatAmount, 0)}</td>
                  <td style={{ padding: "5px 6px", textAlign: "right", fontWeight: 700, color: it.totalTax > 0 ? "#dc2626" : "#15803d" }}>{fmt(it.totalTax, 0)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: "2px solid #c6952e" }}>
                <td colSpan={6} style={{ padding: "8px 6px", fontWeight: 700, fontSize: 12, color: "#1a2a5e" }}>TOTALS</td>
                <td style={{ padding: "8px 6px", textAlign: "right", fontWeight: 600, color: "#5a5a7a" }}>{items.reduce((s, i) => s + i.qty, 0)}</td>
                <td style={{ padding: "8px 6px", textAlign: "right", fontSize: 10, color: "#5a5a7a" }}>{fmt(totalNW, 2)}</td>
                <td style={{ padding: "8px 6px", textAlign: "right", fontSize: 10, color: "#5a5a7a" }}>{fmt(totalGW, 2)}</td>
                <td style={{ padding: "8px 6px", textAlign: "right", fontWeight: 700, color: "#c6952e" }}>{fmt(totals.invoiceValue)}</td>
                <td style={{ padding: "8px 6px", textAlign: "right", fontWeight: 700, color: "#2563eb" }}>{fmt(totals.cif, 0)}</td>
                <td></td>
                <td style={{ padding: "8px 6px", textAlign: "right", fontWeight: 700 }}>{fmt(totals.duty, 0)}</td>
                <td style={{ padding: "8px 6px", textAlign: "right", fontWeight: 700 }}>{fmt(totals.excise, 0)}</td>
                <td style={{ padding: "8px 6px", textAlign: "right", fontWeight: 700 }}>{fmt(totals.interior, 0)}</td>
                <td style={{ padding: "8px 6px", textAlign: "right", fontWeight: 700 }}>{fmt(totals.vat, 0)}</td>
                <td style={{ padding: "8px 6px", textAlign: "right", fontWeight: 800, fontSize: 13, color: totals.tax > 0 ? "#dc2626" : "#15803d" }}>{fmtThb(totals.tax)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Official form preview */}
      <div style={{ background: "#faf8f3", borderRadius: 8, padding: 24, color: "#1a1a2e", boxShadow: "0 4px 20px rgba(26,42,94,0.12)", border: "1px solid #d4d2e0" }}>
        <div style={{ textAlign: "center", borderBottom: "3px solid #c6952e", paddingBottom: 12, marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#8B6914" }}>
            {isExport ? "ใบขนสินค้าขาออก" : isEpz ? "ใบขนโอนย้ายเข้าเขตปลอดอากร" : "ใบขนสินค้าขาเข้า"} {declInfo.formNo}
          </div>
          <div style={{ fontSize: 10, color: "#5a5a7a", marginTop: 2 }}>{declInfo.label}</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#c6952e", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: "1px solid #e8e7ed", paddingBottom: 3 }}>
              Parties
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
              <FV label="Importer / Consignee ผู้นำเข้า" value={hdr.consignee} />
              <FV label="Tax ID เลขประจำตัวผู้เสียภาษี" value={hdr.taxId} />
              <FV label="Shipper / Exporter ผู้ส่งออก" value={hdr.shipper} />
              <FV label="Customs Broker ตัวแทนออกของ" value={hdr.broker} />
            </div>

            <div style={{ fontSize: 9, fontWeight: 700, color: "#c6952e", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: "1px solid #e8e7ed", paddingBottom: 3 }}>
              Transport
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
              <FV label="B/L Number เลขที่ใบตราส่ง" value={hdr.blNo} />
              <FV label="Vessel ชื่อเรือ" value={hdr.vessel} />
              <FV label="Voyage เที่ยวเรือ" value={hdr.voyage} />
              <FV label="Container หมายเลขตู้" value={hdr.ctr} />
              <FV label="Port of Loading ท่าต้นทาง" value={hdr.pol} />
              <FV label="Port of Discharge ท่าปลายทาง" value={hdr.pod} />
              <FV label="Arrival Date วันที่เรือถึง" value={hdr.eta} />
              <FV label="Origin Country ประเทศกำเนิด" value={hdr.origin} />
              <FV label="Packages หีบห่อ" value={`${hdr.pkgs || 0} ${hdr.pkgUnit || "CARTON"}`} />
            </div>

            <div style={{ fontSize: 9, fontWeight: 700, color: "#c6952e", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: "1px solid #e8e7ed", paddingBottom: 3 }}>
              Invoice & Valuation
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
              <FV label="Invoice No เลขที่ใบกำกับ" value={hdr.invNo} />
              <FV label="Invoice Date วันที่ออก" value={hdr.invDate} />
              <FV label="Incoterm เงื่อนไข" value={hdr.incoterm} />
              <FV label="Currency สกุลเงิน" value={hdr.currency} />
              <FV label="FX Rate อัตราแลกเปลี่ยน" value={`1 ${hdr.currency} = ${fx} THB`} />
              <FV label="Invoice Value มูลค่าสินค้า" value={`${hdr.currency} ${fmt(totals.invoiceValue)}`} />
              <FV label="Freight ค่าระวาง" value={`${hdr.currency} ${fmt(parseFloat(hdr.freight) || 0)}`} />
              <FV label="Insurance ค่าประกันภัย" value={hdr.insurance ? `${hdr.currency} ${fmt(parseFloat(hdr.insurance))}` : "Auto 0.3%"} />
              <FV label={`Total ${valuationLabel} ราคา ${valuationLabel}`} value={fmtThb(totals.cif)} />
            </div>

            <div style={{ fontSize: 9, fontWeight: 700, color: "#c6952e", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: "1px solid #e8e7ed", paddingBottom: 3 }}>
              Weight & Quantity
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
              <FV label="Total Items รายการ" value={`${items.length} items`} />
              <FV label="Total Qty จำนวน" value={items.reduce((s, i) => s + i.qty, 0)} />
              <FV label="Net Weight น.น.สุทธิ (kg)" value={fmt(totalNW, 2)} />
              <FV label="Gross Weight น.น.รวม (kg)" value={fmt(totalGW, 2)} />
            </div>

            {privilege.code !== "NONE" && (
              <>
                <div style={{ fontSize: 9, fontWeight: 700, color: "#c6952e", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: "1px solid #e8e7ed", paddingBottom: 3 }}>
                  Tax Privilege สิทธิพิเศษ
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
                  <FV label="Privilege Type ประเภทสิทธิ" value={privilege.label} />
                  <FV label="Permit / License เลขที่อนุญาต" value={hdr.permit || "—"} />
                </div>
              </>
            )}
          </div>

          {/* Right: Tax summary box */}
          <div>
            <div style={{ border: "2px solid #8B6914", borderRadius: 8, padding: 14, position: "sticky", top: 10, background: "#ffffff" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#8B6914", marginBottom: 10, textAlign: "center" }}>
                ภาษีอากรที่ต้องชำระ
              </div>
              {[
                [isExport ? "อากรขาออก Export Duty" : "อากรขาเข้า Import Duty", fmtThb(totals.duty)],
                ["ภาษีสรรพสามิต Excise", fmtThb(totals.excise)],
                ["ภาษีเพื่อมหาดไทย Interior", fmtThb(totals.interior)],
                ["ภาษีมูลค่าเพิ่ม VAT 7%", fmtThb(totals.vat)],
              ].map(([label, val], i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 11, alignItems: "baseline" }}>
                  <span style={{ color: "#5a5a7a", fontSize: 10 }}>{label}</span>
                  <span style={{ fontWeight: 600, fontFamily: "monospace", color: "#1a1a2e" }}>{val}</span>
                </div>
              ))}
              <div style={{ borderTop: "2px solid #8B6914", paddingTop: 8, marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontWeight: 700, color: "#8B6914", fontSize: 11 }}>รวมทั้งสิ้น Total</span>
                <span style={{ fontWeight: 800, fontSize: 16, color: totals.tax > 0 ? "#dc2626" : "#15803d" }}>{fmtThb(totals.tax)}</span>
              </div>

              {privilege.code !== "NONE" && totals.savings > 0 && (
                <div style={{ marginTop: 10, padding: "6px 8px", background: "#f0fdf4", borderRadius: 6, border: "1px solid #bbf7d0" }}>
                  <div style={{ fontSize: 9, color: "#15803d", fontWeight: 600, textTransform: "uppercase" }}>Savings from {privilege.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#15803d" }}>{fmtThb(totals.savings)}</div>
                </div>
              )}

              <div style={{ marginTop: 12, borderTop: "1px solid #e8e7ed", paddingTop: 8 }}>
                <div style={{ fontSize: 9, color: "#8B6914", fontWeight: 600, marginBottom: 4, textTransform: "uppercase" }}>Quick Reference</div>
                {[
                  ["CIF (THB)", fmtThb(totals.cif)],
                  ["Invoice", `${hdr.currency} ${fmt(totals.invoiceValue)}`],
                  ["Freight", `${hdr.currency} ${fmt(parseFloat(hdr.freight) || 0)}`],
                  ["Insurance", hdr.insurance ? `${hdr.currency} ${fmt(parseFloat(hdr.insurance))}` : "0.3% auto"],
                  ["Privilege", privilege.code === "NONE" ? "None" : privilege.label],
                ].map(([k, v], i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 10, marginBottom: 2 }}>
                    <span style={{ color: "#8a8aa0" }}>{k}</span>
                    <span style={{ color: "#1a1a2e", fontWeight: 500 }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 16, borderTop: "1px solid #d4d2e0", paddingTop: 10, display: "flex", justifyContent: "space-between", fontSize: 10, color: "#8a8aa0" }}>
          <span>LogiAI Customs · {items.length} items · {new Date().toLocaleDateString()}</span>
          <span style={{ color: "#15803d", fontWeight: 600 }}>Ready for e-Customs</span>
        </div>
      </div>

      <div style={{ marginTop: 20, display: "flex", justifyContent: "space-between" }}>
        <button onClick={() => setPg("items")} style={s.btnGhost}>← Edit Items</button>
        <button onClick={exportExcel} style={{ ...s.btnPrimary, display: "flex", alignItems: "center", gap: 6 }}>
          {Icons.grid({ sz: 15 })} Download Excel
        </button>
      </div>
    </div>
  );
}
