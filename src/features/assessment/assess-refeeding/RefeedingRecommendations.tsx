// src/features/assessment/assess-refeeding/RefeedingRecommendations.tsx
// Displays ASPEN consensus recommendations based on overall risk level.
// Content sourced directly from the RD2B Tools CSV.

import { useState } from "react";
import type { OverallRisk } from "../../../types/refeedingScreen";
import { riskColor } from "../../../shared/utils/refeedingScreenLogic";

interface Props {
  overall: OverallRisk;
}

interface Rec {
  aspect: string;
  text: string;
}

const RECOMMENDATIONS: Rec[] = [
  {
    aspect: "Initiation of Calories",
    text: `Initiate with 100–150 g of dextrose or 10–20 kcal/kg for the first 24 hours; advance by 33% of goal every 1 to 2 days. This includes enteral as well as parenteral glucose.

In patients with moderate to high risk of RS with low electrolyte levels, holding the initiation or increase of calories until electrolytes are supplemented and/or normalized should be considered.

Initiation of or increasing calories should be delayed in patients with severely low phosphorus, potassium, or magnesium levels until corrected.

Calories from IV dextrose solutions and medications being infused in dextrose should be considered in the limits above and/or initiated with caution in patients at moderate to severe risk for RS. If a patient has received significant amounts of dextrose for several days from maintenance IV fluids and/or medications in dextrose, and has been asymptomatic with stable electrolytes, calories from nutrition may be reintroduced at a higher amount than recommended above.`,
  },
  {
    aspect: "Fluid Restriction",
    text: "No recommendation.",
  },
  {
    aspect: "Sodium Restriction",
    text: "No recommendation.",
  },
  {
    aspect: "Protein Restriction",
    text: "No recommendation.",
  },
  {
    aspect: "Electrolytes",
    text: `Check serum potassium, magnesium, and phosphorus before initiation of nutrition.

Monitor every 12 hours for the first 3 days in high-risk patients. May be more frequent based on clinical picture.

Replete low electrolytes based on established standards of care.

No recommendation can be made for whether prophylactic dosing of electrolytes should be given if prefeeding levels are normal.

If electrolytes become difficult to correct or drop precipitously during the initiation of nutrition, decrease calories/grams of dextrose by 50% and advance the dextrose/calories by approximately 33% of goal every 1–2 days based on clinical presentation. Recommendations may be changed based on practitioner judgment and clinical presentation, and cessation of nutrition support may be considered when electrolyte levels are severely and/or life-threateningly low or dropping precipitously.`,
  },
  {
    aspect: "Thiamin and Multivitamins",
    text: `Supplement thiamin 100 mg before feeding or before initiating dextrose-containing IV fluids in patients at risk.

Supplement thiamin 100 mg/d for 5–7 days or longer in patients with severe starvation, chronic alcoholism, or other high risk for deficiency and/or signs of thiamin deficiency.

Routine thiamin levels are unlikely to be of value.

MVI is added to PN daily, unless contraindicated, as long as PN is continued. For patients receiving oral/enteral nourishment, add complete oral/enteral multivitamin once daily for 10 days or greater based on clinical status and mode of therapy.`,
  },
  {
    aspect: "Monitoring and Long-Term Care",
    text: `Recommend vital signs every 4 hours for the first 24 hours after initiation of calories in patients at risk.

Cardiorespiratory monitoring is recommended for unstable patients or those with severe deficiencies, based on established standards of care.

Daily weights with monitored intake and output.

Evaluate short- and long-term goals for nutrition care daily during the first several days until the patient is deemed stabilized (eg, no requirement for electrolyte supplementation for 2 days) and then based on institutional standards of care.`,
  },
];

export function RefeedingRecommendations({ overall }: Props) {
  const [expanded, setExpanded] = useState(false);
  const isAtRisk = overall.level !== "none";
  const color = riskColor(overall.level);

  if (!isAtRisk) {
    return (
      <div
        className="card"
        style={{ borderLeft: "3px solid #27ae60", background: "#27ae6008" }}
      >
        <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#27ae60", marginBottom: "4px" }}>
          ✓ Low / Not at Risk
        </div>
        <div style={{ fontSize: "0.72rem", color: "#4a5568" }}>
          No refeeding syndrome risk criteria met. Standard nutrition initiation practices apply. Continue to monitor electrolytes per institutional protocol.
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ borderLeft: `3px solid ${color}`, background: `${color}06` }}>
      {/* Header */}
      <div
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", userSelect: "none" }}
        onClick={() => setExpanded((e) => !e)}
      >
        <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--primary)" }}>
          🩺 ASPEN Management Recommendations
        </div>
        <span style={{ fontSize: "0.65rem", color: "#a0aec0" }}>{expanded ? "▲ Hide" : "▼ Show"}</span>
      </div>

      {/* Alert blurb — always visible */}
      <div
        style={{
          marginTop: "0.5rem",
          padding: "6px 10px",
          background: `${color}15`,
          border: `1px solid ${color}40`,
          borderRadius: "5px",
          fontSize: "0.72rem",
          color: "#2c3e50",
          fontWeight: 600,
        }}
      >
        ⚠ Patient identified as{" "}
        <span style={{ color }}>
          {overall.level === "significant" ? "Significant Refeeding Risk (1 significant criterion met)" : "Moderate Refeeding Risk (2+ moderate criteria met)"}
        </span>
        . Apply ASPEN refeeding precautions below.
      </div>

      {/* Expandable recommendations */}
      {expanded && (
        <div style={{ marginTop: "0.65rem", display: "flex", flexDirection: "column", gap: "6px" }}>
          {RECOMMENDATIONS.map((rec) => (
            <RecBlock key={rec.aspect} rec={rec} color={color} />
          ))}
          <div style={{ fontSize: "0.64rem", color: "#a0aec0", marginTop: "4px", fontStyle: "italic" }}>
            Source: ASPEN Refeeding Syndrome Consensus Recommendations, 2020. Clinical judgment should be applied based on individual patient presentation.
          </div>
        </div>
      )}
    </div>
  );
}

function RecBlock({ rec, color }: { rec: Rec; color: string }) {
  const isShort = rec.text.trim().split("\n").length <= 1 && rec.text.length < 60;
  return (
    <div
      style={{
        borderLeft: `2px solid ${color}50`,
        paddingLeft: "10px",
      }}
    >
      <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "#2c3e50", marginBottom: "3px", textTransform: "uppercase", letterSpacing: "0.03em" }}>
        {rec.aspect}
      </div>
      {isShort ? (
        <div style={{ fontSize: "0.72rem", color: "#718096" }}>{rec.text}</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {rec.text
            .split("\n\n")
            .filter((p) => p.trim())
            .map((para, i) => (
              <div key={i} style={{ fontSize: "0.71rem", color: "#4a5568", lineHeight: 1.55 }}>
                {para.trim()}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}