/**
 * Intelligence Service — Behavior Graph (OM Layer 2)
 *
 * Records patterns from every filed declaration and provides
 * pre-aggregated insights: HS code usage, trade lane stats,
 * customer patterns, and privilege savings.
 *
 * Data shape in `intelligence` store:
 * {
 *   key: "hs:85044090" | "lane:CN-TH" | "customer:Electrolux" | "privilege:global",
 *   type: "hs" | "lane" | "customer" | "privilege",
 *   updatedAt: ISO string,
 *   data: { ... type-specific aggregated data }
 * }
 */

import { getById, put, getByIndex, getAll } from "./db";
import { STORES } from "./dbSchema";

const STORE = STORES.intelligence.name;

// ─── Internal helpers ──────────────────────────────────────────────

async function _get(key) {
  return getById(STORE, key);
}

async function _put(record) {
  return put(STORE, { ...record, updatedAt: new Date().toISOString() });
}

function _hsKey(code) {
  return `hs:${code.replace(/[\s.\-]/g, "").slice(0, 8)}`;
}

function _laneKey(origin, destination) {
  return `lane:${(origin || "XX").toUpperCase()}-${(destination || "TH").toUpperCase()}`;
}

function _customerKey(name) {
  return `customer:${(name || "unknown").trim().toLowerCase()}`;
}

// ─── Record a filed declaration ────────────────────────────────────

/**
 * Record intelligence from a completed declaration.
 * Call this when the user exports/files a declaration.
 *
 * @param {object} shipment — full shipment { hdr, items }
 * @param {object} declaration — output of calculateDeclaration()
 */
export async function recordDeclaration(shipment, declaration) {
  const { hdr, items } = shipment;
  const now = new Date().toISOString();
  const customer = hdr.customer || hdr.consignee || "";

  // 1. Record HS code usage for each unique HS code in the declaration
  const hsCodes = new Set();
  for (const item of items) {
    if (item.hs && item.hs.replace(/[\s.\-]/g, "").length >= 4) {
      hsCodes.add(item.hs.replace(/[\s.\-]/g, "").slice(0, 8));
    }
  }

  for (const code of hsCodes) {
    const key = _hsKey(code);
    const existing = (await _get(key)) || {
      key,
      type: "hs",
      data: { timesUsed: 0, lastUsed: null, customers: {}, duties: [], descriptions: {} },
    };
    const d = existing.data;
    d.timesUsed += 1;
    d.lastUsed = now;
    if (customer) {
      d.customers[customer] = (d.customers[customer] || 0) + 1;
    }
    // Track duty rates seen
    const item = items.find((i) => i.hs?.replace(/[\s.\-]/g, "").startsWith(code));
    if (item && item.duty != null) {
      d.duties.push(Number(item.duty));
      if (d.duties.length > 50) d.duties = d.duties.slice(-50); // cap
    }
    // Track descriptions
    if (item?.desc) {
      d.descriptions[item.desc] = (d.descriptions[item.desc] || 0) + 1;
    }
    await _put(existing);
  }

  // 2. Record trade lane
  const laneKey = _laneKey(hdr.origin, "TH");
  const lane = (await _get(laneKey)) || {
    key: laneKey,
    type: "lane",
    data: { shipmentsCount: 0, hsCodes: {}, avgDuty: 0, totalDuty: 0 },
  };
  lane.data.shipmentsCount += 1;
  for (const code of hsCodes) {
    lane.data.hsCodes[code] = (lane.data.hsCodes[code] || 0) + 1;
  }
  if (declaration?.totals) {
    lane.data.totalDuty += declaration.totals.duty || 0;
    lane.data.avgDuty = lane.data.totalDuty / lane.data.shipmentsCount;
  }
  await _put(lane);

  // 3. Record customer pattern
  if (customer) {
    const custKey = _customerKey(customer);
    const cust = (await _get(custKey)) || {
      key: custKey,
      type: "customer",
      data: { shipmentsCount: 0, hsCodes: {}, privileges: {}, lastShipment: null },
    };
    cust.data.shipmentsCount += 1;
    cust.data.lastShipment = now;
    for (const code of hsCodes) {
      cust.data.hsCodes[code] = (cust.data.hsCodes[code] || 0) + 1;
    }
    if (hdr.priv) {
      cust.data.privileges[hdr.priv] = (cust.data.privileges[hdr.priv] || 0) + 1;
    }
    await _put(cust);
  }

  // 4. Record privilege savings
  const privKey = "privilege:global";
  const priv = (await _get(privKey)) || {
    key: privKey,
    type: "privilege",
    data: { totalSaved: 0, byScheme: {}, declarationsCount: 0 },
  };
  priv.data.declarationsCount += 1;
  if (declaration?.totals?.savings) {
    priv.data.totalSaved += declaration.totals.savings;
  }
  if (hdr.priv && hdr.priv !== "NONE") {
    priv.data.byScheme[hdr.priv] = (priv.data.byScheme[hdr.priv] || 0) + (declaration?.totals?.savings || 0);
  }
  await _put(priv);
}

