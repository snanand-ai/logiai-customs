/**
 * DashboardPage — Pipeline view of all shipments
 *
 * New landing page. Shows all shipments grouped by status,
 * with a "New Shipment" button and quick stats.
 */

import { useState, useEffect } from "react";
import { listShipments, deleteShipment } from "../services/ShipmentService";
import { getPrivilegeSavings } from "../services/IntelligenceService";
import ShipmentCard from "./ShipmentCard";
import ShipmentStatusBadge from "./ShipmentStatusBadge";
import Icons from "./Icons";
import { s } from "../constants/styles";
import { SHIPMENT_STATUSES } from "../services/dbSchema";

const STATUS_LABELS = {
  draft: "Draft",
  documentsUploaded: "Docs Uploaded",
  itemsReviewed: "Items Reviewed",
  declared: "Declared",
  filed: "Filed",
};

export default function DashboardPage({ onNewShipment, onOpenShipment }) {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savings, setSavings] = useState(null);
  const [view, setView] = useState("all"); // "all" | status filter

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [list, sav] = await Promise.all([
        listShipments(),
        getPrivilegeSavings(),
      ]);
      setShipments(list);
      setSavings(sav);
    } catch (err) {
      console.warn("[Dashboard] Load failed:", err);
    }
    setLoading(false);
  }

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    await deleteShipment(id);
    setShipments((prev) => prev.filter((s) => s.id !== id));
  };

  // Group shipments by status
  const grouped = {};
  for (const status of SHIPMENT_STATUSES) {
    grouped[status] = [];
  }
  for (const s of shipments) {
    if (grouped[s.status]) {
      grouped[s.status].push(s);
    } else {
      grouped.draft.push(s);
    }
  }

  const filtered =
    view === "all" ? shipments : shipments.filter((s) => s.status === view);

  const totalItems = shipments.reduce((sum, s) => sum + (s.items?.length || 0), 0);

  return (
    <div style={{ animation: "fadeIn .3s ease" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "#e2e8f0",
              margin: 0,
            }}
          >
            Shipment Pipeline
          </h1>
          <p
            style={{
              fontSize: 12,
              color: "#64748b",
              margin: "4px 0 0",
            }}
          >
            {shipments.length} shipments &middot; {totalItems} total items
          </p>
        </div>
        <button onClick={onNewShipment} style={s.btnPrimary}>
          {Icons.plus({ sz: 14 })} New Shipment
        </button>
      </div>

      {/* Quick stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 12,
          marginBottom: 24,
        }}
      >
        {SHIPMENT_STATUSES.map((status) => (
          <button
            key={status}
            onClick={() => setView(view === status ? "all" : status)}
            style={{
              ...s.card,
              cursor: "pointer",
              padding: "14px 16px",
              textAlign: "left",
              border:
                view === status
                  ? "1px solid rgba(52,211,153,0.3)"
                  : "1px solid rgba(255,255,255,0.06)",
              background:
                view === status
                  ? "rgba(52,211,153,0.05)"
                  : "rgba(255,255,255,0.025)",
              transition: "all .15s",
            }}
          >
            <div
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: "#e2e8f0",
                marginBottom: 4,
              }}
            >
              {grouped[status].length}
            </div>
            <ShipmentStatusBadge status={status} />
          </button>
        ))}
      </div>

      {/* Privilege savings banner */}
      {savings && savings.totalSaved > 0 && (
        <div
          style={{
            ...s.card,
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 24,
            border: "1px solid rgba(52,211,153,0.12)",
            background: "rgba(52,211,153,0.04)",
            padding: "12px 20px",
          }}
        >
          {Icons.shield({ sz: 18, c: "#34d399" })}
          <div>
            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>
              Total Privilege Savings
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "#34d399",
                fontFamily: "monospace",
              }}
            >
              {savings.totalSaved.toLocaleString("en", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              <span style={{ fontSize: 11, color: "#64748b", fontWeight: 400 }}>
                THB
              </span>
            </div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            {Object.entries(savings.byScheme || {})
              .sort((a, b) => b[1] - a[1])
              .slice(0, 4)
              .map(([scheme, amt]) => (
                <span
                  key={scheme}
                  style={{
                    fontSize: 9,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 6,
                    padding: "3px 8px",
                    color: "#94a3b8",
                  }}
                >
                  <strong style={{ color: "#e2e8f0" }}>{scheme}</strong>{" "}
                  {amt.toLocaleString("en", { maximumFractionDigits: 0 })}
                </span>
              ))}
          </div>
        </div>
      )}

      {/* Shipment list */}
      {loading ? (
        <div
          style={{
            textAlign: "center",
            padding: 60,
            color: "#64748b",
            fontSize: 13,
          }}
        >
          Loading shipments...
        </div>
      ) : filtered.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "60px 20px",
            color: "#475569",
          }}
        >
          <div style={{ marginBottom: 12 }}>
            {Icons.ship({ sz: 40, c: "#1e293b" })}
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#64748b", marginBottom: 6 }}>
            {view === "all"
              ? "No shipments yet"
              : `No ${STATUS_LABELS[view]?.toLowerCase()} shipments`}
          </div>
          <div style={{ fontSize: 12, color: "#475569", marginBottom: 16 }}>
            {view === "all"
              ? "Create your first shipment to get started"
              : "Try a different filter or create a new shipment"}
          </div>
          {view === "all" && (
            <button onClick={onNewShipment} style={s.btnPrimary}>
              {Icons.plus({ sz: 14 })} New Shipment
            </button>
          )}
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 12,
          }}
        >
          {filtered.map((ship) => (
            <div key={ship.id} style={{ position: "relative" }}>
              <ShipmentCard
                shipment={ship}
                onClick={() => onOpenShipment(ship.id)}
              />
              {ship.status === "draft" && (
                <button
                  onClick={(e) => handleDelete(e, ship.id)}
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    background: "none",
                    border: "none",
                    color: "#475569",
                    cursor: "pointer",
                    padding: 4,
                    opacity: 0.5,
                    zIndex: 2,
                  }}
                  title="Delete draft"
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.5")}
                >
                  {Icons.trash({ sz: 12 })}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
