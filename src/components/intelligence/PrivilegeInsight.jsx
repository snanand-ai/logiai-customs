/**
 * PrivilegeInsight — Privilege savings summary widget
 */

import { useState, useEffect } from "react";
import Icons from "../Icons";

export default function PrivilegeInsight({ loadSavings }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!loadSavings) return;
    loadSavings().then(setData);
  }, [loadSavings]);

  if (!data || data.declarationsCount === 0) return null;

  const topSchemes = Object.entries(data.byScheme || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return (
    <div
      style={{
        background: "#f0fdf4",
        border: "1px solid #bbf7d0",
        borderLeft: "4px solid #15803d",
        borderRadius: 8,
        padding: "12px 16px",
        animation: "fadeIn .2s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 8,
        }}
      >
        {Icons.shield({ sz: 14, c: "#15803d" })}
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "#15803d",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Privilege Savings
        </span>
        <span
          style={{
            fontSize: 10,
            color: "#5a5a7a",
            marginLeft: "auto",
          }}
        >
          {data.declarationsCount} declarations
        </span>
      </div>

      <div
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: "#15803d",
          marginBottom: 8,
          fontFamily: "monospace",
        }}
      >
        {data.totalSaved.toLocaleString("en", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}{" "}
        <span style={{ fontSize: 11, fontWeight: 400, color: "#5a5a7a" }}>
          THB saved
        </span>
      </div>

      {topSchemes.length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {topSchemes.map(([scheme, amount]) => (
            <span
              key={scheme}
              style={{
                fontSize: 9,
                background: "#ffffff",
                border: "1px solid #d4d2e0",
                borderRadius: 6,
                padding: "3px 8px",
                color: "#5a5a7a",
              }}
            >
              <strong style={{ color: "#1a2a5e" }}>{scheme}</strong>{" "}
              {amount.toLocaleString("en", { maximumFractionDigits: 0 })}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
