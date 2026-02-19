import Icons from "./Icons";
import { s } from "../constants/styles";
import { fmt, fmtThb } from "../utils/format";
import { calculateDeclaration } from "../utils/calculations";

const thStyle = {
  padding: "8px 6px", color: "#64748b", fontWeight: 600, fontSize: 10,
  textTransform: "uppercase", borderBottom: "1px solid rgba(255,255,255,0.06)",
  position: "sticky", top: 0, background: "rgba(15,23,42,0.98)", whiteSpace: "nowrap",
};

export default function DeclarationPage({ items, hdr, setPg }) {
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

  return (
    <div style={{ animation: "fadeIn .3s ease" }}>
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

      {/* Savings banner */}
      {privilege.code !== "NONE" && totals.savings > 0 && (
        <div style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.08), rgba(6,95,70,0.12))", border: "1px solid rgba(52,211,153,0.2)", borderRadius: 10, padding: "10px 18px", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
          {Icons.shield({ sz: 16, c: "#34d399" })}
          <span style={{ fontSize: 13, fontWeight: 600, color: "#6ee7b7" }}>
            {privilege.label} — saving {fmtThb(totals.savings)}
          </span>
        </div>
      )}

      {/* Detail table */}
      <div style={{ ...s.card, padding: 0, overflow: "hidden", marginBottom: 20 }}>
        <div style={{ overflowX: "auto", maxHeight: 380 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
            <thead>
              <tr>
                {["#", "Part", "HS", "Desc", "Thai", "Qty", `Amt(${hdr.currency})`, "CIF(THB)", "Duty%", "Duty", "VAT", "Tax"].map((h, i) => (
                  <th key={i} style={{ ...thStyle, textAlign: i >= 5 ? "right" : "left" }}>{h}</th>
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
                  <td style={{ padding: "5px 6px", textAlign: "right" }}>{it.qty}</td>
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
                <td style={{ padding: "8px 6px", textAlign: "right", fontWeight: 700, color: "#fbbf24" }}>${fmt(totals.invoiceValue)}</td>
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

      {/* Official form preview */}
      <div style={{ background: "#fefefe", borderRadius: 10, padding: 24, color: "#1a1a2e", boxShadow: "0 8px 40px rgba(0,0,0,0.4)" }}>
        <div style={{ textAlign: "center", borderBottom: "3px solid #c6952e", paddingBottom: 12, marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#8B6914" }}>ใบขนสินค้าขาเข้า กศก 99/1</div>
          <div style={{ fontSize: 10, color: "#999", marginTop: 2 }}>Import Declaration — Form Kor Sor Kor 99/1</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              ["Importer", hdr.consignee || "—"],
              ["Tax ID", hdr.taxId || "—"],
              ["B/L", hdr.blNo || "—"],
              ["Vessel", `${hdr.vessel || "—"} / ${hdr.eta || "—"}`],
              ["Route", `${hdr.pol || "—"} → ${hdr.pod || "—"}`],
              ["Origin", hdr.origin || "—"],
              ["Invoice", hdr.invNo || "—"],
              ["FX Rate", `1 ${hdr.currency} = ${fx} THB`],
              ["Packages", `${hdr.pkgs} ${hdr.pkgUnit || "CARTON"}`],
              ["Broker", hdr.broker || "—"],
            ].map(([key, val], i) => (
              <div key={i}>
                <div style={{ fontSize: 8, color: "#8B6914", textTransform: "uppercase", fontWeight: 700 }}>{key}</div>
                <div style={{ fontSize: 11, color: "#333", fontWeight: 500, borderBottom: "1px solid #eee", paddingBottom: 2 }}>{val}</div>
              </div>
            ))}
          </div>
          <div style={{ border: "2px solid #8B6914", borderRadius: 8, padding: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#8B6914", marginBottom: 8, textAlign: "center" }}>ภาษีอากรที่ต้องชำระ</div>
            {[
              ["อากรขาเข้า", fmtThb(totals.duty)],
              ["ภาษีสรรพสามิต", "฿0.00"],
              ["ภาษีมูลค่าเพิ่ม", fmtThb(totals.vat)],
            ].map(([label, val], i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 11 }}>
                <span style={{ color: "#555" }}>{label}</span>
                <span style={{ fontWeight: 600 }}>{val}</span>
              </div>
            ))}
            <div style={{ borderTop: "2px solid #8B6914", paddingTop: 6, marginTop: 6, display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontWeight: 700, color: "#8B6914", fontSize: 11 }}>รวมทั้งสิ้น</span>
              <span style={{ fontWeight: 800, fontSize: 15, color: totals.tax > 0 ? "#dc2626" : "#059669" }}>{fmtThb(totals.tax)}</span>
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
      </div>
    </div>
  );
}
