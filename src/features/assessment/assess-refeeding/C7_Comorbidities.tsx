// src/features/assessment/assess-refeeding/C7_Comorbidities.tsx
import { useRefeedingStore } from "../../../stores/useRefeedingStore";
import { scoreComorbidities } from "../../../shared/utils/refeedingScreenLogic";
import { CriterionCard } from "./CriterionCard";

const COMORBIDITIES = [
  "AIDS",
  "Chronic alcohol or drug use disorder",
  "Dysphagia and esophageal dysmotility (eg, eosinophilic esophagitis, achalasia, gastric dysmotility)",
  "Eating disorders (eg, anorexia nervosa)",
  "Food insecurity and homelessness",
  "Failure to thrive, including physical and sexual abuse and victims of neglect (particularly children)",
  "Hyperemesis gravidarum or protracted vomiting",
  "Major stressors or surgery without nutrition for prolonged periods of time",
  "Malabsorptive states (eg, short-bowel syndrome, Crohn's disease, cystic fibrosis, pyloric stenosis, maldigestion, pancreatic insufficiency)",
  "Cancer",
  "Advanced neurologic impairment or general inability to communicate needs",
  "Postbariatric surgery",
  "Postoperative patients with complications",
  "Prolonged fasting (eg, individuals on hunger strikes, anorexia nervosa)",
  "Refugees",
  "Protein malnourishment",
];

export function C7_Comorbidities() {
  const { refeedingScreen: s, setRefeedingScreen } = useRefeedingStore();
  const computedRisk = scoreComorbidities(s.c7_selected);

  const toggle = (label: string) => {
    const already = s.c7_selected.includes(label);
    setRefeedingScreen({
      c7_selected: already
        ? s.c7_selected.filter((l) => l !== label)
        : [...s.c7_selected, label],
    });
  };

  return (
    <CriterionCard
      number={7}
      label="Comorbidities"
      computedRisk={computedRisk}
      sourceTag="clinical_judgment"
    >
      <div style={{ fontSize: "0.72rem", color: "#718096", marginBottom: "0.5rem" }}>
        Select all applicable comorbidities. All listed conditions appear in both the Moderate Disease and Severe Disease columns of the ASPEN table. Presence of any condition scores as <b>Significant Risk</b>.
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "3px", width: "100%", minWidth: 0 }}>
        {COMORBIDITIES.map((label) => {
          const isSelected = s.c7_selected.includes(label);
          return (
            <label
              key={label}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "8px",
                cursor: "pointer",
                padding: "5px 8px",
                borderRadius: "5px",
                border: `1px solid ${isSelected ? "#e74c3c" : "var(--border)"}`,
                background: isSelected ? "#e74c3c10" : "transparent",
                transition: "all 0.12s",
                minWidth: 0,
              }}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggle(label)}
                style={{ marginTop: "2px", flexShrink: 0, accentColor: "#e74c3c", width: "auto" }}
              />
              <span style={{ 
                fontSize: "0.73rem", 
                color: isSelected ? "#c0392b" : "#4a5568", 
                fontWeight: isSelected ? 600 : 400,
                minWidth: 0,
                flex: 1
              }}>
                {label}
              </span>
            </label>
          );
        })}
      </div>

      {s.c7_selected.length > 0 && (
        <div style={{ marginTop: "0.5rem", fontSize: "0.72rem", color: "#e74c3c", fontWeight: 600 }}>
          {s.c7_selected.length} comorbiditi{s.c7_selected.length > 1 ? "es" : "y"} selected → Significant Risk
        </div>
      )}
    </CriterionCard>
  );
}