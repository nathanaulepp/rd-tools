// src/shared/api/db.seed.dysphagia.ts
// Seed data for the hospital_dysphagia_mods table.
// Called once during schema initialisation by db.connection.ts.

import type Database from "@tauri-apps/plugin-sql";

type DysphagiaCategory = "Food" | "Liquid" | "Other";

interface DysphagiaModSeed {
  name: string;
  category: DysphagiaCategory;
}

const DEFAULT_DYSPHAGIA_MODS: readonly DysphagiaModSeed[] = [
  { name: "Level 7 — Regular",           category: "Food"   },
  { name: "Level 6 — Soft & Bite-Sized", category: "Food"   },
  { name: "Level 5 — Minced & Moist",    category: "Food"   },
  { name: "Level 4 — Pureed",            category: "Food"   },
  { name: "Level 3 — Liquidized",        category: "Food"   },
  { name: "Level 0 — Thin Liquids",      category: "Liquid" },
  { name: "Level 1 — Slightly Thick",    category: "Liquid" },
  { name: "Level 2 — Mildly Thick",      category: "Liquid" },
  { name: "Level 3 — Moderately Thick",  category: "Liquid" },
  { name: "Level 4 — Extremely Thick",   category: "Liquid" },
];

export async function seedHospitalDysphagiaeMods(db: Database): Promise<void> {
  const count = await db.select<{ count: number }[]>(
    `SELECT COUNT(*) as count FROM hospital_dysphagia_mods`
  );
  if (count[0].count === 0) {
    for (let i = 0; i < DEFAULT_DYSPHAGIA_MODS.length; i++) {
      const d = DEFAULT_DYSPHAGIA_MODS[i];
      await db.execute(
        `INSERT INTO hospital_dysphagia_mods (id, name, category, sort_order, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        [crypto.randomUUID(), d.name, d.category, i, new Date().toISOString()]
      );
    }
  }
}