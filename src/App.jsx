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

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f0eff5",
      color: "#1a1a2e",
      fontFamily: "'Sarabun', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      {/* Navigation bar — Thai Customs Official */}
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
            width: 36, height: 36, borderRadius: 6,
            background: "linear-gradient(135deg, #c6952e, #e8d5a3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 2px 8px rgba(198,149,46,0.3)",
          }}>
            {Icons.box({ sz: 18, c: "#1a2a5e" })}
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: "#ffffff" }}>
              LogiAI <span style={{ color: "#e8d5a3", fontWeight: 500 }}>Customs</span>
            </div>
            <div style={{ fontSize: 9, color: "#c6952e", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600 }}>
              Thailand Customs Declaration System
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {currentShipmentId && (
            <button
              onClick={handleBack}
              style={{
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "#e8d5a3",
                borderRadius: 6,
                padding: "6px 12px",
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontFamily: "'Sarabun', sans-serif",
              }}
            >
              {Icons.grid({ sz: 13 })} Dashboard
            </button>
          )}
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
