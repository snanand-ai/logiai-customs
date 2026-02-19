import Icons from "./Icons";
import PrivilegeInsight from "./intelligence/PrivilegeInsight";
import { s } from "../constants/styles";
import { fmt, fmtThb } from "../utils/format";
import { calculateDeclaration } from "../utils/calculations";
import * as XLSX from "xlsx";

const thStyle = {
  padding: "8px 6px", color: "#64748b", fontWeight: 600, fontSize: 10,
  textTransform: "uppercase", borderBottom: "1px solid rgba(255,255,255,0.06)",
  position: "sticky", top: 0, background: "rgba(15,23,42,0.98)", whiteSpace: "nowrap",
};

// Form field label + value helper for the official form
const FV = ({ label, value, wide }) => (
  <div style={wide ? { gridColumn: "1/-1" } : {}}>
    <div style={{ fontSize: 8, color: "#8B6914", textTransform: "uppercase", fontWeight: 700 }}>{label}</div>
    <div style={{ fontSize: 11, color: "#333", fontWeight: 500, borderBottom: "1px solid #eee", paddingBottom: 2, minHeight: 16 }}>
      {value || "—"}
    </div>
  </div>
);

export default function DeclarationPage({ items, hdr, setPg, shipmentId, recordFiling, loadPrivilegeSavings, onStatusAdvance }) {
  if (items.length === 0) {
    return (
      <div style={{ animation: "fadeIn .3s ease" }}>
        <div style={{ ...s.card, textAlign: "center", padding: 60 }}>
          {Icons.file({ sz: 32, c: "#475569" })}
          <div style={{ fontSize: 15, fontWeight: 600, color: "#94a3b8", marginTop: 10 }}>No items to declare</div>
          <button onClick={() => setPg("upload")} style={{ ...s.btnPrimary, marginTop: 16 }}>Upload Documents</button>
        </div>
      </div>
    );
  }

  const { details, totals, privilege } = calculateDeclaration(items, hdr);
  const fx = parseFloat(hdr.fx) || 1;
  const totalNW = items.reduce((s, i) => s + (parseFloat(i.nw) || 0), 0);
  const totalGW = items.reduce((s, i) => s + (parseFloat(i.gw) || 0), 0);

  // ---------- EXCEL EXPORT ----------
  const exportExcel = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Declaration Header
    const headerData = [
      ["LogiAI Customs — Import Declaration กศก 99/1"],
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
      ["Total CIF (THB)", totals.cif],
      ["Import Duty อากรขาเข้า (THB)", totals.duty],
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
    // Set column widths
    wsHeader["!cols"] = [{ wch: 35 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, wsHeader, "Declaration");

    // Sheet 2: Line Items Detail
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

    // Totals row
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

    // Generate & download
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Declaration_${hdr.invNo || "draft"}_${new Date().toISOString().split("T")[0]}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);

    // Record filing in intelligence layer
    if (recordFiling) {
      recordFiling({ hdr, items }, { details, totals, privilege }).catch(
        (err) => console.warn("[Declaration] Intelligence record failed:", err)
      );
    }
    if (onStatusAdvance) onStatusAdvance();
  };

  return (
    <div style={{ animation: "fadeIn .3s ease" }}>
      {/* Header row with title + export */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Import Declaration</h2>
          <p style={{ fontSize: 12, color: "#64748b", margin: "3px 0 0" }}>
            กศก 99/1 · {items.length} items · {hdr.consignee || "—"}
          </p>
        </div>
        <button onClick={exportExcel} style={{ ...s.btnPrimary, display: "flex", alignItems: "center", gap: 6 }}>
          {Icons.grid({ sz: 15 })} Download Excel
        </button>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10, marginBottom: 16 }}>
        {[
          ["Items", items.length, "#34d399"],
          ["CIF", fmtThb(totals.cif), "#60a5fa"],
          ["Duty", fmtThb(totals.duty), totals.duty > 0 ? "#f87171" : "#34d399"],
          ["VAT", fmtThb(totals.vat), totals.vat > 0 ? "#fbbf24" : "#34d399"],
          ["Total Tax", fmtThb(totals.tax), totals.tax > 0 ? "#f87171" : "#34d399"],
        ].map(([label, value, color], i) => (
          <div key={i} style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase" }}>{label}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color, marginTop: 3 }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Weight + Invoice summary row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 16 }}>
        {[
          ["Net Weight", `${fmt(totalNW, 2)} kg`, "#94a3b8"],
          ["Gross Weight", `${fmt(totalGW, 2)} kg`, "#94a3b8"],
          ["Invoice Value", `${hdr.currency} ${fmt(totals.invoiceValue)}`, "#fbbf24"],
          ["FX Rate", `1 ${hdr.currency} = ${fx} THB`, "#60a5fa"],
        ].map(([label, value, color], i) => (
          <div key={i} style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 8, padding: "8px 12px" }}>
            <div style={{ fontSize: 9, color: "#475569", textTransform: "uppercase" }}>{label}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color, marginTop: 2 }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Savings banner */}
      {privilege.code !== "NONE" && totals.savings > 0 && (
        <div style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.08), rgba(6,95,70,0.12))", border: "1px solid rgba(52,211,153,0.2)", borderRadius: 10, padding: "10px 18px", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
          {Icons.shield({ sz: 16, c: "#34d399" })}
          <span style={{ fontSize: 13, fontWeight: 600, color: "#6ee7b7" }}>
            {privilege.label} — saving {fmtThb(totals.savings)}
          </span>
        </div>
      )}

      {/* Intelligence: Privilege savings from past declarations */}
      {loadPrivilegeSavings && (
        <div style={{ marginBottom: 14 }}>
          <PrivilegeInsight loadSavings={loadPrivilegeSavings} />
        </div>
      )}

      {/* Detail table — expanded with NW, GW, Origin */}
      <div style={{ ...s.card, padding: 0, overflow: "hidden", marginBottom: 20 }}>
        <div style={{ overflowX: "auto", maxHeight: 380 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
            <thead>
              <tr>
                {["#", "Part", "HS", "Desc", "Thai", "Origin", "Qty", "NW", "GW", `Amt(${hdr.currency})`, "CIF(THB)", "Duty%", "Duty", "VAT", "Tax"].map((h, i) => (
                  <th key={i} style={{ ...thStyle, textAlign: i >= 6 ? "right" : "left" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {details.map((it) => (
                <tr key={it.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                  <td style={{ padding: "5px 6px", color: "#475569" }}>{it.lineNo}</td>
                  <td style={{ padding: "5px 6px", fontFamily: "monospace", color: "#60a5fa", fontSize: 10 }}>{it.pn}</td>
                  <td style={{ padding: "5px 6px" }}>
                    {it.hs ? (
                      <span style={{ background: it.normalDutyRate > 0 ? "rgba(251,191,36,0.12)" : "rgba(52,211,153,0.08)", color: it.normalDutyRate > 0 ? "#fbbf24" : "#34d399", padding: "2px 5px", borderRadius: 3, fontSize: 10, fontFamily: "monospace", fontWeight: 600 }}>
                        {it.hs}
                      </span>
                    ) : <span style={{ color: "#f87171", fontSize: 10 }}>—</span>}
                  </td>
                  <td style={{ padding: "5px 6px", maxWidth: 120, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.desc}</td>
                  <td style={{ padding: "5px 6px", maxWidth: 100, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "#a78bfa" }}>{it.th || "—"}</td>
                  <td style={{ padding: "5px 6px", fontSize: 10, color: "#94a3b8" }}>{it.org || hdr.origin || "—"}</td>
                  <td style={{ padding: "5px 6px", textAlign: "right" }}>{it.qty}</td>
                  <td style={{ padding: "5px 6px", textAlign: "right", fontSize: 10, color: "#94a3b8" }}>{it.nw ? fmt(it.nw, 2) : "—"}</td>
                  <td style={{ padding: "5px 6px", textAlign: "right", fontSize: 10, color: "#94a3b8" }}>{it.gw ? fmt(it.gw, 2) : "—"}</td>
                  <td style={{ padding: "5px 6px", textAlign: "right" }}>{fmt(it.amount)}</td>
                  <td style={{ padding: "5px 6px", textAlign: "right", fontWeight: 600 }}>{fmt(it.cifTHB, 0)}</td>
                  <td style={{ padding: "5px 6px", textAlign: "right", color: it.appliedDutyRate > 0 ? "#f87171" : "#34d399", fontWeight: 600 }}>{it.appliedDutyRate}%</td>
                  <td style={{ padding: "5px 6px", textAlign: "right", color: it.dutyAmount > 0 ? "#f87171" : "#34d399" }}>{fmt(it.dutyAmount, 0)}</td>
                  <td style={{ padding: "5px 6px", textAlign: "right" }}>{fmt(it.vatAmount, 0)}</td>
                  <td style={{ padding: "5px 6px", textAlign: "right", fontWeight: 700, color: it.totalTax > 0 ? "#f87171" : "#34d399" }}>{fmt(it.totalTax, 0)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: "2px solid rgba(52,211,153,0.15)" }}>
                <td colSpan={6} style={{ padding: "8px 6px", fontWeight: 700, fontSize: 12 }}>TOTALS</td>
                <td style={{ padding: "8px 6px", textAlign: "right", fontWeight: 600, color: "#94a3b8" }}>{items.reduce((s, i) => s + i.qty, 0)}</td>
                <td style={{ padding: "8px 6px", textAlign: "right", fontSize: 10, color: "#94a3b8" }}>{fmt(totalNW, 2)}</td>
                <td style={{ padding: "8px 6px", textAlign: "right", fontSize: 10, color: "#94a3b8" }}>{fmt(totalGW, 2)}</td>
                <td style={{ padding: "8px 6px", textAlign: "right", fontWeight: 700, color: "#fbbf24" }}>{fmt(totals.invoiceValue)}</td>
                <td style={{ padding: "8px 6px", textAlign: "right", fontWeight: 700, color: "#60a5fa" }}>{fmt(totals.cif, 0)}</td>
                <td></td>
                <td style={{ padding: "8px 6px", textAlign: "right", fontWeight: 700 }}>{fmt(totals.duty, 0)}</td>
                <td style={{ padding: "8px 6px", textAlign: "right", fontWeight: 700 }}>{fmt(totals.vat, 0)}</td>
                <td style={{ padding: "8px 6px", textAlign: "right", fontWeight: 800, fontSize: 13, color: totals.tax > 0 ? "#f87171" : "#34d399" }}>{fmtThb(totals.tax)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Official form preview — COMPLETE */}
      <div style={{ background: "#fefefe", borderRadius: 10, padding: 24, color: "#1a1a2e", boxShadow: "0 8px 40px rgba(0,0,0,0.4)" }}>
        <div style={{ textAlign: "center", borderBottom: "3px solid #c6952e", paddingBottom: 12, marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#8B6914" }}>ใบขนสินค้าขาเข้า กศก 99/1</div>
          <div style={{ fontSize: 10, color: "#999", marginTop: 2 }}>Import Declaration — Form Kor Sor Kor 99/1</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
          {/* Left: all form fields */}
          <div>
            {/* Parties */}
            <div style={{ fontSize: 9, fontWeight: 700, color: "#c6952e", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: "1px solid #eee", paddingBottom: 3 }}>
              Parties
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
              <FV label="Importer / Consignee ผู้นำเข้า" value={hdr.consignee} />
              <FV label="Tax ID เลขประจำตัวผู้เสียภาษี" value={hdr.taxId} />
              <FV label="Shipper / Exporter ผู้ส่งออก" value={hdr.shipper} />
              <FV label="Customs Broker ตัวแทนออกของ" value={hdr.broker} />
            </div>

            {/* Transport */}
            <div style={{ fontSize: 9, fontWeight: 700, color: "#c6952e", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: "1px solid #eee", paddingBottom: 3 }}>
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

            {/* Invoice */}
            <div style={{ fontSize: 9, fontWeight: 700, color: "#c6952e", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: "1px solid #eee", paddingBottom: 3 }}>
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
              <FV label="Total CIF ราคา CIF" value={fmtThb(totals.cif)} />
            </div>

            {/* Weights */}
            <div style={{ fontSize: 9, fontWeight: 700, color: "#c6952e", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: "1px solid #eee", paddingBottom: 3 }}>
              Weight & Quantity
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
              <FV label="Total Items รายการ" value={`${items.length} items`} />
              <FV label="Total Qty จำนวน" value={items.reduce((s, i) => s + i.qty, 0)} />
              <FV label="Net Weight น.น.สุทธิ (kg)" value={fmt(totalNW, 2)} />
              <FV label="Gross Weight น.น.รวม (kg)" value={fmt(totalGW, 2)} />
            </div>

            {/* Privilege */}
            {privilege.code !== "NONE" && (
              <>
                <div style={{ fontSize: 9, fontWeight: 700, color: "#c6952e", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: "1px solid #eee", paddingBottom: 3 }}>
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
            <div style={{ border: "2px solid #8B6914", borderRadius: 8, padding: 14, position: "sticky", top: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#8B6914", marginBottom: 10, textAlign: "center" }}>
                ภาษีอากรที่ต้องชำระ
              </div>
              {[
                ["อากรขาเข้า Import Duty", fmtThb(totals.duty)],
                ["ภาษีสรรพสามิต Excise", "฿0.00"],
                ["ภาษีมูลค่าเพิ่ม VAT 7%", fmtThb(totals.vat)],
              ].map(([label, val], i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 11, alignItems: "baseline" }}>
                  <span style={{ color: "#555", fontSize: 10 }}>{label}</span>
                  <span style={{ fontWeight: 600, fontFamily: "monospace" }}>{val}</span>
                </div>
              ))}
              <div style={{ borderTop: "2px solid #8B6914", paddingTop: 8, marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontWeight: 700, color: "#8B6914", fontSize: 11 }}>รวมทั้งสิ้น Total</span>
                <span style={{ fontWeight: 800, fontSize: 16, color: totals.tax > 0 ? "#dc2626" : "#059669" }}>{fmtThb(totals.tax)}</span>
              </div>

              {privilege.code !== "NONE" && totals.savings > 0 && (
                <div style={{ marginTop: 10, padding: "6px 8px", background: "#f0fdf4", borderRadius: 6, border: "1px solid #bbf7d0" }}>
                  <div style={{ fontSize: 9, color: "#15803d", fontWeight: 600, textTransform: "uppercase" }}>Savings from {privilege.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#15803d" }}>{fmtThb(totals.savings)}</div>
                </div>
              )}

              {/* Quick reference */}
              <div style={{ marginTop: 12, borderTop: "1px solid #eee", paddingTop: 8 }}>
                <div style={{ fontSize: 9, color: "#999", fontWeight: 600, marginBottom: 4, textTransform: "uppercase" }}>Quick Reference</div>
                {[
                  ["CIF (THB)", fmtThb(totals.cif)],
                  ["Invoice", `${hdr.currency} ${fmt(totals.invoiceValue)}`],
                  ["Freight", `${hdr.currency} ${fmt(parseFloat(hdr.freight) || 0)}`],
                  ["Insurance", hdr.insurance ? `${hdr.currency} ${fmt(parseFloat(hdr.insurance))}` : "0.3% auto"],
                  ["Privilege", privilege.code === "NONE" ? "None" : privilege.label],
                ].map(([k, v], i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 10, marginBottom: 2 }}>
                    <span style={{ color: "#888" }}>{k}</span>
                    <span style={{ color: "#333", fontWeight: 500 }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 16, borderTop: "1px solid #ddd", paddingTop: 10, display: "flex", justifyContent: "space-between", fontSize: 10, color: "#999" }}>
          <span>LogiAI Customs · {items.length} items · {new Date().toLocaleDateString()}</span>
          <span style={{ color: "#059669", fontWeight: 600 }}>Ready for e-Customs</span>
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
