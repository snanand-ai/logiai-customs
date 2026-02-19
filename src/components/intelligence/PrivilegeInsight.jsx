/**
 * PrivilegeInsight — Privilege savings summary widget
 *
 * Shows total duty savings from using FTA/privilege schemes.
 * Used in DeclarationPage summary and dashboard.
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
        background: "rgba(52,211,153,0.06)",
        border: "1px solid rgba(52,211,153,0.12)",
        borderRadius: 10,
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
        {Icons.shield({ sz: 14, c: "#34d399" })}
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "#34d399",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Privilege Savings
        </span>
        <span
          style={{
            fontSize: 10,
            color: "#64748b",
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
          color: "#34d399",
          marginBottom: 8,
          fontFamily: "monospace",
        }}
      >
        {data.totalSaved.toLocaleString("en", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}{" "}
        <span style={{ fontSize: 11, fontWeight: 400, color: "#64748b" }}>
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
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 6,
                padding: "3px 8px",
                color: "#94a3b8",
              }}
            >
              <strong style={{ color: "#e2e8f0" }}>{scheme}</strong>{" "}
              {amount.toLocaleString("en", { maximumFractionDigits: 0 })}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
