/**
 * useIntelligence — React hook for intelligence/behavior graph queries
 *
 * Wraps IntelligenceService with caching and React-friendly API.
 * Results are cached in-memory per hook instance to avoid repeated IDB reads.
 */

import { useState, useCallback, useRef } from "react";
import {
  recordDeclaration,
  getHsInsight,
  getLaneInsight,
  getCustomerInsight,
  getPrivilegeSavings,
} from "../services/IntelligenceService";

export default function useIntelligence() {
  const [privilegeSavings, setPrivilegeSavings] = useState(null);
  const cacheRef = useRef(new Map()); // key -> { data, ts }

  const CACHE_TTL = 30_000; // 30 seconds

  // Generic cached fetch
  const _cached = useCallback(async (key, fetcher) => {
    const cached = cacheRef.current.get(key);
    if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;

    const data = await fetcher();
    cacheRef.current.set(key, { data, ts: Date.now() });
    return data;
  }, []);

  /**
   * Get HS code insight. Returns null if no data.
   */
  const hsInsight = useCallback(async (hsCode) => {
    if (!hsCode || hsCode.replace(/[\s.\-]/g, "").length < 4) return null;
    return _cached(`hs:${hsCode}`, () => getHsInsight(hsCode));
  }, [_cached]);

  /**
   * Get trade lane insight.
   */
  const laneInsight = useCallback(async (origin, destination = "TH") => {
    if (!origin) return null;
    return _cached(`lane:${origin}-${destination}`, () => getLaneInsight(origin, destination));
  }, [_cached]);

  /**
   * Get customer insight.
   */
  const customerInsight = useCallback(async (customerName) => {
    if (!customerName) return null;
    return _cached(`customer:${customerName}`, () => getCustomerInsight(customerName));
  }, [_cached]);

  /**
   * Load global privilege savings.
   */
  const loadPrivilegeSavings = useCallback(async () => {
    const data = await getPrivilegeSavings();
    setPrivilegeSavings(data);
    return data;
  }, []);

  /**
   * Record a filed declaration into the intelligence store.
   * Invalidates all caches.
   */
  const recordFiling = useCallback(async (shipment, declaration) => {
    await recordDeclaration(shipment, declaration);
    cacheRef.current.clear(); // Invalidate cache
    await loadPrivilegeSavings(); // Refresh savings
  }, [loadPrivilegeSavings]);

  return {
    hsInsight,
    laneInsight,
    customerInsight,
    privilegeSavings,
    loadPrivilegeSavings,
    recordFiling,
  };
}
