/**
 * IntelligencePage — Dedicated screen for the Intelligence Mesh
 *
 * Shows all learned patterns: customers, HS codes, trade lanes, privilege savings.
 * Surfaces insights and emerging patterns from filed declarations.
 */

import { useState, useEffect } from "react";
import { getAllByType, getPrivilegeSavings } from "../services/IntelligenceService";
import { listShipments } from "../services/ShipmentService";
import Icons from "./Icons";
import { s } from "../constants/styles";

export default function IntelligencePage({ onBack }) {
  const [intel, setIntel] = useState({ hs: [], customers: [], lanes: [] });
  const [savings, setSavings] = useState(null);
  const [stats, setStats] = useState({ total: 0, declared: 0, filed: 0 });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [hs, customers, lanes, sav, shipments] = await Promise.all([
        getAllByType("hs"),
        getAllByType("customer"),
        getAllByType("lane"),
        getPrivilegeSavings(),
        listShipments(),
      ]);
      setIntel({
        hs: (hs || []).sort((a, b) => (b.data?.timesUsed || 0) - (a.data?.timesUsed || 0)),
        customers: (customers || []).sort((a, b) => (b.data?.shipmentsCount || 0) - (a.data?.shipmentsCount || 0)),
        lanes: (lanes || []).sort((a, b) => (b.data?.shipmentsCount || 0) - (a.data?.shipmentsCount || 0)),
      });
      setSavings(sav);
      setStats({
        total: shipments.length,
        declared: shipments.filter(s => s.status === "declared").length,
        filed: shipments.filter(s => s.status === "filed").length,
      });
    } catch (err) {
      console.warn("[Intelligence] Load failed:", err);
    }
    setLoading(false);
  }

  const totalRecords = intel.hs.length + intel.customers.length + intel.lanes.length;
  const sectionHeader = {
    fontSize: 12, fontWeight: 700, color: "#8B6914", textTransform: "uppercase",
    letterSpacing: "0.06em", borderBottom: "2px solid #c6952e", paddingBottom: 6, marginBottom: 14,
    display: "flex", alignItems: "center", gap: 8,
  };

  const TABS = [
    { key: "overview", label: "Overview", icon: Icons.layers },
    { key: "customers", label: `Customers (${intel.customers.length})`, icon: Icons.ship },
    { key: "hscodes", label: `HS Codes (${intel.hs.length})`, icon: Icons.book },
    { key: "lanes", label: `Trade Lanes (${intel.lanes.length})`, icon: Icons.anchor },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 80, color: "#5a5a7a" }}>Loading intelligence data...</div>
    );
  }

  return (
    <div style={{ animation: "fadeIn .3s ease" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8,
              background: "linear-gradient(135deg, #c6952e, #e8d5a3)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {Icons.zap({ sz: 20, c: "#1a2a5e" })}
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1a2a5e", margin: 0 }}>
                Logi<span style={{ color: "#c6952e" }}>AI</span><sup style={{ fontSize: 10, color: "#c6952e" }}>m</sup> — OM Intelligence
              </h1>
              <p style={{ fontSize: 12, color: "#5a5a7a", margin: 0 }}>
                Patterns learned from {savings?.declarationsCount || 0} declarations
              </p>
            </div>
          </div>
        </div>
        <button onClick={onBack} style={s.btnGhost}>
          {Icons.grid({ sz: 13 })} Dashboard
        </button>
      </div>

      {/* Stats bar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          [Icons.layers, "Records", totalRecords, "#1a2a5e"],
          [Icons.book, "HS Codes", intel.hs.length, "#c6952e"],
          [Icons.ship, "Customers", intel.customers.length, "#2563eb"],
          [Icons.anchor, "Trade Lanes", intel.lanes.length, "#7c3aed"],
          [Icons.shield, "Declarations", savings?.declarationsCount || 0, "#15803d"],
        ].map(([icon, label, value, color], i) => (
          <div key={i} style={{ ...s.card, textAlign: "center", padding: "14px 10px" }}>
            <div style={{ marginBottom: 4 }}>{icon({ sz: 18, c: color })}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color }}>{value}</div>
            <div style={{ fontSize: 10, color: "#5a5a7a", textTransform: "uppercase", fontWeight: 600 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 3, marginBottom: 20, borderBottom: "2px solid #d4d2e0" }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              background: tab === t.key ? "#ffffff" : "transparent",
              border: tab === t.key ? "1px solid #d4d2e0" : "1px solid transparent",
              borderBottom: tab === t.key ? "3px solid #c6952e" : "3px solid transparent",
              borderBottomLeftRadius: 0, borderBottomRightRadius: 0,
              borderTopLeftRadius: 6, borderTopRightRadius: 6,
              color: tab === t.key ? "#1a2a5e" : "#5a5a7a",
              fontWeight: 600, fontSize: 12, padding: "8px 16px",
              cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6,
              marginBottom: -2, fontFamily: "'Sarabun', sans-serif",
            }}
          >
            {t.icon({ sz: 13 })} {t.label}
          </button>
        ))}
      </div>

      {/* No data state */}
      {totalRecords === 0 && (
        <div style={{ ...s.card, textAlign: "center", padding: 60 }}>
          {Icons.zap({ sz: 40, c: "#d4d2e0" })}
          <div style={{ fontSize: 16, fontWeight: 600, color: "#1a2a5e", marginTop: 12 }}>No intelligence data yet</div>
          <div style={{ fontSize: 13, color: "#5a5a7a", marginTop: 4 }}>
            File declarations to start building patterns. The mesh learns from every declaration you export.
          </div>
        </div>
      )}

      {/* OVERVIEW TAB */}
      {tab === "overview" && totalRecords > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Emerging Patterns / Insights */}
          <div style={{ ...s.card, gridColumn: "1/-1" }}>
            <div style={sectionHeader}>
              {Icons.trending({ sz: 14, c: "#c6952e" })} Emerging Patterns & Insights
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              {/* Most active customer */}
              {intel.customers.length > 0 && (() => {
                const top = intel.customers[0];
                const name = top.key.replace("customer:", "");
                const hsCount = Object.keys(top.data.hsCodes || {}).length;
                return (
                  <div style={{ padding: "12px 14px", background: "#eef2ff", borderRadius: 8, border: "1px solid #c7d2fe" }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "#1a2a5e", textTransform: "uppercase", marginBottom: 4 }}>Top Customer</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#1a2a5e", textTransform: "capitalize" }}>{name}</div>
                    <div style={{ fontSize: 11, color: "#5a5a7a", marginTop: 2 }}>
                      {top.data.shipmentsCount} shipments · {hsCount} unique HS codes
                    </div>
                  </div>
                );
              })()}

              {/* Most used HS code */}
              {intel.hs.length > 0 && (() => {
                const top = intel.hs[0];
                const code = top.key.replace("hs:", "");
                const desc = Object.entries(top.data.descriptions || {}).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";
                return (
                  <div style={{ padding: "12px 14px", background: "#fffbeb", borderRadius: 8, border: "1px solid #fde68a" }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "#b45309", textTransform: "uppercase", marginBottom: 4 }}>Most Used HS Code</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#c6952e", fontFamily: "monospace" }}>
                      {code.slice(0, 4)}.{code.slice(4)}
                    </div>
                    <div style={{ fontSize: 11, color: "#5a5a7a", marginTop: 2 }}>
                      {desc} · {top.data.timesUsed}× used
                    </div>
                  </div>
                );
              })()}

              {/* Busiest trade lane */}
              {intel.lanes.length > 0 && (() => {
                const top = intel.lanes[0];
                const lane = top.key.replace("lane:", "");
                const hsCount = Object.keys(top.data.hsCodes || {}).length;
                return (
                  <div style={{ padding: "12px 14px", background: "#faf5ff", borderRadius: 8, border: "1px solid #e9d5ff" }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "#7c3aed", textTransform: "uppercase", marginBottom: 4 }}>Busiest Route</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#7c3aed" }}>
                      {lane.split("-").join(" → ")}
                    </div>
                    <div style={{ fontSize: 11, color: "#5a5a7a", marginTop: 2 }}>
                      {top.data.shipmentsCount} shipments · {hsCount} products
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Pattern insights */}
            <div style={{ marginTop: 16, display: "grid", gap: 8 }}>
              {intel.customers.map((c) => {
                const name = c.key.replace("customer:", "");
                const d = c.data;
                const topPriv = Object.entries(d.privileges || {}).sort((a, b) => b[1] - a[1])[0];
                const hsCount = Object.keys(d.hsCodes || {}).length;
                const topHs = Object.entries(d.hsCodes || {}).sort((a, b) => b[1] - a[1]).slice(0, 3);
                // Find matching HS descriptions
                const hsDescs = topHs.map(([code]) => {
                  const hsRec = intel.hs.find(h => h.key === `hs:${code}`);
                  const desc = hsRec ? Object.entries(hsRec.data.descriptions || {}).sort((a, b) => b[1] - a[1])[0]?.[0] : null;
                  return { code, desc };
                });

                return (
                  <div key={c.key} style={{ padding: "10px 14px", background: "#fafafe", borderRadius: 6, border: "1px solid #e8e7ed", borderLeft: "3px solid #1a2a5e" }}>
                    <div style={{ fontSize: 11, color: "#5a5a7a" }}>
                      <b style={{ color: "#1a2a5e", textTransform: "capitalize" }}>{name}</b> has shipped <b>{d.shipmentsCount}</b> times
                      {topPriv && topPriv[0] !== "NONE" && <> using <b style={{ color: "#15803d" }}>{topPriv[0]}</b> privilege</>}
                      {topPriv && topPriv[0] === "NONE" && <> without any FTA privilege</>}
                      {" "}— importing <b>{hsCount}</b> unique product types
                      {hsDescs.length > 0 && <> including {hsDescs.map((h, i) => (
                        <span key={h.code}>
                          {i > 0 && (i === hsDescs.length - 1 ? " and " : ", ")}
                          <span style={{ color: "#c6952e", fontFamily: "monospace", fontWeight: 600 }}>
                            {h.desc || h.code}
                          </span>
                        </span>
                      ))}</>}.
                    </div>
                  </div>
                );
              })}

              {intel.lanes.map((l) => {
                const lane = l.key.replace("lane:", "");
                const [orig, dest] = lane.split("-");
                const d = l.data;
                const topHs = Object.entries(d.hsCodes || {}).sort((a, b) => b[1] - a[1]).slice(0, 3);
                return (
                  <div key={l.key} style={{ padding: "10px 14px", background: "#fafafe", borderRadius: 6, border: "1px solid #e8e7ed", borderLeft: "3px solid #7c3aed" }}>
                    <div style={{ fontSize: 11, color: "#5a5a7a" }}>
                      The <b style={{ color: "#7c3aed" }}>{orig} → {dest}</b> trade lane has seen <b>{d.shipmentsCount}</b> shipments
                      {d.avgDuty > 0 && <> with average duty of <b style={{ color: "#c6952e" }}>{d.avgDuty.toLocaleString()} THB</b></>}
                      {topHs.length > 0 && <> — top products: {topHs.map(([code], i) => (
                        <span key={code}>
                          {i > 0 && ", "}
                          <span style={{ fontFamily: "monospace", color: "#c6952e" }}>{code.slice(0, 4)}.{code.slice(4)}</span>
                        </span>
                      ))}</>}.
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Privilege savings */}
          {savings && savings.declarationsCount > 0 && (
            <div style={{ ...s.card }}>
              <div style={sectionHeader}>
                {Icons.shield({ sz: 14, c: "#15803d" })} Privilege Savings Tracker
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#15803d", fontFamily: "monospace", marginBottom: 4 }}>
                {savings.totalSaved.toLocaleString("en", { minimumFractionDigits: 2 })} <span style={{ fontSize: 13, fontWeight: 400, color: "#5a5a7a" }}>THB</span>
              </div>
              <div style={{ fontSize: 11, color: "#5a5a7a", marginBottom: 12 }}>
                Saved across {savings.declarationsCount} declarations
              </div>
              {Object.entries(savings.byScheme || {}).length > 0 && (
                <div style={{ display: "grid", gap: 6 }}>
                  {Object.entries(savings.byScheme).sort((a, b) => b[1] - a[1]).map(([scheme, amt]) => (
                    <div key={scheme} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 10px", background: "#f0fdf4", borderRadius: 4, border: "1px solid #bbf7d0" }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#1a2a5e" }}>{scheme}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#15803d", fontFamily: "monospace" }}>{amt.toLocaleString()} THB</span>
                    </div>
                  ))}
                </div>
              )}
              {Object.entries(savings.byScheme || {}).length === 0 && (
                <div style={{ fontSize: 12, color: "#8a8aa0" }}>No privilege schemes used yet. Use FTA/BOI privileges to track savings.</div>
              )}
            </div>
          )}

          {/* Data freshness */}
          <div style={{ ...s.card }}>
            <div style={sectionHeader}>
              {Icons.clock({ sz: 14, c: "#1a2a5e" })} Data Freshness
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              {[...intel.hs.slice(0, 3), ...intel.customers, ...intel.lanes].map((r) => (
                <div key={r.key} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, padding: "4px 0", borderBottom: "1px solid #f0eff5" }}>
                  <span style={{ color: "#1a1a2e", fontWeight: 500 }}>
                    {r.type === "hs" ? `HS ${r.key.replace("hs:", "")}` : r.type === "customer" ? r.key.replace("customer:", "") : r.key.replace("lane:", "")}
                  </span>
                  <span style={{ color: "#8a8aa0", fontSize: 10 }}>
                    {r.updatedAt ? new Date(r.updatedAt).toLocaleString() : "—"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CUSTOMERS TAB */}
      {tab === "customers" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {intel.customers.map((c) => {
            const d = c.data;
            const name = c.key.replace("customer:", "");
            const topHs = Object.entries(d.hsCodes || {}).sort((a, b) => b[1] - a[1]);
            const topPriv = Object.entries(d.privileges || {}).sort((a, b) => b[1] - a[1]);
            return (
              <div key={c.key} style={{ ...s.card }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#1a2a5e", textTransform: "capitalize", marginBottom: 8 }}>{name}</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
                  <div style={{ background: "#eef2ff", borderRadius: 6, padding: "8px 10px", textAlign: "center" }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#1a2a5e" }}>{d.shipmentsCount}</div>
                    <div style={{ fontSize: 9, color: "#5a5a7a", textTransform: "uppercase" }}>Shipments</div>
                  </div>
                  <div style={{ background: "#fffbeb", borderRadius: 6, padding: "8px 10px", textAlign: "center" }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#c6952e" }}>{Object.keys(d.hsCodes || {}).length}</div>
                    <div style={{ fontSize: 9, color: "#5a5a7a", textTransform: "uppercase" }}>HS Codes</div>
                  </div>
                  <div style={{ background: "#f0fdf4", borderRadius: 6, padding: "8px 10px", textAlign: "center" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#15803d" }}>{topPriv[0]?.[0] || "NONE"}</div>
                    <div style={{ fontSize: 9, color: "#5a5a7a", textTransform: "uppercase" }}>Privilege</div>
                  </div>
                </div>
                <div style={{ fontSize: 10, color: "#8a8aa0", marginBottom: 8 }}>
                  Last shipment: {d.lastShipment ? new Date(d.lastShipment).toLocaleDateString() : "—"}
                </div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#8B6914", textTransform: "uppercase", marginBottom: 6 }}>HS Codes Used</div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {topHs.map(([code, count]) => {
                    const hsRec = intel.hs.find(h => h.key === `hs:${code}`);
                    const desc = hsRec ? Object.entries(hsRec.data.descriptions || {}).sort((a, b) => b[1] - a[1])[0]?.[0] : null;
                    return (
                      <span key={code} title={desc || code} style={{ fontSize: 10, background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 4, padding: "3px 7px", color: "#b45309", fontFamily: "monospace" }}>
                        {code.slice(0, 4)}.{code.slice(4)} <span style={{ color: "#8a8aa0" }}>×{count}</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {intel.customers.length === 0 && (
            <div style={{ ...s.card, textAlign: "center", padding: 40, gridColumn: "1/-1" }}>
              <div style={{ fontSize: 14, color: "#5a5a7a" }}>No customer patterns yet. File declarations to build customer intelligence.</div>
            </div>
          )}
        </div>
      )}

      {/* HS CODES TAB */}
      {tab === "hscodes" && (
        <div style={{ ...s.card, padding: 0, overflow: "hidden", borderTop: "3px solid #1a2a5e" }}>
          <div style={{ overflowY: "auto", maxHeight: 600 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr>
                  {["HS Code", "Description", "Times Used", "Avg Duty", "Customers", "Last Used"].map((h, i) => (
                    <th key={i} style={{ padding: "10px 12px", textAlign: i >= 2 ? "right" : "left", color: "#ffffff", fontWeight: 600, fontSize: 10, textTransform: "uppercase", background: "#1a2a5e", position: "sticky", top: 0 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {intel.hs.map((h, idx) => {
                  const d = h.data;
                  const code = h.key.replace("hs:", "");
                  const desc = Object.entries(d.descriptions || {}).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";
                  const custs = Object.entries(d.customers || {}).sort((a, b) => b[1] - a[1]);
                  const avgDuty = d.duties?.length > 0 ? (d.duties.reduce((a, b) => a + b, 0) / d.duties.length) : 0;
                  return (
                    <tr key={h.key} style={{ borderBottom: "1px solid #e8e7ed", background: idx % 2 === 0 ? "#ffffff" : "#fafafe" }}>
                      <td style={{ padding: "8px 12px", fontFamily: "monospace", color: "#c6952e", fontWeight: 700 }}>
                        {code.slice(0, 4)}.{code.slice(4)}
                      </td>
                      <td style={{ padding: "8px 12px", color: "#1a1a2e" }}>{desc}</td>
                      <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, color: "#1a2a5e" }}>{d.timesUsed}</td>
                      <td style={{ padding: "8px 12px", textAlign: "right", color: avgDuty > 0 ? "#dc2626" : "#15803d", fontWeight: 600 }}>{avgDuty.toFixed(1)}%</td>
                      <td style={{ padding: "8px 12px", textAlign: "right", color: "#5a5a7a" }}>
                        {custs.map(([name]) => name.split(" ")[0]).join(", ")}
                      </td>
                      <td style={{ padding: "8px 12px", textAlign: "right", fontSize: 10, color: "#8a8aa0" }}>
                        {d.lastUsed ? new Date(d.lastUsed).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {intel.hs.length === 0 && (
            <div style={{ textAlign: "center", padding: 40, color: "#5a5a7a" }}>No HS code data yet.</div>
          )}
        </div>
      )}

      {/* TRADE LANES TAB */}
      {tab === "lanes" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {intel.lanes.map((l) => {
            const d = l.data;
            const lane = l.key.replace("lane:", "");
            const [orig, dest] = lane.split("-");
            const topHs = Object.entries(d.hsCodes || {}).sort((a, b) => b[1] - a[1]);
            return (
              <div key={l.key} style={{ ...s.card }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 8, background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {Icons.anchor({ sz: 20, c: "#1a2a5e" })}
                  </div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#1a2a5e" }}>{orig} → {dest}</div>
                    <div style={{ fontSize: 11, color: "#5a5a7a" }}>{d.shipmentsCount} shipments</div>
                  </div>
                </div>
                {d.avgDuty > 0 && (
                  <div style={{ fontSize: 12, color: "#5a5a7a", marginBottom: 8 }}>
                    Average duty: <b style={{ color: "#c6952e" }}>{d.avgDuty.toLocaleString()} THB</b>
                  </div>
                )}
                <div style={{ fontSize: 10, fontWeight: 700, color: "#8B6914", textTransform: "uppercase", marginBottom: 6 }}>Products on this route ({topHs.length})</div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {topHs.map(([code, count]) => {
                    const hsRec = intel.hs.find(h => h.key === `hs:${code}`);
                    const desc = hsRec ? Object.entries(hsRec.data.descriptions || {}).sort((a, b) => b[1] - a[1])[0]?.[0] : null;
                    return (
                      <span key={code} title={desc || code} style={{ fontSize: 10, background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 4, padding: "3px 7px", color: "#b45309", fontFamily: "monospace" }}>
                        {code.slice(0, 4)}.{code.slice(4)} <span style={{ color: "#8a8aa0" }}>×{count}</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {intel.lanes.length === 0 && (
            <div style={{ ...s.card, textAlign: "center", padding: 40, gridColumn: "1/-1" }}>
              <div style={{ fontSize: 14, color: "#5a5a7a" }}>No trade lane data yet.</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
