const styles = {
  input: {
    background: "#ffffff",
    border: "1px solid #d4d2e0",
    borderRadius: 6,
    color: "#1a1a2e",
    padding: "8px 12px",
    fontSize: 13,
    width: "100%",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "'Sarabun', sans-serif",
  },
  label: {
    fontSize: 10,
    color: "#8B6914",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    marginBottom: 4,
    display: "block",
    fontWeight: 700,
  },
};

export function Field({ label, value, onChange, type = "text", placeholder, style: sx, small }) {
  return (
    <div style={sx}>
      <label style={styles.label}>{label}</label>
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(type === "number" ? parseFloat(e.target.value) || 0 : e.target.value)}
        placeholder={placeholder}
        style={{ ...styles.input, ...(small ? { padding: "6px 10px", fontSize: 12 } : {}) }}
      />
    </div>
  );
}

export function Select({ label, value, onChange, options, style: sx }) {
  return (
    <div style={sx}>
      <label style={styles.label}>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={{ ...styles.input, cursor: "pointer" }}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function TextArea({ label, value, onChange, placeholder, rows = 2, style: sx }) {
  return (
    <div style={sx}>
      <label style={styles.label}>{label}</label>
      <textarea
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        style={{ ...styles.input, resize: "vertical", lineHeight: 1.4 }}
      />
    </div>
  );
}

export function Checkbox({ label, checked, onChange, style: sx }) {
  return (
    <label
      style={{
        display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
        fontSize: 12, color: "#1a1a2e", fontWeight: 500,
        ...sx,
      }}
    >
      <input
        type="checkbox"
        checked={!!checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ width: 16, height: 16, accentColor: "#1a2a5e", cursor: "pointer" }}
      />
      {label}
    </label>
  );
}
