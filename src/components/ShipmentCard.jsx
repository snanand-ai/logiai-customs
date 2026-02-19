/**
 * ShipmentCard — Dashboard card for a single shipment
 */

import Icons from "./Icons";
import ShipmentStatusBadge from "./ShipmentStatusBadge";
import { s } from "../constants/styles";

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export default function ShipmentCard({ shipment, onClick }) {
  const { hdr, items, status, updatedAt, createdAt } = shipment;
  const label =
    hdr.customer || hdr.consignee || (hdr.blNo ? `B/L ${hdr.blNo}` : `Shipment`);

  return (
    <div
      onClick={onClick}
      style={{
        ...s.card,
        cursor: "pointer",
        transition: "all .15s ease",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(52,211,153,0.2)";
        e.currentTarget.style.transform = "translateY(-1px)";
        e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.2)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Top row: label + status */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 10,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "#e2e8f0",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {label}
          </div>
          {hdr.blNo && hdr.customer && (
            <div
              style={{
                fontSize: 10,
                color: "#64748b",
                marginTop: 2,
                fontFamily: "monospace",
              }}
            >
              {hdr.blNo}
            </div>
          )}
        </div>
        <ShipmentStatusBadge status={status} />
      </div>

      {/* Details row */}
      <div
        style={{
          display: "flex",
          gap: 12,
          fontSize: 10,
          color: "#64748b",
          marginBottom: 8,
        }}
      >
        {hdr.origin && (
          <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
            {Icons.anchor({ sz: 10, c: "#64748b" })}
            {hdr.origin} → {hdr.pod || "TH"}
          </span>
        )}
        {items.length > 0 && (
          <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
            {Icons.grid({ sz: 10, c: "#64748b" })}
            {items.length} items
          </span>
        )}
        {hdr.priv && hdr.priv !== "NONE" && (
          <span
            style={{
              color: "#34d399",
              fontWeight: 600,
            }}
          >
            {Icons.shield({ sz: 10, c: "#34d399" })}
            {hdr.priv}
          </span>
        )}
      </div>

      {/* Footer: time */}
      <div
        style={{
          fontSize: 9,
          color: "#475569",
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        {Icons.file({ sz: 9, c: "#475569" })}
        {timeAgo(updatedAt || createdAt)}
      </div>
    </div>
  );
}
