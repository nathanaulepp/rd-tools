// src/features/assessment/assess-clinical/ClinicalC2GISystemic.tsx
import React from "react";
import { useClinicalStore } from "../../../stores/useClinicalStore";
import type { Clinical } from "../../../types";
import { ChipGroup } from "../../../shared/ui/ChipGroup";
import { SelectInput } from "../../../shared/ui/SelectInput";
import { CollapseHeader } from "../../../shared/ui/CollapseHeader";
import { Field } from "../../../shared/ui/Field";
import { NumInput } from "../../../shared/ui/NumInput";
import {
  GI_SYMPTOM_OPTIONS,
  NICHE_CONDITION_OPTIONS,
} from "../../../shared/constants/clinicalC4Options";

const BRISTOL_SCALE = [
  { type: "Type 1", desc: "Separate lumps", border: "#e74c3c", bg: "rgba(231, 76, 60, 0.1)" },
  { type: "Type 2", desc: "Lumpy sausage", border: "#e74c3c", bg: "rgba(231, 76, 60, 0.1)" },
  { type: "Type 3", desc: "Cracked sausage", border: "#2ecc71", bg: "rgba(46, 204, 113, 0.1)" },
  { type: "Type 4", desc: "Smooth sausage", border: "#2ecc71", bg: "rgba(46, 204, 113, 0.1)" },
  { type: "Type 5", desc: "Soft blobs", border: "#da7f2b", bg: "rgba(218, 127, 43, 0.1)" },
  { type: "Type 6", desc: "Fluffy pieces", border: "#da7f2b", bg: "rgba(218, 127, 43, 0.1)" },
  { type: "Type 7", desc: "Watery", border: "#e74c3c", bg: "rgba(231, 76, 60, 0.1)" },
];

const DENTITION_STATUS_OPTIONS = ["Intact", "Dentures", "Overdentures", "Braces", "Partial Dentition", "Edentulous"];
const DENTITION_MODIFIERS_OPTIONS = ["None", "Natural Teeth Unreliable", "Prosthesis Unreliable", "Reduced Posterior Support"];
const CHEW_FUNCTIONALITY_OPTIONS = ["Normal", "Slowed", "Compromised", "None"];
const SWALLOW_FUNCTIONALITY_OPTIONS = ["Normal", "NPO", "Painful", "Dysphagia"];

const YES_NO_OPTIONS = ["Yes", "No"];
const BRUSHING_FREQUENCY_OPTIONS = ["BID", "Daily", "Some Days", "No"];
const FLOSSING_FREQUENCY_OPTIONS = ["Daily", "Weekly", "No"];

const toggleExclusiveChip = (
  next: string[],
  prev: string[],
  noneValue: string
): string[] => {
  const added = next.find((x) => !prev.includes(x));
  if (added === noneValue) {
    return [noneValue];
  }
  if (next.includes(noneValue) && next.length > 1) {
    return next.filter((x) => x !== noneValue);
  }
  return next;
};

