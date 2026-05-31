// src/pages/App.tsx
// Phase 2 refactor: App is now a pure bootstrap shell (~80 lines).
//
// Responsibilities:
//   1. Import CSS
//   2. Run one-time side-effects (DB init, drug sync, theme/zoom hydration)
//   3. Guard the render behind isAuthenticated
//   4. Delegate all routing to <RouteRenderer>
//
// Nothing else. All state lives in stores. No prop drilling.

import { useEffect } from "react";
import "./App.css";
import { getDb }          from "../shared/api/db";
import { initDrugSync }   from "../features/drugs/DrugLookupTool";
import { useUIStore }     from "../stores/useUIStore";
import RouteRenderer      from "../widgets/RouteRenderer";
import LoginPage          from "./LoginPage";
import { DevErrorPanel }  from "../shared/ui/ErrorBoundary";

// Import all domain stores so their registerDomainReset/registerDomainGetter
// side-effects fire at startup (before any note is opened).
import "../stores/useAnthroStore";
import "../stores/useLabsStore";
import "../stores/useClinicalStore";
import "../stores/useDietaryStore";
import "../stores/useDiagnosisStore";
import "../stores/useInterventionStore";
import "../stores/useMonitorEvalStore";
import "../stores/useStandardsStore";

export default function App() {
  const isAuthenticated = useUIStore((s) => s.isAuthenticated);
  const { login, theme, zoomLevel } = useUIStore();

  // ── One-time bootstrap side-effects ──────────────────────────────────────
  useEffect(() => {
    // Apply persisted theme + zoom immediately on mount to avoid a flash.
    document.body.className = theme === "dark" ? "dark-theme" : "";
    document.documentElement.style.fontSize = `${17.6 * zoomLevel}px`;

    // Initialise the SQLite DB (schema migrations run inside getDb).
    getDb().catch((err) =>
      console.error("Failed to initialise database:", err)
    );

    // Pre-warm the RxNorm drug database in the background.
    initDrugSync().then((r) => {
      if (r.status === "synced")
        console.log(`Drug DB: ${r.count} terms loaded`);
      if (r.status === "error")
        console.warn("Drug DB sync failed:", r.error);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — runs once on mount only

  // ── Auth gate ──────────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <>
        <LoginPage onLogin={login} />
        <DevErrorPanel />
      </>
    );
  }

  // ── Authenticated: delegate everything to the route renderer ───────────────
  return <RouteRenderer />;
}