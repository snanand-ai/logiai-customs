import { useState, useEffect } from "react";
import Icons from "./Icons";
import HsInsight from "./intelligence/HsInsight";
import { s } from "../constants/styles";
import { fmt, uid } from "../utils/format";
import { loadTariff, lookupHS, isTariffLoaded, getTariffCount } from "../utils/hsLookup";
import HsLookupPanel from "./HsLookupPanel";

const HS_HISTORY_KEY = "logiai_hs_history";

const cellInput = {
  background: "rgba(0,0,0,0.25)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 6,
  color: "#e2e8f0",
  padding: "4px 7px",
  fontSize: 11,
  outline: "none",
  boxSizing: "border-box",
};

/**
 * Load HS code history from localStorage.
 * Format: { "partNo": { hs, th, duty, org, customer, date } }
 */
function loadHsHistory() {
  try {
    return JSON.parse(localStorage.getItem(HS_HISTORY_KEY) || "{}");
  } catch {
    return {};
  }
}

/**
 * Save current items' HS mappings to history for future auto-suggest.
 */
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

  // Tariff lookup panel state
  const [showLookup, setShowLookup] = useState(false);
  const [tariffReady, setTariffReady] = useState(isTariffLoaded());
  const [applyTarget, setApplyTarget] = useState(null); // item id to apply lookup result to

  // Preload tariff data on mount
  useEffect(() => {
    if (!isTariffLoaded()) {
      loadTariff().then(() => setTariffReady(true));
    }
  }, []);

  // Auto-match from history when no master data
  const matchFromHistory = () => {
    let matched = 0, unmatched = 0;
    setItems((prev) =>
      prev.map((item) => {
        // Try master data first, then history
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

  // Combined match: master data + history
  const handleAutoMatch = () => {
    if (mdArr.length > 0) {
      autoMatch();
    } else {
      const { matched, unmatched } = matchFromHistory();
      // Toast is handled by parent — we'll just log
    }
  };

  // Save to history when navigating to declaration
  const handleToDeclare = () => {
    saveHsHistory(items, hdr.customer || hdr.consignee || "");
    if (onStatusAdvance) onStatusAdvance();
    setPg("declaration");
  };

  const addItem = () =>
    setItems((p) => [...p, { id: uid(), pn: "", desc: "", th: "", qty: 1, up: 0, nw: 0, gw: 0, po: "", hs: "", duty: 0, org: hdr.origin || "CN", ok: false }]);

  const setField = (id, key, value) =>
    setItems((p) => p.map((i) => (i.id === id ? { ...i, [key]: value } : i)));

  // HS code change handler with auto-lookup from tariff DB
  const handleHsChange = (id, value) => {
    setField(id, "hs", value);
    const clean = value.replace(/[\s.\-]/g, "");
    if (clean.length >= 8 && tariffReady) {
      const match = lookupHS(clean);
      if (match && !match.partial) {
        // Auto-fill duty and Thai description from tariff database
        setItems((p) => p.map((i) =>
          i.id === id
            ? { ...i, hs: value, duty: match.duty, th: match.th || i.th, ok: true }
            : i
        ));
      }
    }
  };

  // Apply tariff lookup result to a target item (or first item missing HS)
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
      hs: "", th: "", duty: 0, org: hdr.origin || "CN", ok: false,
    })).filter((i) => i.pn);
    if (newItems.length) setItems((p) => [...p, ...newItems]);
  };

  const thStyle = {
    padding: "9px 6px", textAlign: "left", color: "#64748b", fontWeight: 600,
    fontSize: 10, textTransform: "uppercase", borderBottom: "1px solid rgba(255,255,255,0.06)",
    position: "sticky", top: 0, background: "rgba(15,23,42,0.98)", zIndex: 2, whiteSpace: "nowrap",
  };

  // Determine data source info
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
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Line Items ({items.length})</h2>
          <p style={{ fontSize: 12, color: "#64748b", margin: "3px 0 0" }}>
            {ciFile?.st === "done" ? `From ${ciFile.name}` : "Upload CI, paste from Excel, or add manually"}
            {" · "}
            <span style={{ color: hasmaster ? "#a78bfa" : hasHistory ? "#60a5fa" : "#f59e0b" }}>{dataSourceLabel}</span>
            {tariffReady && (
              <span style={{ color: "#475569" }}> · {Icons.book({ sz: 10, c: "#475569" })} {tariffCount.toLocaleString()} tariff codes</span>
            )}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {/* Tariff Lookup toggle */}
          <button
            onClick={() => setShowLookup(!showLookup)}
            style={{
              ...s.btnGhost,
              color: showLookup ? "#fbbf24" : "#f59e0b",
              borderColor: showLookup ? "rgba(251,191,36,0.3)" : "rgba(245,158,11,0.2)",
              background: showLookup ? "rgba(251,191,36,0.1)" : undefined,
              fontSize: 11,
              fontWeight: 600,
              padding: "6px 12px",
            }}
          >
            {Icons.book({ sz: 14 })} Tariff Lookup
            {!tariffReady && <span style={{ fontSize: 9, marginLeft: 4 }}>⏳</span>}
          </button>
          {/* Auto-match button — works with master OR history */}
          {(hasmaster || hasHistory) && items.length > 0 && (
            <button onClick={handleAutoMatch} style={{ ...s.btnGhost, color: "#60a5fa", borderColor: "rgba(96,165,250,0.2)" }}>
              {Icons.search({ sz: 14 })} Auto-Match
              {missingHs > 0 && (
                <span style={{ fontSize: 10, background: "rgba(239,68,68,0.15)", color: "#f87171", padding: "1px 6px", borderRadius: 10 }}>
                  {missingHs}
                </span>
              )}
            </button>
          )}
          <button onClick={addItem} style={s.btnPrimary}>{Icons.plus({ sz: 15 })} Add Item</button>
        </div>
      </div>

      {/* Tariff Lookup Panel */}
      {showLookup && (
        <HsLookupPanel
          onApply={handleLookupApply}
          onClose={() => setShowLookup(false)}
        />
      )}

      {/* HS Code source status banner */}
      {items.length > 0 && !hasmaster && !showLookup && (
        <div style={{
          marginBottom: 12, padding: "10px 16px", borderRadius: 8, fontSize: 12,
          background: hasHistory ? "rgba(96,165,250,0.05)" : "rgba(245,158,11,0.06)",
          border: `1px solid ${hasHistory ? "rgba(96,165,250,0.15)" : "rgba(245,158,11,0.15)"}`,
          color: hasHistory ? "#60a5fa" : "#f59e0b",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          {hasHistory ? Icons.db({ sz: 14, c: "#60a5fa" }) : Icons.alert({ sz: 14, c: "#f59e0b" })}
          <span>
            {hasHistory
              ? `No master data uploaded. Using ${historyCount} HS codes from previous declarations. Click Auto-Match to apply.`
              : <>No master data or HS history found. Click <b>Tariff Lookup</b> to search Thai Customs tariff codes, or enter HS codes manually. Type 8 digits for auto-validation.</>
            }
          </span>
        </div>
      )}

      {items.length === 0 ? (
        <div onPaste={handlePaste} tabIndex={0} style={{ ...s.card, textAlign: "center", padding: "50px 24px", border: "2px dashed rgba(52,211,153,0.2)", cursor: "text" }}>
          <div style={{ color: "#34d399", marginBottom: 10 }}>{Icons.upload({ sz: 32 })}</div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>No items yet</div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>
            Go to <b>Upload</b> to import from Excel, or paste tab-separated data here
          </div>
        </div>
      ) : (
        <div style={{ ...s.card, padding: 0, overflow: "hidden" }} onPaste={handlePaste} tabIndex={0}>
          <div style={{ overflowX: "auto", maxHeight: 480 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead>
                <tr>
                  {["#", "Part#", "Description", "HS Code", "Thai", "Origin", "Qty", "Unit$", "Duty%", "NW", "GW", "PO", ""].map((h, i) => (
                    <th key={i} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((it, idx) => {
                  // Show hint if history has a match but item doesn't have HS
                  const histHint = !it.hs && hsHistory[it.pn] ? hsHistory[it.pn].hs : null;
                  // Tariff validation indicator
                  const tariffMatch = it.hs && it.hs.replace(/[\s.\-]/g, "").length >= 8 && tariffReady
                    ? lookupHS(it.hs.replace(/[\s.\-]/g, ""))
                    : null;

                  return (
                    <tr key={it.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                      <td style={{ padding: "5px 6px", color: "#475569", fontSize: 10 }}>{idx + 1}</td>
                      <td style={{ padding: 3 }}>
                        <input value={it.pn} onChange={(e) => setField(it.id, "pn", e.target.value)}
                          style={{ ...cellInput, width: 105, fontFamily: "monospace", color: it.ok ? "#34d399" : "#e2e8f0" }} />
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
                              color: it.hs ? "#fbbf24" : "#64748b",
                              borderColor: !it.hs && it.pn ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.1)",
                            }} />
                          {/* Validation indicator */}
                          {it.hs && it.hs.replace(/[\s.\-]/g, "").length >= 8 && tariffReady && (
                            <span title={tariffMatch ? `${tariffMatch.en} — ${tariffMatch.duty}%` : "HS code not found in tariff database"}>
                              {tariffMatch
                                ? Icons.check({ sz: 11, c: "#34d399" })
                                : Icons.alert({ sz: 11, c: "#f59e0b" })
                              }
                            </span>
                          )}
                          {/* Tariff search shortcut for this row */}
                          {!it.hs && it.pn && (
                            <button
                              onClick={() => { setApplyTarget(it.id); setShowLookup(true); }}
                              title="Search tariff for this item"
                              style={{
                                background: "none", border: "none",
                                color: "#64748b", cursor: "pointer", padding: 1,
                              }}
                            >
                              {Icons.search({ sz: 10 })}
                            </button>
                          )}
                        </div>
                        {/* HS intelligence insight */}
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
                              background: "rgba(96,165,250,0.15)", border: "none", borderRadius: 3,
                              color: "#60a5fa", cursor: "pointer", fontSize: 9, padding: "1px 4px", fontWeight: 700,
                            }}
                          >
                            ↩
                          </button>
                        )}
                      </td>
                      <td style={{ padding: 3 }}>
                        <input value={it.th} onChange={(e) => setField(it.id, "th", e.target.value)} style={{ ...cellInput, width: 120, color: "#a78bfa" }} />
                      </td>
                      <td style={{ padding: 3 }}>
                        <input value={it.org || hdr.origin || ""} onChange={(e) => setField(it.id, "org", e.target.value)}
                          style={{ ...cellInput, width: 36, textAlign: "center", textTransform: "uppercase", fontSize: 10, color: "#94a3b8" }} maxLength={2} />
                      </td>
                      <td style={{ padding: 3 }}>
                        <input type="number" value={it.qty} onChange={(e) => setField(it.id, "qty", parseFloat(e.target.value) || 0)}
                          style={{ ...cellInput, width: 50, textAlign: "right" }} />
                      </td>
                      <td style={{ padding: 3 }}>
                        <input type="number" value={it.up} onChange={(e) => setField(it.id, "up", parseFloat(e.target.value) || 0)}
                          style={{ ...cellInput, width: 70, textAlign: "right" }} step="0.01" />
                      </td>
                      <td style={{ padding: 3 }}>
                        <input type="number" value={it.duty} onChange={(e) => setField(it.id, "duty", parseFloat(e.target.value) || 0)}
                          style={{ ...cellInput, width: 50, textAlign: "right", color: it.duty > 0 ? "#fbbf24" : "#34d399" }} />
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
                        <button onClick={() => duplicateItem(it.id)} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", padding: 2 }}>
                          {Icons.copy({ sz: 12 })}
                        </button>
                        <button onClick={() => deleteItem(it.id)} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", padding: 2 }}>
                          {Icons.trash({ sz: 12 })}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ padding: "10px 14px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 20, fontSize: 12, alignItems: "center" }}>
            <span style={{ color: "#64748b" }}>Total: <b style={{ color: "#fbbf24" }}>${fmt(totalInv)}</b></span>
            {missingHs > 0 && (
              <span style={{ color: "#f87171" }}>{Icons.alert({ sz: 13, c: "#f87171" })} {missingHs} need HS</span>
            )}
            {tariffReady && tariffCount > 0 && (
              <span style={{ color: "#475569", fontSize: 10 }}>{Icons.book({ sz: 10, c: "#475569" })} Tariff DB active</span>
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
