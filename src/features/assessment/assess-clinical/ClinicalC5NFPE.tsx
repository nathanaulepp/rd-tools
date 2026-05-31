// src/features/assessment/assess-clinical/ClinicalC5NFPE.tsx
// Phase 5: Reads useClinicalStore directly. No props for domain state.

import React from "react";
import { ChipGroup } from "../../../shared/ui/ChipGroup";
import { useClinicalStore } from "../../../stores/useClinicalStore";
import type { Clinical } from "../../../types";

const NFPE_OPTIONS = ["Normal", "Mild", "Moderate", "Severe"];

const SEVERITY_MAP: Record<string, string> = {
  Normal: "success",
  None: "success",
  Mild: "warning-bg",
  Moderate: "warning",
  Severe: "danger",
  Edema: "danger",
  "+1": "warning-bg",
  "+2": "warning",
  "+3": "danger",
  "+4": "danger",
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

export default function ClinicalC5NFPE() {
  const { clinical, setClinical } = useClinicalStore();

  const handleUpdate = (field: keyof Clinical, val: string | string[]) =>
    setClinical({ [field]: val } as Partial<Clinical>);

  return (
    <div className="fade-in">
      {/* C51: Muscle Mass Wasting */}
      <div className="card mb-1">
        <h4 className="mb-1">C51: Muscle Mass Wasting</h4>
        <div className="grid-2-col">
          {["Temples", "Clavicles", "Shoulders", "Scapula", "Interosseous", "Thighs", "Calves"].map(
            (muscle) => {
              const key = muscle.toLowerCase() as keyof Clinical;
              return (
                <div className="input-group" key={muscle}>
                  <label>{muscle}</label>
                  <ChipGroup
                    multiSelect={false}
                    options={NFPE_OPTIONS}
                    value={(clinical as any)[key]}
                    onChange={(v) => handleUpdate(key, v)}
                    severityMap={SEVERITY_MAP}
                  />
                </div>
              );
            }
          )}
        </div>
      </div>

      {/* C52: Subcutaneous Fat Loss */}
      <div className="card mb-1">
        <h4 className="mb-1">C52: Subcutaneous Fat Loss</h4>
        <div className="grid-2-col">
          {["Orbital", "Cheek", "TricepsFat", "MidAxillary"].map((fatStr) => {
            const key = (fatStr.charAt(0).toLowerCase() + fatStr.slice(1)) as keyof Clinical;
            return (
              <div className="input-group" key={fatStr}>
                <label>{fatStr.replace("Fat", "")}</label>
                <ChipGroup
                  multiSelect={false}
                  options={NFPE_OPTIONS}
                  value={(clinical as any)[key]}
                  onChange={(v) => handleUpdate(key, v)}
                  severityMap={SEVERITY_MAP}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* C53: Fluid Accumulation */}
      <div className="card mb-1">
        <h4 className="mb-1">C53: Fluid Accumulation</h4>
        <div className="input-group">
          <label>Pitting Edema</label>
          <ChipGroup
            multiSelect={false}
            options={["None", "+1", "+2", "+3", "+4"]}
            value={clinical.pittingEdema}
            onChange={(v) => handleUpdate("pittingEdema", v)}
            severityMap={SEVERITY_MAP}
          />
        </div>
        <div className="input-group mt-1">
          <label>Pedal Edema</label>
          <ChipGroup
            multiSelect={false}
            options={["Yes", "No"]}
            value={clinical.pedalEdema}
            onChange={(v) => handleUpdate("pedalEdema", v)}
            severityMap={{ Yes: "danger", No: "success" }}
          />
        </div>
        <div className="input-group mt-1">
          <label>Edema Description (Optional)</label>
          <input
            type="text"
            value={clinical.edemaDescription}
            onChange={(e) => handleUpdate("edemaDescription", e.target.value)}
            placeholder="e.g. bilateral legs"
          />
        </div>
        <div className="input-group mt-1">
          <label>Ascites</label>
          <ChipGroup
            multiSelect={false}
            options={["None", "Mild", "Moderate", "Severe"]}
            value={clinical.ascites}
            onChange={(v) => handleUpdate("ascites", v)}
            severityMap={SEVERITY_MAP}
          />
        </div>
      </div>

      {/* C54: Functional Status */}
      <div className="card mb-1">
        <h4 className="mb-1">C54: Functional Status</h4>
        <div className="input-group">
          <label>Functional Grip Strength</label>
          <ChipGroup
            multiSelect={false}
            options={["WNL", "Measurably Reduced"]}
            value={clinical.gripStrength}
            onChange={(v) => handleUpdate("gripStrength", v)}
            severityMap={{ "Measurably Reduced": "warning" }}
          />
        </div>
      </div>

      {/* C55: Micronutrient Signs */}
      <div className="card mb-1">
        <h4 className="mb-1">C55: Micronutrient Signs (Physical Exam)</h4>
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
            value={clinical.clinicalNotes}
            onChange={(e) => handleUpdate("clinicalNotes", e.target.value)}
            placeholder="Add nuance for physical findings..."
          />
        </div>
      </div>
    </div>
  );
}