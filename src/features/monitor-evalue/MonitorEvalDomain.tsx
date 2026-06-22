// src/features/monitor-evalue/MonitorEvalDomain.tsx

import { useMemo } from "react";
import { DomainHeader } from "../../shared/ui/DomainHeader";
import { SectionHeader } from "../../shared/ui/SectionHeader";
import { useMonitorEvalStore } from "../../stores/useMonitorEvalStore";
import { useDiagnosisStore } from "../../stores/useDiagnosisStore";
import type { MonitorEval } from "../../types";

const truncateToIndicator = (phrase: string): string => {
  const signals = [" of ", " approximately ", " rated ", ": "];
  let cutIndex = phrase.length;
  for (const signal of signals) {
    const idx = phrase.indexOf(signal);
    if (idx !== -1 && idx < cutIndex) cutIndex = idx;
  }
  return phrase.slice(0, cutIndex).trim();
};

export default function MonitorEvalDomain() {
  const { monitorEval, setMonitorEval } = useMonitorEvalStore();
  const { diagnosis } = useDiagnosisStore();

  const me = monitorEval || {};

  const suggestions = useMemo(() => {
    const all: string[] = [];
    const seen = new Set<string>();

    const collect = (ssString: string) => {
      ssString.split(";").forEach(seg => {
        const raw = seg.trim();
        if (!raw) return;
        const trimmed = truncateToIndicator(raw);
        if (trimmed.length < 4) return;
        if (!seen.has(trimmed)) {
          seen.add(trimmed);
          all.push(trimmed);
        }
      });
    };

    if (diagnosis.signsSymptoms) collect(diagnosis.signsSymptoms);
    (diagnosis.additionalDiagnoses || []).forEach(dx => {
      if (dx.signsSymptoms) collect(dx.signsSymptoms);
    });

    return all;
  }, [diagnosis.signsSymptoms, diagnosis.additionalDiagnoses]);

  const handleSuggestionClick = (suggestion: string) => {
    const current = me.meNarrative || "";
    if (current.includes(suggestion)) return; // already used, do nothing
    const next = current ? `${current}\n${suggestion}` : suggestion;
    setMonitorEval({ meNarrative: next });
  };

  const update = (field: keyof MonitorEval, val: any) =>
    setMonitorEval({ [field]: val } as Partial<MonitorEval>);

  return (
    <div className="fade-in">
      <DomainHeader title="ME. Monitor & Evaluate" />

      {/* Section 1 — Narrative card */}
      <div className="card" style={{ marginBottom: "1rem" }}>
        <SectionHeader title="ME Narrative" color="#2980b9" />
        
        {suggestions.length > 0 && (
          <div
            style={{
              background: "#ebf8ff",
              border: "1px solid rgba(41, 128, 185, 0.3)",
              borderRadius: "8px",
              padding: "10px 12px",
              marginBottom: "10px",
            }}
          >
            <div
              style={{
                color: "#2980b9",
                fontSize: "0.68rem",
                fontWeight: 800,
                letterSpacing: "0.06em",
                marginBottom: "8px",
                textTransform: "uppercase",
              }}
            >
              Suggested monitoring points — click to insert
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {suggestions.map((suggestion, idx) => {
                const used = (me.meNarrative || "").includes(suggestion);
                return (
                  <button
                    key={idx}
                    onClick={() => handleSuggestionClick(suggestion)}
                    style={
                      used
                        ? {
                            padding: "4px 10px",
                            borderRadius: "12px",
                            fontSize: "0.73rem",
                            fontWeight: 600,
                            border: "1px solid rgba(41,128,185,0.3)",
                            background: "rgba(41,128,185,0.1)",
                            color: "rgba(41,128,185,0.5)",
                            textDecoration: "line-through",
                            cursor: "default",
                          }
                        : {
                            padding: "4px 10px",
                            borderRadius: "12px",
                            fontSize: "0.73rem",
                            fontWeight: 600,
                            border: "1px solid rgba(41,128,185,0.5)",
                            background: "#fff",
                            color: "#2980b9",
                            cursor: "pointer",
                          }
                    }
                  >
                    {suggestion}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <textarea
          value={me.meNarrative || ""}
          onChange={e => update("meNarrative", e.target.value)}
          placeholder="Document monitoring indicators, evaluation criteria, and outcome progress here…"
          style={{ minHeight: "220px", width: "100%" }}
        />
      </div>

      {/* Section 2 — Discharge & Transition Planning card */}
      <div className="card" style={{ marginBottom: "1rem" }}>
        <SectionHeader title="Discharge & Transition Planning" color="#2c3e50" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <div className="input-group">
            <label>Discharge Recommendations</label>
            <textarea
              value={me.dischargeRecs || ""}
              onChange={e => update("dischargeRecs", e.target.value)}
              placeholder="Nutrition recommendations at discharge..."
              style={{ minHeight: "80px" }}
            />
          </div>
          <div className="input-group">
            <label>Transition / Follow-Up Plan</label>
            <textarea
              value={me.transitionPlan || ""}
              onChange={e => update("transitionPlan", e.target.value)}
              placeholder="Who follows up, when, how..."
              style={{ minHeight: "80px" }}
            />
          </div>
        </div>
      </div>

      {/* Section 3 — Additional Notes card */}
      <div className="card">
        <div className="input-group">
          <label>Additional ME Notes</label>
          <textarea
            value={me.meNotes || ""}
            onChange={e => update("meNotes", e.target.value)}
            placeholder="Any additional monitoring or evaluation narrative..."
            style={{ minHeight: "80px" }}
          />
        </div>
      </div>
    </div>
  );
}