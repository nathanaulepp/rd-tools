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