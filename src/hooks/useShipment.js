/**
 * useShipment — Central state management hook
 *
 * Replaces all useState + prop drilling from App.jsx.
 * Provides the exact same state shape + setters that existing pages expect,
 * plus persistence via ShipmentService (auto-save to IndexedDB).
 */

import { useState, useCallback, useRef, useEffect } from "react";
import {
  createShipment,
  saveShipment,
  loadShipment,
  updateStatus as svcUpdateStatus,
} from "../services/ShipmentService";

const INITIAL_HEADER = {
  blNo: "", vessel: "", voyage: "", pol: "", pod: "",
  shipper: "", consignee: "", taxId: "", broker: "",
  incoterm: "CIF", currency: "USD", fx: 32.61,
  pkgs: 0, pkgUnit: "CARTON", eta: "",
  invNo: "", invDate: "", origin: "CN",
  freight: 0, insurance: 0, priv: "NONE", permit: "", ctr: "",
  customer: "",
};

const INITIAL_DOCS = {
  ci: null, bl: null, master: null, freight: null, drkw: null, other: [],
};

/**
 * @param {string|null} shipmentId — null means create new on demand
 */
export default function useShipment(shipmentId = null) {
  const [id, setId] = useState(shipmentId);
  const [status, setStatus] = useState("draft");
  const [hdr, setHdr] = useState({ ...INITIAL_HEADER });
  const [items, setItems] = useState([]);
  const [docs, setDocs] = useState({ ...INITIAL_DOCS });
  const [md, setMd] = useState({});
  const [uploadLog, setUploadLog] = useState([]);
  const [loading, setLoading] = useState(!!shipmentId);
  const [toast, setToast] = useState(null);

  // Debounce timer ref
  const saveTimerRef = useRef(null);
  const dirtyRef = useRef(false);

  // Toast helper
  const msg = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  }, []);

  // Field-level header setter (matches existing sH pattern)
  const sH = useCallback((key, value) => {
    setHdr((prev) => ({ ...prev, [key]: value }));
    dirtyRef.current = true;
  }, []);

  // Wrapped setters that mark dirty
  const setItemsWrapped = useCallback((updater) => {
    setItems(updater);
    dirtyRef.current = true;
  }, []);

  const setDocsWrapped = useCallback((updater) => {
    setDocs(typeof updater === "function" ? updater : () => updater);
    dirtyRef.current = true;
  }, []);

  const setMdWrapped = useCallback((updater) => {
    setMd(typeof updater === "function" ? updater : () => updater);
    dirtyRef.current = true;
  }, []);

  const setUploadLogWrapped = useCallback((updater) => {
    setUploadLog(typeof updater === "function" ? updater : () => updater);
    dirtyRef.current = true;
  }, []);

  const setHdrWrapped = useCallback((updater) => {
    setHdr(typeof updater === "function" ? updater : () => updater);
    dirtyRef.current = true;
  }, []);

  // ─── Load existing shipment ──────────────────────────────────────

  useEffect(() => {
    if (!shipmentId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    loadShipment(shipmentId).then((s) => {
      if (cancelled || !s) {
        setLoading(false);
        return;
      }
      setId(s.id);
      setStatus(s.status || "draft");
      setHdr(s.hdr || { ...INITIAL_HEADER });
      setItems(s.items || []);
      setDocs(s.docs || { ...INITIAL_DOCS });
      setMd(s.md || {});
      setUploadLog(s.uploadLog || []);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [shipmentId]);

  // ─── Auto-save (debounced 2s after last change) ──────────────────

  useEffect(() => {
    if (!id || loading) return;
    if (!dirtyRef.current) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      if (!dirtyRef.current) return;
      dirtyRef.current = false;
      saveShipment({ id, status, hdr, items, docs, md, uploadLog })
        .catch((err) => console.warn("[useShipment] Auto-save failed:", err));
    }, 2000);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [id, status, hdr, items, docs, md, uploadLog, loading]);

  // ─── Manual save ─────────────────────────────────────────────────

  const save = useCallback(async () => {
    if (!id) return;
    dirtyRef.current = false;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    return saveShipment({ id, status, hdr, items, docs, md, uploadLog });
  }, [id, status, hdr, items, docs, md, uploadLog]);

  // ─── Create new shipment ─────────────────────────────────────────

  const createNew = useCallback(async () => {
    const s = await createShipment();
    setId(s.id);
    setStatus("draft");
    setHdr({ ...INITIAL_HEADER });
    setItems([]);
    setDocs({ ...INITIAL_DOCS });
    setMd({});
    setUploadLog([]);
    dirtyRef.current = false;
    return s.id;
  }, []);

  // ─── Status update ───────────────────────────────────────────────

  const advanceStatus = useCallback(async (newStatus) => {
    if (!id) return;
    const updated = await svcUpdateStatus(id, newStatus);
    if (updated) setStatus(updated.status);
  }, [id]);

  // ─── Auto-match (same as App.jsx) ────────────────────────────────

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
    dirtyRef.current = true;
    msg(`Matched ${matched}. ${unmatched} unmatched.`, unmatched > 0 ? "warning" : "success");
  }, [md, msg]);

  return {
    // Identity
    id,
    status,
    loading,

    // State (same shape as before)
    hdr,
    setHdr: setHdrWrapped,
    sH,
    items,
    setItems: setItemsWrapped,
    docs,
    setDocs: setDocsWrapped,
    md,
    setMd: setMdWrapped,
    uploadLog,
    setUploadLog: setUploadLogWrapped,

    // Actions
    save,
    createNew,
    advanceStatus,
    autoMatch,

    // UI
    toast,
    msg,
  };
}