// ─── Query functions ───────────────────────────────────────────────

/**
 * Get insight for a specific HS code.
 * @returns {{ timesUsed, lastUsed, avgDuty, commonCustomers, topDescriptions }} or null
 */
export async function getHsInsight(hsCode) {
  const clean = hsCode.replace(/[\s.\-]/g, "").slice(0, 8);
  if (clean.length < 4) return null;
  const record = await _get(_hsKey(clean));
  if (!record) return null;

  const d = record.data;
  const avgDuty = d.duties.length > 0
    ? d.duties.reduce((a, b) => a + b, 0) / d.duties.length
    : null;

  // Top 3 customers
  const commonCustomers = Object.entries(d.customers || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, count]) => ({ name, count }));

  // Top 3 descriptions
  const topDescriptions = Object.entries(d.descriptions || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([desc, count]) => ({ desc, count }));

  return {
    timesUsed: d.timesUsed,
    lastUsed: d.lastUsed,
    avgDuty,
    commonCustomers,
    topDescriptions,
  };
}

/**
 * Get trade lane insight.
 * @returns {{ shipmentsCount, avgDuty, commonHsCodes }} or null
 */
export async function getLaneInsight(origin, destination = "TH") {
  const record = await _get(_laneKey(origin, destination));
  if (!record) return null;

  const d = record.data;
  const commonHsCodes = Object.entries(d.hsCodes || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([code, count]) => ({ code, count }));

  return {
    shipmentsCount: d.shipmentsCount,
    avgDuty: d.avgDuty,
    commonHsCodes,
  };
}

/**
 * Get customer insight.
 * @returns {{ shipmentsCount, commonHsCodes, preferredPrivilege, lastShipment }} or null
 */
export async function getCustomerInsight(customerName) {
  if (!customerName) return null;
  const record = await _get(_customerKey(customerName));
  if (!record) return null;

  const d = record.data;
  const commonHsCodes = Object.entries(d.hsCodes || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([code, count]) => ({ code, count }));

  // Find most-used privilege
  const preferredPrivilege = Object.entries(d.privileges || {})
    .sort((a, b) => b[1] - a[1])[0]?.[0] || "NONE";

  return {
    shipmentsCount: d.shipmentsCount,
    commonHsCodes,
    preferredPrivilege,
    lastShipment: d.lastShipment,
  };
}

/**
 * Get global privilege savings.
 * @returns {{ totalSaved, byScheme, declarationsCount }}
 */
export async function getPrivilegeSavings() {
  const record = await _get("privilege:global");
  if (!record) return { totalSaved: 0, byScheme: {}, declarationsCount: 0 };
  return record.data;
}

/**
 * Get all intelligence records of a given type.
 */
export async function getAllByType(type) {
  return getByIndex(STORE, "type", type);
}
