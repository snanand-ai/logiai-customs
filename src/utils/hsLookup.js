/**
 * HS Code Tariff Lookup Engine
 *
 * Lazy-loads Thai Customs tariff data from /data/hs-tariff-th.json
 * Provides instant synchronous lookup after initial load.
 * Caches in IndexedDB for offline/fast reload.
 */

// Module-level cache — survives across component renders
let _tariffMap = null; // Map<string, {hs, en, th, duty, unit}>
let _tariffList = null; // Array for search
let _loading = null; // Promise (dedup concurrent fetches)
let _version = null;
let _count = 0;

const IDB_NAME = "logiai_tariff";
const IDB_STORE = "data";
const IDB_KEY = "tariff_v1";

// ─── IndexedDB helpers ────────────────────────────────────────────

function idbOpen() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet(key) {
  try {
    const db = await idbOpen();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readonly");
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

async function idbSet(key, val) {
  try {
    const db = await idbOpen();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readwrite");
      const store = tx.objectStore(IDB_STORE);
      const req = store.put(val, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Silently fail — cache miss is ok
  }
}

// ─── Index builder ────────────────────────────────────────────────

function _buildIndex(json) {
  _version = json.v;
  _tariffMap = new Map();
  _tariffList = [];
  for (const row of json.data) {
    const entry = {
      hs: row[0],
      en: row[1],
      th: row[2],
      duty: row[3],
      unit: row[4],
    };
    _tariffMap.set(row[0], entry);
    _tariffList.push(entry);
  }
  _count = _tariffList.length;
}

// ─── Loader ───────────────────────────────────────────────────────

async function _doLoad() {
  // Try IndexedDB cache first
  const cached = await idbGet(IDB_KEY);
  if (cached && cached.v && cached.data) {
    _buildIndex(cached);
    return;
  }

  // Fetch from public asset
  const resp = await fetch("/data/hs-tariff-th.json");
  if (!resp.ok) throw new Error("Failed to load tariff data");
  const json = await resp.json();
  _buildIndex(json);

  // Persist to IndexedDB for future visits
  await idbSet(IDB_KEY, json);
}

/**
 * Load tariff data. Idempotent — deduplicates concurrent calls.
 * Call this early (e.g. on Items page mount) so lookups are instant.
 */
export async function loadTariff() {
  if (_tariffMap) return; // Already loaded
  if (_loading) return _loading; // Dedup concurrent calls
  _loading = _doLoad()
    .catch((err) => {
      console.warn("[hsLookup] Failed to load tariff data:", err);
    })
    .finally(() => {
      _loading = null;
    });
  return _loading;
}

/**
 * Exact lookup by HS code. Synchronous — assumes loadTariff() was called.
 * Tries exact 8-digit match, then 6-digit prefix match.
 * Returns: { hs, en, th, duty, unit, partial? } or null
 */
export function lookupHS(code) {
  if (!_tariffMap) return null;
  const clean = code.replace(/[\s.\-]/g, "");

  // Exact match
  if (_tariffMap.has(clean)) return _tariffMap.get(clean);

  // Prefix match: try to find codes starting with the input
  if (clean.length >= 4) {
    for (const [key, val] of _tariffMap) {
      if (key.startsWith(clean)) return { ...val, partial: true };
    }
  }

  return null;
}

/**
 * Search tariff data by description text or HS prefix.
 * Returns array of matches (max `limit`).
 */
export function searchHS(query, limit = 50) {
  if (!_tariffList) return [];
  const q = query.toLowerCase().trim();
  if (!q || q.length < 2) return [];

  const results = [];

  // Numeric query → HS prefix search
  if (/^\d+$/.test(q)) {
    for (const entry of _tariffList) {
      if (entry.hs.startsWith(q)) {
        results.push(entry);
        if (results.length >= limit) break;
      }
    }
  } else {
    // Text search across English and Thai descriptions
    for (const entry of _tariffList) {
      if (
        entry.en.toLowerCase().includes(q) ||
        entry.th.includes(q)
      ) {
        results.push(entry);
        if (results.length >= limit) break;
      }
    }
  }

  return results;
}

/** Check if tariff data is loaded */
export function isTariffLoaded() {
  return _tariffMap !== null;
}

/** Get tariff version string */
export function getTariffVersion() {
  return _version;
}

/** Get total number of HS code entries */
export function getTariffCount() {
  return _count;
}
