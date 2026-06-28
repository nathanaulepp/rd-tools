// src/types/equationEngine.ts
//
// New types and helpers for the dynamic clinical equation engine.

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
