/**
 * LaneInsight — Trade lane statistics widget
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
        background: "#eef2ff",
        border: "1px solid #c7d2fe",
        borderRadius: 8,
        padding: "8px 14px",
        fontSize: 11,
        animation: "fadeIn .2s ease",
      }}
    >
      {Icons.anchor({ sz: 13, c: "#1a2a5e" })}
      <div style={{ flex: 1 }}>
        <div style={{ color: "#1a2a5e", fontWeight: 700, fontSize: 10, marginBottom: 2 }}>
          {origin?.toUpperCase()} → {(destination || "TH").toUpperCase()} lane
        </div>
        <div style={{ color: "#5a5a7a", fontSize: 10 }}>
          <strong style={{ color: "#1a1a2e" }}>{data.shipmentsCount}</strong> shipments
          {data.avgDuty > 0 && (
            <>
              {" "}&middot; avg duty{" "}
              <strong style={{ color: "#c6952e" }}>
                {data.avgDuty.toLocaleString("en", { maximumFractionDigits: 0 })} THB
              </strong>
            </>
          )}
        </div>
      </div>
      {data.commonHsCodes?.length > 0 && (
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {data.commonHsCodes.slice(0, 3).map((hs) => (
            <span
              key={hs.code}
              style={{
                fontSize: 8,
                background: "#ffffff",
                border: "1px solid #d4d2e0",
                borderRadius: 4,
                padding: "2px 5px",
                color: "#5a5a7a",
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
