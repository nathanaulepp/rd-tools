# RD-Tools Dynamic Equation Engine: Complete Implementation Blueprint

## Project Identity

**Stack:** React + TypeScript + Zustand + Tauri + SQLite  
**Architecture:** Feature-Sliced Design (FSD) — strict no-prop-drilling, one store per domain  
**Goal:** Replace ~2,000 lines of hard-coded clinical nutrition equations across two switch-statement files with a database-driven, dietitian-authored equation engine featuring a graphical settings UI  
**Status:** Pre-implementation planning. No code has been written for this feature yet. The app is under active development and not yet released, so full overwrites of existing systems are acceptable.

---

## 1. What Exists Today (The Legacy System)

### Files Being Replaced
- `src/shared/utils/nutrition-engine/nutritionStandardsAdult.ts` — adult switch statement engine
- `src/shared/utils/nutrition-engine/nutritionStandardsPeds.ts` — pediatric switch statement engine
- `src/shared/utils/nutrition-engine/nutritionStandards.ts` — barrel/orchestrator
- `src/shared/utils/nutrition-engine/nutritionStandardsMath.ts` — math re-exports
- `src/shared/utils/pediatricDiseaseMath.ts` — pediatric disease math functions
- `src/shared/utils/pediatricHealthyMath.ts` — pediatric healthy math functions

### What These Files Do
Each file contains a large `switch(condition)` statement. Each `case` hard-codes energy,
protein, and fluid equations for a clinical condition (AKI, Burns, Cirrhosis, etc.) using
patient variables like `wtKg`, `htCm`, `ageYears`. Some cases branch on sub-variants
(e.g., AKI → no_dialysis / dialysis / CRRT). Some use complex multi-step calculations
with intermediate variables (Toronto burns formula, CF weighted absorption model,
Galveston pediatric burns). Each case also returns an array of clinical guidance
strings (`flags[]`) that appear as notes in the UI.

### The Output Contract (Must Not Change)
`evaluateNutritionRx()` returns `{ evaluation: NutritionEvaluation, snapshot: EvaluationSnapshot }`.
`NutritionStandardsDomain.tsx` consumes this. The output shape must remain identical
so the consuming UI component requires zero modification.

### The ConditionKey Type (Being Replaced)
```typescript
// src/types/standards.ts — BEING DELETED
export type ConditionKey =
  | "aki" | "acute_pancreatitis" | "breastfeeding" | "burns" | "oncology"
  | "cancer" | "ckd_3_5" | "ckd_5d" | "kidney_transplant" | "copd"
  | "cirrhosis" | "liver_transplant" | "critical_illness" | "pregnancy"
  | "pressure_injuries" | "trauma" | "healthy" | "masld_mash" | "short_bowel"
  | "cystic_fibrosis" | "stroke" | "heart_failure" | "obesity_stable"
  | "severe_malnutrition" | "sickle_cell" | "hsct" | "bpd";
```
This is replaced by a branded string type (see Section 6).

---

## 2. Database Schema

### New SQLite Tables (added to `src/shared/api/db.ts` `initSchema()`)

#### `custom_conditions` — Self-referential condition tree
```sql
CREATE TABLE IF NOT EXISTS custom_conditions (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT,
  parent_id   TEXT REFERENCES custom_conditions(id),
  sort_order  INTEGER NOT NULL DEFAULT 1000,
  is_seeded   INTEGER NOT NULL DEFAULT 0,
  is_archived INTEGER NOT NULL DEFAULT 0,
  archived_at TEXT,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);
```
- `parent_id = NULL` → root condition (e.g., "CKD")
- `parent_id = <id>` → child/grandchild (e.g., "Predialysis", "Hemodialysis")
- Only leaf nodes (nodes with no children) have equations attached
- `is_seeded = 1` → migrated from hard-coded engine, resettable
- `is_archived = 1` → soft delete; hidden from UI but preserved for historical note integrity
- Sort order uses sparse gaps (1000, 2000, 3000) so reordering uses midpoint math
  without cascading updates

#### `custom_equations` — One row per nutrient per leaf node
```sql
CREATE TABLE IF NOT EXISTS custom_equations (
  id            TEXT PRIMARY KEY,
  condition_id  TEXT NOT NULL REFERENCES custom_conditions(id),
  nutrient      TEXT NOT NULL,
  expression    TEXT NOT NULL,
  unit          TEXT NOT NULL,
  display_label TEXT NOT NULL,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL
);
```
- `nutrient` is a free string: "energy" | "protein" | "fluid" | "carbs" | "fat" | any custom label
- `expression` is a mathjs-compatible algebraic string: `"weightKg * 30"`
- No hard limit on number of equations per condition
- New nutrient types can be added without schema changes

#### `custom_equation_notes` — Clinical guidance notes per equation
```sql
CREATE TABLE IF NOT EXISTS custom_equation_notes (
  id          TEXT PRIMARY KEY,
  equation_id TEXT NOT NULL REFERENCES custom_equations(id),
  note_text   TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0
);
```
- Replaces the `flags: string[]` arrays from the legacy engine
- Unlimited notes per equation
- Collapsed by default in UI with a badge showing count

