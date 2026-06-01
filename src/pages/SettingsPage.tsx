import React, { useState, useEffect, useMemo, CSSProperties } from "react";
import {
  getSubmissionRequirements,
  updateSubmissionRequirement,
  addSubmissionRequirement,
  SubmissionRequirement,
} from "../shared/api/db";
import { useEscapeBackout } from "../shared/utils/ShortcutContext";

// ─── MASTER FIELD REGISTRY ───────────────────────────────────────────────────
const MASTER_DOMAINS = [
  {
    id: "patient",
    title: "Patient Identity",
    fields: [
      { key: "first_name", label: "First Name" },
      { key: "last_name",  label: "Last Name" },
      { key: "dob",        label: "Date of Birth" },
      { key: "mrn",        label: "Medical Record Number (MRN)" },
      { key: "note_date",  label: "Note Date" },
      { key: "admission_date", label: "Admission Date" },
      { key: "sex", label: "Sex" },
      { key: "languages", label: "Preferred Languages" },
    ]
  },
  {
    id: "anthro",
    title: "A. Anthropometrics",
    fields: [
      { key: "ht", label: "Height" },
      { key: "wt", label: "Weight" },
      { key: "ubw", label: "Usual Body Weight" },
      { key: "ubwDate", label: "UBW Date" },
      { key: "waist", label: "Waist Circumference" },
      { key: "mac", label: "Mid-Arm Circumference" },
      { key: "calf", label: "Calf Circumference" },
      { key: "head", label: "Head Circumference" },
      { key: "triceps", label: "Skinfold: Triceps" },
      { key: "subscapular", label: "Skinfold: Subscapular" },
      { key: "suprailiac", label: "Skinfold: Suprailiac" },
      { key: "thigh", label: "Skinfold: Thigh" },
    ]
  },
  {
    id: "clinical",
    title: "C. Clinical & NFPE",
    fields: [
      { key: "chiefComplaint", label: "Chief Complaint" },
      { key: "medHx", label: "Medical History" },
      { key: "familyHx", label: "Family History" },
      { key: "socialHx", label: "Social History" },
      { key: "allergiesIntolerances", label: "Allergies & Intolerances" },
      { key: "medicalDevices", label: "Medical Devices" },
      { key: "medications", label: "Medications" },
      { key: "temples", label: "NFPE: Temples" },
      { key: "clavicles", label: "NFPE: Clavicles" },
      { key: "shoulders", label: "NFPE: Shoulders" },
      { key: "scapula", label: "NFPE: Scapula" },
      { key: "interosseous", label: "NFPE: Interosseous" },
      { key: "thighs", label: "NFPE: Thighs" },
      { key: "calves", label: "NFPE: Calves" },
      { key: "orbital", label: "NFPE: Orbital Fat" },
      { key: "cheek", label: "NFPE: Cheek Fat" },
      { key: "tricepsFat", label: "NFPE: Triceps Fat" },
      { key: "midAxillary", label: "NFPE: Mid-Axillary" },
      { key: "pittingEdema", label: "NFPE: Pitting Edema" },
      { key: "pedalEdema", label: "NFPE: Pedal Edema" },
      { key: "ascites", label: "NFPE: Ascites" },
      { key: "temp", label: "Vital: Temperature" },
      { key: "hr", label: "Vital: Heart Rate" },
      { key: "spo2", label: "Vital: SpO2" },
      { key: "bp", label: "Vital: Blood Pressure" },
      { key: "rr", label: "Vital: Resp Rate" },
      { key: "gripStrength", label: "Grip Strength" },
      { key: "giDistress", label: "GI Distress" },
      { key: "chewing", label: "Chewing Ability" },
      { key: "swallowing", label: "Swallowing Ability" },
      { key: "imaging_smi", label: "Imaging: SMI" },
      { key: "tempMax", label: "Vital: Max Temp past 24h" },
      { key: "ve", label: "Vital: Minute Ventilation (Ve)" },
      { key: "fev1", label: "FEV1 % Predicted" },
      { key: "tbsa", label: "TBSA Burned (%)" },
      { key: "clinicalNotes", label: "General Clinical Notes" },
    ]
  },
  {
    id: "dietary",
    title: "D. Dietary Data",
    fields: [
      { key: "dietOrderCurrent", label: "Current Rx Diet Order" },
      { key: "oralCalories", label: "Oral Calories" },
      { key: "oralProtein", label: "Oral Protein" },
      { key: "oralWater", label: "Oral Water" },
      { key: "fluidIntake", label: "Total Fluid Intake" },
      { key: "macroAdequacy", label: "Macronutrient Adequacy" },
      { key: "mealPatterns", label: "Meal Patterns" },
      { key: "eeiPercent", label: "Estimated Intake (%)" },
      { key: "eeiTimeframe", label: "Intake Timeframe" },
      { key: "herbalCAM", label: "Herbal/CAM" },
      { key: "supplements", label: "Supplements" },
      { key: "understanding", label: "Nutrition Understanding" },
      { key: "readiness", label: "Readiness for Change" },
      { key: "foodSecurity", label: "Food Security" },
      { key: "physicalLevel", label: "Physical Activity Level" },
      { key: "adls", label: "ADLs" },
    ]
  },
  {
    id: "diagnosis",
    title: "Dx. Nutrition Diagnosis",
    fields: [
      { key: "problem", label: "Primary Problem (P)" },
      { key: "etiology", label: "Primary Etiology (E)" },
      { key: "signsSymptoms", label: "Primary Signs/Symptoms (S)" },
      { key: "nutritionDxNarrative", label: "Diagnostic Narrative" },
      { key: "priorityRanking", label: "Priority Ranking" },
    ]
  },
  {
    id: "intervention",
    title: "I. Intervention",
    fields: [
      { key: "nd_mealsSnacks", label: "ND: Meals & Snacks" },
      { key: "nd_supplementalFeeding", label: "ND: Enteral/Parenteral" },
      { key: "ed_purpose", label: "Education Purpose" },
      { key: "c_theory", label: "Counseling Theory" },
      { key: "cc_followUpPlan", label: "Follow-up Plan" },
      { key: "goalStatement", label: "Goal Statement" },
      { key: "interventionNotes", label: "Intervention Notes" },
    ]
  },
  {
    id: "monitorEval",
    title: "ME. Monitor & Evaluate",
    fields: [
      { key: "monitorFrequency", label: "Monitor Frequency" },
      { key: "monitoredBy", label: "Monitored By" },
      { key: "outcome_progress", label: "Outcome Progress" },
      { key: "dischargeRecs", label: "Discharge Recommendations" },
      { key: "meNotes", label: "ME Notes" },
    ]
  }
];

