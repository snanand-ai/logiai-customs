import { useState, useEffect, useRef } from "react";
import {
  loadTariff,
  lookupHS,
  searchHS,
  isTariffLoaded,
  getTariffCount,
} from "../utils/hsLookup";
import Icons from "./Icons";
import { s } from "../constants/styles";

const ETARIFF_URL =
  "http://itd.customs.go.th/igtf/th/main_frame.jsp?lang=en";

export default function HsLookupPanel({ onApply, onClose }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(!isTariffLoaded());
  const [selected, setSelected] = useState(null);
  const inputRef = useRef();

  useEffect(() => {
    if (!isTariffLoaded()) {
      loadTariff().then(() => setLoading(false));
    }
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!query || query.trim().length < 2) {
      setResults([]);
      setSelected(null);
      return;
    }

    const timer = setTimeout(() => {
      const clean = query.trim();
      const cleanDigits = clean.replace(/[\s.\-]/g, "");
      if (/^\d{8,}$/.test(cleanDigits)) {
        const exact = lookupHS(cleanDigits);
        if (exact && !exact.partial) {
          setResults([exact]);
          setSelected(exact);
          return;
        }
      }
      const res = searchHS(clean, 30);
      setResults(res);
      setSelected(null);
    }, 150);

    return () => clearTimeout(timer);
  }, [query, loading]);

  const handleApply = (entry) => {
    if (onApply) onApply(entry);
  };

  const count = isTariffLoaded() ? getTariffCount() : 0;

  const thStyle = {
    padding: "7px 8px", textAlign: "left", color: "#ffffff", fontWeight: 600,
    fontSize: 10, textTransform: "uppercase", borderBottom: "1px solid #1a2a5e",
    position: "sticky", top: 0, background: "#1a2a5e", zIndex: 1,
  };

  return (
    <div
      style={{
        ...s.card,
        marginBottom: 16,
        animation: "fadeIn .2s ease",
        borderTop: "3px solid #c6952e",
        position: "relative",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {Icons.book({ sz: 16, c: "#c6952e" })}
          <span style={{ fontSize: 13, fontWeight: 700, color: "#8B6914" }}>
            Thai Customs Tariff Lookup
          </span>
          {count > 0 && (
            <span style={{ fontSize: 10, color: "#5a5a7a", background: "#f0eff5", padding: "2px 8px", borderRadius: 10, border: "1px solid #d4d2e0" }}>
              {count.toLocaleString()} codes
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <a href={ETARIFF_URL} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 10, color: "#5a5a7a", textDecoration: "none" }}>
            Official E-Tariff ↗
          </a>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#8a8aa0", cursor: "pointer", padding: 2 }}>
            {Icons.x({ sz: 16 })}
          </button>
        </div>
      </div>

      <div style={{ position: "relative", marginBottom: 10 }}>
        <input
          ref={inputRef}
          type="text"
          placeholder={loading ? "Loading tariff database..." : 'Search HS code (e.g. "8504") or description (e.g. "motor", "laptop")'}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={loading}
          style={{ ...s.input, paddingLeft: 36, fontSize: 13, borderColor: "#c6952e" }}
        />
        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#8a8aa0" }}>
          {loading ? (
            <span style={{ display: "inline-block", animation: "spin 1s linear infinite", fontSize: 14 }}>⏳</span>
          ) : (
            Icons.search({ sz: 14 })
          )}
        </span>
      </div>

      {results.length > 0 && (
        <div style={{ maxHeight: 280, overflowY: "auto", borderRadius: 6, border: "1px solid #d4d2e0" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
            <thead>
              <tr>
                {["HS Code", "Description", "Thai", "Duty%", "Unit", ""].map((h, i) => (
                  <th key={i} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.map((entry, idx) => (
                <tr
                  key={entry.hs + idx}
                  style={{ borderBottom: "1px solid #e8e7ed", cursor: "pointer", transition: "background .15s", background: idx % 2 === 0 ? "#ffffff" : "#fafafe" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#faf8f3")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = idx % 2 === 0 ? "#ffffff" : "#fafafe")}
                  onClick={() => handleApply(entry)}
                >
                  <td style={{ padding: "6px 8px", fontFamily: "monospace", color: "#c6952e", fontWeight: 600, whiteSpace: "nowrap" }}>
                    {entry.hs.substring(0, 4)}.{entry.hs.substring(4, 6)}.{entry.hs.substring(6)}
                  </td>
                  <td style={{ padding: "6px 8px", color: "#1a1a2e", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {entry.en}
                  </td>
                  <td style={{ padding: "6px 8px", color: "#7c3aed", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 10 }}>
                    {entry.th}
                  </td>
                  <td style={{ padding: "6px 8px", fontWeight: 700, color: entry.duty === 0 ? "#15803d" : entry.duty >= 20 ? "#dc2626" : "#c6952e", textAlign: "right", whiteSpace: "nowrap" }}>
                    {entry.duty}%
                  </td>
                  <td style={{ padding: "6px 8px", color: "#8a8aa0", fontSize: 10 }}>{entry.unit}</td>
                  <td style={{ padding: "6px 8px" }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleApply(entry); }}
                      style={{
                        background: "#eef2ff", border: "1px solid #c7d2fe", borderRadius: 4,
                        color: "#1a2a5e", cursor: "pointer", fontSize: 10, fontWeight: 600, padding: "2px 8px", whiteSpace: "nowrap",
                      }}
                    >
                      Apply ↵
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {query.trim().length >= 2 && results.length === 0 && !loading && (
        <div style={{ textAlign: "center", padding: "20px 16px", color: "#5a5a7a", fontSize: 12 }}>
          <div style={{ marginBottom: 6 }}>{Icons.alert({ sz: 16, c: "#8a8aa0" })}</div>
          No matching tariff codes found for &quot;{query}&quot;
          <div style={{ marginTop: 8, fontSize: 11 }}>
            Try a broader search or check the{" "}
            <a href={ETARIFF_URL} target="_blank" rel="noopener noreferrer" style={{ color: "#c6952e", textDecoration: "underline" }}>
              official Thai Customs E-Tariff
            </a>
          </div>
        </div>
      )}

      {query.trim().length < 2 && !loading && results.length === 0 && (
        <div style={{ fontSize: 11, color: "#5a5a7a", display: "flex", alignItems: "center", gap: 8 }}>
          {Icons.zap({ sz: 12, c: "#8a8aa0" })}
          <span>
            Type an HS code prefix (e.g. &quot;8471&quot; for computers) or a product name
            (e.g. &quot;transformer&quot;, &quot;valve&quot;). Click a result to apply it to the
            selected item.
          </span>
        </div>
      )}
    </div>
  );
}
