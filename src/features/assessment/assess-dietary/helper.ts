// ─── Helpers ─────────────────────────────────────────────────────────────────
import { getLipidMeta } from "./constant";
import { ENFeed, PNFeed } from "../../../shared/types/index";

export const num = (v: string | number | undefined | null): number => (typeof v === "string" ? parseFloat(v) : v) || 0;

// Derive g and kcal from rate+conc. Returns null when inputs are blank/zero.
export function deriveDextrose(rateMlHr: string | number, hrs: string | number, concPct: string) {
  const r = num(rateMlHr), h = num(hrs), c = parseFloat(concPct) / 100;
  if (r <= 0 || h <= 0 || c <= 0) return null;
  const g = r * h * c;
  return { g, kcal: g * 3.4 };
}
export function deriveAA(rateMlHr: string | number, hrs: string | number, concPct: string) {
  const r = num(rateMlHr), h = num(hrs), c = parseFloat(concPct) / 100;
  if (r <= 0 || h <= 0 || c <= 0) return null;
  const g = r * h * c;
  return { g, kcal: g * 4 };
}
export function deriveLipid(rateMlHr: string | number, hrs: string | number, concPct: string, freq?: string) {
  const r = num(rateMlHr), h = num(hrs);
  const meta = getLipidMeta(concPct);
  if (r <= 0 || h <= 0) return null;

  let multiplier = 1;
  if (freq && freq.endsWith("x")) {
    const times = parseInt(freq);
    if (!isNaN(times)) multiplier = times / 7;
  }

  const g = r * h * meta.gPerMl * multiplier;
  return { g, kcal: g * (meta.kcalPerMl / meta.gPerMl) };
}

export function deriveTNALipid(rateMlHr: string | number, hrs: string | number, concPct: string) {
  const r = num(rateMlHr), h = num(hrs), c = parseFloat(concPct) / 100;
  if (r <= 0 || h <= 0 || c <= 0) return null;
  const g = r * h * c;
  return { g, kcal: g * 10 }; // TNA lipids typically 10 kcal/g including glycerol
}

export function getRateMode(delivery: string): "tna" | "twoplusone" | "three" {
  if (delivery === "3-in-1 (TNA)") return "tna";
  if (delivery === "2-in-1 + Separate Lipid Infusion") return "twoplusone";
  return "three";
}

export function calcENNutrients(feed: ENFeed) {
  const calPerMl = num(feed.calPerMl), protGPerL = num(feed.protGPerL), fwPct = num(feed.fwPct);
  let formulaMl = feed.type === "bolus"
    ? num(feed.bolusMl) * num(feed.bolusTimesPerDay)
    : num(feed.continuousRate) * num(feed.continuousHrs);
  const flushMl = num(feed.flushMl) * num(feed.flushTimesPerDay);
  return {
    totalMl: formulaMl + flushMl,
    totalCal: Math.round(formulaMl * calPerMl),
    totalProt: Math.round((formulaMl / 1000) * protGPerL * 10) / 10,
    totalFw: Math.round(formulaMl * (fwPct / 100)),
    flushMl: Math.round(flushMl),
  };
}

/**
 * Glucose Infusion Rate
 * GIR (mg/kg/min) = (dextrose g/day × 1000) / (weight_kg × 1440)
 * Returns null if inputs are insufficient.
 * Target neonates: 4–6 mg/kg/min; max safe: ~12 mg/kg/min
 * Adults: typically 3–5 mg/kg/min; max ~7 mg/kg/min
 */
export function calcGIR(dextGPerDay: number, wtKg: number): number | null {
  if (dextGPerDay <= 0 || wtKg <= 0) return null;
  return (dextGPerDay * 1000) / (wtKg * 1440);
}

/**
 * GIR status classification
 */
export function girStatus(
  gir: number,
  ageDays?: number | null
): { label: string; color: string; bg: string } {

  // ── Infant (< 1 year) ──────────────────────────────────────────────────────
  if (ageDays !== undefined && ageDays !== null && ageDays < 365) {
    if (gir < 10)  return { label: "Low",    color: "#2563eb", bg: "#dbeafe" };
    if (gir <= 14) return { label: "Target", color: "#16a34a", bg: "#dcfce7" };
    if (gir <= 18) return { label: "High",   color: "#d97706", bg: "#fef3c7" };
    return               { label: "Excess",  color: "#dc2626", bg: "#fee2e2" };
  }

  // ── Child (1–10 y) ─────────────────────────────────────────────────────────
  if (ageDays !== undefined && ageDays !== null && ageDays < 3653) {
    if (gir < 8)   return { label: "Low",    color: "#2563eb", bg: "#dbeafe" };
    if (gir <= 10) return { label: "Target", color: "#16a34a", bg: "#dcfce7" };
    if (gir <= 12) return { label: "High",   color: "#d97706", bg: "#fef3c7" };
    return               { label: "Excess",  color: "#dc2626", bg: "#fee2e2" };
  }

  // ── Adolescent (10–18 y) ───────────────────────────────────────────────────
  if (ageDays !== undefined && ageDays !== null && ageDays < 6570) {
    if (gir < 5)  return { label: "Low",    color: "#2563eb", bg: "#dbeafe" };
    if (gir <= 6) return { label: "Target", color: "#16a34a", bg: "#dcfce7" };
    if (gir <= 8) return { label: "High",   color: "#d97706", bg: "#fef3c7" };
    return              { label: "Excess",  color: "#dc2626", bg: "#fee2e2" };
  }

  // ── Adult (≥ 18 y, or ageDays not provided) ────────────────────────────────
  if (gir < 3)  return { label: "Preferred", color: "#16a34a", bg: "#dcfce7" };
  if (gir <= 5) return { label: "Target",    color: "#65a30d", bg: "#f7fee7" };
  return              { label: "Excess",     color: "#dc2626", bg: "#fee2e2" };
}

export function makeENFeed(id: number): ENFeed {
  return {
    id, label: `Feed ${id}`, route: "", type: "continuous", formula: "",
    bolusMl: "", bolusTimesPerDay: "", bolusEveryHrs: "",
    continuousRate: "", continuousHrs: "",
    flushMl: "", flushTimesPerDay: "", flushEveryHrs: "",
    calPerMl: "", protGPerL: "", fwPct: "", expanded: true,
  };
}

export function makePNFeed(id: number): PNFeed {
  return {
    id, label: `PN Bag ${id}`, indication: "",
    route: "", access: "", delivery: "", goal: "",
    startDate: "", startTime: "",
    dextHrs: "", dextAmount: "", dextAmountUnit: "g", dextDuration: "", dextRate: "", dextConc: "",
    aaHrs: "", aaAmount: "", aaAmountUnit: "g", aaDuration: "", aaRate: "", aaConc: "",
    lipidHrs: "", lipidOil: "", lipidAmount: "", lipidDuration: "", lipidRate: "", lipidConc: "20",
    lipidFreq: "7x",
    lipidCustomOil: "",
    combinedRate: "",
    insulinUnits: "",
    electrolytes: {}, vitamins: {},
    expanded: true, electroExpanded: false, vitExpanded: false,
  };
}