#### `variable_catalog` — Read-only registry of all patient variables
```sql
CREATE TABLE IF NOT EXISTS variable_catalog (
  slug             TEXT PRIMARY KEY,
  display_name     TEXT NOT NULL,
  domain           TEXT NOT NULL,
  data_type        TEXT NOT NULL,
  unit             TEXT,
  category_options TEXT
);
```
- `slug` uses plain camelCase (NOT dollar-prefixed): `weightKg`, `serumAlbumin`
- Dollar sign is display convention only in the UI; mathjs receives plain identifiers
- `data_type`: `"numeric"` | `"boolean"` | `"categorical"`
- `category_options`: JSON array for categoricals, null otherwise
- Seeded at app init, read-only to the dietitian
- Lab variables from `GLOBAL_LAB_CATALOG` are seeded dynamically on init

### Recursive CTE Query Pattern
The Tauri `@tauri-apps/plugin-sql` plugin uses the `sqlx` Rust crate which supports
`WITH RECURSIVE`. Fetch the entire condition tree in one query:
```sql
WITH RECURSIVE condition_tree AS (
  SELECT *, 0 as depth FROM custom_conditions WHERE parent_id IS NULL
  UNION ALL
  SELECT c.*, ct.depth + 1
  FROM custom_conditions c
  JOIN condition_tree ct ON c.parent_id = ct.id
)
SELECT * FROM condition_tree
WHERE is_archived = 0
ORDER BY depth, sort_order;
```

### Soft Delete Pattern (Referential Integrity)
**Hard deletes are forbidden** for any condition used in a finalized note.
When a dietitian deletes a condition:
1. Check if any note's `standards` JSON blob references this condition's id
2. If yes: set `is_archived = 1`, `archived_at = NOW()`
3. If no: hard delete is permitted
Archived conditions are invisible in the equation builder and condition dropdown
but remain in the DB to satisfy historical lookups.

---

## 3. TypeScript Types

### New File: `src/types/equationEngine.ts`
```typescript
// Branded type replacing ConditionKey union
declare const __brand: unique symbol;
type Brand<T, TBrand extends string> = T & { readonly [__brand]: TBrand };
export type ConditionId = Brand<string, "ConditionId">;

// Assertion factory — all DB results pass through this
export function assertIsConditionId(value: string): asserts value is ConditionId {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(value)) {
    throw new Error(`Invalid format: Expected UUID ConditionId, got: ${value}`);
  }
}

export type DataType = "numeric" | "boolean" | "categorical";

export interface VariableCatalogEntry {
  slug: string;                    // camelCase: "weightKg"
  displayName: string;             // "Actual Body Weight"
  domain: CatalogDomain;
  dataType: DataType;
  unit: string | null;             // "kg", "g/dL", null
  categoryOptions: string[] | null; // null unless categorical
}

export type CatalogDomain =
  | "Anthropometrics"
  | "Biochemical"
  | "Clinical"
  | "Demographics"
  | "Derived Metrics"
  | "Clinical Assessments";

export interface CustomCondition {
  id: ConditionId;
  name: string;
  description: string | null;
  parentId: ConditionId | null;
  sortOrder: number;
  isSeeded: boolean;
  isArchived: boolean;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  // Hydrated at runtime
  children?: CustomCondition[];
  equations?: CustomEquation[];
}

export interface CustomEquation {
  id: string;
  conditionId: ConditionId;
  nutrient: string;        // "energy" | "protein" | "fluid" | "carbs" | "fat" | custom
  expression: string;      // mathjs-compatible: "weightKg * 30"
  unit: string;
  displayLabel: string;
  sortOrder: number;
  createdAt: string;
  notes?: CustomEquationNote[];
}

export interface CustomEquationNote {
  id: string;
  equationId: string;
  noteText: string;
  sortOrder: number;
}

export interface EquationTestCase {
  id: string;
  name: string;                          // "70kg adult female, no ascites"
  conditionId: ConditionId;
  inputValues: Record<string, unknown>;  // slug → test value
  expectedOutputs: Record<string, number>; // nutrient → expected result
}

export interface PatientScope {
  // All values are plain JavaScript primitives
  // Missing values are explicitly undefined (not 0)
  [slug: string]: number | boolean | string | undefined;
}

export interface EquationEvalResult {
  nutrient: string;
  displayLabel: string;
  unit: string;
  value: number | null;
  expression: string;
  error: string | null;        // "Missing required variable: serumAlbumin"
  notes: string[];
}

export interface CompiledConditionEvaluation {
  conditionId: ConditionId;
  conditionName: string;
  results: EquationEvalResult[];
}
```

Export from `src/types/index.ts`:
```typescript
export type {
  ConditionId,
  VariableCatalogEntry,
  CatalogDomain,
  CustomCondition,
  CustomEquation,
  CustomEquationNote,
  EquationTestCase,
  PatientScope,
  EquationEvalResult,
  CompiledConditionEvaluation,
} from "./equationEngine";
export { assertIsConditionId } from "./equationEngine";
```

### Changes to `src/types/standards.ts`
- DELETE the `ConditionKey` union type entirely
- Replace all uses of `ConditionKey` with `ConditionId` from `equationEngine.ts`
- `EvaluationSnapshot.conditionKey: ConditionKey` becomes
  `EvaluationSnapshot.conditionId: ConditionId`
