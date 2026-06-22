// src/features/assessment/assess-clinical/ClinicalC4NFPE.tsx
import React from "react";
import { ChipGroup } from "../../../shared/ui/ChipGroup";
import { useClinicalStore } from "../../../stores/useClinicalStore";
import type { Clinical } from "../../../types";

const NFPE_OPTIONS = ["Normal", "Mild", "Moderate", "Severe"];

const SEVERITY_MAP: Record<string, string> = {
  Normal: "success",
  None: "success",
  No: "success",
  WNL: "success",
  Mild: "warning-bg",
  Moderate: "warning",
  Severe: "danger",
  Edema: "danger",
  "+1": "warning-bg",
  "+2": "warning",
  "+3": "danger",
  "+4": "danger",
  Yes: "danger",
  "Measurably Reduced": "warning",
};

const withDefaults = (options: string[]) => ["WNL", ...options, "Other"];

const MICRONUTRIENT_CATEGORIES = [
  {
    area: "Hair",
    options: withDefaults([
      "Alopecia", "Depigmentation", "Flag Sign", "Thinning", "Corkscrew", "Hirsutism",
    ]),
  },
  {
    area: "Eyes",
    options: withDefaults([
      "Pale Conjunctiva", "Nyctalopia", "Bitot's Spots", "Corneal Xerosis",
      "Keratomalacia", "Opthalmoplegia", "Kayser-Fleischer Rings",
      "Corneal Vascularization", "Xanthelasma", "Corneal Arcus",
    ]),
  },
  {
    area: "MouthLips",
    options: withDefaults([
      "Angular Stomatitis", "Cheilitis", "Sore/Swelling", "Excessive Saliva", "Pale Mucosa",
    ]),
  },
  {
    area: "Tongue",
    options: withDefaults([
      "Glossitis", "Scorbutic", "Pale", "Magenta", "Beefy Red, Smooth",
      "Thrush", "Geographic", "Strawberry", "Dysguesia",
    ]),
  },
  {
    area: "TeethGums",
    options: withDefaults([
      "Gingivitis, Scorbutic", "Dark Spots", "Mottling", "White streaks",
      "Delayed Tooth Eruption", "Caries", "White or Yellow Bands",
    ]),
  },
  {
    area: "HeadNeck",
    options: withDefaults(["Goiter", "Moon Face", "Sialadenosis"]),
  },
  {
    area: "Nails",
    options: withDefaults([
      "Koilonychia", "Beau's Lines", "Muehrcke Lines", "Mees Lines",
      "Splinter Hemorrhage", "Brittle", "Vertical Ridges", "Clubbing",
      "Leukonychia", "Half and Half", "Terry's Nail", "Pitting",
    ]),
  },
  {
    area: "Skin",
    options: withDefaults([
      "Delayed Wound Healing", "Bedsore", "Seborrheic Dermatitis",
      "Reddish-purple Spots", "Bruising", "Pallor", "Follicular Hyperkeratosis",
      "Hypopigmentation", "Hyperpigmentation", "Pellagra", "Bilateral edema",
      "Poor Turgor ", "Carotenemia ", "Jaundice ", "Acanthosis Nigricans",
    ]),
  },
];

