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

/**
 * HS Code Tariff Lookup Panel
 *
 * Slide-down panel above the items table. User can:
 * - Search by HS code prefix (e.g. "8504") or description keyword (e.g. "motor")
 * - See matching tariff entries with duty rates
 * - Click a result to apply to a specific item row
 */
export default function HsLookupPanel({
  onApply, // (entry: {hs, en, th, duty, unit}) => void
  onClose,
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(!isTariffLoaded());
  const [selected, setSelected] = useState(null);
  const inputRef = useRef();

  // Load tariff data on mount if not already loaded
  useEffect(() => {
    if (!isTariffLoaded()) {
      loadTariff().then(() => setLoading(false));
    }
    // Focus the search input
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // Search on query change (debounced)
  useEffect(() => {
    if (loading) return;
    if (!query || query.trim().length < 2) {
      setResults([]);
      setSelected(null);
      return;
    }

    const timer = setTimeout(() => {
      const clean = query.trim();
      // If 8+ digit code, try exact lookup first
      const cleanDigits = clean.replace(/[\s.\-]/g, "");
      if (/^\d{8,}$/.test(cleanDigits)) {
        const exact = lookupHS(cleanDigits);
        if (exact && !exact.partial) {
          setResults([exact]);
          setSelected(exact);
          return;
        }
      }
      // Otherwise, search
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

  return (
    <div
      style={{
        ...s.card,
        marginBottom: 16,
        animation: "fadeIn .2s ease",
        border: "1px solid rgba(251,191,36,0.15)",
        position: "relative",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {Icons.book({ sz: 16, c: "#fbbf24" })}
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#fbbf24",
            }}
          >
            Thai Customs Tariff Lookup
          </span>
          {count > 0 && (
            <span
              style={{
                fontSize: 10,
                color: "#64748b",
                background: "rgba(255,255,255,0.04)",
                padding: "2px 8px",
                borderRadius: 10,
              }}
            >
              {count.toLocaleString()} codes
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <a
            href={ETARIFF_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 10,
              color: "#64748b",
              textDecoration: "none",
            }}
          >
            Official E-Tariff ↗
          </a>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#64748b",
              cursor: "pointer",
              padding: 2,
            }}
          >
            {Icons.x({ sz: 16 })}
          </button>
        </div>
      </div>

      {/* Search input */}
      <div style={{ position: "relative", marginBottom: 10 }}>
        <input
          ref={inputRef}
          type="text"
          placeholder={
            loading
              ? "Loading tariff database..."
              : 'Search HS code (e.g. "8504") or description (e.g. "motor", "laptop")'
          }
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={loading}
          style={{
            ...s.input,
            paddingLeft: 36,
            fontSize: 13,
            borderColor: "rgba(251,191,36,0.2)",
          }}
        />
        <span
          style={{
            position: "absolute",
            left: 12,
            top: "50%",
            transform: "translateY(-50%)",
            color: "#64748b",
          }}
        >
          {loading ? (
            <span
              style={{
                display: "inline-block",
                animation: "spin 1s linear infinite",
                fontSize: 14,
              }}
            >
              ⏳
            </span>
          ) : (
            Icons.search({ sz: 14 })
          )}
        </span>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div
          style={{
            maxHeight: 280,
            overflowY: "auto",
            borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 11,
            }}
          >
            <thead>
              <tr>
                {["HS Code", "Description", "Thai", "Duty%", "Unit", ""].map(
                  (h, i) => (
                    <th
                      key={i}
                      style={{
                        padding: "7px 8px",
                        textAlign: "left",
                        color: "#64748b",
                        fontWeight: 600,
                        fontSize: 10,
                        textTransform: "uppercase",
                        borderBottom: "1px solid rgba(255,255,255,0.06)",
                        position: "sticky",
                        top: 0,
                        background: "rgba(15,23,42,0.98)",
                        zIndex: 1,
                      }}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {results.map((entry, idx) => (
                <tr
                  key={entry.hs + idx}
                  style={{
                    borderBottom: "1px solid rgba(255,255,255,0.03)",
                    cursor: "pointer",
                    transition: "background .15s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background =
                      "rgba(251,191,36,0.05)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                  onClick={() => handleApply(entry)}
                >
                  <td
                    style={{
                      padding: "6px 8px",
                      fontFamily: "monospace",
                      color: "#fbbf24",
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {entry.hs.substring(0, 4)}.
                    {entry.hs.substring(4, 6)}.
                    {entry.hs.substring(6)}
                  </td>
                  <td
                    style={{
                      padding: "6px 8px",
                      color: "#e2e8f0",
                      maxWidth: 220,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {entry.en}
                  </td>
                  <td
                    style={{
                      padding: "6px 8px",
                      color: "#a78bfa",
                      maxWidth: 160,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      fontSize: 10,
                    }}
                  >
                    {entry.th}
                  </td>
                  <td
                    style={{
                      padding: "6px 8px",
                      fontWeight: 700,
                      color:
                        entry.duty === 0
                          ? "#34d399"
                          : entry.duty >= 20
                          ? "#f87171"
                          : "#fbbf24",
                      textAlign: "right",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {entry.duty}%
                  </td>
                  <td
                    style={{
                      padding: "6px 8px",
                      color: "#64748b",
                      fontSize: 10,
                    }}
                  >
                    {entry.unit}
                  </td>
                  <td style={{ padding: "6px 8px" }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleApply(entry);
                      }}
                      style={{
                        background: "rgba(52,211,153,0.1)",
                        border: "1px solid rgba(52,211,153,0.2)",
                        borderRadius: 4,
                        color: "#34d399",
                        cursor: "pointer",
                        fontSize: 10,
                        fontWeight: 600,
                        padding: "2px 8px",
                        whiteSpace: "nowrap",
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

      {/* Empty state */}
      {query.trim().length >= 2 && results.length === 0 && !loading && (
        <div
          style={{
            textAlign: "center",
            padding: "20px 16px",
            color: "#64748b",
            fontSize: 12,
          }}
        >
          <div style={{ marginBottom: 6 }}>
            {Icons.alert({ sz: 16, c: "#64748b" })}
          </div>
          No matching tariff codes found for &quot;{query}&quot;
          <div style={{ marginTop: 8, fontSize: 11 }}>
            Try a broader search or check the{" "}
            <a
              href={ETARIFF_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#fbbf24", textDecoration: "underline" }}
            >
              official Thai Customs E-Tariff
            </a>
          </div>
        </div>
      )}

      {/* Tip */}
      {query.trim().length < 2 && !loading && results.length === 0 && (
        <div
          style={{
            fontSize: 11,
            color: "#475569",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {Icons.zap({ sz: 12, c: "#475569" })}
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