- `EvaluationSnapshot.conditionName: string` is added (denormalized for display
  when condition may be archived)
- `Standards.condition: ConditionKey | ""` becomes `Standards.conditionId: ConditionId | ""`

---

## 4. Variable Catalog

### New File: `src/shared/utils/equation-engine/variableCatalog.ts`

This is a static TypeScript file that defines every available patient variable.
It is the single source of truth for what variables can be used in equations.

#### Variable Sources to Audit
Each of the following must be walked field-by-field to produce catalog entries:

**Anthropometrics** (`src/types/anthro.ts` + `useAnthroStore`)
- `wt` → `weightKg` (numeric, converted at scope build time)
- `ht` → `heightCm` (numeric, converted)
- `ubw` → `usualBodyWeightKg` (numeric)
- `edw` → `dryWeightKg` (numeric)
- `waist` → `waistCircumferenceCm` (numeric)
- `mac` → `midArmCircumferenceCm` (numeric)
- `bmi` from calculated metrics → `bmi` (numeric)
- Array fields (`amputations`, `ampSegments`) → EXCLUDED from catalog
- Boolean fields (`isFluidShift`) → `hasFluidShift` (boolean)

**Demographics** (`PatientData`)
- `sex` → `isMale` (boolean, derived: sex === "M")
- `sex` → `isFemale` (boolean, derived: sex === "F")
- `dob` → age is in Derived Metrics, not raw here

**Derived Metrics** (`src/stores/useCalculatedMetrics.ts`)
- `ageDays` → `ageDays` (numeric)
- `ageYears` → `ageYears` (numeric)
- `bmi` → `bmi` (numeric)
- `ibwKg` → `ibwKg` (numeric, Hamwi method)
- `adjIbwKg` → `adjustedIbwKg` (numeric)
- `correctedWtKg` → `correctedWeightKg` (numeric, amputee-adjusted)
- `bsa` → `bodySurfaceAreaM2` (numeric, Mosteller)
- `msjKcal` → `msjReeKcal` (numeric, Mifflin-St Jeor REE)
- `schofieldKcal` → `schofieldReeKcal` (numeric)

**Clinical** (`src/types/clinical.ts`)
- `hr` → `heartRate` (numeric)
- `bp` → EXCLUDED (string "120/80", not equation-usable)
- `spo2` → `oxygenSaturationPct` (numeric)
- `temp` → `temperatureF` (numeric)
- `rr` → `respiratoryRate` (numeric)
- `tempMax` → `maxTemperatureF` (numeric, for PSU equations)
- `ve` → `minuteVentilationLMin` (numeric, for PSU equations)
- `fev1` → `fev1Pct` (numeric)
- `tbsa` → `tbsaBurnedPct` (numeric)
- `ascites` → `ascites` (categorical: "None"/"Mild"/"Moderate"/"Severe")
- `pedalEdema` → `hasPedalEdema` (boolean: "Yes"/"No" → boolean)
- `ascites === "Mild"` → `ascitesIsMild` (boolean, pre-derived)
- `ascites === "Moderate"` → `ascitesIsModerate` (boolean, pre-derived)
- `ascites === "Severe"` → `ascitesIsSevere` (boolean, pre-derived)
- `gripStrength` → `gripStrengthKg` (numeric)
- Array fields (`giSymptoms`, `hair`, `eyes`, etc.) → EXCLUDED
- Vitals that are strings with no numeric interpretation → EXCLUDED

**Biochemical** (dynamic from `GLOBAL_LAB_CATALOG`)
- All entries in `GLOBAL_LAB_CATALOG` with numeric `defaultUnit` are included
- Slug pattern: camelCase of the catalog key (e.g., `Hgb` → `hemoglobin`)
- Resolution: most recent non-empty value from most recent date column
- Examples: `hemoglobin`, `serumAlbumin`, `serumCreatinine`, `bun`,
  `phosphorus`, `potassium`, `sodium`, `glucose`, `triglycerides`

#### Catalog Entry Shape
```typescript
export const VARIABLE_CATALOG: VariableCatalogEntry[] = [
  {
    slug: "weightKg",
    displayName: "Actual Body Weight",
    domain: "Anthropometrics",
    dataType: "numeric",
    unit: "kg",
    categoryOptions: null,
  },
  {
    slug: "ascites",
    displayName: "Ascites Severity",
    domain: "Clinical Assessments",
    dataType: "categorical",
    unit: null,
    categoryOptions: ["None", "Mild", "Moderate", "Severe"],
  },
  {
    slug: "isMechanicallyVentilated",
    displayName: "Mechanically Ventilated",
    domain: "Clinical",
    dataType: "boolean",
    unit: null,
    categoryOptions: null,
  },
  // ... all other entries
];
```

#### Rules for Catalog Inclusion
- Include: numeric fields with clinical meaning in equations
- Include: booleans representing clinical states
- Include: categoricals with a finite, known option set
- Exclude: free-text fields (medications, notes, recall)
- Exclude: arrays (giSymptoms, hair, eyes)
- Exclude: date strings (dob, noteDate, admissionDate) — age is in Derived Metrics
- Exclude: UI state fields (isFluidShift display toggle)
- Pre-derive boolean variants for every categorical
  (ascitesIsMild, ascitesIsModerate, ascitesIsSevere)

