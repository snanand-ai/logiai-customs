/**
 * LaneInsight — Trade lane statistics widget
 *
 * Shows shipment count, avg duty, and common HS codes for a trade lane.
 * Appears on ShipmentPage near origin/destination fields.
 */

import { useState, useEffect } from "react";
import Icons from "../Icons";

export default function LaneInsight({ origin, destination, getInsight }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!origin || !getInsight) {
      setData(null);
      return;
    }
    let cancelled = false;
    getInsight(origin, destination || "TH").then((d) => {
      if (!cancelled) setData(d);
    });
    return () => { cancelled = true; };
  }, [origin, destination, getInsight]);

  if (!data) return null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: "rgba(99,102,241,0.06)",
        border: "1px solid rgba(99,102,241,0.12)",
        borderRadius: 8,
        padding: "8px 14px",
        fontSize: 11,
        animation: "fadeIn .2s ease",
      }}
    >
      {Icons.anchor({ sz: 13, c: "#818cf8" })}
      <div style={{ flex: 1 }}>
        <div style={{ color: "#818cf8", fontWeight: 700, fontSize: 10, marginBottom: 2 }}>
          {origin?.toUpperCase()} → {(destination || "TH").toUpperCase()} lane
        </div>
        <div style={{ color: "#94a3b8", fontSize: 10 }}>
          <strong style={{ color: "#e2e8f0" }}>{data.shipmentsCount}</strong> shipments
          {data.avgDuty > 0 && (
            <>
              {" "}&middot; avg duty{" "}
              <strong style={{ color: "#fbbf24" }}>
                {data.avgDuty.toLocaleString("en", { maximumFractionDigits: 0 })} THB
              </strong>
            </>
          )}
        </div>
      </div>
      {data.commonHsCodes?.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: 4,
            flexWrap: "wrap",
          }}
        >
          {data.commonHsCodes.slice(0, 3).map((hs) => (
            <span
              key={hs.code}
              style={{
                fontSize: 8,
                background: "rgba(255,255,255,0.04)",
                borderRadius: 4,
                padding: "2px 5px",
                color: "#64748b",
                fontFamily: "monospace",
              }}
            >
              {hs.code.slice(0, 4)}.{hs.code.slice(4, 6)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
