import { useState, useEffect } from "react";
import Icons from "./Icons";
import HsInsight from "./intelligence/HsInsight";
import { s } from "../constants/styles";
import { fmt, uid } from "../utils/format";
import { loadTariff, lookupHS, isTariffLoaded, getTariffCount } from "../utils/hsLookup";
import HsLookupPanel from "./HsLookupPanel";

const HS_HISTORY_KEY = "logiai_hs_history";

const cellInput = {
  background: "#ffffff",
  border: "1px solid #d4d2e0",
  borderRadius: 4,
  color: "#1a1a2e",
  padding: "4px 7px",
  fontSize: 11,
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "'Sarabun', sans-serif",
};

function loadHsHistory() {
  try {
    return JSON.parse(localStorage.getItem(HS_HISTORY_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveHsHistory(items, customer) {
  const history = loadHsHistory();
  const now = new Date().toISOString().split("T")[0];
  let saved = 0;
  items.forEach((item) => {
    if (item.pn && item.hs) {
      history[item.pn] = {
        hs: item.hs,
        th: item.th || "",
        duty: item.duty || 0,
        org: item.org || "",
        customer: customer || "",
        date: now,
      };
      saved++;
    }
  });
  localStorage.setItem(HS_HISTORY_KEY, JSON.stringify(history));
  return saved;
}

export default function ItemsPage({ items, setItems, md, hdr, autoMatch, ciFile, setPg, hsInsight, onStatusAdvance }) {
  const mdArr = Object.entries(md);
  const missingHs = items.filter((i) => !i.hs && i.pn).length;
  const unmatched = items.filter((i) => !i.ok && i.pn).length;
  const totalInv = items.reduce((sum, i) => sum + i.qty * i.up, 0);
  const [hsHistory] = useState(() => loadHsHistory());
  const historyCount = Object.keys(hsHistory).length;

  const [showLookup, setShowLookup] = useState(false);
  const [tariffReady, setTariffReady] = useState(isTariffLoaded());
  const [applyTarget, setApplyTarget] = useState(null);

  useEffect(() => {
    if (!isTariffLoaded()) {
      loadTariff().then(() => setTariffReady(true));
    }
  }, []);

  const matchFromHistory = () => {
    let matched = 0, unmatched = 0;
    setItems((prev) =>
      prev.map((item) => {
        const fromMd = md[item.pn];
        const fromHist = hsHistory[item.pn];
        const data = fromMd || fromHist;
        if (data) {
          matched++;
          return {
            ...item,
            hs: data.hs || item.hs,
            th: data.th || item.th,
            duty: data.duty || item.duty,
            org: data.org || item.org,
            ok: true,
          };
        }
        if (item.pn) unmatched++;
        return { ...item, ok: false };
      })
    );
    return { matched, unmatched };
  };

  const handleAutoMatch = () => {
    if (mdArr.length > 0) {
      autoMatch();
    } else {
      const { matched, unmatched } = matchFromHistory();
    }
  };

  const handleToDeclare = () => {
    saveHsHistory(items, hdr.customer || hdr.consignee || "");
    if (onStatusAdvance) onStatusAdvance();
    setPg("declaration");
  };

  const addItem = () =>
    setItems((p) => [...p, { id: uid(), pn: "", desc: "", th: "", qty: 1, up: 0, nw: 0, gw: 0, po: "", hs: "", duty: 0, exciseRate: 0, adRate: 0, cvdRate: 0, qtyUnit: "PCE", statSuffix: "", org: hdr.origin || "CN", ok: false }]);

  const setField = (id, key, value) =>
    setItems((p) => p.map((i) => (i.id === id ? { ...i, [key]: value } : i)));

  const handleHsChange = (id, value) => {
    setField(id, "hs", value);
    const clean = value.replace(/[\s.\-]/g, "");
    if (clean.length >= 8 && tariffReady) {
      const match = lookupHS(clean);
      if (match && !match.partial) {
        setItems((p) => p.map((i) =>
          i.id === id
            ? { ...i, hs: value, duty: match.duty, th: match.th || i.th, ok: true }
            : i
        ));
      }
    }
  };

  const handleLookupApply = (entry) => {
    const targetId = applyTarget || items.find((i) => i.pn && !i.hs)?.id || items[0]?.id;
    if (!targetId) return;
    setItems((p) => p.map((i) =>
      i.id === targetId
        ? { ...i, hs: entry.hs, duty: entry.duty, th: entry.th || i.th, ok: true }
        : i
    ));
    setApplyTarget(null);
  };

  const deleteItem = (id) => setItems((p) => p.filter((i) => i.id !== id));
  const duplicateItem = (id) =>
    setItems((p) => { const src = p.find((i) => i.id === id); return src ? [...p, { ...src, id: uid() }] : p; });

  const handlePaste = (e) => {
    const text = e.clipboardData?.getData("text");
    if (!text || !text.includes("\t")) return;
    e.preventDefault();
    const newItems = text.trim().split("\n").map((row) => row.split("\t")).map((cols) => ({
      id: uid(),
      pn: (cols[0] || "").trim(),
      desc: (cols[1] || "").trim(),
      qty: parseFloat(cols[2]) || 1,
      up: parseFloat(cols[3]) || 0,
      nw: parseFloat(cols[4]) || 0,
      gw: parseFloat(cols[5]) || 0,
      po: (cols[6] || "").trim(),
      hs: "", th: "", duty: 0, exciseRate: 0, adRate: 0, cvdRate: 0, qtyUnit: "PCE", statSuffix: "", org: hdr.origin || "CN", ok: false,
    })).filter((i) => i.pn);
    if (newItems.length) setItems((p) => [...p, ...newItems]);
  };

  const thStyle = {
    padding: "9px 6px", textAlign: "left", color: "#ffffff", fontWeight: 600,
    fontSize: 10, textTransform: "uppercase", borderBottom: "1px solid #1a2a5e",
    position: "sticky", top: 0, background: "#1a2a5e", zIndex: 2, whiteSpace: "nowrap",
  };

  const hasmaster = mdArr.length > 0;
  const hasHistory = historyCount > 0;
  const tariffCount = tariffReady ? getTariffCount() : 0;
  const dataSourceLabel = hasmaster
    ? `${mdArr.length.toLocaleString()} master entries`
    : hasHistory
      ? `${historyCount.toLocaleString()} from history`
      : "No HS data — use Tariff Lookup or enter manually";

  return (
    <div style={{ animation: "fadeIn .3s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: "#1a2a5e" }}>Line Items ({items.length})</h2>
          <p style={{ fontSize: 12, color: "#5a5a7a", margin: "3px 0 0" }}>
            {ciFile?.st === "done" ? `From ${ciFile.name}` : "Upload CI, paste from Excel, or add manually"}
            {" · "}
            <span style={{ color: hasmaster ? "#7c3aed" : hasHistory ? "#2563eb" : "#b45309" }}>{dataSourceLabel}</span>
            {tariffReady && (
              <span style={{ color: "#8a8aa0" }}> · {Icons.book({ sz: 10, c: "#8a8aa0" })} {tariffCount.toLocaleString()} tariff codes</span>
            )}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setShowLookup(!showLookup)}
            style={{
              ...s.btnGhost,
              color: showLookup ? "#c6952e" : "#8B6914",
              borderColor: showLookup ? "#c6952e" : "#d4d2e0",
              background: showLookup ? "#faf8f3" : undefined,
              fontSize: 11,
              fontWeight: 600,
              padding: "6px 12px",
            }}
          >
            {Icons.book({ sz: 14 })} Tariff Lookup
          </button>
          {(hasmaster || hasHistory) && items.length > 0 && (
            <button onClick={handleAutoMatch} style={{ ...s.btnGhost, color: "#2563eb", borderColor: "#bfdbfe" }}>
              {Icons.search({ sz: 14 })} Auto-Match
              {missingHs > 0 && (
                <span style={{ fontSize: 10, background: "#fef2f2", color: "#dc2626", padding: "1px 6px", borderRadius: 10, border: "1px solid #fecaca" }}>
                  {missingHs}
                </span>
              )}
            </button>
          )}
          <button onClick={addItem} style={s.btnPrimary}>{Icons.plus({ sz: 15 })} Add Item</button>
        </div>
      </div>

      {showLookup && (
        <HsLookupPanel
          onApply={handleLookupApply}
          onClose={() => setShowLookup(false)}
        />
      )}

      {items.length > 0 && !hasmaster && !showLookup && (
        <div style={{
          marginBottom: 12, padding: "10px 16px", borderRadius: 8, fontSize: 12,
          background: hasHistory ? "#eff6ff" : "#fffbeb",
          border: `1px solid ${hasHistory ? "#bfdbfe" : "#fde68a"}`,
          color: hasHistory ? "#2563eb" : "#b45309",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          {hasHistory ? Icons.db({ sz: 14, c: "#2563eb" }) : Icons.alert({ sz: 14, c: "#b45309" })}
          <span>
            {hasHistory
              ? `No master data uploaded. Using ${historyCount} HS codes from previous declarations. Click Auto-Match to apply.`
              : <>No master data or HS history found. Click <b>Tariff Lookup</b> to search Thai Customs tariff codes, or enter HS codes manually. Type 8 digits for auto-validation.</>
            }
          </span>
        </div>
      )}

      {items.length === 0 ? (
        <div onPaste={handlePaste} tabIndex={0} style={{ ...s.card, textAlign: "center", padding: "50px 24px", border: "2px dashed #c6952e", cursor: "text" }}>
          <div style={{ color: "#c6952e", marginBottom: 10 }}>{Icons.upload({ sz: 32 })}</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#1a2a5e" }}>No items yet</div>
          <div style={{ fontSize: 12, color: "#5a5a7a", marginTop: 6 }}>
            Go to <b>Upload</b> to import from Excel, or paste tab-separated data here
          </div>
        </div>
      ) : (
        <div style={{ ...s.card, padding: 0, overflow: "hidden", borderTop: "3px solid #1a2a5e" }} onPaste={handlePaste} tabIndex={0}>
          <div style={{ overflowX: "auto", maxHeight: 480 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead>
                <tr>
                  {["#", "Part#", "Description", "HS Code", "Stat", "Thai", "Origin", "Qty", "Unit", "Unit$", "Duty%", "AD%", "CVD%", "Excise%", "NW", "GW", "PO", ""].map((h, i) => (
                    <th key={i} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((it, idx) => {
                  const histHint = !it.hs && hsHistory[it.pn] ? hsHistory[it.pn].hs : null;
                  const tariffMatch = it.hs && it.hs.replace(/[\s.\-]/g, "").length >= 8 && tariffReady
                    ? lookupHS(it.hs.replace(/[\s.\-]/g, ""))
                    : null;

                  return (
                    <tr key={it.id} style={{ borderBottom: "1px solid #e8e7ed", background: idx % 2 === 0 ? "#ffffff" : "#fafafe" }}>
                      <td style={{ padding: "5px 6px", color: "#8a8aa0", fontSize: 10 }}>{idx + 1}</td>
                      <td style={{ padding: 3 }}>
                        <input value={it.pn} onChange={(e) => setField(it.id, "pn", e.target.value)}
                          style={{ ...cellInput, width: 105, fontFamily: "monospace", color: it.ok ? "#15803d" : "#1a1a2e" }} />
                      </td>
                      <td style={{ padding: 3 }}>
                        <input value={it.desc} onChange={(e) => setField(it.id, "desc", e.target.value)} style={{ ...cellInput, width: 160 }} />
                      </td>
                      <td style={{ padding: 3, position: "relative" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                          <input value={it.hs} onChange={(e) => handleHsChange(it.id, e.target.value)}
                            placeholder={histHint || ""}
                            style={{
                              ...cellInput, width: 85, fontFamily: "monospace",
                              color: it.hs ? "#c6952e" : "#8a8aa0",
                              borderColor: !it.hs && it.pn ? "#fecaca" : "#d4d2e0",
                            }} />
                          {it.hs && it.hs.replace(/[\s.\-]/g, "").length >= 8 && tariffReady && (
                            <span title={tariffMatch ? `${tariffMatch.en} — ${tariffMatch.duty}%` : "HS code not found in tariff database"}>
                              {tariffMatch
                                ? Icons.check({ sz: 11, c: "#15803d" })
                                : Icons.alert({ sz: 11, c: "#b45309" })
                              }
                            </span>
                          )}
                          {!it.hs && it.pn && (
                            <button
                              onClick={() => { setApplyTarget(it.id); setShowLookup(true); }}
                              title="Search tariff for this item"
                              style={{
                                background: "none", border: "none",
                                color: "#8a8aa0", cursor: "pointer", padding: 1,
                              }}
                            >
                              {Icons.search({ sz: 10 })}
                            </button>
                          )}
                        </div>
                        {hsInsight && it.hs && it.hs.replace(/[\s.\-]/g, "").length >= 4 && (
                          <HsInsight hsCode={it.hs} getInsight={hsInsight} />
                        )}
                        {histHint && !it.hs && (
                          <button
                            onClick={() => {
                              const h = hsHistory[it.pn];
                              setField(it.id, "hs", h.hs);
                              if (h.th) setField(it.id, "th", h.th);
                              if (h.duty) setField(it.id, "duty", h.duty);
                              if (h.org) setField(it.id, "org", h.org);
                            }}
                            title={`Apply ${histHint} from history`}
                            style={{
                              position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)",
                              background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 3,
                              color: "#2563eb", cursor: "pointer", fontSize: 9, padding: "1px 4px", fontWeight: 700,
                            }}
                          >
                            ↩
                          </button>
                        )}
                      </td>
                      <td style={{ padding: 3 }}>
                        <input value={it.statSuffix || ""} onChange={(e) => setField(it.id, "statSuffix", e.target.value)}
                          style={{ ...cellInput, width: 36, textAlign: "center", fontFamily: "monospace", fontSize: 10 }} maxLength={3} placeholder="000" />
                      </td>
                      <td style={{ padding: 3 }}>
                        <input value={it.th} onChange={(e) => setField(it.id, "th", e.target.value)} style={{ ...cellInput, width: 100, color: "#7c3aed" }} />
                      </td>
                      <td style={{ padding: 3 }}>
                        <input value={it.org || hdr.origin || ""} onChange={(e) => setField(it.id, "org", e.target.value)}
                          style={{ ...cellInput, width: 30, textAlign: "center", textTransform: "uppercase", fontSize: 10, color: "#5a5a7a" }} maxLength={2} />
                      </td>
                      <td style={{ padding: 3 }}>
                        <input type="number" value={it.qty} onChange={(e) => setField(it.id, "qty", parseFloat(e.target.value) || 0)}
                          style={{ ...cellInput, width: 45, textAlign: "right" }} />
                      </td>
                      <td style={{ padding: 3 }}>
                        <select value={it.qtyUnit || "PCE"} onChange={(e) => setField(it.id, "qtyUnit", e.target.value)}
                          style={{ ...cellInput, width: 52, fontSize: 9, padding: "4px 2px" }}>
                          {["PCE","KGM","SET","LTR","MTR","PRS","UNT","TNE"].map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </td>
                      <td style={{ padding: 3 }}>
                        <input type="number" value={it.up} onChange={(e) => setField(it.id, "up", parseFloat(e.target.value) || 0)}
                          style={{ ...cellInput, width: 65, textAlign: "right" }} step="0.01" />
                      </td>
                      <td style={{ padding: 3 }}>
                        <input type="number" value={it.duty} onChange={(e) => setField(it.id, "duty", parseFloat(e.target.value) || 0)}
                          style={{ ...cellInput, width: 45, textAlign: "right", color: it.duty > 0 ? "#c6952e" : "#15803d" }} />
                      </td>
                      <td style={{ padding: 3 }}>
                        <input type="number" value={it.adRate || 0} onChange={(e) => setField(it.id, "adRate", parseFloat(e.target.value) || 0)}
                          style={{ ...cellInput, width: 40, textAlign: "right", color: (it.adRate || 0) > 0 ? "#dc2626" : "#8a8aa0" }} />
                      </td>
                      <td style={{ padding: 3 }}>
                        <input type="number" value={it.cvdRate || 0} onChange={(e) => setField(it.id, "cvdRate", parseFloat(e.target.value) || 0)}
                          style={{ ...cellInput, width: 40, textAlign: "right", color: (it.cvdRate || 0) > 0 ? "#dc2626" : "#8a8aa0" }} />
                      </td>
                      <td style={{ padding: 3 }}>
                        <input type="number" value={it.exciseRate || 0} onChange={(e) => setField(it.id, "exciseRate", parseFloat(e.target.value) || 0)}
                          style={{ ...cellInput, width: 45, textAlign: "right", color: (it.exciseRate || 0) > 0 ? "#dc2626" : "#8a8aa0" }} />
                      </td>
                      <td style={{ padding: 3 }}>
                        <input type="number" value={it.nw} onChange={(e) => setField(it.id, "nw", parseFloat(e.target.value) || 0)}
                          style={{ ...cellInput, width: 55, textAlign: "right" }} step="0.01" />
                      </td>
                      <td style={{ padding: 3 }}>
                        <input type="number" value={it.gw} onChange={(e) => setField(it.id, "gw", parseFloat(e.target.value) || 0)}
                          style={{ ...cellInput, width: 55, textAlign: "right" }} step="0.01" />
                      </td>
                      <td style={{ padding: 3 }}>
                        <input value={it.po} onChange={(e) => setField(it.id, "po", e.target.value)} style={{ ...cellInput, width: 80, fontFamily: "monospace" }} />
                      </td>
                      <td style={{ padding: 3, whiteSpace: "nowrap" }}>
                        <button onClick={() => duplicateItem(it.id)} style={{ background: "none", border: "none", color: "#8a8aa0", cursor: "pointer", padding: 2 }}>
                          {Icons.copy({ sz: 12 })}
                        </button>
                        <button onClick={() => deleteItem(it.id)} style={{ background: "none", border: "none", color: "#8a8aa0", cursor: "pointer", padding: 2 }}>
                          {Icons.trash({ sz: 12 })}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ padding: "10px 14px", borderTop: "1px solid #e8e7ed", display: "flex", gap: 20, fontSize: 12, alignItems: "center", background: "#fafafe" }}>
            <span style={{ color: "#5a5a7a" }}>Total: <b style={{ color: "#c6952e" }}>${fmt(totalInv)}</b></span>
            {missingHs > 0 && (
              <span style={{ color: "#dc2626" }}>{Icons.alert({ sz: 13, c: "#dc2626" })} {missingHs} need HS</span>
            )}
            {tariffReady && tariffCount > 0 && (
              <span style={{ color: "#8a8aa0", fontSize: 10 }}>{Icons.book({ sz: 10, c: "#8a8aa0" })} Tariff DB active</span>
            )}
            <div style={{ flex: 1 }} />
            <button onClick={addItem} style={{ ...s.btnGhost, padding: "4px 10px", fontSize: 11 }}>{Icons.plus({ sz: 12 })} Row</button>
          </div>
        </div>
      )}

      <div style={{ marginTop: 20, display: "flex", justifyContent: "space-between" }}>
        <button onClick={() => setPg("shipment")} style={s.btnGhost}>← Shipment</button>
        <button onClick={handleToDeclare} style={s.btnPrimary}>Generate Declaration {Icons.zap({ sz: 15 })}</button>
      </div>
    </div>
  );
}
