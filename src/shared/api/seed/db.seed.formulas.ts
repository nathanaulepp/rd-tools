// src/shared/api/db.seed.formulas.ts
// Seed data for the enteral_formulas table.
// Called once during schema initialisation by db.connection.ts.

import type Database from "@tauri-apps/plugin-sql";

// Columns: name, manufacturer, kcal/mL, prot g/L, fat g/L, cho g/L,
//          fiber_tot, fiber_sol, fiber_ins, fwpct, osm, na, k, phos, mg, route, notes
const SEED_FORMULAS: readonly (string | number)[][] = [
  ["Osmolite 1.0", "Abbott", 1.0, 37.0, 34.7, 143.5, 0, 0, 0, 84, 300, 930, 1570, 760, 270, "adult", "Standard isotonic, fiber-free"],
  ["Osmolite 1.2", "Abbott", 1.2, 55.5, 39.3, 157.5, 0, 0, 0, 82, 360, 1600, 2274, 1200, 370, "adult", "Higher calorie isotonic, fiber-free"],
  ["Osmolite 1.5", "Abbott", 1.5, 62.7, 49.1, 203.6, 0, 0, 0, 76, 525, 1330, 2180, 1250, 420, "adult", "High-cal isotonic, fiber-free"],
  ["Jevity 1.0", "Abbott", 1.0, 44.3, 34.7, 154.7, 14.4, 9.0, 5.4, 82, 300, 930, 1570, 760, 270, "adult", "Standard with fiber blend"],
  ["Jevity 1.2", "Abbott", 1.2, 55.5, 39.3, 169.4, 17.0, 8.0, 0.0, 81, 450, 1067, 2390, 1200, 370, "adult", "Higher calorie with fiber"],
  ["Jevity 1.5", "Abbott", 1.5, 63.8, 49.8, 215.7, 21.0, 10.0, 0.0, 76, 525, 1330, 2180, 1250, 420, "adult", "High-cal with fiber blend"],
  ["Glucerna 1.0", "Abbott", 1.0, 41.8, 54.4, 95.6, 14.4, 0.0, 0.0, 84, 355, 800, 1650, 890, 295, "adult", "Low-glycemic index, diabetes"],
  ["Glucerna 1.2", "Abbott", 1.2, 60.0, 60.0, 114.0, 16.1, 10.0, 0.0, 81, 720, 1140, 1600, 800, 340, "adult", "High-cal low-GI, diabetes"],
  ["Glucerna 1.5", "Abbott", 1.5, 82.7, 75.1, 133.0, 16.0, 10.0, 0.0, 76, 875, 1390, 2200, 800, 420, "adult", "Higher-cal low-GI, diabetes"],
  ["Nepro with CARBSTEADY", "Abbott", 1.8, 81.0, 96.0, 160.0, 25.0, 10.0, 0, 73, 745, 1050, 949, 717, 169, "adult", "Renal, low K/Phos, dialysis patients"],
  ["Pulmocare", "Abbott", 1.5, 62.6, 93.0, 105.7, 0, 0, 0, 78, 475, 1310, 1870, 1060, 390, "adult", "High-fat low-carb, COPD/vent weaning"],
  ["Pivot 1.5", "Abbott", 1.5, 93.8, 51.0, 172.4, 7.5, 7.5, 0, 75, 660, 1475, 1983, 969, 421, "adult", "High-protein critical care formula"],
  ["Promote", "Abbott", 1.0, 63.0, 26.0, 130.0, 0.0, 0.0, 0.0, 84, 405, 933, 2667, 833, 280, "adult", "High-protein"],
  ["Promote with Fiber", "Abbott", 1.0, 63.0, 28.0, 138.0, 14.4, 0.0, 0.0, 83, 410, 991, 2200, 933, 280, "adult", "High-protein, fiber"],
  ["Suplena with CARBSTEADY", "Abbott", 1.8, 44.8, 97.2, 194.4, 25.4, 8.5, 0.0, 73, 780, 803, 1057, 719, 169, "adult", "Non-dialysis CKD, low K/Phos"],
  ["TwoCal HN", "Abbott", 2.0, 83.5, 90.5, 218.6, 5.0, 5.0, 0, 70, 710, 844, 2110, 1321, 414, "adult", "High-cal"],
  ["Vital 1.0", "Abbott", 1.0, 40.0, 38.1, 130.0, 4.2, 4.2, 0.0, 83, 411, 861, 1477, 833, 280, "adult", "Peptide-based"],
  ["Vital 1.5", "Abbott", 1.5, 67.5, 57.1, 187.0, 6.0, 6.0, 0.0, 76, 671, 1139, 2194, 1251, 422, "adult", "Peptide-based"],
  ["Vital AF 1.2", "Abbott", 1.2, 75.0, 53.9, 110.6, 5.1, 5.1, 0.0, 81, 459, 1266, 1645, 1004, 337, "adult", "Peptide-based, anti-inflammatory"],
  ["Vital HP", "Abbott", 1.0, 87.3, 23.2, 111.0, 0.0, 0.0, 0.0, 84, 419, 1400, 1400, 835, 281, "adult", "Peptide-based, high protein"],
  ["DIABETISOURCE® AC", "Nestlé", 1.2, 60.0, 59.0, 100.0, 15.0, 0, 0, 82.0, 450.0, 1060.0, 1600.0, 800, 320, "adult", "Diabetes, stress-induced hyperglycemia; pureed fruits/vegetables, L-arginine"],
  ["FIBERSOURCE® HN", "Nestlé", 1.2, 54.0, 40.0, 164.0, 15.0, 7.5, 7.5, 81.0, 536.0, 1120.0, 1920.0, 960, 340, "adult", "Elevated protein requirements, bowel management; 50/50 soluble/insoluble fiber"],
  ["Compleat® Original 1.0", "Nestlé", 1.06, 48.0, 40.0, 136.0, 8.0, 0.0, 0.0, 83.0, 450.0, 1000.0, 1560.0, 840, 300, "adult", "Real food ingredients, chicken, peas, tomatoes, peaches"],
  ["Compleat® Original 1.5", "Nestlé", 1.5, 68.0, 72.0, 152.0, 12.0, 0.0, 0.0, 76.0, 820.0, 1400, 2200, 1600, 420, "adult", "Plant-based, vegan, real food ingredients, calorically dense"],
  ["Compleat® Peptide 1.0", "Nestlé", 1.0, 48.0, 48.0, 108.0, 12.0, 0.0, 0.0, 84.0, 450.0, 920, 1600, 960, 280, "adult", "Hydrolyzed pea protein, plant-based, 40% fat as MCT"],
  ["Compleat® Peptide 1.5", "Nestlé", 1.5, 72.0, 72.0, 152.0, 12.0, 0.0, 0.0, 76.0, 720.0, 1320.0, 2400.0, 1200.0, 420.0, "adult", "Hydrolyzed pea protein, plant-based, volume-restricted"],
  ["Compleat® Standard 1.4", "Nestlé", 1.4, 72.0, 64.0, 152.0, 16.0, 0.0, 0.0, 78.0, 600.0, 1240, 2400, 1400, 420, "adult", "Plant-based, vegan standard tube feeding, pea protein"],
  ["IMPACT® Peptide 1.5", "Nestlé", 1.5, 94.0, 63.5, 140.0, 0.0, 0.0, 0.0, 77.0, 510.0, 1170.0, 1870.0, 1000.0, 420.0, "adult", "L-arginine, omega-3 fatty acids, nucleotides for immune support"],
  ["ISOSOURCE® 1.5 Calorie", "Nestlé", 1.5, 68.0, 59.0, 176.0, 15.0, 0.0, 0.0, 76.0, 740, 1320, 2400, 1200, 420, "adult", "Standard high-calorie standard formula"],
  ["ISOSOURCE® HN", "Nestlé", 1.2, 54.0, 40.0, 156.0, 0.0, 0.0, 0.0, 81.0, 510.0, 1120.0, 1920.0, 960.0, 340, "adult", "High-protein standard tube feeding"],
  ["NOVASOURCE® Renal", "Nestlé", 2.0, 93.0, 101.5, 181.0, 0.0, 0.0, 0.0, 71.0, 800.0, 930.0, 970.0, 840, 210, "adult", "CKD on dialysis, AKI, optimized electrolytes, fluid restriction"],
  ["NUTREN® 1.5", "Nestlé", 1.52, 68.0, 60.0, 176.0, 0.0, 0.0, 0.0, 76.0, 625, 1300, 2400, 1200, 420, "adult", "High-calorie, high-protein standard formula"],
  ["NUTREN® 2.0", "Nestlé", 2.0, 84.0, 92.0, 216.0, 0.0, 0.0, 0.0, 69.0, 780, 1500, 2100, 1480, 560, "adult", "Nutrient dense, very high calorie standard formula"],
  ["PEPTAMEN AF®", "Nestlé", 1.2, 76.0, 54.0, 112.0, 6.0, 6.0, 0.0, 81.0, 390.0, 720, 1800, 800, 340, "adult", "Critical illness, ARDS/ALI, 100% whey, PREBIO1, omega-3"],
  ["PEPTAMEN®", "Nestlé", 1.0, 40.0, 40.0, 128.0, 0.0, 0.0, 0.0, 85.0, 390, 480.0, 1600.0, 700, 300, "adult", "Standard peptide-based, 100% whey, 70% fat as MCT"],
  ["PEPTAMEN® 1.5", "Nestlé", 1.5, 68.0, 56.0, 188.0, 0.0, 0.0, 0.0, 77.0, 585.0, 880.0, 2080.0, 1000.0, 420.0, "adult", "100% whey, calorically dense, malabsorption"],
  ["PEPTAMEN® 1.5 with Prebio¹™", "Nestlé", 1.5, 68.0, 56.0, 192.0, 6.0, 6.0, 0.0, 77.0, 570, 880.0, 2080.0, 1000.0, 420.0, "adult", "Added Prebio1 soluble fiber blend"],
  ["PEPTAMEN® Intense VHP", "Nestlé", 1.0, 92.0, 38.0, 76.0, 4.0, 4.0, 0.0, 84.0, 313, 680.0, 1500.0, 680, 300, "adult", "37% protein, highest protein formula, ICU obesity, PREBIO1"],
  ["PEPTAMEN® with Prebio¹™", "Nestlé", 1.0, 40.0, 40.0, 128.0, 4.0, 4.0, 0.0, 84.0, 260.0, 480.0, 1600.0, 700, 300, "adult", "Standard peptide-based with PREBIO1 soluble fiber"],
] as const;

