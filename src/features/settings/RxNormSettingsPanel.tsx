import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { load } from "@tauri-apps/plugin-store";
import { useRxNormSync } from "../drugs/rxnormSync";

export default function RxNormSettingsPanel() {
  const { progress, isRunning, startSync, status } = useRxNormSync();
  const [apiKey, setApiKey] = useState("");
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    load("settings.json", { autoSave: true, defaults: {} })
      .then((store) => store.get<string>("umlsApiKey"))
      .then((key) => {
        if (active && key) {
          setApiKey(key);
          setSaved(true);
        }
      })
      .catch((err) => setMessage(`Unable to load stored credentials: ${String(err)}`));
    return () => {
      active = false;
    };
  }, []);

  const statusText = useMemo(() => {
    if (!status) return "Checking medication search status...";
    if (status.productCount === 0) return "Medication search is unavailable; manual entry is still available";
    const statusMsg = status.needsSync ? "Medication search needs an update" : "Medication search is ready";
    const date = status.lastSyncEpoch
      ? new Date(status.lastSyncEpoch * 1000).toLocaleDateString()
      : "unknown date";
    return `${statusMsg} (${status.productCount.toLocaleString()} products loaded, last updated: ${date})`;
  }, [status]);

  async function saveKey() {
    try {
      const store = await load("settings.json", { autoSave: true, defaults: {} });
      await store.set("umlsApiKey", apiKey.trim());
      await store.save();
      setSaved(true);
      setMessage("Developer credentials updated.");
    } catch (err) {
      setMessage(`Unable to save key: ${String(err)}`);
    }
  }

  async function sync(force: boolean) {
    const key = apiKey.trim();
    if (!key) {
      setMessage("Medication search update requires a saved developer credentials key in Advanced Settings.");
      return;
    }
    await saveKey();
    setMessage("");
    await startSync(key, force);
  }

  const progressText = progress
    ? `${progress.message} ${Math.round(progress.percent)}%`
    : statusText;

  return (
    <section style={styles.section}>
      <h3 style={styles.sectionTitle}>Medication Search</h3>
      <p style={styles.sectionDesc}>
        Maintain the local search index. If updates are needed, trigger the automated update below.
      </p>

      <div style={styles.statusBox}>
        <div style={styles.statusText}>{progressText}</div>
        {progress && (
          <div style={styles.progressTrack}>
            <div
              style={{
                ...styles.progressFill,
                width: `${Math.max(0, Math.min(100, progress.percent))}%`,
                background: progress.stage === "error" ? "#e74c3c" : "#3498db",
              }}
            />
          </div>
        )}
      </div>

      {message && <div style={styles.message}>{message}</div>}

      <div style={styles.actions}>
        <button
          onClick={() => sync(false)}
          disabled={isRunning}
          style={isRunning ? styles.disabledBtn : styles.primaryBtn}
        >
          {isRunning ? "Updating..." : "Update medication search"}
        </button>
      </div>

      <details style={styles.advancedDetails}>
        <summary style={styles.advancedSummary}>Advanced Developer Settings</summary>
        <div style={styles.advancedContent}>
          <label style={styles.label}>UMLS API Key</label>
          <div style={styles.keyRow}>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setSaved(false);
              }}
              placeholder="Paste UMLS API key"
              style={styles.input}
            />
            <button onClick={saveKey} style={styles.secondaryBtn}>
              {saved ? "Saved" : "Save Key"}
            </button>
          </div>
          <div style={{ marginTop: "1rem" }}>
            <button
              onClick={() => sync(true)}
              disabled={isRunning}
              style={isRunning ? styles.disabledBtn : styles.secondaryBtn}
            >
              Force Resync
            </button>
          </div>
        </div>
      </details>
    </section>
  );
}

const styles: Record<string, CSSProperties> = {
  section: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "1.5rem", marginBottom: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" },
  sectionTitle: { margin: "0 0 0.35rem", fontSize: "1rem", fontWeight: 800, color: "#1e293b" },
  sectionDesc: { margin: "0 0 1rem", fontSize: "0.85rem", color: "#64748b", lineHeight: 1.5 },
  label: { display: "block", fontSize: "0.72rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase", marginBottom: "0.35rem" },
  keyRow: { display: "flex", gap: "0.5rem", alignItems: "center" },
  input: { flex: 1, minWidth: 0, border: "1px solid #cbd5e1", borderRadius: "6px", padding: "0.55rem 0.65rem", fontSize: "0.86rem" },
  statusBox: { marginTop: "1rem", padding: "0.85rem", border: "1px solid #e2e8f0", borderRadius: "8px", background: "#f8fafc" },
  statusText: { fontSize: "0.84rem", color: "#334155", fontWeight: 650 },
  progressTrack: { height: "8px", background: "#e2e8f0", borderRadius: "999px", overflow: "hidden", marginTop: "0.65rem" },
  progressFill: { height: "100%", transition: "width 0.2s ease" },
  message: { marginTop: "0.75rem", fontSize: "0.8rem", color: "#e74c3c", fontWeight: 600 },
  actions: { display: "flex", gap: "0.5rem", marginTop: "1rem", flexWrap: "wrap" },
  primaryBtn: { background: "#3498db", color: "#fff", border: "none", borderRadius: "6px", padding: "0.5rem 0.85rem", fontSize: "0.82rem", fontWeight: 800, cursor: "pointer" },
  secondaryBtn: { background: "#fff", color: "#334155", border: "1px solid #cbd5e1", borderRadius: "6px", padding: "0.5rem 0.85rem", fontSize: "0.82rem", fontWeight: 800, cursor: "pointer" },
  disabledBtn: { background: "#cbd5e1", color: "#64748b", border: "1px solid #cbd5e1", borderRadius: "6px", padding: "0.5rem 0.85rem", fontSize: "0.82rem", fontWeight: 800, cursor: "not-allowed" },
  advancedDetails: { marginTop: "1.5rem", borderTop: "1px solid #e2e8f0", paddingTop: "1rem" },
  advancedSummary: { fontSize: "0.82rem", fontWeight: 700, color: "#64748b", cursor: "pointer", userSelect: "none" },
  advancedContent: { marginTop: "1rem", padding: "1rem", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px" },
};
