import React, { useState, useEffect, useMemo } from "react";
import { useEquationEngineStore } from "../../stores/useEquationEngineStore";
import { VARIABLE_CATALOG } from "../../shared/utils/equation-engine/variableCatalog";
import { evaluateExpression, extractReferencedVariables } from "../../shared/utils/equation-engine/mathResolver";
import type { PatientScope } from "../../types/equationEngine";

interface TestCase {
  id: string;
  name: string;
  conditionId: string;
  inputValues: Record<string, number | boolean | string | undefined>;
  savedAt: string;
}

export default function LiveTestPanel() {
  const conditions = useEquationEngineStore(s => s.conditions);
  const selectedConditionId = useEquationEngineStore(s => s.selectedConditionId);

  const selectedLeaf = useMemo(() => {
    return conditions.find(c => c.id === selectedConditionId) ?? null;
  }, [conditions, selectedConditionId]);

  const isLeaf = useMemo(() => {
    if (!selectedLeaf) return false;
    return !conditions.some(c => c.parentId === selectedLeaf.id);
  }, [conditions, selectedLeaf]);

  const [testValues, setTestValues] = useState<Record<string, number | boolean | string | undefined>>({});
  const [debouncedTestValues, setDebouncedTestValues] = useState<Record<string, number | boolean | string | undefined>>({});
  const [savedCases, setSavedCases] = useState<TestCase[]>([]);

  // Reset test values when selected condition changes
  useEffect(() => {
    setTestValues({});
    setDebouncedTestValues({});
  }, [selectedConditionId]);

  // Load test cases from localStorage
  useEffect(() => {
    const loadCases = () => {
      try {
        const raw = localStorage.getItem("eq_test_cases");
        if (raw) {
          setSavedCases(JSON.parse(raw));
        }
      } catch (e) {
        console.error("Failed to load test cases from localStorage", e);
      }
    };
    loadCases();

    // Listen to local changes
    window.addEventListener("storage", loadCases);
    return () => window.removeEventListener("storage", loadCases);
  }, []);

  // Debounce testValues state update by 200ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedTestValues(testValues);
    }, 200);
    return () => clearTimeout(handler);
  }, [testValues]);

  // Extract referenced variable slugs from all equations on the selected leaf
  const referencedSlugs = useMemo(() => {
    if (!selectedLeaf || !isLeaf) return [];
    const allExpressions = (selectedLeaf.equations ?? []).map(e => e.expression);
    return Array.from(new Set(
      allExpressions.flatMap(expr => extractReferencedVariables(expr))
    ));
  }, [selectedLeaf, isLeaf]);

  // Map slugs to variable catalog entries
  const variablesToRender = useMemo(() => {
    return referencedSlugs.map(slug => {
      const entry = VARIABLE_CATALOG.find(v => v.slug === slug);
      if (entry) return entry;
      return {
        slug,
        displayName: slug,
        domain: "Clinical Assessments" as const,
        dataType: "numeric" as const,
        unit: null,
        categoryOptions: null,
      };
    });
  }, [referencedSlugs]);

  // Filter saved test cases for the current leaf condition
  const currentConditionCases = useMemo(() => {
    if (!selectedLeaf) return [];
    return savedCases.filter(c => c.conditionId === selectedLeaf.id);
  }, [savedCases, selectedLeaf]);

  // Compute equation evaluation results dynamically
  const results = useMemo(() => {
    if (!selectedLeaf || !isLeaf) return [];
    const scope: PatientScope = { ...debouncedTestValues };
    return (selectedLeaf.equations ?? []).map(eq => {
      const { value, error } = evaluateExpression(eq.expression, scope);
      return {
        label: eq.displayLabel,
        nutrient: eq.nutrient,
        unit: eq.unit,
        value,
        error,
      };
    });
  }, [selectedLeaf, isLeaf, debouncedTestValues]);

  // Save the current inputs as a test case
  const handleSaveTestCase = () => {
    if (!selectedLeaf) return;
    const name = window.prompt("Enter a name for this test case:");
    if (!name || !name.trim()) return;

    const newCase: TestCase = {
      id: crypto.randomUUID(),
      name: name.trim(),
      conditionId: selectedLeaf.id,
      inputValues: { ...testValues },
      savedAt: new Date().toISOString(),
    };

    const updated = [...savedCases, newCase];
    setSavedCases(updated);
    localStorage.setItem("eq_test_cases", JSON.stringify(updated));
  };

  // Delete a test case
  const handleDeleteTestCase = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedCases.filter(c => c.id !== id);
    setSavedCases(updated);
    localStorage.setItem("eq_test_cases", JSON.stringify(updated));
  };

  // Style Tokens
  const panelStyle: React.CSSProperties = {
    width: "280px",
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "1rem",
    minHeight: "600px",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
    fontSize: "0.8rem",
    color: "#334155",
  };

  const headerStyle: React.CSSProperties = {
    fontSize: "0.7rem",
    fontWeight: 800,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: "1rem",
    borderBottom: "1px solid #f1f5f9",
    paddingBottom: "0.5rem",
  };

  const subHeaderStyle: React.CSSProperties = {
    fontSize: "0.75rem",
    fontWeight: 700,
    color: "#64748b",
    marginTop: "0.75rem",
    marginBottom: "0.5rem",
    textTransform: "uppercase",
    letterSpacing: "0.02em",
  };

  const emptyStateStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    color: "#94a3b8",
    textAlign: "center",
    padding: "1rem",
    fontStyle: "italic",
  };

  const chipContainerStyle: React.CSSProperties = {
    display: "flex",
    flexWrap: "wrap",
    gap: "4px",
    marginBottom: "0.75rem",
  };

  const chipStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    background: "#f1f5f9",
    color: "#475569",
    padding: "2px 8px",
    borderRadius: "9999px",
    cursor: "pointer",
    fontSize: "0.7rem",
    fontWeight: 500,
    border: "1px solid #e2e8f0",
  };

  const deleteBtnStyle: React.CSSProperties = {
    border: "none",
    background: "transparent",
    color: "#94a3b8",
    cursor: "pointer",
    padding: 0,
    fontWeight: "bold",
    fontSize: "0.75rem",
    lineHeight: 1,
  };

  const inputGroupStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    marginBottom: "0.75rem",
    gap: "3px",
  };

  const labelStyle: React.CSSProperties = {
    fontWeight: 600,
    color: "#475569",
    fontSize: "0.75rem",
  };

  const textInputStyle: React.CSSProperties = {
    width: "100%",
    padding: "4px 8px",
    borderRadius: "6px",
    border: "1px solid #cbd5e1",
    fontSize: "0.8rem",
    outline: "none",
    color: "#1e293b",
  };

  const selectStyle: React.CSSProperties = {
    width: "100%",
    padding: "4px 8px",
    borderRadius: "6px",
    border: "1px solid #cbd5e1",
    fontSize: "0.8rem",
    outline: "none",
    color: "#1e293b",
    background: "#fff",
  };

  const checkboxGroupStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginBottom: "0.75rem",
  };

  const btnStyle: React.CSSProperties = {
    width: "100%",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    padding: "6px 12px",
    fontSize: "0.75rem",
    fontWeight: 600,
    cursor: "pointer",
    textAlign: "center",
    marginTop: "1rem",
    transition: "background 0.2s",
  };

  const tableStyle: React.CSSProperties = {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "0.75rem",
    marginTop: "0.5rem",
  };

  const tdStyle: React.CSSProperties = {
    padding: "4px 0",
    borderBottom: "1px solid #f1f5f9",
  };

  if (!selectedLeaf || !isLeaf) {
    return (
      <div style={panelStyle}>
        <div style={headerStyle}>Live Test Panel</div>
        <div style={emptyStateStyle}>
          Select a leaf condition to test its equations.
        </div>
      </div>
    );
  }

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>Live Test Panel</div>

      {/* Saved Test Cases Section */}
      {currentConditionCases.length > 0 && (
        <>
          <div style={subHeaderStyle}>Saved Test Cases</div>
          <div style={chipContainerStyle}>
            {currentConditionCases.map(c => (
              <span
                key={c.id}
                style={chipStyle}
                onClick={() => setTestValues(c.inputValues)}
                title={`Saved: ${new Date(c.savedAt).toLocaleDateString()}`}
              >
                {c.name}
                <button
                  style={deleteBtnStyle}
                  onClick={(e) => handleDeleteTestCase(c.id, e)}
                  title="Delete case"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        </>
      )}

      {/* Test Inputs Section */}
      <div style={subHeaderStyle}>Test Inputs</div>
      <div style={{ flex: 1, overflowY: "auto", paddingRight: "4px" }}>
        {variablesToRender.length === 0 ? (
          <div style={{ color: "#94a3b8", fontStyle: "italic", marginBottom: "0.75rem" }}>
            No variables referenced in equations.
          </div>
        ) : (
          variablesToRender.map(v => {
            const currentVal = testValues[v.slug];

            if (v.dataType === "boolean") {
              return (
                <div key={v.slug} style={checkboxGroupStyle}>
                  <input
                    type="checkbox"
                    id={`test-input-${v.slug}`}
                    checked={currentVal === true}
                    onChange={e => setTestValues(prev => ({ ...prev, [v.slug]: e.target.checked }))}
                  />
                  <label htmlFor={`test-input-${v.slug}`} style={labelStyle}>
                    {v.displayName}
                  </label>
                </div>
              );
            }

            if (v.dataType === "categorical" && v.categoryOptions) {
              return (
                <div key={v.slug} style={inputGroupStyle}>
                  <label style={labelStyle}>{v.displayName}</label>
                  <select
                    style={selectStyle}
                    value={String(currentVal ?? "")}
                    onChange={e => setTestValues(prev => ({ ...prev, [v.slug]: e.target.value || undefined }))}
                  >
                    <option value="">Select option...</option>
                    {v.categoryOptions.map(opt => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              );
            }

            // Fallback & Numeric input
            return (
              <div key={v.slug} style={inputGroupStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <label style={labelStyle}>{v.displayName}</label>
                  {v.unit && (
                    <span style={{ fontSize: "0.65rem", color: "#94a3b8" }}>
                      ({v.unit})
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  style={textInputStyle}
                  value={currentVal === undefined ? "" : String(currentVal)}
                  placeholder={v.unit || ""}
                  onChange={e => {
                    const parsed = parseFloat(e.target.value);
                    setTestValues(prev => ({
                      ...prev,
                      [v.slug]: isNaN(parsed) ? undefined : parsed
                    }));
                  }}
                />
              </div>
            );
          })
        )}
      </div>

      {/* Results Section */}
      <div style={subHeaderStyle}>Results</div>
      <div style={{ minHeight: "120px", maxHeight: "200px", overflowY: "auto" }}>
        {results.length === 0 ? (
          <div style={{ color: "#94a3b8", fontStyle: "italic" }}>
            No equations configured.
          </div>
        ) : (
          <table style={tableStyle}>
            <tbody>
              {results.map((r, idx) => (
                <tr key={idx}>
                  <td style={{ ...tdStyle, color: "#64748b", fontWeight: 500, width: "60%" }}>
                    {r.label}
                  </td>
                  <td style={{ ...tdStyle, textAlign: "right", fontWeight: 700, color: r.error ? "#ef4444" : "#1e293b" }}>
                    {r.error ? (
                      <span title={r.error} style={{ cursor: "help", display: "inline-flex", alignItems: "center", gap: "2px" }}>
                        ⚠ Error
                      </span>
                    ) : (
                      `${r.value} ${r.unit || ""}`
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <button
        style={btnStyle}
        onClick={handleSaveTestCase}
        onMouseOver={(e) => (e.currentTarget.style.background = "#1d4ed8")}
        onMouseOut={(e) => (e.currentTarget.style.background = "#2563eb")}
      >
        Save Test Case
      </button>
    </div>
  );
}
