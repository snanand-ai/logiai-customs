/**
 * ShipmentWorkspace — Container for a single shipment
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

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape" && onBack) onBack();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onBack]);

  if (ship.loading) {
    return (
      <div style={{ textAlign: "center", padding: 60, color: "#5a5a7a" }}>
        Loading shipment...
      </div>
    );
  }

  const setPg = (page) => setTab(page);

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
              color: "#1a2a5e",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {label}
            <ShipmentStatusBadge status={ship.status} size="lg" />
          </div>
          <div style={{ fontSize: 10, color: "#8a8aa0", marginTop: 2 }}>
            {ship.items.length} items &middot; ID: {ship.id?.slice(-6)}
          </div>
        </div>
        <button
          onClick={() => ship.save()}
          style={{ ...s.btnGhost, padding: "6px 12px", fontSize: 11 }}
        >
          {Icons.check({ sz: 12, c: "#15803d" })} Save
        </button>
      </div>

      {/* Tab navigation */}
      <div
        style={{
          display: "flex",
          gap: 3,
          marginBottom: 20,
          borderBottom: "2px solid #d4d2e0",
          paddingBottom: 0,
        }}
      >
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              background: tab === t.key ? "#ffffff" : "transparent",
              border: tab === t.key
                ? "1px solid #d4d2e0"
                : "1px solid transparent",
              borderBottom: tab === t.key
                ? "3px solid #c6952e"
                : "3px solid transparent",
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
              borderTopLeftRadius: 6,
              borderTopRightRadius: 6,
              color: tab === t.key ? "#1a2a5e" : "#5a5a7a",
              fontWeight: 600,
              fontSize: 11,
              padding: "8px 14px",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              marginBottom: -2,
              fontFamily: "'Sarabun', sans-serif",
            }}
          >
            {t.icon({ sz: 13 })} {t.label}
            {t.key === "items" && ship.items.length > 0 && (
              <span
                style={{
                  fontSize: 9,
                  background: "#eef2ff",
                  color: "#1a2a5e",
                  padding: "1px 5px",
                  borderRadius: 10,
                  marginLeft: 3,
                  border: "1px solid #d4d2e0",
                }}
              >
                {ship.items.length}
              </span>
            )}
            {t.key === "master" && Object.keys(ship.md).length > 0 && (
              <span
                style={{
                  fontSize: 9,
                  background: "#faf5ff",
                  color: "#7c3aed",
                  padding: "1px 5px",
                  borderRadius: 10,
                  marginLeft: 3,
                  border: "1px solid #e9d5ff",
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
                ? "#fef2f2"
                : ship.toast.type === "warning"
                ? "#fffbeb"
                : "#f0fdf4",
            border: `1px solid ${
              ship.toast.type === "error"
                ? "#fecaca"
                : ship.toast.type === "warning"
                ? "#fde68a"
                : "#bbf7d0"
            }`,
            color:
              ship.toast.type === "error"
                ? "#dc2626"
                : ship.toast.type === "warning"
                ? "#b45309"
                : "#15803d",
            padding: "10px 20px",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            boxShadow: "0 4px 20px rgba(26,42,94,0.15)",
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
