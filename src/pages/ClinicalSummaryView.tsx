// src/pages/ClinicalSummaryView.tsx
// Phase 6: Added export_note_pdf Tauri command button + new domain sections

import React, { CSSProperties } from "react";
import { Patient, Note } from "../shared/api/db";
import { LAB_CATEGORIES } from "../shared/constants/labCategories";

// Phase 6: Tauri invoke for PDF export (falls back gracefully in browser)
async function invokePdfExport() {
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("export_note_pdf");
  } catch (_e) {
    // Fallback: browser print dialog
    window.print();
  }
}

interface ClinicalSummaryViewProps {
  patient: Patient;
  note: Note;
  patientData: any;
  anthro: any;
  dexaScans: any[];
  labs: any;
  clinical: any;
  dietary: any;
  diagnosis?: any;
  intervention?: any;
  monitorEval?: any;
  calculatedMetrics: any;
  handleExitToStart: () => void;
}

export default function ClinicalSummaryView({
  patient,
  note,
  anthro,
  labs,
  clinical,
  dietary,
  diagnosis,
  intervention,
  monitorEval,
  calculatedMetrics,
  handleExitToStart,
}: ClinicalSummaryViewProps) {

  const renderSection = (title: string, children: React.ReactNode) => (
    <div style={styles.section}>
      <h3 style={styles.sectionTitle}>{title}</h3>
      <div style={styles.sectionContent}>{children}</div>
    </div>
  );

  const renderRow = (label: string, value: any, unit: string = "") => {
    if (!value || value === "" || value === "--") return null;
    return (
      <div style={styles.dataRow}>
        <span style={styles.dataLabel}>{label}:</span>
        <span style={styles.dataValue}>{value} {unit}</span>
      </div>
    );
  };

  const renderLabTable = () => {
    const activeLabs = LAB_CATEGORIES.filter(cat =>
      cat.fields.some(f => labs[f]?.current || labs[f]?.historical)
    );
    if (activeLabs.length === 0) return <p style={styles.emptyText}>No biochemical data recorded.</p>;

    return activeLabs.map(cat => (
      <div key={cat.title} style={{ marginBottom: "1rem" }}>
        <h4 style={styles.subTitle}>{cat.title}</h4>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Test</th>
              <th style={styles.th}>Current</th>
              <th style={styles.th}>Historical</th>
            </tr>
          </thead>
          <tbody>
            {cat.fields.map(field => {
              if (!labs[field]?.current && !labs[field]?.historical) return null;
              return (
                <tr key={field}>
                  <td style={styles.td}><strong>{field}</strong></td>
                  <td style={styles.td}>{labs[field]?.current || "---"}</td>
                  <td style={styles.td}>{labs[field]?.historical || "---"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    ));
  };

  // ── Phase 6: PES summary ──────────────────────────────────────────────────
  const renderDiagnosis = () => {
    if (!diagnosis?.problem && !(diagnosis?.additionalDiagnoses?.length)) {
      return <p style={styles.emptyText}>No nutrition diagnoses recorded.</p>;
    }
    const all = [
      { problem: diagnosis?.problem, etiology: diagnosis?.etiology, signsSymptoms: diagnosis?.signsSymptoms },
      ...(diagnosis?.additionalDiagnoses || []),
    ].filter(d => d.problem);

    return (
      <>
        {all.map((dx, i) => (
          <div key={i} style={{ marginBottom: "0.75rem", paddingLeft: "0.75rem", borderLeft: "3px solid #3498db" }}>
            <span style={{ fontWeight: 700, color: "#1e40af" }}>{dx.problem}</span>
            {dx.etiology && <> <span style={{ color: "#64748b" }}>related to</span> <span>{dx.etiology}</span></>}
            {dx.signsSymptoms && <> <span style={{ color: "#64748b" }}> as evidenced by</span> <span>{dx.signsSymptoms}</span></>}
          </div>
        ))}
        {diagnosis?.nutritionDxNarrative && renderRow("Narrative", diagnosis.nutritionDxNarrative)}
      </>
    );
  };

  const renderIntervention = () => {
    if (!intervention) return <p style={styles.emptyText}>No intervention data recorded.</p>;
    return (
      <>
        {renderRow("Goal", intervention.goalStatement)}
        {renderRow("Timeframe", intervention.goalTimeframe)}
        {renderRow("ND — Meals/Snacks", intervention.nd_mealsSnacks)}
        {renderRow("ND — Supplemental Feeding", intervention.nd_supplementalFeeding)}
        {renderRow("ND — Med Management", intervention.nd_nutritionRelatedMedMgmt)}
        {renderRow("Education Purpose", intervention.ed_purpose)}
        {Array.isArray(intervention.ed_content) && intervention.ed_content.length > 0 && renderRow("Education Topics", intervention.ed_content.join(", "))}
        {renderRow("Counseling Approach", intervention.c_theory)}
        {renderRow("Referrals", intervention.cc_referrals)}
        {renderRow("Discharge Recs", intervention.cc_dischargeRecommendations)}
        {renderRow("Follow-Up Plan", intervention.cc_followUpPlan)}
      </>
    );
  };

  const renderMonitorEval = () => {
    if (!monitorEval) return <p style={styles.emptyText}>No monitoring/evaluation data recorded.</p>;
    const progressLabel: Record<string, string> = {
      improved: "✅ Improved", "no-change": "→ No Change", worsened: "⚠ Worsened",
      met: "✓ Goal Met", "not-met": "✗ Goal Not Met",
    };
    return (
      <>
        {Array.isArray(monitorEval.monitoredIndicators) && monitorEval.monitoredIndicators.length > 0 && renderRow("Monitored Indicators", monitorEval.monitoredIndicators.join(", "))}
        {renderRow("Monitoring Frequency", monitorEval.monitorFrequency)}
        {renderRow("Anthropometric Targets", monitorEval.criteria_anthropo)}
        {renderRow("Biochemical Targets", monitorEval.criteria_labs)}
        {renderRow("Dietary Targets", monitorEval.criteria_dietary)}
        {monitorEval.outcome_progress && renderRow("Progress", progressLabel[monitorEval.outcome_progress] || monitorEval.outcome_progress)}
        {renderRow("Outcome Narrative", monitorEval.outcome_narrative)}
        {renderRow("Next Steps", monitorEval.outcome_nextSteps)}
        {renderRow("Discharge Recommendations", monitorEval.dischargeRecs)}
        {renderRow("Transition Plan", monitorEval.transitionPlan)}
      </>
    );
  };

  return (
    <div style={styles.container} className="print-safe-container">
      <div style={styles.noPrint}>
        <button style={styles.backBtn} onClick={handleExitToStart}>← Back to Home</button>
        <button style={styles.printBtn} onClick={invokePdfExport}>Export / Print Note</button>
      </div>

      <div style={styles.page} className="printable-note">
        {/* Header */}
        <div style={styles.header}>
          <div style={{ flex: 1 }}>
            <h1 style={styles.patientName}>{patient.last_name}, {patient.first_name}</h1>
            <div style={styles.headerMeta}>
              <span><strong>MRN:</strong> {patient.mrn || "N/A"}</span>
              <span><strong>DOB:</strong> {patient.dob}</span>
              <span><strong>Sex:</strong> {patient.sex || "N/A"}</span>
            </div>
          </div>
          <div style={styles.noteStatus}>
            <div style={styles.statusBadge}>CLINICAL DOCUMENTATION</div>
            <div style={styles.noteDate}>Date of Note: {note.note_date || "---"}</div>
            <div style={styles.noteSub}>Admission: {note.admission_date || "---"}</div>
            <div style={styles.noteSub}>Version: {note.version} (Submitted)</div>
          </div>
        </div>

        <div style={styles.divider} />

        {/* A. Anthropometrics */}
        {renderSection("A. Anthropometrics & Body Composition", (
          <div style={styles.grid2}>
            <div>
              <h4 style={styles.subTitle}>Current Measurements</h4>
              {renderRow("Height", anthro.ht, anthro.htUnit)}
              {renderRow("Weight", anthro.wt, anthro.wtUnit)}
              {renderRow("BMI", calculatedMetrics.bmi, "kg/m²")}
              {renderRow("UBW", anthro.ubw, anthro.wtUnit)}
            </div>
            <div>
              <h4 style={styles.subTitle}>Physical Exam Measures</h4>
              {renderRow("Waist Circ", anthro.waist, anthro.circUnit)}
              {renderRow("Mid-Arm Circ", anthro.mac, anthro.circUnit)}
              {renderRow("Calf Circ", anthro.calf, anthro.circUnit)}
              {renderRow("Head Circ", anthro.head, anthro.circUnit)}
            </div>
          </div>
        ))}

        {/* B. Biochemical */}
        {renderSection("B. Biochemical Data", renderLabTable())}

        {/* C. Clinical */}
        {renderSection("C. Clinical Findings & Physical Exam", (
          <>
            {renderRow("Chief Complaint", clinical.chiefComplaint)}
            {renderRow("Medical History", clinical.medHx)}
            <div style={{ marginTop: "1rem" }}>
              <h4 style={styles.subTitle}>Vitals</h4>
              <div style={styles.grid5}>
                {renderRow("Temp", clinical.temp, "°F")}
                {renderRow("HR", clinical.hr, "bpm")}
                {renderRow("SpO2", clinical.spo2, "%")}
                {renderRow("BP", clinical.bp, "mmHg")}
                {renderRow("RR", clinical.rr, "bpm")}
              </div>
            </div>
          </>
        ))}

        {/* D. Dietary */}
        {renderSection("D. Dietary History & Nutrition Support", (
          <div style={styles.grid2}>
            <div>
              <h4 style={styles.subTitle}>Intake Summary</h4>
              {renderRow("Diet Order", dietary.dietOrder)}
              {renderRow("Estimated Calories", dietary.oralCalories, "kcal/d")}
              {renderRow("Estimated Protein", dietary.oralProtein, "g/d")}
            </div>
            <div>
              <h4 style={styles.subTitle}>Access & Context</h4>
              {renderRow("Meal Patterns", dietary.mealPatterns)}
              {renderRow("Fluid Intake", dietary.fluidIntake)}
              {renderRow("Food Security", dietary.foodSecurity)}
            </div>
          </div>
        ))}

        {/* Phase 6 new domains */}
        {renderSection("Dx. Nutrition Diagnosis", renderDiagnosis())}
        {renderSection("I. Nutrition Intervention", renderIntervention())}
        {renderSection("ME. Monitor & Evaluate", renderMonitorEval())}

        <div style={styles.footer}>
          <div style={styles.divider} />
          <div style={styles.signatureRow}>
            <span>Electronically Submitted: {note.submitted_at ? new Date(note.submitted_at).toLocaleString() : "---"}</span>
            <span style={styles.signatureLine}>Registered Dietitian Signature</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  container: { background: "#f1f5f9", minHeight: "100vh", padding: "2rem 1rem" },
  page: { background: "#fff", maxWidth: "850px", margin: "0 auto", padding: "3rem", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", borderRadius: "8px", fontFamily: "'Inter', system-ui, sans-serif", color: "#0f172a", lineHeight: 1.5 },
  noPrint: { maxWidth: "850px", margin: "0 auto 1.5rem", display: "flex", justifyContent: "space-between" },
  backBtn: { background: "none", border: "none", color: "#3498db", cursor: "pointer", fontWeight: 700 },
  printBtn: { background: "#0f172a", color: "#fff", border: "none", padding: "0.5rem 1.25rem", borderRadius: "6px", cursor: "pointer", fontWeight: 700 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" },
  patientName: { margin: "0 0 0.5rem", fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.02em" },
  headerMeta: { display: "flex", gap: "1.5rem", fontSize: "0.88rem", color: "#64748b" },
  noteStatus: { textAlign: "right" },
  statusBadge: { fontSize: "0.7rem", fontWeight: 900, background: "#f1f5f9", padding: "0.25rem 0.6rem", borderRadius: "4px", marginBottom: "0.5rem", display: "inline-block" },
  noteDate: { fontSize: "1rem", fontWeight: 700 },
  noteSub: { fontSize: "0.75rem", color: "#94a3b8" },
  divider: { height: "1px", background: "#e2e8f0", margin: "1.5rem 0" },
  section: { marginBottom: "2rem" },
  sectionTitle: { fontSize: "0.8rem", fontWeight: 900, color: "#3498db", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "2px solid #3498db", paddingBottom: "0.25rem", marginBottom: "1rem" },
  sectionContent: { paddingLeft: "0.5rem" },
  subTitle: { fontSize: "0.85rem", fontWeight: 700, margin: "0 0 0.5rem", color: "#475569" },
  dataRow: { display: "flex", marginBottom: "0.4rem", fontSize: "0.9rem" },
  dataLabel: { width: "180px", fontWeight: 600, color: "#64748b" },
  dataValue: { flex: 1, color: "#1e293b" },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" },
  grid5: { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "1rem" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", marginBottom: "0.5rem" },
  th: { textAlign: "left", padding: "0.5rem", borderBottom: "1px solid #e2e8f0", color: "#94a3b8", fontWeight: 600 },
  td: { padding: "0.5rem", borderBottom: "1px solid #f1f5f9" },
  emptyText: { fontSize: "0.85rem", color: "#94a3b8", fontStyle: "italic" },
  footer: { marginTop: "4rem" },
  signatureRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", fontSize: "0.8rem", color: "#64748b" },
  signatureLine: { width: "250px", borderTop: "1px solid #cbd5e1", paddingTop: "0.5rem", textAlign: "center", fontWeight: 700, color: "#475569" },
};