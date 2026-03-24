/**
 * HsInsight — Inline widget showing HS code usage stats
 */

import { useState, useEffect } from "react";
import Icons from "../Icons";

export default function HsInsight({ hsCode, getInsight }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!hsCode || hsCode.replace(/[\s.\-]/g, "").length < 4 || !getInsight) {
      setData(null);
      return;
    }
    let cancelled = false;
    getInsight(hsCode).then((d) => {
      if (!cancelled) setData(d);
    });
    return () => { cancelled = true; };
  }, [hsCode, getInsight]);

  if (!data) return null;

  const timeAgo = data.lastUsed ? _timeAgo(new Date(data.lastUsed)) : null;

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        background: "#fffbeb",
        border: "1px solid #fde68a",
        borderRadius: 10,
        padding: "2px 8px",
        fontSize: 9,
        color: "#b45309",
        whiteSpace: "nowrap",
        animation: "fadeIn .2s ease",
      }}
      title={
        data.commonCustomers?.length
          ? `Used by: ${data.commonCustomers.map((c) => c.name).join(", ")}`
          : undefined
      }
    >
      {Icons.zap({ sz: 9, c: "#b45309" })}
      <span style={{ fontWeight: 700 }}>{data.timesUsed}x</span>
      {timeAgo && (
        <span style={{ color: "#8a8aa0" }}>
          {timeAgo}
        </span>
      )}
      {data.avgDuty != null && (
        <span style={{ color: "#5a5a7a" }}>
          avg {data.avgDuty.toFixed(1)}%
        </span>
      )}
    </div>
  );
}

function _timeAgo(date) {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}
