import { CSSProperties } from "react";

export default function SchemaInfoPanel() {
  return (
    <>
      {/* 2. DATABASE SCHEMA INFO */}
      <section style={s.section}>
        <h3 style={s.sectionTitle}>Database Schema</h3>
        <p style={s.sectionDesc}>
          The following columns are stored as JSON blobs in the <code style={s.code}>notes</code> table. 
          This structure allows for rapid field expansion without changing the database core.
        </p>
        <div style={s.schemaTable}>
          {[
            { col: "diagnosis",        type: "TEXT (JSON)", desc: "PES statements, priority ranking, narrative" },
            { col: "intervention",     type: "TEXT (JSON)", desc: "ND / Education / Counseling / Coordination of Care" },
            { col: "monitor_evaluate", type: "TEXT (JSON)", desc: "Indicators, criteria, outcome evaluation, discharge plan" },
            { col: "standards",        type: "TEXT (JSON)", desc: "Condition-based evaluation targets and PAL factors" },
          ].map(row => (
            <div key={row.col} style={s.schemaRow}>
              <code style={{ ...s.code, fontSize: "0.85rem", color: "#2980b9" }}>{row.col}</code>
              <span style={{ fontSize: "0.75rem", color: "#94a3b8", marginLeft: "0.5rem" }}>{row.type}</span>
              <span style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginLeft: "auto" }}>{row.desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 3. PLANNED EXTENSIONS */}
      <section style={s.section}>
        <h3 style={s.sectionTitle}>Planned Extensions (Phase 6 hooks)</h3>
        <div style={s.hooksList}>
          {[
            { icon: "🔒", title: "Role-Based Requirements", desc: "Logic to enforce different mandatory fields for inpatient vs. outpatient RDs." },
            { icon: "📊", title: "Analytics Domain", desc: "Proposed module for tracking GFR trends, EER/Protein targets, and weight history analytics." },
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
    </>
  );
}

const s: Record<string, CSSProperties> = {
  section: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "1.5rem", marginBottom: "1.5rem", boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
  sectionTitle: { margin: "0 0 0.35rem", fontSize: "1rem", fontWeight: 800, color: '#1e293b' },
  sectionDesc: { margin: "0 0 1rem", fontSize: "0.85rem", color: "#64748b", lineHeight: 1.5 },
  schemaTable: { border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden", marginTop: "0.75rem" },
  schemaRow: { display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1rem", borderBottom: "1px solid #f1f5f9", flexWrap: "wrap" },
  hooksList: { display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "0.75rem" },
  hookCard: { display: "flex", gap: "0.75rem", alignItems: "flex-start", padding: "0.85rem 1rem", background: "#f8fafc", borderRadius: "8px", border: '1px solid #e2e8f0' },
  hookTitle: { fontWeight: 700, fontSize: "0.9rem", marginBottom: "0.2rem", color: '#1e293b' },
  hookDesc: { fontSize: "0.82rem", color: "#64748b", lineHeight: 1.5 },
  code: { fontFamily: "monospace", background: "#f1f5f9", padding: "1px 5px", borderRadius: "3px", fontSize: "0.8rem", color: '#2c3e50' },
};
