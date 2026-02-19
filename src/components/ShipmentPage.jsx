import { Field, Select } from "./FormControls";
import Icons from "./Icons";
import { s } from "../constants/styles";
import { PRIVILEGES, INCOTERMS, CURRENCIES } from "../constants/privileges";

export default function ShipmentPage({ hdr, sH, setPg }) {
  return (
    <div style={{ animation: "fadeIn .3s ease" }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 20px" }}>Shipment Details</h2>

      {/* Transport */}
      <div style={{ ...s.card, marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#6ee7b7", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Transport
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
          <Field label="B/L Number" value={hdr.blNo} onChange={(v) => sH("blNo", v)} placeholder="e.g. 1070749239" />
          <Field label="Vessel" value={hdr.vessel} onChange={(v) => sH("vessel", v)} />
          <Field label="Voyage" value={hdr.voyage} onChange={(v) => sH("voyage", v)} />
          <Field label="Container" value={hdr.ctr} onChange={(v) => sH("ctr", v)} />
          <Field label="Port of Loading" value={hdr.pol} onChange={(v) => sH("pol", v)} />
          <Field label="Port of Discharge" value={hdr.pod} onChange={(v) => sH("pod", v)} />
          <Field label="Arrival Date" value={hdr.eta} onChange={(v) => sH("eta", v)} type="date" />
          <Field label="Origin Country" value={hdr.origin} onChange={(v) => sH("origin", v)} />
        </div>
      </div>

      {/* Parties */}
      <div style={{ ...s.card, marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#6ee7b7", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Parties
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Shipper" value={hdr.shipper} onChange={(v) => sH("shipper", v)} />
          <Field label="Consignee (Importer)" value={hdr.consignee} onChange={(v) => sH("consignee", v)} />
          <Field label="Tax ID" value={hdr.taxId} onChange={(v) => sH("taxId", v)} placeholder="13-digit" />
          <Field label="Customs Broker" value={hdr.broker} onChange={(v) => sH("broker", v)} />
        </div>
      </div>

      {/* Invoice + Freight/Privilege */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={s.card}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#6ee7b7", marginBottom: 12, textTransform: "uppercase" }}>Invoice</div>
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
          <div style={{ fontSize: 11, fontWeight: 700, color: "#6ee7b7", marginBottom: 12, textTransform: "uppercase" }}>Freight & Privilege</div>
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
            {(hdr.priv === "FZ" || hdr.priv === "BOI") && (
              <div style={{ gridColumn: "1/-1" }}>
                <Field label="Permit / License #" value={hdr.permit} onChange={(v) => sH("permit", v)} />
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
