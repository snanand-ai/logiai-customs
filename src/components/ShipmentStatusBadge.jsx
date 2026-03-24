/**
 * ShipmentStatusBadge — Colored status pill for shipment status
 */

const STATUS_CONFIG = {
  draft: { label: "Draft", color: "#5a5a7a", bg: "#f0eff5" },
  documentsUploaded: { label: "Docs Uploaded", color: "#2563eb", bg: "#eff6ff" },
  itemsReviewed: { label: "Items Reviewed", color: "#b45309", bg: "#fffbeb" },
  declared: { label: "Declared", color: "#1a2a5e", bg: "#eef2ff" },
  filed: { label: "Filed", color: "#15803d", bg: "#f0fdf4" },
};

export default function ShipmentStatusBadge({ status, size = "sm" }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  const isLg = size === "lg";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: isLg ? 11 : 9,
        fontWeight: 700,
        color: config.color,
        background: config.bg,
        border: `1px solid ${config.color}30`,
        borderRadius: 10,
        padding: isLg ? "4px 12px" : "2px 8px",
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: isLg ? 6 : 5,
          height: isLg ? 6 : 5,
          borderRadius: "50%",
          background: config.color,
          opacity: 0.7,
        }}
      />
      {config.label}
    </span>
  );
}
