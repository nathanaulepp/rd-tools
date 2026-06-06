// src/features/assessment/assess-biochemical/loincService.ts
// NLM LOINC clinical-tables search service.
//
// Endpoint: loinc_items/v3 — confirmed working via console test.
// No Tauri fallback needed: browser fetch succeeds against NLM's CORS-open API.
// The @tauri-apps/plugin-http dynamic import has been removed entirely to
// prevent Vite module resolution errors on Windows dev builds.

const NLM_BASE =
  "https://clinicaltables.nlm.nih.gov/api/loinc_items/v3/search";

const DF_FIELDS = "LOINC_NUM,LONG_COMMON_NAME,EXAMPLE_UCUM_UNITS";
const MAX_COUNT = 20;

export interface LoincResult {
  loincCode:   string;
  loincName:   string;
  defaultUnit: string;
  shortName:   string;
}

type NlmResponse = [number, string[], null, Array<[string, string, string]>];

function buildUrl(query: string): string {
  const params = new URLSearchParams({
    terms:   query.trim(),
    df:      DF_FIELDS,
    maxList: String(MAX_COUNT),
  });
  return `${NLM_BASE}?${params.toString()}`;
}

function parseNlmResponse(data: NlmResponse): LoincResult[] {
  const tuples = data[3];
  if (!Array.isArray(tuples)) return [];

  return tuples.map((tuple) => {
    const code    = tuple[0] ?? "";
    const name    = tuple[1] ?? "";
    const unitStr = tuple[2] ?? "";

    // EXAMPLE_UCUM_UNITS is illustrative and can contain:
    //   - Pipe-delimited alternatives: "ng/dL|nmol/L"
    //   - UCUM qualifiers in braces: "ng/dL{total}"
    //   - Empty strings for dimensionless or poorly-cataloged tests
    // Take the first alternative, strip any curly-brace qualifiers.
    const cleanUnit = unitStr
      .split("|")[0]          // take first option from pipe list
      .replace(/\{[^}]*\}/g, "") // strip {qualifier} expressions
      .trim();

    return {
      loincCode:   code,
      loincName:   name,
      defaultUnit: cleanUnit,
      shortName:   name,
    };
  });
}

export async function searchLoinc(query: string): Promise<LoincResult[]> {
  if (!query || query.trim().length < 2) return [];

  const url = buildUrl(query);
  const res = await fetch(url, {
    method:  "GET",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`NLM API returned ${res.status} ${res.statusText}`);
  }

  const data: NlmResponse = await res.json();
  return parseNlmResponse(data);
}

export function loincResultToSlug(result: LoincResult): string {
  return `loinc-${result.loincCode}`;
}

export function loincResultToCatalogShape(result: LoincResult) {
  return {
    name:        result.shortName,
    loinc:       result.loincCode,
    defaultUnit: result.defaultUnit,
    panel:       "Custom",
  } as const;
}
