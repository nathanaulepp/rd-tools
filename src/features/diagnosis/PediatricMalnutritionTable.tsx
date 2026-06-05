// src/features/diagnosis/PediatricMalnutritionTable.tsx
//
// Renders the full ASPEN/AND pediatric malnutrition diagnostic table.
// Structure mirrors the reference spreadsheet exactly:
//
//   SECTION 1 — Primary Indicators (1 data point sufficient)
//   SECTION 2 — Multi-indicator block (≥2 indicators required)
//   SECTION 3 — Age-conditional (< 2y OR 2–20y, highlighted panel)
//
// All z-scores are computed here from store data; the engine only evaluates severity.

import React, { useMemo } from "react";
import { useAnthroStore } from "../../stores/useAnthroStore";
import { useDietaryStore } from "../../stores/useDietaryStore";
import { useClinicalStore } from "../../stores/useClinicalStore";
import { useCalculatedMetrics, toKg, toCm } from "../../stores/useCalculatedMetrics";
import { useNoteStore } from "../../stores/useNoteStore";
import { SectionHeader } from "../../shared/ui/SectionHeader";

import {
  // Engine types
  Severity,
  PediatricMalnutritionCriteria,
  PrimaryIndicators,
  MultiIndicators,
  AgeConditionalIndicators,

  // Evaluators — Section 1
  evaluateZScoreSeverity,
  evaluateLengthHtZ,

  // Evaluators — Section 2
  evaluateDecelerationZ,
  evaluateNutrientIntake,
  evaluatePhysicalAssessment,
  evaluateFunctionalCapacity,

  // Evaluators — Section 3
  evaluateDeltaWtForAgeZ_infant,
  evaluateDeltaWtForAgeZ_child,
  evaluateWtGainVelocityZ,
  evaluateWtGainVelocityPct,
  evaluateWtLossPct,

  // Diagnosis aggregator
  diagnosePediatricMalnutrition,
} from "./pediatricMalnutritionEngine";

import {
  whoWfa, whoLfa, whoWfl, whoBfa,
  cdcBySex, cdcWtage, cdcStatage, cdcBmiage,
} from "../../shared/data/growthStandards";
import {
  getClosestRow,
  calcLMSZScore,
  calculateZScoreDelta,
} from "../../shared/utils/growthStandardsMath";

// ─── Style helpers ────────────────────────────────────────────────────────────

const SEV_BG: Record<Severity, string> = {
  "None":           "#ffffff",
  "Not Applicable": "#f8fafc",
  "Mild":           "#f0fdf4",
  "Moderate":       "#fef9c3",
  "Severe":         "#fef2f2",
};
const SEV_TEXT: Record<Severity, string> = {
  "None":           "#64748b",
  "Not Applicable": "#94a3b8",
  "Mild":           "#166534",
  "Moderate":       "#854d0e",
  "Severe":         "#991b1b",
};
const SEV_BADGE_BG: Record<Severity, string> = {
  "None":           "#f1f5f9",
  "Not Applicable": "#f1f5f9",
  "Mild":           "#dcfce7",
  "Moderate":       "#fef9c3",
  "Severe":         "#fee2e2",
};

const cellStyle: React.CSSProperties = {
  padding: "9px 11px",
  border: "1px solid #e2e8f0",
  fontSize: "0.78rem",
  verticalAlign: "top",
};

const headerCell: React.CSSProperties = {
  ...cellStyle,
  background: "#f8fafc",
  fontWeight: 700,
  fontSize: "0.72rem",
  color: "#475569",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SeverityBadge({ sev }: { sev: Severity }) {
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 8px",
      borderRadius: "10px",
      fontSize: "0.72rem",
      fontWeight: 700,
      background: SEV_BADGE_BG[sev],
      color: SEV_TEXT[sev],
    }}>
      {sev === "Not Applicable" ? "N/A" : sev}
    </span>
  );
}

interface DataRow {
  label: string;
  mild: string;
  moderate: string;
  severe: string;
  /** Formatted patient value string */
  patientVal: string;
  outcome: Severity;
  /** Dim the row when data isn't available yet */
  unavailable?: boolean;
  unavailableNote?: string;
}

