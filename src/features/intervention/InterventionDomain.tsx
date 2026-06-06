// src/features/intervention/InterventionDomain.tsx
// Phase 5: Reads useInterventionStore directly. No props for domain state.

import React from "react";
import { DomainHeader } from "../../shared/ui/DomainHeader";
import { SectionHeader } from "../../shared/ui/SectionHeader";
import { ChipGroup } from "../../shared/ui/ChipGroup";
import { useInterventionStore } from "../../stores/useInterventionStore";
import type { Intervention } from "../../types";

// ─── Constants ────────────────────────────────────────────────────────────────

const COUNSELING_THEORY_OPTIONS = [
  "Cognitive-Behavioral Theory (CBT)",
  "Health Belief Model",
  "Motivational Interviewing",
  "Transtheoretical Model / Stages of Change",
  "Social Learning Theory",
  "Goal Setting",
  "Self-Monitoring",
  "Problem Solving",
  "Stress Management",
  "Stimulus Control",
  "Mindfulness-Based",
  "Relapse Prevention",
];

const COUNSELING_STRATEGY_OPTIONS = [
  "Anticipatory guidance", "Motivational interviewing", "Coaching/goal setting",
  "Self-monitoring", "Social support", "Stress management", "Stimulus control",
  "Cognitive restructuring", "Relapse prevention", "Rewards/incentives",
];

// ─── Sub-section wrappers ─────────────────────────────────────────────────────

