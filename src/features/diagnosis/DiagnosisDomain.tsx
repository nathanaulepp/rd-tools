// src/features/diagnosis/DiagnosisDomain.tsx
// Phase 7: Automated PES Builder with Auto-Suggest
// PATCH: Enhanced Signs & Symptoms suggestions with:
//   - Categorized hints (Anthropometric, Biochemical, Clinical/Physical, Dietary/Intake)
//   - "Add Category..." dropdown (Smart Tag) for manual entries
//   - Expanded contextual evidence from clinical NFPE findings
//   - Multi-select semicolon-join logic with consistent "used" detection

import { useState, useRef, useEffect, useMemo } from "react";
import { DomainHeader } from "../../shared/ui/DomainHeader";
import { SectionHeader } from "../../shared/ui/SectionHeader";
import { Field } from "../../shared/ui/Field";
import { Tooltip } from "../../shared/ui/Tooltip";
import { formatAge } from "../../shared/utils/date";

import {
  evaluateWeightLoss,
  evaluateIntake,
  diagnoseMalnutrition,
  MalnutritionCriteria,
  Severity,
  ClinicalContext,
  getAcuteModerateThreshold,
  getChronicSevereThreshold,
} from "./malnutritionEngine";

import { DIAGNOSIS_GROUPS, getAllEtiologiesForProblem } from "./etiologyData";

// ─── S/S Category Definitions ─────────────────────────────────────────────────

const SIGNS_SYMPTOMS_CATEGORIES = [
  "Anthropometric",
  "Biochemical",
  "Clinical/Physical",
  "Dietary/Intake",
  "Functional",
  "Behavioral",
] as const;

type SSCategory = (typeof SIGNS_SYMPTOMS_CATEGORIES)[number];

const SS_CATEGORY_COLORS: Record<SSCategory, string> = {
  "Anthropometric":    "#3182ce",
  "Biochemical":       "#805ad5",
  "Clinical/Physical": "#e53e3e",
  "Dietary/Intake":    "#276749",
  "Functional":        "#c05621",
  "Behavioral":        "#2c7a7b",
};

interface SSHint {
  text: string;
  category: SSCategory;
}

// ─── Expanded Contextual S/S Builder ─────────────────────────────────────────
// Maps live app state → categorized NCP evidence strings

