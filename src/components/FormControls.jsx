const styles = {
  input: {
    background: "rgba(0,0,0,0.25)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 6,
    color: "#e2e8f0",
    padding: "8px 12px",
    fontSize: 13,
    width: "100%",
    outline: "none",
    boxSizing: "border-box",
  },
  label: {
    fontSize: 10,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    marginBottom: 4,
    display: "block",
    fontWeight: 600,
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
