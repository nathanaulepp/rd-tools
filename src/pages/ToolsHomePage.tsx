// src/pages/ToolsHomePage.tsx
// Tools hub — card grid that navigates into individual tools.
// Manages its own internal view state; no changes needed to RouteRenderer.

import React, { useState } from "react";
import { useEscapeBackout } from "../shared/utils/ShortcutContext";
import MercuryCalculator from "../features/tools/MercuryCalculator";

// ─── Tool Registry ────────────────────────────────────────────────────────────
// Add new tools here — everything else is automatic.

interface ToolDefinition {
  id: string;
  title: string;
  description: string;
  icon: string;
  component: React.ReactNode;
  tags?: string[];
}

const TOOLS: ToolDefinition[] = [
  {
    id: "mercury",
    title: "Mercury Exposure Calculator",
    description:
      "Estimate dietary methylmercury intake from fish and shellfish consumption against EPA reference dose limits. Supports multi-fish comparisons and population-specific guidance.",
    icon: "🐟",
    tags: ["Dietary", "Safety", "FDA"],
    component: <MercuryCalculator />,
  },
  // ── Add future tools here ──────────────────────────────────────────────────
  // {
  //   id: "mifflin",
  //   title: "Mifflin-St Jeor REE",
  //   description: "Standalone resting energy expenditure calculator.",
  //   icon: "🔥",
  //   tags: ["Energy", "Adults"],
  //   component: <MifflinCalculator />,
  // },
];

// ─── Tool Card ────────────────────────────────────────────────────────────────

interface ToolCardProps {
  tool: ToolDefinition;
  onClick: () => void;
}

function ToolCard({ tool, onClick }: ToolCardProps) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: "0.6rem",
        padding: "1.25rem",
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: "12px",
        cursor: "pointer",
        textAlign: "left",
        transition: "all 0.2s",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.1)";
        e.currentTarget.style.borderColor = "#3498db";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)";
        e.currentTarget.style.borderColor = "#e2e8f0";
      }}
    >
      <span style={{ fontSize: "2rem", lineHeight: 1 }}>{tool.icon}</span>
      <div>
        <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#1e293b", marginBottom: "4px" }}>
          {tool.title}
        </div>
        <div style={{ fontSize: "0.8rem", color: "#64748b", lineHeight: 1.5 }}>
          {tool.description}
        </div>
      </div>
      {tool.tags && (
        <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", marginTop: "auto" }}>
          {tool.tags.map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: "0.62rem",
                fontWeight: 700,
                padding: "2px 7px",
                borderRadius: "8px",
                background: "#f1f5f9",
                color: "#64748b",
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface ToolsHomePageProps {
  handleExitToStart: () => void;
}

export default function ToolsHomePage({ handleExitToStart }: ToolsHomePageProps) {
  const [activeTool, setActiveTool] = useState<ToolDefinition | null>(null);

  // Escape: if inside a tool, go back to hub; otherwise exit to start
  useEscapeBackout(() => {
    if (activeTool) setActiveTool(null);
    else handleExitToStart();
  });

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-color, #f4f7f6)" }}>
      {/* Top bar */}
      <div
        style={{
          background: "#fff",
          borderBottom: "1px solid var(--border, #e2e8f0)",
          padding: "0.75rem 1.5rem",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
        }}
      >
        {activeTool ? (
          <>
            <button
              onClick={() => setActiveTool(null)}
              style={{
                background: "none",
                border: "none",
                color: "#3498db",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: "0.85rem",
                padding: 0,
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              ← Tools
            </button>
            <span style={{ color: "#cbd5e1" }}>|</span>
            <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#1e293b" }}>
              {activeTool.icon} {activeTool.title}
            </span>
          </>
        ) : (
          <>
            <button
              onClick={handleExitToStart}
              style={{
                background: "none",
                border: "none",
                color: "#e74c3c",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: "0.85rem",
                padding: 0,
              }}
            >
              ← Back to Home
            </button>
            <span style={{ color: "#cbd5e1" }}>|</span>
            <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#1e293b" }}>
              Dietitian Tools & Calculators
            </span>
          </>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: "1.5rem", maxWidth: activeTool ? "none" : "900px" }}>
        {activeTool ? (
          // ── Tool view ──────────────────────────────────────────────────────
          activeTool.component
        ) : (
          // ── Hub grid ───────────────────────────────────────────────────────
          <>
            <p style={{ margin: "0 0 1.25rem", fontSize: "0.88rem", color: "#64748b" }}>
              {TOOLS.length} tool{TOOLS.length !== 1 ? "s" : ""} available — select one to open it.
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                gap: "1rem",
              }}
            >
              {TOOLS.map((tool) => (
                <ToolCard
                  key={tool.id}
                  tool={tool}
                  onClick={() => setActiveTool(tool)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}