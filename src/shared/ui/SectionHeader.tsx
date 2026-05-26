// src/shared/ui/SectionHeader.tsx
import React from "react";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  color?: string;
}

export const SectionHeader = ({ title, subtitle, color = "#3498db" }: SectionHeaderProps) => {
  return (
    <div style={{ borderLeft: `4px solid ${color}`, paddingLeft: "12px", marginBottom: "1.25rem" }}>
      <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--primary, #2c3e50)" }}>{title}</div>
      {subtitle && <div style={{ fontSize: "0.8rem", color: "#718096", marginTop: "2px" }}>{subtitle}</div>}
    </div>
  );
};
