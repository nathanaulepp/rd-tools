// src/pages/ClinicalSummaryView.tsx
// Phase 6: Added export_note_pdf Tauri command button + new domain sections
// Fixed: now reads all domain data from Zustand stores directly (zero prop drilling)

import React, { CSSProperties } from "react";
import { useNoteStore } from "../stores/useNoteStore";
import { useAnthroStore } from "../stores/useAnthroStore";
import { useLabsStore } from "../stores/useLabsStore";
import { useClinicalStore } from "../stores/useClinicalStore";
import { useDietaryStore } from "../stores/useDietaryStore";
import { useDiagnosisStore } from "../stores/useDiagnosisStore";
import { useInterventionStore } from "../stores/useInterventionStore";
import { useMonitorEvalStore } from "../stores/useMonitorEvalStore";
import { useStandardsStore } from "../stores/useStandardsStore";
import { useRefeedingStore } from "../stores/useRefeedingStore";
import { useCalculatedMetrics } from "../stores/useCalculatedMetrics";
import { GLOBAL_LAB_CATALOG } from "../shared/data/biochemicalCatalog";
import { 
  scoreBMI, scoreWeightLoss, deriveWeightLoss, scoreEnergyOption1, 
  scoreEnergyOption2, scoreEnergyOption3,
  scoreElectrolytes, scoreFatLoss, scoreMuscLoss,
  scoreComorbidities, computeOverallRisk 
} from "../shared/utils/refeedingScreenLogic";
import { CriterionResult } from "../types/refeedingScreen";

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
  handleExitToStart: () => void;
}