---

## 5. The mathjs Evaluator

### Security Requirement
**Must use mathjs version 15.2.0 or higher.**
CVE-2026-40897 and CVE-2026-41139 document sandbox escape vulnerabilities in
earlier versions. Version 15.2.0 introduces `isSafeObjectProperty` which closes
these vectors. Input strings must also be sanitized to strip `__proto__` and
`constructor` references before reaching the parser.

### New File: `src/shared/utils/equation-engine/mathResolver.ts`

```typescript
// Isolated mathjs instance — never mutate global math state
import { create, all } from "mathjs";
const math = create(all);

// Register custom routing functions
math.import({
  ifTrue: (condition: boolean, ifVal: number, elseVal: number) =>
    condition ? ifVal : elseVal,
  ifCategory: (value: string, target: string, ifVal: number, elseVal: number) =>
    value === target ? ifVal : elseVal,
  clamp: (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), max),
});

// Hook for missing variables — surfaces specific missing variable name
// instead of generic mathjs error
math.SymbolNode.onUndefinedSymbol = (name: string) => {
  throw new MissingVariableError(name);
};

export class MissingVariableError extends Error {
  constructor(public variableSlug: string) {
    super(`Missing required variable: ${variableSlug}`);
  }
}

// Sanitize expression before parsing
function sanitizeExpression(expr: string): string {
  return expr
    .replace(/__proto__/g, "")
    .replace(/constructor/g, "")
    .replace(/\$([a-zA-Z]/g, "$1"); // strip dollar prefix if present
}

// Evaluate a single expression against a patient scope
export function evaluateExpression(
  expression: string,
  scope: PatientScope
): { value: number; error: null } | { value: null; error: string } {
  try {
    const sanitized = sanitizeExpression(expression);
    const compiled = math.compile(sanitized);
    const result = compiled.evaluate({ ...scope });
    if (typeof result !== "number" || !isFinite(result)) {
      return { value: null, error: "Expression did not return a finite number" };
    }
    return { value: result, error: null };
  } catch (err) {
    if (err instanceof MissingVariableError) {
      return { value: null, error: `Missing variable: ${err.variableSlug}` };
    }
    return { value: null, error: (err as Error).message };
  }
}

// Extract variable slugs referenced in an expression (for live test panel)
export function extractReferencedVariables(expression: string): string[] {
  try {
    const sanitized = sanitizeExpression(expression);
    const node = math.parse(sanitized);
    const referenced: string[] = [];
    const mathBuiltins = new Set(Object.keys(math));

    node.traverse((node, _path, parent) => {
      if (!node.isSymbolNode) return;
      const name = (node as any).name as string;
      // Exclude: function identifiers, math constants, custom functions
      const isBuiltin = mathBuiltins.has(name);
      const isFunctionName =
        parent?.isFunctionNode && (parent as any).fn?.name === name;
      if (!isBuiltin && !isFunctionName) {
        if (!referenced.includes(name)) referenced.push(name);
      }
    });

    return referenced;
  } catch {
    return [];
  }
}

// Validate expression syntax without evaluating
export function validateExpression(expression: string): string | null {
  try {
    math.parse(sanitizeExpression(expression));
    return null; // valid
  } catch (err) {
    return (err as Error).message; // error message
  }
}
```

### Block Expression Support (Multi-Step Formulas)
mathjs natively supports multi-step expressions using semicolons.
The final statement (no semicolon) is the return value:
```
bsa = sqrt(weightKg * heightCm / 3600);
bsa * 1500 + bsa * (tbsaBurnedPct / 100) * 1300
```
When a `ResultSet` is returned (block expression), take the last value.
This allows complex legacy formulas to migrate without additional tables.

---

## 6. The Patient Scope Builder

### New File: `src/shared/utils/equation-engine/buildPatientScope.ts`

This function must be callable **outside React components** (no hooks).
It uses Zustand's `getState()` pattern.

