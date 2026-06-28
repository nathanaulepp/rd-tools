import React, { useEffect } from "react";
import { useEquationEngineStore } from "../../stores/useEquationEngineStore";
import { useEquationBuilder } from "./useEquationBuilder";
import ConditionTreePanel from "./ConditionTreePanel";
import EquationEditorPanel from "./EquationEditorPanel";
import LiveTestPanel from "./LiveTestPanel";

function QuickStat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <span style={{ fontSize: "0.6rem", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
      <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#475569" }}>{value}</span>
    </div>
  );
}

export default function EquationBuilderDomain() {
  const isLoaded = useEquationEngineStore(s => s.isLoaded);
  const conditions = useEquationEngineStore(s => s.conditions);
  const selectedConditionId = useEquationEngineStore(s => s.selectedConditionId);
  const selectedCondition = conditions.find(c => c.id === selectedConditionId) ?? null;
  const { toggleExpanded, isExpanded } = useEquationBuilder();

  useEffect(() => {
    const { isLoaded: storeIsLoaded, loadConditions } = useEquationEngineStore.getState();
    if (!storeIsLoaded) loadConditions();
  }, []);

  if (!isLoaded) {
    return (
      <div style={{ padding: "2rem", color: "#64748b", fontSize: "0.9rem" }}>
        Loading equation engine...
      </div>
    );
  }

  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    height: "100%",
  };

  const panelRowStyle: React.CSSProperties = {
    display: "flex",
    gap: "1rem",
    alignItems: "flex-start",
    flex: 1,
  };

  const panelStyle = (width?: string | number, flex?: number): React.CSSProperties => ({
    width,
    flex,
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "1.25rem",
    minHeight: "600px",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
  });

  const panelTitleStyle: React.CSSProperties = {
    fontSize: "0.85rem",
    fontWeight: 700,
    color: "#475569",
    marginBottom: "1rem",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  };

  return (
    <div style={containerStyle}>
      {/* Summary Bar */}
      <div style={{
        display: "flex",
        gap: "1.5rem",
        padding: "0.75rem 1.25rem",
        background: "#f8fafc",
        borderRadius: "10px",
        alignItems: "center",
        border: "1px solid #e2e8f0"
      }}>
        <QuickStat label="Total Conditions" value={conditions.length.toString()} />
        <div style={{ width: "1px", height: "20px", background: "#cbd5e1" }} />
        <QuickStat label="Root Nodes" value={conditions.filter(c => !c.parentId).length.toString()} />
        <div style={{ width: "1px", height: "20px", background: "#cbd5e1" }} />
        <QuickStat label="Active Selection" value={selectedCondition ? selectedCondition.name : "None selected"} />
      </div>

      {/* Panels Layout */}
      <div style={panelRowStyle}>
        {/* Left Panel: Tree */}
        <div style={panelStyle("300px")}>
          <div style={panelTitleStyle}>Condition Tree — 13b</div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ConditionTreePanel
              toggleExpanded={toggleExpanded}
              isExpanded={isExpanded}
            />
          </div>
        </div>

        {/* Center Panel: Editor */}
        <div style={panelStyle(undefined, 1)}>
          <div style={panelTitleStyle}>Equation Editor — 13c</div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <EquationEditorPanel />
          </div>
        </div>

        {/* Right Panel: Live Test */}
        <LiveTestPanel />
      </div>
    </div>
  );
}