export default function ClinicalSummaryView({ handleExitToStart }: ClinicalSummaryViewProps) {
  // Read everything from stores — no props for domain data
  const { activePatient: patient, activeNote: note } = useNoteStore();
  const { anthro, dexaScans } = useAnthroStore();
  const { labs, activeLabKeys } = useLabsStore();
  const { clinical } = useClinicalStore();
  const { dietary } = useDietaryStore();
  const { diagnosis } = useDiagnosisStore();
  const { intervention } = useInterventionStore();
  const { monitorEval } = useMonitorEvalStore();
  const { standards } = useStandardsStore();
  const { refeedingScreen } = useRefeedingStore();
  const calculatedMetrics = useCalculatedMetrics();

  if (!patient || !note) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>
        No note data available.
      </div>
    );
  }

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

  const renderVital = (label: string, value: any, unit: string = "") => {
    if (!value || value === "" || value === "--") return null;
    return (
      <div style={{ display: "flex", flexDirection: "column", marginBottom: "0.4rem" }}>
        <span style={{ fontWeight: 600, color: "#64748b", fontSize: "0.8rem", textTransform: "uppercase" }}>{label}</span>
        <span style={{ color: "#1e293b", fontSize: "0.95rem", fontWeight: 500 }}>{value} {unit}</span>
      </div>
    );
  };

  const renderLabTable = () => {
    if (!activeLabKeys || activeLabKeys.length === 0) {
      return <p style={styles.emptyText}>No biochemical data recorded.</p>;
    }

    // Group by panel
    const groups: Record<string, string[]> = {};
    activeLabKeys.forEach(key => {
      const entry = GLOBAL_LAB_CATALOG[key];
      if (!entry) return;
      if (!labs[key]?.current && !labs[key]?.historical) return;

      if (!groups[entry.panel]) groups[entry.panel] = [];
      groups[entry.panel].push(key);
    });

    const panels = Object.keys(groups);
    if (panels.length === 0) {
      return <p style={styles.emptyText}>No biochemical data recorded.</p>;
    }

    return panels.map(panelName => (
      <div key={panelName} style={{ marginBottom: "1rem" }}>
        <h4 style={styles.subTitle}>{panelName}</h4>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Test</th>
              <th style={styles.th}>Unit</th>
              <th style={styles.th}>Historical</th>
              <th style={styles.th}>Current</th>
            </tr>
          </thead>
          <tbody>
            {groups[panelName].map(key => {
              const entry = GLOBAL_LAB_CATALOG[key];
              return (
                <tr key={key}>
                  <td style={styles.td}><strong>{entry?.name || key}</strong></td>
                  <td style={styles.td}>{entry?.defaultUnit || "---"}</td>
                  <td style={styles.td}>{labs[key]?.historical || "---"}</td>
                  <td style={styles.td}>{labs[key]?.current || "---"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    ));
  };

  const renderMedList = (raw: string | undefined) => {
    if (!raw) return null;
    try {
      const entries: Array<{ name: string; dose: string; route: string; frequency: string; notes: string }> =
        JSON.parse(raw);
      if (!Array.isArray(entries) || entries.length === 0) return null;
      return (
        <ul style={{ margin: "0.25rem 0 0", paddingLeft: "1.1rem", fontSize: "0.88rem" }}>
          {entries
            .filter(e => e.name.trim())
            .map((e, i) => (
              <li key={i} style={{ marginBottom: "3px" }}>
                <strong>{e.name}</strong>
                {e.dose && ` · ${e.dose}`}
                {e.route && ` · ${e.route}`}
                {e.frequency && ` · ${e.frequency}`}
                {e.notes && <em style={{ color: "#64748b" }}> — {e.notes}</em>}
              </li>
            ))}
        </ul>
      );
    } catch {
      return <span style={{ fontSize: "0.88rem" }}>{raw}</span>;
    }
  };

  // ── Phase 6: PES summary ──────────────────────────────────────────────────────
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
        {diagnosis?.priorityRanking && renderRow("First Priority Diagnosis", diagnosis.priorityRanking)}
        {diagnosis?.nutritionDxNarrative && renderRow("Narrative", diagnosis.nutritionDxNarrative)}
      </>
    );
  };

  const renderIntervention = () => {
    if (!intervention) return <p style={styles.emptyText}>No intervention data recorded.</p>;
    const npActiveModes = intervention.npActiveModes || [];

    return (
      <>
        {renderRow("Intervention Goal", intervention.goalStatement)}
        <div style={{ marginBottom: "0.5rem" }} />
        {renderRow("Education Purpose", (intervention as any).ed_purpose)}
        {renderRow("Counseling Approach", (intervention as any).c_theory)}
        {renderRow("Referrals", (intervention as any).cc_referrals)}
        {renderRow("Discharge Recs", (intervention as any).cc_dischargeRecommendations)}
        {renderRow("Follow-Up Plan", (intervention as any).cc_followUpPlan)}

        {npActiveModes.length > 0 && (
          <div style={{ marginTop: "1rem" }}>
            {renderRow("Active Support Modes", npActiveModes.join(", "))}
          </div>
        )}

        {npActiveModes.includes("oral") && (
          <div style={{ marginTop: "1rem" }}>
            <h4 style={styles.subTitle}>Oral Nutrition</h4>
            <div style={styles.grid2}>
              <div>
                {renderRow("Oral Energy Target", intervention?.npOral?.energyKcal, "kcal")}
                {renderRow("Texture Modification", intervention?.npOral?.textureModification)}
                {renderRow("Oral Supplements", intervention?.npOral?.oralSupplements)}
              </div>
              <div>
                {renderRow("NPO Status", intervention?.npOral?.isNpo ? "Yes" : null)}
                {renderRow("Foods & Patterns", intervention?.npOral?.foodsAndPatterns?.join(", "))}
              </div>
            </div>
          </div>
        )}

        {npActiveModes.includes("enteral") && (
          <div style={{ marginTop: "1rem" }}>
            <h4 style={styles.subTitle}>Enteral Nutrition</h4>
            <div style={styles.grid2}>
              <div>
                {renderRow("EN Formula", intervention?.npEnteral?.formulaName)}
                {renderRow("EN Energy Target",
                  intervention?.npEnteral?.kcalLow && intervention?.npEnteral?.kcalHigh
                    ? `${intervention.npEnteral.kcalLow}–${intervention.npEnteral.kcalHigh}`
                    : null, "kcal")}
                {renderRow("EN Admin Method", intervention?.npEnteral?.adminMethod)}
              </div>
              <div>
                {renderRow("EN Daily Volume", intervention?.npEnteral?.dailyVolumeMl, "mL")}
                {renderRow("EN Infusion Rate", intervention?.npEnteral?.infusionRateMlHr, "mL/hr")}
              </div>
            </div>
          </div>
        )}

        {npActiveModes.includes("parenteral") && (
          <div style={{ marginTop: "1rem" }}>
            <h4 style={styles.subTitle}>Parenteral Nutrition</h4>
            <div style={styles.grid2}>
              <div>
                {renderRow("PN Energy", intervention?.npParenteral?.energyKcal, "kcal")}
                {renderRow("PN Amino Acids", intervention?.npParenteral?.aminoAcidsG, "g")}
                {renderRow("PN Dextrose", intervention?.npParenteral?.dextroseG, "g")}
              </div>
              <div>
                {renderRow("PN Lipids", intervention?.npParenteral?.lipidsG, "g")}
                {renderRow("PN Solution Type", intervention?.npParenteral?.solutionType)}
                {renderRow("PN Total Volume", intervention?.npParenteral?.totalFluidVolumeMl, "mL")}
              </div>
            </div>
          </div>
        )}

        {intervention?.ndImplementation?.selected && intervention.ndImplementation.selected.length > 0 && (
          <div style={{ marginTop: "1rem" }}>
            {renderRow("Interventions Selected", intervention.ndImplementation.selected.join("; "))}
          </div>
        )}
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
        {Array.isArray(monitorEval.monitoredIndicators) && monitorEval.monitoredIndicators.length > 0 && (
          renderRow("Monitored Indicators", monitorEval.monitoredIndicators.join(", "))
        )}
        {renderRow("Monitoring Frequency", monitorEval.monitorFrequency)}
        {renderRow("Anthropometric Targets",   monitorEval.criteria_anthropo)}
        {renderRow("Biochemical Targets",      monitorEval.criteria_labs)}
        {renderRow("Dietary Targets",          monitorEval.criteria_dietary)}
        {renderRow("Clinical Targets",         monitorEval.criteria_clinical)}
        {renderRow("Functional Targets",       monitorEval.criteria_functional)}
        
        {monitorEval.outcome_progress && renderRow("Progress", progressLabel[monitorEval.outcome_progress] || monitorEval.outcome_progress)}
        {renderRow("Outcome Narrative", monitorEval.outcome_narrative)}
        {renderRow("Next Steps",               monitorEval.outcome_nextSteps)}
        {renderRow("Discharge Recommendations", monitorEval.dischargeRecs)}
        {renderRow("Transition Plan",          monitorEval.transitionPlan)}
      </>
    );
  };

  const refeedingRiskLabel = (() => {
    if (!refeedingScreen?.screenedAt) return null;

    // 1. BMI
    const bmiNum = parseFloat(calculatedMetrics.bmi) || 0;
    const c1Auto = scoreBMI({
      bmiNum,
      isPediatric: calculatedMetrics.isPediatric,
      bmiZ: calculatedMetrics.bmiZ
    });
    const c1Risk = refeedingScreen.c1_override ? refeedingScreen.c1_manualRisk : c1Auto;

    // 2. Weight Loss
    const derivedWt = deriveWeightLoss(
      calculatedMetrics.wtKg,
      anthro.ubw,
      anthro.wtUnit,
      anthro.ubwDate,
      note.note_date || ""
    );
    const c2AutoRisk = (() => {
      if (refeedingScreen.c2_source === "na") return "none";
      if (calculatedMetrics.isPediatric) return "none";
      if (refeedingScreen.c2_source === "manual") {
        const pct = parseFloat(refeedingScreen.c2_manualPct) || 0;
        const days = parseFloat(refeedingScreen.c2_manualDays) || 0;
        return scoreWeightLoss({ pct, days, isPediatric: false });
      }
      if (!derivedWt) return "none";
      return scoreWeightLoss({ pct: derivedWt.pct, days: derivedWt.days, isPediatric: false });
    })();
    const c2PediatricManualRisk = calculatedMetrics.isPediatric && refeedingScreen.c2_source === "manual"
      ? scoreWeightLoss({
          isPediatric: true,
          pediatricExpectedGainPct: parseFloat(refeedingScreen.c2_manualPct) || 0
        })
      : "none";
    const c2Risk = refeedingScreen.c2_override 
      ? refeedingScreen.c2_manualRisk 
      : (calculatedMetrics.isPediatric && refeedingScreen.c2_source === "manual") 
        ? c2PediatricManualRisk 
        : c2AutoRisk;

    // 3. Energy Intake
    const c3AutoRisk = (() => {
      const pct = parseFloat(refeedingScreen.c3_intakePct) || 0;
      const days = parseFloat(refeedingScreen.c3_intakeDays) || 0;
      if (refeedingScreen.c3_option === "option1") return scoreEnergyOption1(days);
      if (refeedingScreen.c3_option === "option2") return scoreEnergyOption2(pct, days);
      if (refeedingScreen.c3_option === "option3") return scoreEnergyOption3(pct, days);
      return "none";
    })();
    const c3Risk = refeedingScreen.c3_override ? refeedingScreen.c3_manualRisk : c3AutoRisk;

    // 4. Electrolytes
    const c4Risk = scoreElectrolytes(refeedingScreen.c4_electrolytes);

    // 5. Fat Loss
    const c5Auto = scoreFatLoss(
      clinical.orbital,
      clinical.cheek,
      clinical.tricepsFat,
      clinical.midAxillary
    );
    const c5Risk = refeedingScreen.c5_override ? refeedingScreen.c5_manualRisk : c5Auto;

    // 6. Muscle Loss
    const c6Auto = scoreMuscLoss(
      clinical.temples,
      clinical.clavicles,
      clinical.shoulders,
      clinical.scapula,
      clinical.interosseous,
      clinical.thighs,
      clinical.calves
    );
    const c6Risk = refeedingScreen.c6_override ? refeedingScreen.c6_manualRisk : c6Auto;

    // 7. Comorbidities
    const c7Auto = scoreComorbidities(refeedingScreen.c7_selected);
    const c7Risk = refeedingScreen.c7_override ? refeedingScreen.c7_manualRisk : c7Auto;

    const criteria: CriterionResult[] = [
      { label: "BMI", risk: c1Risk, source: "auto" },
      { label: "Weight Loss", risk: c2Risk, source: "auto" },
      { label: "Energy Intake", risk: c3Risk, source: "auto" },
      { label: "Electrolytes", risk: c4Risk, source: "auto" },
      { label: "Fat Loss", risk: c5Risk, source: "auto" },
      { label: "Muscle Loss", risk: c6Risk, source: "auto" },
      { label: "Comorbidities", risk: c7Risk, source: "auto" },
    ];

    const overall = computeOverallRisk(criteria);
    if (overall.level === "significant") return "Significant Risk";
    if (overall.level === "moderate") return "Moderate Risk";
    return "Low / Not at Risk";
  })();

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
          <>
            <div style={styles.grid2}>
              <div>
                <h4 style={styles.subTitle}>Current Measurements</h4>
              {renderRow("Height", anthro?.ht, anthro?.htUnit)}
              {renderRow("Weight", anthro?.wt, anthro?.wtUnit)}
              {renderRow("BMI", calculatedMetrics.bmi, "kg/m²")}
              {renderRow("UBW", anthro?.ubw, anthro?.wtUnit)}
            </div>
            <div>
              <h4 style={styles.subTitle}>Physical Exam Measures</h4>
              {renderRow("Waist Circ", anthro?.waist, anthro?.circUnit)}
              {renderRow("Mid-Arm Circ", anthro?.mac, anthro?.circUnit)}
              {renderRow("Calf Circ", anthro?.calf, anthro?.circUnit)}
              {renderRow("Head Circ", anthro?.head, anthro?.circUnit)}
            </div>
          </div>
          {(anthro?.triceps || anthro?.subscapular || anthro?.suprailiac || anthro?.thigh) && (
            <div style={{ marginTop: "1rem" }}>
              <h4 style={styles.subTitle}>Skinfolds</h4>
              <div style={styles.grid2}>
                <div>
                  {renderRow("Triceps Skinfold", anthro?.triceps, anthro?.skinfoldUnit)}
                  {renderRow("Subscapular Skinfold", anthro?.subscapular, anthro?.skinfoldUnit)}
                </div>
                <div>
                  {renderRow("Suprailiac Skinfold", anthro?.suprailiac, anthro?.skinfoldUnit)}
                  {renderRow("Thigh Skinfold", anthro?.thigh, anthro?.skinfoldUnit)}
                </div>
              </div>
            </div>
          )}
          {anthro?.isFluidShift && (
            <div style={{ marginTop: "1rem" }}>
              <h4 style={styles.subTitle}>Fluid Shift</h4>
              {renderRow("Estimated Dry Weight", anthro?.edw, anthro?.edwUnit)}
            </div>
          )}
          {anthro?.amputations && anthro.amputations.length > 0 && (
            <div style={{ marginTop: "1rem" }}>
              {renderRow("Amputations", anthro.amputations.join(", "))}
            </div>
          )}
          {(anthro?.past_ht || anthro?.past_wt || anthro?.past_head || anthro?.past_htDate || anthro?.past_wtDate) && (
            <div style={{ marginTop: "1rem" }}>
              <h4 style={styles.subTitle}>Past Measurements</h4>
              <div style={styles.grid2}>
                <div>
                  {renderRow("Past Height", anthro?.past_ht, anthro?.past_htUnit)}
                  {renderRow("Past Weight", anthro?.past_wt, anthro?.past_wtUnit)}
                  {renderRow("Past Head Circ", anthro?.past_head, anthro?.past_headUnit)}
                </div>
                <div>
                  {renderRow("Past Height Date", anthro?.past_htDate)}
                  {renderRow("Past Weight Date", anthro?.past_wtDate)}
                </div>
              </div>
            </div>
          )}
          {dexaScans && dexaScans.length > 0 && (
            <div style={{ marginTop: "1rem" }}>
              <h4 style={styles.subTitle}>DEXA Scans</h4>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Date</th>
                    <th style={styles.th}>BMD</th>
                    <th style={styles.th}>Fat Mass</th>
                    <th style={styles.th}>Lean Mass</th>
                    <th style={styles.th}>Body Fat %</th>
                  </tr>
                </thead>
                <tbody>
                  {dexaScans.map((s, i) => (
                    <tr key={i}>
                      <td style={styles.td}>{s.date}</td>
                      <td style={styles.td}>{s.bmd}</td>
                      <td style={styles.td}>{s.fatMass}</td>
                      <td style={styles.td}>{s.leanMass}</td>
                      <td style={styles.td}>{s.bodyFatPct}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ))}

        {/* B. Biochemical */}
        {renderSection("B. Biochemical Data", renderLabTable())}

        {/* C. Clinical */}
        {renderSection("C. Clinical Findings & Physical Exam", (
          <>
            <div style={styles.grid2}>
              <div>
                <h4 style={styles.subTitle}>Medical Context</h4>
                {renderRow("Chief Complaint", clinical?.chiefComplaint)}
                {renderRow("Medical History", clinical?.medHx)}
                {renderRow("Family History", clinical?.familyHx)}
                {renderRow("Social History", clinical?.socialHx)}
                {renderRow("Allergies/Intolerances", clinical?.allergiesIntolerances)}
                {renderRow("Medical Devices", clinical?.medicalDevices)}
                {renderRow("Medications", clinical?.medications)}
                {renderRow("Screenings", clinical?.screenings)}
                {renderRow("Oral Hygiene", clinical?.oralHygiene)}
              </div>
              <div>
                <h4 style={styles.subTitle}>GI & Systemic</h4>
                {renderRow("GI Distress", clinical?.giDistress)}
                {renderRow("Oral/Chewing", clinical?.chewing)}
                {renderRow("Oral Hygiene", clinical?.oralHygiene)}
                {renderRow("Swallowing", clinical?.swallowing)}
                {renderRow("FEV1 % Predicted", clinical?.fev1)}
                {renderRow("TBSA Burned", clinical?.tbsa, "%")}
              </div>
            </div>

            <div style={{ marginTop: "1rem" }}>
              <h4 style={styles.subTitle}>Vital Signs</h4>
              <div style={styles.grid5}>
                {renderVital("Temp", clinical?.temp, "°F")}
                {renderVital("HR", clinical?.hr, "bpm")}
                {renderVital("SpO2", clinical?.spo2, "%")}
                {renderVital("BP", clinical?.bp, "mmHg")}
                {renderVital("RR", clinical?.rr, "bpm")}
                {renderVital("Max Temp", clinical?.tempMax, "°F")}
                {renderVital("Ve", clinical?.ve, "L/min")}
              </div>
            </div>

            <div style={{ marginTop: "1rem" }}>
              <h4 style={styles.subTitle}>NFPE Findings</h4>
              <div style={styles.grid2}>
                <div>
                  {renderRow("Muscle Wasting", [
                    clinical?.temples && `Temples (${clinical.temples})`,
                    clinical?.clavicles && `Clavicles (${clinical.clavicles})`,
                    clinical?.shoulders && `Shoulders (${clinical.shoulders})`,
                    clinical?.scapula && `Scapula (${clinical.scapula})`,
                    clinical?.interosseous && `Interosseous (${clinical.interosseous})`,
                    clinical?.thighs && `Thighs (${clinical.thighs})`,
                    clinical?.calves && `Calves (${clinical.calves})`,
                  ].filter(Boolean).join(", "))}
                  {renderRow("Fat Loss", [
                    clinical?.orbital && `Orbital (${clinical.orbital})`,
                    clinical?.cheek && `Cheek (${clinical.cheek})`,
                    clinical?.tricepsFat && `Triceps (${clinical.tricepsFat})`,
                    clinical?.midAxillary && `Mid-Axillary (${clinical.midAxillary})`,
                  ].filter(Boolean).join(", "))}
                </div>
                <div>
                  {renderRow("Fluid", [
                    clinical?.pittingEdema && `Edema (${clinical.pittingEdema})`,
                    clinical?.ascites && `Ascites (${clinical.ascites})`,
                    clinical?.edemaDescription
                  ].filter(Boolean).join(", "))}
                  {renderRow("Edema Description", clinical?.edemaDescription)}
                  {renderRow("Function", clinical?.gripStrength)}
                </div>
              </div>

              {(clinical?.hair?.length || clinical?.eyes?.length || clinical?.mouthLips?.length || clinical?.tongue?.length || clinical?.teethGums?.length || clinical?.headNeck?.length || clinical?.nails?.length || clinical?.skin?.length) ? (
                <div style={{ marginTop: "1rem" }}>
                  <h4 style={styles.subTitle}>Micronutrient Signs</h4>
                  <div style={styles.grid2}>
                    <div>
                      {renderRow("Hair Signs", clinical?.hair?.join(", "))}
                      {renderRow("Eye Signs", clinical?.eyes?.join(", "))}
                      {renderRow("Mouth/Lip Signs", clinical?.mouthLips?.join(", "))}
                      {renderRow("Tongue Signs", clinical?.tongue?.join(", "))}
                    </div>
                    <div>
                      {renderRow("Teeth/Gum Signs", clinical?.teethGums?.join(", "))}
                      {renderRow("Head/Neck Signs", clinical?.headNeck?.join(", "))}
                      {renderRow("Nail Signs", clinical?.nails?.join(", "))}
                      {renderRow("Skin Signs", clinical?.skin?.join(", "))}
                    </div>
                  </div>
                </div>
              ) : null}

              {renderRow("Exam Notes", clinical?.clinicalNotes)}
            </div>

            <div style={{ marginTop: "1rem" }}>
              <h4 style={styles.subTitle}>Radiology & Imaging</h4>
              <div style={styles.grid2}>
                <div>
                  {renderRow("SMI", clinical?.imaging_smi, "cm²/m²")}
                  {renderRow("L3 Muscle Area", clinical?.imaging_muscleArea, "cm²")}
                  {renderRow("Muscle Attenuation", clinical?.imaging_muscleAttenuation, "HU")}
                </div>
                <div>
                  {renderRow("IMAT", clinical?.imaging_imat)}
                  {renderRow("VAT", clinical?.imaging_vat, "cm²")}
                </div>
              </div>
              {renderRow("Imaging Notes", clinical?.imaging_notes)}
            </div>
          </>
        ))}

        {/* D. Dietary */}
        {renderSection("D. Dietary Data & Nutrition Support", (
          <>
            {dietary?.recall && dietary.recall.length > 0 && (
              <div style={{ marginBottom: "1rem" }}>
                <h4 style={styles.subTitle}>24-Hour Dietary Recall</h4>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Meal</th>
                      <th style={styles.th}>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dietary.recall.map((r, i) => (
                      <tr key={i}>
                        <td style={styles.td}><strong>{r.label}</strong></td>
                        <td style={styles.td}>{r.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div style={styles.grid2}>
              <div>
                <h4 style={styles.subTitle}>Intake Summary</h4>
                {renderRow("Diet Order", dietary?.dietOrder)}
                {renderRow("Estimated Calories", dietary?.oralCalories, "kcal/d")}
                {renderRow("Estimated Protein", dietary?.oralProtein, "g/d")}
              </div>
              <div>
                <h4 style={styles.subTitle}>Behavioral & Access</h4>
                {renderRow("Meal Patterns",        dietary?.mealPatterns)}
                {renderRow("Fluid Intake",         dietary?.fluidIntake)}
                {renderRow("Estimated Intake",     dietary?.eeiPercent, "%")}
                {renderRow("Intake Timeframe",     dietary?.eeiTimeframe, "days")}
                {renderRow("Physical Activity",    dietary?.physicalLevel)}
                {renderRow("ADLs",                 dietary?.adls)}
                {renderRow("Food Security",        dietary?.foodSecurity)}
                {renderRow("Cultural/Religious",   dietary?.culturalReligious)}
                {renderRow("Social Dynamics",      dietary?.socialDynamics)}
                {renderRow("Eating Environment",   dietary?.eatingEnv)}
                {renderRow("Supplements",          dietary?.supplements)}
                {renderRow("Herbal/CAM",           dietary?.herbalCAM)}
                {renderRow("Patient Perception",   dietary?.perception)}
                {renderRow("QoL Goals",            dietary?.qolGoals)}
                {renderRow("Readiness to Change",  dietary?.readiness, "/ 10")}
              </div>
            </div>

            {dietary?.ivOrders && dietary.ivOrders.length > 0 && (
              <div style={{ marginTop: "1rem" }}>
                <h4 style={styles.subTitle}>IV Orders</h4>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Solution</th>
                      <th style={styles.th}>Volume (mL)</th>
                      <th style={styles.th}>Rate (mL/hr)</th>
                      <th style={styles.th}>Hrs/Day</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dietary.ivOrders.map((iv, i) => (
                      <tr key={i}>
                        <td style={styles.td}>{iv.type}</td>
                        <td style={styles.td}>{iv.totalVolumeMl}</td>
                        <td style={styles.td}>{iv.rateMlHr}</td>
                        <td style={styles.td}>{iv.hrsPerDay}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ))}

        {/* Phase 6 new domains */}
        {renderSection("Dx. Nutrition Diagnosis", renderDiagnosis())}
        {renderSection("I. Nutrition Intervention", renderIntervention())}
        {renderSection("ME. Monitor & Evaluate", renderMonitorEval())}

        {standards?.condition && renderSection(
          "S. Comparative Standards",
          <>
            {renderRow("Condition",           standards.condition)}
            {renderRow("Sub-type / Variant",  standards.variant)}
            {renderRow("Current Energy Rx",   standards.currentKcal, "kcal/day")}
            {renderRow("Current Protein Rx",  standards.currentProtein, "g/day")}
            {renderRow("Current Fluid Rx",    standards.currentFluid, "mL/day")}
            {standards.icKcal && 
              renderRow("IC Measured REE",    standards.icKcal, "kcal/day")}
            {standards.snapshot && <>
              {renderRow("EE Source",         standards.snapshot.eeSource)}
              {renderRow("Weight Used",       
                `${standards.snapshot.weightUsedKg}kg (${standards.snapshot.weightLabel})`)}
              {standards.snapshot.flags && standards.snapshot.flags.length > 0 &&
                renderRow("Clinical Flags",   standards.snapshot.flags.join("; "))}
              {renderRow("Evaluated At",      
                new Date(standards.snapshot.evaluatedAt).toLocaleString())}
            </>}
          </>
        )}

        {refeedingScreen?.screenedAt && renderSection(
          "RF. Refeeding Syndrome Risk Screen",
          <>
            {renderRow("Overall Risk",          refeedingRiskLabel)}
            {renderRow("Screened At",           
              new Date(refeedingScreen.screenedAt).toLocaleString())}
            {renderRow("C1: BMI Risk",          refeedingScreen.c1_manualRisk)}
            {renderRow("C2: Weight Loss Risk",  refeedingScreen.c2_manualRisk)}
            {renderRow("C3: Energy Intake Risk", refeedingScreen.c3_manualRisk)}
            {renderRow("C4: Potassium",         refeedingScreen.c4_electrolytes?.potassium)}
            {renderRow("C4: Phosphorus",        refeedingScreen.c4_electrolytes?.phosphorus)}
            {renderRow("C4: Magnesium",         refeedingScreen.c4_electrolytes?.magnesium)}
            {renderRow("C5: Fat Loss Risk",     refeedingScreen.c5_manualRisk)}
            {renderRow("C6: Muscle Loss Risk",  refeedingScreen.c6_manualRisk)}
            {renderRow("C7: Comorbidities",     refeedingScreen.c7_selected?.join(", "))}
            {refeedingScreen.screenNotes && 
              renderRow("Screen Notes",         refeedingScreen.screenNotes)}
          </>
        )}

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
  backBtn: { background: "none", border: "none", color: "#e74c3c", cursor: "pointer", fontWeight: 700 },
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
  grid5: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: "1rem" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", marginBottom: "0.5rem" },
  th: { textAlign: "left", padding: "0.5rem", borderBottom: "1px solid #e2e8f0", color: "#94a3b8", fontWeight: 600 },
  td: { padding: "0.5rem", borderBottom: "1px solid #f1f5f9" },
  emptyText: { fontSize: "0.85rem", color: "#94a3b8", fontStyle: "italic" },
  footer: { marginTop: "4rem" },
  signatureRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", fontSize: "0.8rem", color: "#64748b" },
  signatureLine: { width: "250px", borderTop: "1px solid #cbd5e1", paddingTop: "0.5rem", textAlign: "center", fontWeight: 700, color: "#475569" },
};