function TableRow({ row }: { row: DataRow }) {
  return (
    <tr style={{ background: SEV_BG[row.outcome] }}>
      <td style={{ ...cellStyle, fontWeight: 600, color: "#1e293b", minWidth: 180 }}>
        {row.label}
        {row.unavailable && (
          <div style={{ fontSize: "0.65rem", color: "#94a3b8", fontWeight: 400, marginTop: 2 }}>
            {row.unavailableNote ?? "Not yet entered"}
          </div>
        )}
      </td>
      <td style={{ ...cellStyle, color: "#64748b" }}>{row.mild}</td>
      <td style={{ ...cellStyle, color: "#64748b" }}>{row.moderate}</td>
      <td style={{ ...cellStyle, color: "#64748b" }}>{row.severe}</td>
      <td style={{ ...cellStyle, fontWeight: 600, color: "#334155" }}>{row.patientVal}</td>
      <td style={{ ...cellStyle, textAlign: "center" }}>
        <SeverityBadge sev={row.outcome} />
      </td>
    </tr>
  );
}

function SectionLabel({ children, color = "#475569" }: { children: React.ReactNode; color?: string }) {
  return (
    <tr>
      <td colSpan={6} style={{
        padding: "6px 11px",
        fontSize: "0.65rem",
        fontWeight: 800,
        color,
        textTransform: "uppercase",
        letterSpacing: "0.07em",
        background: `${color}10`,
        borderTop: `2px solid ${color}30`,
        borderBottom: `1px solid ${color}20`,
      }}>
        {children}
      </td>
    </tr>
  );
}

function AgeConditionalBox({
  ageGroup,
  rows,
}: {
  ageGroup: "infant" | "child";
  rows: DataRow[];
}) {
  const label = ageGroup === "infant" ? "< 2 Years Old — Pick One" : "2–20 Years Old — Pick One";
  const accent = "#f59e0b";

  return (
    <tr>
      <td colSpan={6} style={{ padding: 0 }}>
        <div style={{
          margin: "0",
          border: `2px solid ${accent}`,
          borderRadius: "0 0 6px 6px",
          overflow: "hidden",
        }}>
          {/* Age group header */}
          <div style={{
            background: `${accent}18`,
            padding: "5px 12px",
            fontSize: "0.68rem",
            fontWeight: 800,
            color: "#92400e",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            borderBottom: `1px solid ${accent}40`,
          }}>
            ★ {label}
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} style={{ background: SEV_BG[row.outcome] }}>
                  <td style={{ ...cellStyle, fontWeight: 600, color: "#1e293b", minWidth: 180, paddingLeft: 20 }}>
                    {row.label}
                    {row.unavailable && (
                      <div style={{ fontSize: "0.65rem", color: "#94a3b8", fontWeight: 400, marginTop: 2 }}>
                        {row.unavailableNote ?? "Not yet entered"}
                      </div>
                    )}
                  </td>
                  <td style={{ ...cellStyle, color: "#64748b" }}>{row.mild}</td>
                  <td style={{ ...cellStyle, color: "#64748b" }}>{row.moderate}</td>
                  <td style={{ ...cellStyle, color: "#64748b" }}>{row.severe}</td>
                  <td style={{ ...cellStyle, fontWeight: 600, color: "#334155" }}>{row.patientVal}</td>
                  <td style={{ ...cellStyle, textAlign: "center" }}>
                    <SeverityBadge sev={row.outcome} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </td>
    </tr>
  );
}

// ─── Z-score computation helpers (local to this file) ────────────────────────

function fmtZ(z: number | null): string {
  if (z === null) return "—";
  return z.toFixed(2);
}

