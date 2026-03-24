/**
 * DashboardPage — Pipeline view of all shipments
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
  const [view, setView] = useState("all");

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
              color: "#1a2a5e",
              margin: 0,
            }}
          >
            Shipment Pipeline
          </h1>
          <p
            style={{
              fontSize: 12,
              color: "#5a5a7a",
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
              background: view === status ? "#eef2ff" : "#ffffff",
              border: view === status
                ? "1px solid #1a2a5e"
                : "1px solid #d4d2e0",
              borderTop: view === status
                ? "3px solid #c6952e"
                : "3px solid #d4d2e0",
              borderRadius: 8,
              cursor: "pointer",
              padding: "14px 16px",
              textAlign: "left",
              transition: "all .15s",
              boxShadow: view === status
                ? "0 2px 8px rgba(26,42,94,0.12)"
                : "0 1px 4px rgba(26,42,94,0.04)",
              fontFamily: "'Sarabun', sans-serif",
            }}
          >
            <div
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: "#1a2a5e",
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
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderLeft: "4px solid #15803d",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 24,
            padding: "12px 20px",
          }}
        >
          {Icons.shield({ sz: 18, c: "#15803d" })}
          <div>
            <div style={{ fontSize: 11, color: "#5a5a7a", fontWeight: 600 }}>
              Total Privilege Savings
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "#15803d",
                fontFamily: "monospace",
              }}
            >
              {savings.totalSaved.toLocaleString("en", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              <span style={{ fontSize: 11, color: "#5a5a7a", fontWeight: 400 }}>
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
                    background: "#ffffff",
                    border: "1px solid #d4d2e0",
                    borderRadius: 6,
                    padding: "3px 8px",
                    color: "#5a5a7a",
                  }}
                >
                  <strong style={{ color: "#1a2a5e" }}>{scheme}</strong>{" "}
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
            color: "#5a5a7a",
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
            color: "#5a5a7a",
          }}
        >
          <div style={{ marginBottom: 12 }}>
            {Icons.ship({ sz: 40, c: "#d4d2e0" })}
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#1a2a5e", marginBottom: 6 }}>
            {view === "all"
              ? "No shipments yet"
              : `No ${STATUS_LABELS[view]?.toLowerCase()} shipments`}
          </div>
          <div style={{ fontSize: 12, color: "#5a5a7a", marginBottom: 16 }}>
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
                    top: 12,
                    right: 8,
                    background: "none",
                    border: "none",
                    color: "#8a8aa0",
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
