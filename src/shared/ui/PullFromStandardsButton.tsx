// src/shared/ui/PullFromStandardsButton.tsx
//
// A compact inline button that reads the current EvaluationSnapshot from
// useStandardsStore and calls the provided callback with parsed targets.
//
// Design intent: unobtrusive — sits in section sub-headers, visually
// secondary to the field labels. Disabled (with tooltip) when no snapshot
// is available so clinicians understand what they need to do first.

import React, { useState } from "react";
import { useStandardsStore } from "../../stores/useStandardsStore";
import { parseStandardsTargets, ParsedTargets } from "../utils/parseStandardsTargets";

interface PullFromStandardsButtonProps {
  /** Called with the parsed low/high values when pull succeeds */
  onPull: (targets: ParsedTargets) => void;
  /** Which field subsets to pull. Defaults to all three. */
  include?: Array<"energy" | "protein" | "fluid">;
  /** Extra inline styles on the outer wrapper */
  style?: React.CSSProperties;
}

export const PullFromStandardsButton: React.FC<PullFromStandardsButtonProps> = ({
  onPull,
  include = ["energy", "protein", "fluid"],
  style,
}) => {
  const snapshot = useStandardsStore((s) => s.standards.snapshot);
  const [flash, setFlash] = useState<"idle" | "success" | "warn">("idle");

  const hasSnapshot = !!snapshot && snapshot.results.length > 0;

  const handleClick = () => {
    if (!hasSnapshot || !snapshot) {
      setFlash("warn");
      setTimeout(() => setFlash("idle"), 1800);
      return;
    }

    const all = parseStandardsTargets(snapshot.results);

    // Zero out fields the caller didn't ask for
    const filtered: ParsedTargets = { ...all };
    if (!include.includes("energy"))  { filtered.kcalLow = "";    filtered.kcalHigh = "";    }
    if (!include.includes("protein")) { filtered.proteinLow = ""; filtered.proteinHigh = ""; }
    if (!include.includes("fluid"))   { filtered.fluidLow = "";   filtered.fluidHigh = "";   }

    onPull(filtered);
    setFlash("success");
    setTimeout(() => setFlash("idle"), 1800);
  };

  const baseColor  = "#3498db";
  const warnColor  = "#da7f2b";
  const doneColor  = "#27ae60";

  const color =
    flash === "success" ? doneColor :
    flash === "warn"    ? warnColor :
    baseColor;

  const label =
    flash === "success" ? "✓ Applied" :
    flash === "warn"    ? "No standards yet" :
    "↓ Pull from Standards";

  return (
    <div
      title={
        hasSnapshot
          ? `Apply calculated targets from the Comparative Standards domain${snapshot?.conditionKey ? ` (${snapshot.conditionKey})` : ""}`
          : "Run the Comparative Standards evaluation first to enable this."
      }
      style={{ display: "inline-flex", alignItems: "center", ...style }}
    >
      <button
        onClick={handleClick}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "5px",
          padding: "3px 10px",
          background: hasSnapshot ? `${color}12` : "#f1f5f9",
          border: `1px solid ${hasSnapshot ? color : "#cbd5e1"}`,
          borderRadius: "6px",
          color: hasSnapshot ? color : "#94a3b8",
          fontSize: "0.72rem",
          fontWeight: 700,
          cursor: hasSnapshot ? "pointer" : "not-allowed",
          transition: "all 0.18s",
          letterSpacing: "0.01em",
          whiteSpace: "nowrap",
          userSelect: "none",
        }}
        onMouseEnter={(e) => {
          if (hasSnapshot && flash === "idle") {
            (e.currentTarget as HTMLButtonElement).style.background = `${baseColor}22`;
          }
        }}
        onMouseLeave={(e) => {
          if (hasSnapshot && flash === "idle") {
            (e.currentTarget as HTMLButtonElement).style.background = `${baseColor}12`;
          }
        }}
      >
        {label}
      </button>
    </div>
  );
};