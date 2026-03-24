import { useState } from "react";
import Icons from "./Icons";
import { Field } from "./FormControls";
import { s } from "../constants/styles";

const thStyle = {
  padding: "9px 12px", textAlign: "left", color: "#ffffff", fontWeight: 600,
  fontSize: 10, textTransform: "uppercase", borderBottom: "1px solid #1a2a5e",
  position: "sticky", top: 0, background: "#1a2a5e",
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
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: "#1a2a5e" }}>Master Data ({mdArr.length})</h2>
          <p style={{ fontSize: 12, color: "#5a5a7a", margin: "3px 0 0" }}>
            Part# → HS Code mapping. Upload on Upload page or add manually.
          </p>
        </div>
        <button onClick={() => setShowAdd(true)} style={s.btnPrimary}>{Icons.plus({ sz: 15 })} Add</button>
      </div>

      {showAdd && (
        <div style={{ ...s.card, marginBottom: 14, borderTop: "3px solid #15803d" }}>
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
          {Icons.db({ sz: 32, c: "#d4d2e0" })}
          <div style={{ fontSize: 15, fontWeight: 600, color: "#5a5a7a", marginTop: 10 }}>No master data</div>
          <div style={{ fontSize: 12, color: "#8a8aa0", marginTop: 4 }}>Upload Excel on Upload page or add manually</div>
        </div>
      ) : (
        <div style={{ ...s.card, padding: 0, overflow: "hidden", borderTop: "3px solid #1a2a5e" }}>
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
                {filtered.map(([pn, data], idx) => (
                  <tr key={pn} style={{ borderBottom: "1px solid #e8e7ed", background: idx % 2 === 0 ? "#ffffff" : "#fafafe" }}>
                    <td style={{ padding: "7px 12px", fontFamily: "monospace", color: "#2563eb" }}>{pn}</td>
                    <td style={{ padding: "7px 12px", fontFamily: "monospace", color: "#c6952e", fontWeight: 600 }}>{data.hs}</td>
                    <td style={{ padding: "7px 12px", color: "#7c3aed" }}>{data.th}</td>
                    <td style={{ padding: "7px 12px", fontWeight: 600, color: data.duty > 0 ? "#c6952e" : "#15803d" }}>{data.duty}%</td>
                    <td style={{ padding: "7px 12px", color: "#5a5a7a" }}>{data.org}</td>
                    <td style={{ padding: "7px 12px" }}>
                      <button onClick={() => deleteEntry(pn)} style={{ background: "none", border: "none", color: "#8a8aa0", cursor: "pointer" }}>
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
