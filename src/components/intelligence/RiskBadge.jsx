/**
 * RiskBadge — Risk indicator for items
 */

export default function RiskBadge({ item, hasHistory }) {
  const hsClean = (item.hs || "").replace(/[\s.\-]/g, "");
  const hasHs = hsClean.length >= 8;
  const isOk = item.ok;

  let color, bg, label, border;

  if (hasHs && isOk) {
    if (hasHistory) {
      color = "#15803d";
      bg = "#f0fdf4";
      border = "#bbf7d0";
      label = "OK";
    } else {
      color = "#b45309";
      bg = "#fffbeb";
      border = "#fde68a";
      label = "New";
    }
  } else if (hasHs && !isOk) {
    color = "#b45309";
    bg = "#fffbeb";
    border = "#fde68a";
    label = "Unverified";
  } else if (hsClean.length > 0 && hsClean.length < 8) {
    color = "#c2410c";
    bg = "#fff7ed";
    border = "#fed7aa";
    label = "Partial";
  } else {
    color = "#dc2626";
    bg = "#fef2f2";
    border = "#fecaca";
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
        border: `1px solid ${border}`,
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
