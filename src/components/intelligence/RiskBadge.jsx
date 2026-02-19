/**
 * RiskBadge — Risk indicator for items
 *
 * Shows colored badges based on item risk level:
 * - Green: valid HS code, has history
 * - Amber: valid HS but no history
 * - Red: no HS code or invalid
 */

export default function RiskBadge({ item, hasHistory }) {
  const hsClean = (item.hs || "").replace(/[\s.\-]/g, "");
  const hasHs = hsClean.length >= 8;
  const isOk = item.ok;

  let color, bg, label;

  if (hasHs && isOk) {
    if (hasHistory) {
      color = "#34d399";
      bg = "rgba(52,211,153,0.1)";
      label = "OK";
    } else {
      color = "#fbbf24";
      bg = "rgba(251,191,36,0.1)";
      label = "New";
    }
  } else if (hasHs && !isOk) {
    color = "#fbbf24";
    bg = "rgba(251,191,36,0.1)";
    label = "Unverified";
  } else if (hsClean.length > 0 && hsClean.length < 8) {
    color = "#f97316";
    bg = "rgba(249,115,22,0.1)";
    label = "Partial";
  } else {
    color = "#f87171";
    bg = "rgba(248,113,113,0.1)";
    label = "Missing";
  }

  return (
    <span
      style={{
        display: "inline-block",
        fontSize: 8,
        fontWeight: 700,
        color,
        background: bg,
        border: `1px solid ${color}22`,
        borderRadius: 8,
        padding: "1px 6px",
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}
