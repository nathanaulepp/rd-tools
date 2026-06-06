import React, { useState } from "react";
import { CollapseHeader } from "../../../shared/ui/CollapseHeader";
import { useInterventionStore } from "../../../stores/useInterventionStore";
import { useCalculatedMetrics } from "../../../stores/useCalculatedMetrics";
import NdFoodDeliverySection from "./NdFoodDeliverySection";
import NdEnParSection from "./NdEnParSection";
import NdSupplementSection from "./NdSupplementSection";
import NdFeedingAssistanceSection from "./NdFeedingAssistanceSection";
import NdFeedingEnvironmentSection from "./NdFeedingEnvironmentSection";
import NdMedManagementSection from "./NdMedManagementSection";
import NdInfantFeedingSection from "./NdInfantFeedingSection";
import EducationSection from "./EducationSection";
import CounselingSection from "./CounselingSection";
import CoordinationSection from "./CoordinationSection";

function sectionBadge(count: number): string | null {
  return count > 0 ? `${count} selected` : null;
}

export default function InterventionImplementationPanel() {
  const { intervention } = useInterventionStore();
  const { ageDays } = useCalculatedMetrics();
  const showInfant = (ageDays !== null && ageDays < 730);

  const [open, setOpen] = useState<Record<string, boolean>>({});
  const toggle = (key: string) => setOpen(prev => ({ ...prev, [key]: !prev[key] }));

  const ms = intervention.ndMealsSnacks;
  const ep = intervention.ndEnPnManagement;
  const st = intervention.ndSupplementTherapy;
  const fa = intervention.ndFeedingAssistance;
  const fe = intervention.ndFeedingEnvironment;
  const mm = intervention.ndMedManagement;
  const inf = intervention.ndInfantFeeding;
  const ed = intervention.education;
  const c = intervention.counseling;
  const rc = intervention.coordination;

  const msCount = [
    ...ms.selectedDietTypes, ...(ms.textureLevel ? [ms.textureLevel] : []),
    ...ms.proteinMods, ...ms.aminoAcidMods, ...ms.carbMods, ...ms.fatMods,
    ...ms.fiberMods, ...ms.fluidMods, ...ms.mineralMods, ...ms.vitaminMods,
    ...ms.foodGroupMods, ...ms.specificFoodMods, ...ms.intakeTiming, ...ms.other,
  ].length;

  const sections: { key: string; label: string; accent: string; badge: string | null; show?: boolean; Content: React.FC }[] = [
    { key: "nd1",  label: "ND-1: Meals & Snacks",                 accent: "#3498db", badge: sectionBadge(msCount),                                            Content: NdFoodDeliverySection },
    { key: "nd2",  label: "ND-2: EN/PN Management",              accent: "#8e44ad", badge: sectionBadge(ep.enActions.length + ep.pnActions.length),           Content: NdEnParSection },
    { key: "nd3",  label: "ND-3: Supplement Therapy",            accent: "#e67e22", badge: sectionBadge(st.medicalFoodActions.length + st.vitaminSupplements.length + st.mineralSupplements.length + st.bioactiveActions.length), Content: NdSupplementSection },
    { key: "nd4",  label: "ND-4: Feeding Assistance",            accent: "#27ae60", badge: sectionBadge(fa.actions.length),                                   Content: NdFeedingAssistanceSection },
    { key: "nd5",  label: "ND-5: Feeding Environment",           accent: "#2c3e50", badge: sectionBadge(fe.actions.length),                                   Content: NdFeedingEnvironmentSection },
    { key: "nd6",  label: "ND-6: Medication Management",         accent: "#c0392b", badge: sectionBadge(mm.actions.length),                                   Content: NdMedManagementSection },
    { key: "nd7",  label: "ND-7: Infant Feeding",                accent: "#16a085", badge: sectionBadge(inf.breastmilkActions.length + inf.formulaActions.length), show: showInfant, Content: NdInfantFeedingSection },
    { key: "e",    label: "E: Nutrition Education",              accent: "#f39c12", badge: sectionBadge(ed.contentActions.length + ed.applicationActions.length), Content: EducationSection },
    { key: "c",    label: "C: Nutrition Counseling",             accent: "#8e44ad", badge: sectionBadge(c.theoreticalBasis.length + c.strategies.length),     Content: CounselingSection },
    { key: "rc",   label: "RC: Coordination of Care",            accent: "#2c3e50", badge: sectionBadge(rc.collaborationActions.length + rc.dischargeActions.length), Content: CoordinationSection },
  ];

  return (
    <div className="card" style={{ marginBottom: "1rem" }}>
      <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--primary)", marginBottom: "0.75rem", paddingBottom: "0.4rem", borderBottom: "2px solid var(--bg-color)" }}>
        NCP Intervention Implementation
      </div>
      {sections
        .filter(s => s.show !== false)
        .map(({ key, label, accent, badge, Content }) => (
          <div key={key} style={{ marginBottom: "4px" }}>
            <CollapseHeader
              label={label}
              expanded={!!open[key]}
              onToggle={() => toggle(key)}
              accent={accent}
              badge={badge}
            />
            {open[key] && (
              <div style={{ border: `1px solid ${accent}30`, borderTop: "none", borderRadius: "0 0 8px 8px" }}>
                <Content />
              </div>
            )}
          </div>
        ))}
    </div>
  );
}