// src/features/diagnosis/DiagnosisDomain.tsx
// Phase 7: Automated PES Builder with Auto-Suggest
//
// CHANGES from Phase 6:
//  - Replaced <select> for Problem with a searchable Combobox
//  - Etiology textarea now shows category-grouped suggestion chips from ETIOLOGY_MAP
//  - Signs & Symptoms surfaces contextual evidence chips built from anthro/dietary state
//  - etiologyData.ts must be placed alongside this file (or at the correct import path)

import { useState, useRef, useEffect, useMemo } from "react";
import { DomainHeader } from "../../shared/ui/DomainHeader";
import { SectionHeader } from "../../shared/ui/SectionHeader";
import { Field } from "../../shared/ui/Field";
import { formatAge } from "../../shared/utils/date";

// ── Import the generated dictionary ──────────────────────────────────────────
// Adjust the relative path to wherever you place etiologyData.ts in your project.
// Example: if it lives at src/shared/constants/etiologyData.ts, change the path below.
import { DIAGNOSIS_GROUPS, getAllEtiologiesForProblem } from "./etiologyData";

// ─── Contextual S-suggestion builder ─────────────────────────────────────────
// Reads live app state (anthro, dietary) to produce ready-made evidence strings.

function buildContextualSuggestions(
  problem: string,
  anthro: any,
  dietary: any,
  calculatedMetrics?: any
): string[] {
  const hints: string[] = [];
  if (!problem) return hints;

  const p = problem.toLowerCase();

  // Weight / anthropometric evidence
  if (anthro) {
    const wt = parseFloat(anthro.wt);
    const ubw = parseFloat(anthro.ubw);
    const wtUnit = anthro.wtUnit || "kg";
    if (wt > 0 && ubw > 0 && ubw > wt) {
      const loss = (ubw - wt).toFixed(1);
      const pct = (((ubw - wt) / ubw) * 100).toFixed(1);
      const timeStr = (calculatedMetrics?.ubwTimeframeDays !== undefined && calculatedMetrics?.ubwTimeframeDays !== null)
        ? `over ${formatAge(calculatedMetrics.ubwTimeframeDays)}`
        : "";
      hints.push(`Unintentional weight loss of ${loss} ${wtUnit} (${pct}%) ${timeStr}`.trim());
    }

    if (anthro.ht && wt > 0) {
      const htCm =
        anthro.htUnit === "in"
          ? parseFloat(anthro.ht) * 2.54
          : parseFloat(anthro.ht);
      const wtKg = wtUnit === "lbs" ? wt / 2.2046 : wt;
      if (htCm > 0) {
        const bmi = (wtKg / Math.pow(htCm / 100, 2)).toFixed(1);
        if ((p.includes("underweight") || p.includes("energy intake")) && parseFloat(bmi) < 18.5)
          hints.push(`BMI of ${bmi} kg/m² (underweight)`);
        if ((p.includes("overweight") || p.includes("obesity") || p.includes("excessive energy")) && parseFloat(bmi) >= 25)
          hints.push(`BMI of ${bmi} kg/m² (${parseFloat(bmi) >= 30 ? "obese" : "overweight"})`);
      }
    }
  }

  // Dietary / intake evidence
  if (dietary) {
    const kcal = parseFloat(dietary.oralCalories);
    const prot = parseFloat(dietary.oralProtein);

    if (kcal > 0 && (p.includes("energy") || p.includes("intake") || p.includes("malnutrition"))) {
      hints.push(`Estimated oral energy intake of ${Math.round(kcal)} kcal/day per 24-hour recall`);
    }
    if (prot > 0 && (p.includes("protein") || p.includes("malnutrition") || p.includes("sarcopenia") || p.includes("muscle"))) {
      hints.push(`Estimated protein intake of ${prot} g/day per 24-hour recall`);
    }
    if (dietary.fluidIntake && (p.includes("fluid") || p.includes("dehydrat"))) {
      hints.push(`Reported fluid intake: ${dietary.fluidIntake}`);
    }
    if (dietary.foodSecurity && (p.includes("food insecurity") || p.includes("access"))) {
      hints.push(`Food security concern: ${dietary.foodSecurity}`);
    }
    if (dietary.readiness && (p.includes("readiness") || p.includes("not ready") || p.includes("behavior"))) {
      hints.push(`Readiness to change rated ${dietary.readiness}/10 by patient`);
    }
  }

  return hints;
}

