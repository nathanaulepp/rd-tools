import { useAnthroStore } from "../../../stores/useAnthroStore";
import { useClinicalStore } from "../../../stores/useClinicalStore";
import { useLabsStore, sortColumns } from "../../../stores/useLabsStore";
import { useNoteStore } from "../../../stores/useNoteStore";
import { calcSchofieldBMR } from "../clinicalMath";
import type { PatientScope } from "../../../types/equationEngine";

const AMPUTATION_DATA = [
  { label: "Hand",                pct: 0.7  },
  { label: "Forearm",             pct: 2.3  },
  { label: "Entire Arm",          pct: 5.0  },
  { label: "Foot",                pct: 1.5  },
  { label: "BKA (Below Knee)",    pct: 5.9  },
  { label: "AKA (Above Knee)",    pct: 11.0 },
  { label: "Entire Leg",          pct: 16.0 },
] as const;

const num = (val: string | undefined): number | undefined => {
  if (!val || val.trim() === "") return undefined;
  const parsed = parseFloat(val);
  return isNaN(parsed) ? undefined : parsed;
};

export function buildPatientScope(): PatientScope {
  const anthro = useAnthroStore.getState().anthro;
  const clinical = useClinicalStore.getState().clinical;
  const { labs, columns } = useLabsStore.getState();
  const patientData = useNoteStore.getState().patientData;

  // 1. Resolve Lab Values
  const resolveLabValue = (labKey: string): number | undefined => {
    const entry = labs[labKey];
    if (!entry?.values) return undefined;
    const sorted = sortColumns(columns);
    for (const col of [...sorted].reverse()) { // most recent first
      const raw = entry.values[col.id];
      const parsed = parseFloat(raw);
      if (!isNaN(parsed)) return parsed;
    }
    return undefined;
  };

  // 2. Unit Conversions
  const convertToKg = (valStr: string | undefined, unit: string): number | undefined => {
    const v = num(valStr);
    if (v === undefined) return undefined;
    if (unit === "lbs") return v / 2.2046;
    if (unit === "g") return v / 1000;
    if (unit === "oz") return v / 35.274;
    return v;
  };

  const convertToCm = (valStr: string | undefined, unit: string): number | undefined => {
    const v = num(valStr);
    if (v === undefined) return undefined;
    return unit === "in" ? v * 2.54 : v;
  };

  const weightKg = convertToKg(anthro.wt, anthro.wtUnit);
  const heightCm = convertToCm(anthro.ht, anthro.htUnit);
  const usualBodyWeightKg = convertToKg(anthro.ubw, anthro.wtUnit);
  const dryWeightKg = convertToKg(anthro.edw, anthro.edwUnit ?? "kg");
  const midArmCircumferenceCm = num(anthro.mac);
  const waistCircumferenceCm = num(anthro.waist);

  // 3. Demographics & Age
  const sex = patientData.sex === "F" ? "F" : patientData.sex === "M" ? "M" : undefined;
  const isMale = sex === "M" ? true : sex === "F" ? false : undefined;
  const isFemale = sex === "F" ? true : sex === "M" ? false : undefined;

  let ageDays: number | undefined = undefined;
  let ageYears: number | undefined = undefined;
  if (patientData.dob && patientData.noteDate) {
    const ms = new Date(patientData.noteDate).getTime() - new Date(patientData.dob).getTime();
    ageDays = Math.floor(ms / (1000 * 60 * 60 * 24));
    ageYears = ageDays / 365.25;
  }

  // 4. Derived Metrics
  const bmi = weightKg !== undefined && heightCm !== undefined && heightCm > 0
    ? weightKg / ((heightCm / 100) ** 2)
    : undefined;

  const temperatureC = num(clinical.temp) !== undefined ? (num(clinical.temp)! - 32) * 5 / 9 : undefined;

  let ibwKg: number | undefined = undefined;
  if (heightCm !== undefined && heightCm >= 152.4 && sex) { // 60 inches is 152.4 cm
    const heightInches = heightCm / 2.54;
    if (sex === "M") {
      ibwKg = 48.08 + 2.7 * (heightInches - 60);
    } else {
      ibwKg = 45.36 + 2.27 * (heightInches - 60);
    }
  }

  const bodySurfaceAreaM2 = weightKg !== undefined && heightCm !== undefined
    ? Math.sqrt((weightKg * heightCm) / 3600)
    : undefined;

  let msjReeKcal: number | undefined = undefined;
  if (weightKg !== undefined && heightCm !== undefined && ageYears !== undefined && sex) {
    if (sex === "M") {
      msjReeKcal = 10 * weightKg + 6.25 * heightCm - 5 * ageYears + 5;
    } else {
      msjReeKcal = 10 * weightKg + 6.25 * heightCm - 5 * ageYears - 161;
    }
  }
  let hbeBmrKcal: number | undefined = undefined;
  if (weightKg !== undefined && heightCm !== undefined && ageYears !== undefined && sex) {
    if (sex === "M") {
      hbeBmrKcal = 88.362 + 13.397 * weightKg + 4.799 * heightCm - 5.677 * ageYears;
    } else {
      hbeBmrKcal = 447.593 + 9.247 * weightKg + 3.098 * heightCm - 4.330 * ageYears;
    }
  }

  let schofieldReeKcal: number | undefined = undefined;
  if (weightKg !== undefined && heightCm !== undefined && ageYears !== undefined && sex) {
    schofieldReeKcal = calcSchofieldBMR(weightKg, heightCm / 100, ageYears, sex);
  }

  // 5. Amputation adjustments
  let correctedWeightKg: number | undefined = weightKg;
  let adjustedIbwKg: number | undefined = ibwKg;

  const amputations = anthro.amputations ?? [];
  if (amputations.length > 0 && (weightKg !== undefined || ibwKg !== undefined)) {
    const totalPct = amputations.reduce((acc, label) => {
      const entry = AMPUTATION_DATA.find((d) => d.label === label);
      return acc + (entry?.pct ?? 0);
    }, 0);

    if (totalPct > 0) {
      if (weightKg !== undefined) {
        correctedWeightKg = weightKg / (1 - totalPct / 100);
      }
      if (ibwKg !== undefined) {
        adjustedIbwKg = ibwKg * (100 - totalPct) / 100;
      }
    }
  }

  return {
    // Anthropometrics
    weightKg,
    heightCm,
    usualBodyWeightKg,
    dryWeightKg,
    midArmCircumferenceCm,
    waistCircumferenceCm,
    bodySurfaceAreaM2,

    // Demographics
    isMale,
    isFemale,

    // Derived Metrics
    ageDays,
    ageYears,
    bmi,
    ibwKg,
    adjustedIbwKg,
    correctedWeightKg,
    hbeBmrKcal,
    msjReeKcal,
    schofieldReeKcal,
    temperatureC,

    // Clinical
    heartRate: num(clinical.hr),
    oxygenSaturationPct: num(clinical.spo2),
    temperatureF: num(clinical.temp),
    maxTemperatureF: num(clinical.tempMax),
    respiratoryRate: num(clinical.rr),
    minuteVentilationLMin: num(clinical.ve),
    fev1Pct: num(clinical.fev1),
    tbsaBurnedPct: num(clinical.tbsa),
    gripStrengthKg: num(clinical.gripStrength),
    isMechanicallyVentilated: clinical.nicheConditionFlags?.includes("mechVent") ?? false,

    // Clinical Assessments
    ascites: clinical.ascites || undefined,
    ascitesIsMild: clinical.ascites === "Mild",
    ascitesIsModerate: clinical.ascites === "Moderate",
    ascitesIsSevere: clinical.ascites === "Severe",
    hasPedalEdema: clinical.pedalEdema === "Yes",

    // Biochemical
    hemoglobin: resolveLabValue("hgb"),
    hematocrit: resolveLabValue("hct"),
    serumAlbumin: resolveLabValue("albumin"),
    prealbumin: resolveLabValue("prealbumin"),
    serumCreatinine: resolveLabValue("creatinine"),
    bun: resolveLabValue("bun"),
    sodium: resolveLabValue("sodium"),
    potassium: resolveLabValue("potassium"),
    chloride: resolveLabValue("chloride"),
    bicarbonate: resolveLabValue("bicarb"),
    phosphorus: resolveLabValue("phosphorus"),
    magnesium: resolveLabValue("magnesium"),
    calciumTotal: resolveLabValue("calcium-total"),
    glucose: resolveLabValue("glucose"),
    triglycerides: resolveLabValue("triglycerides"),
    totalCholesterol: resolveLabValue("total-cholesterol"),
    ldlC: resolveLabValue("ldl-c"),
    hdlC: resolveLabValue("hdl-c"),
    hba1c: resolveLabValue("hba1c"),
    ferritin: resolveLabValue("ferritin"),
    serumIron: resolveLabValue("serum-iron"),
    transferrinSaturation: resolveLabValue("transferrin-sat"),
    vitaminD: resolveLabValue("vit-d"),
    vitaminB12: resolveLabValue("vit-b12"),
    zinc: resolveLabValue("zinc"),
    copper: resolveLabValue("copper"),
    selenium: resolveLabValue("selenium"),
    crp: resolveLabValue("hs-crp"),
    tsh: resolveLabValue("tsh"),
    lactate: resolveLabValue("lactate"),
    lipase: resolveLabValue("lipase"),
    amylase: resolveLabValue("amylase"),

    // Condition-specific extra inputs are not resolved from stores;
    // they are left undefined and merged in by the evaluation engine.
    postBurnDay: undefined,
    coreTempC: undefined,
    currentKcalIntake: undefined,
    icMeasuredKcal: undefined,
    icCaf: undefined,
    coefficientOfFatAbsorption: undefined,
    urineOutputMlDay: undefined,
    exudateVolumeL: undefined,
    palValue: undefined,
  };
}
