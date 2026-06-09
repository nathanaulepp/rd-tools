import React from "react";
import { useClinicalStore } from "../../stores/useClinicalStore";
import { SummaryCard, SummaryRow } from "./SummaryShared";

export default function SummaryClinicalCard() {
  const { clinical } = useClinicalStore();

  const renderVitalChip = (label: string, value: any, unit: string = "") => {
    if (!value || value === "" || value === "--") return null;
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        padding: "0.4rem 0.6rem",
        borderRadius: "6px"
      }}>
        <span style={{ fontWeight: 700, color: "#64748b", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {label}
        </span>
        <span style={{ color: "#0f172a", fontSize: "0.9rem", fontWeight: 500, marginTop: "2px" }}>
          {value} <span style={{ fontSize: "0.75rem", color: "#64748b" }}>{unit}</span>
        </span>
      </div>
    );
  };

  const hasNFPE = clinical?.hair?.length || clinical?.eyes?.length || clinical?.mouthLips?.length || clinical?.tongue?.length || clinical?.teethGums?.length || clinical?.headNeck?.length || clinical?.nails?.length || clinical?.skin?.length;

  return (
    <SummaryCard title="C. Clinical Findings & Physical Exam" color="#f39c12">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
        <div>
          <h4 style={styles.subGroup}>Medical Context</h4>
          <SummaryRow label="Chief Complaint" value={clinical?.chiefComplaint} />
          <SummaryRow label="Medical History" value={clinical?.medHx} />
          <SummaryRow label="Family History" value={clinical?.familyHx} />
          <SummaryRow label="Social History" value={clinical?.socialHx} />
          <SummaryRow label="Allergies/Intolerances" value={clinical?.allergiesIntolerances} />
          <SummaryRow label="Medical Devices" value={clinical?.medicalDevices} />
          <SummaryRow label="Medications" value={clinical?.medications} />
          <SummaryRow label="Screenings" value={clinical?.screenings} />
          <SummaryRow label="Oral Hygiene" value={clinical?.oralHygiene} />
        </div>
        <div>
          <h4 style={styles.subGroup}>GI & Systemic</h4>
          <SummaryRow label="GI Distress" value={clinical?.giDistress} />
          <SummaryRow label="Oral/Chewing" value={clinical?.chewing} />
          <SummaryRow label="Swallowing" value={clinical?.swallowing} />
          <SummaryRow label="FEV1 % Predicted" value={clinical?.fev1} />
          <SummaryRow label="TBSA Burned" value={clinical?.tbsa} unit="%" />
        </div>
      </div>

      <div style={{ marginTop: "1rem" }}>
        <h4 style={styles.subGroup}>Vital Signs</h4>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0.5rem" }}>
          {renderVitalChip("Temp", clinical?.temp, "°F")}
          {renderVitalChip("HR", clinical?.hr, "bpm")}
          {renderVitalChip("SpO2", clinical?.spo2, "%")}
          {renderVitalChip("BP", clinical?.bp, "mmHg")}
          {renderVitalChip("RR", clinical?.rr, "bpm")}
          {renderVitalChip("Max Temp", clinical?.tempMax, "°F")}
          {renderVitalChip("Ve", clinical?.ve, "L/min")}
        </div>
      </div>

      <div style={{ marginTop: "1rem" }}>
        <h4 style={styles.subGroup}>NFPE Findings</h4>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
          <div>
            <SummaryRow label="Muscle Wasting" value={[
              clinical?.temples && `Temples (${clinical.temples})`,
              clinical?.clavicles && `Clavicles (${clinical.clavicles})`,
              clinical?.shoulders && `Shoulders (${clinical.shoulders})`,
              clinical?.scapula && `Scapula (${clinical.scapula})`,
              clinical?.interosseous && `Interosseous (${clinical.interosseous})`,
              clinical?.thighs && `Thighs (${clinical.thighs})`,
              clinical?.calves && `Calves (${clinical.calves})`,
            ].filter(Boolean).join(", ")} />
            <SummaryRow label="Fat Loss" value={[
              clinical?.orbital && `Orbital (${clinical.orbital})`,
              clinical?.cheek && `Cheek (${clinical.cheek})`,
              clinical?.tricepsFat && `Triceps (${clinical.tricepsFat})`,
              clinical?.midAxillary && `Mid-Axillary (${clinical.midAxillary})`,
            ].filter(Boolean).join(", ")} />
          </div>
          <div>
            <SummaryRow label="Fluid" value={[
              clinical?.pittingEdema && `Edema (${clinical.pittingEdema})`,
              clinical?.ascites && `Ascites (${clinical.ascites})`,
            ].filter(Boolean).join(", ")} />
            <SummaryRow label="Edema Description" value={clinical?.edemaDescription} />
            <SummaryRow label="Function" value={clinical?.gripStrength} />
          </div>
        </div>

        {hasNFPE ? (
          <div style={{ marginTop: "1rem" }}>
            <h4 style={styles.subGroup}>Micronutrient Signs</h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
              <div>
                <SummaryRow label="Hair Signs" value={clinical?.hair?.join(", ")} />
                <SummaryRow label="Eye Signs" value={clinical?.eyes?.join(", ")} />
                <SummaryRow label="Mouth/Lip Signs" value={clinical?.mouthLips?.join(", ")} />
                <SummaryRow label="Tongue Signs" value={clinical?.tongue?.join(", ")} />
              </div>
              <div>
                <SummaryRow label="Teeth/Gum Signs" value={clinical?.teethGums?.join(", ")} />
                <SummaryRow label="Head/Neck Signs" value={clinical?.headNeck?.join(", ")} />
                <SummaryRow label="Nail Signs" value={clinical?.nails?.join(", ")} />
                <SummaryRow label="Skin Signs" value={clinical?.skin?.join(", ")} />
              </div>
            </div>
          </div>
        ) : null}

        <SummaryRow label="Exam Notes" value={clinical?.clinicalNotes} />
      </div>

      <div style={{ marginTop: "1rem" }}>
        <h4 style={styles.subGroup}>Radiology & Imaging</h4>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
          <div>
            <SummaryRow label="SMI" value={clinical?.imaging_smi} unit="cm²/m²" />
            <SummaryRow label="L3 Muscle Area" value={clinical?.imaging_muscleArea} unit="cm²" />
            <SummaryRow label="Muscle Atten" value={clinical?.imaging_muscleAttenuation} unit="HU" />
          </div>
          <div>
            <SummaryRow label="IMAT" value={clinical?.imaging_imat} />
            <SummaryRow label="VAT" value={clinical?.imaging_vat} unit="cm²" />
          </div>
        </div>
        <SummaryRow label="Imaging Notes" value={clinical?.imaging_notes} />
      </div>
    </SummaryCard>
  );
}

const styles = {
  subGroup: { fontSize: "0.75rem", fontWeight: 700, margin: "0 0 0.5rem", color: "#475569", textTransform: "uppercase" as any },
};
