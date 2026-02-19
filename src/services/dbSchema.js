/**
 * IndexedDB Schema for LogiAI-OM
 *
 * Single source of truth for database name, version, and store definitions.
 * All IndexedDB access goes through db.js using these constants.
 */

export const DB_NAME = "logiai_om";
export const DB_VERSION = 1;

/**
 * Store definitions with their key paths and indexes.
 * Each store: { name, keyPath, indexes: [{ name, keyPath, unique }] }
 */
export const STORES = {
  shipments: {
    name: "shipments",
    keyPath: "id",
    indexes: [
      { name: "status", keyPath: "status", unique: false },
      { name: "updatedAt", keyPath: "updatedAt", unique: false },
      { name: "customer", keyPath: "hdr.customer", unique: false },
    ],
  },
  declarations: {
    name: "declarations",
    keyPath: "id",
    indexes: [
      { name: "shipmentId", keyPath: "shipmentId", unique: false },
      { name: "createdAt", keyPath: "createdAt", unique: false },
    ],
  },
  intelligence: {
    name: "intelligence",
    keyPath: "key", // e.g. "hs:85044090", "lane:CN-TH", "customer:Electrolux"
    indexes: [
      { name: "type", keyPath: "type", unique: false }, // "hs", "lane", "customer", "privilege"
      { name: "updatedAt", keyPath: "updatedAt", unique: false },
    ],
  },
};

/** All store names for iteration during DB upgrade */
export const ALL_STORES = Object.values(STORES).map((s) => s.name);

/** Shipment status progression */
export const SHIPMENT_STATUSES = [
  "draft",
  "documentsUploaded",
  "itemsReviewed",
  "declared",
  "filed",
];
