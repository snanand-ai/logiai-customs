/**
 * Declaration Service — save and load declaration snapshots
 *
 * Each declaration is a snapshot of the calculated output from
 * calculateDeclaration() at a specific point in time. Multiple
 * snapshots per shipment are supported (for revision history).
 */

import { getAll, getById, put, getByIndex } from "./db";
import { STORES } from "./dbSchema";

const STORE = STORES.declarations.name;

/** Generate a short unique ID */
function uid() {
  return "decl_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/**
 * Save a declaration snapshot linked to a shipment.
 * @param {string} shipmentId — the parent shipment
 * @param {object} calculated — output of calculateDeclaration(items, hdr)
 * @param {object} meta — optional metadata (e.g., exportedAt, notes)
 */
export async function saveDeclaration(shipmentId, calculated, meta = {}) {
  const now = new Date().toISOString();
  const record = {
    id: uid(),
    shipmentId,
    createdAt: now,
    ...calculated,
    ...meta,
  };
  await put(STORE, record);
  return record;
}

/**
 * Load the most recent declaration for a shipment.
 */
export async function loadLatestDeclaration(shipmentId) {
  const all = await getByIndex(STORE, "shipmentId", shipmentId);
  if (all.length === 0) return null;
  // Sort by createdAt descending and return the most recent
  all.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  return all[0];
}

/**
 * Load all declarations for a shipment (revision history).
 */
export async function loadDeclarations(shipmentId) {
  const all = await getByIndex(STORE, "shipmentId", shipmentId);
  all.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  return all;
}

/**
 * Load a specific declaration by ID.
 */
export async function loadDeclaration(id) {
  return getById(STORE, id);
}