export async function seedEnteralFormulas(db: Database): Promise<void> {
  // Clean up any duplicate seeded rows first
  try {
    await db.execute(`
      DELETE FROM enteral_formulas
      WHERE is_seeded = 1
      AND id NOT IN (
        SELECT MIN(id) FROM enteral_formulas WHERE is_seeded = 1 GROUP BY name
      )
    `);
  } catch (e) {
    console.warn("Cleanup of duplicate seeded formulas failed", e);
  }

  for (const f of SEED_FORMULAS) {
    const formulaName = f[0] as string;

    const existing = await db.select<any[]>(
      `SELECT id FROM enteral_formulas WHERE name = ? AND is_seeded = 1`,
      [formulaName]
    );

    if (existing.length === 0) {
      await db.execute(
        `INSERT INTO enteral_formulas
          (id, name, manufacturer, kcal_per_ml, protein_g_per_l, fat_g_per_l,
           cho_g_per_l, fiber_total_g_per_l, fiber_soluble_g_per_l,
           fiber_insoluble_g_per_l, free_water_pct, osmolality,
           na_mg_per_l, k_mg_per_l, phos_mg_per_l, mg_mg_per_l,
           route, notes, is_seeded, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
        [crypto.randomUUID(), ...f, new Date().toISOString()]
      );
    }
  }
}