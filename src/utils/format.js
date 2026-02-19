export const fmt = (n, d = 2) =>
  Number(n || 0).toLocaleString("en-US", {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  });

export const fmtThb = (n) => "฿" + fmt(n);

export const uid = () => Math.random().toString(36).slice(2, 9);
