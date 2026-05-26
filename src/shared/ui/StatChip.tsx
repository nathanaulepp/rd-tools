// src/shared/ui/StatChip.tsx
import React from "react";

interface StatChipProps {
  label: string;
  value: string | number;
  unit: string;
  color?: string;
}

export const StatChip = ({ label, value, unit, color = "#3498db" }: StatChipProps) => {
  return (
    <div
      style={{
        background: `${color}12`,
        border: `1px solid ${color}40`,
        borderRadius: "8px",
        padding: "8px 14px",
        textAlign: "center",
        minWidth: "100px",
      }}
    >
      <div
        style={{
          fontSize: "0.7rem",
          color: "#718096",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: "1.1rem", fontWeight: 700, color, marginTop: "2px" }}>
        {value}
        <span style={{ fontSize: "0.7rem", marginLeft: "2px", fontWeight: 400 }}>{unit}</span>
      </div>
    </div>
  );
};
