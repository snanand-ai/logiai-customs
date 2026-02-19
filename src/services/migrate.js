/**
 * Data Migration — one-time migration on app startup
 *
 * Migrates legacy data from localStorage (HS history) to the
 * new intelligence IndexedDB store. Idempotent — checks a flag.
 */

import { put, getById } from "./db";
import { STORES } from "./dbSchema";

const INTEL_STORE = STORES.intelligence.name;
const MIGRATION_FLAG = "logiai_om_migrated_v1";

/**
 * Run all migrations. Safe to call on every app start.
 */
export async function runMigrations() {
  // Check if already migrated
  if (localStorage.getItem(MIGRATION_FLAG)) return;

  try {
    await migrateHsHistory();
    localStorage.setItem(MIGRATION_FLAG, new Date().toISOString());
    console.log("[migrate] Migrations complete");
  } catch (err) {
    console.warn("[migrate] Migration failed (will retry next load):", err);
  }
}

/**
 * Migrate HS code history from localStorage `logiai_hs_history`
 * to the intelligence store as "hs:XXXXXXXX" records.
 */
async function migrateHsHistory() {
  const raw = localStorage.getItem("logiai_hs_history");
  if (!raw) return;

  let history;
  try {
    history = JSON.parse(raw);
  } catch {
    return; // Invalid JSON, skip
  }

  if (!history || typeof history !== "object") return;

  // history shape: { "partNumber": { hs, th, duty, org, customer, ts } }
  let migrated = 0;
  for (const [partNo, entry] of Object.entries(history)) {
    if (!entry.hs) continue;

    const clean = entry.hs.replace(/[\s.\-]/g, "").slice(0, 8);
    if (clean.length < 4) continue;

    const key = `hs:${clean}`;
    const existing = await getById(INTEL_STORE, key);

    if (!existing) {
      // Create a new intelligence record from the history entry
      await put(INTEL_STORE, {
        key,
        type: "hs",
        updatedAt: entry.ts || new Date().toISOString(),
        data: {
          timesUsed: 1,
          lastUsed: entry.ts || new Date().toISOString(),
          customers: entry.customer ? { [entry.customer]: 1 } : {},
          duties: entry.duty != null ? [Number(entry.duty)] : [],
          descriptions: {},
        },
      });
      migrated++;
    } else {
      // Merge: increment count if this HS code already exists
      existing.data.timesUsed += 1;
      if (entry.customer) {
        existing.data.customers[entry.customer] =
          (existing.data.customers[entry.customer] || 0) + 1;
      }
      if (entry.duty != null) {
        existing.data.duties.push(Number(entry.duty));
      }
      await put(INTEL_STORE, existing);
      migrated++;
    }
  }

  if (migrated > 0) {
    console.log(`[migrate] Migrated ${migrated} HS history entries to intelligence store`);
  }
}
