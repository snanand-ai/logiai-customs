/**
 * ShipmentStatusBadge — Colored status pill for shipment status
 */

const STATUS_CONFIG = {
  draft: { label: "Draft", color: "#94a3b8", bg: "rgba(148,163,184,0.1)" },
  documentsUploaded: { label: "Docs Uploaded", color: "#60a5fa", bg: "rgba(96,165,250,0.1)" },
  itemsReviewed: { label: "Items Reviewed", color: "#fbbf24", bg: "rgba(251,191,36,0.1)" },
  declared: { label: "Declared", color: "#34d399", bg: "rgba(52,211,153,0.1)" },
  filed: { label: "Filed", color: "#6ee7b7", bg: "rgba(110,231,183,0.12)" },
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
        border: `1px solid ${config.color}22`,
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
