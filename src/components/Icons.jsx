const SvgIcon = ({ d, sz = 18, c = "currentColor" }) => (
  <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const Icons = {
  upload: (p = {}) => <SvgIcon {...p} d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />,
  plus: (p = {}) => <SvgIcon {...p} d="M12 5v14M5 12h14" />,
  search: (p = {}) => <SvgIcon {...p} d="M11 3a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM21 21l-4.35-4.35" />,
  zap: (p = {}) => <SvgIcon {...p} d="M13 2L3 14h9l-1 8 10-12h-9l1-8" />,
  check: (p = {}) => <SvgIcon {...p} d="M20 6L9 17l-5-5" />,
  file: (p = {}) => <SvgIcon {...p} d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6" />,
  trash: (p = {}) => <SvgIcon {...p} d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />,
  shield: (p = {}) => <SvgIcon {...p} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
  box: (p = {}) => <SvgIcon {...p} d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />,
  db: (p = {}) => <SvgIcon {...p} d="M12 2C6.5 2 2 4.2 2 7s4.5 5 10 5 10-2.2 10-5-4.5-5-10-5zM2 7v5c0 2.8 4.5 5 10 5s10-2.2 10-5V7M2 12v5c0 2.8 4.5 5 10 5s10-2.2 10-5v-5" />,
  x: (p = {}) => <SvgIcon {...p} d="M18 6L6 18M6 6l12 12" />,
  copy: (p = {}) => <SvgIcon {...p} d="M20 9h-9a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2zM5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />,
  alert: (p = {}) => <SvgIcon {...p} d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01" />,
  grid: (p = {}) => <SvgIcon {...p} d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" />,
  ship: (p = {}) => <SvgIcon {...p} d="M2 20l.5-1.5A2.5 2.5 0 0 1 5 17h14a2.5 2.5 0 0 1 2.5 1.5L22 20M6 17V4h12v13M12 4v5m-4-2l4-3 4 3" />,
  dollar: (p = {}) => <SvgIcon {...p} d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />,
  anchor: (p = {}) => <SvgIcon {...p} d="M12 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM12 8v14M5 12H2a10 10 0 0 0 20 0h-3" />,
  book: (p = {}) => <SvgIcon {...p} d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z" />,
};

export default Icons;
