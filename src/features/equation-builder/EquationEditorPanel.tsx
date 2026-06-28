import React, { useState, useEffect, useRef } from "react";
import { useEquationEngineStore } from "../../stores/useEquationEngineStore";
import { validateExpression } from "../../shared/utils/equation-engine/mathResolver";
import type { CustomEquation } from "../../types/equationEngine";
import VariableCatalogBrowser from "./VariableCatalogBrowser";
import EquationNoteEditor from "./EquationNoteEditor";

interface EquationCardProps {
  equation: CustomEquation;
}

function EquationCard({ equation }: EquationCardProps) {
  const [nutrientType, setNutrientType] = useState(() => {
    const isPreset = ["energy", "protein", "fluid", "carbohydrate", "fat"].includes(equation.nutrient);
    return isPreset ? equation.nutrient : "custom";
  });
  const [customNutrientName, setCustomNutrientName] = useState(() => {
    const isPreset = ["energy", "protein", "fluid", "carbohydrate", "fat"].includes(equation.nutrient);
    return isPreset ? "" : equation.nutrient;
  });

  const [displayLabel, setDisplayLabel] = useState(equation.displayLabel);
  const [unit, setUnit] = useState(equation.unit);
  const [expression, setExpression] = useState(equation.expression);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [browserOpen, setBrowserOpen] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Debounced syntax validation
  useEffect(() => {
    const timer = setTimeout(() => {
      const error = validateExpression(expression);
      setValidationError(error);
    }, 300);
    return () => clearTimeout(timer);
  }, [expression]);

  const handleBlur = async (field: keyof CustomEquation, value: string) => {
    if ((equation as any)[field] === value) return;
    await useEquationEngineStore.getState().updateEquation(equation.id, { [field]: value });
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  };

  const handleNutrientTypeChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setNutrientType(val);
    if (val !== "custom") {
      await useEquationEngineStore.getState().updateEquation(equation.id, { nutrient: val });
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1500);
    } else {
      const name = customNutrientName.trim() || "custom_nutrient";
      await useEquationEngineStore.getState().updateEquation(equation.id, { nutrient: name });
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1500);
    }
  };

  const handleDelete = async () => {
    const confirm = window.confirm(`Delete equation "${displayLabel}"?`);
    if (confirm) {
      await useEquationEngineStore.getState().deleteEquation(equation.id);
    }
  };

  const inputStyle: React.CSSProperties = {
    padding: "6px 8px",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    fontSize: "0.83rem",
    width: "100%",
    boxSizing: "border-box",
    background: "#fff",
    color: "#334155",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "0.68rem",
    fontWeight: 700,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: "4px",
    display: "block",
  };

  return (
    <div style={{
      background: "#fff",
      border: "1px solid #e2e8f0",
      borderRadius: "10px",
      padding: "1rem",
      position: "relative",
      boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.02)",
      display: "flex",
      flexDirection: "column",
      gap: "0.75rem",
    }}>
      {/* Delete button */}
      <button
        onClick={handleDelete}
        title="Delete Equation"
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          background: "none",
          border: "none",
          color: "#94a3b8",
          cursor: "pointer",
          fontSize: "0.85rem",
          padding: "4px",
          borderRadius: "4px",
        }}
        onMouseOver={e => e.currentTarget.style.color = "#ef4444"}
        onMouseOut={e => e.currentTarget.style.color = "#94a3b8"}
      >
        ✕
      </button>

      {/* Grid: Nutrient & Unit */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
        <div>
          <label style={labelStyle}>Nutrient</label>
          <div style={{ display: "flex", gap: "4px" }}>
            <select
              value={nutrientType}
              onChange={handleNutrientTypeChange}
              style={inputStyle}
            >
              <option value="energy">Energy</option>
              <option value="protein">Protein</option>
              <option value="fluid">Fluid</option>
              <option value="carbohydrate">Carbohydrate</option>
              <option value="fat">Fat</option>
              <option value="custom">Custom...</option>
            </select>
            {nutrientType === "custom" && (
              <input
                type="text"
                value={customNutrientName}
                onChange={e => setCustomNutrientName(e.target.value)}
                onBlur={() => handleBlur("nutrient", customNutrientName.trim() || "custom_nutrient")}
                placeholder="Nutrient code..."
                style={{ ...inputStyle, width: "120px" }}
              />
            )}
          </div>
        </div>

        <div>
          <label style={labelStyle}>Unit</label>
          <input
            type="text"
            value={unit}
            onChange={e => setUnit(e.target.value)}
            onBlur={() => handleBlur("unit", unit.trim())}
            placeholder="e.g. kcal/day, g/day"
            style={inputStyle}
          />
        </div>
      </div>

      {/* Display Label */}
      <div>
        <label style={labelStyle}>Display Label</label>
        <input
          type="text"
          value={displayLabel}
          onChange={e => setDisplayLabel(e.target.value)}
          onBlur={() => handleBlur("displayLabel", displayLabel.trim())}
          placeholder="e.g. Energy — Lower Bound"
          style={inputStyle}
        />
      </div>

      {/* Expression Area */}
      <div>
        <label style={labelStyle}>Expression</label>
        <textarea
          ref={textareaRef}
          value={expression}
          onChange={e => setExpression(e.target.value)}
          onBlur={() => handleBlur("expression", expression.trim())}
          placeholder="e.g. weightKg * 30"
          rows={3}
          style={{
            ...inputStyle,
            fontFamily: "monospace",
            fontSize: "0.85rem",
            resize: "vertical",
          }}
        />
      </div>

      {/* Status Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          {validationError ? (
            <span style={{ fontSize: "0.75rem", color: "#ef4444", fontWeight: 500 }}>
              ⚠ {validationError}
            </span>
          ) : (
            <span style={{ fontSize: "0.75rem", color: "#22c55e", fontWeight: 500 }}>
              ✓ Valid expression
            </span>
          )}
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {/* Saved flash indicator */}
          {savedFlash && (
            <span style={{ fontSize: "0.7rem", color: "#22c55e", fontWeight: 700, animation: "fadeInOut 1.5s" }}>
              Saved
            </span>
          )}
          
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setBrowserOpen(b => !b)}
              style={{
                background: "#f1f5f9",
                border: "1px solid #cbd5e1",
                borderRadius: "6px",
                padding: "4px 8px",
                fontSize: "0.72rem",
                fontWeight: 700,
                color: "#475569",
                cursor: "pointer",
              }}
              onMouseOver={e => e.currentTarget.style.background = "#e2e8f0"}
              onMouseOut={e => e.currentTarget.style.background = "#f1f5f9"}
            >
              Variables
            </button>
            {browserOpen && (
              <VariableCatalogBrowser
                isOpen={browserOpen}
                onClose={() => setBrowserOpen(false)}
                onInsert={(slug) => {
                  const ta = textareaRef.current;
                  if (!ta) return;
                  const start = ta.selectionStart ?? expression.length;
                  const end = ta.selectionEnd ?? expression.length;
                  const newVal = expression.slice(0, start) + slug + expression.slice(end);
                  setExpression(newVal);
                  setBrowserOpen(false);
                  
                  // Focus back to textarea after insert
                  setTimeout(() => {
                    ta.focus();
                    ta.setSelectionRange(start + slug.length, start + slug.length);
                  }, 0);
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Equation-Level Guidance Notes */}
      <div style={{ marginTop: "0.5rem", borderTop: "1px solid #f1f5f9", paddingTop: "0.75rem" }}>
        <EquationNoteEditor
          equationId={equation.id}
          notes={equation.notes ?? []}
        />
      </div>
    </div>
  );
}

export default function EquationEditorPanel() {
  const conditions = useEquationEngineStore(s => s.conditions);
  const selectedConditionId = useEquationEngineStore(s => s.selectedConditionId);

  const selectedCondition = conditions.find(c => c.id === selectedConditionId) ?? null;
  const isLeaf = selectedCondition
    ? !conditions.some(c => c.parentId === selectedCondition.id)
    : false;

  const handleAddEquation = async () => {
    if (!selectedConditionId) return;
    await useEquationEngineStore.getState().addEquation(
      selectedConditionId,
      "energy",
      "New Equation",
      "",
      "kcal/day"
    );
  };

  if (!selectedCondition) {
    return (
      <div style={{
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#94a3b8",
        fontSize: "0.85rem",
        textAlign: "center"
      }}>
        Select a leaf condition from the tree to edit its equations.
      </div>
    );
  }

  if (!isLeaf) {
    return (
      <div style={{
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#94a3b8",
        fontSize: "0.85rem",
        textAlign: "center"
      }}>
        This is a branch node. Select a leaf node to edit equations.
      </div>
    );
  }

  const equations = selectedCondition.equations ?? [];

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100%",
      boxSizing: "border-box"
    }}>
      {/* Header info */}
      <div style={{ marginBottom: "1rem" }}>
        <h4 style={{ margin: 0, fontSize: "0.95rem", color: "#1e293b", fontWeight: 700 }}>
          {selectedCondition.name}
        </h4>
        <p style={{ margin: "2px 0 0 0", fontSize: "0.75rem", color: "#64748b" }}>
          {selectedCondition.description || "No description provided."}
        </p>
      </div>

      {/* Condition-Level Guidance Notes */}
      <div style={{ marginBottom: "1.25rem", background: "#f8fafc", padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
        <div style={{ fontSize: "0.68rem", fontWeight: 800, color: "#64748b", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Condition-Level Guidance Notes
        </div>
        <EquationNoteEditor
          conditionId={selectedCondition.id}
          notes={selectedCondition.notes ?? []}
        />
      </div>

      {/* Equations list */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        paddingRight: "4px",
        marginBottom: "1rem"
      }}>
        {equations.map(eq => (
          <EquationCard key={eq.id} equation={eq} />
        ))}

        {equations.length === 0 && (
          <div style={{
            padding: "2rem",
            border: "1px dashed #cbd5e1",
            borderRadius: "10px",
            textAlign: "center",
            color: "#94a3b8",
            fontSize: "0.8rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.75rem"
          }}>
            <span>No equations defined for this condition.</span>
            <button
              onClick={handleAddEquation}
              style={{
                padding: "6px 12px",
                background: "#0ea5e9",
                border: "none",
                borderRadius: "6px",
                color: "#fff",
                fontWeight: 700,
                fontSize: "0.78rem",
                cursor: "pointer",
              }}
              onMouseOver={e => e.currentTarget.style.background = "#0284c7"}
              onMouseOut={e => e.currentTarget.style.background = "#0ea5e9"}
            >
              Add First Equation
            </button>
          </div>
        )}
      </div>

      {/* Add equation button at bottom (if equations exist) */}
      {equations.length > 0 && (
        <button
          onClick={handleAddEquation}
          style={{
            width: "100%",
            padding: "8px 12px",
            background: "#0ea5e9",
            border: "none",
            borderRadius: "6px",
            color: "#fff",
            fontSize: "0.8rem",
            fontWeight: 700,
            cursor: "pointer",
            textAlign: "center",
            transition: "background 0.15s ease",
          }}
          onMouseOver={e => e.currentTarget.style.background = "#0284c7"}
          onMouseOut={e => e.currentTarget.style.background = "#0ea5e9"}
        >
          ＋ Add Equation
        </button>
      )}
    </div>
  );
}
