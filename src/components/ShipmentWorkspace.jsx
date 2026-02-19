/**
 * ShipmentWorkspace — Container for a single shipment
 *
 * Wraps the existing 5 pages (Upload, Shipment, Items, Master, Declaration)
 * with tab navigation and provides them state from useShipment hook.
 * This replaces the linear wizard from App.jsx.
 */

import { useState, useEffect } from "react";
import useShipment from "../hooks/useShipment";
import useIntelligence from "../hooks/useIntelligence";
import UploadPage from "./UploadPage";
import ShipmentPage from "./ShipmentPage";
import ItemsPage from "./ItemsPage";
import MasterDataPage from "./MasterDataPage";
import DeclarationPage from "./DeclarationPage";
import ShipmentStatusBadge from "./ShipmentStatusBadge";
import Icons from "./Icons";
import { s } from "../constants/styles";

const TABS = [
  { key: "upload", label: "Upload", icon: Icons.upload },
  { key: "shipment", label: "Shipment", icon: Icons.ship },
  { key: "items", label: "Items", icon: Icons.grid },
  { key: "master", label: "Master Data", icon: Icons.db },
  { key: "declaration", label: "Declaration", icon: Icons.file },
];

export default function ShipmentWorkspace({ shipmentId, onBack }) {
  const ship = useShipment(shipmentId);
  const intel = useIntelligence();
  const [tab, setTab] = useState("upload");

  // Keyboard shortcut: Escape to go back
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape" && onBack) onBack();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onBack]);

  if (ship.loading) {
    return (
      <div style={{ textAlign: "center", padding: 60, color: "#64748b" }}>
        Loading shipment...
      </div>
    );
  }

  // Helper: navigate to tab (setPg replacement)
  const setPg = (page) => setTab(page);

  // Build the label
  const label =
    ship.hdr.customer ||
    ship.hdr.consignee ||
    (ship.hdr.blNo ? `B/L ${ship.hdr.blNo}` : "New Shipment");

  return (
    <div style={{ animation: "fadeIn .2s ease" }}>
      {/* Workspace header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <button
          onClick={onBack}
          style={{
            ...s.btnGhost,
            padding: "6px 10px",
            fontSize: 11,
          }}
          title="Back to Dashboard (Esc)"
        >
          ← Back
        </button>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "#e2e8f0",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {label}
            <ShipmentStatusBadge status={ship.status} size="lg" />
          </div>
          <div style={{ fontSize: 10, color: "#475569", marginTop: 2 }}>
            {ship.items.length} items &middot; ID: {ship.id?.slice(-6)}
          </div>
        </div>
        <button
          onClick={() => ship.save()}
          style={{ ...s.btnGhost, padding: "6px 12px", fontSize: 11 }}
        >
          {Icons.check({ sz: 12, c: "#34d399" })} Save
        </button>
      </div>

      {/* Tab navigation */}
      <div
        style={{
          display: "flex",
          gap: 3,
          marginBottom: 20,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          paddingBottom: 8,
        }}
      >
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              ...s.btnGhost,
              fontWeight: 600,
              fontSize: 11,
              padding: "6px 12px",
              background:
                tab === t.key
                  ? "rgba(16,185,129,0.12)"
                  : "rgba(255,255,255,0.02)",
              color: tab === t.key ? "#34d399" : "#64748b",
              border: `1px solid ${
                tab === t.key
                  ? "rgba(52,211,153,0.25)"
                  : "rgba(255,255,255,0.04)"
              }`,
              borderBottom:
                tab === t.key
                  ? "2px solid #34d399"
                  : "2px solid transparent",
            }}
          >
            {t.icon({ sz: 13 })} {t.label}
            {t.key === "items" && ship.items.length > 0 && (
              <span
                style={{
                  fontSize: 9,
                  background: "rgba(52,211,153,0.2)",
                  color: "#34d399",
                  padding: "1px 5px",
                  borderRadius: 10,
                  marginLeft: 3,
                }}
              >
                {ship.items.length}
              </span>
            )}
            {t.key === "master" && Object.keys(ship.md).length > 0 && (
              <span
                style={{
                  fontSize: 9,
                  background: "rgba(167,139,250,0.2)",
                  color: "#a78bfa",
                  padding: "1px 5px",
                  borderRadius: 10,
                  marginLeft: 3,
                }}
              >
                {Object.keys(ship.md).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Toast */}
      {ship.toast && (
        <div
          style={{
            position: "fixed",
            top: 16,
            right: 16,
            zIndex: 999,
            background:
              ship.toast.type === "error"
                ? "#7f1d1d"
                : ship.toast.type === "warning"
                ? "#78350f"
                : "#064e3b",
            border: `1px solid ${
              ship.toast.type === "error"
                ? "#dc2626"
                : ship.toast.type === "warning"
                ? "#f59e0b"
                : "#10b981"
            }`,
            color: "#fff",
            padding: "10px 20px",
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            boxShadow: "0 8px 30px rgba(0,0,0,0.4)",
            animation: "slideIn .3s ease",
          }}
        >
          {ship.toast.message}
        </div>
      )}

      {/* Page content */}
      <div>
        {tab === "upload" && (
          <UploadPage
            docs={ship.docs}
            setDocs={ship.setDocs}
            uploadLog={ship.uploadLog}
            setUploadLog={ship.setUploadLog}
            items={ship.items}
            setItems={ship.setItems}
            md={ship.md}
            setMd={ship.setMd}
            hdr={ship.hdr}
            setHdr={ship.setHdr}
            msg={ship.msg}
            setPg={setPg}
            onStatusAdvance={() => ship.advanceStatus("documentsUploaded")}
          />
        )}
        {tab === "shipment" && (
          <ShipmentPage
            hdr={ship.hdr}
            sH={ship.sH}
            setPg={setPg}
            laneInsight={intel.laneInsight}
          />
        )}
        {tab === "items" && (
          <ItemsPage
            items={ship.items}
            setItems={ship.setItems}
            md={ship.md}
            hdr={ship.hdr}
            autoMatch={ship.autoMatch}
            ciFile={
              ship.docs.ci
                ? { st: "done", name: ship.docs.ci.name }
                : null
            }
            setPg={setPg}
            hsInsight={intel.hsInsight}
            onStatusAdvance={() => ship.advanceStatus("itemsReviewed")}
          />
        )}
        {tab === "master" && (
          <MasterDataPage md={ship.md} setMd={ship.setMd} msg={ship.msg} />
        )}
        {tab === "declaration" && (
          <DeclarationPage
            items={ship.items}
            hdr={ship.hdr}
            setPg={setPg}
            shipmentId={ship.id}
            recordFiling={intel.recordFiling}
            loadPrivilegeSavings={intel.loadPrivilegeSavings}
            onStatusAdvance={() => ship.advanceStatus("declared")}
          />
        )}
      </div>
    </div>
  );
}
