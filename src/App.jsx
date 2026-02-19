import { useState, useCallback } from "react";
import Icons from "./components/Icons";
import UploadPage from "./components/UploadPage";
import ShipmentPage from "./components/ShipmentPage";
import ItemsPage from "./components/ItemsPage";
import MasterDataPage from "./components/MasterDataPage";
import DeclarationPage from "./components/DeclarationPage";
import { s } from "./constants/styles";

const INITIAL_HEADER = {
  blNo: "", vessel: "", voyage: "", pol: "", pod: "",
  shipper: "", consignee: "", taxId: "", broker: "",
  incoterm: "CIF", currency: "USD", fx: 32.61,
  pkgs: 0, pkgUnit: "CARTON", eta: "",
  invNo: "", invDate: "", origin: "CN",
  freight: 0, insurance: 0, priv: "NONE", permit: "", ctr: "",
  customer: "",
};

export default function App() {
  const [page, setPage] = useState("upload");
  const [toast, setToast] = useState(null);

  const msg = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  // Document state
  const [docs, setDocs] = useState({ ci: null, bl: null, master: null, freight: null, drkw: null, other: [] });
  const [uploadLog, setUploadLog] = useState([]);

  // Shipment header
  const [hdr, setHdr] = useState(INITIAL_HEADER);
  const sH = (key, value) => setHdr((prev) => ({ ...prev, [key]: value }));

  // Line items
  const [items, setItems] = useState([]);

  // Master data (part# -> { hs, th, duty, org })
  const [md, setMd] = useState({});

  // Auto-match items against master data
  const autoMatch = useCallback(() => {
    let matched = 0, unmatched = 0;
    setItems((prev) =>
      prev.map((item) => {
        const data = md[item.pn];
        if (data) {
          matched++;
          return { ...item, hs: data.hs, th: data.th, duty: data.duty, org: data.org, ok: true };
        }
        if (item.pn) unmatched++;
        return { ...item, ok: false };
      })
    );
    msg(`Matched ${matched}. ${unmatched} unmatched.`, unmatched > 0 ? "warning" : "success");
  }, [md]);

  const mdArr = Object.entries(md);

  const navItems = [
    { key: "upload", label: "Upload", icon: Icons.upload },
    { key: "shipment", label: "Shipment", icon: Icons.ship },
    { key: "items", label: "Items", icon: Icons.grid, badge: items.length || null },
    { key: "master", label: "Master Data", icon: Icons.db, badge: mdArr.length || null },
    { key: "declaration", label: "Declaration", icon: Icons.file },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #070b14 0%, #0f172a 50%, #0c1220 100%)", color: "#e2e8f0", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {/* Toast notification */}
      {toast && (
        <div style={{
          position: "fixed", top: 16, right: 16, zIndex: 999,
          background: toast.type === "error" ? "#7f1d1d" : toast.type === "warning" ? "#78350f" : "#064e3b",
          border: `1px solid ${toast.type === "error" ? "#dc2626" : toast.type === "warning" ? "#f59e0b" : "#10b981"}`,
          color: "#fff", padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600,
          boxShadow: "0 8px 30px rgba(0,0,0,0.4)", animation: "slideIn .3s ease",
        }}>
          {toast.message}
        </div>
      )}

      {/* Navigation bar */}
      <div style={{
        background: "linear-gradient(135deg, rgba(6,95,70,0.35) 0%, rgba(15,23,42,0.95) 40%, rgba(30,58,138,0.25) 100%)",
        borderBottom: "1px solid rgba(52,211,153,0.12)", padding: "10px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 7,
            background: "linear-gradient(135deg, #10b981, #059669)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 18px rgba(16,185,129,0.25)",
          }}>
            {Icons.box({ sz: 16 })}
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>
              LogiAI <span style={{ color: "#34d399", fontWeight: 400 }}>Customs</span>
            </div>
            <div style={{ fontSize: 9, color: "#6ee7b7", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Thailand Import Declaration
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 3 }}>
          {navItems.map((nav) => (
            <button
              key={nav.key}
              onClick={() => setPage(nav.key)}
              style={{
                ...s.btnGhost,
                fontWeight: 600, fontSize: 11, padding: "6px 12px",
                background: page === nav.key ? "rgba(16,185,129,0.12)" : "rgba(255,255,255,0.02)",
                color: page === nav.key ? "#34d399" : "#64748b",
                border: `1px solid ${page === nav.key ? "rgba(52,211,153,0.25)" : "rgba(255,255,255,0.04)"}`,
              }}
            >
              {nav.icon({ sz: 13 })} {nav.label}
              {nav.badge != null && (
                <span style={{ fontSize: 9, background: "rgba(52,211,153,0.2)", color: "#34d399", padding: "1px 5px", borderRadius: 10, marginLeft: 3 }}>
                  {nav.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Page content */}
      <div style={{ maxWidth: 1360, margin: "0 auto", padding: 24 }}>
        {page === "upload" && (
          <UploadPage
            docs={docs} setDocs={setDocs}
            uploadLog={uploadLog} setUploadLog={setUploadLog}
            items={items} setItems={setItems}
            md={md} setMd={setMd}
            hdr={hdr} setHdr={setHdr} msg={msg} setPg={setPage}
          />
        )}
        {page === "shipment" && (
          <ShipmentPage hdr={hdr} sH={sH} setPg={setPage} />
        )}
        {page === "items" && (
          <ItemsPage
            items={items} setItems={setItems}
            md={md} hdr={hdr}
            autoMatch={autoMatch}
            ciFile={docs.ci ? { st: "done", name: docs.ci.name } : null}
            setPg={setPage}
          />
        )}
        {page === "master" && (
          <MasterDataPage md={md} setMd={setMd} msg={msg} />
        )}
        {page === "declaration" && (
          <DeclarationPage items={items} hdr={hdr} setPg={setPage} />
        )}
      </div>

      {/* Global styles */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        select { outline: none; appearance: auto; }
        select option { background: #1e293b; color: #e2e8f0; }
        input[type="number"]::-webkit-inner-spin-button { opacity: 0.3; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: rgba(255,255,255,0.01); }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.07); border-radius: 3px; }
        button:hover { filter: brightness(1.1); }
        button:active { transform: scale(0.98); }
      `}</style>
    </div>
  );
}
