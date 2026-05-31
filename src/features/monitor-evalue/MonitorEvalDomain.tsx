// src/features/monitor-evalue/MonitorEvalDomain.tsx
// Phase 5: Reads useMonitorEvalStore directly. No props for domain state.

import React from "react";
import { DomainHeader } from "../../shared/ui/DomainHeader";
import { SectionHeader } from "../../shared/ui/SectionHeader";
import { ChipGroup } from "../../shared/ui/ChipGroup";
import { useMonitorEvalStore } from "../../stores/useMonitorEvalStore";
import type { MonitorEval } from "../../types";

// ─── Constants ────────────────────────────────────────────────────────────────

const MONITOR_INDICATORS = [
  // Food/Nutrient Intake
  "Calorie intake", "Protein intake", "Fluid intake", "Micronutrient intake",
  "EN formula rate/volume", "PN macronutrient delivery",
  // Anthropometrics
  "Weight", "BMI", "Growth velocity (peds)", "Muscle mass", "Body fat",
  // Biochemical
  "Prealbumin/CRP", "Albumin", "Electrolytes", "Blood glucose / HbA1c",
  "Lipid panel", "Micronutrient labs", "Liver function tests",
  "Renal function (BUN/Cr/eGFR)",
  // Clinical
  "GI tolerance", "Wound healing", "Pressure injury stage",
  "Functional status / grip strength", "Swallowing ability",
  // Dietary Behavior
  "Diet adherence", "Food security status", "Supplement compliance",
  "Readiness to change", "Knowledge/skill retention",
];

const OUTCOME_OPTIONS = [
  { val: "", label: "— Select —" },
  { val: "improved", label: "✅ Improved" },
  { val: "no-change", label: "→ No Change" },
  { val: "worsened", label: "⚠ Worsened" },
  { val: "met", label: "✓ Goal Met" },
  { val: "not-met", label: "✗ Goal Not Met" },
];

const OUTCOME_COLORS: Record<string, string> = {
  improved: "#27ae60",
  "no-change": "#718096",
  worsened: "#e74c3c",
  met: "#2980b9",
  "not-met": "#c0392b",
};

// ─── Criteria Row ─────────────────────────────────────────────────────────────

function CriteriaRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="input-group">
      <label>{label}</label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Expected outcome / target..."
        style={{ minHeight: "60px" }}
      />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MonitorEvalDomain() {
  const { monitorEval, setMonitorEval } = useMonitorEvalStore();

  const update = (field: keyof MonitorEval, val: any) =>
    setMonitorEval({ [field]: val } as Partial<MonitorEval>);

  const me = monitorEval || {};
  const progressColor = OUTCOME_COLORS[me.outcome_progress as string] || "#718096";

  return (
    <div className="fade-in">
      <DomainHeader title="ME. Monitor & Evaluate" />

      {/* What to monitor */}
      <div className="card" style={{ marginBottom: "1rem" }}>
        <SectionHeader title="ME-1: Indicators Being Monitored" color="#2980b9" />
        <div className="input-group">
          <label>Select All Applicable</label>
          <ChipGroup
            options={MONITOR_INDICATORS}
            value={me.monitoredIndicators || []}
            onChange={v => update("monitoredIndicators", v)}
            multiSelect={true}
          />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginTop: "0.75rem" }}>
          <div className="input-group">
            <label>Monitoring Frequency</label>
            <input type="text" value={me.monitorFrequency || ""} onChange={e => update("monitorFrequency", e.target.value)} placeholder="e.g. weekly, per visit, monthly" />
          </div>
          <div className="input-group">
            <label>Monitored By</label>
            <input type="text" value={me.monitoredBy || ""} onChange={e => update("monitoredBy", e.target.value)} placeholder="e.g. RD, nursing, patient self-monitoring" />
          </div>
        </div>
      </div>

      {/* Evaluation Criteria / Expected Outcomes */}
      <div className="card" style={{ marginBottom: "1rem" }}>
        <SectionHeader title="ME-2: Evaluation Criteria (Expected Outcomes)" color="#16a085" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <CriteriaRow label="Anthropometric Targets" value={me.criteria_anthropo || ""} onChange={v => update("criteria_anthropo", v)} />
          <CriteriaRow label="Biochemical Targets" value={me.criteria_labs || ""} onChange={v => update("criteria_labs", v)} />
          <CriteriaRow label="Dietary/Intake Targets" value={me.criteria_dietary || ""} onChange={v => update("criteria_dietary", v)} />
          <CriteriaRow label="Clinical/Functional Targets" value={me.criteria_clinical || ""} onChange={v => update("criteria_clinical", v)} />
        </div>
        <div className="input-group" style={{ marginTop: "0.5rem" }}>
          <label>Functional Outcome Targets</label>
          <textarea value={me.criteria_functional || ""} onChange={e => update("criteria_functional", e.target.value)} placeholder="e.g. patient will ambulate independently by discharge..." style={{ minHeight: "60px" }} />
        </div>
      </div>

      {/* Outcomes — filled on follow-up */}
      <div className="card" style={{ marginBottom: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
          <SectionHeader title="ME-3: Outcome Evaluation" color={progressColor} />
          {me.outcome_progress && (
            <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "#fff", background: progressColor, padding: "3px 12px", borderRadius: "12px" }}>
              {OUTCOME_OPTIONS.find(o => o.val === me.outcome_progress)?.label || ""}
            </span>
          )}
        </div>

        <div className="input-group" style={{ maxWidth: "300px", marginBottom: "1rem" }}>
          <label>Progress Toward Goal</label>
          <select
            value={me.outcome_progress || ""}
            onChange={e => update("outcome_progress", e.target.value)}
            style={{ padding: "6px 8px", border: `1px solid ${progressColor}40`, borderRadius: "4px", fontSize: "0.88rem", background: me.outcome_progress ? `${progressColor}10` : "transparent" }}
          >
            {OUTCOME_OPTIONS.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
          </select>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <div className="input-group">
            <label>Outcome Narrative</label>
            <textarea value={me.outcome_narrative || ""} onChange={e => update("outcome_narrative", e.target.value)} placeholder="Describe what has changed since last visit..." style={{ minHeight: "80px" }} />
          </div>
          <div className="input-group">
            <label>Next Steps / Plan Adjustments</label>
            <textarea value={me.outcome_nextSteps || ""} onChange={e => update("outcome_nextSteps", e.target.value)} placeholder="Continue current plan, modify intervention, escalate..." style={{ minHeight: "80px" }} />
          </div>
        </div>
      </div>

      {/* Discharge / Transition */}
      <div className="card" style={{ marginBottom: "1rem" }}>
        <SectionHeader title="Discharge & Transition Planning" color="#2c3e50" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <div className="input-group">
            <label>Discharge Recommendations</label>
            <textarea value={me.dischargeRecs || ""} onChange={e => update("dischargeRecs", e.target.value)} placeholder="Nutrition recommendations at discharge..." style={{ minHeight: "80px" }} />
          </div>
          <div className="input-group">
            <label>Transition / Follow-Up Plan</label>
            <textarea value={me.transitionPlan || ""} onChange={e => update("transitionPlan", e.target.value)} placeholder="Who follows up, when, how..." style={{ minHeight: "80px" }} />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="card">
        <div className="input-group">
          <label>ME Notes</label>
          <textarea value={me.meNotes || ""} onChange={e => update("meNotes", e.target.value)} placeholder="Any additional monitoring or evaluation narrative..." style={{ minHeight: "80px" }} />
        </div>
      </div>
    </div>
  );
}