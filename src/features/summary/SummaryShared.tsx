import React, { CSSProperties } from "react";

export const SummaryCard = ({ title, color = "#3498db", children }: { title: string, color?: string, children: React.ReactNode }) => (
  <section className="summary-card" style={{
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderTop: `4px solid ${color}`,
    borderRadius: "8px",
    marginBottom: "1rem",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
    overflow: "hidden"
  }}>
    <h3 style={{
      margin: 0,
      padding: "0.5rem 0.75rem",
      background: "#f8fafc",
      borderBottom: "1px solid #e2e8f0",
      fontSize: "0.65rem",
      fontWeight: 800,
      color: "#64748b",
      textTransform: "uppercase",
      letterSpacing: "0.05em"
    }}>
      {title}
    </h3>
    <div className="summary-card-content" style={{ padding: "0.75rem" }}>
      {children}
    </div>
  </section>
);

export const SummaryRow = ({ label, value, unit = "" }: { label: string, value: any, unit?: string }) => {
  if (!value || value === "" || value === "--") return null;
  return (
    <div style={{ display: "flex", marginBottom: "0.4rem", alignItems: "baseline" }}>
      <span style={{ 
        width: "180px", 
        fontSize: "0.65rem", 
        textTransform: "uppercase", 
        letterSpacing: "0.06em", 
        color: "#94a3b8",
        fontWeight: 600
      }}>{label}:</span>
      <span className="summary-value" style={{ 
        flex: 1, 
        fontSize: "0.88rem", 
        fontWeight: 500, 
        color: "#0f172a" 
      }}>{value} {unit}</span>
    </div>
  );
};