// ─── Combobox ─────────────────────────────────────────────────────────────────

interface ComboboxProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  options?: string[];
  groupedOptions?: { group: string; items: string[] }[];
}

function SearchableCombobox({ value, onChange, placeholder, options, groupedOptions }: ComboboxProps) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setQuery(value); }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredGrouped = useMemo(() => {
    if (!groupedOptions) return [];
    const q = query.toLowerCase();
    if (!q) return groupedOptions;
    return groupedOptions.map(g => ({
      ...g,
      items: g.items.filter(d => d.toLowerCase().includes(q)),
    })).filter(g => g.items.length > 0);
  }, [query, groupedOptions]);

  const filteredOptions = useMemo(() => {
    if (!options) return [];
    const q = query.toLowerCase();
    if (!q) return options;
    return options.filter(o => o.toLowerCase().includes(q));
  }, [query, options]);

  const handleSelect = (val: string) => {
    setQuery(val);
    onChange(val);
    setOpen(false);
  };

  const handleClear = () => {
    setQuery("");
    onChange("");
    setOpen(false);
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div style={{ display: "flex", gap: "4px" }}>
        <input
          type="text"
          value={query}
          onFocus={() => setOpen(true)}
          onChange={e => { setQuery(e.target.value); onChange(e.target.value); setOpen(true); }}
          placeholder={placeholder}
          style={{
            flex: 1,
            padding: "7px 10px",
            border: "1px solid #e2e8f0",
            borderRadius: "6px",
            fontSize: "0.88rem",
            fontFamily: "inherit",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
        {query && (
          <button
            onClick={handleClear}
            style={{ border: "none", background: "none", color: "#94a3b8", cursor: "pointer", fontSize: "1rem", padding: "0 6px" }}
            title="Clear"
          >
            ×
          </button>
        )}
      </div>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
          background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 300,
          maxHeight: "300px", overflowY: "auto",
        }}>
          {groupedOptions && filteredGrouped.map(g => (
            <div key={g.group}>
              <div style={{
                padding: "6px 12px", fontSize: "0.65rem", fontWeight: 800,
                color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em",
                borderBottom: "1px solid #f1f5f9", background: "#fafafa", position: "sticky", top: 0,
              }}>
                {g.group}
              </div>
              {g.items.map(item => (
                <button
                  key={item}
                  onClick={() => handleSelect(item)}
                  style={{
                    display: "block", width: "100%", textAlign: "left",
                    padding: "7px 14px", background: "none", border: "none",
                    fontSize: "0.84rem", cursor: "pointer", color: "#1e293b",
                    borderBottom: "1px solid #f8fafc",
                    fontWeight: item === value ? 700 : 400,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#f0f7ff")}
                  onMouseLeave={e => (e.currentTarget.style.background = "none")}
                >
                  {item}
                </button>
              ))}
            </div>
          ))}
          {options && filteredOptions.map(item => (
            <button
              key={item}
              onClick={() => handleSelect(item)}
              style={{
                display: "block", width: "100%", textAlign: "left",
                padding: "7px 14px", background: "none", border: "none",
                fontSize: "0.84rem", cursor: "pointer", color: "#1e293b",
                borderBottom: "1px solid #f8fafc",
                fontWeight: item === value ? 700 : 400,
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "#f0f7ff")}
              onMouseLeave={e => (e.currentTarget.style.background = "none")}
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Etiology Suggestion Chips ────────────────────────────────────────────────

interface EtiologySuggestionsProps {
  problem: string;
  currentEtiology: string;
  onAppend: (text: string) => void;
}

function EtiologySuggestions({ problem, currentEtiology, onAppend }: EtiologySuggestionsProps) {
  const etiologies = getAllEtiologiesForProblem(problem);
  if (etiologies.length === 0) return null;

  // Group by category
  const grouped: Record<string, string[]> = {};
  for (const e of etiologies) {
    if (!grouped[e.category]) grouped[e.category] = [];
    grouped[e.category].push(e.etiology);
  }

  const CAT_COLORS: Record<string, string> = {
    "Physiologic-Metabolic": "#3182ce",
    "Beliefs & Attitudes":   "#8e44ad",
    "Knowledge":             "#27ae60",
    "Behavior":              "#e67e22",
    "Treatment":             "#e74c3c",
    "Psychological":         "#d69e2e",
    "Cultural":              "#16a085",
    "Access":                "#718096",
    "Social-Personal":       "#b7791f",
    "Physical function":     "#2980b9",
  };

  const isAlreadyUsed = (etio: string) =>
    currentEtiology.toLowerCase().includes(etio.toLowerCase());

  return (
    <div style={{
      marginTop: "8px",
      background: "#f8fafc",
      border: "1px solid #e2e8f0",
      borderRadius: "8px",
      padding: "10px 12px",
    }}>
      <div style={{ fontSize: "0.68rem", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>
        Suggested Etiologies — click to select
      </div>
      {Object.entries(grouped).map(([cat, etiologies]) => {
        const color = CAT_COLORS[cat] || "#64748b";
        return (
          <div key={cat} style={{ marginBottom: "8px" }}>
            <div style={{
              fontSize: "0.62rem", fontWeight: 700, color, textTransform: "uppercase",
              letterSpacing: "0.05em", marginBottom: "4px",
            }}>
              {cat}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
              {etiologies.map(etio => {
                const used = isAlreadyUsed(etio);
                return (
                  <button
                    key={etio}
                    onClick={() => !used && onAppend(`${etio} (${cat})`)}
                    title={used ? "Already in etiology field" : `Select: "${etio}"`}
                    style={{
                      padding: "3px 9px",
                      borderRadius: "12px",
                      border: `1px solid ${color}40`,
                      background: used ? `${color}15` : `${color}08`,
                      color: used ? `${color}99` : color,
                      fontSize: "0.72rem",
                      fontWeight: 600,
                      cursor: used ? "default" : "pointer",
                      textDecoration: used ? "line-through" : "none",
                      opacity: used ? 0.6 : 1,
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={e => { if (!used) e.currentTarget.style.background = `${color}20`; }}
                    onMouseLeave={e => { if (!used) e.currentTarget.style.background = `${color}08`; }}
                  >
                    {etio}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}


// ─── Signs & Symptoms Suggestions ────────────────────────────────────────────

interface SSignsSuggestionsProps {
  problem: string;
  currentSigns: string;
  anthro: any;
  dietary: any;
  calculatedMetrics?: any;
  onAppend: (text: string) => void;
}

function SignsSuggestions({ problem, currentSigns, anthro, dietary, calculatedMetrics, onAppend }: SSignsSuggestionsProps) {
  const suggestions = useMemo(
    () => buildContextualSuggestions(problem, anthro, dietary, calculatedMetrics),
    [problem, anthro?.wt, anthro?.ubw, anthro?.ht, dietary?.oralCalories, dietary?.oralProtein, dietary?.readiness, calculatedMetrics?.ubwTimeframeDays]
  );

  if (suggestions.length === 0) return null;

  const isUsed = (s: string) => currentSigns.toLowerCase().includes(s.toLowerCase().slice(0, 20));

  return (
    <div style={{
      marginTop: "8px",
      background: "#f0fff4",
      border: "1px solid #9ae6b4",
      borderRadius: "8px",
      padding: "10px 12px",
    }}>
      <div style={{ fontSize: "0.68rem", fontWeight: 800, color: "#276749", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>
        ✦ Contextual Evidence — from your note data
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
        {suggestions.map((s, i) => {
          const used = isUsed(s);
          return (
            <button
              key={i}
              onClick={() => !used && onAppend(s)}
              title={used ? "Already inserted" : "Click to insert"}
              style={{
                padding: "4px 10px",
                borderRadius: "12px",
                border: "1px solid #9ae6b4",
                background: used ? "#c6f6d5" : "#fff",
                color: used ? "#22543d99" : "#276749",
                fontSize: "0.74rem",
                fontWeight: 600,
                cursor: used ? "default" : "pointer",
                textDecoration: used ? "line-through" : "none",
                transition: "all 0.15s",
              }}
              onMouseEnter={e => { if (!used) e.currentTarget.style.background = "#c6f6d5"; }}
              onMouseLeave={e => { if (!used) e.currentTarget.style.background = "#fff"; }}
            >
              {s}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── PES Card ─────────────────────────────────────────────────────────────────

interface PESCardProps {
  index: number;
  isPrimary: boolean;
  data: { problem: string; etiology: string; signsSymptoms: string };
  onChange: (field: string, val: string) => void;
  onRemove?: () => void;
  anthro?: any;
  dietary?: any;
  calculatedMetrics?: any;
}

const ETIOLOGY_DOMAINS = [
  "Physiologic-Metabolic",
  "Beliefs & Attitudes",
  "Knowledge",
  "Behavior",
  "Treatment",
  "Psychological",
  "Cultural",
  "Access",
  "Social-Personal",
  "Physical function",
];

function PESCard({ index, isPrimary, data, onChange, onRemove, anthro, dietary, calculatedMetrics }: PESCardProps) {
  const [showEtiologySuggestions, setShowEtiologySuggestions] = useState(true);
  const [showSignsSuggestions, setShowSignsSuggestions] = useState(true);
  const [customEtiologyDomain, setCustomEtiologyDomain] = useState(ETIOLOGY_DOMAINS[0]);

  const accentColor = isPrimary ? "#3498db" : "#8e44ad";
  const label = isPrimary ? "Primary Nutrition Diagnosis" : `Additional Diagnosis ${index}`;

  // Append to etiology field (semicolon-delimited if content exists)
  const handleEtiologyAppend = (etio: string) => {
    const existing = data.etiology.trim();
    const next = existing ? `${existing}; ${etio}` : etio;
    onChange("etiology", next);
  };

  // Manual etiology domain appender - Smart Replace
  const handleAddDomain = (domain: string) => {
    if (!domain) return;
    let existing = data.etiology.trim();
    if (!existing) return;
    
    // Split by segments (semicolon)
    const segments = existing.split(";").map(s => s.trim()).filter(Boolean);
    if (segments.length === 0) return;

    let lastSegment = segments[segments.length - 1];

    // Regex to see if it already ends with a domain in parentheses
    // Group 1: The text before the final parentheses
    // Group 2: The content inside the final parentheses
    const match = lastSegment.match(/^(.*)\s*\(([^)]+)\)$/);
    
    if (match && ETIOLOGY_DOMAINS.includes(match[2].trim())) {
      // Smart Replace: swap the existing domain for the new one
      lastSegment = `${match[1].trim()} (${domain})`;
    } else {
      // Normal Append: just add the domain to the end
      lastSegment = `${lastSegment} (${domain})`;
    }

    segments[segments.length - 1] = lastSegment;
    onChange("etiology", segments.join("; "));
  };

  // Append to signsSymptoms field
  const handleSignsAppend = (s: string) => {
    const existing = data.signsSymptoms.trim();
    const next = existing ? `${existing}; ${s}` : s;
    onChange("signsSymptoms", next);
  };

  const hasEtiologySuggestions = !!getAllEtiologiesForProblem(data.problem).length;
  const contextualHints = useMemo(
    () => buildContextualSuggestions(data.problem, anthro, dietary, calculatedMetrics),
    [data.problem, anthro, dietary, calculatedMetrics?.ubwTimeframeDays]
  );

  // Domain adder visibility: show if there is any text in the etiology field
  // This allows the user to append or change a domain at any time.
  const showDomainAdder = data.etiology.trim().length > 0;

  return (
    <div style={{
      border: `1px solid ${accentColor}30`,
      borderLeft: `4px solid ${accentColor}`,
      borderRadius: "8px",
      padding: "1rem",
      marginBottom: "1rem",
      background: isPrimary ? "#f0f7ff" : "#faf5ff",
    }}>
      {/* Card header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem" }}>
        <span style={{ fontSize: "0.75rem", fontWeight: 800, color: accentColor, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {label}
        </span>
        {onRemove && (
          <button onClick={onRemove} style={{ fontSize: "0.65rem", padding: "2px 8px", borderRadius: "10px", border: "1px solid #e74c3c", background: "transparent", color: "#e74c3c", cursor: "pointer", fontWeight: 600 }}>
            Remove
          </button>
        )}
      </div>

      {/* P — Problem */}
      <Field label="P — Problem (Nutrition Diagnosis)">
        <SearchableCombobox
          value={data.problem}
          onChange={v => onChange("problem", v)}
          placeholder="Search or select diagnosis…"
          groupedOptions={DIAGNOSIS_GROUPS.map(g => ({ group: g.group, items: g.diagnoses }))}
        />
      </Field>

      {/* PES Live Preview */}
      {data.problem && (
        <div style={{
          background: "#fff",
          border: `1px solid ${accentColor}30`,
          borderRadius: "6px",
          padding: "0.65rem 0.9rem",
          margin: "0.85rem 0",
          fontSize: "0.84rem",
          lineHeight: 1.7,
          fontStyle: "italic",
          color: "#334155",
        }}>
          <span style={{ fontWeight: 700, color: accentColor, fontStyle: "normal" }}>{data.problem}</span>
          {data.etiology && (
            <> <span style={{ color: "#64748b", fontStyle: "normal" }}>related to</span>{" "}
            <span style={{ fontWeight: 600, fontStyle: "normal" }}>{data.etiology}</span></>
          )}
          {data.signsSymptoms && (
            <> <span style={{ color: "#64748b", fontStyle: "normal" }}>as evidenced by</span>{" "}
            <span style={{ fontWeight: 600, fontStyle: "normal" }}>{data.signsSymptoms}</span></>
          )}
        </div>
      )}

      {/* E & S grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem", marginTop: "0.5rem" }}>
        {/* E — Etiology */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
            <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#4a5568", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              E — Etiology (Related to / Due to)
            </label>
            {hasEtiologySuggestions && (
              <button
                onClick={() => setShowEtiologySuggestions(s => !s)}
                style={{ fontSize: "0.62rem", padding: "1px 7px", border: `1px solid ${accentColor}40`, borderRadius: "8px", background: showEtiologySuggestions ? `${accentColor}15` : "transparent", color: accentColor, cursor: "pointer", fontWeight: 700 }}
              >
                {showEtiologySuggestions ? "Hide hints" : "Show hints"}
              </button>
            )}
          </div>
          
          <div style={{ position: "relative", width: "100%" }}>
            <textarea
              value={data.etiology}
              onChange={e => onChange("etiology", e.target.value)}
              placeholder="Related to…"
              style={{
                padding: showDomainAdder ? "7px 110px 7px 9px" : "7px 9px", 
                border: "1px solid #e2e8f0", borderRadius: "6px",
                fontSize: "0.85rem", minHeight: "72px", resize: "vertical",
                width: "100%", boxSizing: "border-box", fontFamily: "inherit",
                transition: "padding 0.2s",
              }}
            />
            {showDomainAdder && (
              <div style={{
                position: "absolute", top: "8px", right: "8px",
                zIndex: 10,
              }}>
                <select
                  value=""
                  onChange={e => handleAddDomain(e.target.value)}
                  style={{
                    fontSize: "0.65rem", padding: "4px 8px", borderRadius: "6px",
                    border: "1px solid #cbd5e1", background: accentColor, color: "#fff",
                    cursor: "pointer", outline: "none", fontWeight: 700,
                    width: "100px", appearance: "none", textAlign: "center",
                  }}
                >
                  <option value="" disabled>Add Domain...</option>
                  {ETIOLOGY_DOMAINS.map(d => <option key={d} value={d} style={{ color: "#1e293b", background: "#fff" }}>{d}</option>)}
                </select>
              </div>
            )}
          </div>

          {showEtiologySuggestions && data.problem && (
            <EtiologySuggestions
              problem={data.problem}
              currentEtiology={data.etiology}
              onAppend={handleEtiologyAppend}
            />
          )}
        </div>


        {/* S — Signs & Symptoms */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
            <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#4a5568", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              S — Signs & Symptoms (As Evidenced By)
            </label>
            {contextualHints.length > 0 && (
              <button
                onClick={() => setShowSignsSuggestions(s => !s)}
                style={{ fontSize: "0.62rem", padding: "1px 7px", border: "1px solid #9ae6b4", borderRadius: "8px", background: showSignsSuggestions ? "#f0fff4" : "transparent", color: "#276749", cursor: "pointer", fontWeight: 700 }}
              >
                {showSignsSuggestions ? "Hide hints" : `${contextualHints.length} hint${contextualHints.length > 1 ? "s" : ""}`}
              </button>
            )}
          </div>
          <textarea
            value={data.signsSymptoms}
            onChange={e => onChange("signsSymptoms", e.target.value)}
            placeholder="As evidenced by…"
            style={{
              padding: "7px 9px", border: "1px solid #e2e8f0", borderRadius: "6px",
              fontSize: "0.85rem", minHeight: "72px", resize: "vertical",
              width: "100%", boxSizing: "border-box", fontFamily: "inherit",
            }}
          />
          {showSignsSuggestions && data.problem && (
            <SignsSuggestions
              problem={data.problem}
              currentSigns={data.signsSymptoms}
              anthro={anthro}
              dietary={dietary}
              calculatedMetrics={calculatedMetrics}
              onAppend={handleSignsAppend}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface DiagnosisDomainProps {
  diagnosis: any;
  setDiagnosis: (d: any) => void;
  /** Pass live anthro state from App.tsx for contextual S-suggestions */
  anthro?: any;
  /** Pass live dietary state from App.tsx for contextual S-suggestions */
  dietary?: any;
  calculatedMetrics?: any;
}

let _nextId = 2;
function newDx() {
  return { id: _nextId++, problem: "", etiology: "", signsSymptoms: "" };
}

export default function DiagnosisDomain({ diagnosis, setDiagnosis, anthro, dietary, calculatedMetrics }: DiagnosisDomainProps) {
  const update = (field: string, val: any) => setDiagnosis({ ...diagnosis, [field]: val });

  const addDx = () => {
    setDiagnosis({
      ...diagnosis,
      additionalDiagnoses: [...(diagnosis.additionalDiagnoses || []), newDx()],
    });
  };

  const updateAdditional = (id: number, field: string, val: string) => {
    setDiagnosis({
      ...diagnosis,
      additionalDiagnoses: diagnosis.additionalDiagnoses.map((d: any) =>
        d.id === id ? { ...d, [field]: val } : d
      ),
    });
  };

  const removeAdditional = (id: number) => {
    setDiagnosis({
      ...diagnosis,
      additionalDiagnoses: diagnosis.additionalDiagnoses.filter((d: any) => d.id !== id),
    });
  };

  return (
    <div className="fade-in">
      <DomainHeader title="Dx. Nutrition Diagnosis" />

      {/* PES Builder */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <SectionHeader title="PES Statement Builder" subtitle="Problem · Etiology · Signs/Symptoms" color="#3498db" />
          <button
            onClick={addDx}
            style={{
              background: "#8e44ad", color: "#fff", border: "none", borderRadius: "6px",
              padding: "6px 14px", cursor: "pointer", fontSize: "0.8rem", fontWeight: 700, whiteSpace: "nowrap",
            }}
          >
            + Add Diagnosis
          </button>
        </div>

        {/* Primary PES */}
        <PESCard
          index={0}
          isPrimary={true}
          data={{
            problem: diagnosis.problem || "",
            etiology: diagnosis.etiology || "",
            signsSymptoms: diagnosis.signsSymptoms || "",
          }}
          onChange={(field, val) => update(field, val)}
          anthro={anthro}
          dietary={dietary}
          calculatedMetrics={calculatedMetrics}
        />

        {/* Additional PES */}
        {(diagnosis.additionalDiagnoses || []).map((dx: any, i: number) => (
          <PESCard
            key={dx.id}
            index={i + 1}
            isPrimary={false}
            data={{ problem: dx.problem, etiology: dx.etiology, signsSymptoms: dx.signsSymptoms }}
            onChange={(field, val) => updateAdditional(dx.id, field, val)}
            onRemove={() => removeAdditional(dx.id)}
            anthro={anthro}
            dietary={dietary}
            calculatedMetrics={calculatedMetrics}
          />
        ))}
      </div>

      {/* Priority ranking + narrative */}
      <div className="card">
        <SectionHeader title="Diagnostic Narrative & Priority" color="#3498db" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div className="input-group">
            <label>Priority Ranking</label>
            <input
              type="text"
              value={diagnosis.priorityRanking || ""}
              onChange={e => update("priorityRanking", e.target.value)}
              placeholder="e.g. Primary: NI-1.2; Secondary: NC-3.2"
            />
          </div>
          <div className="input-group">
            <label>Additional Notes</label>
            <input
              type="text"
              value={diagnosis.notes || ""}
              onChange={e => update("notes", e.target.value)}
              placeholder="Any nuance or context…"
            />
          </div>
        </div>
        <div className="input-group" style={{ marginTop: "0.5rem" }}>
          <label>Nutrition Diagnosis Narrative</label>
          <textarea
            value={diagnosis.nutritionDxNarrative || ""}
            onChange={e => update("nutritionDxNarrative", e.target.value)}
            placeholder="Summarize the nutrition diagnosis in clinical language…"
            style={{ minHeight: "80px" }}
          />
        </div>
      </div>
    </div>
  );
}