// src/features/drugs/rxnormSync.ts
// ─────────────────────────────────────────────────────────────────────────────
// TypeScript layer between the Tauri Rust command and the React UI.
//
// RESPONSIBILITIES:
//   - Calls the `sync_rxnorm` Tauri command with the stored UMLS API key.
//   - Listens to "rxnorm://progress" events and surfaces them as React state
//     via the `useRxNormSync` hook.
//   - Exposes `getRxNormSyncStatus()` for the Settings page "last synced" badge.
//   - Exports `searchRxNormProducts()` for the combobox — queries the local
//     SQLite drugs.db directly via @tauri-apps/plugin-sql.
//
// USAGE (Settings page):
//   const { progress, startSync, isRunning } = useRxNormSync();
//
// USAGE (DrugLookupTool):
//   const products = await searchRxNormProducts(db, query);
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from "react";
import { invoke }   from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import Database     from "@tauri-apps/plugin-sql";
import type { MedicationProduct } from "./DrugLookupTool";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RxNormProgress {
  stage:         "downloading" | "extracting" | "importing" | "done" | "error";
  message:       string;
  rowsInserted:  number;   // camelCase — Tauri serialises snake_case → camelCase
  percent:       number;
}

export interface RxNormSyncStatus {
  synced:         boolean;
  lastSyncEpoch:  number | null;   // Unix seconds
  productCount:   number;
  needsSync:      boolean;
}

// ── DB singleton ──────────────────────────────────────────────────────────────

const DB_NAME = "sqlite:drugs.db";
let _db: Database | null = null;

async function getDb(): Promise<Database> {
  if (_db) return _db;
  _db = await Database.load(DB_NAME);
  return _db;
}

// ── Search ────────────────────────────────────────────────────────────────────

/**
 * Full-text product search against the local rxnorm_products table.
 * Returns up to `limit` results, ranked by prefix match first.
 */
export async function searchRxNormProducts(
  query: string,
  limit = 50
): Promise<MedicationProduct[]> {
  if (query.trim().length < 2) return [];
  const db = await getDb();

  const pattern      = `%${query}%`;
  const startPattern = `${query}%`;

  const rows = await db.select<any[]>(
    `SELECT rxcui, display_name, ingredient, strength_value,
            strength_unit, dose_form, tty
     FROM rxnorm_products
     WHERE display_name LIKE ?
     ORDER BY
       CASE WHEN display_name LIKE ? THEN 0 ELSE 1 END,
       LENGTH(display_name),
       display_name
     LIMIT ?`,
    [pattern, startPattern, limit]
  );

  return rows.map(r => ({
    rxcui:         r.rxcui,
    displayName:   r.display_name,
    ingredient:    r.ingredient ?? "",
    strengthValue: r.strength_value ?? null,
    strengthUnit:  r.strength_unit ?? "",
    doseForm:      r.dose_form ?? "",
    tty:           "SCD" as const,
  }));
}

// ── Sync status (used by Settings page) ──────────────────────────────────────

export async function getRxNormSyncStatus(): Promise<RxNormSyncStatus> {
  try {
    return await invoke<RxNormSyncStatus>("rxnorm_sync_status");
  } catch (err) {
    console.error("Failed to get RxNorm sync status:", err);
    return { synced: false, lastSyncEpoch: null, productCount: 0, needsSync: true };
  }
}

// ── Trigger sync ──────────────────────────────────────────────────────────────

/**
 * Kicks off the Rust ETL command.
 * `apiKey`  — UMLS API key (retrieved from tauri-plugin-store by the caller).
 * `force`   — bypass the 30-day staleness check.
 */
export async function triggerRxNormSync(
  apiKey: string,
  force = false
): Promise<RxNormProgress> {
  return invoke<RxNormProgress>("sync_rxnorm", { apiKey, force });
}

// ── React hook ────────────────────────────────────────────────────────────────

/**
 * `useRxNormSync`
 *
 * Provides:
 *   progress  — current RxNormProgress (null before first event)
 *   isRunning — true while a sync is in flight
 *   startSync — call with a UMLS API key to begin
 *   status    — last known RxNormSyncStatus (loaded once on mount)
 *
 * Example (Settings page):
 *   const { progress, isRunning, startSync, status } = useRxNormSync();
 *   ...
 *   <button onClick={() => startSync(apiKey)} disabled={isRunning}>
 *     {isRunning ? `${progress?.percent.toFixed(0)}%` : "Sync RxNorm"}
 *   </button>
 */
export function useRxNormSync() {
  const [progress,  setProgress]  = useState<RxNormProgress | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [status,    setStatus]    = useState<RxNormSyncStatus | null>(null);
  const unlistenRef = useRef<UnlistenFn | null>(null);

  // Load status on mount
  useEffect(() => {
    getRxNormSyncStatus().then(setStatus);
  }, []);

  // Subscribe to progress events for the lifetime of the component
  useEffect(() => {
    let cancelled = false;

    listen<RxNormProgress>("rxnorm://progress", (event) => {
      if (cancelled) return;
      const p = event.payload;
      setProgress(p);
      if (p.stage === "done" || p.stage === "error") {
        setIsRunning(false);
        // Refresh status after sync completes
        getRxNormSyncStatus().then(s => { if (!cancelled) setStatus(s); });
      }
    }).then(fn => {
      unlistenRef.current = fn;
    });

    return () => {
      cancelled = true;
      unlistenRef.current?.();
    };
  }, []);

  const startSync = useCallback(async (apiKey: string, force = false) => {
    if (isRunning) return;
    setIsRunning(true);
    setProgress({
      stage: "downloading", message: "Starting…",
      rowsInserted: 0, percent: 0,
    });
    try {
      await triggerRxNormSync(apiKey, force);
    } catch (err: any) {
      setProgress({
        stage: "error", message: String(err),
        rowsInserted: 0, percent: 0,
      });
      setIsRunning(false);
    }
  }, [isRunning]);

  return { progress, isRunning, startSync, status };
}

// ── Boot-time check (called from App.tsx) ────────────────────────────────────

/**
 * Call once on app boot to silently sync if needed.
 * If no apiKey is stored yet, does nothing — the Settings page will prompt.
 *
 * Example (App.tsx):
 *   import { bootRxNormSync } from "../features/drugs/rxnormSync";
 *   useEffect(() => { bootRxNormSync(); }, []);
 */
export async function bootRxNormSync(): Promise<void> {
  try {
    const status = await getRxNormSyncStatus();
    if (!status.needsSync) return;

    // Retrieve stored API key from tauri-plugin-store
    // (import Store from "@tauri-apps/plugin-store" in your App.tsx)
    // We use a dynamic import here to avoid a hard dependency in this module.
    const { load } = await import("@tauri-apps/plugin-store");
    const store = await load("settings.json", { autoSave: true, defaults: {} });
    const apiKey = await store.get<string>("umlsApiKey");

    if (!apiKey) return; // No key yet — Settings page will prompt user

    await triggerRxNormSync(apiKey, false);
  } catch (err) {
    console.warn("RxNorm boot sync skipped:", err);
  }
}
