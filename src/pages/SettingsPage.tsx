import { useState, CSSProperties } from "react";
import { useEscapeBackout } from "../shared/utils/ShortcutContext";
import EnteralFormulaManager from "../features/settings/formulary/EnteralFormulaManager";
import HospitalDietManager from "../features/settings/diets/HospitalDietManager";
import DysphagiaModManager from "../features/settings/diets/DysphagiaModManager";
import SubmissionRequirementsPanel from "../features/settings/SubmissionRequirementsPanel";
import SchemaInfoPanel from "../features/settings/SchemaInfoPanel";
import ChemistryTemplatesPanel from "../features/settings/ChemistryTemplatesPanel";
import RxNormSettingsPanel from "../features/settings/RxNormSettingsPanel";

// ─── Components ───────────────────────────────────────────────────────────────

interface SettingsPageProps {
  handleExitToStart: () => void;
}

export default function SettingsPage({ handleExitToStart }: SettingsPageProps) {
  useEscapeBackout(handleExitToStart);

  const [activeTab, setActiveTab] = useState<"requirements" | "rxnorm" | "formulary" | "chemistry" | "diets">("requirements");
  const [toastMsg, setToastMsg] = useState("");

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 2500);
  };

  return (
    <div style={s.container}>
      <header style={s.header}>
        <div style={s.headerInner}>
          <button style={s.backBtn} onClick={handleExitToStart}>← Back to Home</button>
          <h2 style={s.title}>Configuration & Logic</h2>
          <p style={s.subtitle}>Manage submission requirements and available inputs</p>

          {/* Tab strip */}
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
            {[
              { id: "requirements", label: "⚙ Submission Requirements" },
              { id: "rxnorm",       label: "Medication Search" },
              { id: "formulary",    label: "Enteral Formulary" },
              { id: "chemistry",    label: "Chemistry Templates" },
              { id: "diets",        label: "Diet List" },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as "requirements" | "rxnorm" | "formulary" | "chemistry" | "diets")}
                style={{
                  padding: "6px 16px",
                  borderRadius: "8px",
                  border: activeTab === tab.id ? "none" : "1px solid #e2e8f0",
                  background: activeTab === tab.id ? "#3498db" : "#fff",
                  color: activeTab === tab.id ? "#fff" : "#64748b",
                  fontWeight: 700,
                  fontSize: "0.82rem",
                  cursor: "pointer",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div style={{ ...s.content, maxWidth: activeTab === "diets" ? "1200px" : "800px" }}>
        {activeTab === "requirements" ? (
          <>
            <SubmissionRequirementsPanel showToast={showToast} />
            <SchemaInfoPanel />
          </>
        ) : activeTab === "rxnorm" ? (
          <RxNormSettingsPanel />
        ) : activeTab === "chemistry" ? (
          <ChemistryTemplatesPanel showToast={showToast} />
        ) : activeTab === "diets" ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", alignItems: "start" }}>
            <section style={s.section}>
              <h3 style={s.sectionTitle}>Hospital Diet List</h3>
              <p style={s.sectionDesc}>
                Define the orderable diets available at your facility.
              </p>
              <HospitalDietManager />
            </section>
            <section style={s.section}>
              <h3 style={s.sectionTitle}>Dysphagia Modifications</h3>
              <p style={s.sectionDesc}>
                Define texture and liquid consistency modifications (IDDSI levels and facility-specific labels).
              </p>
              <DysphagiaModManager />
            </section>
          </div>
        ) : (
          <section style={s.section}>
            <h3 style={s.sectionTitle}>Hospital Enteral Formulary</h3>
            <p style={s.sectionDesc}>
              Add and manage the EN formulas available at your facility. This data persists
              globally — not per note — so you only need to set it up once.
            </p>
            <EnteralFormulaManager />
          </section>
        )}
      </div>

      {/* Toast */}
      <div style={{
        position: "fixed", bottom: "1.5rem", left: "50%", transform: `translateX(-50%) translateY(${toastMsg ? "0" : "80px"})`,
        background: "#1e293b", color: "#fff", padding: "0.5rem 1.25rem", borderRadius: "30px",
        fontSize: "0.85rem", boxShadow: "0 4px 12px rgba(0,0,0,0.2)", transition: "all 0.3s ease", zIndex: 1000,
        opacity: toastMsg ? 1 : 0, pointerEvents: "none", fontWeight: 600,
      }}>
        {toastMsg}
      </div>
    </div>
  );
}

const s: Record<string, CSSProperties> = {
  container: { minHeight: "100vh", background: '#f8fafc', paddingBottom: '4rem' },
  header: { padding: "2rem", background: '#fff', borderBottom: '1px solid #e2e8f0', marginBottom: '2rem' },
  headerInner: { maxWidth: "800px", margin: "0 auto" },
  backBtn: { background: "none", border: "none", color: "#e74c3c", cursor: "pointer", fontSize: "0.85rem", fontWeight: 700, padding: 0, marginBottom: "0.75rem", display: "block" },
  title: { margin: "0 0 0.25rem", fontSize: "1.75rem", fontWeight: 800, color: '#0f172a' },
  subtitle: { margin: 0, fontSize: "0.95rem", color: "#64748b" },
  content: { maxWidth: "800px", margin: "0 auto", padding: "0 1.5rem" },
  section: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "1.5rem", marginBottom: "1.5rem", boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
  sectionTitle: { margin: "0 0 0.35rem", fontSize: "1rem", fontWeight: 800, color: '#1e293b' },
  sectionDesc: { margin: "0 0 1rem", fontSize: "0.85rem", color: "#64748b", lineHeight: 1.5 },
};
