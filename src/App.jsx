import { useState, useEffect, useCallback } from "react";
import Icons from "./components/Icons";
import DashboardPage from "./components/DashboardPage";
import ShipmentWorkspace from "./components/ShipmentWorkspace";
import { createShipment } from "./services/ShipmentService";
import { runMigrations } from "./services/migrate";
import { s } from "./constants/styles";

export default function App() {
  const [currentShipmentId, setCurrentShipmentId] = useState(null);
  const [ready, setReady] = useState(false);

  // Run migrations on mount
  useEffect(() => {
    runMigrations()
      .catch((err) => console.warn("[App] Migration error:", err))
      .finally(() => setReady(true));
  }, []);

  const handleNewShipment = useCallback(async () => {
    const ship = await createShipment();
    setCurrentShipmentId(ship.id);
  }, []);

  const handleOpenShipment = useCallback((id) => {
    setCurrentShipmentId(id);
  }, []);

  const handleBack = useCallback(() => {
    setCurrentShipmentId(null);
  }, []);

  if (!ready) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg, #070b14 0%, #0f172a 50%, #0c1220 100%)",
        color: "#64748b",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #070b14 0%, #0f172a 50%, #0c1220 100%)",
      color: "#e2e8f0",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      {/* Navigation bar */}
      <div style={{
        background: "linear-gradient(135deg, rgba(6,95,70,0.35) 0%, rgba(15,23,42,0.95) 40%, rgba(30,58,138,0.25) 100%)",
        borderBottom: "1px solid rgba(52,211,153,0.12)", padding: "10px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div
          style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
          onClick={handleBack}
        >
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
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {currentShipmentId && (
            <button
              onClick={handleBack}
              style={{
                ...s.btnGhost,
                fontWeight: 600, fontSize: 11, padding: "6px 12px",
              }}
            >
              {Icons.grid({ sz: 13 })} Dashboard
            </button>
          )}
          <button
            onClick={handleNewShipment}
            style={{
              ...s.btnPrimary,
              padding: "6px 14px",
              fontSize: 11,
            }}
          >
            {Icons.plus({ sz: 13 })} New Shipment
          </button>
        </div>
      </div>

      {/* Page content */}
      <div style={{ maxWidth: 1360, margin: "0 auto", padding: 24 }}>
        {currentShipmentId ? (
          <ShipmentWorkspace
            key={currentShipmentId}
            shipmentId={currentShipmentId}
            onBack={handleBack}
          />
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
