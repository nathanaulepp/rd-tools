import React from "react";
import { useClinicalStore } from "../../stores/useClinicalStore";
import { SummaryCard } from "./SummaryShared";

// ── Shared compact row: label + value inline ──────────────────────────────────

function CRow({ label, value, unit }: { label: string; value?: string | null; unit?: string }) {
  if (!value?.trim()) return null;
  return (
    <div style={{ display: "flex", gap: "0.4rem", marginBottom: "3px", alignItems: "baseline", lineHeight: 1.4 }}>
      <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", flexShrink: 0, minWidth: "110px" }}>
        {label}
      </span>
      <span style={{ fontSize: "0.82rem", color: "#0f172a" }}>
        {value}{unit ? <span style={{ color: "#64748b", marginLeft: "2px" }}>{unit}</span> : null}
      </span>
    </div>
  );
}

// ── Medication formatter ───────────────────────────────────────────────────────

interface SelectedDrug { name: string; dose: string; route: string; frequency: string; notes: string; }

function parseMedications(value?: string): SelectedDrug[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.filter(e => e?.name?.trim());
  } catch {}
  return [];
}

function MedicationsBlock({ value }: { value?: string }) {
  const meds = parseMedications(value);
  if (meds.length === 0) {
    if (!value?.trim()) return null;
    return <CRow label="Medications" value={value} />;
  }
  return (
    <div style={{ display: "flex", gap: "0.4rem", marginBottom: "3px", alignItems: "flex-start" }}>
      <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", flexShrink: 0, minWidth: "110px", paddingTop: "2px" }}>
        Medications
      </span>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "3px", flex: 1 }}>
        {meds.map((med, i) => (
          <span key={i} style={{
            fontSize: "0.75rem", background: "#f1f5f9", border: "1px solid #e2e8f0",
            borderRadius: "4px", padding: "1px 6px", color: "#1e293b", lineHeight: 1.5,
            whiteSpace: "nowrap",
          }}>
            <strong>{med.name}</strong>
            {med.dose ? ` ${med.dose}` : ""}
            {med.route ? ` · ${med.route}` : ""}
            {med.frequency ? ` · ${med.frequency}` : ""}
            {med.notes ? <em style={{ color: "#94a3b8" }}> ({med.notes})</em> : null}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Vital chip ────────────────────────────────────────────────────────────────

function VitalChip({ label, value, unit }: { label: string; value?: string; unit?: string }) {
  if (!value?.trim() || value === "--") return null;
  return (
    <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "5px", padding: "3px 8px", display: "flex", alignItems: "baseline", gap: "5px" }}>
      <span style={{ fontSize: "0.6rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
      <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#0f172a" }}>{value}</span>
      {unit && <span style={{ fontSize: "0.65rem", color: "#64748b" }}>{unit}</span>}
    </div>
  );
}

// ── Section divider ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: "0.6rem", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "4px", marginTop: "10px", borderBottom: "1px solid #f1f5f9", paddingBottom: "2px" }}>
      {children}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function SummaryClinicalCard() {
  const { clinical } = useClinicalStore();

  const muscleWasting = [
    clinical?.temples     && `Temples (${clinical.temples})`,
    clinical?.clavicles   && `Clavicles (${clinical.clavicles})`,
    clinical?.shoulders   && `Shoulders (${clinical.shoulders})`,
    clinical?.scapula     && `Scapula (${clinical.scapula})`,
    clinical?.interosseous && `Interosseous (${clinical.interosseous})`,
    clinical?.thighs      && `Thighs (${clinical.thighs})`,
    clinical?.calves      && `Calves (${clinical.calves})`,
  ].filter(Boolean).join(" · ");

  const fatLoss = [
    clinical?.orbital     && `Orbital (${clinical.orbital})`,
    clinical?.cheek       && `Cheek (${clinical.cheek})`,
    clinical?.tricepsFat  && `Triceps (${clinical.tricepsFat})`,
    clinical?.midAxillary && `Mid-Axillary (${clinical.midAxillary})`,
  ].filter(Boolean).join(" · ");

  const fluidStatus = [
    clinical?.pittingEdema && `Edema (${clinical.pittingEdema})`,
    clinical?.ascites      && `Ascites (${clinical.ascites})`,
    clinical?.edemaDescription,
  ].filter(Boolean).join(" · ");

  const microNutrientSigns = [
    clinical?.hair?.length      && `Hair: ${clinical.hair.join(", ")}`,
    clinical?.eyes?.length      && `Eyes: ${clinical.eyes.join(", ")}`,
    clinical?.mouthLips?.length && `Mouth/Lips: ${clinical.mouthLips.join(", ")}`,
    clinical?.tongue?.length    && `Tongue: ${clinical.tongue.join(", ")}`,
    clinical?.teethGums?.length && `Teeth/Gums: ${clinical.teethGums.join(", ")}`,
    clinical?.headNeck?.length  && `Head/Neck: ${clinical.headNeck.join(", ")}`,
    clinical?.nails?.length     && `Nails: ${clinical.nails.join(", ")}`,
    clinical?.skin?.length      && `Skin: ${clinical.skin.join(", ")}`,
  ].filter(Boolean).join(" · ");

  const hasImaging = clinical?.imaging_smi || clinical?.imaging_muscleArea ||
    clinical?.imaging_muscleAttenuation || clinical?.imaging_imat ||
    clinical?.imaging_vat || clinical?.imaging_notes;

  return (
    <SummaryCard title="C. Clinical Findings & Physical Exam" color="#f39c12">

      {/* Row 1: Medical context + GI/Systemic side by side */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        <div>
          <SectionLabel>Medical Context</SectionLabel>
          <CRow label="Chief Complaint" value={clinical?.chiefComplaint} />
          <CRow label="Medical Hx" value={clinical?.medHx} />
          <CRow label="Family Hx" value={clinical?.familyHx} />
          <CRow label="Social Hx" value={clinical?.socialHx} />
          <CRow label="Allergies" value={clinical?.allergiesIntolerances} />
          <CRow label="Devices" value={clinical?.medicalDevices} />
          <CRow label="Screenings" value={clinical?.screenings} />
          <CRow label="Oral Hygiene" value={clinical?.oralHygiene} />
        </div>
        <div>
          <SectionLabel>GI & Systemic</SectionLabel>
          <CRow label="GI Symptoms" value={clinical?.giSymptoms?.filter(s => s !== "None").join(", ")} />
          <CRow label="Stool Type" value={clinical?.stoolType} />
          <CRow label="GI Notes" value={clinical?.giDistress} />
          <CRow label="Dentition" value={clinical?.dentition} />
          <CRow label="Swallow/Chew Concerns" value={clinical?.swallowChewConcerns?.filter(c => c !== "No issues noted").join(", ")} />
          <CRow label="FEV1" value={clinical?.fev1} unit="% predicted" />
          <CRow label="TBSA Burned" value={clinical?.tbsa} unit="%" />

          <SectionLabel>Vitals</SectionLabel>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
            <VitalChip label="Temp" value={clinical?.temp} unit="°F" />
            <VitalChip label="HR" value={clinical?.hr} unit="bpm" />
            <VitalChip label="SpO₂" value={clinical?.spo2} unit="%" />
            <VitalChip label="BP" value={clinical?.bp} unit="mmHg" />
            <VitalChip label="RR" value={clinical?.rr} unit="bpm" />
            <VitalChip label="Tmax" value={clinical?.tempMax} unit="°F" />
            <VitalChip label="Ve" value={clinical?.ve} unit="L/min" />
          </div>
        </div>
      </div>

      {/* Medications — full width, wrapped chips */}
      <div style={{ marginTop: "8px" }}>
        <SectionLabel>Medications</SectionLabel>
        <MedicationsBlock value={clinical?.medications} />
      </div>

      {/* NFPE — three compact rows */}
      {(muscleWasting || fatLoss || fluidStatus || clinical?.gripStrength) && (
        <div style={{ marginTop: "2px" }}>
          <SectionLabel>NFPE</SectionLabel>
          <CRow label="Muscle Wasting" value={muscleWasting || null} />
          <CRow label="Fat Loss" value={fatLoss || null} />
          <CRow label="Fluid / Edema" value={fluidStatus || null} />
          <CRow label="Grip Strength" value={clinical?.gripStrength} />
          {microNutrientSigns && <CRow label="Micronutrient" value={microNutrientSigns} />}
        </div>
      )}

      {/* Exam notes */}
      <CRow label="Exam Notes" value={clinical?.clinicalNotes} />

      {/* Imaging — only if any data present */}
      {hasImaging && (
        <div style={{ marginTop: "2px" }}>
          <SectionLabel>Radiology & Imaging</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 1rem" }}>
            <CRow label="SMI" value={clinical?.imaging_smi} unit="cm²/m²" />
            <CRow label="L3 Muscle Area" value={clinical?.imaging_muscleArea} unit="cm²" />
            <CRow label="Muscle Atten" value={clinical?.imaging_muscleAttenuation} unit="HU" />
            <CRow label="IMAT" value={clinical?.imaging_imat} />
            <CRow label="VAT" value={clinical?.imaging_vat} unit="cm²" />
          </div>
          <CRow label="Imaging Notes" value={clinical?.imaging_notes} />
        </div>
      )}

    </SummaryCard>
  );
}