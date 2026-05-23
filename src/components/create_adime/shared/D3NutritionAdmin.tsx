import React, { useState } from "react";

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface Dietary {
  dietOrder?: string;
  actualIntake?: string;
  oralCalories?: string | number;
  oralProtein?: string | number;
  oralWater?: string | number;
  [key: string]: any;
}

export interface ENFeed {
  id: number;
  label: string;
  route: string;
  type: string;
  formula: string;
  bolusMl: string | number;
  bolusTimesPerDay: string | number;
  bolusEveryHrs: string | number;
  continuousRate: string | number;
  continuousHrs: string | number;
  flushMl: string | number;
  flushTimesPerDay: string | number;
  flushEveryHrs: string | number;
  calPerMl: string | number;
  protGPerL: string | number;
  fwPct: string | number;
  expanded: boolean;
}

export interface MicroNutrientParams {
  amount?: string | number;
  unit?: string;
  rate?: string;
}

export interface PNFeed {
  id: number;
  label: string;
  indication: string;
  route: string;
  access: string;
  startDate: string;
  startTime: string;
  goal: string;
  durationPlan: string;
  delivery: string;
  dextType: string;
  dextHrs: string | number;
  dextAmount: string | number;
  dextAmountUnit: string;
  dextRateUnit: string;
  dextConc: string | number;
  aaType: string;
  aaHrs: string | number;
  aaAmount: string | number;
  aaAmountUnit: string;
  aaRateUnit: string;
  lipidType: string;
  lipidHrs: string | number;
  lipidOil: string;
  lipidAmount: string | number;
  lipidAmountUnit: string;
  lipidRateUnit: string;
  lipidCustomOil: string;
  insulinUnits: string | number;
  totalVolumeHrs: string | number;
  electrolytes: Record<string, MicroNutrientParams>;
  vitamins: Record<string, MicroNutrientParams>;
  expanded: boolean;
  electroExpanded: boolean;
  vitExpanded: boolean;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const EN_ROUTES: string[] = [
  "NG (Nasogastric)", "NJ (Nasojejunal)", "ND (Nasoduodenal)",
  "OG (Orogastric)", "OJ (Orojejunal)",
  "PEG (Percutaneous Endoscopic Gastrostomy)",
  "PEG-J (PEG with Jejunal Extension)",
  "PRG (Percutaneous Radiologic Gastrostomy)",
  "PRG-J (PRG with Jejunal Extension)",
  "Low-Profile G (Button)", "Low-Profile G-J (Button with Jejunal Ext.)",
  "PEJ (Percutaneous Endoscopic Jejunostomy)",
  "Surgical Gastrostomy (Open/Laparoscopic)",
  "Surgical Jejunostomy (Open/Laparoscopic)",
  "PICC-NJ (PICC-guided Nasojejunal)",
  "Other (specify in notes)",
];

const PN_ROUTES: string[] = ["Central", "Peripheral"];
const PN_ACCESS: string[] = ["PICC", "CVC (Central Venous Catheter)", "Port-a-Cath", "PIV (Peripheral IV)", "Multi-lumen (specify lumen)", "Tunneled CVC", "Other"];
const PN_GOALS: string[] = ["Full (sole source)", "Supplemental", "Bridging"];
const PN_DURATIONS: string[] = ["Continuous", "Cyclic", "Taper"];
const PN_DELIVERY: string[] = ["3-in-1 (TNA)", "2-in-1 + Separate Lipid Infusion", "3 Fully Separated Macros", "Module-Based", "Transitioning (Define Phases)"];
const DEXTROSE_TYPES: string[] = ["Premade PN Base", "Compounded", "Separate Infusion"];
const AA_TYPES: string[] = ["Premade PN Base", "Compounded", "Separate Module"];
const LIPID_TYPES_ADMIN: string[] = ["Premade PN Base", "Compounded", "Separate Infusion"];
const LIPID_OILS: string[] = ["Soybean (SO)", "SMOF (Soy/MCT/Olive/Fish)", "Custom (specify)"];
const AMOUNT_UNITS: string[] = ["%", "mcg", "mg", "g", "mL", "L", "mEq", "mmol"];
const RATE_UNITS: string[] = ["per hour", "per day"];

const ELECTROLYTES: { key: string; label: string }[] = [
  { key: "na", label: "Na (Sodium)" },
  { key: "k", label: "K (Potassium)" },
  { key: "cl", label: "Cl (Chloride)" },
  { key: "acetate", label: "Acetate" },
  { key: "mg", label: "Mg (Magnesium)" },
  { key: "phos", label: "Phos (Phosphate)" },
  { key: "ca", label: "Ca (Calcium)" },
  { key: "zn", label: "Zn (Zinc)" },
  { key: "cu", label: "Cu (Copper)" },
  { key: "se", label: "Se (Selenium)" },
  { key: "mn", label: "Mn (Manganese)" },
  { key: "cr", label: "Cr (Chromium)" },
  { key: "fe", label: "Fe (Iron)" },
  { key: "i", label: "I (Iodine)" },
  { key: "mo", label: "Mo (Molybdenum)" },
];

const VITAMINS: { key: string; label: string }[] = [
  { key: "b1", label: "B1 – Thiamine" },
  { key: "b2", label: "B2 – Riboflavin" },
  { key: "b3", label: "B3 – Niacin" },
  { key: "b5", label: "B5 – Pantothenic Acid" },
  { key: "b6", label: "B6 – Pyridoxine" },
  { key: "b7", label: "B7 – Biotin" },
  { key: "b9", label: "B9 – Folic Acid" },
  { key: "b12", label: "B12 – Cobalamin" },
  { key: "vitC", label: "Vit C – Ascorbic Acid" },
  { key: "vitA", label: "Vit A – Retinol" },
  { key: "vitD", label: "Vit D – Cholecalciferol" },
  { key: "vitE", label: "Vit E – Tocopherol" },
  { key: "vitK", label: "Vit K" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const num = (v: string | number | undefined | null): number => (typeof v === "string" ? parseFloat(v) : v) || 0;

function calcENNutrients(feed: ENFeed) {
  const calPerMl = num(feed.calPerMl);
  const protGPerL = num(feed.protGPerL);
  const fwPct = num(feed.fwPct);

  let formulaMl = 0;
  if (feed.type === "bolus") {
    formulaMl = num(feed.bolusMl) * num(feed.bolusTimesPerDay);
  } else {
    formulaMl = num(feed.continuousRate) * num(feed.continuousHrs);
  }

  const flushMl = num(feed.flushMl) * num(feed.flushTimesPerDay);

  const totalCal = formulaMl * calPerMl;
  const totalProt = (formulaMl / 1000) * protGPerL;
  const formulaFw = formulaMl * (fwPct / 100);

  return {
    totalMl: formulaMl + flushMl,       // total volume = formula + flushes
    totalCal: Math.round(totalCal),      // cal from formula only
    totalProt: Math.round(totalProt * 10) / 10,  // protein from formula only
    totalFw: Math.round(formulaFw),      // free water from formula only
    flushMl: Math.round(flushMl),        // flush water, pure H₂O
  };
}

function makeENFeed(id: number): ENFeed {
  return {
    id,
    label: `Feed ${id}`,
    route: "",
    type: "continuous",
    formula: "",
    bolusMl: "",
    bolusTimesPerDay: "",
    bolusEveryHrs: "",
    continuousRate: "",
    continuousHrs: "",
    flushMl: "",
    flushTimesPerDay: "",
    flushEveryHrs: "",
    calPerMl: "",
    protGPerL: "",
    fwPct: "",
    expanded: true,
  };
}

function makePNFeed(id: number): PNFeed {
  return {
    id,
    label: `PN Bag ${id}`,
    indication: "",
    route: "",
    access: "",
    startDate: "",
    startTime: "",
    goal: "",
    durationPlan: "",
    delivery: "",
    dextType: "",
    dextHrs: "",
    dextAmount: "",
    dextAmountUnit: "g",
    dextRateUnit: "per day",
    dextConc: "",
    aaType: "",
    aaHrs: "",
    aaAmount: "",
    aaAmountUnit: "g",
    aaRateUnit: "per day",
    lipidType: "",
    lipidHrs: "",
    lipidOil: "",
    lipidAmount: "",
    lipidAmountUnit: "g",
    lipidRateUnit: "per day",
    lipidCustomOil: "",
    insulinUnits: "",
    totalVolumeHrs: "",
    electrolytes: {},
    vitamins: {},
    expanded: true,
    electroExpanded: false,
    vitExpanded: false,
  };
}

// ─── Sub-components ──────────────────────────────────────────────────────────

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  color?: string;
}

function SectionHeader({ title, subtitle, color = "#3498db" }: SectionHeaderProps) {
  return (
    <div style={{ borderLeft: `4px solid ${color}`, paddingLeft: "12px", marginBottom: "1.25rem" }}>
      <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--primary, #2c3e50)" }}>{title}</div>
      {subtitle && <div style={{ fontSize: "0.8rem", color: "#718096", marginTop: "2px" }}>{subtitle}</div>}
    </div>
  );
}

interface NutrientChipProps {
  label: string;
  value: string | number;
  unit: string;
  color?: string;
}

function NutrientChip({ label, value, unit, color = "#3498db" }: NutrientChipProps) {
  return (
    <div style={{
      background: `${color}12`,
      border: `1px solid ${color}40`,
      borderRadius: "8px",
      padding: "8px 14px",
      textAlign: "center",
      minWidth: "100px",
    }}>
      <div style={{ fontSize: "0.7rem", color: "#718096", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
      <div style={{ fontSize: "1.1rem", fontWeight: 700, color, marginTop: "2px" }}>
        {value}<span style={{ fontSize: "0.7rem", marginLeft: "2px", fontWeight: 400 }}>{unit}</span>
      </div>
    </div>
  );
}

interface CollapseHeaderProps {
  label: string;
  expanded: boolean;
  onToggle: () => void;
  accent?: string;
  badge?: string | null;
}

function CollapseHeader({ label, expanded, onToggle, accent = "#3498db", badge = null }: CollapseHeaderProps) {
  return (
    <div
      onClick={onToggle}
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        cursor: "pointer", userSelect: "none",
        padding: "10px 14px",
        background: `${accent}08`,
        border: `1px solid ${accent}30`,
        borderRadius: expanded ? "8px 8px 0 0" : "8px",
        marginBottom: expanded ? 0 : "0.5rem",
        transition: "border-radius 0.2s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontSize: "0.9rem", fontWeight: 600, color: accent }}>{label}</span>
        {badge && <span style={{ fontSize: "0.75rem", background: `${accent}20`, color: accent, borderRadius: "12px", padding: "2px 10px" }}>{badge}</span>}
      </div>
      <span style={{ color: accent, fontSize: "0.75rem" }}>{expanded ? "▲" : "▼"}</span>
    </div>
  );
}

interface FieldRowProps {
  label: string;
  children: React.ReactNode;
  hint?: string;
}

function FieldRow({ label, children, hint }: FieldRowProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#34495e" }}>{label}</label>
      {children}
      {hint && <span style={{ fontSize: "0.7rem", color: "#a0aec0" }}>{hint}</span>}
    </div>
  );
}

interface NumInputProps {
  value: string | number;
  onChange: (val: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
}

function NumInput({ value, onChange, placeholder = "0", style = {} }: NumInputProps) {
  return (
    <input
      type="number"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{ padding: "5px 8px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "0.88rem", width: "100%", boxSizing: "border-box", ...style }}
    />
  );
}

interface SelProps {
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder?: string;
}

function Sel({ value, onChange, options, placeholder = "Select..." }: SelProps) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{ padding: "5px 8px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "0.88rem", width: "100%", boxSizing: "border-box" }}
    >
      <option value="">{placeholder}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

interface AmountRateInputProps {
  amount: string | number;
  amountUnit: string;
  rateUnit: string;
  onAmount: (val: string) => void;
  onAmountUnit: (val: string) => void;
  onRateUnit: (val: string) => void;
}

function AmountRateInput({ amount, amountUnit, rateUnit, onAmount, onAmountUnit, onRateUnit }: AmountRateInputProps) {
  return (
    <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
      <NumInput value={amount} onChange={onAmount} style={{ flex: 1 }} />
      <select value={amountUnit} onChange={e => onAmountUnit(e.target.value)}
        style={{ padding: "5px 4px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "0.8rem", width: "62px" }}>
        {AMOUNT_UNITS.map(u => <option key={u}>{u}</option>)}
      </select>
      <select value={rateUnit} onChange={e => onRateUnit(e.target.value)}
        style={{ padding: "5px 4px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "0.8rem", width: "80px" }}>
        {RATE_UNITS.map(u => <option key={u}>{u}</option>)}
      </select>
    </div>
  );
}

// ─── D31: Oral Nutrition ─────────────────────────────────────────────────────

interface D31OralProps {
  dietary: Dietary;
  setDietary: (d: Dietary) => void;
}

function D31Oral({ dietary, setDietary }: D31OralProps) {
  const handleUpdate = (field: string, val: string) => setDietary({ ...dietary, [field]: val });

  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <div className="card">
        <SectionHeader title="D31: Oral Diet Order vs Intake" color="#3498db" />
        <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
          <div style={{ flex: 1 }} className="input-group">
            <label>Prescribed Diet Order</label>
            <textarea
              value={dietary.dietOrder || "Standard Diet, Regular"}
              onChange={e => handleUpdate("dietOrder", e.target.value)}
              style={{ background: "#edf2f7", minHeight: "90px" }}
            />
          </div>
          <div style={{ flex: 1 }} className="input-group">
            <label>Actual Intake Documented</label>
            <textarea
              value={dietary.actualIntake || ""}
              onChange={e => handleUpdate("actualIntake", e.target.value)}
              placeholder="Compare with prescribed..."
              style={{ minHeight: "90px" }}
            />
          </div>
        </div>

        <div style={{
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: "8px",
          padding: "1rem",
          marginTop: "0.5rem",
        }}>
          <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#718096", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Estimated Oral Nutrient Intake
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
            <FieldRow label="Calories (kcal/day)">
              <NumInput value={dietary.oralCalories || ""} onChange={v => handleUpdate("oralCalories", v)} placeholder="e.g. 1800" />
            </FieldRow>
            <FieldRow label="Protein (g/day)">
              <NumInput value={dietary.oralProtein || ""} onChange={v => handleUpdate("oralProtein", v)} placeholder="e.g. 75" />
            </FieldRow>
            <FieldRow label="Water / Fluid (mL/day)">
              <NumInput value={dietary.oralWater || ""} onChange={v => handleUpdate("oralWater", v)} placeholder="e.g. 1500" />
            </FieldRow>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── D32: Enteral Nutrition ──────────────────────────────────────────────────

interface ENFeedCardProps {
  feed: ENFeed;
  idx: number;
  onChange: (updated: ENFeed) => void;
  onRemove: () => void;
  savedFormulas: string[];
  onAddFormula: (name: string) => void;
}

function ENFeedCard({ feed, idx, onChange, onRemove, savedFormulas, onAddFormula }: ENFeedCardProps) {
  const update = (field: keyof ENFeed, val: any) => onChange({ ...feed, [field]: val });
  const nutrients = calcENNutrients(feed);
  const isExpanded = feed.expanded;

  const formulaOptions = ["+ Add new formula...", ...savedFormulas];

  const handleFormulaChange = (val: string) => {
    if (val === "+ Add new formula...") {
      const name = prompt("Enter formula name:");
      if (name && name.trim()) {
        onAddFormula(name.trim());
        update("formula", name.trim());
      }
    } else {
      update("formula", val);
    }
  };

  return (
    <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", marginBottom: "1rem", overflow: "hidden" }}>
      <CollapseHeader
        label={feed.label || `Feed ${idx + 1}`}
        expanded={isExpanded}
        onToggle={() => update("expanded", !isExpanded)}
        accent="#27ae60"
        badge={feed.route ? feed.route.split(" ")[0] : null}
      />

      {isExpanded && (
        <div style={{ padding: "1rem", borderTop: "1px solid #e2e8f0", background: "#fff" }}>
          {/* Label & Route */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "0.75rem", marginBottom: "1rem" }}>
            <FieldRow label="Feed Label">
              <input
                type="text"
                value={feed.label}
                onChange={e => update("label", e.target.value)}
                placeholder={`Feed ${idx + 1}`}
                style={{ padding: "5px 8px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "0.88rem" }}
              />
            </FieldRow>
            <FieldRow label="Route & Access">
              <Sel value={feed.route} onChange={v => update("route", v)} options={EN_ROUTES} placeholder="Select route..." />
            </FieldRow>
          </div>

          {/* Type toggle */}
          <div style={{ marginBottom: "1rem" }}>
            <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "#34495e", marginBottom: "6px" }}>Delivery Type</div>
            <div style={{ display: "flex", gap: "8px" }}>
              {["continuous", "bolus"].map(t => (
                <button
                  key={t}
                  onClick={() => update("type", t)}
                  style={{
                    padding: "6px 18px", borderRadius: "20px", border: "1px solid",
                    borderColor: feed.type === t ? "#27ae60" : "#e2e8f0",
                    background: feed.type === t ? "#27ae60" : "transparent",
                    color: feed.type === t ? "#fff" : "#555",
                    fontWeight: 600, fontSize: "0.83rem", cursor: "pointer",
                  }}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Formula */}
          <div style={{ marginBottom: "1rem" }}>
            <FieldRow label="Formula">
              <select
                value={feed.formula}
                onChange={e => handleFormulaChange(e.target.value)}
                style={{ padding: "5px 8px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "0.88rem", width: "100%" }}
              >
                <option value="">Select or add formula...</option>
                {formulaOptions.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </FieldRow>
          </div>

          {/* Type-specific inputs */}
          {feed.type === "bolus" ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem", marginBottom: "1rem" }}>
              <FieldRow label="mL per bolus">
                <NumInput value={feed.bolusMl} onChange={v => update("bolusMl", v)} />
              </FieldRow>
              <FieldRow label="Times per day">
                <NumInput value={feed.bolusTimesPerDay} onChange={v => update("bolusTimesPerDay", v)} />
              </FieldRow>
              <FieldRow label="Every (hrs)">
                <NumInput value={feed.bolusEveryHrs} onChange={v => update("bolusEveryHrs", v)} />
              </FieldRow>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
              <FieldRow label="Rate (mL/hr)">
                <NumInput value={feed.continuousRate} onChange={v => update("continuousRate", v)} />
              </FieldRow>
              <FieldRow label="Hours per day">
                <NumInput value={feed.continuousHrs} onChange={v => update("continuousHrs", v)} />
              </FieldRow>
            </div>
          )}

          {/* Flushes */}
          <div style={{ background: "#f8fafc", borderRadius: "6px", padding: "0.75rem", marginBottom: "1rem" }}>
            <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#718096", marginBottom: "0.5rem" }}>Flushes</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem" }}>
              <FieldRow label="mL per flush">
                <NumInput value={feed.flushMl} onChange={v => update("flushMl", v)} />
              </FieldRow>
              <FieldRow label="Times per day">
                <NumInput value={feed.flushTimesPerDay} onChange={v => update("flushTimesPerDay", v)} />
              </FieldRow>
              <FieldRow label="Every (hrs)">
                <NumInput value={feed.flushEveryHrs} onChange={v => update("flushEveryHrs", v)} />
              </FieldRow>
            </div>
          </div>

          {/* Formula properties */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem", marginBottom: "1rem" }}>
            <FieldRow label="Cal/mL" hint="e.g. 1.0, 1.5, 2.0">
              <NumInput value={feed.calPerMl} onChange={v => update("calPerMl", v)} placeholder="1.0" />
            </FieldRow>
            <FieldRow label="Protein (g/L)" hint="from formula label">
              <NumInput value={feed.protGPerL} onChange={v => update("protGPerL", v)} placeholder="44" />
            </FieldRow>
            <FieldRow label="Free Water (%)" hint="0–100">
              <NumInput value={feed.fwPct} onChange={v => update("fwPct", v)} placeholder="85" />
            </FieldRow>
          </div>

          {/* Auto-calculated totals */}
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "0.25rem", paddingTop: "0.75rem", borderTop: "1px solid #f0f0f0" }}>
            <NutrientChip label="Volume" value={nutrients.totalMl} unit="mL/day" color="#3498db" />
            <NutrientChip label="Calories" value={nutrients.totalCal} unit="kcal/day" color="#e67e22" />
            <NutrientChip label="Protein" value={nutrients.totalProt} unit="g/day" color="#8e44ad" />
            <NutrientChip label="Free Water" value={nutrients.totalFw} unit="mL/day" color="#27ae60" />
            <NutrientChip label="Flush Water" value={nutrients.flushMl} unit="mL/day" color="#0891b2" />
          </div>

          <button
            onClick={onRemove}
            style={{ marginTop: "0.75rem", background: "none", border: "1px solid #e74c3c", color: "#e74c3c", borderRadius: "4px", padding: "4px 12px", cursor: "pointer", fontSize: "0.8rem" }}
          >
            Remove Feed
          </button>
        </div>
      )}
    </div>
  );
}



function D32Enteral() {
  const [enFeeds, setEnFeeds] = useState<ENFeed[]>([makeENFeed(1)]);
  const [savedFormulas, setSavedFormulas] = useState<string[]>([]);
  const [nextId, setNextId] = useState<number>(2);

  const addFeed = () => {
    setEnFeeds([...enFeeds, makeENFeed(nextId)]);
    setNextId(nextId + 1);
  };

  const updateFeed = (id: number, updated: ENFeed) => setEnFeeds(enFeeds.map(f => f.id === id ? updated : f));
  const removeFeed = (id: number) => setEnFeeds(enFeeds.filter(f => f.id !== id));
  const addFormula = (name: string) => setSavedFormulas([...savedFormulas, name]);

  const totals = enFeeds.reduce((acc, f) => {
    const n = calcENNutrients(f);
    return {
      vol: acc.vol + n.totalMl,
      cal: acc.cal + n.totalCal,
      prot: acc.prot + n.totalProt,
      fw: acc.fw + n.totalFw,
      flush: acc.flush + n.flushMl,
    };
  }, { vol: 0, cal: 0, prot: 0, fw: 0, flush: 0 });

  return (
    <div className="card" style={{ marginBottom: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
        <SectionHeader title="D32: Enteral Nutrition (EN)" subtitle="Add one entry per formula or delivery method" color="#27ae60" />
        <button
          onClick={addFeed}
          style={{ background: "#27ae60", color: "#fff", border: "none", borderRadius: "6px", padding: "8px 16px", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, whiteSpace: "nowrap" }}
        >
          + Add Feed
        </button>
      </div>

      {enFeeds.map((feed, idx) => (
        <ENFeedCard
          key={feed.id}
          feed={feed}
          idx={idx}
          onChange={updated => updateFeed(feed.id, updated)}
          onRemove={() => removeFeed(feed.id)}
          savedFormulas={savedFormulas}
          onAddFormula={addFormula}
        />
      ))}

      {enFeeds.length > 1 && (
        <div style={{ background: "#f0fff4", border: "1px solid #9ae6b4", borderRadius: "8px", padding: "1rem", marginTop: "0.5rem" }}>
          <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#276749", marginBottom: "0.75rem" }}>Total EN Delivery (All Feeds Combined)</div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <NutrientChip label="Total Volume" value={Math.round(totals.vol)} unit="mL/day" color="#27ae60" />
            <NutrientChip label="Total Calories" value={Math.round(totals.cal)} unit="kcal/day" color="#e67e22" />
            <NutrientChip label="Total Protein" value={Math.round(totals.prot * 10) / 10} unit="g/day" color="#8e44ad" />
            <NutrientChip label="Total Free Water" value={Math.round(totals.fw)} unit="mL/day" color="#3498db" />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── D33: Parenteral Nutrition ───────────────────────────────────────────────

interface MicroPanelProps {
  title: string;
  fields: { key: string; label: string }[];
  values: Record<string, MicroNutrientParams>;
  onChange: (key: string, subField: string, val: string) => void;
  accent: string;
  expanded: boolean;
  onToggle: () => void;
}

function MicroPanel({ title, fields, values, onChange, accent, expanded, onToggle }: MicroPanelProps) {
  return (
    <div style={{ marginTop: "0.75rem", border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden" }}>
      <CollapseHeader label={title} expanded={expanded} onToggle={onToggle} accent={accent} />
      {expanded && (
        <div style={{ padding: "0.75rem", background: "#fff", borderTop: "1px solid #e2e8f0" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "0.6rem" }}>
            {fields.map(f => (
              <FieldRow key={f.key} label={f.label}>
                <div style={{ display: "flex", gap: "4px" }}>
                  <NumInput value={values[f.key]?.amount || ""} onChange={v => onChange(f.key, "amount", v)} style={{ flex: 1 }} />
                  <select
                    value={values[f.key]?.unit || "mEq"}
                    onChange={e => onChange(f.key, "unit", e.target.value)}
                    style={{ padding: "5px 4px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "0.78rem", width: "58px" }}
                  >
                    {AMOUNT_UNITS.map(u => <option key={u}>{u}</option>)}
                  </select>
                  <select
                    value={values[f.key]?.rate || "per day"}
                    onChange={e => onChange(f.key, "rate", e.target.value)}
                    style={{ padding: "5px 4px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "0.78rem", width: "72px" }}
                  >
                    {RATE_UNITS.map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
              </FieldRow>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface PNFeedCardProps {
  feed: PNFeed;
  idx: number;
  onChange: (updated: PNFeed) => void;
  onRemove: () => void;
}

function PNFeedCard({ feed, idx, onChange, onRemove }: PNFeedCardProps) {
  const update = (field: keyof PNFeed, val: any) => onChange({ ...feed, [field]: val });
  const isExpanded = feed.expanded;

  const updateElectrolyte = (key: string, subField: string, val: string) => {
    onChange({
      ...feed,
      electrolytes: {
        ...feed.electrolytes,
        [key]: { ...(feed.electrolytes[key] || {}), [subField]: val },
      }
    });
  };

  const updateVitamin = (key: string, subField: string, val: string) => {
    onChange({
      ...feed,
      vitamins: {
        ...feed.vitamins,
        [key]: { ...(feed.vitamins[key] || {}), [subField]: val },
      }
    });
  };

  // Rough daily calorie estimate
  const dextCal = num(feed.dextAmount) * (feed.dextAmountUnit === "g" ? 3.4 : 0);
  const aaCal = num(feed.aaAmount) * (feed.aaAmountUnit === "g" ? 4 : 0);
  const lipidCal = num(feed.lipidAmount) * (feed.lipidAmountUnit === "g" ? 10 : 0);
  const totalCal = Math.round(dextCal + aaCal + lipidCal);
  const totalProt = feed.aaAmountUnit === "g" ? Math.round(num(feed.aaAmount) * 10) / 10 : "?";
  const totalWater = num(feed.totalVolumeHrs) * 24;

  return (
    <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", marginBottom: "1rem", overflow: "hidden" }}>
      <CollapseHeader
        label={feed.label || `PN Bag ${idx + 1}`}
        expanded={isExpanded}
        onToggle={() => update("expanded", !isExpanded)}
        accent="#8e44ad"
        badge={feed.route || null}
      />

      {isExpanded && (
        <div style={{ padding: "1rem", borderTop: "1px solid #e2e8f0", background: "#fff" }}>

          {/* Header info */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
            <FieldRow label="Bag Label">
              <input
                type="text" value={feed.label}
                onChange={e => update("label", e.target.value)}
                placeholder={`PN Bag ${idx + 1}`}
                style={{ padding: "5px 8px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "0.88rem" }}
              />
            </FieldRow>
            <FieldRow label="Indication / Reason for PN">
              <input
                type="text" value={feed.indication}
                onChange={e => update("indication", e.target.value)}
                placeholder="e.g. GI failure, post-op ileus..."
                style={{ padding: "5px 8px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "0.88rem" }}
              />
            </FieldRow>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem", marginBottom: "1rem" }}>
            <FieldRow label="Route">
              <Sel value={feed.route} onChange={v => update("route", v)} options={PN_ROUTES} />
            </FieldRow>
            <FieldRow label="Access Line">
              <Sel value={feed.access} onChange={v => update("access", v)} options={PN_ACCESS} />
            </FieldRow>
            <FieldRow label="Goal">
              <Sel value={feed.goal} onChange={v => update("goal", v)} options={PN_GOALS} />
            </FieldRow>
            <FieldRow label="Duration Plan">
              <Sel value={feed.durationPlan} onChange={v => update("durationPlan", v)} options={PN_DURATIONS} />
            </FieldRow>
            <FieldRow label="Delivery Method">
              <Sel value={feed.delivery} onChange={v => update("delivery", v)} options={PN_DELIVERY} />
            </FieldRow>
            <FieldRow label="Total Volume / Rate (mL/hr)">
              <NumInput value={feed.totalVolumeHrs} onChange={v => update("totalVolumeHrs", v)} placeholder="e.g. 80" />
            </FieldRow>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
            <FieldRow label="Start Date">
              <input type="date" value={feed.startDate} onChange={e => update("startDate", e.target.value)}
                style={{ padding: "5px 8px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "0.88rem" }} />
            </FieldRow>
            <FieldRow label="Start Time">
              <input type="time" value={feed.startTime} onChange={e => update("startTime", e.target.value)}
                style={{ padding: "5px 8px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "0.88rem" }} />
            </FieldRow>
          </div>

          {/* Macros */}
          <div style={{ background: "#faf5ff", border: "1px solid #e9d8fd", borderRadius: "8px", padding: "1rem", marginBottom: "1rem" }}>
            <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#6b46c1", marginBottom: "0.75rem", textTransform: "uppercase" }}>Macronutrients</div>

            {/* Dextrose */}
            <div style={{ marginBottom: "1rem" }}>
              <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#4a5568", marginBottom: "0.5rem" }}>Dextrose</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.6rem" }}>
                <FieldRow label="Type">
                  <Sel value={feed.dextType} onChange={v => update("dextType", v)} options={DEXTROSE_TYPES} />
                </FieldRow>
                <FieldRow label="Hours">
                  <NumInput value={feed.dextHrs} onChange={v => update("dextHrs", v)} placeholder="24" />
                </FieldRow>
                <FieldRow label={feed.dextType === "Separate Infusion" ? "Concentration (D___)" : "Amount"}>
                  {feed.dextType === "Separate Infusion" ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <span style={{ fontSize: "0.9rem", fontWeight: 600 }}>D</span>
                      <NumInput value={feed.dextConc} onChange={v => update("dextConc", v)} placeholder="10" style={{ flex: 1 }} />
                      <span style={{ fontSize: "0.8rem", color: "#718096" }}>%</span>
                    </div>
                  ) : (
                    <AmountRateInput
                      amount={feed.dextAmount} amountUnit={feed.dextAmountUnit} rateUnit={feed.dextRateUnit}
                      onAmount={v => update("dextAmount", v)}
                      onAmountUnit={v => update("dextAmountUnit", v)}
                      onRateUnit={v => update("dextRateUnit", v)}
                    />
                  )}
                </FieldRow>
              </div>
            </div>

            {/* Amino Acids */}
            <div style={{ marginBottom: "1rem" }}>
              <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#4a5568", marginBottom: "0.5rem" }}>Amino Acids</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.6rem" }}>
                <FieldRow label="Type">
                  <Sel value={feed.aaType} onChange={v => update("aaType", v)} options={AA_TYPES} />
                </FieldRow>
                <FieldRow label="Hours">
                  <NumInput value={feed.aaHrs} onChange={v => update("aaHrs", v)} placeholder="24" />
                </FieldRow>
                <FieldRow label="Amount">
                  <AmountRateInput
                    amount={feed.aaAmount} amountUnit={feed.aaAmountUnit} rateUnit={feed.aaRateUnit}
                    onAmount={v => update("aaAmount", v)}
                    onAmountUnit={v => update("aaAmountUnit", v)}
                    onRateUnit={v => update("aaRateUnit", v)}
                  />
                </FieldRow>
              </div>
            </div>

            {/* Lipids */}
            <div>
              <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#4a5568", marginBottom: "0.5rem" }}>Lipids (ILE)</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.6rem" }}>
                <FieldRow label="Admin Type">
                  <Sel value={feed.lipidType} onChange={v => update("lipidType", v)} options={LIPID_TYPES_ADMIN} />
                </FieldRow>
                <FieldRow label="Hours">
                  <NumInput value={feed.lipidHrs} onChange={v => update("lipidHrs", v)} placeholder="12" />
                </FieldRow>
                <FieldRow label="Oil">
                  <Sel value={feed.lipidOil} onChange={v => update("lipidOil", v)} options={LIPID_OILS} />
                </FieldRow>
                <FieldRow label="Amount">
                  <AmountRateInput
                    amount={feed.lipidAmount} amountUnit={feed.lipidAmountUnit} rateUnit={feed.lipidRateUnit}
                    onAmount={v => update("lipidAmount", v)}
                    onAmountUnit={v => update("lipidAmountUnit", v)}
                    onRateUnit={v => update("lipidRateUnit", v)}
                  />
                </FieldRow>
              </div>
              {feed.lipidOil === "Custom (specify)" && (
                <div style={{ marginTop: "0.5rem" }}>
                  <input type="text" value={feed.lipidCustomOil} onChange={e => update("lipidCustomOil", e.target.value)}
                    placeholder="Specify oil blend..."
                    style={{ padding: "5px 8px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "0.88rem", width: "100%", boxSizing: "border-box" }} />
                </div>
              )}
            </div>

            {/* Insulin */}
            <div style={{ marginTop: "0.75rem", display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#4a5568" }}>Regular Insulin:</span>
              <NumInput value={feed.insulinUnits} onChange={v => update("insulinUnits", v)} placeholder="units" style={{ width: "90px" }} />
              <span style={{ fontSize: "0.8rem", color: "#718096" }}>units/bag</span>
            </div>
          </div>

          {/* Nutrients summary */}
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "1rem", padding: "0.75rem", background: "#f8f4ff", borderRadius: "8px", border: "1px solid #e9d8fd" }}>
            <NutrientChip label="Est. Total Water" value={totalWater > 0 ? Math.round(totalWater) : "—"} unit="mL/day" color="#3498db" />
            <NutrientChip label="Est. Calories" value={totalCal > 0 ? totalCal : "—"} unit="kcal/day" color="#e67e22" />
            <NutrientChip label="Est. Protein" value={totalProt} unit="g/day" color="#8e44ad" />
            <NutrientChip label="Total Flush Water" value={Math.round(totals.flush)} unit="mL/day" color="#0891b2" />
          </div>

          {/* Electrolytes collapsible */}
          <MicroPanel
            title="Electrolytes & Trace Elements"
            fields={ELECTROLYTES}
            values={feed.electrolytes}
            onChange={updateElectrolyte}
            accent="#2980b9"
            expanded={feed.electroExpanded}
            onToggle={() => update("electroExpanded", !feed.electroExpanded)}
          />

          {/* Vitamins collapsible */}
          <MicroPanel
            title="Vitamins"
            fields={VITAMINS}
            values={feed.vitamins}
            onChange={updateVitamin}
            accent="#d35400"
            expanded={feed.vitExpanded}
            onToggle={() => update("vitExpanded", !feed.vitExpanded)}
          />

          <button
            onClick={onRemove}
            style={{ marginTop: "1rem", background: "none", border: "1px solid #e74c3c", color: "#e74c3c", borderRadius: "4px", padding: "4px 12px", cursor: "pointer", fontSize: "0.8rem" }}
          >
            Remove Bag
          </button>
        </div>
      )}
    </div>
  );
}

function D33Parenteral() {
  const [pnBags, setPnBags] = useState<PNFeed[]>([makePNFeed(1)]);
  const [nextId, setNextId] = useState<number>(2);

  const addBag = () => {
    setPnBags([...pnBags, makePNFeed(nextId)]);
    setNextId(nextId + 1);
  };
  const updateBag = (id: number, updated: PNFeed) => setPnBags(pnBags.map(b => b.id === id ? updated : b));
  const removeBag = (id: number) => setPnBags(pnBags.filter(b => b.id !== id));

  return (
    <div className="card" style={{ marginBottom: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
        <SectionHeader title="D33: Parenteral Nutrition (PN)" subtitle="Add one entry per PN bag order" color="#8e44ad" />
        <button
          onClick={addBag}
          style={{ background: "#8e44ad", color: "#fff", border: "none", borderRadius: "6px", padding: "8px 16px", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, whiteSpace: "nowrap" }}
        >
          + Add PN Bag
        </button>
      </div>

      {pnBags.map((bag, idx) => (
        <PNFeedCard
          key={bag.id}
          feed={bag}
          idx={idx}
          onChange={updated => updateBag(bag.id, updated)}
          onRemove={() => removeBag(bag.id)}
        />
      ))}
    </div>
  );
}

// ─── Tab Navigation ──────────────────────────────────────────────────────────

const TABS = [
  { id: "D31", label: "D31 – Oral", color: "#3498db" },
  { id: "D32", label: "D32 – Enteral", color: "#27ae60" },
  { id: "D33", label: "D33 – Parenteral", color: "#8e44ad" },
];

// ─── Root Component ──────────────────────────────────────────────────────────

interface D3NutritionAdminProps {
  dietary?: Dietary;
  setDietary?: (d: Dietary) => void;
}

export default function D3NutritionAdmin({ dietary = {}, setDietary = () => {} }: D3NutritionAdminProps) {
  const [activeTab, setActiveTab] = useState<string>("D31");

  return (
    <div className="fade-in">

      {/* Tab Bar */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "1.5rem", background: "#f4f7f6", padding: "4px", borderRadius: "10px", width: "fit-content" }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "8px 22px",
              border: "none",
              borderRadius: "7px",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "0.88rem",
              transition: "all 0.2s",
              background: activeTab === tab.id ? tab.color : "transparent",
              color: activeTab === tab.id ? "#fff" : "#718096",
              boxShadow: activeTab === tab.id ? "0 2px 6px rgba(0,0,0,0.15)" : "none",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "D31" && <D31Oral dietary={dietary} setDietary={setDietary} />}
      {activeTab === "D32" && <D32Enteral />} 
      {activeTab === "D33" && <D33Parenteral />}
    </div>
  );
}