```typescript
import { useAnthroStore } from "../../../stores/useAnthroStore";
import { useClinicalStore } from "../../../stores/useClinicalStore";
import { useLabsStore } from "../../../stores/useLabsStore";
import { useCalculatedMetrics } from "../../../stores/useCalculatedMetrics";
import { useNoteStore } from "../../../stores/useNoteStore";
import type { PatientScope } from "../../../types/equationEngine";

export function buildPatientScope(): PatientScope {
  const anthro = useAnthroStore.getState().anthro;
  const clinical = useClinicalStore.getState().clinical;
  const labs = useLabsStore.getState().labs;
  const columns = useLabsStore.getState().columns;
  const metrics = useCalculatedMetrics.getState(); // if store, else compute inline
  const { patientData } = useNoteStore.getState();

  // Helper: resolve most recent non-empty lab value
  const resolveLabValue = (labKey: string): number | undefined => {
    const entry = labs[labKey];
    if (!entry?.values) return undefined;
    const sortedCols = Object.keys(entry.values)
      .map(colId => ({ colId, date: columns[colId]?.date ?? "" }))
      .sort((a, b) => b.date.localeCompare(a.date));
    for (const { colId } of sortedCols) {
      const raw = entry.values[colId];
      const parsed = parseFloat(raw);
      if (!isNaN(parsed)) return parsed;
    }
    return undefined;
  };

  // Helper: parse numeric from string store field, return undefined if empty
  const num = (val: string | undefined): number | undefined => {
    if (!val) return undefined;
    const parsed = parseFloat(val);
    return isNaN(parsed) ? undefined : parsed;
  };

  // Unit conversion helpers (anthro fields store raw values with unit metadata)
  const toKg = (val: string, unit: string) =>
    unit === "lbs" ? (num(val) ?? 0) / 2.2046 :
    unit === "g"   ? (num(val) ?? 0) / 1000 :
    num(val);

  const toCm = (val: string, unit: string) =>
    unit === "in" ? (num(val) ?? 0) * 2.54 : num(val);

  const weightKg = toKg(anthro.wt, anthro.wtUnit);
  const heightCm = toCm(anthro.ht, anthro.htUnit);
  const sex = patientData?.sex ?? "";

  return {
    // Anthropometrics
    weightKg,
    heightCm,
    usualBodyWeightKg: toKg(anthro.ubw, anthro.wtUnit),
    dryWeightKg: anthro.edw ? toKg(anthro.edw, anthro.edwUnit ?? "kg") : undefined,
    midArmCircumferenceCm: num(anthro.mac) ?? undefined,
    waistCircumferenceCm: num(anthro.waist) ?? undefined,

    // Demographics
    isMale: sex === "M" ? true : sex === "F" ? false : undefined,
    isFemale: sex === "F" ? true : sex === "M" ? false : undefined,

    // Derived Metrics (pre-computed)
    ageDays: metrics.ageDays ?? undefined,
    ageYears: metrics.ageDays ? metrics.ageDays / 365.25 : undefined,
    bmi: metrics.bmi ? parseFloat(metrics.bmi) : undefined,
    ibwKg: metrics.ibwKg ?? undefined,
    adjustedIbwKg: metrics.adjIbw ?? undefined,
    correctedWeightKg: metrics.correctedWtKg ?? undefined,
    bodySurfaceAreaM2: metrics.bsa ?? undefined,
    msjReeKcal: metrics.msjKcal ?? undefined,
    schofieldReeKcal: metrics.schofieldKcal ?? undefined,

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

    // Clinical categoricals
    ascites: clinical.ascites || undefined,
    ascitesIsMild: clinical.ascites === "Mild",
    ascitesIsModerate: clinical.ascites === "Moderate",
    ascitesIsSevere: clinical.ascites === "Severe",
    hasPedalEdema: clinical.pedalEdema === "Yes",

    // Biochemical (most recent value)
    hemoglobin: resolveLabValue("Hgb"),
    serumAlbumin: resolveLabValue("Albumin"),
    serumCreatinine: resolveLabValue("Cr"),
    bun: resolveLabValue("BUN"),
    phosphorus: resolveLabValue("Phos"),
    potassium: resolveLabValue("K"),
    sodium: resolveLabValue("Na"),
    glucose: resolveLabValue("Glucose"),
    triglycerides: resolveLabValue("Trig"),
    // ... all other lab entries from GLOBAL_LAB_CATALOG
  };
}
```

### Missing Variable Policy
- Missing values are `undefined`, never `0`
- mathjs throws when it encounters `undefined` in scope
- `MissingVariableError` is caught and surfaced as a specific warning
- The UI shows: "Evaluation halted: Missing required variable: [Display Name]"
- The dietitian sees which variable is missing, not a generic error

---

## 7. New Zustand Store

### New File: `src/stores/useEquationEngineStore.ts`

```typescript
import { create } from "zustand";
import type { CustomCondition, ConditionId, VariableCatalogEntry } from "../types";

interface EquationEngineState {
  // Condition tree (flat list from DB, hydrated to tree in selectors)
  conditions: CustomCondition[];
  isLoaded: boolean;

  // Selected condition in the builder UI
  selectedConditionId: ConditionId | null;

  // Variable catalog
  catalog: VariableCatalogEntry[];

  // Actions
  loadConditions: () => Promise<void>;
  addCondition: (name: string, parentId: ConditionId | null) => Promise<void>;
  updateCondition: (id: ConditionId, updates: Partial<CustomCondition>) => Promise<void>;
  archiveCondition: (id: ConditionId) => Promise<void>;
  reorderCondition: (id: ConditionId, newSortOrder: number) => Promise<void>;
  setSelectedCondition: (id: ConditionId | null) => void;

  // Equation actions
  addEquation: (conditionId: ConditionId, nutrient: string) => Promise<void>;
  updateEquation: (equationId: string, updates: Partial<CustomEquation>) => Promise<void>;
  deleteEquation: (equationId: string) => Promise<void>;

  // Note actions
  addEquationNote: (equationId: string, noteText: string) => Promise<void>;
  deleteEquationNote: (noteId: string) => Promise<void>;

  // Cache invalidation
  invalidate: () => void;
}
```

This store does NOT use `registerDomainReset` or `registerDomainGetter`
(those are per-note patterns; this is global settings-level state).

---

## 8. Settings UI Architecture

### New Settings Tab
Added to `src/pages/SettingsPage.tsx` alongside existing tabs:
`"requirements" | "formulary" | "chemistry" | "diets" | "equations"`

### New Feature Folder: `src/features/equation-builder/`