function buildContextualSuggestions(
  problem: string,
  anthro: any,
  dietary: any,
  calculatedMetrics?: any,
  clinical?: any
): SSHint[] {
  const hints: SSHint[] = [];
  if (!problem) return hints;

  const p = problem.toLowerCase();

  // ── ANTHROPOMETRIC ────────────────────────────────────────────────────────
  if (anthro) {
    const wt   = parseFloat(anthro.wt   || "0");
    const ubw  = parseFloat(anthro.ubw  || "0");
    const wtUnit = anthro.wtUnit || "kg";

    // Weight loss
    if (wt > 0 && ubw > 0 && ubw > wt) {
      const loss = (ubw - wt).toFixed(1);
      const pct  = (((ubw - wt) / ubw) * 100).toFixed(1);
      const timeStr = calculatedMetrics?.ubwTimeframeDays != null
        ? `over ${formatAge(calculatedMetrics.ubwTimeframeDays)}`
        : "";
      hints.push({
        text: `Unintentional weight loss of ${loss} ${wtUnit} (${pct}%) ${timeStr}`.trim(),
        category: "Anthropometric",
      });
    }

    // Weight gain
    if (wt > 0 && ubw > 0 && wt > ubw) {
      const gain = (wt - ubw).toFixed(1);
      const pct  = (((wt - ubw) / ubw) * 100).toFixed(1);
      hints.push({
        text: `Weight gain of ${gain} ${wtUnit} (${pct}%) above usual body weight`,
        category: "Anthropometric",
      });
    }

    // BMI
    if (anthro.ht && wt > 0) {
      const htCm = anthro.htUnit === "in" ? parseFloat(anthro.ht) * 2.54 : parseFloat(anthro.ht);
      const wtKg = wtUnit === "lbs" ? wt / 2.2046 : wt;
      if (htCm > 0) {
        const bmi = (wtKg / Math.pow(htCm / 100, 2)).toFixed(1);
        const bmiNum = parseFloat(bmi);
        if (bmiNum < 18.5 && (p.includes("underweight") || p.includes("energy intake") || p.includes("malnutrition"))) {
          hints.push({ text: `BMI of ${bmi} kg/m² (underweight)`, category: "Anthropometric" });
        }
        if (bmiNum >= 25 && bmiNum < 30 && (p.includes("overweight") || p.includes("energy intake"))) {
          hints.push({ text: `BMI of ${bmi} kg/m² (overweight)`, category: "Anthropometric" });
        }
        if (bmiNum >= 30 && (p.includes("obesity") || p.includes("excessive energy") || p.includes("overweight"))) {
          hints.push({ text: `BMI of ${bmi} kg/m² (obese, Class ${bmiNum >= 40 ? "III" : bmiNum >= 35 ? "II" : "I"})`, category: "Anthropometric" });
        }
      }
    }

    // Head circumference for peds
    if (anthro.head && (p.includes("growth") || p.includes("pediatric") || p.includes("breastfeed"))) {
      hints.push({
        text: `Head circumference of ${anthro.head} ${anthro.circUnit || "cm"}`,
        category: "Anthropometric",
      });
    }

    // Mid-arm circumference
    if (anthro.mac && (p.includes("malnutrition") || p.includes("protein") || p.includes("muscle") || p.includes("sarcopenia"))) {
      hints.push({
        text: `Mid-arm circumference (MAC) of ${anthro.mac} ${anthro.circUnit || "cm"}`,
        category: "Anthropometric",
      });
    }
  }

  // ── DIETARY / INTAKE ──────────────────────────────────────────────────────
  if (dietary) {
    const kcal = parseFloat(dietary.oralCalories || "0");
    const prot = parseFloat(dietary.oralProtein  || "0");
    const eeiPct  = parseFloat(dietary.eeiPercent   || "0");
    const eeiDays = parseFloat(dietary.eeiTimeframe || "0");

    if (kcal > 0 && (p.includes("energy") || p.includes("intake") || p.includes("malnutrition") || p.includes("weight"))) {
      hints.push({
        text: `Estimated oral energy intake of ${Math.round(kcal)} kcal/day per 24-hour recall`,
        category: "Dietary/Intake",
      });
    }

    if (prot > 0 && (p.includes("protein") || p.includes("malnutrition") || p.includes("sarcopenia") || p.includes("muscle") || p.includes("wound") || p.includes("pressure"))) {
      hints.push({
        text: `Estimated protein intake of ${prot} g/day per 24-hour recall`,
        category: "Dietary/Intake",
      });
    }

    if (eeiPct > 0 && eeiDays > 0 && (p.includes("energy") || p.includes("intake") || p.includes("malnutrition"))) {
      hints.push({
        text: `Estimated energy intake approximately ${Math.round(eeiPct)}% of estimated needs over ${eeiDays} day${eeiDays !== 1 ? "s" : ""}`,
        category: "Dietary/Intake",
      });
    }

    if (dietary.fluidIntake && (p.includes("fluid") || p.includes("dehydrat") || p.includes("renal") || p.includes("kidney"))) {
      hints.push({ text: `Reported fluid intake: ${dietary.fluidIntake}`, category: "Dietary/Intake" });
    }

    if (dietary.foodSecurity && (p.includes("food insecurity") || p.includes("access") || p.includes("limited access"))) {
      hints.push({ text: `Food security concern documented: ${dietary.foodSecurity}`, category: "Dietary/Intake" });
    }

    if (dietary.dietOrder && (p.includes("diet") || p.includes("intake") || p.includes("oral"))) {
      hints.push({ text: `Current diet order: ${dietary.dietOrder}`, category: "Dietary/Intake" });
    }
  }

  // ── CLINICAL / PHYSICAL (NFPE) ────────────────────────────────────────────
  if (clinical) {
    const muscleFields: Record<string, string> = {
      temples:      "temporal muscle wasting",
      clavicles:    "clavicle prominence (fat/muscle loss)",
      shoulders:    "shoulder muscle wasting",
      scapula:      "scapular muscle wasting",
      interosseous: "interosseous muscle wasting (dorsal hand)",
      thighs:       "quadriceps muscle wasting (thighs)",
      calves:       "gastrocnemius muscle wasting (calves)",
    };

    const fatFields: Record<string, string> = {
      orbital:    "orbital fat loss (periorbital hollowing)",
      cheek:      "buccal fat loss (temporal hollowing/buccal wasting)",
      tricepsFat: "tricep subcutaneous fat loss",
      midAxillary: "mid-axillary subcutaneous fat loss",
    };

    const relevantToMuscle = p.includes("malnutrition") || p.includes("protein") || p.includes("sarcopenia") || p.includes("muscle") || p.includes("weight loss");
    const relevantToFat    = p.includes("malnutrition") || p.includes("energy") || p.includes("weight loss");

    if (relevantToMuscle || relevantToFat) {
      Object.entries(muscleFields).forEach(([key, desc]) => {
        const val = clinical[key];
        if (val && val !== "Normal" && val !== "") {
          hints.push({
            text: `${val} ${desc} on NFPE`,
            category: "Clinical/Physical",
          });
        }
      });

      Object.entries(fatFields).forEach(([key, desc]) => {
        const val = clinical[key];
        if (val && val !== "Normal" && val !== "") {
          hints.push({
            text: `${val} ${desc} on NFPE`,
            category: "Clinical/Physical",
          });
        }
      });
    }

    // Fluid accumulation
    if (clinical.pittingEdema && clinical.pittingEdema !== "None" && (p.includes("fluid") || p.includes("malnutrition") || p.includes("liver") || p.includes("renal") || p.includes("heart"))) {
      const edemaDesc = clinical.edemaDescription ? ` (${clinical.edemaDescription})` : "";
      hints.push({
        text: `Pitting edema ${clinical.pittingEdema}${edemaDesc} on physical exam`,
        category: "Clinical/Physical",
      });
    }

    if (clinical.ascites && clinical.ascites !== "None" && (p.includes("liver") || p.includes("cirrhosis") || p.includes("fluid"))) {
      hints.push({
        text: `${clinical.ascites} ascites on physical exam`,
        category: "Clinical/Physical",
      });
    }

    // Functional grip
    if (clinical.gripStrength === "Measurably Reduced" && (p.includes("malnutrition") || p.includes("sarcopenia") || p.includes("functional"))) {
      hints.push({
        text: `Measurably reduced functional grip strength on bedside assessment`,
        category: "Functional",
      });
    }

    // GI symptoms
    if (clinical.giDistress && (p.includes("malnutrition") || p.includes("intake") || p.includes("gi") || p.includes("swallow") || p.includes("chewing"))) {
      hints.push({
        text: `GI distress reported: ${clinical.giDistress}`,
        category: "Clinical/Physical",
      });
    }

    // Swallowing
    if (clinical.swallowing && (p.includes("swallow") || p.includes("chewing") || p.includes("oral intake") || p.includes("dysphagia"))) {
      hints.push({
        text: `Swallowing difficulty: ${clinical.swallowing}`,
        category: "Clinical/Physical",
      });
    }

    // Chewing
    if (clinical.chewing && (p.includes("chewing") || p.includes("oral") || p.includes("intake"))) {
      hints.push({
        text: `Oral/chewing concern: ${clinical.chewing}`,
        category: "Clinical/Physical",
      });
    }

    // Imaging/body composition
    if (clinical.imaging_smi && (p.includes("sarcopenia") || p.includes("muscle") || p.includes("malnutrition"))) {
      hints.push({
        text: `Skeletal muscle index (SMI) of ${clinical.imaging_smi} cm²/m² on cross-sectional imaging`,
        category: "Clinical/Physical",
      });
    }
  }

  // ── BEHAVIORAL ────────────────────────────────────────────────────────────
  if (dietary) {
    if (dietary.readiness && (p.includes("readiness") || p.includes("not ready") || p.includes("behavior") || p.includes("adherence"))) {
      hints.push({
        text: `Readiness to change rated ${dietary.readiness}/10 by patient self-report`,
        category: "Behavioral",
      });
    }

    if (dietary.bingePurge && (p.includes("disorder") || p.includes("disordered") || p.includes("behavior"))) {
      hints.push({ text: `Reported binge/purge behaviors: ${dietary.bingePurge}`, category: "Behavioral" });
    }
  }

  return hints;
}

