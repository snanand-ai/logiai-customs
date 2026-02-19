import { useState } from "react";
import Icons from "./Icons";
import { Field } from "./FormControls";
import { s } from "../constants/styles";

const thStyle = {
  padding: "9px 12px", textAlign: "left", color: "#64748b", fontWeight: 600,
  fontSize: 10, textTransform: "uppercase", borderBottom: "1px solid rgba(255,255,255,0.06)",
  position: "sticky", top: 0, background: "rgba(15,23,42,0.98)",
};

export default function MasterDataPage({ md, setMd, msg }) {
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newEntry, setNewEntry] = useState({ pn: "", hs: "", th: "", duty: 0, org: "CN" });

  const mdArr = Object.entries(md);
  const filtered = search
    ? mdArr.filter(([key, val]) => key.includes(search) || val.hs.includes(search) || val.th.includes(search))
    : mdArr;

  const addEntry = () => {
    if (!newEntry.pn || !newEntry.hs) return msg("Part# and HS Code required", "error");
    setMd((prev) => ({
      ...prev,
      [newEntry.pn]: { hs: newEntry.hs, th: newEntry.th, duty: parseFloat(newEntry.duty) || 0, org: newEntry.org },
    }));
    setNewEntry({ pn: "", hs: "", th: "", duty: 0, org: "CN" });
    setShowAdd(false);
    msg("Added " + newEntry.pn);
  };

  const deleteEntry = (pn) =>
    setMd((prev) => { const next = { ...prev }; delete next[pn]; return next; });

  return (
    <div style={{ animation: "fadeIn .3s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Master Data ({mdArr.length})</h2>
          <p style={{ fontSize: 12, color: "#64748b", margin: "3px 0 0" }}>
            Part# → HS Code mapping. Upload on Upload page or add manually.
          </p>
        </div>
        <button onClick={() => setShowAdd(true)} style={s.btnPrimary}>{Icons.plus({ sz: 15 })} Add</button>
      </div>

      {showAdd && (
        <div style={{ ...s.card, marginBottom: 14, border: "1px solid rgba(52,211,153,0.2)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr 70px 70px auto auto", gap: 8, alignItems: "end" }}>
            <Field small label="Part#" value={newEntry.pn} onChange={(v) => setNewEntry((p) => ({ ...p, pn: v }))} />
            <Field small label="HS Code" value={newEntry.hs} onChange={(v) => setNewEntry((p) => ({ ...p, hs: v }))} />
            <Field small label="Thai Desc" value={newEntry.th} onChange={(v) => setNewEntry((p) => ({ ...p, th: v }))} />
            <Field small label="Duty%" value={newEntry.duty} onChange={(v) => setNewEntry((p) => ({ ...p, duty: v }))} type="number" />
            <Field small label="Origin" value={newEntry.org} onChange={(v) => setNewEntry((p) => ({ ...p, org: v }))} />
            <button onClick={addEntry} style={{ ...s.btnPrimary, padding: "6px 12px", fontSize: 12 }}>{Icons.check({ sz: 13 })}</button>
            <button onClick={() => setShowAdd(false)} style={{ ...s.btnGhost, padding: "6px 12px", fontSize: 12 }}>{Icons.x({ sz: 13 })}</button>
          </div>
        </div>
      )}

      {mdArr.length > 0 && (
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search part#, HS code, or Thai description..."
          style={{ ...s.input, maxWidth: 380, marginBottom: 12 }}
        />
      )}

      {mdArr.length === 0 ? (
        <div style={{ ...s.card, textAlign: "center", padding: 50 }}>
          {Icons.db({ sz: 32, c: "#475569" })}
          <div style={{ fontSize: 15, fontWeight: 600, color: "#94a3b8", marginTop: 10 }}>No master data</div>
          <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>Upload Excel on Upload page or add manually</div>
        </div>
      ) : (
        <div style={{ ...s.card, padding: 0, overflow: "hidden" }}>
          <div style={{ overflowY: "auto", maxHeight: 450 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr>
                  {["Part#", "HS Code", "Thai Desc", "Duty%", "Origin", ""].map((h, i) => (
                    <th key={i} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(([pn, data]) => (
                  <tr key={pn} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                    <td style={{ padding: "7px 12px", fontFamily: "monospace", color: "#60a5fa" }}>{pn}</td>
                    <td style={{ padding: "7px 12px", fontFamily: "monospace", color: "#fbbf24" }}>{data.hs}</td>
                    <td style={{ padding: "7px 12px", color: "#a78bfa" }}>{data.th}</td>
                    <td style={{ padding: "7px 12px", fontWeight: 600, color: data.duty > 0 ? "#fbbf24" : "#34d399" }}>{data.duty}%</td>
                    <td style={{ padding: "7px 12px" }}>{data.org}</td>
                    <td style={{ padding: "7px 12px" }}>
                      <button onClick={() => deleteEntry(pn)} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer" }}>
                        {Icons.trash({ sz: 13 })}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
