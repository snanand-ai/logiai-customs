import { Field, Select } from "./FormControls";
import Icons from "./Icons";
import LaneInsight from "./intelligence/LaneInsight";
import { s } from "../constants/styles";
import { PRIVILEGES, INCOTERMS, CURRENCIES, DECLARATION_TYPES, TRANSPORT_MODES } from "../constants/privileges";

export default function ShipmentPage({ hdr, sH, setPg, laneInsight }) {
  const isSea = (hdr.transportMode || "SEA") === "SEA";
  const isExport = hdr.declarationType === "EXPORT";

  const sectionHeader = {
    fontSize: 11, fontWeight: 700, color: "#8B6914", marginBottom: 12,
    textTransform: "uppercase", letterSpacing: "0.06em",
    borderBottom: "1px solid #e8e7ed", paddingBottom: 6,
  };

  return (
    <div style={{ animation: "fadeIn .3s ease" }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 20px", color: "#1a2a5e" }}>Shipment Details</h2>

      {/* Declaration Type & Transport Mode */}
      <div style={{ ...s.card, marginBottom: 16 }}>
        <div style={sectionHeader}>Declaration</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Select
            label="Declaration Type"
            value={hdr.declarationType || "IMPORT"}
            onChange={(v) => sH("declarationType", v)}
            options={DECLARATION_TYPES.map((d) => ({ value: d.code, label: d.label }))}
          />
          <Select
            label="Transport Mode"
            value={hdr.transportMode || "SEA"}
            onChange={(v) => sH("transportMode", v)}
            options={TRANSPORT_MODES.map((t) => ({ value: t.code, label: t.label }))}
          />
        </div>
      </div>

      {/* Transport */}
      <div style={{ ...s.card, marginBottom: 16 }}>
        <div style={sectionHeader}>Transport</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
          <Field label={isSea ? "B/L Number" : "Ref / Waybill No"} value={hdr.blNo} onChange={(v) => sH("blNo", v)} placeholder={isSea ? "e.g. 1070749239" : "e.g. TRK-001"} />
          {isSea && <Field label="Vessel" value={hdr.vessel} onChange={(v) => sH("vessel", v)} />}
          {isSea && <Field label="Voyage" value={hdr.voyage} onChange={(v) => sH("voyage", v)} />}
          <Field label="Container / Vehicle" value={hdr.ctr} onChange={(v) => sH("ctr", v)} />
          <Field label={isExport ? "Loading Port" : "Port of Loading"} value={hdr.pol} onChange={(v) => sH("pol", v)} />
          <Field label={isExport ? "Destination" : "Port of Discharge"} value={hdr.pod} onChange={(v) => sH("pod", v)} />
          <Field label={isExport ? "Export Date" : "Arrival Date"} value={hdr.eta} onChange={(v) => sH("eta", v)} type="date" />
          <Field label="Origin Country" value={hdr.origin} onChange={(v) => sH("origin", v)} />
        </div>
        {laneInsight && hdr.origin && (
          <div style={{ marginTop: 12 }}>
            <LaneInsight origin={hdr.origin} destination="TH" getInsight={laneInsight} />
          </div>
        )}
      </div>

      {/* Parties */}
      <div style={{ ...s.card, marginBottom: 16 }}>
        <div style={sectionHeader}>Parties</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Customer / Client" value={hdr.customer} onChange={(v) => sH("customer", v)} placeholder="e.g. Electrolux, Samsung" />
          <Field label="Shipper" value={hdr.shipper} onChange={(v) => sH("shipper", v)} />
          <Field label="Consignee (Importer)" value={hdr.consignee} onChange={(v) => sH("consignee", v)} />
          <Field label="Tax ID" value={hdr.taxId} onChange={(v) => sH("taxId", v)} placeholder="13-digit" />
          <Field label="Customs Broker" value={hdr.broker} onChange={(v) => sH("broker", v)} />
          <Field label="Branch Code สาขา" value={hdr.branchCode} onChange={(v) => sH("branchCode", v)} placeholder="e.g. 00000" />
          <Field label="AEO Number" value={hdr.aeoNumber} onChange={(v) => sH("aeoNumber", v)} placeholder="e.g. THCB570059" />
        </div>
      </div>

      {/* Invoice + Freight/Privilege */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={s.card}>
          <div style={sectionHeader}>Invoice</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Invoice No" value={hdr.invNo} onChange={(v) => sH("invNo", v)} />
            <Field label="Invoice Date" value={hdr.invDate} onChange={(v) => sH("invDate", v)} type="date" />
            <Select
              label="Incoterm"
              value={hdr.incoterm}
              onChange={(v) => sH("incoterm", v)}
              options={INCOTERMS.map((v) => ({ value: v, label: v }))}
            />
            <Select
              label="Currency"
              value={hdr.currency}
              onChange={(v) => sH("currency", v)}
              options={CURRENCIES.map((v) => ({ value: v, label: v }))}
            />
            <Field label="FX Rate (→THB)" value={hdr.fx} onChange={(v) => sH("fx", v)} type="number" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <Field label="Packages" value={hdr.pkgs} onChange={(v) => sH("pkgs", v)} type="number" />
              <Select
                label="Package Unit"
                value={hdr.pkgUnit || "CARTON"}
                onChange={(v) => sH("pkgUnit", v)}
                options={[
                  { value: "CARTON", label: "CARTON" },
                  { value: "PALLET", label: "PALLET" },
                  { value: "CASE", label: "CASE" },
                  { value: "DRUM", label: "DRUM" },
                  { value: "BAG", label: "BAG" },
                  { value: "PACKAGE", label: "PACKAGE" },
                  { value: "BUNDLE", label: "BUNDLE" },
                  { value: "PIECE", label: "PIECE" },
                ]}
              />
            </div>
          </div>
        </div>

        <div style={s.card}>
          <div style={sectionHeader}>Freight & Privilege</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label={`Freight (${hdr.currency})`} value={hdr.freight} onChange={(v) => sH("freight", v)} type="number" />
            <Field
              label={`Insurance (${hdr.currency})`}
              value={hdr.insurance}
              onChange={(v) => sH("insurance", v)}
              type="number"
              placeholder="0 = auto 0.3%"
            />
            <div style={{ gridColumn: "1/-1" }}>
              <Select
                label="Tax Privilege"
                value={hdr.priv}
                onChange={(v) => sH("priv", v)}
                options={PRIVILEGES.map((p) => ({ value: p.code, label: p.label }))}
              />
            </div>
            {hdr.priv !== "NONE" && (
              <div style={{ gridColumn: "1/-1" }}>
                <Field label="Permit / License #" value={hdr.permit} onChange={(v) => sH("permit", v)} />
              </div>
            )}
            {(hdr.priv === "TAXINCEN" || hdr.priv === "FZ" || hdr.priv === "EPZ") && (
              <div style={{ gridColumn: "1/-1" }}>
                <Field label="Tax Incentive Ref เลขอ้างอิงสิทธิ์" value={hdr.taxIncentiveRef} onChange={(v) => sH("taxIncentiveRef", v)} placeholder="e.g. F5302180400004" />
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 20, display: "flex", justifyContent: "space-between" }}>
        <button onClick={() => setPg("upload")} style={s.btnGhost}>← Upload</button>
        <button onClick={() => setPg("items")} style={s.btnPrimary}>Next: Items {Icons.zap({ sz: 15 })}</button>
      </div>
    </div>
  );
}
