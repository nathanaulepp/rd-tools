import React, { useState, useMemo } from "react";

// Standardizing the Clinical Guidelines Payload Structure
interface ADIMESubsection {
  title: string;
  items: string[];
} 

export default function ReferenceLibrary() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>("MNT-REN");
  const [activeConditionId, setActiveConditionId] = useState<string | null>("ckd-non-dialysis");
  const [activeNcpTab, setActiveNcpTab] = useState<"A" | "D" | "I" | "M">("A");

  // Filter clinical guidelines layout instantly via search bar query mapping
  const filteredLibrary = useMemo(() => {
    if (!searchQuery) return CLINICAL_LIBRARY_DATA;
    return CLINICAL_LIBRARY_DATA.map(field => {
      const matchingConditions = field.conditions.filter(c =>
        c.conditionName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        field.fieldName.toLowerCase().includes(searchQuery.toLowerCase())
      );
      return { ...field, conditions: matchingConditions };
    }).filter(field => field.conditions.length > 0);
  }, [searchQuery]);

  const activeField = CLINICAL_LIBRARY_DATA.find(f => f.id === selectedFieldId);
  const activeCondition = activeField?.conditions.find(c => c.id === activeConditionId);

  return (
    <div className="reference-library-container" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 120px)" }}>
      {/* Search Header Bar Component */}
      <div style={{ marginBottom: "1rem" }}>
        <div className="search-bar-container" style={{ maxWidth: "100%" }}>
          <span className="search-icon">🔍</span>
          <input 
            type="text" 
            className="search-bar" 
            placeholder="Search conditions, clinical fields, or guidelines (e.g., CKD, ASPEN)..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Split Pane Interface Architecture */}
      <div className="split-pane" style={{ flex: 1, height: "100%", overflow: "hidden" }}>
        
        {/* Navigation Panel Sub-Tree (Left) */}
        <div className="pane-side" style={{ flex: "0 0 320px", overflowY: "auto", padding: "1rem" }}>
          <h4 style={{ margin: "0 0 1rem 0", color: "var(--secondary)", textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.05em" }}>
            Clinical Fields & Guidelines
          </h4>
          
          {filteredLibrary.map(field => (
            <div key={field.id} style={{ marginBottom: "1.25rem" }}>
              <div 
                onClick={() => {
                  setSelectedFieldId(field.id);
                  if (field.conditions.length > 0) {
                    setActiveConditionId(field.conditions[0].id);
                  }
                }}
                style={{
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  padding: "6px 8px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  borderRadius: "4px",
                  background: selectedFieldId === field.id ? "var(--border)" : "transparent",
                  color: "var(--primary)"
                }}
              >
                <span>{field.icon}</span> {field.fieldName}
              </div>

              {/* Nested Conditions List */}
              <div style={{ marginLeft: "1.5rem", borderLeft: "1px solid var(--border)", paddingLeft: "0.5rem", marginTop: "0.25rem" }}>
                {field.conditions.map(condition => (
                  <div
                    key={condition.id}
                    onClick={() => {
                      setSelectedFieldId(field.id);
                      setActiveConditionId(condition.id);
                    }}
                    style={{
                      padding: "6px 10px",
                      fontSize: "0.85rem",
                      cursor: "pointer",
                      borderRadius: "4px",
                      marginTop: "2px",
                      fontWeight: activeConditionId === condition.id ? 600 : "normal",
                      background: activeConditionId === condition.id ? "var(--accent)" : "transparent",
                      color: activeConditionId === condition.id ? "var(--white)" : "var(--text-main)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between"
                    }}
                  >
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {condition.conditionName}
                    </span>
                    {condition.isCustomExtension && (
                      <span style={{ 
                        fontSize: "0.65rem", 
                        background: activeConditionId === condition.id ? "rgba(255,255,255,0.2)" : "var(--warning-bg)",
                        color: activeConditionId === condition.id ? "var(--white)" : "var(--warning-text)",
                        padding: "1px 4px",
                        borderRadius: "4px",
                        marginLeft: "4px",
                        fontWeight: "bold"
                      }}>
                        EXT
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Clinical Workspace Payload View Area (Right) */}
        <div className="pane-side" style={{ flex: 1, overflowY: "auto", padding: "1.5rem", background: "var(--white)" }}>
          {activeCondition ? (
            <div>
              {/* Header Context Matrix Panel */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid var(--bg-color)", paddingBottom: "1rem", marginBottom: "1rem" }}>
                <div>
                  <h2 style={{ margin: "0 0 0.5rem 0", color: "var(--primary)" }}>{activeCondition.conditionName}</h2>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <span className="chip active">{activeCondition.source}</span>
                    {activeCondition.evidenceGrade && (
                      <span className="chip" style={{ background: "#edf2f7", color: "var(--text-main)" }}>
                        {activeCondition.evidenceGrade}
                      </span>
                    )}
                    <span className="chip" style={{ background: "#edf2f7", color: "var(--text-muted)" }}>
                      Updated: {activeCondition.lastUpdatedYear}
                    </span>
                  </div>
                </div>
              </div>

              {/* Standardized NCP Bucket Tab Selector UI Component */}
              <div className="chip-group" style={{ marginBottom: "1.5rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.75rem" }}>
                <button 
                  className={`chip ${activeNcpTab === "A" ? "active" : ""}`}
                  onClick={() => setActiveNcpTab("A")}
                >
                  [A] Nutrition Assessment
                </button>
                <button 
                  className={`chip ${activeNcpTab === "D" ? "active-danger" : ""}`}
                  style={{ color: activeNcpTab === "D" ? "var(--white)" : "var(--danger)" }}
                  onClick={() => setActiveNcpTab("D")}
                >
                  [D] Nutrition Diagnosis
                </button>
                <button 
                  className={`chip ${activeNcpTab === "I" ? "active" : ""}`}
                  style={{ background: activeNcpTab === "I" ? "var(--success)" : "", borderColor: activeNcpTab === "I" ? "var(--success)" : "" }}
                  onClick={() => setActiveNcpTab("I")}
                >
                  [I] Nutrition Intervention
                </button>
                <button 
                  className={`chip ${activeNcpTab === "M" ? "active-warning" : ""}`}
                  onClick={() => setActiveNcpTab("M")}
                >
                  [M/E] Monitoring & Evaluation
                </button>
              </div>

              {/* Tab Display Modules */}
              <div className="card" style={{ boxShadow: "none", background: "var(--bg-color)" }}>
                
                {/* ASSESSMENT TAB */}
                {activeNcpTab === "A" && (
                  <div>
                    <h3 style={{ margin: "0 0 1rem 0", color: "var(--primary)", fontSize: "1.1rem" }}>Standardized Indicators Matrix</h3>
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                      {[
                        { label: "Client History / Medical Profile", items: activeCondition.assessment.history },
                        { label: "Anthropometric Markers", items: activeCondition.assessment.anthropometrics },
                        { label: "Biochemical Parameters & Tests", items: activeCondition.assessment.biochemical },
                        { label: "Nutrition-Focused Physical Findings (NFPE)", items: activeCondition.assessment.nfpe }
                      ].map((sub, idx) => (
                        <div key={idx} style={{ background: "var(--white)", padding: "1rem", borderRadius: "6px", border: "1px solid var(--border)" }}>
                          <strong style={{ color: "var(--secondary)", fontSize: "0.85rem", display: "block", marginBottom: "0.5rem" }}>{sub.label}</strong>
                          {sub.items.length > 0 ? (
                            <ul style={{ margin: 0, paddingLeft: "1.2rem", fontSize: "0.9rem", lineHeight: "1.4" }}>
                              {sub.items.map((item, i) => <li key={i} style={{ marginBottom: "4px" }}>{item}</li>)}
                            </ul>
                            ) : (
                            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontStyle: "italic" }}>No specific indicators prioritized.</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* DIAGNOSIS TAB */}
                {activeNcpTab === "D" && (
                  <div>
                    <h3 style={{ margin: "0 0 1rem 0", color: "var(--primary)", fontSize: "1.1rem" }}>Common PES Diagnostics Mapping</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      {activeCondition.diagnosis.map((dx, i) => (
                        <div key={i} style={{ background: "var(--white)", padding: "0.75rem 1rem", borderRadius: "6px", borderLeft: "4px solid var(--danger)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", borderRight: "1px solid var(--border)", fontSize: "0.9rem" }}>
                          {dx}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* INTERVENTION TAB */}
                {activeNcpTab === "I" && (
                  <div>
                    <h3 style={{ margin: "0 0 1rem 0", color: "var(--primary)", fontSize: "1.1rem" }}>Prescription & Target Protocols</h3>
                    
                    <div style={{ background: "var(--white)", padding: "1.25rem", borderRadius: "6px", borderLeft: "4px solid var(--success)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", borderRight: "1px solid var(--border)", marginBottom: "1rem" }}>
                      <strong style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.25rem" }}>Nutrition Prescription</strong>
                      <p style={{ margin: 0, fontSize: "1rem", fontWeight: "600", color: "var(--primary)", lineHeight: "1.4" }}>{activeCondition.intervention.prescription}</p>
                    </div>

                    <div style={{ background: "var(--white)", padding: "1rem", borderRadius: "6px", border: "1px solid var(--border)" }}>
                      <strong style={{ display: "block", fontSize: "0.85rem", color: "var(--secondary)", marginBottom: "0.5rem" }}>Strategic Goals</strong>
                      <ul style={{ margin: 0, paddingLeft: "1.2rem", fontSize: "0.9rem", lineHeight: "1.4" }}>
                        {activeCondition.intervention.goals.map((goal, i) => <li key={i} style={{ marginBottom: "4px" }}>{goal}</li>)}
                      </ul>
                    </div>
                  </div>
                )}

                {/* MONITORING TAB */}
                {activeNcpTab === "M" && (
                  <div>
                    <h3 style={{ margin: "0 0 1rem 0", color: "var(--primary)", fontSize: "1.1rem" }}>Monitoring and Evaluation Parameters</h3>
                    <div style={{ background: "var(--white)", padding: "1rem", borderRadius: "6px", border: "1px solid var(--border)" }}>
                      <ul style={{ margin: 0, paddingLeft: "1.2rem", fontSize: "0.9rem", lineHeight: "1.4" }}>
                        {activeCondition.monitoringEvaluation.map((me, i) => <li key={i} style={{ marginBottom: "4px" }}>{me}</li>)}
                      </ul>
                    </div>
                  </div>
                )}

              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "3rem 0", color: "var(--text-muted)" }}>
              Select a clinical practice guideline to view its parameters matrix.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}