export default function ClinicalC2GISystemic() {
  const { clinical, setClinical } = useClinicalStore();
  const [expanded, setExpanded] = React.useState(true);

  const handleUpdate = (field: keyof Clinical, val: any) =>
    setClinical({ [field]: val } as Partial<Clinical>);

  const inputStyle: React.CSSProperties = {
    padding: "5px 8px",
    border: "1px solid #e2e8f0",
    borderRadius: "4px",
    fontSize: "0.88rem",
    width: "100%",
    boxSizing: "border-box",
  };

  const textareaStyle: React.CSSProperties = {
    padding: "6px 8px",
    border: "1px solid #e2e8f0",
    borderRadius: "4px",
    fontSize: "0.88rem",
    width: "100%",
    boxSizing: "border-box",
    minHeight: "80px",
    resize: "vertical",
  };

  const sectionStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    padding: "16px",
    border: "1px solid #edf2f7",
    borderRadius: "8px",
    background: "#f7fafc",
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: "0.95rem",
    fontWeight: "bold",
    color: "#2d3748",
    borderBottom: "2px solid #e2e8f0",
    paddingBottom: "4px",
    marginBottom: "4px",
  };

  return (
    <div className="card">
      <CollapseHeader
        label="C2: GI & Systemic Function"
        expanded={expanded}
        onToggle={() => setExpanded(!expanded)}
      />
      {expanded && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "12px" }}>
          
          {/* Section A — GI Symptoms */}
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>Section A — GI Symptoms</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <Field label="GI Symptoms (Checklist)">
                <ChipGroup
                  multiSelect={true}
                  options={GI_SYMPTOM_OPTIONS}
                  value={clinical.giSymptoms || []}
                  onChange={(v) => {
                    const prev = clinical.giSymptoms || [];
                    const next = Array.isArray(v) ? v : [v];
                    handleUpdate("giSymptoms", toggleExclusiveChip(next, prev, "None"));
                  }}
                />
              </Field>

              {/* Conditional Symptoms */}
              {clinical.giSymptoms?.includes("Nausea") && (
                <Field label="Nausea VAS (0-10)">
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={clinical.nauseaVas || "0"}
                      onChange={(e) => handleUpdate("nauseaVas", e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <span style={{ fontWeight: "bold", minWidth: "24px", textAlign: "right" }}>{clinical.nauseaVas || "0"}</span>
                  </div>
                </Field>
              )}

              {clinical.giSymptoms?.includes("Vomiting") && (
                <Field label="Vomiting Details">
                  <div style={{ display: "flex", gap: "8px" }}>
                    <NumInput
                      value={clinical.vomitingEpisodes || ""}
                      onChange={(v) => handleUpdate("vomitingEpisodes", v)}
                      placeholder="Episodes"
                    />
                    <input
                      type="text"
                      value={clinical.vomitingDuration || ""}
                      onChange={(e) => handleUpdate("vomitingDuration", e.target.value)}
                      placeholder="Duration e.g. 2 days"
                      style={inputStyle}
                    />
                  </div>
                </Field>
              )}

              {clinical.giSymptoms?.includes("Diarrhea") && (
                <Field label="Diarrhea Details">
                  <div style={{ display: "flex", gap: "8px" }}>
                    <NumInput
                      value={clinical.diarrheaEpisodes || ""}
                      onChange={(v) => handleUpdate("diarrheaEpisodes", v)}
                      placeholder="Episodes"
                    />
                    <input
                      type="text"
                      value={clinical.diarrheaDuration || ""}
                      onChange={(e) => handleUpdate("diarrheaDuration", e.target.value)}
                      placeholder="Duration e.g. 2 days"
                      style={inputStyle}
                    />
                  </div>
                </Field>
              )}

              {clinical.giSymptoms?.includes("Constipation") && (
                <Field label="Constipation Duration">
                  <input
                    type="text"
                    value={clinical.constipationDuration || ""}
                    onChange={(e) => handleUpdate("constipationDuration", e.target.value)}
                    placeholder="Duration e.g. 5 days"
                    style={inputStyle}
                  />
                </Field>
              )}

              {clinical.giSymptoms?.includes("Bloating") && (
                <Field label="Bloating Duration">
                  <input
                    type="text"
                    value={clinical.bloatingDuration || ""}
                    onChange={(e) => handleUpdate("bloatingDuration", e.target.value)}
                    placeholder="Duration e.g. 3 days"
                    style={inputStyle}
                  />
                </Field>
              )}

              {clinical.giSymptoms?.includes("Abdominal Pain") && (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", border: "1px solid #e2e8f0", padding: "10px", borderRadius: "6px", backgroundColor: "#fff" }}>
                  <Field label="Abdominal Pain Type">
                    <SelectInput
                      value={clinical.abdominalPainType || ""}
                      onChange={(v) => handleUpdate("abdominalPainType", v)}
                      options={["Episodic", "Continuous"]}
                      placeholder="Select pain type..."
                    />
                  </Field>
                  {clinical.abdominalPainType === "Episodic" && (
                    <Field label="Episodic Pain Details">
                      <div style={{ display: "flex", gap: "8px" }}>
                        <NumInput
                          value={clinical.abdominalPainEpisodes || ""}
                          onChange={(v) => handleUpdate("abdominalPainEpisodes", v)}
                          placeholder="Episodes"
                        />
                        <input
                          type="text"
                          value={clinical.abdominalPainDuration || ""}
                          onChange={(e) => handleUpdate("abdominalPainDuration", e.target.value)}
                          placeholder="Duration e.g. 3 days"
                          style={inputStyle}
                        />
                      </div>
                    </Field>
                  )}
                  {clinical.abdominalPainType === "Continuous" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <Field label="Continuous Pain Severity (VAS 0-10)">
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <input
                            type="range"
                            min="0"
                            max="10"
                            value={clinical.abdominalPainVas || "0"}
                            onChange={(e) => handleUpdate("abdominalPainVas", e.target.value)}
                            style={{ flex: 1 }}
                          />
                          <span style={{ fontWeight: "bold", minWidth: "24px", textAlign: "right" }}>{clinical.abdominalPainVas || "0"}</span>
                        </div>
                      </Field>
                      <Field label="Pain Duration">
                        <input
                          type="text"
                          value={clinical.abdominalPainDuration || ""}
                          onChange={(e) => handleUpdate("abdominalPainDuration", e.target.value)}
                          placeholder="Duration e.g. 3 days"
                          style={inputStyle}
                        />
                      </Field>
                    </div>
                  )}
                </div>
              )}

              {/* BM Frequency & Bristol Scale */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "12px" }}>
                <Field label="BM Frequency">
                  <NumInput
                    value={clinical.bmFrequency || ""}
                    onChange={(v) => handleUpdate("bmFrequency", v)}
                    placeholder="Times/day"
                  />
                </Field>
                <Field label="Stool Type (Bristol Scale)">
                  <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                    {BRISTOL_SCALE.map((item) => {
                      const isSelected = clinical.stoolType === item.type;
                      return (
                        <button
                          key={item.type}
                          type="button"
                          style={{
                            width: "52px",
                            height: "56px",
                            borderRadius: "6px",
                            border: isSelected ? `1px solid ${item.border}` : "1px solid var(--border)",
                            background: isSelected ? item.bg : "var(--bg-color)",
                            cursor: "pointer",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "4px",
                            padding: "4px",
                            color: "inherit",
                          }}
                          onClick={() => handleUpdate("stoolType", isSelected ? "" : item.type)}
                        >
                          <span style={{ fontSize: "0.6rem", opacity: 0.7 }}>{item.type}</span>
                          <span style={{ fontSize: "0.55rem", lineHeight: "1.1", textAlign: "center" }}>{item.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </Field>
              </div>

              <Field label="GI Comments">
                <textarea
                  style={textareaStyle}
                  value={clinical.giComments || ""}
                  onChange={(e) => handleUpdate("giComments", e.target.value)}
                  placeholder="GI symptoms notes & observations..."
                />
              </Field>
            </div>
          </div>

          {/* Section B — Mouth */}
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>Section B — Mouth</div>
            <div className="grid-2-col">
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <Field label="Dentition Status">
                  <SelectInput
                    value={clinical.dentitionStatus || ""}
                    onChange={(v) => handleUpdate("dentitionStatus", v)}
                    options={DENTITION_STATUS_OPTIONS}
                    placeholder="Select status..."
                  />
                </Field>
                <Field label="Dentition Modifiers">
                  <ChipGroup
                    multiSelect={true}
                    options={DENTITION_MODIFIERS_OPTIONS}
                    value={clinical.dentitionModifiers || []}
                    onChange={(v) => {
                      const prev = clinical.dentitionModifiers || [];
                      const next = Array.isArray(v) ? v : [v];
                      handleUpdate("dentitionModifiers", toggleExclusiveChip(next, prev, "None"));
                    }}
                  />
                </Field>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <Field label="Chew Functionality">
                  <SelectInput
                    value={clinical.chewFunctionality || ""}
                    onChange={(v) => handleUpdate("chewFunctionality", v)}
                    options={CHEW_FUNCTIONALITY_OPTIONS}
                    placeholder="Select chew status..."
                  />
                </Field>
                <Field label="Swallow Functionality">
                  <ChipGroup
                    multiSelect={true}
                    options={SWALLOW_FUNCTIONALITY_OPTIONS}
                    value={clinical.swallowFunctionality || []}
                    onChange={(v) => {
                      const prev = clinical.swallowFunctionality || [];
                      const next = Array.isArray(v) ? v : [v];
                      handleUpdate("swallowFunctionality", toggleExclusiveChip(next, prev, "Normal"));
                    }}
                  />
                </Field>
              </div>
            </div>
            <Field label="Mouth Comments">
              <textarea
                style={textareaStyle}
                value={clinical.mouthComments || ""}
                onChange={(e) => handleUpdate("mouthComments", e.target.value)}
                placeholder="Chewing/swallowing or dentition comments..."
              />
            </Field>
          </div>

          {/* Section C — Oral Hygiene */}
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>Section C — Oral Hygiene</div>
            <div className="grid-2-col">
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <Field label="Has Toothbrush in Hospital">
                  <SelectInput
                    value={clinical.hasToothbrush || ""}
                    onChange={(v) => handleUpdate("hasToothbrush", v)}
                    options={YES_NO_OPTIONS}
                    placeholder="Select..."
                  />
                </Field>
                <Field label="Brushing Frequency">
                  <SelectInput
                    value={clinical.brushingFrequency || ""}
                    onChange={(v) => handleUpdate("brushingFrequency", v)}
                    options={BRUSHING_FREQUENCY_OPTIONS}
                    placeholder="Select..."
                  />
                </Field>
                <Field label="Flossing Frequency">
                  <SelectInput
                    value={clinical.flossingFrequency || ""}
                    onChange={(v) => handleUpdate("flossingFrequency", v)}
                    options={FLOSSING_FREQUENCY_OPTIONS}
                    placeholder="Select..."
                  />
                </Field>
                <Field label="Uses Mouthwash">
                  <SelectInput
                    value={clinical.usesMouthwash || ""}
                    onChange={(v) => handleUpdate("usesMouthwash", v)}
                    options={YES_NO_OPTIONS}
                    placeholder="Select..."
                  />
                </Field>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <Field label="Removes Oral Appliances on Schedule">
                  <SelectInput
                    value={clinical.removesAppliances || ""}
                    onChange={(v) => handleUpdate("removesAppliances", v)}
                    options={YES_NO_OPTIONS}
                    placeholder="Select..."
                  />
                </Field>
                <Field label="Cleans Oral Appliances">
                  <SelectInput
                    value={clinical.cleansAppliances || ""}
                    onChange={(v) => handleUpdate("cleansAppliances", v)}
                    options={YES_NO_OPTIONS}
                    placeholder="Select..."
                  />
                </Field>
                <Field label="Fluoride Toothpaste">
                  <SelectInput
                    value={clinical.fluorideToothpaste || ""}
                    onChange={(v) => handleUpdate("fluorideToothpaste", v)}
                    options={YES_NO_OPTIONS}
                    placeholder="Select..."
                  />
                </Field>
                <Field label="Spits Out Toothpaste">
                  <SelectInput
                    value={clinical.spitsToothpaste || ""}
                    onChange={(v) => handleUpdate("spitsToothpaste", v)}
                    options={YES_NO_OPTIONS}
                    placeholder="Select..."
                  />
                </Field>
              </div>
            </div>
            <Field label="Oral Hygiene Comments">
              <textarea
                style={textareaStyle}
                value={clinical.oralHygieneComments || ""}
                onChange={(e) => handleUpdate("oralHygieneComments", e.target.value)}
                placeholder="Oral hygiene notes..."
              />
            </Field>
          </div>

          {/* Section D — Allergies & Medical Devices */}
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>Section D — Allergies & Medical Devices</div>
            <div className="grid-2-col">
              <Field label="Allergies/Intolerances">
                <textarea
                  style={{ ...textareaStyle, minHeight: "100px" }}
                  value={clinical.allergiesIntolerances || ""}
                  onChange={(e) => handleUpdate("allergiesIntolerances", e.target.value)}
                  placeholder="e.g. latex, milk, soy..."
                />
              </Field>
              <Field label="Medical Devices/Prosthetics">
                <textarea
                  style={{ ...textareaStyle, minHeight: "100px" }}
                  value={clinical.medicalDevices || ""}
                  onChange={(e) => handleUpdate("medicalDevices", e.target.value)}
                  placeholder="e.g. hearing aids, pacemaker..."
                />
              </Field>
            </div>
          </div>

          {/* Section E — Specialized Population Flags */}
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>Section E — Specialized Population Flags</div>
            <Field label="Specialized Population Flags (optional)">
              <ChipGroup
                multiSelect={true}
                options={NICHE_CONDITION_OPTIONS}
                value={clinical.nicheConditionFlags || []}
                onChange={(v) => handleUpdate("nicheConditionFlags", v)}
              />
            </Field>
            <div className="grid-2-col">
              {clinical.nicheConditionFlags?.includes("Burn Patient") && (
                <div className="input-group">
                  <label>TBSA Burned (%)</label>
                  <input
                    type="text"
                    value={clinical.tbsa || ""}
                    onChange={(e) => handleUpdate("tbsa", e.target.value)}
                    placeholder="For Milner/Toronto formula"
                    style={inputStyle}
                  />
                </div>
              )}
              {clinical.nicheConditionFlags?.includes("Cystic Fibrosis") && (
                <div className="input-group">
                  <label>FEV₁ % Predicted</label>
                  <input
                    type="text"
                    value={clinical.fev1 || ""}
                    onChange={(e) => handleUpdate("fev1", e.target.value)}
                    placeholder="For CF equation"
                    style={inputStyle}
                  />
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
