// src/shared/ui/CollapseHeader.tsx
import React from "react";

interface CollapseHeaderProps {
  label: string;
  expanded: boolean;
  onToggle: () => void;
  accent?: string;
  badge?: string | null;
}

export const CollapseHeader = ({
  label,
  expanded,
  onToggle,
  accent = "#3498db",
  badge = null
}: CollapseHeaderProps) => {
  return (
    <div
      onClick={onToggle}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        cursor: "pointer",
        userSelect: "none",
        padding: "10px 14px",
        background: `${accent}08`,
        border: `1px solid ${accent}30`,
        borderRadius: expanded ? "8px 8px 0 0" : "8px",
        marginBottom: expanded ? 0 : "0.5rem",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontSize: "0.9rem", fontWeight: 600, color: accent }}>{label}</span>
        {badge && (
          <span
            style={{
              fontSize: "0.75rem",
              background: `${accent}20`,
              color: accent,
              borderRadius: "12px",
              padding: "2px 10px",
            }}
          >
            {badge}
          </span>
        )}
      </div>
      <span style={{ color: accent, fontSize: "0.75rem" }}>{expanded ? "▲" : "▼"}</span>
    </div>
  );
};
