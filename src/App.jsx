import { useState, useEffect, useCallback } from "react";
import Icons from "./components/Icons";
import DashboardPage from "./components/DashboardPage";
import ShipmentWorkspace from "./components/ShipmentWorkspace";
import IntelligencePage from "./components/IntelligencePage";
import { createShipment } from "./services/ShipmentService";
import { runMigrations } from "./services/migrate";
import { s } from "./constants/styles";

export default function App() {
  const [currentShipmentId, setCurrentShipmentId] = useState(null);
  const [page, setPage] = useState("dashboard"); // "dashboard" | "shipment" | "intelligence"
  const [ready, setReady] = useState(false);

  useEffect(() => {
    runMigrations()
      .catch((err) => console.warn("[App] Migration error:", err))
      .finally(() => setReady(true));
  }, []);

  const handleNewShipment = useCallback(async () => {
    const ship = await createShipment();
    setCurrentShipmentId(ship.id);
    setPage("shipment");
  }, []);

  const handleOpenShipment = useCallback((id) => {
    setCurrentShipmentId(id);
    setPage("shipment");
  }, []);

  const handleBack = useCallback(() => {
    setCurrentShipmentId(null);
    setPage("dashboard");
  }, []);

  if (!ready) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "#f0eff5",
        color: "#5a5a7a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Sarabun', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}>
        Loading...
      </div>
    );
  }

  const navBtnStyle = (active) => ({
    background: active ? "rgba(198,149,46,0.2)" : "rgba(255,255,255,0.1)",
    border: active ? "1px solid rgba(198,149,46,0.4)" : "1px solid rgba(255,255,255,0.2)",
    color: active ? "#e8d5a3" : "rgba(255,255,255,0.7)",
    borderRadius: 6,
    padding: "6px 12px",
    fontSize: 11,
    fontWeight: 600,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontFamily: "'Sarabun', sans-serif",
  });

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f0eff5",
      color: "#1a1a2e",
      fontFamily: "'Sarabun', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      {/* Navigation bar */}
      <div style={{
        background: "linear-gradient(135deg, #1a2a5e 0%, #2a3f7e 60%, #1a2a5e 100%)",
        borderBottom: "3px solid #c6952e",
        padding: "10px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div
          style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}
          onClick={handleBack}
        >
          <div style={{
            width: 38, height: 38, borderRadius: 6,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="38" height="38" viewBox="0 0 40 40" fill="none">
              {/* Circuit arrow — LogiAI brand mark */}
              <path d="M22 8L30 20L22 32" stroke="#e8b931" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 12L24 20L16 28" stroke="#1a6b7a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="8" cy="12" r="2" fill="#1a2a5e"/>
              <line x1="10" y1="12" x2="16" y2="12" stroke="#1a2a5e" strokeWidth="1.5"/>
              <circle cx="8" cy="20" r="2" fill="#1a6b7a"/>
              <line x1="10" y1="20" x2="16" y2="20" stroke="#1a6b7a" strokeWidth="1.5"/>
              <circle cx="8" cy="28" r="2" fill="#1a2a5e"/>
              <line x1="10" y1="28" x2="16" y2="28" stroke="#1a2a5e" strokeWidth="1.5"/>
              <circle cx="5" cy="16" r="1.5" fill="#1a6b7a"/>
              <line x1="6.5" y1="16" x2="12" y2="16" stroke="#1a6b7a" strokeWidth="1"/>
              <circle cx="5" cy="24" r="1.5" fill="#1a6b7a"/>
              <line x1="6.5" y1="24" x2="12" y2="24" stroke="#1a6b7a" strokeWidth="1"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#ffffff", lineHeight: 1.1 }}>
              Logi<span style={{ color: "#e8b931", fontWeight: 700 }}>AI</span><sup style={{ fontSize: 8, color: "#e8b931", verticalAlign: "super" }}>m</sup>
            </div>
            <div style={{ fontSize: 10, color: "#e8b931", letterSpacing: "0.08em", fontWeight: 600 }}>
              Flow Forward
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={handleBack} style={navBtnStyle(page === "dashboard")}>
            {Icons.grid({ sz: 13 })} Dashboard
          </button>
          <button onClick={() => { setCurrentShipmentId(null); setPage("intelligence"); }} style={navBtnStyle(page === "intelligence")}>
            {Icons.zap({ sz: 13 })} OM
          </button>
          <button
            onClick={handleNewShipment}
            style={{
              background: "linear-gradient(135deg, #c6952e, #e8d5a3)",
              color: "#1a2a5e",
              border: "none",
              borderRadius: 6,
              padding: "6px 14px",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              boxShadow: "0 2px 8px rgba(198,149,46,0.3)",
              fontFamily: "'Sarabun', sans-serif",
            }}
          >
            {Icons.plus({ sz: 13 })} New Shipment
          </button>
        </div>
      </div>

      {/* Page content */}
      <div style={{ maxWidth: 1360, margin: "0 auto", padding: 24 }}>
        {page === "shipment" && currentShipmentId ? (
          <ShipmentWorkspace
            key={currentShipmentId}
            shipmentId={currentShipmentId}
            onBack={handleBack}
          />
        ) : page === "intelligence" ? (
          <IntelligencePage onBack={handleBack} />
        ) : (
          <DashboardPage
            onNewShipment={handleNewShipment}
            onOpenShipment={handleOpenShipment}
          />
        )}
      </div>

      {/* Global styles */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        select { outline: none; appearance: auto; }
        select option { background: #ffffff; color: #1a1a2e; }
        input[type="number"]::-webkit-inner-spin-button { opacity: 0.5; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #e8e7ed; }
        ::-webkit-scrollbar-thumb { background: #b0aec0; border-radius: 3px; }
        button:hover { filter: brightness(1.05); }
        button:active { transform: scale(0.98); }
        input:focus, select:focus { border-color: #1a2a5e !important; box-shadow: 0 0 0 2px rgba(26,42,94,0.12); }
      `}</style>
    </div>
  );
}
