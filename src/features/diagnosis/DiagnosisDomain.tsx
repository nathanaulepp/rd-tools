// src/features/diagnosis/DiagnosisDomain.tsx
// Phase 6: Nutrition Diagnosis domain (ADIME "D")
// Supports PES (Problem–Etiology–Signs/Symptoms) statement builder.

import React, { useState } from "react";
import { DomainHeader } from "../../shared/ui/DomainHeader";
import { SectionHeader } from "../../shared/ui/SectionHeader";
import { Field } from "../../shared/ui/Field";

// ─── IDNT Problem taxonomy (abridged to most common) ─────────────────────────
const IDNT_PROBLEMS = [
  // NI – Intake
  "NI-1.1 Increased energy expenditure",
  "NI-1.2 Inadequate energy intake",
  "NI-1.3 Excessive energy intake",
  "NI-2.1 Inadequate oral intake",
  "NI-2.2 Excessive oral intake",
  "NI-2.3 Inadequate enteral nutrition infusion",
  "NI-2.4 Excessive enteral nutrition infusion",
  "NI-2.5 Less than optimal enteral nutrition",
  "NI-2.6 Inadequate parenteral nutrition infusion",
  "NI-2.7 Excessive parenteral nutrition infusion",
  "NI-2.8 Less than optimal parenteral nutrition",
  "NI-3.1 Inadequate fluid intake",
  "NI-3.2 Excessive fluid intake",
  "NI-4.1 Food-medication interaction",
  "NI-4.2 Medication-related malnutrition",
  "NI-5.1 Increased nutrient needs (specify)",
  "NI-5.2 Malnutrition",
  "NI-5.3 Inadequate protein-energy intake",
  "NI-5.4 Decreased nutrient needs (specify)",
  "NI-5.5 Imbalance of nutrients",
  "NI-5.6.1 Inadequate fat intake",
  "NI-5.6.2 Excessive fat intake",
  "NI-5.6.3 Inappropriate intake of food fats",
  "NI-5.7.1 Inadequate protein intake",
  "NI-5.7.2 Excessive protein intake",
  "NI-5.8.1 Inadequate carbohydrate intake",
  "NI-5.8.2 Excessive carbohydrate intake",
  "NI-5.8.3 Inappropriate intake of carbohydrates",
  "NI-5.9.1 Inadequate vitamin intake (specify)",
  "NI-5.9.2 Excessive vitamin intake (specify)",
  "NI-5.10.1 Inadequate mineral intake (specify)",
  "NI-5.10.2 Excessive mineral intake (specify)",
  // NC – Clinical
  "NC-1.1 Swallowing difficulty",
  "NC-1.2 Biting/chewing difficulty",
  "NC-1.3 Breastfeeding difficulty",
  "NC-1.4 Altered GI function",
  "NC-2.1 Impaired nutrient utilization",
  "NC-2.2 Altered nutrition-related lab values",
  "NC-2.3 Food-medication interaction",
  "NC-3.1 Underweight",
  "NC-3.2 Involuntary weight loss",
  "NC-3.3 Overweight/obesity",
  "NC-3.4 Involuntary weight gain",
  // NB – Behavioral-Environmental
  "NB-1.1 Food- and nutrition-related knowledge deficit",
  "NB-1.2 Harmful beliefs/attitudes about food or nutrition",
  "NB-1.3 Not ready for diet/lifestyle change",
  "NB-1.4 Self-monitoring deficit",
  "NB-1.5 Disordered eating pattern",
  "NB-1.6 Limited adherence to nutrition-related recommendations",
  "NB-1.7 Undesirable food choices",
  "NB-2.1 Physical inactivity",
  "NB-2.2 Excessive exercise",
  "NB-3.1 Cannot self-feed",
  "NB-3.2 Impaired ability to prepare foods/meals",
  "NB-3.3 Poor nutrition quality of life",
  "NB-3.4 Self-feeding difficulty",
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

let _nextId = 2;
function newDx() {
  return { id: _nextId++, problem: "", etiology: "", signsSymptoms: "" };
}

// ─── PES Card ─────────────────────────────────────────────────────────────────

interface PESCardProps {
  index: number;
  isPrimary: boolean;
  data: { problem: string; etiology: string; signsSymptoms: string };
  onChange: (field: string, val: string) => void;
  onRemove?: () => void;
}

function PESCard({ index, isPrimary, data, onChange, onRemove }: PESCardProps) {
  const [customProblem, setCustomProblem] = useState(false);
  const accentColor = isPrimary ? "#3498db" : "#8e44ad";
  const label = isPrimary ? "Primary Nutrition Diagnosis" : `Additional Diagnosis ${index}`;

  return (
    <div style={{
      border: `1px solid ${accentColor}30`,
      borderLeft: `4px solid ${accentColor}`,
      borderRadius: "8px",
      padding: "1rem",
      marginBottom: "1rem",
      background: isPrimary ? "#f0f7ff" : "#faf5ff",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
        <span style={{ fontSize: "0.78rem", fontWeight: 800, color: accentColor, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {label}
        </span>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <button
            onClick={() => setCustomProblem(p => !p)}
            style={{ fontSize: "0.65rem", padding: "2px 8px", borderRadius: "10px", border: `1px solid ${accentColor}`, background: customProblem ? accentColor : "transparent", color: customProblem ? "#fff" : accentColor, cursor: "pointer", fontWeight: 600 }}
          >
            {customProblem ? "IDNT" : "Custom"}
          </button>
          {onRemove && (
            <button onClick={onRemove} style={{ fontSize: "0.65rem", padding: "2px 8px", borderRadius: "10px", border: "1px solid #e74c3c", background: "transparent", color: "#e74c3c", cursor: "pointer", fontWeight: 600 }}>
              Remove
            </button>
          )}
        </div>
      </div>

      {/* P */}
      <Field label="P — Problem (Nutrition Diagnosis)">
        {customProblem ? (
          <input
            type="text"
            value={data.problem}
            onChange={e => onChange("problem", e.target.value)}
            placeholder="Describe the nutrition problem..."
            style={{ padding: "6px 8px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "0.88rem", width: "100%", boxSizing: "border-box" }}
          />
        ) : (
          <select
            value={data.problem}
            onChange={e => onChange("problem", e.target.value)}
            style={{ padding: "6px 8px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "0.88rem", width: "100%", boxSizing: "border-box" }}
          >
            <option value="">— Select IDNT term —</option>
            {IDNT_PROBLEMS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        )}
      </Field>

      {/* PES Preview */}
      {data.problem && (
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "0.6rem 0.85rem", margin: "0.75rem 0", fontSize: "0.82rem", lineHeight: 1.6 }}>
          <span style={{ fontWeight: 700, color: accentColor }}>{data.problem || "…"}</span>
          {data.etiology && <> <span style={{ color: "#64748b" }}>related to</span> <span style={{ fontWeight: 600 }}>{data.etiology}</span></>}
          {data.signsSymptoms && <> <span style={{ color: "#64748b" }}>as evidenced by</span> <span style={{ fontWeight: 600 }}>{data.signsSymptoms}</span></>}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginTop: "0.5rem" }}>
        {/* E */}
        <Field label="E — Etiology (Related to / Due to)">
          <textarea
            value={data.etiology}
            onChange={e => onChange("etiology", e.target.value)}
            placeholder="Related to..."
            style={{ padding: "6px 8px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "0.85rem", minHeight: "70px", resize: "vertical", width: "100%", boxSizing: "border-box" }}
          />
        </Field>
        {/* S */}
        <Field label="S — Signs & Symptoms (As Evidenced By)">
          <textarea
            value={data.signsSymptoms}
            onChange={e => onChange("signsSymptoms", e.target.value)}
            placeholder="As evidenced by..."
            style={{ padding: "6px 8px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "0.85rem", minHeight: "70px", resize: "vertical", width: "100%", boxSizing: "border-box" }}
          />
        </Field>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface DiagnosisDomainProps {
  diagnosis: any;
  setDiagnosis: (d: any) => void;
}

export default function DiagnosisDomain({ diagnosis, setDiagnosis }: DiagnosisDomainProps) {
  const update = (field: string, val: any) => setDiagnosis({ ...diagnosis, [field]: val });

  const updatePrimary = (field: string, val: string) => update(field, val);

  const addDx = () => {
    setDiagnosis({
      ...diagnosis,
      additionalDiagnoses: [...(diagnosis.additionalDiagnoses || []), newDx()],
    });
  };

  const updateAdditional = (id: number, field: string, val: string) => {
    setDiagnosis({
      ...diagnosis,
      additionalDiagnoses: diagnosis.additionalDiagnoses.map((d: any) =>
        d.id === id ? { ...d, [field]: val } : d
      ),
    });
  };

  const removeAdditional = (id: number) => {
    setDiagnosis({
      ...diagnosis,
      additionalDiagnoses: diagnosis.additionalDiagnoses.filter((d: any) => d.id !== id),
    });
  };

  return (
    <div className="fade-in">
      <DomainHeader title="Dx. Nutrition Diagnosis" />

      {/* PES Builder */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <SectionHeader title="PES Statement Builder" subtitle="Problem · Etiology · Signs/Symptoms" color="#3498db" />
          <button
            onClick={addDx}
            style={{ background: "#8e44ad", color: "#fff", border: "none", borderRadius: "6px", padding: "6px 14px", cursor: "pointer", fontSize: "0.8rem", fontWeight: 700, whiteSpace: "nowrap" }}
          >
            + Add Diagnosis
          </button>
        </div>

        {/* Primary PES */}
        <PESCard
          index={0}
          isPrimary={true}
          data={{ problem: diagnosis.problem || "", etiology: diagnosis.etiology || "", signsSymptoms: diagnosis.signsSymptoms || "" }}
          onChange={updatePrimary}
        />

        {/* Additional PES */}
        {(diagnosis.additionalDiagnoses || []).map((dx: any, i: number) => (
          <PESCard
            key={dx.id}
            index={i + 1}
            isPrimary={false}
            data={{ problem: dx.problem, etiology: dx.etiology, signsSymptoms: dx.signsSymptoms }}
            onChange={(field, val) => updateAdditional(dx.id, field, val)}
            onRemove={() => removeAdditional(dx.id)}
          />
        ))}
      </div>

      {/* Priority ranking + narrative */}
      <div className="card">
        <SectionHeader title="Diagnostic Narrative & Priority" color="#3498db" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div className="input-group">
            <label>Priority Ranking</label>
            <input
              type="text"
              value={diagnosis.priorityRanking || ""}
              onChange={e => update("priorityRanking", e.target.value)}
              placeholder="e.g. Primary: NI-1.2; Secondary: NC-3.2"
            />
          </div>
          <div className="input-group">
            <label>Additional Notes</label>
            <input
              type="text"
              value={diagnosis.notes || ""}
              onChange={e => update("notes", e.target.value)}
              placeholder="Any nuance or context..."
            />
          </div>
        </div>
        <div className="input-group" style={{ marginTop: "0.5rem" }}>
          <label>Nutrition Diagnosis Narrative</label>
          <textarea
            value={diagnosis.nutritionDxNarrative || ""}
            onChange={e => update("nutritionDxNarrative", e.target.value)}
            placeholder="Summarize the nutrition diagnosis in clinical language..."
            style={{ minHeight: "80px" }}
          />
        </div>
      </div>
    </div>
  );
}