// ─── Components ───────────────────────────────────────────────────────────────

interface SettingsPageProps {
  handleExitToStart: () => void;
}

export default function SettingsPage({ handleExitToStart }: SettingsPageProps) {
  useEscapeBackout(handleExitToStart);
  
  const [requirements, setRequirements] = useState<SubmissionRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [activeDomainId, setActiveDomainId] = useState<string>("patient");
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

  const handleToggle = async (fieldKey: string, label: string, currentlyRequired: boolean) => {
    setSavingKey(fieldKey);
    try {
      await addSubmissionRequirement(fieldKey, label);
      await updateSubmissionRequirement(fieldKey, !currentlyRequired);
      await loadRequirements();
      showToast(`"${label}" updated ✓`);
    } catch (e) {
      console.error("Update failed:", e);
      showToast("⚠ Save failed");
    } finally {
      setSavingKey(null);
    }
  };

  const currentDomain = MASTER_DOMAINS.find(d => d.id === activeDomainId);

  return (
    <div style={s.container}>
      <header style={s.header}>
        <div style={s.headerInner}>
          <button style={s.backBtn} onClick={handleExitToStart}>← Back to Home</button>
          <h2 style={s.title}>Configuration & Logic</h2>
          <p style={s.subtitle}>Master Menu: Manage mandatory fields across all ADIME modules</p>
        </div>
      </header>

      <div style={s.content}>
        {/* 1. MASTER MENU CARD */}
        <section style={s.section}>
          <div style={{ ...s.masterMenuHeader, borderBottom: '1px solid #e2e8f0', marginBottom: '0' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Step 1: Select Domain to Configure
            </span>
            <select 
              value={activeDomainId} 
              onChange={(e) => setActiveDomainId(e.target.value)}
              style={s.domainSelect}
            >
              {MASTER_DOMAINS.map(d => (
                <option key={d.id} value={d.id}>{d.title}</option>
              ))}
            </select>
          </div>

          <div style={s.fieldsList}>
            <div style={{ padding: '1rem 1.5rem 0.5rem', fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>
              Step 2: Toggle Mandatory Inputs
            </div>
            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center' }}>Loading logic...</div>
            ) : currentDomain?.fields.map(f => {
              const req = requirements.find(r => r.field_key === f.key);
              const isRequired = req?.required ?? false;
              const isSaving = savingKey === f.key;

              return (
                <div key={f.key} style={s.fieldRow}>
                  <div>
                    <div style={s.fieldName}>{f.label}</div>
                    <div style={s.fieldKey}>field: {f.key}</div>
                  </div>
                  <button
                    onClick={() => handleToggle(f.key, f.label, isRequired)}
                    disabled={isSaving}
                    style={{
                      ...s.toggleBtn,
                      background: isRequired ? "#27ae60" : "#f1f5f9",
                      color: isRequired ? "#fff" : "#64748b",
                      border: isRequired ? 'none' : '1px solid #cbd5e1'
                    }}
                  >
                    {isSaving ? "..." : isRequired ? "Mandatory ✓" : "Optional"}
                  </button>
                </div>
              );
            })}
          </div>

          <div style={s.infoBox}>
            <span style={{ fontSize: '1rem' }}>💡</span>
            <p>
              Fields marked as <strong>Mandatory</strong> will be checked during note submission. 
              If left blank, the clinician will be prompted to fix them before the record can be finalized.
            </p>
          </div>
        </section>

        {/* 2. DATABASE SCHEMA INFO */}
        <section style={s.section}>
          <h3 style={s.sectionTitle}>Database Schema (Phase 6)</h3>
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

  masterMenuHeader: {
    padding: '1rem',
    background: '#f8fafc',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '1rem'
  },
  domainSelect: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    background: '#fff',
    fontSize: '0.95rem',
    fontWeight: 700,
    color: '#1e293b',
    outline: 'none',
    cursor: 'pointer'
  },

  fieldsList: { marginTop: '0.5rem' },
  fieldRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.85rem 1.5rem',
    borderBottom: '1px solid #f1f5f9'
  },
  fieldName: { fontWeight: 700, fontSize: '0.92rem', color: '#1e293b' },
  fieldKey: { fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'monospace', marginTop: '1px' },

  toggleBtn: {
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '0.75rem',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.15s',
    minWidth: '105px',
    textAlign: 'center'
  },

  schemaTable: { border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden", marginTop: "0.75rem" },
  schemaRow: { display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1rem", borderBottom: "1px solid #f1f5f9", flexWrap: "wrap" },

  hooksList: { display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "0.75rem" },
  hookCard: { display: "flex", gap: "0.75rem", alignItems: "flex-start", padding: "0.85rem 1rem", background: "#f8fafc", borderRadius: "8px", border: '1px solid #e2e8f0' },
  hookTitle: { fontWeight: 700, fontSize: "0.9rem", marginBottom: "0.2rem", color: '#1e293b' },
  hookDesc: { fontSize: "0.82rem", color: "#64748b", lineHeight: 1.5 },

  code: { fontFamily: "monospace", background: "#f1f5f9", padding: "1px 5px", borderRadius: "3px", fontSize: "0.8rem", color: '#2c3e50' },
  infoBox: { display: "flex", gap: "0.75rem", alignItems: "flex-start", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "8px", padding: "1rem", marginTop: "1rem", fontSize: "0.82rem", lineHeight: 1.6, color: "#1e40af" },
};
