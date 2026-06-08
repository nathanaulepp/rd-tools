// src/features/assessment/assess-refeeding/CriterionCard.tsx
// Shared accordion-style card wrapper for each refeeding criterion.
// Displays criterion number, label, computed risk badge, and optional override UI.

import React, { useState } from "react";
import type { RiskLevel } from "../../../types/refeedingScreen";
import { riskColor, riskLabel } from "../../../shared/utils/refeedingScreenLogic";

interface Props {
  number: number;
  label: string;
  computedRisk: RiskLevel;
  children: React.ReactNode;
  /** Show an override toggle? (false for criteria that are always clinical judgment) */
  override?: boolean;
  manualRisk?: RiskLevel;
  onToggleOverride?: (v: boolean) => void;
  onManualRiskChange?: (v: RiskLevel) => void;
  /** "auto" | "clinical_judgment" | "unavailable" */
  sourceTag?: string;
  /** Prevent collapsing (used for the result card) */
  alwaysOpen?: boolean;
}

export function CriterionCard({
  number,
  label,
  computedRisk,
  children,
  override = false,
  manualRisk = "none",
  onToggleOverride,
  onManualRiskChange,
  sourceTag = "clinical_judgment",
  alwaysOpen = false,
}: Props) {
  const [expanded, setExpanded] = useState(true);
  const color = riskColor(computedRisk);
  const isNone = computedRisk === "none";

  const sourceColors: Record<string, string> = {
    auto: "#3498db",
    clinical_judgment: "#9b59b6",
    unavailable: "#a0aec0",
  };
  const sourceLabel: Record<string, string> = {
    auto: "Auto",
    clinical_judgment: "Clinical Judgment",
    unavailable: "Data Unavailable",
  };

  return (
    <div
      className="card"
      style={{
        padding: 0,
        borderLeft: `3px solid ${color}`,
        overflow: "hidden",
      }}
    >
      {/* Header row */}
      <div
        onClick={() => !alwaysOpen && setExpanded((e) => !e)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.45rem 0.75rem",
          cursor: alwaysOpen ? "default" : "pointer",
          userSelect: "none",
          background: isNone ? "transparent" : `${color}08`,
          gap: "0.5rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: 0 }}>
          {/* Number badge */}
          <span
            style={{
              background: color,
              color: "#fff",
              borderRadius: "50%",
              width: "20px",
              height: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.68rem",
              fontWeight: 800,
              flexShrink: 0,
            }}
          >
            {number}
          </span>
          <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--primary)" }}>
            {label}
          </span>
          {/* Source tag */}
          <span
            style={{
              fontSize: "0.6rem",
              fontWeight: 700,
              color: sourceColors[sourceTag] ?? "#718096",
              border: `1px solid ${sourceColors[sourceTag] ?? "#718096"}`,
              borderRadius: "10px",
              padding: "1px 7px",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            {sourceLabel[sourceTag] ?? sourceTag}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
          {/* Risk pill */}
          <span
            style={{
              fontSize: "0.72rem",
              fontWeight: 700,
              color: isNone ? "#27ae60" : color,
              background: isNone ? "#27ae6018" : `${color}18`,
              border: `1px solid ${isNone ? "#27ae60" : color}`,
              borderRadius: "10px",
              padding: "2px 10px",
            }}
          >
            {isNone ? "Not Met" : riskLabel(computedRisk)}
          </span>
          {!alwaysOpen && (
            <span style={{ fontSize: "0.65rem", color: "#a0aec0" }}>
              {expanded ? "▲" : "▼"}
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      {(expanded || alwaysOpen) && (
        <div style={{ padding: "0.6rem 0.85rem", borderTop: "1px solid var(--border)" }}>
          {children}

          {/* Override controls */}
          {onToggleOverride && (
            <div
              style={{
                marginTop: "0.65rem",
                paddingTop: "0.5rem",
                borderTop: "1px dashed var(--border)",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              <label
                style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer", fontSize: "0.72rem", color: "#718096", fontWeight: 600 }}
              >
                <input
                  type="checkbox"
                  checked={override}
                  onChange={(e) => onToggleOverride(e.target.checked)}
                  style={{ width: "13px", height: "13px", cursor: "pointer" }}
                />
                Override auto-result
              </label>

              {override && onManualRiskChange && (
                <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                  <span style={{ fontSize: "0.7rem", color: "#718096" }}>Set to:</span>
                  {(["none", "moderate", "significant"] as RiskLevel[]).map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => onManualRiskChange(lvl)}
                      style={{
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        padding: "2px 10px",
                        borderRadius: "10px",
                        border: `1.5px solid ${riskColor(lvl)}`,
                        background: manualRisk === lvl ? riskColor(lvl) : "transparent",
                        color: manualRisk === lvl ? "#fff" : riskColor(lvl),
                        cursor: "pointer",
                      }}
                    >
                      {lvl === "none" ? "Not Met" : lvl === "moderate" ? "Moderate" : "Significant"}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}