function fmtPct(pct: number | null | undefined): string {
  if (pct === null || pct === undefined) return "—";
  return `${pct.toFixed(1)}%`;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PediatricMalnutritionTable() {
  const { anthro } = useAnthroStore();
  const { dietary } = useDietaryStore();
  const { clinical } = useClinicalStore();
  const metrics = useCalculatedMetrics();
  const patientData = useNoteStore((s) => s.patientData);

  const ageDays = metrics.ageDays;
  const sex = patientData.sex === "F" ? "F" : "M";
  const dob = patientData.dob;
  const noteDate = patientData.noteDate;

  // ── Compute all z-scores ──────────────────────────────────────────────────
  const computed = useMemo(() => {
    if (ageDays === null || !dob || !noteDate) return null;

    const isInfant = ageDays < 730; // <2y

    const curWtKg = toKg(Number(anthro.wt) || 0, anthro.wtUnit);
    const curHtCm = toCm(Number(anthro.ht) || 0, anthro.htUnit);
    const curBmi  = curWtKg > 0 && curHtCm > 0
      ? curWtKg / Math.pow(curHtCm / 100, 2)
      : null;

    // Helper: look up Z for an arbitrary measurement date
    const lookupZ = (
      val: number,
      measureDate: string,
      type: "wt" | "ht" | "bmi" | "wfl"
    ): number | null => {
      if (val <= 0 || !measureDate || !dob) return null;
      const mAgeDays = Math.floor(
        (new Date(measureDate).getTime() - new Date(dob).getTime()) / 86400000
      );
      if (mAgeDays < 0) return null;
      const mIsInfant = mAgeDays < 730;

      if (mIsInfant) {
        if (type === "wt") {
          const row = getClosestRow(whoWfa(sex), "Day", mAgeDays);
          return row ? calcLMSZScore(val, row.L, row.M, row.S, false) : null;
        }
        if (type === "ht") {
          const row = getClosestRow(whoLfa(sex), "Day", mAgeDays);
          return row ? calcLMSZScore(val, row.L, row.M, row.S, false) : null;
        }
        if (type === "bmi") {
          const row = getClosestRow(whoBfa(sex), "Day", mAgeDays);
          return row ? calcLMSZScore(val, row.L, row.M, row.S, false) : null;
        }
        if (type === "wfl") {
          const row = getClosestRow(whoWfl(sex), "Length", Math.round(curHtCm * 10) / 10);
          return row ? calcLMSZScore(val, row.L, row.M, row.S, false) : null;
        }
      } else {
        const ageMos = mAgeDays / 30.4375;
        if (type === "wt") {
          const row = getClosestRow(cdcBySex(cdcWtage, sex), "Agemos", ageMos);
          return row ? calcLMSZScore(val, row.L, row.M, row.S, true) : null;
        }
        if (type === "ht") {
          const row = getClosestRow(cdcBySex(cdcStatage, sex), "Agemos", ageMos);
          return row ? calcLMSZScore(val, row.L, row.M, row.S, true) : null;
        }
        if (type === "bmi") {
          const row = getClosestRow(cdcBySex(cdcBmiage, sex), "Agemos", ageMos);
          return row ? calcLMSZScore(val, row.L, row.M, row.S, true) : null;
        }
      }
      return null;
    };

    // Current
    const curWtZ  = lookupZ(curWtKg, noteDate, "wt");
    const curHtZ  = lookupZ(curHtCm, noteDate, "ht");
    const curBmiZ = curBmi ? lookupZ(curBmi, noteDate, "bmi") : null;
    let curWflZ: number | null = null;
    if (isInfant && curWtKg > 0 && curHtCm > 0) {
      curWflZ = lookupZ(curWtKg, noteDate, "wfl");
    }

    // Past (for delta Z)
    const pstWtKg = toKg(Number(anthro.past_wt) || 0, anthro.past_wtUnit);
    const pstHtCm = toCm(Number(anthro.past_ht) || 0, anthro.past_htUnit);
    const pstWtZ  = pstWtKg > 0 && anthro.past_wtDate
      ? lookupZ(pstWtKg, anthro.past_wtDate, "wt")
      : null;
    let pstWflZ: number | null = null;
    if (pstWtKg > 0 && pstHtCm > 0 && anthro.past_htDate) {
      pstWflZ = lookupZ(pstWtKg, anthro.past_htDate, "wfl");
    }

    // Deltas
    const deltaWtZ = curWtZ !== null && pstWtZ !== null
      ? calculateZScoreDelta(curWtZ, pstWtZ)
      : null;

    // Wt/Ht deceleration (Section 2): use Wt-for-length delta if infant, else Ht Z delta
    let curHtZPast: number | null = null;
    if (pstHtCm > 0 && anthro.past_htDate) {
      curHtZPast = lookupZ(pstHtCm, anthro.past_htDate, "ht");
    }
    const curHtZNow = curHtZ;
    const decelerationDelta =
      curHtZNow !== null && curHtZPast !== null
        ? calculateZScoreDelta(curHtZNow, curHtZPast)
        : isInfant && curWflZ !== null && pstWflZ !== null
        ? calculateZScoreDelta(curWflZ, pstWflZ)
        : null;

    // Weight loss % of UBW
    const ubwKg = toKg(Number(anthro.ubw) || 0, anthro.wtUnit);
    const wtLossPct = ubwKg > 0 && curWtKg > 0 && ubwKg > curWtKg
      ? ((ubwKg - curWtKg) / ubwKg) * 100
      : 0;

    // Energy intake %
    const intakePct = parseFloat(dietary.eeiPercent) || null;

    // Physical assessment from NFPE
    const muscleFields = ["temples", "clavicles", "shoulders", "scapula", "interosseous", "thighs", "calves"];
    const fatFields    = ["orbital", "cheek", "tricepsFat", "midAxillary"];
    const muscleVals = muscleFields.map(f => (clinical as any)[f] || "Normal");
    const fatVals    = fatFields.map(f => (clinical as any)[f] || "Normal");

    const physAssess = evaluatePhysicalAssessment(muscleVals, fatVals);
    const funcCap    = evaluateFunctionalCapacity(clinical.gripStrength || "WNL");

    return {
      isInfant,
      curWtZ, curHtZ, curBmiZ, curWflZ,
      deltaWtZ,
      decelerationDelta,
      wtLossPct,
      intakePct,
      physAssess,
      funcCap,
    };
  }, [anthro, dietary, clinical, ageDays, dob, noteDate, sex]);

  // ── Build criteria object ─────────────────────────────────────────────────
  const criteria: PediatricMalnutritionCriteria | null = useMemo(() => {
    if (!computed) return null;

    const {
      isInfant, curWtZ, curHtZ, curBmiZ, curWflZ,
      deltaWtZ, decelerationDelta, wtLossPct, intakePct, physAssess, funcCap,
    } = computed;

    const primary: PrimaryIndicators = {
      wtForLengthZ:   curWflZ,
      wtForLengthSev: isInfant ? evaluateZScoreSeverity(curWflZ) : "Not Applicable",
      bmiForAgeZ:     curBmiZ,
      bmiForAgeSev:   evaluateZScoreSeverity(curBmiZ),
      lengthHtZ:      curHtZ,
      lengthHtSev:    evaluateLengthHtZ(curHtZ),
      muacZ:          null,
      muacSev:        "Not Applicable",
    };

    const multi: MultiIndicators = {
      decelerationZ:      decelerationDelta,
      decelerationSev:    evaluateDecelerationZ(decelerationDelta),
      nutrientIntakePct:  intakePct,
      nutrientIntakeSev:  evaluateNutrientIntake(intakePct),
      physicalAssessmentSev:  physAssess.sev,
      physicalAssessmentNote: physAssess.note,
      functionalCapacitySev:  funcCap.sev,
      functionalCapacityNote: funcCap.note,
      meetsMultiIndicatorThreshold: false, // computed by aggregator
    };

    const ageConditional: AgeConditionalIndicators = {
      ageGroup: isInfant ? "infant" : "child",

      // Infant block
      deltaWtForAgeZ_infant:    isInfant ? deltaWtZ : null,
      deltaWtForAgeZ_infantSev: isInfant ? evaluateDeltaWtForAgeZ_infant(deltaWtZ) : "Not Applicable",
      wtGainVelocityZ:    null,
      wtGainVelocityZSev: "Not Applicable",
      wtGainVelocityPct:    null,
      wtGainVelocityPctSev: "Not Applicable",

      // Child block
      deltaWtForAgeZ_child:    !isInfant ? deltaWtZ : null,
      deltaWtForAgeZ_childSev: !isInfant ? evaluateDeltaWtForAgeZ_child(deltaWtZ) : "Not Applicable",

      wtLossPct_child:    !isInfant ? (wtLossPct || null) : null,
      wtLossPct_childSev: !isInfant ? evaluateWtLossPct(wtLossPct || null) : "Not Applicable",
    };

    return { primary, multi, ageConditional };
  }, [computed]);

  const diagnosis = useMemo(
    () => criteria ? diagnosePediatricMalnutrition(criteria) : null,
    [criteria]
  );

  // ── Build display rows ────────────────────────────────────────────────────
  if (!computed || !criteria || !diagnosis) {
    return (
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <SectionHeader title="Pediatric Malnutrition Diagnostic Engine" subtitle="Enter patient DOB and note date to activate" color="#1e293b" />
      </div>
    );
  }

  const { isInfant } = computed;

  // Section 1 rows
  const sec1Rows: DataRow[] = [
    {
      label: "Wt-for-length Z-score",
      mild: "-1 to -1.9",
      moderate: "-2 to -2.9",
      severe: "-3 (wasting)",
      patientVal: isInfant ? fmtZ(computed.curWflZ) : "—",
      outcome: criteria.primary.wtForLengthSev,
      unavailable: isInfant && computed.curWflZ === null,
      unavailableNote: "Enter height + weight in Anthropometrics",
    },
    {
      label: "BMI-for-age Z-score",
      mild: "-1 to -1.9",
      moderate: "-2 to -2.9",
      severe: "≤ -3",
      patientVal: fmtZ(computed.curBmiZ),
      outcome: criteria.primary.bmiForAgeSev,
      unavailable: computed.curBmiZ === null,
      unavailableNote: "Enter height + weight in Anthropometrics",
    },
    {
      label: "Length/Ht Z-score",
      mild: "N/A",
      moderate: "-2 to -2.9",
      severe: "-3 (stunting)",
      patientVal: fmtZ(computed.curHtZ),
      outcome: criteria.primary.lengthHtSev,
      unavailable: computed.curHtZ === null,
      unavailableNote: "Enter height in Anthropometrics",
    },
    {
      label: "MUAC Z-score (>6 mo)",
      mild: "-1 to -1.9",
      moderate: "-2 to -2.9",
      severe: "≤ -3",
      patientVal: "—",
      outcome: "Not Applicable",
      unavailable: true,
      unavailableNote: "MUAC not yet tracked — add in Anthropometrics",
    },
  ];

  // Section 2 rows
  const decelerationLabel = isInfant
    ? "Deceleration in wt-for-length Z"
    : "Deceleration in height Z";

  const sec2Rows: DataRow[] = [
    {
      label: decelerationLabel,
      mild: "Decline in 1 Z-score",
      moderate: "Decline in 2 Z-score",
      severe: "Decline in 3 Z-score",
      patientVal: computed.decelerationDelta !== null
        ? `${(-computed.decelerationDelta).toFixed(2)}Z decline`
        : "—",
      outcome: criteria.multi.decelerationSev,
      unavailable: computed.decelerationDelta === null,
      unavailableNote: "Enter past height/weight with dates in Anthropometrics",
    },
    {
      label: "Inadequate nutrient intake",
      mild: "51–75% of estimated needs",
      moderate: "26–50% of estimated needs",
      severe: "≤25% of estimated needs",
      patientVal: computed.intakePct !== null ? `${computed.intakePct}%` : "—",
      outcome: criteria.multi.nutrientIntakeSev,
      unavailable: computed.intakePct === null,
      unavailableNote: "Enter EEI% in Dietary → D2",
    },
    {
      label: "Physical assessment (muscle or fat loss)",
      mild: "No data",
      moderate: "Moderate loss",
      severe: "Severe loss",
      patientVal: criteria.multi.physicalAssessmentNote,
      outcome: criteria.multi.physicalAssessmentSev,
    },
    {
      label: "Functional capacity for age",
      mild: "No impairment, able to perform age-appropriate activity",
      moderate: "Reduced ability for previous ADLs, less energy, tired more often",
      severe: "Significant reduced ability to perform ADLs, confined to bed/chair >50% waking time, measurably reduced strength",
      patientVal: criteria.multi.functionalCapacityNote,
      outcome: criteria.multi.functionalCapacitySev,
    },
  ];

  // Section 3 age-conditional rows
  const infantRows: DataRow[] = [
    {
      label: "Δ Weight-for-age Z",
      mild: "Decline in 1 Z-score",
      moderate: "Decline in 2 Z-score",
      severe: "Decline in 3 Z-score",
      patientVal: computed.deltaWtZ !== null
        ? `${(-computed.deltaWtZ).toFixed(2)}Z decline`
        : "—",
      outcome: criteria.ageConditional.deltaWtForAgeZ_infantSev,
      unavailable: computed.deltaWtZ === null,
      unavailableNote: "Enter past weight + date in Anthropometrics",
    },
    {
      label: "WHO wt gain velocity Z",
      mild: "-1 to -1.99 Z-score",
      moderate: "-2 to -2.9 Z-score",
      severe: "-3 Z-score",
      patientVal: "—",
      outcome: "Not Applicable",
      unavailable: true,
      unavailableNote: "Velocity Z table not yet implemented",
    },
    {
      label: "Wt gain velocity (% of norm)",
      mild: "<75% of expected weight gain",
      moderate: "<50% of expected weight gain",
      severe: "<25% of expected weight gain",
      patientVal: "—",
      outcome: "Not Applicable",
      unavailable: true,
      unavailableNote: "Velocity % not yet implemented",
    },
  ];

  const childRows: DataRow[] = [
    {
      label: "Weight loss % (UBW)",
      mild: "5% UBW",
      moderate: "7.5% UBW",
      severe: "10% UBW",
      patientVal: fmtPct(computed.wtLossPct || null),
      outcome: criteria.ageConditional.wtLossPct_childSev,
      unavailable: !anthro.ubw || Number(anthro.ubw) <= 0,
      unavailableNote: "Enter UBW in Anthropometrics",
    },
    {
      label: "Δ Wt-for-age Z (2–20y thresholds)",
      mild: "Decline in 0.66 Z-score",
      moderate: "Decline in 0.67–1.33 Z-score",
      severe: "Decline in ≥1.34 Z-score",
      patientVal: computed.deltaWtZ !== null
        ? `${(-computed.deltaWtZ).toFixed(2)}Z decline`
        : "—",
      outcome: criteria.ageConditional.deltaWtForAgeZ_childSev,
      unavailable: computed.deltaWtZ === null,
      unavailableNote: "Enter past weight + date in Anthropometrics",
    },
  ];

  // ── Diagnosis banner colours ──────────────────────────────────────────────
  const dx = diagnosis.diagnosis;
  const dxColor = dx === "None" ? "#475569"
    : dx === "Mild Malnutrition" ? "#166534"
    : dx === "Moderate Malnutrition" ? "#854d0e"
    : "#991b1b";
  const dxBg = dx === "None" ? "#f8fafc"
    : dx === "Mild Malnutrition" ? "#f0fdf4"
    : dx === "Moderate Malnutrition" ? "#fffbeb"
    : "#fef2f2";
  const dxBorder = dx === "None" ? "#e2e8f0"
    : dx === "Mild Malnutrition" ? "#bbf7d0"
    : dx === "Moderate Malnutrition" ? "#fef08a"
    : "#fecaca";

  // Multi-indicator threshold note
  const multiMetCount = [
    criteria.multi.decelerationSev,
    criteria.multi.nutrientIntakeSev,
    criteria.multi.physicalAssessmentSev,
    criteria.multi.functionalCapacitySev,
  ].filter(s => s !== "None" && s !== "Not Applicable").length;

  return (
    <div className="card" style={{ marginBottom: "1.5rem", border: "1px solid #e2e8f0", padding: 0, overflow: "hidden" }}>

      {/* Card header */}
      <div style={{ padding: "14px 18px", borderBottom: "1px solid #e2e8f0", background: "#fafafa" }}>
        <div style={{ fontWeight: 700, fontSize: "1rem", color: "#1e293b" }}>
          Pediatric Malnutrition Diagnostic Engine
        </div>
        <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "2px" }}>
          ASPEN/AND Criteria · WHO/CDC Z-Scores · Age {isInfant ? "< 2 years" : "2–20 years"} pathway active
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
          <thead>
            <tr>
              <th style={{ ...headerCell, minWidth: 200 }}>Indicator</th>
              <th style={{ ...headerCell, minWidth: 130 }}>Mild Malnutrition</th>
              <th style={{ ...headerCell, minWidth: 140 }}>Moderate Malnutrition</th>
              <th style={{ ...headerCell, minWidth: 130 }}>Severe Malnutrition</th>
              <th style={{ ...headerCell, minWidth: 110 }}>Patient Value</th>
              <th style={{ ...headerCell, minWidth: 90, textAlign: "center" }}>Outcome</th>
            </tr>
          </thead>
          <tbody>

            {/* ── SECTION 1 ─────────────────────────────────────────── */}
            <SectionLabel color="#3b82f6">
              Primary Indicators — 1 Data Point Sufficient for Diagnosis
            </SectionLabel>
            {sec1Rows.map((row, i) => <TableRow key={i} row={row} />)}

            {/* ── SECTION 2 ─────────────────────────────────────────── */}
            <SectionLabel color="#8b5cf6">
              ≥2 Data Points AND ≥2 Indicators Required · {multiMetCount} of 4 criteria currently met
            </SectionLabel>
            {sec2Rows.map((row, i) => <TableRow key={i} row={row} />)}

            {/* ── SECTION 3 ─────────────────────────────────────────── */}
            <SectionLabel color="#f59e0b">
              Age-Conditional Velocity / Loss Indicators
            </SectionLabel>

            {isInfant
              ? <AgeConditionalBox ageGroup="infant" rows={infantRows} />
              : <AgeConditionalBox ageGroup="child"  rows={childRows}  />
            }

          </tbody>
        </table>
      </div>

      {/* ── Diagnosis Banner ───────────────────────────────────────────────── */}
      <div style={{
        margin: "0",
        padding: "14px 18px",
        background: dxBg,
        borderTop: `2px solid ${dxBorder}`,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <div style={{ fontSize: "0.62rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "3px" }}>
              Automated Pediatric Diagnosis
            </div>
            <div style={{ fontSize: "1.15rem", fontWeight: 800, color: dxColor }}>
              {diagnosis.diagnosis}
            </div>
            {diagnosis.drivingSection !== "none" && (
              <div style={{ fontSize: "0.68rem", color: "#64748b", marginTop: "3px" }}>
                Driven by: <strong>{diagnosis.drivingSection}</strong> section
              </div>
            )}
          </div>
          <div style={{ fontSize: "0.68rem", color: "#64748b", maxWidth: 300, lineHeight: 1.6 }}>
            <strong style={{ display: "block", marginBottom: "3px" }}>Clinical reminder:</strong>
            Section 2 multi-indicator criteria require ≥2 independent data points AND ≥2 indicators
            to confirm malnutrition. Single-indicator findings from Section 2 alone are insufficient.
          </div>
        </div>

        {diagnosis.reasoning.length > 0 && (
          <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: "1px solid rgba(0,0,0,0.07)" }}>
            <div style={{ fontSize: "0.62rem", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "5px" }}>
              Engine Reasoning
            </div>
            <ul style={{ margin: 0, padding: "0 0 0 16px", fontSize: "0.74rem", color: "#475569", lineHeight: 1.7 }}>
              {diagnosis.reasoning.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}