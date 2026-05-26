// src/pages/ClinicalSummaryView.tsx
import React, { CSSProperties } from "react";
import { Patient, Note } from "../shared/api/db";
import { LAB_CATEGORIES } from "../shared/constants/labCategories";

interface ClinicalSummaryViewProps {
  patient: Patient;
  note: Note;
  patientData: any;
  anthro: any;
  dexaScans: any[];
  labs: any;
  clinical: any;
  dietary: any;
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

  return (
    <div style={styles.container}>
      <div style={styles.noPrint}>
        <button style={styles.backBtn} onClick={handleExitToStart}>← Back to Home</button>
        <button style={styles.printBtn} onClick={() => window.print()}>Print Note</button>
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

            <div style={{ marginTop: "1rem" }}>
              <h4 style={styles.subTitle}>NFPE Highlights</h4>
              <div style={styles.grid2}>
                <div>
                  <strong>Muscle Wasting:</strong>
                  {[
                    { l: "Temples", v: clinical.temples },
                    { l: "Clavicles", v: clinical.clavicles },
                    { l: "Shoulders", v: clinical.shoulders },
                    { l: "Scapula", v: clinical.scapula },
                    { l: "Interosseous", v: clinical.interosseous },
                  ].filter(m => m.v && m.v !== "Normal").map(m => (
                    <div key={m.l} style={{ fontSize: "0.85rem" }}>• {m.l}: {m.v}</div>
                  ))}
                </div>
                <div>
                  <strong>Fat Loss & Fluid:</strong>
                  {[
                    { l: "Orbital Fat", v: clinical.orbital },
                    { l: "Triceps Fat", v: clinical.tricepsFat },
                    { l: "Pitting Edema", v: clinical.pittingEdema },
                    { l: "Ascites", v: clinical.ascites },
                  ].filter(f => f.v && f.v !== "Normal" && f.v !== "None").map(f => (
                    <div key={f.l} style={{ fontSize: "0.85rem" }}>• {f.l}: {f.v}</div>
                  ))}
                </div>
              </div>
              {clinical.clinicalNotes && (
                <div style={{ marginTop: "0.5rem", fontStyle: "italic", fontSize: "0.85rem" }}>
                  Notes: {clinical.clinicalNotes}
                </div>
              )}
            </div>
          </>
        ))}

        {/* D. Dietary */}
        {renderSection("D. Dietary History & Nutrition Support", (
          <>
            <div style={styles.grid2}>
              <div>
                <h4 style={styles.subTitle}>Intake Summary</h4>
                {renderRow("Diet Order", dietary.dietOrder)}
                {renderRow("Estimated Calories", dietary.oralCalories, "kcal/d")}
                {renderRow("Estimated Protein", dietary.oralProtein, "g/d")}
              </div>
              <div>
                <h4 style={styles.subTitle}>Intake Nuance</h4>
                {renderRow("Meal Patterns", dietary.mealPatterns)}
                {renderRow("Fluid Intake", dietary.fluidIntake)}
                {renderRow("Food Security", dietary.foodSecurity)}
              </div>
            </div>
            
            {dietary.recall && dietary.recall.length > 0 && dietary.recall.some((m: any) => m.value) && (
              <div style={{ marginTop: "1rem" }}>
                <h4 style={styles.subTitle}>24-Hour Recall</h4>
                {dietary.recall.map((m: any, idx: number) => m.value ? (
                  <div key={idx} style={{ marginBottom: "0.5rem", fontSize: "0.85rem" }}>
                    <strong>{m.label}:</strong> {m.value}
                  </div>
                ) : null)}
              </div>
            )}
          </>
        ))}

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
  page: { 
    background: "#fff", 
    maxWidth: "850px", 
    margin: "0 auto", 
    padding: "3rem", 
    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
    borderRadius: "8px",
    fontFamily: "'Inter', system-ui, sans-serif",
    color: "#0f172a",
    lineHeight: 1.5
  },
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
  dataLabel: { width: "160px", fontWeight: 600, color: "#64748b" },
  dataValue: { flex: 1, color: "#1e293b" },
  
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" },
  grid5: { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "1rem" },
  
  table: { width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", marginBottom: "0.5rem" },
  th: { textAlign: "left", padding: "0.5rem", borderBottom: "1px solid #e2e8f0", color: "#94a3b8", fontWeight: 600 },
  td: { padding: "0.5rem", borderBottom: "1px solid #f1f5f9" },
  
  emptyText: { fontSize: "0.85rem", color: "#94a3b8", fontStyle: "italic" },
  
  footer: { marginTop: "4rem" },
  signatureRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", fontSize: "0.8rem", color: "#64748b" },
  signatureLine: { width: "250px", borderTop: "1px solid #cbd5e1", paddingTop: "0.5rem", textAlign: "center", fontWeight: 700, color: "#475569" }
};