function SubSection({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="card" style={{ marginBottom: "1rem" }}>
      <SectionHeader title={title} color={color} />
      {children}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function InterventionDomain() {
  const { intervention, setIntervention } = useInterventionStore();

  const update = (field: keyof Intervention, val: any) =>
    setIntervention({ [field]: val } as Partial<Intervention>);

  const i = intervention || {};

  return (
    <div className="fade-in">
      <DomainHeader title="I. Nutrition Intervention" />

      {/* ND: Nutrition Delivery */}
      <SubSection title="ND: Nutrition Delivery" color="#3498db">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <div className="input-group">
            <label>ND-1: Meals & Snacks</label>
            <textarea value={i.nd_mealsSnacks || ""} onChange={e => update("nd_mealsSnacks", e.target.value)} placeholder="Diet order, texture modifications, meal timing..." style={{ minHeight: "70px" }} />
          </div>
          <div className="input-group">
            <label>ND-2: Supplemental / Specialized Feeding</label>
            <textarea value={i.nd_supplementalFeeding || ""} onChange={e => update("nd_supplementalFeeding", e.target.value)} placeholder="Oral supplements, EN/PN, formula specifics..." style={{ minHeight: "70px" }} />
          </div>
          <div className="input-group">
            <label>ND-3: Feeding Assistance</label>
            <input type="text" value={i.nd_feedingAssistance || ""} onChange={e => update("nd_feedingAssistance", e.target.value)} placeholder="e.g. adaptive equipment, cueing, hand-over-hand" />
          </div>
          <div className="input-group">
            <label>ND-4: Feeding Environment</label>
            <input type="text" value={i.nd_feedingEnvironment || ""} onChange={e => update("nd_feedingEnvironment", e.target.value)} placeholder="e.g. positioning, table height, distractions reduced" />
          </div>
          <div className="input-group" style={{ gridColumn: "span 2" }}>
            <label>ND-5: Nutrition-Related Medication Management</label>
            <textarea value={i.nd_nutritionRelatedMedMgmt || ""} onChange={e => update("nd_nutritionRelatedMedMgmt", e.target.value)} placeholder="e.g. vitamin D initiation, iron supplementation, appetite stimulant..." style={{ minHeight: "60px" }} />
          </div>
        </div>
      </SubSection>

      {/* E: Nutrition Education */}
      <SubSection title="E: Nutrition Education" color="#e67e22">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
          <div className="input-group">
            <label>E-1: Purpose / Rationale</label>
            <textarea value={i.ed_purpose || ""} onChange={e => update("ed_purpose", e.target.value)} placeholder="Explain why education was provided..." style={{ minHeight: "70px" }} />
          </div>
          <div className="input-group">
            <label>E-2: Content Covered</label>
            <textarea value={i.ed_content || ""} onChange={e => update("ed_content", e.target.value)} placeholder="What specific topics were taught..." style={{ minHeight: "70px" }} />
          </div>
          <div className="input-group">
            <label>E-3: Application / Follow-through</label>
            <textarea value={i.ed_application || ""} onChange={e => update("ed_application", e.target.value)} placeholder="How will patient apply this information..." style={{ minHeight: "70px" }} />
          </div>
        </div>
        <div className="input-group" style={{ marginTop: "0.75rem" }}>
          <label>Other Education Notes</label>
          <input type="text" value={i.ed_other || ""} onChange={e => update("ed_other", e.target.value)} placeholder="Any additional education content or outcomes..." />
        </div>
      </SubSection>

      {/* C: Nutrition Counseling */}
      <SubSection title="C: Nutrition Counseling" color="#8e44ad">
        <div style={{ marginBottom: "0.75rem" }}>
          <div className="input-group">
            <label>C-1: Theoretical Basis / Approach</label>
            <select
              value={i.c_theory || ""}
              onChange={e => update("c_theory", e.target.value)}
              style={{ padding: "6px 8px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "0.88rem", width: "100%", boxSizing: "border-box" }}
            >
              <option value="">— Select approach —</option>
              {COUNSELING_THEORY_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div className="input-group">
          <label>C-2: Strategies Used</label>
          <ChipGroup
            options={COUNSELING_STRATEGY_OPTIONS}
            value={i.c_strategy || []}
            onChange={v => update("c_strategy", v)}
            multiSelect={true}
          />
        </div>
        <div className="input-group" style={{ marginTop: "0.5rem" }}>
          <label>Other Counseling Notes</label>
          <textarea value={i.c_other || ""} onChange={e => update("c_other", e.target.value)} placeholder="Additional counseling notes..." style={{ minHeight: "60px" }} />
        </div>
      </SubSection>

      {/* CC: Coordination of Care */}
      <SubSection title="CC: Coordination of Care" color="#2c3e50">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <div className="input-group">
            <label>Team Members Communicated With</label>
            <textarea value={i.cc_teamMembers || ""} onChange={e => update("cc_teamMembers", e.target.value)} placeholder="e.g. MD, SLP, OT, SW, nursing..." style={{ minHeight: "70px" }} />
          </div>
          <div className="input-group">
            <label>Referrals Made</label>
            <textarea value={i.cc_referrals || ""} onChange={e => update("cc_referrals", e.target.value)} placeholder="e.g. GI consult, WIC referral, food pantry..." style={{ minHeight: "70px" }} />
          </div>
          <div className="input-group">
            <label>Discharge Nutrition Recommendations</label>
            <textarea value={i.cc_dischargeRecommendations || ""} onChange={e => update("cc_dischargeRecommendations", e.target.value)} placeholder="Discharge diet, supplements, follow-up needs..." style={{ minHeight: "70px" }} />
          </div>
          <div className="input-group">
            <label>Follow-Up Plan</label>
            <textarea value={i.cc_followUpPlan || ""} onChange={e => update("cc_followUpPlan", e.target.value)} placeholder="When and with whom to follow up..." style={{ minHeight: "70px" }} />
          </div>
        </div>
      </SubSection>

      {/* Goals */}
      <div className="card" style={{ marginBottom: "1rem" }}>
        <SectionHeader title="Intervention Goals" color="#27ae60" />
        <div className="input-group">
          <label>SMART Goals</label>
          <textarea 
            value={i.goalStatement || ""} 
            onChange={e => update("goalStatement", e.target.value)} 
            placeholder="Consolidate SMART goals here (Statement, Timeframe, Measurable outcomes)..." 
            style={{ minHeight: "120px" }} 
          />
        </div>
      </div>

      {/* Additional notes */}
      <div className="card">
        <div className="input-group">
          <label>Intervention Notes</label>
          <textarea value={i.interventionNotes || ""} onChange={e => update("interventionNotes", e.target.value)} placeholder="Any additional narrative or clinical context..." style={{ minHeight: "80px" }} />
        </div>
      </div>
    </div>
  );
}