// ─── Malnutrition Table Component (unchanged) ─────────────────────────────────

interface MalnutritionTableProps {
  anthro: any;
  dietary: any;
  clinical: any;
  calculatedMetrics: any;
}

function MalnutritionTable({ anthro, dietary, clinical, calculatedMetrics }: MalnutritionTableProps) {
  const [context, setContext] = useState<ClinicalContext>("Acute");

  const wt  = parseFloat(anthro?.wt  || "0");
  const ubw = parseFloat(anthro?.ubw || "0");
  const pctLoss = (ubw > 0 && wt > 0 && ubw > wt) ? ((ubw - wt) / ubw) * 100 : 0;
  const days = calculatedMetrics?.ubwTimeframeDays || 0;

  const modThreshold = context === "Acute" ? getAcuteModerateThreshold(days) : null;
  const sevThreshold =
    context === "Chronic"
      ? getChronicSevereThreshold(days)
      : days >= 7 && days < 30
      ? (3 / 23) * (days - 7) + 2
      : getAcuteModerateThreshold(days);

  const getMaxNFPE = (fields: string[]): Severity => {
    let max: Severity = "None";
    for (const f of fields) {
      const val = clinical?.[f];
      if (val === "Severe") return "Severe";
      if (val === "Moderate") max = "Moderate";
      else if (val === "Mild" && max === "None") max = "Moderate";
    }
    return max;
  };

  const muscleFields = ["temples", "clavicles", "shoulders", "scapula", "interosseous", "thighs", "calves"];
  const fatFields    = ["orbital", "cheek", "tricepsFat", "midAxillary"];

  const fluidSeverity = (): Severity => {
    if (clinical?.ascites === "Severe" || clinical?.pittingEdema === "+3" || clinical?.pittingEdema === "+4") return "Severe";
    if (clinical?.ascites === "Moderate" || clinical?.pittingEdema === "+2") return "Moderate";
    if (clinical?.ascites === "Mild" || clinical?.pittingEdema === "+1") return "Moderate";
    return "None";
  };

  const gripSeverity = (): Severity => {
    if (clinical?.gripStrength === "Measurably Reduced") return context === "Acute" ? "Moderate" : "Severe";
    return "None";
  };

  const criteria: MalnutritionCriteria = {
    weightLoss:        evaluateWeightLoss(pctLoss, days, context),
    eei:               evaluateIntake(parseFloat(dietary?.eeiPercent || "0"), parseFloat(dietary?.eeiTimeframe || "0"), context),
    muscleWasting:     getMaxNFPE(muscleFields),
    fatLoss:           getMaxNFPE(fatFields),
    fluidAccumulation: fluidSeverity(),
    gripStrength:      gripSeverity(),
  };

  const diagnosisResult = diagnoseMalnutrition(criteria);

  const getCellColor = (sev: Severity) => {
    if (sev === "Severe") return "#fee2e2";
    if (sev === "Moderate") return "#fef3c7";
    if (sev === "Borderline") return "#f1f5f9";
    return "#fff";
  };

  const getTextColor = (sev: Severity) => {
    if (sev === "Severe") return "#991b1b";
    if (sev === "Moderate") return "#92400e";
    return "#475569";
  };

  return (
    <div className="card" style={{ marginBottom: "1.5rem", border: "1px solid #e2e8f0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <SectionHeader
          title="ASPEN Malnutrition Diagnostic Engine"
          subtitle="Continuous Interpolation (Rule of Two)"
          color="#1e293b"
        />
        <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "#f1f5f9", padding: "4px", borderRadius: "8px" }}>
          {(["Acute", "Chronic"] as ClinicalContext[]).map((c) => (
            <button
              key={c}
              onClick={() => setContext(c)}
              style={{
                padding: "4px 12px", border: "none", borderRadius: "6px", cursor: "pointer",
                fontSize: "0.75rem", fontWeight: 700,
                background: context === c ? "#fff" : "transparent",
                color: context === c ? "#1e293b" : "#64748b",
                boxShadow: context === c ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem", marginBottom: "1rem" }}>
        <thead>
          <tr style={{ textAlign: "left", background: "#f8fafc" }}>
            <th style={{ padding: "10px", border: "1px solid #e2e8f0" }}>Criterion</th>
            <th style={{ padding: "10px", border: "1px solid #e2e8f0" }}>Mod Threshold</th>
            <th style={{ padding: "10px", border: "1px solid #e2e8f0" }}>Sev Threshold</th>
            <th style={{ padding: "10px", border: "1px solid #e2e8f0" }}>Patient Value</th>
            <th style={{ padding: "10px", border: "1px solid #e2e8f0" }}>Outcome</th>
          </tr>
        </thead>
        <tbody>
          {[
            {
              label: "Weight Loss (%)",
              mod: modThreshold !== null ? `≥ ${modThreshold.toFixed(1)}%` : "N/A",
              sev: sevThreshold !== null ? `≥ ${sevThreshold.toFixed(1)}%` : "N/A",
              val: `${pctLoss.toFixed(1)}% (${days}d)`,
              outcome: criteria.weightLoss,
            },
            {
              label: "Energy Intake (%)",
              mod: "< 75%",
              sev: "≤ 50%",
              val: `${dietary?.eeiPercent || 0}% (${dietary?.eeiTimeframe || 0}d)`,
              outcome: criteria.eei,
            },
            {
              label: "Muscle Wasting",
              mod: "Mild-Moderate",
              sev: "Severe",
              val: `${muscleFields.filter((f) => clinical?.[f] && clinical?.[f] !== "Normal").length} sites`,
              outcome: criteria.muscleWasting,
            },
            {
              label: "Fat Loss",
              mod: "Mild-Moderate",
              sev: "Severe",
              val: `${fatFields.filter((f) => clinical?.[f] && clinical?.[f] !== "Normal").length} sites`,
              outcome: criteria.fatLoss,
            },
            {
              label: "Fluid Accumulation",
              mod: "Mild-Moderate",
              sev: "Severe",
              val: clinical?.pittingEdema || "None",
              outcome: criteria.fluidAccumulation,
            },
            {
              label: "Functional Grip",
              mod: context === "Acute" ? "Reduced" : "N/A",
              sev: context === "Chronic" ? "Reduced" : "N/A",
              val: clinical?.gripStrength || "WNL",
              outcome: criteria.gripStrength,
            },
          ].map((row) => (
            <tr key={row.label}>
              <td style={{ padding: "10px", border: "1px solid #e2e8f0", fontWeight: 600 }}>{row.label}</td>
              <td style={{ padding: "10px", border: "1px solid #e2e8f0", color: "#64748b" }}>{row.mod}</td>
              <td style={{ padding: "10px", border: "1px solid #e2e8f0", color: "#64748b" }}>{row.sev}</td>
              <td style={{ padding: "10px", border: "1px solid #e2e8f0" }}>{row.val}</td>
              <td style={{ padding: "10px", border: "1px solid #e2e8f0", background: getCellColor(row.outcome), color: getTextColor(row.outcome), fontWeight: 700 }}>
                {row.outcome}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{
        padding: "1rem",
        background: diagnosisResult.diagnosis === "None" ? "#f8fafc" : diagnosisResult.diagnosis.includes("Severe") ? "#fef2f2" : "#fffbeb",
        border: "1px solid",
        borderColor: diagnosisResult.diagnosis === "None" ? "#e2e8f0" : diagnosisResult.diagnosis.includes("Severe") ? "#fecaca" : "#fef3c7",
        borderRadius: "8px",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "0.65rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Automated Diagnosis</div>
            <div style={{ fontSize: "1.1rem", fontWeight: 800, color: diagnosisResult.diagnosis === "None" ? "#334155" : diagnosisResult.diagnosis.includes("Severe") ? "#991b1b" : "#92400e" }}>
              {diagnosisResult.diagnosis}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "0.65rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Clinical Buffer</div>
            <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#334155" }}>± 0.5% applied</div>
          </div>
        </div>
        {diagnosisResult.reasoning.length > 0 && (
          <div style={{ marginTop: "10px", fontSize: "0.75rem", color: "#475569", borderTop: "1px solid rgba(0,0,0,0.05)", paddingTop: "8px" }}>
            <strong>Engine Reasoning:</strong>
            <ul style={{ margin: "4px 0 0 16px", padding: 0 }}>
              {diagnosisResult.reasoning.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
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
  const [open, setOpen]   = useState(false);
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
    return groupedOptions.map((g) => ({ ...g, items: g.items.filter((d) => d.toLowerCase().includes(q)) })).filter((g) => g.items.length > 0);
  }, [query, groupedOptions]);

  const filteredOptions = useMemo(() => {
    if (!options) return [];
    const q = query.toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [query, options]);

  const handleSelect = (val: string) => { setQuery(val); onChange(val); setOpen(false); };
  const handleClear  = () => { setQuery(""); onChange(""); setOpen(false); };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div style={{ display: "flex", gap: "4px" }}>
        <input
          type="text"
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => { setQuery(e.target.value); onChange(e.target.value); setOpen(true); }}
          placeholder={placeholder}
          style={{ flex: 1, padding: "7px 10px", border: "1px solid #e2e8f0", borderRadius: "6px", fontSize: "0.88rem", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
        />
        {query && (
          <button onClick={handleClear} style={{ border: "none", background: "none", color: "#94a3b8", cursor: "pointer", fontSize: "1rem", padding: "0 6px" }} title="Clear">×</button>
        )}
      </div>

      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 300, maxHeight: "300px", overflowY: "auto" }}>
          {groupedOptions && filteredGrouped.map((g) => (
            <div key={g.group}>
              <div style={{ padding: "6px 12px", fontSize: "0.65rem", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: "1px solid #f1f5f9", background: "#fafafa", position: "sticky", top: 0 }}>
                {g.group}
              </div>
              {g.items.map((item) => (
                <button key={item} onClick={() => handleSelect(item)} style={{ display: "block", width: "100%", textAlign: "left", padding: "7px 14px", background: "none", border: "none", fontSize: "0.84rem", cursor: "pointer", color: "#1e293b", borderBottom: "1px solid #f8fafc", fontWeight: item === value ? 700 : 400 }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f0f7ff")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                >
                  {item}
                </button>
              ))}
            </div>
          ))}
          {options && filteredOptions.map((item) => (
            <button key={item} onClick={() => handleSelect(item)} style={{ display: "block", width: "100%", textAlign: "left", padding: "7px 14px", background: "none", border: "none", fontSize: "0.84rem", cursor: "pointer", color: "#1e293b", borderBottom: "1px solid #f8fafc", fontWeight: item === value ? 700 : 400 }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f0f7ff")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Etiology Suggestion Chips (unchanged) ────────────────────────────────────

interface EtiologySuggestionsProps {
  problem: string;
  currentEtiology: string;
  onAppend: (text: string) => void;
  onRemove: (text: string) => void;
}

function EtiologySuggestions({ problem, currentEtiology, onAppend, onRemove }: EtiologySuggestionsProps) {
  const etiologies = getAllEtiologiesForProblem(problem);
  if (etiologies.length === 0) return null;

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

  const isAlreadyUsed = (etio: string) => currentEtiology.toLowerCase().includes(etio.toLowerCase());

  return (
    <div style={{ marginTop: "8px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "10px 12px" }}>
      <div style={{ fontSize: "0.68rem", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>
        Suggested Etiologies — click to select
      </div>
      {Object.entries(grouped).map(([cat, etiologies]) => {
        const color = CAT_COLORS[cat] || "#64748b";
        return (
          <div key={cat} style={{ marginBottom: "8px" }}>
            <div style={{ fontSize: "0.62rem", fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>{cat}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
              {etiologies.map((etio) => {
                const used = isAlreadyUsed(etio);
                return (
                  <button key={etio} onClick={() => used ? onRemove(etio) : onAppend(`${etio} (${cat})`)} title={used ? "Click to deselect" : `Select: "${etio}"`}
                    style={{ padding: "3px 9px", borderRadius: "12px", border: `1px solid ${color}40`, background: used ? `${color}15` : `${color}08`, color: used ? `${color}99` : color, fontSize: "0.72rem", fontWeight: 600, cursor: "pointer", textDecoration: used ? "line-through" : "none", opacity: used ? 0.6 : 1, transition: "all 0.15s" }}
                    onMouseEnter={(e) => { if (!used) e.currentTarget.style.background = `${color}20`; }}
                    onMouseLeave={(e) => { if (!used) e.currentTarget.style.background = `${color}08`; }}
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

// ─── Enhanced Signs & Symptoms Suggestions ────────────────────────────────────

interface SignsSuggestionsProps {
  problem: string;
  currentSigns: string;
  anthro: any;
  dietary: any;
  clinical?: any;
  calculatedMetrics?: any;
  onAppend: (text: string) => void;
  onRemove: (text: string) => void;
}

function SignsSuggestions({ problem, currentSigns, anthro, dietary, clinical, calculatedMetrics, onAppend, onRemove }: SignsSuggestionsProps) {
  const allHints = useMemo(
    () => buildContextualSuggestions(problem, anthro, dietary, calculatedMetrics, clinical),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      problem,
      anthro?.wt, anthro?.ubw, anthro?.ht, anthro?.head, anthro?.mac, anthro?.wtUnit,
      dietary?.oralCalories, dietary?.oralProtein, dietary?.eeiPercent, dietary?.eeiTimeframe,
      dietary?.fluidIntake, dietary?.foodSecurity, dietary?.dietOrder, dietary?.readiness, dietary?.bingePurge,
      clinical?.temples, clinical?.clavicles, clinical?.shoulders, clinical?.scapula,
      clinical?.interosseous, clinical?.thighs, clinical?.calves,
      clinical?.orbital, clinical?.cheek, clinical?.tricepsFat, clinical?.midAxillary,
      clinical?.pittingEdema, clinical?.ascites, clinical?.gripStrength,
      clinical?.giDistress, clinical?.swallowing, clinical?.chewing, clinical?.imaging_smi,
      calculatedMetrics?.ubwTimeframeDays,
    ]
  );

  if (allHints.length === 0) return null;

  // Group by category
  const grouped = useMemo(() => {
    const map: Partial<Record<SSCategory, SSHint[]>> = {};
    for (const h of allHints) {
      if (!map[h.category]) map[h.category] = [];
      map[h.category]!.push(h);
    }
    return map;
  }, [allHints]);

  // Consistent "used" check — normalise whitespace and compare first 25 chars
  const isUsed = (hint: SSHint) => {
    const needle = hint.text.toLowerCase().slice(0, 25).replace(/\s+/g, " ").trim();
    return currentSigns.toLowerCase().replace(/\s+/g, " ").includes(needle);
  };

  const presentCategories = (Object.keys(grouped) as SSCategory[]).filter(
    (cat) => (grouped[cat] ?? []).length > 0
  );

  return (
    <div style={{ marginTop: "8px", background: "#f0fff4", border: "1px solid #9ae6b4", borderRadius: "8px", padding: "10px 12px" }}>
      <div style={{ fontSize: "0.68rem", fontWeight: 800, color: "#276749", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>
        ✦ Contextual Evidence — grouped by category
      </div>

      {presentCategories.map((cat) => {
        const color  = SS_CATEGORY_COLORS[cat];
        const hints  = grouped[cat] ?? [];
        return (
          <div key={cat} style={{ marginBottom: "10px" }}>
            {/* Category label */}
            <div style={{ fontSize: "0.62rem", fontWeight: 800, color, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px", display: "flex", alignItems: "center", gap: "5px" }}>
              <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: color }} />
              {cat}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
              {hints.map((hint, i) => {
                const used = isUsed(hint);
                return (
                  <button
                    key={i}
                    onClick={() => used ? onRemove(hint.text) : onAppend(hint.text)}
                    title={used ? "Click to deselect" : `Click to insert into Signs & Symptoms`}
                    style={{
                      padding: "4px 10px",
                      borderRadius: "12px",
                      border: `1px solid ${color}50`,
                      background: used ? `${color}18` : "#fff",
                      color: used ? `${color}80` : color,
                      fontSize: "0.73rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      textDecoration: used ? "line-through" : "none",
                      opacity: used ? 0.65 : 1,
                      transition: "all 0.15s",
                      maxWidth: "280px",
                      textAlign: "left",
                      lineHeight: 1.4,
                    }}
                    onMouseEnter={(e) => { if (!used) { e.currentTarget.style.background = `${color}18`; } }}
                    onMouseLeave={(e) => { if (!used) { e.currentTarget.style.background = "#fff"; } }}
                  >
                    {hint.text}
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

// ─── PES Card ─────────────────────────────────────────────────────────────────

interface PESCardProps {
  index: number;
  isPrimary: boolean;
  data: { problem: string; etiology: string; signsSymptoms: string };
  onChange: (field: string, val: string) => void;
  onRemove?: () => void;
  anthro?: any;
  dietary?: any;
  clinical?: any;
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

function PESCard({ index, isPrimary, data, onChange, onRemove, anthro, dietary, clinical, calculatedMetrics }: PESCardProps) {
  const [showEtiologySuggestions, setShowEtiologySuggestions] = useState(true);
  const [showSignsSuggestions,    setShowSignsSuggestions]    = useState(true);

  const accentColor = isPrimary ? "#3498db" : "#8e44ad";
  const label       = isPrimary ? "Primary Nutrition Diagnosis" : `Additional Diagnosis ${index}`;

  const handleEtiologyAppend = (etio: string) => {
    onChange("etiology", etio); // replace, not accumulate
  };

  const handleEtiologyRemove = (etio: string) => {
    const segments = data.etiology
      .split(";")
      .map(s => s.trim())
      .filter(s => !s.toLowerCase().startsWith(etio.toLowerCase()));
    onChange("etiology", segments.join("; "));
  };

  // Smart Replace for etiology domain tag
  const handleAddDomain = (domain: string) => {
    if (!domain) return;
    const existing  = data.etiology.trim();
    if (!existing) return;
    const segments  = existing.split(";").map((s) => s.trim()).filter(Boolean);
    if (segments.length === 0) return;
    let last        = segments[segments.length - 1];
    const match     = last.match(/^(.*)\s*\(([^)]+)\)$/);
    if (match && ETIOLOGY_DOMAINS.includes(match[2].trim())) {
      last = `${match[1].trim()} (${domain})`;
    } else {
      last = `${last} (${domain})`;
    }
    segments[segments.length - 1] = last;
    onChange("etiology", segments.join("; "));
  };

  // Smart append for Signs & Symptoms — semicolon-join, avoid duplicates
  const handleSignsAppend = (text: string) => {
    const existing = data.signsSymptoms.trim();
    const next     = existing ? `${existing}; ${text}` : text;
    onChange("signsSymptoms", next);
  };

  const handleSignsRemove = (text: string) => {
    const segments = data.signsSymptoms
      .split(";")
      .map(s => s.trim())
      .filter(s => s.toLowerCase() !== text.toLowerCase().trim());
    onChange("signsSymptoms", segments.join("; "));
  };

  const hasEtiologySuggestions = !!getAllEtiologiesForProblem(data.problem).length;

  const contextualHints = useMemo(
    () => buildContextualSuggestions(data.problem, anthro, dietary, calculatedMetrics, clinical),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data.problem, anthro, dietary, calculatedMetrics, clinical]
  );

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
          onChange={(v) => onChange("problem", v)}
          placeholder="Search or select diagnosis…"
          groupedOptions={DIAGNOSIS_GROUPS.map((g) => ({ group: g.group, items: g.diagnoses }))}
        />
      </Field>

      {/* PES Live Preview */}
      {data.problem && (
        <div style={{ background: "#fff", border: `1px solid ${accentColor}30`, borderRadius: "6px", padding: "0.65rem 0.9rem", margin: "0.85rem 0", fontSize: "0.84rem", lineHeight: 1.7, fontStyle: "italic", color: "#334155" }}>
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

      {/* E & S Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem", marginTop: "0.5rem" }}>

        {/* ── E — Etiology ── */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
            <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#4a5568", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              E — Etiology (Related to / Due to)
            </label>
            {hasEtiologySuggestions && (
              <button
                onClick={() => setShowEtiologySuggestions((s) => !s)}
                style={{ fontSize: "0.62rem", padding: "1px 7px", border: `1px solid ${accentColor}40`, borderRadius: "8px", background: showEtiologySuggestions ? `${accentColor}15` : "transparent", color: accentColor, cursor: "pointer", fontWeight: 700 }}
              >
                {showEtiologySuggestions ? "Hide hints" : "Show hints"}
              </button>
            )}
          </div>

          <div style={{ position: "relative", width: "100%" }}>
            <textarea
              value={data.etiology}
              onChange={(e) => onChange("etiology", e.target.value)}
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
              <div style={{ position: "absolute", top: "8px", right: "8px", zIndex: 10 }}>
                <select
                  value=""
                  onChange={(e) => handleAddDomain(e.target.value)}
                  style={{ fontSize: "0.65rem", padding: "4px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", background: accentColor, color: "#fff", cursor: "pointer", outline: "none", fontWeight: 700, width: "100px", appearance: "none", textAlign: "center" }}
                >
                  <option value="" disabled>Add Domain...</option>
                  {ETIOLOGY_DOMAINS.map((d) => <option key={d} value={d} style={{ color: "#1e293b", background: "#fff" }}>{d}</option>)}
                </select>
              </div>
            )}
          </div>

          {showEtiologySuggestions && data.problem && (
            <EtiologySuggestions problem={data.problem} currentEtiology={data.etiology} onAppend={handleEtiologyAppend} onRemove={handleEtiologyRemove} />
          )}
        </div>

        {/* ── S — Signs & Symptoms ── */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
            <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#4a5568", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              S — Signs & Symptoms (As Evidenced By)
            </label>
            {contextualHints.length > 0 && (
              <button
                onClick={() => setShowSignsSuggestions((s) => !s)}
                style={{ fontSize: "0.62rem", padding: "1px 7px", border: "1px solid #9ae6b4", borderRadius: "8px", background: showSignsSuggestions ? "#f0fff4" : "transparent", color: "#276749", cursor: "pointer", fontWeight: 700 }}
              >
                {showSignsSuggestions ? "Hide hints" : `${contextualHints.length} hint${contextualHints.length !== 1 ? "s" : ""}`}
              </button>
            )}
          </div>

          <div style={{ position: "relative", width: "100%" }}>
            <textarea
              value={data.signsSymptoms}
              onChange={(e) => onChange("signsSymptoms", e.target.value)}
              placeholder="As evidenced by…"
              style={{
                padding: "7px 9px",
                border: "1px solid #e2e8f0", borderRadius: "6px",
                fontSize: "0.85rem", minHeight: "72px", resize: "vertical",
                width: "100%", boxSizing: "border-box", fontFamily: "inherit",
              }}
            />
          </div>

          {showSignsSuggestions && data.problem && (
            <SignsSuggestions
              problem={data.problem}
              currentSigns={data.signsSymptoms}
              anthro={anthro}
              dietary={dietary}
              clinical={clinical}
              calculatedMetrics={calculatedMetrics}
              onAppend={handleSignsAppend}
              onRemove={handleSignsRemove}
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
  anthro?: any;
  dietary?: any;
  clinical?: any;
  calculatedMetrics?: any;
}

let _nextId = 2;
function newDx() {
  return { id: _nextId++, problem: "", etiology: "", signsSymptoms: "" };
}

export default function DiagnosisDomain({ diagnosis, setDiagnosis, anthro, dietary, clinical, calculatedMetrics }: DiagnosisDomainProps) {
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

  const pesOptions = useMemo(() => {
    const list: string[] = [];
    if (diagnosis.problem) list.push(diagnosis.problem);
    (diagnosis.additionalDiagnoses || []).forEach((dx: any) => {
      if (dx.problem) list.push(dx.problem);
    });
    return list;
  }, [diagnosis.problem, diagnosis.additionalDiagnoses]);

  // Auto-select if only one option exists
  useEffect(() => {
    if (pesOptions.length === 1 && diagnosis.priorityRanking !== pesOptions[0]) {
      update("priorityRanking", pesOptions[0]);
    } else if (pesOptions.length === 0 && diagnosis.priorityRanking !== "") {
      update("priorityRanking", "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pesOptions]);

  return (
    <div className="fade-in">
      <DomainHeader title="Dx. Nutrition Diagnosis" />

      {/* ASPEN Malnutrition Engine */}
      <MalnutritionTable anthro={anthro} dietary={dietary} clinical={clinical} calculatedMetrics={calculatedMetrics} />

      {/* PES Builder */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <SectionHeader title="PES Statement Builder" subtitle="Problem · Etiology · Signs/Symptoms" color="#3498db" />
          <button
            onClick={addDx}
            style={{ background: "#8e44ad", color: "#fff", border: "none", borderRadius: "6px", padding: "6px 14px", cursor: "pointer", fontSize: "0.8rem", fontWeight: 700, whiteSpace: "nowrap" }}
          >
            + Add Diagnosis
          </button>
        </div>

        {/* Primary PES */}
        <PESCard
          index={0}
          isPrimary={true}
          data={{ problem: diagnosis.problem || "", etiology: diagnosis.etiology || "", signsSymptoms: diagnosis.signsSymptoms || "" }}
          onChange={(field, val) => update(field, val)}
          anthro={anthro}
          dietary={dietary}
          clinical={clinical}
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
            clinical={clinical}
            calculatedMetrics={calculatedMetrics}
          />
        ))}
      </div>

      {/* Priority ranking + narrative */}
      <div className="card">
        <SectionHeader title="Diagnostic Narrative & Priority" color="#3498db" />

        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1rem", background: "#f8fafc", padding: "8px 12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
          <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#1e293b", whiteSpace: "nowrap" }}>First Priority:</span>
          <Tooltip text={pesOptions.length === 1 ? "Only one PES statement defined; auto-selected as priority." : pesOptions.length === 0 ? "No diagnoses defined yet." : ""}>
            <select
              value={diagnosis.priorityRanking || ""}
              onChange={(e) => update("priorityRanking", e.target.value)}
              disabled={pesOptions.length <= 1}
              style={{
                flex: 1,
                padding: "6px 10px",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                fontSize: "0.88rem",
                outline: "none",
                background: pesOptions.length <= 1 ? "#f1f5f9" : "#fff",
                cursor: pesOptions.length <= 1 ? "not-allowed" : "pointer",
                width: "100%",
              }}
            >
              {pesOptions.length === 0 ? (
                <option value="">— No diagnoses defined —</option>
              ) : (
                <>
                  <option value="">— Select primary diagnosis —</option>
                  {pesOptions.map((opt, i) => (
                    <option key={i} value={opt}>{opt}</option>
                  ))}
                </>
              )}
            </select>
          </Tooltip>
        </div>

        <div className="input-group">
          <label>Nutrition Diagnosis Narrative</label>
          <textarea
            value={diagnosis.nutritionDxNarrative || ""}
            onChange={(e) => update("nutritionDxNarrative", e.target.value)}
            placeholder="Summarize the nutrition diagnosis in clinical language…"
            style={{ minHeight: "80px" }}
          />
        </div>
      </div>
    </div>
  );
}