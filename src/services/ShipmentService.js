/**
 * Shipment Service — CRUD operations for shipments
 *
 * Each shipment is a self-contained entity holding all data needed
 * for a single import declaration: header, documents, line items,
 * master data, and upload log.
 */

import { getAll, getById, put, remove } from "./db";
import { STORES, SHIPMENT_STATUSES } from "./dbSchema";

const STORE = STORES.shipments.name;

/** Generate a short unique ID */
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/** Default header matching INITIAL_HEADER in App.jsx */
const DEFAULT_HEADER = {
  declarationType: "IMPORT",
  transportMode: "SEA",
  blNo: "", vessel: "", voyage: "", pol: "", pod: "",
  shipper: "", consignee: "", taxId: "", broker: "",
  incoterm: "CIF", currency: "USD", fx: 32.61,
  pkgs: 0, pkgUnit: "CARTON", eta: "",
  invNo: "", invDate: "", origin: "CN",
  freight: 0, insurance: 0, priv: "NONE", permit: "", ctr: "",
  customer: "",
  aeoNumber: "", branchCode: "",
  taxIncentiveRef: "",
};

/**
 * Create a new empty shipment. Returns the full shipment object.
 */
export async function createShipment() {
  const now = new Date().toISOString();
  const shipment = {
    id: uid(),
    status: "draft",
    createdAt: now,
    updatedAt: now,
    hdr: { ...DEFAULT_HEADER },
    docs: { ci: null, bl: null, master: null, freight: null, drkw: null, other: [] },
    items: [],
    md: {},
    uploadLog: [],
  };
  await put(STORE, shipment);
  return shipment;
}

/**
 * Save (upsert) a shipment. Updates the `updatedAt` timestamp.
 */
export async function saveShipment(shipment) {
  const updated = {
    ...shipment,
    updatedAt: new Date().toISOString(),
  };
  await put(STORE, updated);
  return updated;
}

/**
 * Load a single shipment by ID. Returns null if not found.
 */
export async function loadShipment(id) {
  return getById(STORE, id);
}

/**
 * List all shipments, sorted by most recently updated first.
 */
export async function listShipments() {
  return getAll(STORE, "updatedAt", "prev");
}

/**
 * Delete a shipment.
 */
export async function deleteShipment(id) {
  return remove(STORE, id);
}

/**
 * Update just the status of a shipment.
 * Only advances forward in the status progression (no going backward).
 */
export async function updateStatus(id, newStatus) {
  const shipment = await loadShipment(id);
  if (!shipment) return null;

  const currentIdx = SHIPMENT_STATUSES.indexOf(shipment.status);
  const newIdx = SHIPMENT_STATUSES.indexOf(newStatus);

  // Only advance forward (or allow setting same status)
  if (newIdx >= currentIdx) {
    shipment.status = newStatus;
    return saveShipment(shipment);
  }
  return shipment;
}

/**
 * Get a display label for a shipment (for dashboard cards).
 */
export function getShipmentLabel(shipment) {
  const { hdr } = shipment;
  if (hdr.customer) return hdr.customer;
  if (hdr.consignee) return hdr.consignee;
  if (hdr.blNo) return `B/L ${hdr.blNo}`;
  return `Shipment ${shipment.id.slice(-6)}`;
}

/**
 * Get a human-readable status label.
 */
export function getStatusLabel(status) {
  const labels = {
    draft: "Draft",
    documentsUploaded: "Docs Uploaded",
    itemsReviewed: "Items Reviewed",
    declared: "Declared",
    filed: "Filed",
  };
  return labels[status] || status;
}