export default function ClinicalC4NFPE() {
  const { clinical, setClinical } = useClinicalStore();

  const handleUpdate = (field: keyof Clinical, val: string | string[]) =>
    setClinical({ [field]: val } as Partial<Clinical>);

  const renderCellHeader = (title: string) => (
    <div
      style={{
        fontWeight: 700,
        fontSize: "0.65rem",
        color: "var(--text-muted)",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        marginBottom: "0.35rem",
      }}
    >
      {title}
    </div>
  );

  const renderStandardCell = (
    title: string,
    field: keyof Clinical,
    options: string[],
    severityMap: Record<string, string>,
    multiSelect = false
  ) => {
    return (
      <td style={{ verticalAlign: "top", padding: "0.5rem", border: "1px solid var(--border)" }}>
        {renderCellHeader(title)}
        <ChipGroup
          multiSelect={multiSelect}
          options={options}
          value={(clinical as any)[field] || (multiSelect ? [] : "")}
          onChange={(v) => handleUpdate(field, v)}
          severityMap={severityMap}
        />
      </td>
    );
  };

  return (
    <>
      <style>{`
        .nfpe-table.lab-table tr:hover td {
          background: transparent !important;
        }
      `}</style>
      {/* Unified 5-Column NFPE Table Card */}
      <div className="card mb-1">
        <h4 className="mb-1">C4: Nutrition Focused Physical Exam (NFPE)</h4>
        <div style={{ overflowX: "auto" }}>
          <table
            className="lab-table nfpe-table"
            style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}
          >
            <thead>
              <tr>
                <th colSpan={2} style={{ padding: "0.5rem", fontSize: "0.7rem", width: "40%", border: "1px solid var(--border)" }}>
                  Muscle Wasting (C41)
                </th>
                <th style={{ padding: "0.5rem", fontSize: "0.7rem", width: "20%", border: "1px solid var(--border)" }}>
                  Subcutaneous Fat Loss (C42)
                </th>
                <th style={{ padding: "0.5rem", fontSize: "0.7rem", width: "20%", border: "1px solid var(--border)" }}>
                  Fluid Accumulation (C43)
                </th>
                <th style={{ padding: "0.5rem", fontSize: "0.7rem", width: "20%", border: "1px solid var(--border)" }}>
                  Functional Status (C44)
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Row 1 */}
              <tr>
                {renderStandardCell("Temples", "temples", NFPE_OPTIONS, SEVERITY_MAP)}
                {renderStandardCell("Clavicles", "clavicles", NFPE_OPTIONS, SEVERITY_MAP)}
                {renderStandardCell("Orbital", "orbital", NFPE_OPTIONS, SEVERITY_MAP)}
                {renderStandardCell("Pitting Edema", "pittingEdema", ["None", "+1", "+2", "+3", "+4"], SEVERITY_MAP)}
                {renderStandardCell("Grip Strength", "gripStrength", ["WNL", "Measurably Reduced"], SEVERITY_MAP)}
              </tr>

              {/* Row 2 */}
              <tr>
                {renderStandardCell("Shoulders", "shoulders", NFPE_OPTIONS, SEVERITY_MAP)}
                {renderStandardCell("Scapula", "scapula", NFPE_OPTIONS, SEVERITY_MAP)}
                {renderStandardCell("Cheek", "cheek", NFPE_OPTIONS, SEVERITY_MAP)}
                {renderStandardCell("Pedal Edema", "pedalEdema", ["No", "Yes"], SEVERITY_MAP)}
                <td style={{ border: "1px solid var(--border)" }} />
              </tr>

              {/* Row 3 */}
              <tr>
                {renderStandardCell("Interosseous", "interosseous", NFPE_OPTIONS, SEVERITY_MAP)}
                {renderStandardCell("Thighs", "thighs", NFPE_OPTIONS, SEVERITY_MAP)}
                {renderStandardCell("Triceps", "tricepsFat", NFPE_OPTIONS, SEVERITY_MAP)}
                {renderStandardCell("Ascites", "ascites", ["None", "Mild", "Moderate", "Severe"], SEVERITY_MAP)}
                <td style={{ border: "1px solid var(--border)" }} />
              </tr>

              {/* Row 4 */}
              <tr>
                {renderStandardCell("Calves", "calves", NFPE_OPTIONS, SEVERITY_MAP)}
                <td style={{ border: "1px solid var(--border)" }} />
                {renderStandardCell("Mid-Axillary", "midAxillary", NFPE_OPTIONS, SEVERITY_MAP)}
                <td style={{ verticalAlign: "top", padding: "0.5rem", border: "1px solid var(--border)" }}>
                  {renderCellHeader("Edema Description")}
                  <input
                    type="text"
                    value={clinical.edemaDescription || ""}
                    onChange={(e) => handleUpdate("edemaDescription", e.target.value)}
                    placeholder="e.g. bilateral legs"
                    style={{
                      width: "100%",
                      padding: "0.25rem 0.4rem",
                      fontSize: "0.75rem",
                      borderRadius: "4px",
                      border: "1px solid var(--border)",
                      background: "transparent",
                      color: "inherit",
                    }}
                  />
                </td>
                <td style={{ border: "1px solid var(--border)" }} />
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* C45: Micronutrient Signs Card */}
      <div className="card mb-1">
        <h4 className="mb-1">C45: Micronutrient Signs (Physical Exam)</h4>
        <div className="grid-3-col">
          {MICRONUTRIENT_CATEGORIES.map(({ area, options }) => {
            const key = area.replace(/^(.)/, (c: string) => c.toLowerCase()) as keyof Clinical;
            return (
              <div className="input-group" key={area}>
                <label>{area.replace(/([A-Z])/g, " $1").trim()}</label>
                <ChipGroup
                  options={options}
                  value={(clinical as any)[key] || []}
                  onChange={(v) => handleUpdate(key, v)}
                  severityMap={SEVERITY_MAP}
                />
              </div>
            );
          })}
        </div>
        <div className="input-group mt-1">
          <label>Clinical Notes (Nuance)</label>
          <textarea
            style={{ minHeight: "100px" }}
            value={clinical.clinicalNotes || ""}
            onChange={(e) => handleUpdate("clinicalNotes", e.target.value)}
            placeholder="Add nuance for physical findings..."
          />
        </div>
      </div>
    </>
  );
}
