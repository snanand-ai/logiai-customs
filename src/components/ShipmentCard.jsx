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
        e.currentTarget.style.borderColor = "#c6952e";
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 6px 20px rgba(26,42,94,0.12)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#d4d2e0";
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 2px 8px rgba(26,42,94,0.06)";
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
              color: "#1a2a5e",
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
                color: "#5a5a7a",
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
          color: "#5a5a7a",
          marginBottom: 8,
        }}
      >
        {hdr.origin && (
          <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
            {Icons.anchor({ sz: 10, c: "#5a5a7a" })}
            {hdr.origin} → {hdr.pod || "TH"}
          </span>
        )}
        {items.length > 0 && (
          <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
            {Icons.grid({ sz: 10, c: "#5a5a7a" })}
            {items.length} items
          </span>
        )}
        {hdr.priv && hdr.priv !== "NONE" && (
          <span
            style={{
              color: "#15803d",
              fontWeight: 600,
            }}
          >
            {Icons.shield({ sz: 10, c: "#15803d" })}
            {hdr.priv}
          </span>
        )}
      </div>

      {/* Footer: time */}
      <div
        style={{
          fontSize: 9,
          color: "#8a8aa0",
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        {Icons.file({ sz: 9, c: "#8a8aa0" })}
        {timeAgo(updatedAt || createdAt)}
      </div>
    </div>
  );
}