```
src/features/equation-builder/
  EquationBuilderDomain.tsx      — three-panel layout container
  ConditionTreePanel.tsx         — left panel, nested accordion
  EquationEditorPanel.tsx        — center panel, equation cards
  VariableCatalogBrowser.tsx     — embedded in editor, variable insert
  LiveTestPanel.tsx              — right panel, test inputs + results
  EquationNoteEditor.tsx         — expandable notes section per equation
  ConditionTreeNode.tsx          — recursive node component
  useEquationBuilder.ts          — local UI state (selection, expansion)
```

### Panel Descriptions

#### Left Panel — Condition Tree
- Nested accordion, arbitrary depth
- Each node: display name, rename-in-place mode, add-child button,
  delete/archive button, visual indent via depth prop
- Root conditions are collapsible sections
- Leaf nodes (no children) have "Edit Equations" button
- Currently selected leaf node is highlighted
- Adding a child to a leaf node that has equations: WARN the dietitian
  ("This node has equations. Adding a child will convert it to a branch.
  Existing equations will be moved to a new child automatically.")
- Sort order uses sparse gap + midpoint math for reordering without
  cascading DB updates

#### Recursive Node Component Pattern
```typescript
// ConditionTreeNode.tsx
interface ConditionTreeNodeProps {
  node: CustomCondition;
  depth: number;              // controls left padding
  allNodes: CustomCondition[]; // full flat list for child lookup
}

function ConditionTreeNode({ node, depth, allNodes }: ConditionTreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true); // local state
  const { selectedConditionId, setSelectedCondition } = useEquationEngineStore();
  const children = allNodes.filter(n => n.parentId === node.id);
  const isLeaf = children.length === 0;
  const isSelected = selectedConditionId === node.id;

  return (
    <div style={{ paddingLeft: depth * 16 }}>
      {/* Node header with expand/collapse, name, action buttons */}
      {isExpanded && children.map(child => (
        <ConditionTreeNode
          key={child.id}
          node={child}
          depth={depth + 1}
          allNodes={allNodes}
        />
      ))}
    </div>
  );
}
```
Key rule: expansion state is LOCAL to each node instance.
Selected leaf node ID is GLOBAL in the store.

#### Center Panel — Equation Editor
When a leaf node is selected, shows one card per equation:
- Nutrient type selector (energy / protein / fluid / carbs / fat / custom)
- Unit field (text input)
- Display label field (what appears in the standards output)
- Expression textarea (mathjs algebraic string)
- Inline syntax validation (red border + error message on invalid parse)
- Variable inserter: click catalog entry → inserts slug at cursor
- Notes section: collapsed by default, badge shows count
  (e.g., "3 notes"), clicking expands all notes in edit mode
- Add equation button appends a new blank card
- Delete equation button (with confirmation)

#### Right Panel — Live Test Panel
- Automatically detects variables referenced in all current leaf node equations
  using `extractReferencedVariables()` from mathResolver
- Renders appropriate input per variable type:
  - numeric → number input
  - boolean → toggle switch
  - categorical → dropdown with category options from catalog
- Shows computed result for each equation in real time (debounced 300ms)
- Shows full expression string alongside result (dietitian can verify math)
- Clear error state for failed evaluations with specific missing variable name
- "Save Test Case" button: stores named test case (name, inputs, expected outputs)
- Saved test cases shown as chips; clicking one reloads the input values
- Test cases stored in localStorage (not SQLite — they are a dev/authoring tool)

---

## 9. Runtime Evaluator (Replaces Switch Statements)

### Modified File: `src/shared/utils/nutrition-engine/nutritionStandards.ts`

`evaluateNutritionRx()` gets a new execution path. The output shape
`{ evaluation: NutritionEvaluation, snapshot: EvaluationSnapshot }` is unchanged.

```typescript
export async function evaluateNutritionRx(opts: EvalOptions): Promise<EvaluateResult> {
  const { conditionId } = opts; // was: condition: ConditionKey

  // 1. Load condition from store cache (already loaded by settings or note open)
  const { conditions } = useEquationEngineStore.getState();
  const condition = conditions.find(c => c.id === conditionId);
  if (!condition) throw new Error(`Condition not found: ${conditionId}`);

  // 2. Verify it's a leaf node (has equations, no children)
  const hasChildren = conditions.some(c => c.parentId === conditionId);
  if (hasChildren) throw new Error(`Condition is a branch node, not a leaf: ${conditionId}`);

  // 3. Build patient scope
  const scope = buildPatientScope();

  // 4. Evaluate each equation
  const results: EvalResult[] = [];
  const allFlags: string[] = [];

  for (const equation of condition.equations ?? []) {
    const { value, error } = evaluateExpression(equation.expression, scope);
    results.push({
      label: equation.displayLabel,
      target: value !== null ? `${Math.round(value)} ${equation.unit}` : "—",
      current: getCurrentRxValue(opts.currentRx, equation.nutrient),
      unit: equation.unit,
      status: value !== null
        ? evalStatus(getCurrentRxValue(opts.currentRx, equation.nutrient), value * 0.95, value * 1.05)
        : "N/A",
      note: error ?? equation.notes?.map(n => n.noteText).join(" ") ?? "",
    });
    if (equation.notes) {
      allFlags.push(...equation.notes.map(n => n.noteText));
    }
    if (error) allFlags.push(`⚠ ${equation.displayLabel}: ${error}`);
  }

  // 5. Assemble evaluation (same shape as before)
  const evaluation: NutritionEvaluation = {
    ibwKg: scope.ibwKg ?? 0,
    reeKcal: Math.round(scope.msjReeKcal ?? 0),
    eeKcal: 0, // computed from energy equation result
    eeSource: condition.name as EESource,
    weightUsed: scope.weightKg ?? 0,
    weightLabel: "Actual Wt",
    isPediatric: (scope.ageYears ?? 0) < 18,
    results,
    flags: allFlags,
  };

  // 6. Build snapshot (embeds condition name for archival safety)
  const snapshot = buildSnapshot(evaluation, scope, conditionId, condition.name);

  return { evaluation, snapshot };
}
```

Note: `evaluateNutritionRx` becomes async because it may need to lazy-load
condition equations from the DB if not already cached.
`NutritionStandardsDomain.tsx` must be updated to `await` the call and handle
the Promise, but the data shape it receives is unchanged.

---

## 10. Migration Seed Script

### Location: Added to `src/shared/api/db.ts` `initSchema()`

All existing hard-coded conditions become seed data using the same
`INSERT OR IGNORE` pattern as enteral formulas and hospital diets.

### Migration Structure
Each legacy `case` in the switch statements becomes:
- One or more `custom_conditions` rows (with parent/child hierarchy)
- One or more `custom_equations` rows per leaf node
- One or more `custom_equation_notes` rows per equation (from `flags[]` arrays)

### Hierarchy Pattern for Migration
```
Root: "Critical Illness"         (parent_id = null)
  Child: "Adult"                 (parent_id = Critical Illness)
    Leaf: "BMI < 30"             ← has equations
    Leaf: "BMI 30-50 (Obese)"    ← has equations
    Leaf: "BMI > 50 (Severe)"    ← has equations
  Child: "Pediatric"             (parent_id = Critical Illness)
    Leaf: "Standard"             ← has equations

Root: "AKI"
  Child: "Adult"
    Leaf: "No Dialysis"
    Leaf: "Hemodialysis / Catabolic"
    Leaf: "CRRT"
  Child: "Pediatric"
    Leaf: "No Dialysis"
    Leaf: "Dialysis / CRRT"

Root: "CKD Stages 3-5"
  Child: "Adult"
    Leaf: "VLPD + Keto Analogs"
    Leaf: "Low Protein Diet"
    Leaf: "Low Protein + Diabetes"
  Child: "Pediatric"
    Leaf: "Standard"

Root: "Burns"
  Child: "Adult"
    Leaf: "Milner Formula"
    Leaf: "Toronto Formula (Preferred)"
  Child: "Pediatric"
    Leaf: "Child 1-11y (Galveston)"
    Leaf: "Adolescent 12-16y (Galveston)"
```

### Expression Migration Examples
```
// Legacy TypeScript:
kcalLow = wtKg * 12;
kcalHigh = wtKg * 25;

// New expression (energy equation, unit "kcal/day"):
// Low: "weightKg * 12"
// High: "weightKg * 25"
// OR combined into range display — two equations: energyLow and energyHigh
// OR single equation returning midpoint with notes explaining range

// Legacy Toronto burns:
const torontoKcal = -4343 + 10.5 * tbsa + 0.23 * caloricIntake
  + 0.84 * hbe + 114 * coreTempC - 4.5 * pbd;

// New block expression:
hbe = 66.5 + (13.75 * weightKg) + (5.003 * heightCm) - (6.775 * ageYears);
(-4343) + (10.5 * tbsaBurnedPct) + (0.23 * currentKcalIntake)
  + (0.84 * hbe) + (114 * coreTempC) - (4.5 * postBurnDay)

// Legacy Galveston pediatric:
const bsa = calcBSA(htCm, wtKg);
const galvestonKcal = 1800 * bsa + 1300 * (bsa * tbsa / 100);

// New block expression (child 1-11y leaf node):
bsa = sqrt(weightKg * heightCm / 3600);
(1800 * bsa) + (1300 * (bsa * tbsaBurnedPct / 100))
```

### Variables Added to Standard Scope for Migration
Some legacy equations use values that weren't previously in PatientScope.
These must be added to `buildPatientScope()` and the variable catalog:
- `postBurnDay` — clinical input (currently in `extraInputs`)
- `coreTempC` — from clinical input (convert from F if needed)
- `currentKcalIntake` — from dietary totals
- `icMeasuredKcal` — from standards store IC field
- `icCaf` — clinical activity factor
- `fev1Pct` — already in clinical
- `coefficientOfFatAbsorption` — CF-specific extra input
- `urineOutputMlDay` — clinical input
- `exudateVolumeL` — trauma-specific extra input
- `hemoglobin` — lab value

These condition-specific extra inputs that currently live in `CONDITION_EXTRA_INPUTS`
must be redesigned. Each leaf node in the builder can optionally declare
"Extra Inputs Required" — additional fields that appear in the standards UI
when that condition is selected. These are stored in a new table:

```sql
CREATE TABLE IF NOT EXISTS condition_extra_inputs (
  id             TEXT PRIMARY KEY,
  condition_id   TEXT NOT NULL REFERENCES custom_conditions(id),
  slug           TEXT NOT NULL,   -- becomes available in scope
  display_label  TEXT NOT NULL,
  input_type     TEXT NOT NULL,   -- "number" | "boolean"
  hint_text      TEXT,
  sort_order     INTEGER NOT NULL DEFAULT 0
);
```

---

## 11. NutritionStandardsDomain.tsx Changes

The consuming UI component needs minimal changes:

1. Condition dropdown becomes dynamic (reads from `useEquationEngineStore`)
   instead of rendering hard-coded `CONDITION_LABELS` options
2. Variant selection is replaced by the dynamic subcategory tree
   (leaf selection handled by a collapsible tree inline in the left panel)
3. `CONDITION_EXTRA_INPUTS` rendering replaced by dynamic
   `condition_extra_inputs` table records
4. The call to `evaluateNutritionRx()` becomes `await evaluateNutritionRx()`
5. Everything else (bar chart, flags display, IC panel) is unchanged

---

## 12. EvaluationSnapshot Changes

The snapshot stored in each note's `standards` JSON must be updated
for archival safety:

```typescript
export interface EvaluationSnapshot {
  evaluatedAt: string;
  conditionId: ConditionId;          // was: conditionKey: ConditionKey
  conditionName: string;             // ADDED: denormalized name for display
  conditionPath: string[];           // ADDED: ["Burns", "Pediatric", "Child 1-11y"]
  expressionsUsed: Record<string, string>; // ADDED: nutrient → expression string
  eeSource: string;                  // was: EESource enum — now free string
  weightUsedKg: number;
  weightLabel: string;
  isPediatric: boolean;
  results: EvalResult[];
  flags: string[];
  contextVars: Record<string, number>;
}
```

`conditionName`, `conditionPath`, and `expressionsUsed` are embedded at
evaluation time. If the condition is later modified or archived, historical
notes still display correctly from the embedded snapshot data.

---

## 13. Implementation Order

Execute strictly in this order to avoid circular dependencies and broken states:

1. **Security first:** Upgrade mathjs to 15.2.0 in package.json
2. **Types:** Create `src/types/equationEngine.ts`, update `src/types/index.ts`,
   update `src/types/standards.ts` (replace ConditionKey)
3. **DB Schema:** Add new tables to `initSchema()` in `src/shared/api/db.ts`
4. **Variable catalog:** Create `src/shared/utils/equation-engine/variableCatalog.ts`
   (full audit of all patient fields)
5. **mathjs resolver:** Create `src/shared/utils/equation-engine/mathResolver.ts`
6. **Scope builder:** Create `src/shared/utils/equation-engine/buildPatientScope.ts`
7. **Store:** Create `src/stores/useEquationEngineStore.ts`
8. **Migration seed:** Write seed script in `db.ts`, migrate all legacy conditions
9. **Verify seed:** Manually test that each migrated condition produces same output
   as legacy engine (use existing notes as test cases)
10. **New runtime evaluator:** Modify `nutritionStandards.ts` to use new engine
11. **Verify parity:** Run both old and new engines in parallel temporarily,
    compare outputs for all conditions against known expected values
12. **Delete legacy files:** Remove `nutritionStandardsAdult.ts`,
    `nutritionStandardsPeds.ts`, old math helpers
13. **Settings UI:** Build `src/features/equation-builder/` components
14. **Settings tab registration:** Add tab to `SettingsPage.tsx`
15. **NutritionStandardsDomain updates:** Dynamic condition dropdown,
    subcategory tree, async evaluation call
16. **Extra inputs migration:** Port `CONDITION_EXTRA_INPUTS` to
    `condition_extra_inputs` table and dynamic renderer
17. **Live test panel:** Build test case saving/loading
18. **End-to-end audit:** Verify all 26+ original conditions produce
    correct output through the new engine

---

## 14. Files to Delete After Migration

```
src/shared/utils/nutrition-engine/nutritionStandardsAdult.ts
src/shared/utils/nutrition-engine/nutritionStandardsPeds.ts
src/shared/utils/nutrition-engine/nutritionStandardsMath.ts
src/shared/utils/pediatricDiseaseMath.ts
src/shared/utils/pediatricHealthyMath.ts
```

`src/shared/utils/nutrition-engine/nutritionStandards.ts` is kept but
heavily modified — it becomes the thin orchestrator calling the new engine.

---

## 15. Key Architectural Rules (Non-Negotiable)

- **No prop drilling:** All components read from stores directly
- **No `ConditionKey` references anywhere after migration**
- **All DB results pass through `assertIsConditionId()` before use**
- **mathjs instance is module-level singleton in mathResolver.ts,
  never instantiated in components**
- **`buildPatientScope()` uses `getState()` only, never hooks**
- **Missing variables are `undefined`, never `0`**
- **Categoricals never appear directly in expression strings —
  they either branch the tree or use `ifCategory()` helper**
- **Conditions with notes in finalized notes cannot be hard-deleted**
- **Seeded conditions can be edited but show "Reset to default" button**
- **Component size limit: 300 lines maximum; extract to sibling file if exceeded**
- **mathjs 15.2.0 minimum — document this requirement in package.json comments**