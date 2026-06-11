export type EnteralPopulation = "infant" | "children" | "adult" | "";

export interface EnteralFormula {
  id: string;
  name: string;
  manufacturer: string;
  kcal_per_ml: number | null;
  protein_g_per_l: number | null;
  fat_g_per_l: number | null;
  cho_g_per_l: number | null;
  fiber_total_g_per_l: number | null;
  fiber_soluble_g_per_l: number | null;
  fiber_insoluble_g_per_l: number | null;
  free_water_pct: number | null;
  osmolality: number | null;
  na_mg_per_l: number | null;
  k_mg_per_l: number | null;
  phos_mg_per_l: number | null;
  mg_mg_per_l: number | null;
  route: EnteralPopulation;
  notes: string;
  is_seeded: boolean;
  created_at: string;
}

export type EnteralFormulaInput = Omit<EnteralFormula, "id" | "is_seeded" | "created_at">;
