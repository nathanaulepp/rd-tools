// src/pages/SettingsPage.tsx
// Phase 6: Settings page — manages submission_requirements table.
// Allows toggling required fields without code changes.

import React, { useState, useEffect, CSSProperties } from "react";
import {
  getSubmissionRequirements,
  updateSubmissionRequirement,
  SubmissionRequirement,
} from "../shared/api/db";

interface SettingsPageProps {
  handleExitToStart: () => void;
}

export default function SettingsPage({ handleExitToStart }: SettingsPageProps) {
  const [requirements, setRequirements] = useState<SubmissionRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState("");

  useEffect(() => {
    loadRequirements();
  }, []);

  const loadRequirements = async () => {
    setLoading(true);
    try {
      setRequirements(await getSubmissionRequirements());
    } catch (e) {
      console.error("Failed to load requirements:", e);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 2500);
  };

  const handleToggle = async (req: SubmissionRequirement) => {
    setSavingKey(req.field_key);
    try {
      await updateSubmissionRequirement(req.field_key, !req.required);
      setRequirements(prev =>
        prev.map(r => r.field_key === req.field_key ? { ...r, required: !r.required } : r)
      );
      showToast(`"${req.label}" updated ✓`);
    } catch (e) {
      console.error("Update failed:", e);
      showToast("⚠ Save failed");
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div style={s.container}>
      <header style={s.header}>
        <div style={s.headerInner}>
          <button style={s.backBtn} onClick={handleExitToStart}>← Back to Home</button>
          <div>
            <h2 style={s.title}>Settings</h2>
            <p style={s.subtitle}>Configure application behaviour without code changes</p>
          </div>
        </div>
      </header>

      <div style={s.content}>

        {/* ── Submission Requirements ── */}
        <section style={s.section}>
          <div style={s.sectionHeader}>
            <div>
              <h3 style={s.sectionTitle}>Note Submission Requirements</h3>
              <p style={s.sectionDesc}>
                Toggle which fields must be filled before a note can be submitted.
                Changes take effect immediately — no restart required.
              </p>
            </div>
          </div>

          {loading ? (
            <div style={s.centered}>
              <div style={s.spinner} />
              <p style={{ color: "var(--text-muted)" }}>Loading requirements…</p>
            </div>
          ) : (
            <div style={s.requirementsList}>
              {requirements.map(req => (
                <div key={req.field_key} style={s.requirementRow}>
                  <div>
                    <div style={s.reqLabel}>{req.label}</div>
                    <div style={s.reqKey}>field: {req.field_key}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    {savingKey === req.field_key && (
                      <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Saving…</span>
                    )}
                    <button
                      onClick={() => handleToggle(req)}
                      disabled={savingKey === req.field_key}
                      style={{
                        ...s.toggleBtn,
                        background: req.required ? "#27ae60" : "#e2e8f0",
                        color: req.required ? "#fff" : "#64748b",
                      }}
                    >
                      {req.required ? "Required ✓" : "Optional"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={s.infoBox}>
            <span style={{ fontSize: "1rem" }}>ℹ️</span>
            <div>
              <strong>Data-driven requirements</strong> — these rules live in the
              {" "}<code style={s.code}>submission_requirements</code> table and can also be
              extended programmatically via <code style={s.code}>addSubmissionRequirement()</code>.
              No code deploy needed.
            </div>
          </div>
        </section>

        {/* ── Schema Info ── */}
        <section style={s.section}>
          <h3 style={s.sectionTitle}>Database Schema (Phase 6)</h3>
          <p style={s.sectionDesc}>
            The following columns were added to the <code style={s.code}>notes</code> table via
            safe <code style={s.code}>ALTER TABLE</code> migrations. They slot in as JSON blobs
            alongside the existing domains — no data migration was needed.
          </p>
          <div style={s.schemaTable}>
            {[
              { col: "diagnosis",        type: "TEXT (JSON)", desc: "PES statements, priority ranking, narrative" },
              { col: "intervention",     type: "TEXT (JSON)", desc: "ND / Education / Counseling / Coordination of Care" },
              { col: "monitor_evaluate", type: "TEXT (JSON)", desc: "Indicators, criteria, outcome evaluation, discharge plan" },
            ].map(row => (
              <div key={row.col} style={s.schemaRow}>
                <code style={{ ...s.code, fontSize: "0.85rem", color: "#2980b9" }}>{row.col}</code>
                <span style={{ fontSize: "0.75rem", color: "#94a3b8", marginLeft: "0.5rem" }}>{row.type}</span>
                <span style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginLeft: "auto" }}>{row.desc}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Future hooks callout ── */}
        <section style={s.section}>
          <h3 style={s.sectionTitle}>Planned Extensions (Phase 6 hooks)</h3>
          <div style={s.hooksList}>
            {[
              { icon: "📄", title: "Export to PDF", desc: "Tauri Wry shell → window.print() with print-optimised CSS. Already functional via the 'Print Note' button in the Clinical Summary view." },
              { icon: "🔒", title: "Role-Based Requirements", desc: "submission_requirements can grow a 'role' column so inpatient vs outpatient RDs enforce different field sets." },
              { icon: "📊", title: "Analytics Domain", desc: "A future 'analytics' JSON column on notes would store computed EER/protein targets, GFR trends, etc. One ALTER TABLE away." },
            ].map(h => (
              <div key={h.title} style={s.hookCard}>
                <span style={{ fontSize: "1.5rem" }}>{h.icon}</span>
                <div>
                  <div style={s.hookTitle}>{h.title}</div>
                  <div style={s.hookDesc}>{h.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Toast */}
      <div style={{
        position: "fixed", bottom: "1.5rem", left: "50%", transform: `translateX(-50%) translateY(${toastMsg ? "0" : "80px"})`,
        background: "var(--primary)", color: "#fff", padding: "0.5rem 1.25rem", borderRadius: "30px",
        fontSize: "0.85rem", boxShadow: "0 4px 6px rgba(0,0,0,0.1)", transition: "transform 0.3s ease", zIndex: 1000,
        opacity: toastMsg ? 1 : 0, pointerEvents: "none",
      }}>
        {toastMsg}
      </div>
    </div>
  );
}

const s: Record<string, CSSProperties> = {
  container: { minHeight: "100vh", paddingBottom: "3rem" },
  header: { padding: "1.5rem 2rem" },
  headerInner: { maxWidth: "800px", margin: "0 auto" },
  backBtn: { background: "none", border: "none", color: "#3498db", cursor: "pointer", fontSize: "0.85rem", fontWeight: 700, padding: 0, marginBottom: "0.75rem", display: "block" },
  title: { margin: "0 0 0.25rem", fontSize: "1.5rem", fontWeight: 800 },
  subtitle: { margin: 0, fontSize: "0.9rem", color: "var(--text-muted)" },

  content: { maxWidth: "800px", margin: "0 auto", padding: "0 2rem" },

  section: { background: "var(--white)", border: "1px solid var(--border)", borderRadius: "12px", padding: "1.5rem", marginBottom: "1.5rem" },
  sectionHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" },
  sectionTitle: { margin: "0 0 0.35rem", fontSize: "1rem", fontWeight: 800 },
  sectionDesc: { margin: 0, fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.5 },

  requirementsList: { display: "flex", flexDirection: "column", gap: "0", border: "1px solid var(--border)", borderRadius: "8px", overflow: "hidden", marginTop: "1rem" },
  requirementRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.85rem 1rem", borderBottom: "1px solid var(--border)" },
  reqLabel: { fontWeight: 600, fontSize: "0.9rem" },
  reqKey: { fontSize: "0.72rem", color: "var(--text-muted)", fontFamily: "monospace", marginTop: "2px" },
  toggleBtn: { border: "none", borderRadius: "20px", padding: "0.35rem 1rem", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer", transition: "all 0.2s", minWidth: "100px" },

  centered: { textAlign: "center", padding: "2rem 0" },
  spinner: { width: "24px", height: "24px", border: "3px solid var(--border)", borderTopColor: "#3498db", borderRadius: "50%", margin: "0 auto 1rem", animation: "spin 1s linear infinite" },

  infoBox: { display: "flex", gap: "0.75rem", alignItems: "flex-start", background: "#f0f7ff", border: "1px solid #bfdbfe", borderRadius: "8px", padding: "0.85rem 1rem", marginTop: "1rem", fontSize: "0.82rem", lineHeight: 1.6, color: "#1e3a5f" },

  code: { fontFamily: "monospace", background: "#f1f5f9", padding: "1px 5px", borderRadius: "3px", fontSize: "0.8rem" },

  schemaTable: { border: "1px solid var(--border)", borderRadius: "8px", overflow: "hidden", marginTop: "0.75rem" },
  schemaRow: { display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1rem", borderBottom: "1px solid var(--border)", flexWrap: "wrap" },

  hooksList: { display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "0.75rem" },
  hookCard: { display: "flex", gap: "0.75rem", alignItems: "flex-start", padding: "0.85rem 1rem", background: "var(--bg-color)", borderRadius: "8px" },
  hookTitle: { fontWeight: 700, fontSize: "0.9rem", marginBottom: "0.2rem" },
  hookDesc: { fontSize: "0.82rem", color: "var(--text-muted)", lineHeight: 1.5 },
};