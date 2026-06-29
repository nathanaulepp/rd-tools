// src/shared/api/db.seed.diets.ts
// Seed data for hospital_diets and hospital_dysphagia_mods tables.
// Called once during schema initialisation by db.connection.ts.

import type Database from "@tauri-apps/plugin-sql";

const DEFAULT_DIETS = [
  "Regular",
  "NPO",
  "Full Liquid",
  "Clear Liquid",
  "Cardiac",
  "Diabetic / Consistent CHO",
  "Renal Low PRO",
  "Renal High PRO",
  "Low Na (<2g)",
  "Fat Restricted",
  "Low Fiber",
  "High Fiber",
  "Gluten Free",
  "Dairy Allergies",
  "Peanut Allergy",
  "Tree Nut Allergy",
  "Fish Allergy",
  "Shellfish Allergy",
  "Egg Allergy",
  "Wheat Allergy",
  "Soy Allergy",
  "Sesame Allergy",
] as const;

export async function seedHospitalDiets(db: Database): Promise<void> {
  const dietCount = await db.select<{ count: number }[]>(
    `SELECT COUNT(*) as count FROM hospital_diets`
  );
  if (dietCount[0].count === 0) {
    for (let i = 0; i < DEFAULT_DIETS.length; i++) {
      await db.execute(
        `INSERT INTO hospital_diets (id, name, sort_order, created_at)
         VALUES (?, ?, ?, ?)`,
        [crypto.randomUUID(), DEFAULT_DIETS[i], i, new Date().toISOString()]
      );
    }
  }
}