// src/shared/api/db.ts

import Database from "@tauri-apps/plugin-sql";
import { getLocalIsoDate } from "../utils/date";

// ─── Singleton connection ─────────────────────────────────────────────────────
let _db: Database | null = null;

export async function getDb(): Promise<Database> {
  if (_db) return _db;
  _db = await Database.load("sqlite:rd_workstation.db");
  await initSchema(_db);
  return _db;
}

// ─── Schema initialization ────────────────────────────────────────────────────
async function initSchema(db: Database): Promise<void> {
  await db.execute("PRAGMA foreign_keys = ON");

  // patients
  await db.execute(`
    CREATE TABLE IF NOT EXISTS patients (
      id            TEXT PRIMARY KEY,
      first_name    TEXT NOT NULL,
      last_name     TEXT NOT NULL,
      dob           TEXT NOT NULL,
      sex           TEXT,
      mrn           TEXT,
      languages     TEXT,
      created_at    TEXT NOT NULL
    )
  `);

  // encounters (Hospital Admissions)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS encounters (
      id              TEXT PRIMARY KEY,
      patient_id      TEXT NOT NULL,
      admission_date  TEXT NOT NULL,
      discharge_date  TEXT,
      created_at      TEXT NOT NULL,
      FOREIGN KEY (patient_id) REFERENCES patients(id)
    )
  `);

  // notes — original schema
  await db.execute(`
    CREATE TABLE IF NOT EXISTS notes (
      id              TEXT PRIMARY KEY,
      patient_id      TEXT NOT NULL,
      note_date       TEXT,
      admission_date  TEXT,
      status          TEXT NOT NULL DEFAULT 'draft',
      version         INTEGER NOT NULL DEFAULT 1,
      parent_note_id  TEXT,
      anthro          TEXT,
      labs            TEXT,
      clinical        TEXT,
      dietary         TEXT,
      dexa_scans      TEXT,
      created_at      TEXT NOT NULL,
      submitted_at    TEXT,
      FOREIGN KEY (patient_id) REFERENCES patients(id)
    )
  `);

  // Phase 6: Add new ADIME domain columns
  const newColumns = [
    { name: "diagnosis",        type: "TEXT" },
    { name: "intervention",     type: "TEXT" },
    { name: "monitor_evaluate", type: "TEXT" },
    { name: "standards",        type: "TEXT" },
    { name: "refeeding_screen", type: "TEXT" },
    { name: "patient_history",   type: "TEXT" },
  ];

  for (const col of newColumns) {
    try {
      await db.execute(`ALTER TABLE notes ADD COLUMN ${col.name} ${col.type}`);
    } catch (_e) {}
  }

  // Phase 7: Add encounter_id to link notes to the parent Admission
  try {
    await db.execute(`ALTER TABLE notes ADD COLUMN encounter_id TEXT REFERENCES encounters(id)`);
  } catch (_e) {}

  // ── IDEMPOTENT MIGRATION ──
  // Scan notes without an encounter_id and group them by (patient_id + admission_date)
  const unlinkedNotes = await db.select<any[]>(
    `SELECT id, patient_id, admission_date FROM notes WHERE encounter_id IS NULL`
  );

  for (const note of unlinkedNotes) {
    if (!note.admission_date) continue;

    // Find or create encounter
    const existing = await db.select<any[]>(
      `SELECT id FROM encounters WHERE patient_id = ? AND admission_date = ?`,
      [note.patient_id, note.admission_date]
    );

    let eid: string;
    if (existing.length > 0) {
      eid = existing[0].id;
    } else {
      eid = uuid();
      await db.execute(
        `INSERT INTO encounters (id, patient_id, admission_date, created_at)
         VALUES (?, ?, ?, ?)`,
        [eid, note.patient_id, note.admission_date, new Date().toISOString()]
      );
    }

    // Link the note
    await db.execute(`UPDATE notes SET encounter_id = ? WHERE id = ?`, [eid, note.id]);
  }

  // submission_requirements
  await db.execute(`
    CREATE TABLE IF NOT EXISTS submission_requirements (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      field_key   TEXT NOT NULL UNIQUE,
      label       TEXT NOT NULL,
      required    INTEGER NOT NULL DEFAULT 1,
      created_at  TEXT NOT NULL
    )
  `);

  // Phase 8: User presets — global, not per-note
  await db.execute(`
    CREATE TABLE IF NOT EXISTS user_presets (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      lab_keys    TEXT NOT NULL,
      created_at  TEXT NOT NULL
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS enteral_formulas (
      id                    TEXT PRIMARY KEY,
      name                  TEXT NOT NULL,
      manufacturer          TEXT NOT NULL DEFAULT '',
      kcal_per_ml           REAL,
      protein_g_per_l       REAL,
      fat_g_per_l           REAL,
      cho_g_per_l           REAL,
      fiber_total_g_per_l   REAL,
      fiber_soluble_g_per_l REAL,
      fiber_insoluble_g_per_l REAL,
      free_water_pct        REAL,
      osmolality            REAL,
      na_mg_per_l           REAL,
      k_mg_per_l            REAL,
      phos_mg_per_l         REAL,
      mg_mg_per_l           REAL,
      route                 TEXT NOT NULL DEFAULT '',
      notes                 TEXT NOT NULL DEFAULT '',
      is_seeded             INTEGER NOT NULL DEFAULT 0,
      created_at            TEXT NOT NULL
    )
  `);

  // Seed common hospital formulas (INSERT OR IGNORE = never overwrites user edits)
  const seedFormulas = [
    // name, manufacturer, kcal/mL, prot g/L, fat g/L, cho g/L, fiber_tot, fiber_sol, fiber_ins, fwpct, osm, na, k, phos, mg, population, notes
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
    ["TwoCal HN", "Abbott", 2.0, 83.5, 90.5, 218.6, 5.0, 5.0, 0,0, 70, 710, 844, 2110, 1321, 414, "adult", "High-cal"],
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
    ["PEPTAMEN® with Prebio¹™", "Nestlé", 1.0, 40.0, 40.0, 128.0, 4.0, 4.0, 0.0, 84.0, 260.0, 480.0, 1600.0, 700, 300, "adult", "Standard peptide-based with PREBIO1 soluble fiber"]
  ];

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
  for (const f of seedFormulas) {
    const formulaName = f[0]; // The name is the first item in the array
    
    // Check if a seeded formula with this name already exists
    const existing = await db.select<any[]>(
      `SELECT id FROM enteral_formulas WHERE name = ? AND is_seeded = 1`,
      [formulaName]
    );

    // Only insert if it's missing
    if (existing.length === 0) {
      await db.execute(
        `INSERT INTO enteral_formulas
          (id, name, manufacturer, kcal_per_ml, protein_g_per_l, fat_g_per_l,
           cho_g_per_l, fiber_total_g_per_l, fiber_soluble_g_per_l,
           fiber_insoluble_g_per_l, free_water_pct, osmolality,
           na_mg_per_l, k_mg_per_l, phos_mg_per_l, mg_mg_per_l,
           route, notes, is_seeded, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
        [uuid(), ...f, new Date().toISOString()]
      );
    }
  }

  // Hospital diet list
  await db.execute(`
    CREATE TABLE IF NOT EXISTS hospital_diets (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      sort_order  INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT NOT NULL
    )
  `);

  const defaultDiets = [
    { name: "Regular" },
    { name: "NPO" },
    { name: "Full Liquid" },
    { name: "Clear Liquid" },
    { name: "Cardiac" },
    { name: "Diabetic / Consistent CHO" },
    { name: "Renal Low PRO" },
    { name: "Renal High PRO" },
    { name: "Low Na (<2g)" },
    { name: "Fat Restricted" },
    { name: "Low Fiber" },
    { name: "High Fiber" },
    { name: "Gluten Free" },
    { name: "Dairy Allergies" },
    { name: "Peanut Allergy" },
    { name: "Tree Nut Allergy" },
    { name: "Fish Allergy" },
    { name: "Shellfish Allergy" },
    { name: "Egg Allergy" },
    { name: "Wheat Allergy" },
    { name: "Soy Allergy" },
    { name: "Sesame Allergy" },
  ];

  // Only seed defaults if the table is completely empty.
  // If the user has deleted defaults, that is intentional — do not re-insert.
  const dietCount = await db.select<{ count: number }[]>(
    `SELECT COUNT(*) as count FROM hospital_diets`
  );
  if (dietCount[0].count === 0) {
    for (let i = 0; i < defaultDiets.length; i++) {
      const d = defaultDiets[i];
      await db.execute(
        `INSERT INTO hospital_diets (id, name, sort_order, created_at)
         VALUES (?, ?, ?, ?)`,
        [uuid(), d.name, i, new Date().toISOString()]
      );
    }
  }

  // Dysphagia modification list
  await db.execute(`
    CREATE TABLE IF NOT EXISTS hospital_dysphagia_mods (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      category    TEXT NOT NULL DEFAULT 'Food',
      sort_order  INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT NOT NULL
    )
  `);

  // Idempotent migration: add category column to existing databases
  try {
    await db.execute(`ALTER TABLE hospital_dysphagia_mods ADD COLUMN category TEXT NOT NULL DEFAULT 'Food'`);
  } catch (_e) {}

  const defaultDysphagiaMods: { name: string; category: "Food" | "Liquid" | "Other" }[] = [
    { name: "Level 7 — Regular",        category: "Food" },
    { name: "Level 6 — Soft & Bite-Sized", category: "Food" },
    { name: "Level 5 — Minced & Moist", category: "Food" },
    { name: "Level 4 — Pureed",         category: "Food" },
    { name: "Level 3 — Liquidized",     category: "Food" },
    { name: "Level 4 — Extremely Thick", category: "Liquid" },
    { name: "Level 3 — Moderately Thick", category: "Liquid" },
    { name: "Level 2 — Mildly Thick",   category: "Liquid" },
    { name: "Level 1 — Slightly Thick", category: "Liquid" },
    { name: "Level 0 — Thin Liquids",   category: "Liquid" },
  ];

  const dysphagiaMobCount = await db.select<{ count: number }[]>(
    `SELECT COUNT(*) as count FROM hospital_dysphagia_mods`
  );
  if (dysphagiaMobCount[0].count === 0) {
    for (let i = 0; i < defaultDysphagiaMods.length; i++) {
      const d = defaultDysphagiaMods[i];
      await db.execute(
        `INSERT INTO hospital_dysphagia_mods (id, name, category, sort_order, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        [uuid(), d.name, d.category, i, new Date().toISOString()]
      );
    }
  }

  // 1. Condition tree
  await db.execute(`
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
    )
  `);

  // 2. Equations per leaf node
  await db.execute(`
    CREATE TABLE IF NOT EXISTS custom_equations (
      id            TEXT PRIMARY KEY,
      condition_id  TEXT NOT NULL REFERENCES custom_conditions(id),
      nutrient      TEXT NOT NULL,
      expression    TEXT NOT NULL,
      unit          TEXT NOT NULL,
      display_label TEXT NOT NULL,
      sort_order    INTEGER NOT NULL DEFAULT 0,
      created_at    TEXT NOT NULL
    )
  `);

  // 3. Clinical guidance notes per equation or condition
  await db.execute(`
    CREATE TABLE IF NOT EXISTS custom_equation_notes (
      id            TEXT PRIMARY KEY,
      equation_id   TEXT REFERENCES custom_equations(id),
      condition_id  TEXT REFERENCES custom_conditions(id),
      note_text     TEXT NOT NULL,
      sort_order    INTEGER NOT NULL DEFAULT 0
    )
  `);

  // 4. Extra inputs required per leaf node condition
  await db.execute(`
    CREATE TABLE IF NOT EXISTS condition_extra_inputs (
      id             TEXT PRIMARY KEY,
      condition_id   TEXT NOT NULL REFERENCES custom_conditions(id),
      slug           TEXT NOT NULL,
      display_label  TEXT NOT NULL,
      input_type     TEXT NOT NULL,
      hint_text      TEXT,
      sort_order     INTEGER NOT NULL DEFAULT 0
    )
  `);

  const now = new Date().toISOString();

  const defaultRequirements = [
    { field_key: "first_name",     label: "First Name" },
    { field_key: "last_name",      label: "Last Name"  },
    { field_key: "dob",            label: "Date of Birth" },
    { field_key: "sex",            label: "Sex" },
    { field_key: "note_date",      label: "Note Date"  },
    { field_key: "diagnosis",      label: "Nutrition Diagnosis (P)" },
    { field_key: "etiology",       label: "Primary Etiology (E)" },
    { field_key: "signsSymptoms",  label: "Primary Signs/Symptoms (S)" },
    { field_key: "chiefComplaint", label: "Chief Complaint" },
    { field_key: "dietOrder",      label: "Rx Diet Order" },
  ];

  for (const req of defaultRequirements) {
    await db.execute(
      `INSERT OR IGNORE INTO submission_requirements
         (field_key, label, required, created_at)
       VALUES (?, ?, 1, ?)`,
      [req.field_key, req.label, now]
    );
    // Sync the label in case it was seeded with an old value
    await db.execute(
      `UPDATE submission_requirements SET label = ? WHERE field_key = ?`,
      [req.label, req.field_key]
    );
  }

  await seedEquationEngine(db);
}

async function seedEquationEngine(db: Database): Promise<void> {


  const SEED_IDS = {
    // ─── Critical Illness ───────────────────────────────────────────────────
    crit_ill_root: "24569aa6-3b20-4fc6-a8f5-9ea50d4f8c77",
    crit_ill_adult: "143da29d-6b66-4f23-a663-5c43c542c7da",
    crit_ill_bmi_lt30: "555b185e-a90a-4299-bbdf-593fa759f3a7",
    crit_ill_bmi_30_50: "6b93a785-beb8-48d6-958e-485bef034da8",
    crit_ill_bmi_gt50: "b2c92094-c5a0-4599-9550-210493b382e4",

    crit_ill_lt30_kcal_low: "880bb86c-41b4-4b91-a2b2-d16e98ab3f56",
    crit_ill_lt30_kcal_high: "fa3132dc-9a4c-4963-a3ef-f56fc644f81f",
    crit_ill_lt30_prot_low: "2ae93032-beee-4256-8019-a7239b43dcfd",
    crit_ill_lt30_prot_high: "79326093-ae27-4e7f-9fff-101d3299db21",
    crit_ill_lt30_note1: "87c51e30-2cc4-4cb8-8b28-344bdee06b29",
    crit_ill_lt30_note2: "e9e4e9a9-0709-4476-bf2c-61b047e690b8",

    crit_ill_30_50_kcal_low: "684951f9-2dd4-45ec-92ff-bd4c4aed60de",
    crit_ill_30_50_kcal_high: "823d6c63-1455-46f2-8f93-096cf5e60881",
    crit_ill_30_50_prot_low: "33abef6f-cb06-4dbb-851a-87557a21e507",
    crit_ill_30_50_prot_high: "56a6afdd-7ffa-4406-802b-7efe37df8e85",
    crit_ill_30_50_note1: "fbd75c3f-0fff-489d-929c-d6626a4b283a",
    crit_ill_30_50_note2: "6e0ac609-ddbf-4d6e-8cb1-7598cef6bf88",
    crit_ill_30_50_note3: "cacd724e-d5d6-4a1c-a9ec-9583117245d7",

    crit_ill_gt50_kcal_low: "02f44926-c894-4e4e-a960-f9e126aa2ffb",
    crit_ill_gt50_kcal_high: "f5acd20f-38a3-4c66-aa0d-97022da79cbb",
    crit_ill_gt50_prot_low: "b19c57f6-2698-4581-82aa-8187005fc8f7",
    crit_ill_gt50_prot_high: "445d7aba-5fcb-49a4-af3f-83cf0b2809fe",
    crit_ill_gt50_note1: "768ffd32-0ed7-41ba-8654-f8a39f566c1a",
    crit_ill_gt50_note2: "460cf2b5-b206-40c5-93df-6b95ec435ec6",
    crit_ill_gt50_note3: "e131e283-dc12-475d-bf5d-07c96d5da098",

    // ─── AKI ───────────────────────────────────────────────────────────────
    aki_root: "d9074d2d-a8d4-455c-8171-57c96655b738",
    aki_adult: "2942afca-5507-47d1-8ca0-ecf4f9654f56",
    aki_no_dialysis: "ef67362f-7406-4399-9a0d-3f4d60606f09",
    aki_hemodialysis: "9b8eedef-8094-47e2-8a1a-c290ac5bdf41",
    aki_crrt: "d1bbb747-06a6-4365-adfa-807aa0031d6b",

    aki_no_dial_kcal_low: "a3c5943e-9959-4dc5-937a-1d689c2f3866",
    aki_no_dial_kcal_high: "c8aa423b-ccd0-403a-aaa9-a81eb11bd203",
    aki_no_dial_prot_low: "f2866734-e65b-4630-9300-ab1f09efe889",
    aki_no_dial_prot_high: "1a3d9157-b98a-46a5-973b-f6a71bfed888",
    aki_no_dial_note1: "85547c11-174b-4783-90d8-8483af37dd58",
    aki_no_dial_note2: "1a29d9d4-adca-4130-94aa-394af677fb78",

    aki_hd_kcal_low: "e4b5102a-8fa4-42b6-98d5-c2a18f687d1b",
    aki_hd_kcal_high: "46a90f4c-b936-4d99-a173-6fdd4533dd57",
    aki_hd_prot_low: "26facdfc-1754-4393-b91c-30aba00138c6",
    aki_hd_prot_high: "b7ad9f6b-31dc-43cc-a1e2-ab7291b5ff09",
    aki_hd_note1: "9d9a4098-6899-485c-a4e2-95f24322ec2c",
    aki_hd_note2: "0ed15b01-6ce1-49ed-9dcd-992760ad4809",

    aki_crrt_kcal_low: "5f463292-3940-4468-aa5e-24b50f1aed7d",
    aki_crrt_kcal_high: "4ed7c218-5dd6-41bf-a437-5c8cfbf76212",
    aki_crrt_prot_low: "2da12d89-81de-48ba-9620-006c4d95f582",
    aki_crrt_prot_high: "c10112aa-4551-4047-824b-343f32d76240",
    aki_crrt_note1: "71ce2cc9-a9e7-409c-a7aa-d1f491416819",
    aki_crrt_note2: "ad8d6bfd-783e-4ff2-bd10-d24fe1d126eb",
    aki_crrt_note3: "37e0d5d6-d177-4180-bd89-90c9d62094f5",

    // ─── Acute Pancreatitis ─────────────────────────────────────────────────
    pancreatitis_root: "3556410f-7176-4b91-97a4-adc52dc59a65",
    pancreatitis_adult: "6d14aa26-ce9b-40b4-a734-964c6e6f0e5b",
    pancreatitis_mild_mod: "b4ce6f78-7a30-493a-8b46-97334e7cf8cb",
    pancreatitis_severe_crit: "eddd1fe4-cb96-4475-aaba-2673b4d2d2c5",

    pancreatitis_mild_kcal_low: "42b5c81f-f4ab-4b26-96fa-600aaf78d733",
    pancreatitis_mild_kcal_high: "c37b2974-6a01-470d-a196-0b1a72172d2b",
    pancreatitis_mild_prot_low: "666cf333-e697-48d7-bef8-cd4cadde870c",
    pancreatitis_mild_prot_high: "c1319831-87e8-44cb-88b0-8f54ad724925",
    pancreatitis_mild_note1: "9c104460-96b2-4970-806a-a3f6a6ff2014",
    pancreatitis_mild_note2: "de4f0755-a78d-4980-a84b-faf69b397958",

    pancreatitis_severe_kcal_low: "ba2e3c17-f502-4b3d-854c-a49b24db1e6e",
    pancreatitis_severe_kcal_high: "f2f30bb2-2a3d-46ef-928c-101c2e1023a6",
    pancreatitis_severe_prot_low: "c31093c9-dffa-494c-ab09-c2e50fad8fc7",
    pancreatitis_severe_prot_high: "e45087eb-446b-4066-a81e-1b23869dda38",
    pancreatitis_severe_note1: "240725ab-fc88-4ea2-96c6-8b40c20d1c69",
    pancreatitis_severe_note2: "d5d8d9d6-f959-49f5-aab2-0dae6c2c7521",
    pancreatitis_ic_note: "14273433-bcb5-433a-bd9f-d31cdb28fe9b",

    // ─── Trauma ─────────────────────────────────────────────────────────────
    trauma_root: "a152d4d8-0efc-4bfd-9567-0fc5e8fcbd19",
    trauma_adult: "b2e11c5a-b4ba-400b-9f36-6c2daaf2c3bc",
    trauma_standard: "43d18d92-b757-4a78-9c69-4153ab8559bb",
    trauma_open_abdomen: "eb75700e-abee-481a-8972-a68120ab349b",

    trauma_std_kcal_low: "bb6f35d9-e4c9-4499-95c5-8ecdf5021997",
    trauma_std_kcal_high: "e7f9d3d5-232d-4acf-b996-16408d72d60a",
    trauma_std_prot_low: "d85a8f65-b6ba-4047-a189-5930e6342bbb",
    trauma_std_prot_high: "2f64b5ec-dcdb-4951-a798-b17f34139b42",
    trauma_std_note1: "d571b0ec-cb0f-4322-99ae-c2641ecf61c8",
    trauma_std_note2: "5d4b2612-60f0-4d5a-a61c-40df3c3ac6db",

    trauma_open_kcal_low: "0e60c6c3-966b-429f-aff4-5d5fbcfc05e8",
    trauma_open_kcal_high: "c4b0f69d-35dc-46e2-b389-7c0ffbce0a5e",
    trauma_open_prot_low: "800d8475-4c7f-4956-9474-fbbc18e52680",
    trauma_open_prot_high: "a94b7d8f-024e-42c7-8405-a934e7de2666",
    trauma_open_note1: "450a4fa1-312e-4f58-b90e-a64e0b88fe48",
    trauma_open_note2: "550bb86c-41b4-4b91-a2b2-d16e98ab3f56",
    trauma_open_note3: "660bb86c-41b4-4b91-a2b2-d16e98ab3f56",

    // ─── Burns ──────────────────────────────────────────────────────────────
    burns_root: "770bb86c-41b4-4b91-a2b2-d16e98ab3f56",
    burns_adult: "780bb86c-41b4-4b91-a2b2-d16e98ab3f56",
    burns_toronto: "7a0bb86c-41b4-4b91-a2b2-d16e98ab3f56",

    burns_toronto_kcal_low: "800bb86c-41b4-4b91-a2b2-d16e98ab3f59",
    burns_toronto_kcal_high: "80bb86ca-11b4-4b91-a2b2-d16e98ab3f56",
    burns_toronto_prot_low: "80bb86ca-21b4-4b91-a2b2-d16e98ab3f56",
    burns_toronto_prot_high: "80bb86ca-31b4-4b91-a2b2-d16e98ab3f56",
    burns_toronto_note1: "80bb86ca-41b4-4b91-a2b2-d16e98ab3f56",
    burns_toronto_note2: "80bb86ca-51b4-4b91-a2b2-d16e98ab3f56",
    burns_toronto_note3: "80bb86ca-61b4-4b91-a2b2-d16e98ab3f56",
    burns_ic_note: "0299dc32-dadc-4f1f-b40f-f8b7fcfbe9c8",

    // ─── Stroke ─────────────────────────────────────────────────────────────
    stroke_root: "80bb86ca-71b4-4b91-a2b2-d16e98ab3f56",
    stroke_adult: "80bb86ca-81b4-4b91-a2b2-d16e98ab3f56",
    stroke_ischemic: "80bb86ca-91b4-4b91-a2b2-d16e98ab3f56",
    stroke_hemorrhagic: "80bb86ca-a1b4-4b91-a2b2-d16e98ab3f56",

    stroke_isc_kcal_low: "80bb86ca-b1b4-4b91-a2b2-d16e98ab3f56",
    stroke_isc_kcal_high: "80bb86ca-c1b4-4b91-a2b2-d16e98ab3f56",
    stroke_isc_prot_low: "80bb86ca-d1b4-4b91-a2b2-d16e98ab3f56",
    stroke_isc_prot_high: "80bb86ca-e1b4-4b91-a2b2-d16e98ab3f56",
    stroke_isc_note1: "80bb86ca-f1b4-4b91-a2b2-d16e98ab3f56",
    stroke_isc_note2: "80bb86cb-01b4-4b91-a2b2-d16e98ab3f56",

    stroke_hem_kcal_low: "80bb86cb-11b4-4b91-a2b2-d16e98ab3f56",
    stroke_hem_kcal_high: "80bb86cb-21b4-4b91-a2b2-d16e98ab3f56",
    stroke_hem_prot_low: "80bb86cb-31b4-4b91-a2b2-d16e98ab3f56",
    stroke_hem_prot_high: "80bb86cb-41b4-4b91-a2b2-d16e98ab3f56",
    stroke_hem_note1: "80bb86cb-51b4-4b91-a2b2-d16e98ab3f56",
    stroke_hem_note2: "80bb86cb-61b4-4b91-a2b2-d16e98ab3f56",

    // ─── COPD ───────────────────────────────────────────────────────────────
    copd_root: "fef0537b-e899-4617-8adb-b08ecd11a75c",
    copd_adult: "f82c5664-72da-4fad-b9e2-72bed4ae3c9b",
    copd_standard: "67f9911d-6c3f-475a-9321-0cc315285404",

    copd_std_kcal_low: "a6a48753-1987-4e69-b1f2-8d14fcbae4a2",
    copd_std_kcal_high: "bfed715c-5249-47c3-93c8-9f58262dc4a2",
    copd_std_prot_low: "0842b724-a482-4516-b19c-58c8b2646eb7",
    copd_std_prot_high: "a52ef462-5a8f-4230-b230-df31e29c966e",
    copd_std_note1: "7bee51c9-e3ee-4c13-a2fd-6c06e4f355ce",
    copd_std_note2: "0aadec47-5c38-460d-9d55-c42cc98abeb0",

    // ─── Heart Failure ──────────────────────────────────────────────────────
    heart_failure_root: "dd2cd4df-811e-4559-a149-a08e835dd3bc",
    heart_failure_adult: "17f18a19-8f1f-4e30-aa80-c800568173f7",
    heart_failure_standard: "18d65d08-bca2-460a-9a3e-1bfa24456183",

    heart_failure_std_kcal_low: "d3ed0d73-25b2-4417-9dd7-f8dd64035dc6",
    heart_failure_std_kcal_high: "216f0cf9-4400-44bd-aed4-62286b1f7aca",
    heart_failure_std_prot_low: "c35a64f3-8d03-4d14-bb8b-6023672b04e8",
    heart_failure_std_prot_high: "7cfeaee7-3861-4aa1-be7c-961ac0d4f3ba",
    heart_failure_std_note1: "3444628a-24ea-4c1e-9bd1-e8b7dbdb3776",
    heart_failure_std_note2: "6d202fdd-caab-4068-96bc-12ddce5ec5ff",

    // ─── Cirrhosis ──────────────────────────────────────────────────────────
    cirrhosis_root: "be4f0477-58a5-4bab-b679-eb4ede89894f",
    cirrhosis_adult: "5a087f64-8156-43b0-a72e-40a83a05500a",
    cirrhosis_compensated: "8a4dec75-2ef7-4821-8aa8-21bbb9e9c8e0",
    cirrhosis_decompensated: "a15f89ce-2b71-4666-ada6-fa14aef6b7e7",

    cirrhosis_comp_kcal_low: "1d864ef0-8a0c-4c85-ac46-c0671eada83b",
    cirrhosis_comp_kcal_high: "b2b950f3-6241-489b-ab7d-f8311a7b4d94",
    cirrhosis_comp_prot_low: "2d81bb5d-1a2a-455a-a5e7-96b0ecdc4784",
    cirrhosis_comp_prot_high: "aa7e9ee4-7ddf-44b9-a319-6ce60d69c8cc",
    cirrhosis_comp_note1: "b116cd83-e9a7-4e41-9ffd-17c923a5d940",
    cirrhosis_comp_note2: "092a8c5b-d6fa-4756-8cf1-1fc72559d666",
    cirrhosis_comp_note3: "1f8c0512-0247-4b6f-b630-8addeb65d4ed",
    cirrhosis_comp_note4: "bc0a2c9e-3992-45d6-8235-ca1f8cd48553",

    cirrhosis_decomp_kcal_low: "435efb60-f5a0-4d35-9a91-25d474b7438a",
    cirrhosis_decomp_kcal_high: "4cd043bd-7730-42ee-bb13-6b4d658c6843",
    cirrhosis_decomp_prot_low: "606ca5e0-ebb5-4411-bb51-f8845520c3e9",
    cirrhosis_decomp_prot_high: "b3f19836-e9d5-479a-b4b4-a530802f7554",
    cirrhosis_decomp_note1: "89a2b457-829b-4713-86fa-4e93ec4e8760",
    cirrhosis_decomp_note2: "6bce7e3f-7e79-4b4e-90fc-8d4f9bbda11b",
    cirrhosis_decomp_note3: "fcc033c3-a5e9-41c0-b325-fad2b968dafc",
    cirrhosis_decomp_note4: "b7c44c36-7c33-4fb6-b7c3-a05b54f4bc11",
    cirrhosis_decomp_note5: "87e2ce8f-2dcf-469c-867e-c499ab472f8f",

    // ─── Liver Transplant ───────────────────────────────────────────────────
    liver_transplant_root: "d496ee92-fd8c-45f2-9434-63f55b405fad",
    liver_transplant_adult: "30ffb4da-3b92-4461-926a-e8c993d426b5",
    liver_transplant_acute: "e36c76a3-37ce-475f-b91c-df4d5f88f460",
    liver_transplant_chronic: "5bb88aa3-7105-48b8-9d51-c719dbe0b2f8",

    liver_transplant_acute_kcal: "0cc2bdb2-f607-4be3-84ea-ab77c1c0e2b7",
    liver_transplant_acute_prot_low: "b322a913-ca52-40f8-ba90-122da218d6b4",
    liver_transplant_acute_prot_high: "fdaa5b74-4d87-470a-b30e-e9b497fe36a2",
    liver_transplant_acute_note1: "29c60318-7908-45bf-96f8-ddd58aeb401d",

    liver_transplant_chronic_kcal_low: "719a8e8b-eb54-4981-8785-d74fad6309b0",
    liver_transplant_chronic_kcal_high: "5778b68c-045e-4a07-95c9-25a3c6b14528",
    liver_transplant_chronic_prot_low: "a1e3e975-be32-4b0f-86f2-092d0b7d4c4f",
    liver_transplant_chronic_prot_high: "2b055478-5bfb-4a37-92a4-67f896bc77c7",

    // ─── CKD ────────────────────────────────────────────────────────────────
    ckd_root: "c80f6b69-a0b2-4207-8dbb-b20c3db2ef9a",
    ckd_adult_3_5: "d8de9719-c878-4ece-b00f-9993d541d823",
    ckd_vlpd: "d4c82475-053b-458b-88f3-b04d401bc1ad",
    ckd_lpd: "7ee94b4a-fb53-4542-af85-4ed77b1f3a46",
    ckd_lpd_dm: "aa5eff9e-d7a9-4097-9d6d-6673558decec",

    ckd_vlpd_kcal_low: "da33bf3d-4942-408f-9416-6a7e7b50eaff",
    ckd_vlpd_kcal_high: "829aeabe-a055-415a-a967-31ae084b78d1",
    ckd_vlpd_prot_low: "b5665a22-2b29-4ae0-90a6-5c47c793bd29",
    ckd_vlpd_prot_high: "f4b8749c-f055-42e8-935a-6f983a090022",
    ckd_vlpd_note1: "2f43e465-be28-455e-8b7b-16892b6a97f7",

    ckd_lpd_kcal_low: "c455c103-9de4-4ef0-b388-c40f19212112",
    ckd_lpd_kcal_high: "317b8b92-64db-41a1-afa5-9159bf30ab70",
    ckd_lpd_prot_low: "a1e314c4-6609-4dce-8601-82a26bfe450e",
    ckd_lpd_prot_high: "c5e05584-1329-4415-a208-a5e0a9e16633",
    ckd_lpd_note1: "7473c4af-0126-43a5-946a-42dc1c180a10",

    ckd_lpddm_kcal_low: "53422fe5-1439-42e8-beb9-5d43f6fb109e",
    ckd_lpddm_kcal_high: "d3d73cbf-450a-4f9b-9f73-0280d9e7918f",
    ckd_lpddm_prot_low: "781aded4-e6be-4385-8f1e-aadb74de77c3",
    ckd_lpddm_prot_high: "901dab30-eefa-4354-90bf-cc82bf981fed",
    ckd_lpddm_note1: "a237ba2e-b92c-4245-a797-bcad70ed31c2",

    ckd_adult_5d: "1cd5eae8-66e1-4365-aca0-a5c54783e06c",
    ckd_hd: "ab94dc5b-4e2b-45b7-b373-df1ea313917e",
    ckd_pd: "22b972e5-4340-428b-97cd-b2ff15156f55",

    ckd_hd_kcal_low: "324b04c4-d250-48f0-9443-7ac8ed4b4f46",
    ckd_hd_kcal_high: "88800806-5313-42fc-afd3-010e992113c2",
    ckd_hd_prot_low: "cd7dec8e-2c06-4636-b5b3-ff6915cedf62",
    ckd_hd_prot_high: "95c34361-5ad6-4cbd-b695-7475c3003a39",
    ckd_hd_note1: "ab38795d-5193-4701-a583-92b0b5c0f626",

    ckd_pd_kcal_low: "87e0bc77-a6ad-4c96-8f69-f59c344876cb",
    ckd_pd_kcal_high: "e4fa06c9-dbc4-4e53-beef-8fdf49c9cfee",
    ckd_pd_prot_low: "6a7648d4-3eff-469d-b854-62b65316a836",
    ckd_pd_prot_high: "e4defe1c-5c10-4254-b424-171c1653ca41",
    ckd_pd_note1: "3cb5f5b3-2c80-4881-a4fb-4dcf43cd2608",

    // ─── Kidney Transplant ──────────────────────────────────────────────────
    kidney_transplant_root: "70db06df-b8c8-4c43-bb9b-eedfbe1813e2",
    kidney_transplant_adult: "483148fa-2320-45e8-bb93-871513c737e5",
    kidney_transplant_acute: "91fdcb71-13d4-4231-83ab-cbfd2aa1dfb6",
    kidney_transplant_chronic: "da734a46-cb54-48f5-a64f-fa7a3a231632",
    kidney_transplant_chronic_dm: "c1da6dec-ffd4-4ac6-b390-a1434c6f67bc",

    kidney_transplant_acute_kcal_low: "cb0915f7-8929-4721-9465-5be1734e10c7",
    kidney_transplant_acute_kcal_high: "914fc920-38c8-4f79-aaac-79ae85942d00",
    kidney_transplant_acute_prot_low: "07e9ba60-e459-437e-8796-86322961b647",
    kidney_transplant_acute_prot_high: "69846c38-2d69-400a-a48a-e50c9a89751a",
    kidney_transplant_acute_note1: "06a9fc5e-a620-44e3-af14-4bdc4523a685",

    kidney_transplant_chron_kcal_low: "a828d430-8c0d-4b64-ae4e-e407230b38dc",
    kidney_transplant_chron_kcal_high: "c31a63ef-fa81-4105-8012-b3170ed1fe33",
    kidney_transplant_chron_prot_low: "a990ec87-7d6f-4a8a-ae2f-ee504c48133c",
    kidney_transplant_chron_prot_high: "2e6e8162-7bb1-49e1-906e-9ff417f9966e",

    kidney_transplant_chrondm_kcal_low: "95e4bfa6-744b-47d7-b62c-638b4f3c26b6",
    kidney_transplant_chrondm_kcal_high: "0c7cce2d-5351-48f4-ae81-6f6c8c88b39d",
    kidney_transplant_chrondm_prot_low: "2b44c1bd-2667-4746-b387-b493e7a3ee13",
    kidney_transplant_chrondm_prot_high: "3313d4cc-5033-4aa1-a2c4-5ac396d2e384",

    // ─── MASLD / MASH ───────────────────────────────────────────────────────
    masld_mash_root: "a70fee2e-6da9-4387-9dbf-9ac6283c9145",
    masld_mash_adult: "1503a96c-b26f-4b07-98fc-54099fb507df",
    masld_mash_standard: "25d4e5d1-3876-499d-b3af-c6d84bcaf5bd",
    masld_mash_malnourished: "ad0acca3-5184-4f28-a40b-2a6c45ef4ce4",

    masld_mash_std_kcal_low: "6d471019-e279-4105-8ccd-e3ad9a0569d0",
    masld_mash_std_kcal_high: "3eb80628-2ee0-4adc-bbc5-651276ac2822",
    masld_mash_std_prot_low: "06d670b9-a1fb-472a-b850-ef82940bf806",
    masld_mash_std_prot_high: "3c5242d0-21af-43b0-a908-9903556bcfea",
    masld_mash_std_note1: "d0b34030-ef05-42ed-bc48-63b25fa41d54",
    masld_mash_std_note2: "f073e887-668e-489c-9d24-e4b1855dacb6",

    masld_mash_mal_kcal_low: "323f2ff9-e3d5-4fcd-a95f-774ff48db3c0",
    masld_mash_mal_kcal_high: "b3f5b999-c573-4d60-8833-45138499ed7b",
    masld_mash_mal_prot_low: "32e83cee-f4da-4633-b285-a4b2f53b0c8e",
    masld_mash_mal_prot_high: "2391d4b6-3bd2-46cd-b4bf-8fd2211e6f44",
    masld_mash_mal_note1: "5797251d-fb04-4693-b4dd-fd31db32bf52",
    masld_mash_mal_note2: "2f1af71a-49c1-4dbb-b6ed-b5fbb9259012",

    // ─── Oncology ───────────────────────────────────────────────────────────
    onc_root: "b73fe71d-3f40-4875-a09b-31e8b2b2ebab",
    onc_adult: "58ea1dbd-2dc8-465c-b150-0e0e1a4268e1",
    onc_sed: "73e1d78e-b596-47a7-a027-05035b50548c",
    onc_hyper: "c67e1c6c-a5e1-48bc-8273-b64e22c4ebd7",
    onc_stressed: "a1053cf9-b03b-4260-8c8c-857536308adb",
    onc_highprot: "acd8fefd-b306-4ab6-9bd5-f8a536f690a0",

    onc_sed_kcal_low: "96a789a2-1b05-4421-8315-68d061586389",
    onc_sed_kcal_high: "ab467e42-4971-4262-8a81-67082806ade7",
    onc_sed_prot_low: "275c711f-7131-478e-950a-d0427f97c79a",
    onc_sed_prot_high: "36cf69e3-46bc-40f1-8404-f99a151da4b5",
    onc_sed_note1: "c9330a80-dace-4d56-974e-439c259cd5da",

    onc_hyper_kcal_low: "ae6b3aa2-3b78-4003-981c-5367fb3802ff",
    onc_hyper_kcal_high: "533ca5a3-bb3d-47cd-84b9-06023c2dc8f8",
    onc_hyper_prot_low: "559ce5a7-75e3-43ee-ae4b-53f4fa08d862",
    onc_hyper_prot_high: "fa6921ec-7faf-4dd2-9b1a-4feb9e5d61fa",
    onc_hyper_note1: "d6c0dde1-b87a-4fd1-9ebb-8a4e59f8b1df",

    onc_stressed_kcal_low: "301ca76e-9eb0-48dc-91b2-fa6d560b533e",
    onc_stressed_kcal_high: "17dd2de5-62ec-4464-a114-56174d4de3a9",
    onc_stressed_prot_low: "5b00a2e4-f4f1-4d0f-ac20-52750a17680d",
    onc_stressed_prot_high: "8aa8cabd-6c74-4cdf-b803-b09a754107c4",
    onc_stressed_note1: "448e95d7-b6bf-4c17-a5eb-d6607ad3dfbc",
    onc_stressed_note2: "f42532fd-4000-43d8-8809-97afa8f0f0d1",

    onc_highprot_kcal_low: "dd18dc49-196b-499f-ba7a-dc9e6c4e90b8",
    onc_highprot_kcal_high: "aa0db56a-2fcc-4971-bfc2-eb0ba253c4fc",
    onc_highprot_prot_low: "a8a6225a-cab8-40c5-9885-95937280bf2c",
    onc_highprot_prot_high: "ea6e8764-5f1e-433b-9f94-7f4bb3f499d6",

    // ─── HSCT ───────────────────────────────────────────────────────────────
    hsct_root: "346d743a-acb5-47f0-af38-5578c0524cf0",
    hsct_adult: "06a49714-ff65-4950-abdd-8785f9f033d5",
    hsct_active: "e9d09f74-4f37-4195-a4c2-d0ec420d742f",
    hsct_recovery: "3e4ad0cf-1562-45df-bb12-c580b6d84bce",

    hsct_active_kcal_low: "050eb090-26ea-4efe-b9bc-a126397405e6",
    hsct_active_kcal_high: "18817bf9-87c1-4663-a915-c2dd6ff962c9",
    hsct_active_prot_low: "998e6128-3ba4-40bc-8eb6-44891b419bfd",
    hsct_active_prot_high: "e6a808f1-a09c-4256-bce6-e4abbbc7869e",
    hsct_active_note1: "7e4e7e69-106f-473d-9f26-ba9154b1ae30",
    hsct_active_note2: "7b891b1f-d5a9-4e7f-b5d4-142a1e53b7f1",

    hsct_rec_kcal_low: "6b9aad4d-dd2f-446f-89ea-ce6b967eaefb",
    hsct_rec_kcal_high: "91a397ef-f16c-46f7-8b5f-4890e59d1622",
    hsct_rec_prot_low: "199eeb05-4f65-4c06-856d-469edaedce1a",
    hsct_rec_prot_high: "2a99fd29-40ff-47aa-a65f-1351e62e91ab",

    // ─── Short Bowel Syndrome ───────────────────────────────────────────────
    sbs_root: "c3f9ba15-2cf7-4672-8626-c5579d00440d",
    sbs_adult: "6d48af54-5561-49af-82ef-94d9bf86e877",
    sbs_standard: "8a409298-88b7-4229-8b8c-b45cedd1f331",

    sbs_kcal_low: "69bde7d3-d680-4892-89bf-88d78f0c101c",
    sbs_kcal_high: "ba2c5f22-573e-4f6e-a258-8524c533c10a",
    sbs_prot_low: "a735e894-886f-4ea3-afe9-eda53ab477cd",
    sbs_prot_high: "e0adeb03-fc88-4f42-b5bd-77eb983f4472",
    sbs_note1: "bedece10-aeb0-4f89-8014-7e8008291bda",
    sbs_note2: "f10ec614-6d46-4940-b651-55cde1eacb5b",
    sbs_note3: "6ed705c0-1cac-4b65-b405-1a4331e9635b",
    sbs_note4: "66c48862-6c62-4c7a-a2e9-acc0dc603546",
    sbs_note5: "b51ee193-38d8-4151-a699-9125ccea51f5",

    // ─── Cystic Fibrosis ────────────────────────────────────────────────────
    cf_root: "9e24255f-6cdb-4549-a6e0-6b043b41e2ba",
    cf_adult: "9abce5b8-9674-4c60-b981-54b7c335a87d",
    cf_bedbound: "af819e81-5a0e-4c23-ac1c-bee60b77cb06",
    cf_sedentary: "7867cb88-b255-4143-9c47-36336788114c",
    cf_active: "d4870952-8c5b-44c7-a899-661270e2bbea",

    cf_bb_kcal_low: "d82aefea-9dca-4b8b-8ae5-12ae2d2256bc",
    cf_bb_kcal_high: "6bfdd92a-7bb0-4be7-9514-bdaef078c309",
    cf_bb_prot_low: "1493a6ca-d56a-48e8-b8da-a87e9e8ed785",
    cf_bb_prot_high: "035afe82-3f81-4f61-97da-d395c26425a1",

    cf_sed_kcal_low: "13cdcffe-b2f4-489a-9b0d-d799b9e70bbb",
    cf_sed_kcal_high: "0626e3ef-151d-4a71-9695-9033ef09e115",
    cf_sed_prot_low: "ea8884ad-f911-45b5-a74e-5c8d8da3758d",
    cf_sed_prot_high: "8b21768d-4e3d-43b9-84c9-e483ccb5bd1a",

    cf_act_kcal_low: "13e64a4a-cbaf-4ee6-8820-3389ef05ff78",
    cf_act_kcal_high: "e111be60-1cd5-4271-ae3c-3ee5e740a0b7",
    cf_act_prot_low: "685848cf-f1c8-4aa0-9d93-4b69baa15e97",
    cf_act_prot_high: "dd7f3550-d4cd-482b-b5e5-9c7c60cc9249",
    cf_note1: "7ced931e-f1c1-445e-9d24-df327572285b",
    cf_note2: "43cd7daf-5a85-4811-a5ac-0b2143b4eb6b",

    // ─── Sickle Cell Disease ────────────────────────────────────────────────
    scd_root: "5874273c-98ca-4530-a612-e87bd0a7ca3f",
    scd_adult: "dffbfdd7-a6f6-46c1-9f7f-21b88c2f57e0",
    scd_stable: "1ed8e5c2-e6e2-455d-bacc-7d1a5660f7e3",
    scd_voc: "a00f7e36-b324-486e-b092-423a91703eaa",

    scd_stable_kcal_low: "1e9db64f-8324-4e9c-bc75-35897cf2b7b7",
    scd_stable_kcal_high: "57a6d579-ddb0-439b-8f9f-afe45a12bf76",
    scd_stable_prot_low: "5bc85602-0ac6-41ba-b77c-e555cc57dc0a",
    scd_stable_prot_high: "d96c0d19-e8ad-4268-bc29-3f04701de5e5",
    scd_stable_note1: "8542b637-9d96-4d9a-a061-4020f0a3d5b1",

    scd_voc_kcal_low: "03648a47-03e3-4f6d-915d-ebfd03b65038",
    scd_voc_kcal_high: "26ade534-cf3f-4156-8563-9a96cf3990e8",
    scd_voc_prot_low: "b6d9a360-713a-4434-99c1-7717bdd89ae7",
    scd_voc_prot_high: "cb962985-2c1a-488a-94c9-c8c92d58252d",
    scd_voc_note1: "dd78fc91-48b0-4c43-a302-4cc017df162a",

    // ─── Pressure Injuries ──────────────────────────────────────────────────
    pi_root: "5457889b-2760-4ef8-adb9-db2dbc9ca62f",
    pi_adult: "6b34af9c-7025-4eec-9225-9a28d465e598",
    pi_stage1_2: "51d6a728-8618-40e2-822b-30089e8c579d",
    pi_stage3_4: "66b1563c-1525-4fe2-a65b-a87010cebcf9",

    pi_stage1_2_kcal_low: "433665d1-3b7b-44b1-9577-ce70019cc386",
    pi_stage1_2_kcal_high: "1c7afdb6-79d6-4d73-9972-263cb43114ac",
    pi_stage1_2_prot_low: "ac659d5a-7d09-4253-ba55-a3b97d219329",
    pi_stage1_2_prot_high: "09c4317a-bf68-4b30-80e2-5527c100193f",

    pi_stage3_4_kcal_low: "298d6f05-1e8f-483f-a12d-8d233c769d3f",
    pi_stage3_4_kcal_high: "2f7daa5a-652e-4e48-913b-ea6813c156f9",
    pi_stage3_4_prot_low: "93d49076-0053-492b-bf75-582cf0b504d6",
    pi_stage3_4_prot_high: "47ac3bae-27e1-4b56-b6c7-4718e2a50fa6",
    pi_stage3_4_note1: "20e24a34-ab29-40f3-b4aa-497d187de32b",

    // ─── Severe Malnutrition ────────────────────────────────────────────────
    mal_root: "2d81ae3d-c457-4169-a056-7f27b34d2645",
    mal_adult: "0350fa76-dec0-4cbc-a3c5-ec43b05764a1",
    mal_refeeding: "c2bda023-6358-4d25-9739-865d5623a5fd",

    mal_kcal_low: "252c9422-e159-4e2e-a9ff-670e69d65449",
    mal_kcal_high: "af411b35-ca4e-4545-9af9-daf57e65b975",
    mal_prot_low: "bd3278d5-a73b-4e99-b748-bdfe90aa1b8d",
    mal_prot_high: "eb8e291f-281f-459f-a912-ee69ebda2c4c",
    mal_note1: "05e1d743-7069-406a-bd3e-5b35149523b7",
    mal_note2: "5459469d-dca1-4f49-9f7b-6801130f4733",

    // ─── Obesity / Metabolic Syndrome ───────────────────────────────────────
    obe_root: "a09b0c7b-e25d-469a-9877-cf077e4ce81d",
    obe_adult: "fbbc2782-0337-4d11-b410-c09fbed53234",
    obe_stable: "6c29f425-e35e-49cc-a1a5-3dfc978d0099",

    obe_kcal_low: "be586e65-c215-491e-920c-4aaecd6ae599",
    obe_kcal_high: "1d91ad57-24dd-48aa-9532-a83bddbcaedd",
    obe_prot_low: "d121b0c5-98e7-499a-8eb0-faf3617f497f",
    obe_prot_high: "b4031f5-6bd4-4a67-a879-2fe7b18bd517",
    obe_note1: "e38f2d9e-47ff-403e-ae4f-4a808a4da7f0",
    obe_note2: "fb52cb03-484b-43fb-9844-04b92b328f9a",

    // ─── Pregnancy ──────────────────────────────────────────────────────────
    preg_root: "987e18e1-8952-4cfb-8fd9-7a3522401b0a",
    preg_adult: "abbfc9b6-5730-4ad2-950a-010f3f0ddfc5",
    preg_t1: "25735c60-6af0-4009-8413-d0dfa26bf432",
    preg_t2: "52f91d82-bd76-4ec4-8e0c-a553722edd64",
    preg_t3: "a5bc2b60-d92a-477a-8415-aa9197710217",

    preg_t1_kcal_low: "5a1fbfb1-9935-4143-bb8d-042e8f4278be",
    preg_t1_kcal_high: "28e9265f-3712-4c36-9f92-57409663cd0d",
    preg_t1_prot: "7493bbab-7359-4db2-82f3-041826ced1ee",
    preg_t1_note1: "8b49ac02-22cc-4732-bdc7-b9359358b06b",

    preg_t2_kcal_low: "baebf926-d4b9-4ffb-a936-90652bc08ea9",
    preg_t2_kcal_high: "219687f9-95cc-4c62-a46b-19424e36b403",
    preg_t2_prot: "be554101-4f80-4640-9e88-83b7431e0437",
    preg_t2_note1: "0ec3b0a1-b162-49d5-905c-f7ac1883fc21",

    preg_t3_kcal_low: "78632d49-ecaf-4c29-80fd-ad8d9d3dce03",
    preg_t3_kcal_high: "af80d3fa-695a-4d8e-8211-fac283f0b65c",
    preg_t3_prot: "61be8ea2-72e2-44be-93ad-ab5a61e06af6",
    preg_t3_note1: "7b3fbdd7-870b-4f4e-aaf0-ca7e65e73cc8",

    // ─── Breastfeeding ──────────────────────────────────────────────────────
    bf_root: "c61dd0fb-7306-43a0-91d5-e96556e13199",
    bf_adult: "b6294ebb-a34b-4f9a-b372-f7f01a8000d1",
    bf_early: "53eff777-6d44-4260-b822-274ee1741577",
    bf_late: "96949fcf-2f5d-4816-8d8e-31ce82eefcf0",

    bf_early_kcal_low: "73900f04-e62f-41b8-a469-991880019f30",
    bf_early_kcal_high: "2e0a9cd8-d659-4003-9663-54a0a0629a12",
    bf_early_prot: "fa72ed7f-fc31-43b2-bd5f-2e87c3743a1b",
    bf_early_note1: "b0894a59-86e4-4015-af11-fc85c8e24962",
    bf_early_energy_note: "b3e2c280-df3e-4c3e-b8f0-4e101a24ae98",

    bf_late_kcal_low: "f4a6435a-c6fe-41b0-8b34-40d8a03fec4c",
    bf_late_kcal_high: "addf8617-b2e4-4eec-862d-eb1db04e857a",
    bf_late_prot: "99fe1ae8-8468-4df5-a2e7-8f8146c69e38",
    bf_late_note1: "7f9f2f67-504a-4aa4-aed8-0afa5247cc7a",
    bf_late_energy_note: "927ff6c7-66a5-4b31-9eae-1aba7609df94",

    // ─── Healthy / Preventive ───────────────────────────────────────────────
    hl_root: "5bc044bb-79db-47d2-baf9-755566b0a4de",
    hl_adult: "5eb912d3-5d27-46ce-87e4-90ad15696243",
    hl_standard: "96ea4c26-1037-4686-b7b4-69daca988b2d",

    hl_kcal_low: "64dc591b-da1b-437a-a8fb-7bdf20a7cd1b",
    hl_kcal_high: "800b2933-2566-4bd3-851d-2afd90847662",
    hl_prot_low: "231efb52-272b-4efa-8b2b-c8d919ee10a0",
    hl_prot_high: "ba6849da-6d1e-4870-a8c9-b82109c5ff9e",
    hl_note1: "a1a1e6e8-9c72-4009-92b9-45e92ab8e067",

    // ─── Pediatric Critical Illness ──────────────────────────────────────────
    crit_ill_peds: "726d5ac3-e334-4539-8ad0-8f1bdf63ef6f",
    crit_ill_peds_std: "1aaef0ac-0b89-4a6e-8422-280dfcf57256",
    crit_ill_peds_kcal_low: "baf23319-c034-44ec-97df-f8b6b00b5d84",
    crit_ill_peds_kcal_high: "84f5a423-110c-414a-a9f5-a6c0a5669d5a",
    crit_ill_peds_prot_low: "e1fab089-850e-46b5-a835-d30310e5a1c0",
    crit_ill_peds_prot_high: "6cb5527a-f529-4555-aa39-e58d055e7d58",
    crit_ill_peds_note1: "4fa2ec45-8f58-4ed6-9f30-3f3a07cf0fcd",
    crit_ill_peds_note2: "fab16151-2943-4509-a59a-cfe2b482681b",
    crit_ill_peds_note3: "6cd62141-2485-4da3-8a7b-54fd2dd6d707",

    // ─── Pediatric AKI ──────────────────────────────────────────────────────
    aki_peds: "e29f7671-3f0b-4c99-a17b-968c203a1059",
    aki_peds_nodial: "c1fb9e39-f436-4ec1-bdf5-9b7fba42e09f",
    aki_peds_dial: "874fa806-a184-4dc7-bbde-ecd849909791",
    aki_peds_nodial_kcal_low: "ffd52992-609d-4a48-8797-5fd32190129a",
    aki_peds_nodial_kcal_high: "b6da99ea-7c1d-422b-9d97-83fd2e314ef6",
    aki_peds_nodial_prot_low: "0248807f-a3ac-4929-a05c-8741fcd87e40",
    aki_peds_nodial_prot_high: "953d3626-c674-4bcf-80a8-9c84d9418b64",
    aki_peds_nodial_note1: "2a7b0811-c0da-4c1c-ab16-4bed22d937c7",
    aki_peds_dial_kcal_low: "a30b83e8-0bc3-410e-9b9b-14f2163c87f2",
    aki_peds_dial_kcal_high: "c7525de9-35e7-46db-a7af-70896dfab4b5",
    aki_peds_dial_prot_low: "b033e75e-2e95-4a2b-88ba-10ad7b64a92e",
    aki_peds_dial_prot_high: "67817ee7-0f74-4c1e-894e-f744b9f1aa91",
    aki_peds_dial_note1: "8448fba3-2854-4d8a-8889-d272a53021e2",
    aki_peds_dial_note2: "a1fe2d29-85a1-453f-bc9e-146a72d0fea9",

    // ─── Pediatric Acute Pancreatitis ───────────────────────────────────────
    pancreatitis_peds: "0998af20-31a5-4997-b8fe-29fd3fb860ff",
    pancreatitis_peds_std: "94e66888-626e-4ba0-8058-86baaf970379",
    pancreatitis_peds_kcal_low: "85053fae-0288-4fe4-a882-00373834dad5",
    pancreatitis_peds_kcal_high: "9d408951-d02f-4a23-b73c-da7770f59d68",
    pancreatitis_peds_prot_low: "f38aabe7-040e-4897-9034-92ebb1a7590a",
    pancreatitis_peds_prot_high: "4a639421-51da-4fc3-85b6-61af7a2c022f",
    pancreatitis_peds_note1: "4144ff66-0662-47b0-96d6-561149cb1415",
    pancreatitis_peds_note2: "b3e897de-8766-4153-82a9-2cf23ec00a94",

    // ─── Pediatric Burns ────────────────────────────────────────────────────
    burns_peds: "c43ce3e0-cc59-4d38-b87e-77e9c8bf5cf1",
    burns_peds_child: "3121a94c-cb6e-4059-ab34-c9c09d970648",
    burns_peds_adol: "7ce3e26f-d58c-4829-9871-5685d8abe40e",
    burns_peds_child_kcal_low: "2a035851-d26a-4dd8-bbd8-b9193898f817",
    burns_peds_child_kcal_high: "4b3ab06f-43c2-4b79-aeca-f996a57954cc",
    burns_peds_child_prot_low: "a763d4d4-d4ad-4137-bd55-1b3145b1cf4d",
    burns_peds_child_prot_high: "0d29f5a3-bc1d-4fab-aada-7bfb5cd9b57f",
    burns_peds_child_note1: "f3753381-4302-46b1-ad94-de6413ed908a",
    burns_peds_child_note2: "401b7115-8234-4e70-a4e2-19e32506fa70",
    burns_peds_adol_kcal_low: "224d6d16-1146-4984-b2b7-7fc27c21a5f3",
    burns_peds_adol_kcal_high: "5f99bce1-ddfb-43eb-9d2d-dca621c08c59",
    burns_peds_adol_prot_low: "9a73781d-e628-415d-bbbd-6d6d35a5e458",
    burns_peds_adol_prot_high: "81430256-b167-4756-835d-fa01009b0ab2",
    burns_peds_adol_note1: "3a754426-8e6b-4eec-aa0d-97022da79cbb",
    burns_peds_adol_note2: "8991636e-84db-46f7-8055-67d566ad6c9a",

    // ─── Pediatric Oncology ─────────────────────────────────────────────────
    onc_peds: "ad5b4337-3fba-4819-95d6-9c9ba7367fe6",
    onc_peds_std: "0f21ee1b-b88c-41ba-b18d-8e8730897456",
    onc_peds_undernourished: "e2906a23-365a-4d6f-bede-e5dc49f3e9ff",
    onc_peds_std_kcal_low: "24a0c70a-1dc9-4250-8e8d-430b5ffafc5a",
    onc_peds_std_kcal_high: "42247cee-1da2-43fb-8e3f-3a18ec39b972",
    onc_peds_std_prot_low: "e376a3c5-59d4-4566-a996-6795ea992c7f",
    onc_peds_std_prot_high: "39476f27-ec47-42a9-baad-4ae701b098ed",
    onc_peds_std_note1: "42526d84-4f83-4c93-96f2-6ece0a80e008",
    onc_peds_std_note2: "99ba77fe-b5a4-47ec-9bd9-8b2758432f4a",
    onc_peds_und_kcal_low: "73ee35e3-bc11-4bf0-a8d6-57203c32e8d2",
    onc_peds_und_kcal_high: "71da6252-ff2b-4c73-bcd3-cfedd31fff70",
    onc_peds_und_prot_low: "6761962d-ced1-40c7-a152-19e75a67b5c7",
    onc_peds_und_prot_high: "7c1e0e0d-29c0-4f51-a0af-268ccad161ca",
    onc_peds_und_note1: "867ba2ed-03fe-48cb-b53b-fd4c5dbc460d",
    onc_peds_und_note2: "f1d4e708-503a-4676-873b-d1f05a60f3c5",

    // ─── Pediatric CKD Stages 3-5 ───────────────────────────────────────────
    ckd_peds_3_5: "d4aceb86-2310-4e90-9d1e-116eb5fda6d9",
    ckd_peds_3_5_std: "edab2db9-554e-410d-8f11-01a4c8ac1414",
    ckd_peds_3_5_kcal_low: "910f4644-8673-4460-b6fe-2f215ef41fc1",
    ckd_peds_3_5_kcal_high: "afbb0a20-40b7-4767-bf30-d8088fe88f17",
    ckd_peds_3_5_prot_low: "35631421-2c97-485a-a875-0329e03c234b",
    ckd_peds_3_5_prot_high: "29812ee8-b3bb-4b8a-bda1-edba94111a31",
    ckd_peds_3_5_note1: "5e5ef9aa-2461-422e-97c3-cb4aa6cfc852",
    ckd_peds_3_5_note2: "6276a68f-62bd-4d0c-b426-098b9f7fd91e",
    ckd_peds_3_5_note3: "3070aac7-fb9a-4e07-86fa-b4698f370d70",

    // ─── Pediatric CKD Stage 5D ─────────────────────────────────────────────
    ckd_peds_5d: "c3a78cf1-f0de-4170-93d3-938822600a1a",
    ckd_peds_hd: "c1ee2df2-12d3-4bf7-82dc-366924a42a66",
    ckd_peds_pd: "76dbd945-f501-48c0-be91-df3d878f66ef",
    ckd_peds_hd_kcal_low: "2f6f4b23-aeac-475c-b80b-851c5099e5be",
    ckd_peds_hd_kcal_high: "572da029-15b7-4297-a26c-47220c693081",
    ckd_peds_hd_prot_low: "a5878e20-93b1-4f0a-a3ea-bcb16358dd94",
    ckd_peds_hd_prot_high: "4b34236a-c898-4a54-8806-619e3cbc0b84",
    ckd_peds_hd_note1: "1846ecd7-f65a-4375-a313-ffb92e9cc6cd",
    ckd_peds_hd_note2: "70501dd0-5366-40d5-9293-a9c57c53a4cf",
    ckd_peds_pd_kcal_low: "1b30d80d-cba8-4b90-ad86-2c15abfaa4a5",
    ckd_peds_pd_kcal_high: "8168fa9f-8fc5-465f-870b-51f368a5ec78",
    ckd_peds_pd_prot_low: "697a0899-4648-45cf-9fde-d371e52ad533",
    ckd_peds_pd_prot_high: "f96b48df-9c11-43a6-b4b1-62e8d8240e0b",
    ckd_peds_pd_note1: "ab6ff7fb-96e4-4174-946e-dfbee80eec46",
    ckd_peds_pd_note2: "09f534cf-d208-4d0e-bc58-a7dd6206f301",

    // ─── Pediatric Kidney Transplant ────────────────────────────────────────
    kidney_transplant_peds: "d03304cc-827e-4b3a-b64e-1dfd197549bb",
    kidney_transplant_peds_acute: "950c862b-b059-40aa-8c41-f44e04a47cea",
    kidney_transplant_peds_chron: "66a05667-8379-420b-9d51-6234df4a0269",
    kidney_transplant_peds_acute_kcal_low: "b381af92-eb08-45e0-95e6-65cc404c7744",
    kidney_transplant_peds_acute_kcal_high: "d683869e-10e5-4e29-b68a-441be9d324dc",
    kidney_transplant_peds_acute_prot_low: "48bce0a6-3695-41d5-a45b-15b9261c7527",
    kidney_transplant_peds_acute_prot_high: "909a8533-21c2-4b16-ad65-36f77bed2423",
    kidney_transplant_peds_acute_note1: "e7298919-465e-403a-a902-0d7c18dc827e",
    kidney_transplant_peds_chron_kcal_low: "50e80e0c-5d1e-492a-9d8a-21f031f65670",
    kidney_transplant_peds_chron_kcal_high: "d1a7c02d-a27e-4af7-becc-a475fd45a645",
    kidney_transplant_peds_chron_prot_low: "3805ade1-34be-4351-9b0f-522200c3bcb9",
    kidney_transplant_peds_chron_prot_high: "68ac4949-f03a-45ee-8a97-41937d256f2b",
    kidney_transplant_peds_chron_note1: "5a80f5df-b03e-4aaf-a0f1-4ee571d91191",

    // ─── Pediatric Cirrhosis ────────────────────────────────────────────────
    cirrhosis_peds: "86d269fc-231f-4088-8725-2916f70e1718",
    cirrhosis_peds_std: "6dfbeaa6-11cb-4b04-bf6a-17f934b9a5e2",
    cirrhosis_peds_kcal_low: "26e77c65-cf72-410f-89a6-09b960d2e82a",
    cirrhosis_peds_kcal_high: "f980828e-903b-4a6d-a49e-4c51c9919376",
    cirrhosis_peds_prot_low: "8d1abd8d-bdf9-4a0f-b663-bbf3ac345a00",
    cirrhosis_peds_prot_high: "b9cce6d0-6cb3-4b26-b3e7-daae13a95bc2",
    cirrhosis_peds_note1: "cda1f53c-0fa0-47a4-b185-5c5b85773a4a",
    cirrhosis_peds_note2: "05b0fae3-5741-4d3b-883f-45e3a5a50222",
    cirrhosis_peds_note3: "4116e4da-06d4-40f9-ab77-ca0344c9ff97",

    // ─── Pediatric Liver Transplant ─────────────────────────────────────────
    liver_transplant_peds: "6ce006ae-1019-42b6-93f0-ce62f98c50a1",
    liver_transplant_peds_acute: "2038c018-d24d-4f6f-83a6-abce5c0577c3",
    liver_transplant_peds_chron: "e6a0b7bf-60a8-4923-a2a7-3414bbb5e393",
    liver_transplant_peds_acute_kcal_low: "82ca6df3-2275-47bf-8f87-cf11f5f6ca47",
    liver_transplant_peds_acute_kcal_high: "1724d2c2-7653-4b30-bdae-463fe0c2f965",
    liver_transplant_peds_acute_prot_low: "43c4a944-9358-48ec-815c-a9b6edcc4ad6",
    liver_transplant_peds_acute_prot_high: "b0780c14-a0af-42ee-a4de-30d70ddf25b5",
    liver_transplant_peds_acute_note1: "a4ae36ed-212b-4304-b7af-414f9df89d72",
    liver_transplant_peds_chron_kcal_low: "4dd4d90e-ffba-41d5-90ab-7799684911d9",
    liver_transplant_peds_chron_kcal_high: "1e6d91df-947d-41ec-a3a2-24aa861eec06",
    liver_transplant_peds_chron_prot_low: "2e0e5352-3d0b-4c2b-9c4d-784a22cc01a7",
    liver_transplant_peds_chron_prot_high: "f4afba0e-bd73-4648-a31f-6d88d1524341",
    liver_transplant_peds_chron_note1: "84966a70-6a58-4344-bff6-956050fddbe7",

    // ─── Pediatric Trauma ───────────────────────────────────────────────────
    trauma_peds: "cbc51ef8-e782-40e0-a4ea-edb5da177fef",
    trauma_peds_std: "d93cb3e9-455e-4a48-8c49-cffd692e9a6c",
    trauma_peds_open: "41bca267-5b08-4064-a913-476262c5c22e",
    trauma_peds_std_kcal_low: "6bb3d53e-1455-4274-985f-1d66543aab57",
    trauma_peds_std_kcal_high: "65788740-d012-4b2a-9c89-707afd10564a",
    trauma_peds_std_prot_low: "30b7eafc-96e0-4df0-a7ed-4e98ad5c46f6",
    trauma_peds_std_prot_high: "df6c347b-f698-42a0-9a80-b54be6e0e7ef",
    trauma_peds_std_note1: "c5403f7c-1ff1-496a-84c8-775d61492d93",
    trauma_peds_open_kcal_low: "71cacb12-bcac-4a4d-9f51-9e6beb8d012c",
    trauma_peds_open_kcal_high: "c0f4cfea-904b-4bc1-a589-f0053696223f",
    trauma_peds_open_prot_low: "c5ec31f3-feef-4986-a195-ee6a0d78b1c9",
    trauma_peds_open_prot_high: "69912894-98c8-4b90-9516-2747fe5c8dd3",
    trauma_peds_open_note1: "2b4a915b-f44e-4d2d-b33e-a13d41c7e4c4",

    // ─── Pediatric MASLD / MASH ─────────────────────────────────────────────
    masld_mash_peds: "3303b5ce-6b8d-4642-8872-6732339926a0",
    masld_mash_peds_std: "beb9da51-efa8-4abb-a174-4ab38ea250c6",
    masld_mash_peds_kcal_low: "62618e0b-686c-493e-a6d6-d97bb6ce491c",
    masld_mash_peds_kcal_high: "55621165-ba64-45b0-9f55-a711c825e19b",
    masld_mash_peds_prot_low: "49f01a23-2225-4d70-a877-75e057c29658",
    masld_mash_peds_prot_high: "9eb85490-1678-4467-9d9a-27e18848005e",
    masld_mash_peds_note1: "9132d7cc-d98f-4e79-acb9-f690d2fccee5",
    masld_mash_peds_note2: "64a5bfca-28de-4a4a-b27b-35aa173e9789",

    // ─── Pediatric COPD ─────────────────────────────────────────────────────
    copd_peds: "57d7acc5-20d4-4621-9667-fee4c83852d8",
    copd_peds_std: "0fba0d78-f9ca-43bc-8c0a-983e85aa6c86",
    copd_peds_kcal_low: "9526f201-df58-4c54-aaf3-e79bc4309369",
    copd_peds_kcal_high: "169cf883-67b8-4258-b185-bee464e694b7",
    copd_peds_prot_low: "2e868038-6339-4456-bfb9-58141e7b5ea7",
    copd_peds_prot_high: "a4aab3f5-2cf2-483e-8144-21bf4b9d921b",
    copd_peds_note1: "56eed5a6-1c1f-419a-84a5-2a07e005aff2",
    copd_peds_note2: "c9802973-f823-4cf0-a3b7-f7e4cf4641bf",

    // ─── Pediatric Heart Failure ────────────────────────────────────────────
    heart_failure_peds: "31490243-c9fc-4d30-850b-490dfe76b352",
    heart_failure_peds_std: "526ddb38-f2cb-40c9-a96b-6820cea7e801",
    heart_failure_peds_kcal_low: "bc8fe19c-ad98-4756-ab62-04fb1e7dc501",
    heart_failure_peds_kcal_high: "3a2ff6e1-b68a-4835-b75c-73a9665eeb8d",
    heart_failure_peds_prot_low: "186426e4-a710-4eba-900a-1a96cfc51454",
    heart_failure_peds_prot_high: "8774f102-80ef-4c2f-a533-9959f22a6426",
    heart_failure_peds_note1: "cbdd4f95-dfee-4603-a4fd-de7a3898f57b",
    heart_failure_peds_note2: "9d4bfe66-d30a-484d-9a57-1e760ebb7ae4",

    // ─── Pediatric Stroke ───────────────────────────────────────────────────
    stroke_peds: "a4b71009-0772-4a78-b6d5-87c225913b28",
    stroke_peds_std: "54316d83-9afd-484b-a71d-184ca16faecf",
    stroke_peds_kcal_low: "4d28060f-162a-4f36-b51b-6bbb1bbb451f",
    stroke_peds_kcal_high: "05da586b-bf90-4d7d-878e-72feb82ad706",
    stroke_peds_prot_low: "e7a5aa03-56bc-4d2d-acec-1dd5c915e460",
    stroke_peds_prot_high: "58c00db7-5159-46f1-a85b-2dd54a554dad",
    stroke_peds_note1: "824cb0d0-7854-432f-b37b-5179891ebefb",
    stroke_peds_note2: "bb60e669-1244-4c4e-a808-299234a86413",

    // ─── Pediatric Pressure Injuries ────────────────────────────────────────
    pi_peds: "c2fb8d88-7568-4d25-bb0a-573650a41e07",
    pi_peds_stage1_2: "119cf3de-c34e-498b-8995-a673b142378d",
    pi_peds_stage3_4: "c9ab5420-3a58-49ef-a45c-8609e914956f",
    pi_peds_stage1_2_kcal_low: "cb955f13-7286-4201-b4c6-d9623f32fb35",
    pi_peds_stage1_2_kcal_high: "e3757e6d-daa0-406f-94f8-59e4c7460789",
    pi_peds_stage1_2_prot_low: "c378bc43-5f05-4156-a34b-2d04075e1fb4",
    pi_peds_stage1_2_prot_high: "0c5e2072-0464-4340-858b-aebcefb23bc2",
    pi_peds_stage3_4_kcal_low: "c7306fcd-07bf-48b4-affd-b31f92426440",
    pi_peds_stage3_4_kcal_high: "f39d89e5-8942-4bd3-9e02-74a341654253",
    pi_peds_stage3_4_prot_low: "5561a6eb-a6f5-43f1-ac4d-c29c6c7a15d0",
    pi_peds_stage3_4_prot_high: "2e4e2999-bde8-48ad-a49a-cd9d8b0f9f24",
    pi_peds_stage3_4_note1: "fa1c39dc-90a1-423c-822b-d98785670000",
    pi_peds_stage3_4_note2: "c957e757-c470-4fa6-8c5a-f7b582555cda",

    // ─── Pediatric Sickle Cell Disease ──────────────────────────────────────
    scd_peds: "5e3624da-8ba6-492f-bb3e-c564b6e10078",
    scd_peds_stable: "cbe20c80-ef2d-4067-b118-f84731cbbeae",
    scd_peds_voc: "96af551c-63d5-4b3b-a48c-243d76095914",
    scd_peds_stable_kcal: "425d4225-f13e-4f9d-8664-05fd534081de",
    scd_peds_stable_prot_low: "1d4059bd-fd42-45d4-a26f-db7a8ba0b15a",
    scd_peds_stable_prot_high: "86905836-02ca-4777-9823-ef562ec19e3f",
    scd_peds_stable_note1: "827ea02e-3d01-4a21-8d0d-6afad765b0e7",
    scd_peds_stable_note2: "a01445ee-4743-4433-a2b3-2fd497d40ad0",
    scd_peds_voc_kcal_low: "8870cb63-8ef3-447e-92e6-209ce6986d99",
    scd_peds_voc_kcal_high: "b2367bc2-9496-4d3f-a106-e473b92484c6",
    scd_peds_voc_prot_low: "027ab33f-7232-4a95-b095-0ca89b5b44bb",
    scd_peds_voc_prot_high: "8316dffc-d9b6-41b7-8bf4-3ef56fe693eb",
    scd_peds_voc_note1: "226fa22e-1c1e-442f-bed6-1b62dcbfee6e",

    // ─── Pediatric HSCT ─────────────────────────────────────────────────────
    hsct_peds: "3d45ec45-65ca-44a1-9cde-22ab66419b7c",
    hsct_peds_infant: "1331f96a-abd6-4617-a7a4-556a12cc0e3a",
    hsct_peds_child: "bf9b5db8-7a45-477d-ab1e-d2ef47a040ac",
    hsct_peds_older: "29bcc7e2-6e53-4132-b1a8-e6a36aebd1f3",
    hsct_peds_infant_kcal_low: "8f18e4a4-7ae0-439d-ac80-e8c3dfa7f156",
    hsct_peds_infant_kcal_high: "72b22e46-fbde-4dc3-982c-bbe7a00efb6d",
    hsct_peds_infant_prot_low: "8a42db4c-83ff-4917-8f26-9af41a16d8cc",
    hsct_peds_infant_prot_high: "eee0b0d6-989b-405d-8498-525ed159b5be",
    hsct_peds_infant_note1: "414cf6b3-2e3c-40c3-adab-7d04a5a8a8c9",
    hsct_peds_child_kcal_low: "0ac7af2d-2450-4db6-86a1-27d598acf371",
    hsct_peds_child_kcal_high: "6eeb2e55-c0c1-439f-9416-0e704661b1c4",
    hsct_peds_child_prot_low: "d8131f3e-d4bb-416b-836f-814d32197934",
    hsct_peds_child_prot_high: "7c8e48dc-6226-426d-a296-153c48a1cbc6",
    hsct_peds_child_note1: "546f8903-6df3-407a-90a8-d8f574aee5db",
    hsct_peds_older_kcal_low: "3fe7cf79-a694-45ee-b84f-27123c655658",
    hsct_peds_older_kcal_high: "c493eb83-156a-491f-b6dd-66e4dc3d9006",
    hsct_peds_older_prot_low: "14ef97c7-17fd-45d5-8d24-f8769964d31f",
    hsct_peds_older_prot_high: "b2bf84dd-bbc2-4167-a204-7dc99b572fd5",
    hsct_peds_older_note1: "8fe0722a-79fa-44b9-a9c4-a49a0ba2dfca",

    // ─── Pediatric Short Bowel Syndrome ─────────────────────────────────────
    sbs_peds: "36ee40d0-89f6-4c2e-b4cc-af732c58f31e",
    sbs_peds_pndep: "4472e312-4215-4d37-95bf-b33633f77c2c",
    sbs_peds_entaut: "9097be1e-a214-489b-9280-384a8ade5a44",
    sbs_peds_pndep_kcal_low: "82d93e71-8c42-49a9-9d4d-61caed745070",
    sbs_peds_pndep_kcal_high: "2b4fd224-637e-48c5-8c25-0708f98ca267",
    sbs_peds_pndep_prot_low: "b928bbe9-ae08-41e5-9b8e-c08c33fea921",
    sbs_peds_pndep_prot_high: "a5b1bcca-041a-4adb-a160-77f9126a0af7",
    sbs_peds_pndep_note1: "12b9687b-f909-4197-9d6c-5d3a1711014e",
    sbs_peds_entaut_kcal_low: "a342d3e6-02bd-418f-9ebe-c78c96f58b3e",
    sbs_peds_entaut_kcal_high: "98cf4094-4e1e-4f7f-bed1-199f32df3dc5",
    sbs_peds_entaut_prot_low: "1d2d1d89-6686-4eb7-a500-44d72859286f",
    sbs_peds_entaut_prot_high: "98c83dbe-d186-4179-862a-dfa6f8b954a8",
    sbs_peds_entaut_note1: "865af20f-e508-4197-b501-86acd57ec893",
    sbs_peds_entaut_note2: "af262d97-6ec5-43e6-b292-ea79d683da09",
    sbs_peds_entaut_note3: "2ffd6d18-d825-4ae3-8444-163c397d0f67",
    sbs_peds_entaut_note4: "705ac2dd-8550-48a3-9c1a-3186599d2222",

    // ─── Pediatric Cystic Fibrosis ──────────────────────────────────────────
    cf_peds: "f7ae56e6-d54a-4bea-92c5-a7a95f6b0a8b",
    cf_peds_bedbound: "2d24fadd-2a78-4f0a-a6f9-73eefa369949",
    cf_peds_sedentary: "21fc4ddd-7dea-4bd6-b4c9-cc5d722a2cc8",
    cf_peds_active: "6af04445-4fa7-409e-a0d1-11fd60d281a1",
    cf_peds_bb_kcal_low: "76385e58-18f0-465f-8b20-957c89927460",
    cf_peds_bb_kcal_high: "f13c0a8c-1ab2-4f8a-b86c-52f7551a4b78",
    cf_peds_bb_prot_low: "fb89e947-296f-4259-a809-6b5f2f29078c",
    cf_peds_bb_prot_high: "be55d2e9-f858-4f43-9979-b46d052ef90f",
    cf_peds_sed_kcal_low: "ca0792c6-8951-485e-a37f-a4da7d445da5",
    cf_peds_sed_kcal_high: "0c3fdd59-4f88-4fa6-8583-84ed43d749e7",
    cf_peds_sed_prot_low: "4d8d14fc-1a53-4cd3-95a2-11cf05662998",
    cf_peds_sed_prot_high: "8ba51bd0-0629-48f3-a07b-bf57a477dfc4",
    cf_peds_act_kcal_low: "75fc5a96-61d5-4f1b-a170-09f8a4ba4fad",
    cf_peds_act_kcal_high: "212334a7-d9ec-44f5-b6ee-9211201bb780",
    cf_peds_act_prot_low: "d5403cc6-53b5-488a-bc2d-92c5618949fb",
    cf_peds_act_prot_high: "688f463f-4ada-400f-9424-6ca96a848dca",
    cf_peds_note1: "7cf4aa50-7b06-453b-af79-07e42590b595",
    cf_peds_note2: "782c75ea-61f5-4231-a296-3d73e8705fa3",

    // ─── Pediatric Healthy / Preventive ─────────────────────────────────────
    hl_peds: "e26de056-b39d-4a71-a2ce-8b84d076e6ed",
    hl_peds_normal: "f0915c04-2c47-4256-ad95-f4bc51adf9ed",
    hl_peds_overweight: "95fa1de9-8dea-44ea-9284-1821c788d5cf",
    hl_peds_norm_kcal_low: "896b6dc7-ef35-4edb-88aa-e93c8b3e389a",
    hl_peds_norm_kcal_high: "560683d4-0f95-4e3a-85eb-892ff9f89577",
    hl_peds_norm_prot_low: "6fb4f7e4-d3ae-4758-9e31-069c5cebced7",
    hl_peds_norm_prot_high: "57db5597-94bc-4862-a896-5c04f38fc340",
    hl_peds_norm_note1: "bb5c0da4-8ac1-4676-9954-fdd6f2dc912f",
    hl_peds_overweight_note1: "a3da2207-96f8-4d4c-a678-20abce14c0a3",

    // ─── Pediatric Severe Malnutrition ──────────────────────────────────────
    mal_peds: "54ad18ab-00a1-4303-9aa1-f084699eab32",
    mal_peds_catchup: "7b29e6d2-8509-400f-94e3-79b22e131c04",
    mal_peds_kcal_low: "f84a2a34-7bff-4a9d-8202-172aff6eb984",
    mal_peds_kcal_high: "f2cdd064-8804-4fe3-8a22-cdeccb03c1e0",
    mal_peds_prot_low: "666fd3b1-170f-4ffa-9f46-2f77d5bbc8c2",
    mal_peds_prot_high: "a178fae6-0098-47bd-aa49-beec5151174b",
    mal_peds_note1: "d1be457c-ebf7-4efa-8441-5d73fede1401",

    // ─── Pediatric Obesity ──────────────────────────────────────────────────
    obe_peds: "9bc7f2c5-e2e0-4b0b-a8e9-2ced757e94c9",
    obe_peds_stable: "0e8441ba-9b12-434b-aa7e-5ae27fb59498",
    obe_peds_note1: "6f04866f-20f2-4dc4-8392-d0f848560cd0",
    obe_peds_note2: "b3cc9d57-f7eb-4724-a871-9fb57cfdeeec",

    // ─── BPD ────────────────────────────────────────────────────────────────
    bpd_root: "3b59ffca-d2e2-4a44-abda-74fba81ffc4d",
    bpd_peds: "044bc5c9-519c-41a0-98f3-860a7af1bc64",
    bpd_peds_std: "446f43bd-e272-4489-98af-17673e4c17a5",
    bpd_peds_kcal_low: "b3c58e65-9352-4bd2-b1b5-88abb808faeb",
    bpd_peds_kcal_high: "1ea88091-c54d-4bde-871f-7281bf2dd6d0",
    bpd_peds_prot_low: "d62c8e44-43e4-4efd-89fa-ac90b98ee95d",
    bpd_peds_prot_high: "d1e06a0e-6088-4263-b69d-e477daa701d6",
    bpd_peds_note1: "012769ea-ac9a-46e5-86fa-1f0d1119f33e",
    bpd_peds_note2: "4515b9f9-7f0f-4bcc-9cc5-58091470c19e",
    bpd_peds_note3: "63cbdc68-ed26-4869-b5ec-cb7aba80251d",
    bpd_peds_note4: "1e79e085-553e-4e53-bf20-14035582e150",

    // ─── Adolescent Pregnancy ───────────────────────────────────────────────
    preg_peds: "65155b24-253c-427a-af8f-c40c05a25e1f",
    preg_peds_t1: "1e2b0c8d-4d76-43de-9c5f-b9bc3bc2aca2",
    preg_peds_t2: "d6d2e78a-f421-421b-8560-2dd52d99b2ae",
    preg_peds_t3: "eb6abd08-691f-45ac-9c08-9726678f1834",
    preg_peds_t1_kcal_low: "0fcda228-fad4-48a6-a29d-3fdace4708a6",
    preg_peds_t1_kcal_high: "bafb3af4-2c58-460e-bc91-5e9b3f42033f",
    preg_peds_t1_prot: "f1d4e708-503a-4676-87b3-d1f05a60f3c5",
    preg_peds_t2_kcal_low: "1881deb8-615c-4bf5-8cfa-ab45a3615675",
    preg_peds_t2_kcal_high: "a54eae3a-5aef-464d-a2f7-30c799c4f29d",
    preg_peds_t2_prot: "c2117951-6bbb-4d32-8cf5-2d700d29d311",
    preg_peds_t3_kcal_low: "3b915fe0-77ae-4636-bb5d-318c07700d76",
    preg_peds_t3_kcal_high: "83bc4493-9e14-43e6-85a0-e9074aa14b73",
    preg_peds_t3_prot: "b8fe5586-6218-4aaa-ad69-fd2e1ab46e57",
    preg_peds_note1: "4b4482a1-0c63-4f56-a265-52c2b24b8f3a",

    // ─── Adolescent Breastfeeding ───────────────────────────────────────────
    bf_peds: "1aca0ad1-246e-4ab0-94d2-13263903475c",
    bf_peds_early: "bb2fbf7b-daa6-4fe2-afd4-9f6ad829406c",
    bf_peds_late: "f2a46a23-3bf3-4a3c-85a5-39559b75f472",
    bf_peds_early_kcal_low: "d89cbd90-9e47-4026-a0de-8ac4032af63a",
    bf_peds_early_kcal_high: "b193acdb-000d-48f5-84a1-b2068fdc5a3a",
    bf_peds_early_prot_low: "70d75885-2c72-4baa-8620-ed8a2401792a",
    bf_peds_early_prot_high: "9aae5ae4-94c8-4786-b5fe-f372afa9478c",
    bf_peds_late_kcal_low: "558853e8-6e98-451b-9e16-6ce71b773633",
    bf_peds_late_kcal_high: "42f0e367-6f6f-4c72-b124-219d7fb0b4d6",
    bf_peds_late_prot_low: "028972ca-b677-4cc5-bbb5-b273f6d7b866",
    bf_peds_late_prot_high: "70501486-6440-4bbc-a446-47798bb9cb59",

    // Notes
    bf_peds_early_note1: "41aa9271-7476-4ae7-a862-07eaab4cd84c",
    bf_peds_late_note1: "d4171cc0-e5a2-4ab9-b7ce-afa692f4b2f4",
    pi_peds_stage1_2_note1: "067561b6-62a8-45fb-a27e-cc61096c8a8e",
    pi_peds_stage1_2_note2: "368402dc-6602-4564-95b9-a7911a124251",
    aki_peds_nodial_note2: "b30a63f7-23b1-421b-a053-f0248afbe70f",
    aki_peds_dial_note3: "91db2f8d-4dda-4240-b2cd-74708d3f50ae",
    onc_peds_std_note3: "f7313962-edd8-4e46-955c-aec84711b44d",
    onc_peds_und_note3: "3ec7f65f-e8d4-4d87-a23d-d7faa9d4776d",
    hsct_peds_infant_note2: "6e79cde4-434a-4ece-b01a-50684ca6c3de",
    hsct_peds_child_note2: "c362bbd3-c99b-4b4c-8922-2763e4bd9468",
    hsct_peds_older_note2: "81ff5864-f65e-446f-8c9c-a01a7203107f",
    liver_transplant_peds_acute_note2: "4f54e4d7-7482-45fa-ba64-7f15554209a0",

    // ─── Extra Inputs ───────────────────────────────────────────────────────
    crit_ill_lt30_isMechVent: "3d32ef74-06ac-4e48-8df0-7cc5de0cde00",
    crit_ill_lt30_tempMax:    "3d32ef74-06ac-4e48-8df0-7cc5de0cde01",
    crit_ill_lt30_ve:         "3d32ef74-06ac-4e48-8df0-7cc5de0cde02",
    crit_ill_30_50_isMechVent: "3d32ef74-06ac-4e48-8df0-7cc5de0cde03",
    crit_ill_30_50_tempMax:    "3d32ef74-06ac-4e48-8df0-7cc5de0cde04",
    crit_ill_30_50_ve:         "3d32ef74-06ac-4e48-8df0-7cc5de0cde05",
    crit_ill_gt50_isMechVent: "3d32ef74-06ac-4e48-8df0-7cc5de0cde06",
    crit_ill_gt50_tempMax:    "3d32ef74-06ac-4e48-8df0-7cc5de0cde07",
    crit_ill_gt50_ve:         "3d32ef74-06ac-4e48-8df0-7cc5de0cde08",

    cf_bb_fev1Pct:               "cf819e81-5a0e-4c23-ac1c-bee60b77c001",
    cf_bb_isPancreaticSufficient: "cf819e81-5a0e-4c23-ac1c-bee60b77c002",
    cf_bb_cfa:                   "cf819e81-5a0e-4c23-ac1c-bee60b77c003",
    cf_sed_fev1Pct:               "cf819e81-5a0e-4c23-ac1c-bee60b77c004",
    cf_sed_isPancreaticSufficient: "cf819e81-5a0e-4c23-ac1c-bee60b77c005",
    cf_sed_cfa:                   "cf819e81-5a0e-4c23-ac1c-bee60b77c006",
    cf_act_fev1Pct:               "cf819e81-5a0e-4c23-ac1c-bee60b77c007",
    cf_act_isPancreaticSufficient: "cf819e81-5a0e-4c23-ac1c-bee60b77c008",
    cf_act_cfa:                   "cf819e81-5a0e-4c23-ac1c-bee60b77c009",
    cf_peds_bb_fev1Pct:               "cf819e81-5a0e-4c23-ac1c-bee60b77c010",
    cf_peds_bb_isPancreaticSufficient: "cf819e81-5a0e-4c23-ac1c-bee60b77c011",
    cf_peds_bb_cfa:                   "cf819e81-5a0e-4c23-ac1c-bee60b77c012",
    cf_peds_sed_fev1Pct:               "cf819e81-5a0e-4c23-ac1c-bee60b77c013",
    cf_peds_sed_isPancreaticSufficient: "cf819e81-5a0e-4c23-ac1c-bee60b77c014",
    cf_peds_sed_cfa:                   "cf819e81-5a0e-4c23-ac1c-bee60b77c015",
    cf_peds_act_fev1Pct:               "cf819e81-5a0e-4c23-ac1c-bee60b77c016",
    cf_peds_act_isPancreaticSufficient: "cf819e81-5a0e-4c23-ac1c-bee60b77c017",
    cf_peds_act_cfa:                   "cf819e81-5a0e-4c23-ac1c-bee60b77c018",

    burns_toronto_tbsaPct:       "b80bb86c-41b4-4b91-a2b2-d16e98ab3f05",
    burns_toronto_pbd:           "b80bb86c-41b4-4b91-a2b2-d16e98ab3f06",
    burns_toronto_caloricIntake: "b80bb86c-41b4-4b91-a2b2-d16e98ab3f07",
    burns_toronto_coreTemp:      "b80bb86c-41b4-4b91-a2b2-d16e98ab3f08",
    burns_peds_child_tbsaPct:       "b80bb86c-41b4-4b91-a2b2-d16e98ab3f09",
    burns_peds_child_pbd:           "b80bb86c-41b4-4b91-a2b2-d16e98ab3f10",
    burns_peds_child_caloricIntake: "b80bb86c-41b4-4b91-a2b2-d16e98ab3f11",
    burns_peds_child_coreTemp:      "b80bb86c-41b4-4b91-a2b2-d16e98ab3f12",
    burns_peds_adol_tbsaPct:       "b80bb86c-41b4-4b91-a2b2-d16e98ab3f13",
    burns_peds_adol_pbd:           "b80bb86c-41b4-4b91-a2b2-d16e98ab3f14",
    burns_peds_adol_caloricIntake: "b80bb86c-41b4-4b91-a2b2-d16e98ab3f15",
    burns_peds_adol_coreTemp:      "b80bb86c-41b4-4b91-a2b2-d16e98ab3f16",

    trauma_open_exudateVolumeL: "eb75700e-abee-481a-8972-a68120ab3f01",
    trauma_peds_open_exudateVolumeL: "eb75700e-abee-481a-8972-a68120ab3f02",

    scd_stable_hgb: "1ed8e5c2-e6e2-455d-bacc-7d1a5660f001",
    scd_voc_hgb: "1ed8e5c2-e6e2-455d-bacc-7d1a5660f002",
    scd_peds_stable_hgb: "1ed8e5c2-e6e2-455d-bacc-7d1a5660f003",
    scd_peds_voc_hgb: "1ed8e5c2-e6e2-455d-bacc-7d1a5660f004",

    heart_failure_pal: "18d65d08-bca2-460a-9a3e-1bfa24456f01",

    ckd_hd_urineOutputMlDay: "ab94dc5b-4e2b-45b7-b373-df1ea3139f01",
    ckd_pd_urineOutputMlDay: "ab94dc5b-4e2b-45b7-b373-df1ea3139f02",
    ckd_peds_hd_urineOutputMlDay: "ab94dc5b-4e2b-45b7-b373-df1ea3139f03",
    ckd_peds_pd_urineOutputMlDay: "ab94dc5b-4e2b-45b7-b373-df1ea3139f04",

    pi_stage1_2_targetKcal: "51d6a728-8618-40e2-822b-30089e8c5f01",
    pi_stage3_4_targetKcal: "51d6a728-8618-40e2-822b-30089e8c5f02",
    pi_peds_stage1_2_targetKcal: "51d6a728-8618-40e2-822b-30089e8c5f03",
    pi_peds_stage3_4_targetKcal: "51d6a728-8618-40e2-822b-30089e8c5f04",

    aki_no_dial_urineOutputMlDay: "ef67362f-7406-4399-9a0d-3f4d60606f01",
    aki_hd_urineOutputMlDay: "ef67362f-7406-4399-9a0d-3f4d60606f02",
    aki_crrt_urineOutputMlDay: "ef67362f-7406-4399-9a0d-3f4d60606f03",
    aki_peds_nodial_urineOutputMlDay: "ef67362f-7406-4399-9a0d-3f4d60606f04",
    aki_peds_dial_urineOutputMlDay: "ef67362f-7406-4399-9a0d-3f4d60606f05",

    onc_peds_std_isUndernourished: "0f21ee1b-b88c-41ba-b18d-8e8730897f01",
    onc_peds_und_isUndernourished: "0f21ee1b-b88c-41ba-b18d-8e8730897f02",

    sbs_std_hasPreservedColon:    "8a409298-88b7-4229-8b8c-b45cedd1f001",
    sbs_std_remainingBowelShort:  "8a409298-88b7-4229-8b8c-b45cedd1f002",
    sbs_std_growthSuboptimal:     "8a409298-88b7-4229-8b8c-b45cedd1f003",
    sbs_peds_pndep_hasPreservedColon:    "8a409298-88b7-4229-8b8c-b45cedd1f004",
    sbs_peds_pndep_remainingBowelShort:  "8a409298-88b7-4229-8b8c-b45cedd1f005",
    sbs_peds_pndep_growthSuboptimal:     "8a409298-88b7-4229-8b8c-b45cedd1f006",
    sbs_peds_entaut_hasPreservedColon:    "8a409298-88b7-4229-8b8c-b45cedd1f007",
    sbs_peds_entaut_remainingBowelShort:  "8a409298-88b7-4229-8b8c-b45cedd1f008",
    sbs_peds_entaut_growthSuboptimal:     "8a409298-88b7-4229-8b8c-b45cedd1f009",
  } as const;
  const nowStr = new Date().toISOString();

  async function seedCondition(
    id: string,
    name: string,
    parentId: string | null,
    sortOrder: number,
    description?: string
  ): Promise<void> {
    await db.execute(
      `INSERT OR IGNORE INTO custom_conditions
         (id, name, description, parent_id, sort_order, is_seeded, is_archived, archived_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 1, 0, NULL, ?, ?)`,
      [id, name, description || null, parentId, sortOrder, nowStr, nowStr]
    );
  }

  async function seedEquation(
    id: string,
    conditionId: string,
    nutrient: string,
    expression: string,
    unit: string,
    displayLabel: string,
    sortOrder: number
  ): Promise<void> {
    await db.execute(
      `INSERT OR IGNORE INTO custom_equations
         (id, condition_id, nutrient, expression, unit, display_label, sort_order, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, conditionId, nutrient, expression, unit, displayLabel, sortOrder, nowStr]
    );
  }

  async function seedNote(
    id: string,
    equationId: string | null,
    conditionId: string | null,
    noteText: string,
    sortOrder: number
  ): Promise<void> {
    await db.execute(
      `INSERT OR IGNORE INTO custom_equation_notes
         (id, equation_id, condition_id, note_text, sort_order)
       VALUES (?, ?, ?, ?, ?)`,
      [id, equationId, conditionId, noteText, sortOrder]
    );
  }

  async function seedExtraInput(
    id: string,
    conditionId: string,
    slug: string,
    displayLabel: string,
    inputType: "number" | "boolean",
    hintText: string | null,
    sortOrder: number
  ): Promise<void> {
    await db.execute(
      `INSERT OR IGNORE INTO condition_extra_inputs
         (id, condition_id, slug, display_label, input_type, hint_text, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, conditionId, slug, displayLabel, inputType, hintText, sortOrder]
    );
  }

  // ─── 1. Condition tree (Roots first, then Children, then Leaves) ────────
  // ─── COPD ───────────────────────────────────────────────────────────────
  await seedCondition(SEED_IDS.copd_root, "COPD", null, 70, "Chronic Obstructive Pulmonary Disease");

  // ─── Heart Failure ──────────────────────────────────────────────────────
  await seedCondition(SEED_IDS.heart_failure_root, "Heart Failure", null, 80, "Congestive Heart Failure standards");

  // ─── Cirrhosis ──────────────────────────────────────────────────────────
  await seedCondition(SEED_IDS.cirrhosis_root, "Cirrhosis", null, 90, "End-stage liver disease and cirrhosis standards");

  // ─── Liver Transplant ───────────────────────────────────────────────────
  await seedCondition(SEED_IDS.liver_transplant_root, "Liver Transplant", null, 100, "Liver Transplant patient standards");

  // ─── CKD Stages 3-5 & 5D ────────────────────────────────────────────────
  await seedCondition(SEED_IDS.ckd_root, "CKD", null, 110, "Chronic Kidney Disease standards");

  // ─── Kidney Transplant ──────────────────────────────────────────────────
  await seedCondition(SEED_IDS.kidney_transplant_root, "Kidney Transplant", null, 120, "Kidney Transplant patient standards");

  // ─── MASLD / MASH ───────────────────────────────────────────────────────
  await seedCondition(SEED_IDS.masld_mash_root, "MASLD / MASH", null, 130, "Metabolic dysfunction-associated steatotic liver disease");



  // ─── Critical Illness ───────────────────────────────────────────────────
  await seedCondition(SEED_IDS.crit_ill_root, "Critical Illness", null, 10, "Critical care patient standards");

  // ─── AKI ───────────────────────────────────────────────────────────────
  await seedCondition(SEED_IDS.aki_root, "AKI", null, 20, "Acute Kidney Injury");

  // ─── Acute Pancreatitis ─────────────────────────────────────────────────
  await seedCondition(SEED_IDS.pancreatitis_root, "Acute Pancreatitis", null, 30, "Acute Pancreatitis standards");

  // ─── Trauma ─────────────────────────────────────────────────────────────
  await seedCondition(SEED_IDS.trauma_root, "Trauma", null, 40, "Polytrauma and surgical standards");

  // ─── Burns ──────────────────────────────────────────────────────────────
  await seedCondition(SEED_IDS.burns_root, "Burns", null, 50, "Thermal and chemical burn injury standards");

  // ─── Stroke ─────────────────────────────────────────────────────────────
  await seedCondition(SEED_IDS.stroke_root, "Stroke", null, 60, "Stroke care standards");

  // ─── Oncology ───────────────────────────────────────────────────────────
  await seedCondition(SEED_IDS.onc_root, "Oncology", null, 140, "Oncology patient standards");

  // ─── HSCT ───────────────────────────────────────────────────────────────
  await seedCondition(SEED_IDS.hsct_root, "HSCT", null, 150, "Hematopoietic Stem Cell Transplant standards");

  // ─── Short Bowel Syndrome ───────────────────────────────────────────────
  await seedCondition(SEED_IDS.sbs_root, "Short Bowel Syndrome", null, 160, "Short Bowel Syndrome standards");

  // ─── Cystic Fibrosis ────────────────────────────────────────────────────
  await seedCondition(SEED_IDS.cf_root, "Cystic Fibrosis", null, 170, "Cystic Fibrosis standards");

  // ─── Sickle Cell Disease ────────────────────────────────────────────────
  await seedCondition(SEED_IDS.scd_root, "Sickle Cell Disease", null, 180, "Sickle Cell Disease standards");

  // ─── Pressure Injuries ──────────────────────────────────────────────────
  await seedCondition(SEED_IDS.pi_root, "Pressure Injuries", null, 190, "Wound care and pressure injury standards");

  // ─── Severe Malnutrition ────────────────────────────────────────────────
  await seedCondition(SEED_IDS.mal_root, "Severe Malnutrition", null, 200, "Severe malnutrition standards");

  // ─── Obesity / Metabolic Syndrome ───────────────────────────────────────
  await seedCondition(SEED_IDS.obe_root, "Obesity / Metabolic Syndrome", null, 210, "Obesity and weight management standards");

  // ─── Pregnancy ──────────────────────────────────────────────────────────
  await seedCondition(SEED_IDS.preg_root, "Pregnancy", null, 220, "Maternal pregnancy standards");

  // ─── Breastfeeding ──────────────────────────────────────────────────────
  await seedCondition(SEED_IDS.bf_root, "Breastfeeding", null, 230, "Maternal lactation standards");

  // ─── Healthy / Preventive ───────────────────────────────────────────────
  await seedCondition(SEED_IDS.hl_root, "Healthy / Preventive", null, 240, "General preventative nutrition standards");

  // ─── BPD ────────────────────────────────────────────────────────────────
  await seedCondition(SEED_IDS.bpd_root, "Bronchopulmonary Dysplasia (BPD)", null, 250, "Bronchopulmonary Dysplasia");
  await seedCondition(SEED_IDS.copd_adult, "Adult", SEED_IDS.copd_root, 10, "Adult COPD guidelines");
  await seedCondition(SEED_IDS.heart_failure_adult, "Adult", SEED_IDS.heart_failure_root, 10, "Adult Heart Failure guidelines");
  await seedCondition(SEED_IDS.cirrhosis_adult, "Adult", SEED_IDS.cirrhosis_root, 10, "Adult cirrhosis guidelines");
  await seedCondition(SEED_IDS.liver_transplant_adult, "Adult", SEED_IDS.liver_transplant_root, 10, "Adult liver transplant guidelines");
  
  // Stages 3-5
  await seedCondition(SEED_IDS.ckd_adult_3_5, "Adult, Stages 3–5", SEED_IDS.ckd_root, 10, "Non-dialysis CKD");

  // Stage 5D
  await seedCondition(SEED_IDS.ckd_adult_5d, "Adult, Stage 5D (Dialysis)", SEED_IDS.ckd_root, 20, "Dialysis-dependent CKD");
  await seedCondition(SEED_IDS.kidney_transplant_adult, "Adult", SEED_IDS.kidney_transplant_root, 10, "Adult kidney transplant guidelines");
  await seedCondition(SEED_IDS.masld_mash_adult, "Adult", SEED_IDS.masld_mash_root, 10, "Adult MASLD/MASH guidelines");
  await seedCondition(SEED_IDS.crit_ill_adult, "Adult", SEED_IDS.crit_ill_root, 10, "Adult critical illness guidelines");
  await seedCondition(SEED_IDS.aki_adult, "Adult", SEED_IDS.aki_root, 10, "Adult AKI guidelines");
  await seedCondition(SEED_IDS.pancreatitis_adult, "Adult", SEED_IDS.pancreatitis_root, 10, "Adult pancreatitis guidelines");
  await seedCondition(SEED_IDS.trauma_adult, "Adult", SEED_IDS.trauma_root, 10, "Adult trauma guidelines");
  await seedCondition(SEED_IDS.burns_adult, "Adult", SEED_IDS.burns_root, 10, "Adult burn guidelines");
  await seedCondition(SEED_IDS.stroke_adult, "Adult", SEED_IDS.stroke_root, 10, "Adult stroke guidelines");
  await seedCondition(SEED_IDS.onc_adult, "Adult", SEED_IDS.onc_root, 10, "Adult oncology guidelines");
  await seedCondition(SEED_IDS.hsct_adult, "Adult", SEED_IDS.hsct_root, 10, "Adult HSCT guidelines");
  await seedCondition(SEED_IDS.sbs_adult, "Adult", SEED_IDS.sbs_root, 10, "Adult SBS guidelines");
  await seedCondition(SEED_IDS.cf_adult, "Adult", SEED_IDS.cf_root, 10, "Adult Cystic Fibrosis guidelines");
  await seedCondition(SEED_IDS.scd_adult, "Adult", SEED_IDS.scd_root, 10, "Adult SCD guidelines");
  await seedCondition(SEED_IDS.pi_adult, "Adult", SEED_IDS.pi_root, 10, "Adult pressure injury guidelines");
  await seedCondition(SEED_IDS.mal_adult, "Adult", SEED_IDS.mal_root, 10, "Adult severe malnutrition guidelines");
  await seedCondition(SEED_IDS.obe_adult, "Adult", SEED_IDS.obe_root, 10, "Adult obesity guidelines");
  await seedCondition(SEED_IDS.preg_adult, "Adult", SEED_IDS.preg_root, 10, "Maternal pregnancy guidelines");
  await seedCondition(SEED_IDS.bf_adult, "Adult", SEED_IDS.bf_root, 10, "Maternal lactation guidelines");
  await seedCondition(SEED_IDS.hl_adult, "Adult", SEED_IDS.hl_root, 10, "Adult preventative guidelines");

  // ─── Pediatric Critical Illness ──────────────────────────────────────────
  await seedCondition(SEED_IDS.crit_ill_peds, "Pediatric", SEED_IDS.crit_ill_root, 20, "Pediatric critical illness guidelines");

  // ─── Pediatric AKI ──────────────────────────────────────────────────────
  await seedCondition(SEED_IDS.aki_peds, "Pediatric", SEED_IDS.aki_root, 20, "Pediatric AKI guidelines");

  // ─── Pediatric Acute Pancreatitis ───────────────────────────────────────
  await seedCondition(SEED_IDS.pancreatitis_peds, "Pediatric", SEED_IDS.pancreatitis_root, 20, "Pediatric pancreatitis guidelines");

  // ─── Pediatric Burns ────────────────────────────────────────────────────
  await seedCondition(SEED_IDS.burns_peds, "Pediatric", SEED_IDS.burns_root, 20, "Pediatric burn care standards");

  // ─── Pediatric Oncology ─────────────────────────────────────────────────
  await seedCondition(SEED_IDS.onc_peds, "Pediatric", SEED_IDS.onc_root, 20, "Pediatric oncology guidelines");

  // ─── Pediatric CKD Stages 3-5 ───────────────────────────────────────────
  await seedCondition(SEED_IDS.ckd_peds_3_5, "Pediatric, Stages 3–5", SEED_IDS.ckd_root, 20, "Pediatric CKD stages 3-5 guidelines");

  // ─── Pediatric CKD Stage 5D ─────────────────────────────────────────────
  await seedCondition(SEED_IDS.ckd_peds_5d, "Pediatric, Stage 5D", SEED_IDS.ckd_root, 30, "Pediatric dialysis guidelines");

  // ─── Pediatric Kidney Transplant ────────────────────────────────────────
  await seedCondition(SEED_IDS.kidney_transplant_peds, "Pediatric", SEED_IDS.kidney_transplant_root, 20, "Pediatric kidney transplant guidelines");

  // ─── Pediatric Cirrhosis ────────────────────────────────────────────────
  await seedCondition(SEED_IDS.cirrhosis_peds, "Pediatric", SEED_IDS.cirrhosis_root, 20, "Pediatric cirrhosis guidelines");

  // ─── Pediatric Liver Transplant ─────────────────────────────────────────
  await seedCondition(SEED_IDS.liver_transplant_peds, "Pediatric", SEED_IDS.liver_transplant_root, 20, "Pediatric liver transplant guidelines");

  // ─── Pediatric Trauma ───────────────────────────────────────────────────
  await seedCondition(SEED_IDS.trauma_peds, "Pediatric", SEED_IDS.trauma_root, 20, "Pediatric trauma standards");

  // ─── Pediatric MASLD / MASH ─────────────────────────────────────────────
  await seedCondition(SEED_IDS.masld_mash_peds, "Pediatric", SEED_IDS.masld_mash_root, 20, "Pediatric MASLD guidelines");

  // ─── Pediatric COPD ─────────────────────────────────────────────────────
  await seedCondition(SEED_IDS.copd_peds, "Pediatric", SEED_IDS.copd_root, 20, "Pediatric COPD guidelines");

  // ─── Pediatric Heart Failure ────────────────────────────────────────────
  await seedCondition(SEED_IDS.heart_failure_peds, "Pediatric", SEED_IDS.heart_failure_root, 20, "Pediatric heart failure standards");

  // ─── Pediatric Stroke ───────────────────────────────────────────────────
  await seedCondition(SEED_IDS.stroke_peds, "Pediatric", SEED_IDS.stroke_root, 20, "Pediatric stroke guidelines");

  // ─── Pediatric Pressure Injuries ────────────────────────────────────────
  await seedCondition(SEED_IDS.pi_peds, "Pediatric", SEED_IDS.pi_root, 20, "Pediatric wound care guidelines");

  // ─── Pediatric Sickle Cell Disease ──────────────────────────────────────
  await seedCondition(SEED_IDS.scd_peds, "Pediatric", SEED_IDS.scd_root, 20, "Pediatric SCD guidelines");

  // ─── Pediatric HSCT ─────────────────────────────────────────────────────
  await seedCondition(SEED_IDS.hsct_peds, "Pediatric", SEED_IDS.hsct_root, 20, "Pediatric HSCT guidelines");

  // ─── Pediatric Short Bowel Syndrome ─────────────────────────────────────
  await seedCondition(SEED_IDS.sbs_peds, "Pediatric", SEED_IDS.sbs_root, 20, "Pediatric SBS guidelines");

  // ─── Pediatric Cystic Fibrosis ──────────────────────────────────────────
  await seedCondition(SEED_IDS.cf_peds, "Pediatric", SEED_IDS.cf_root, 20, "Pediatric Cystic Fibrosis guidelines");

  // ─── Pediatric Healthy / Preventive ─────────────────────────────────────
  await seedCondition(SEED_IDS.hl_peds, "Pediatric", SEED_IDS.hl_root, 20, "Pediatric healthy guidelines");

  // ─── Pediatric Severe Malnutrition ──────────────────────────────────────
  await seedCondition(SEED_IDS.mal_peds, "Pediatric", SEED_IDS.mal_root, 20, "Pediatric malnutrition guidelines");

  // ─── Pediatric Obesity ──────────────────────────────────────────────────
  await seedCondition(SEED_IDS.obe_peds, "Pediatric", SEED_IDS.obe_root, 20, "Pediatric obesity guidelines");
  await seedCondition(SEED_IDS.bpd_peds, "Pediatric", SEED_IDS.bpd_root, 10, "Pediatric BPD guidelines");

  // ─── Adolescent Pregnancy ───────────────────────────────────────────────
  await seedCondition(SEED_IDS.preg_peds, "Adolescent (14–17y)", SEED_IDS.preg_root, 20, "Adolescent pregnancy guidelines");

  // ─── Adolescent Breastfeeding ───────────────────────────────────────────
  await seedCondition(SEED_IDS.bf_peds, "Adolescent (14–17y)", SEED_IDS.bf_root, 20, "Adolescent breastfeeding guidelines");
  await seedCondition(SEED_IDS.copd_standard, "Standard", SEED_IDS.copd_adult, 10, "Standard COPD parameters");
  await seedCondition(SEED_IDS.heart_failure_standard, "Standard", SEED_IDS.heart_failure_adult, 10, "Standard Heart Failure parameters");
  await seedCondition(SEED_IDS.cirrhosis_compensated, "Compensated", SEED_IDS.cirrhosis_adult, 10, "Compensated cirrhosis");
  await seedCondition(SEED_IDS.cirrhosis_decompensated, "Decompensated / Critical", SEED_IDS.cirrhosis_adult, 20, "Decompensated liver failure");
  await seedCondition(SEED_IDS.liver_transplant_acute, "Acute (Post-op)", SEED_IDS.liver_transplant_adult, 10, "Acute post-transplant recovery");
  await seedCondition(SEED_IDS.liver_transplant_chronic, "Chronic (Stable)", SEED_IDS.liver_transplant_adult, 20, "Chronic post-transplant maintenance");
  await seedCondition(SEED_IDS.ckd_vlpd, "VLPD + Keto Analogs", SEED_IDS.ckd_adult_3_5, 10, "Very Low Protein Diet variant");
  await seedCondition(SEED_IDS.ckd_lpd, "Low-Protein Diet", SEED_IDS.ckd_adult_3_5, 20, "Standard LPD variant");
  await seedCondition(SEED_IDS.ckd_lpd_dm, "Low-Protein + Diabetes", SEED_IDS.ckd_adult_3_5, 30, "LPD with concurrent diabetes");
  await seedCondition(SEED_IDS.ckd_hd, "Hemodialysis", SEED_IDS.ckd_adult_5d, 10, "Hemodialysis dependent");
  await seedCondition(SEED_IDS.ckd_pd, "Peritoneal Dialysis", SEED_IDS.ckd_adult_5d, 20, "Peritoneal dialysis dependent");
  await seedCondition(SEED_IDS.kidney_transplant_acute, "Acute (Post-op)", SEED_IDS.kidney_transplant_adult, 10, "Acute post-transplant recovery");
  await seedCondition(SEED_IDS.kidney_transplant_chronic, "Chronic (Stable)", SEED_IDS.kidney_transplant_adult, 20, "Chronic post-transplant maintenance");
  await seedCondition(SEED_IDS.kidney_transplant_chronic_dm, "Chronic + Diabetes", SEED_IDS.kidney_transplant_adult, 30, "Chronic maintenance with concurrent diabetes");
  await seedCondition(SEED_IDS.masld_mash_standard, "Standard (BMI 18.5–39.9)", SEED_IDS.masld_mash_adult, 10, "Standard overweight/obese variant");
  await seedCondition(SEED_IDS.masld_mash_malnourished, "Underweight / Malnourished / Sarcopenic", SEED_IDS.masld_mash_adult, 20, "Lean or sarcopenic liver disease");
  await seedCondition(SEED_IDS.crit_ill_bmi_lt30, "BMI < 30", SEED_IDS.crit_ill_adult, 10, "Non-obese critical illness");
  await seedCondition(SEED_IDS.crit_ill_bmi_30_50, "BMI 30–50 (Obese)", SEED_IDS.crit_ill_adult, 20, "Obese class I/II critical illness");
  await seedCondition(SEED_IDS.crit_ill_bmi_gt50, "BMI > 50 (Severely Obese)", SEED_IDS.crit_ill_adult, 30, "Class III or higher extreme obesity");
  await seedCondition(SEED_IDS.aki_no_dialysis, "No Dialysis", SEED_IDS.aki_adult, 10, "Non-dialysis acute kidney injury");
  await seedCondition(SEED_IDS.aki_hemodialysis, "Hemodialysis / Catabolic", SEED_IDS.aki_adult, 20, "Intermittent hemodialysis");
  await seedCondition(SEED_IDS.aki_crrt, "CRRT", SEED_IDS.aki_adult, 30, "Continuous Renal Replacement Therapy");
  await seedCondition(SEED_IDS.pancreatitis_mild_mod, "Mild–Moderate", SEED_IDS.pancreatitis_adult, 10, "Mild to moderate pancreatitis");
  await seedCondition(SEED_IDS.pancreatitis_severe_crit, "Severe / Critical", SEED_IDS.pancreatitis_adult, 20, "Severe necrotizing or critical pancreatitis");
  await seedCondition(SEED_IDS.trauma_standard, "Standard / Major Trauma", SEED_IDS.trauma_adult, 10, "Closed abdomen trauma");
  await seedCondition(SEED_IDS.trauma_open_abdomen, "Open Abdomen / NPWT", SEED_IDS.trauma_adult, 20, "NPWT open abdomen trauma");
  await seedCondition(SEED_IDS.burns_toronto, "Toronto Formula (Preferred)", SEED_IDS.burns_adult, 20, "Toronto equation variant");
  await seedCondition(SEED_IDS.stroke_ischemic, "Ischemic / Standard", SEED_IDS.stroke_adult, 10, "Ischemic stroke variant");
  await seedCondition(SEED_IDS.stroke_hemorrhagic, "Hemorrhagic", SEED_IDS.stroke_adult, 20, "Hemorrhagic stroke variant");
  await seedCondition(SEED_IDS.onc_sed, "Non-ambulatory / Sedentary", SEED_IDS.onc_adult, 10, "Oncology: non-ambulatory or sedentary");
  await seedCondition(SEED_IDS.onc_hyper, "Hypermetabolic / Treatment", SEED_IDS.onc_adult, 20, "Oncology: hypermetabolic or undergoing active treatment");
  await seedCondition(SEED_IDS.onc_stressed, "Severely Stressed / HCT First Month", SEED_IDS.onc_adult, 30, "Oncology: severely stressed or HCT first month");
  await seedCondition(SEED_IDS.onc_highprot, "High Protein Needs", SEED_IDS.onc_adult, 40, "Oncology: high protein requirements");
  await seedCondition(SEED_IDS.hsct_active, "Active Treatment (First Month)", SEED_IDS.hsct_adult, 10, "Active HSCT treatment phase");
  await seedCondition(SEED_IDS.hsct_recovery, "Post-engraftment / Recovery", SEED_IDS.hsct_adult, 20, "Post-engraftment recovery phase");
  await seedCondition(SEED_IDS.sbs_standard, "Intestinal Failure / Standard", SEED_IDS.sbs_adult, 10, "Standard intestinal failure parameters");
  await seedCondition(SEED_IDS.cf_bedbound, "Bed-bound (PAL 1.3)", SEED_IDS.cf_adult, 10, "CF bed-bound parameters");
  await seedCondition(SEED_IDS.cf_sedentary, "Sedentary (PAL 1.5)", SEED_IDS.cf_adult, 20, "CF sedentary parameters");
  await seedCondition(SEED_IDS.cf_active, "Active (PAL 1.7)", SEED_IDS.cf_adult, 30, "CF active parameters");
  await seedCondition(SEED_IDS.scd_stable, "Stable", SEED_IDS.scd_adult, 10, "Stable SCD parameters");
  await seedCondition(SEED_IDS.scd_voc, "Vaso-occlusive Crisis (VOC)", SEED_IDS.scd_adult, 20, "SCD in vaso-occlusive crisis");
  await seedCondition(SEED_IDS.pi_stage1_2, "Stage 1–2", SEED_IDS.pi_adult, 10, "Stage 1 or 2 pressure injuries");
  await seedCondition(SEED_IDS.pi_stage3_4, "Stage 3–4", SEED_IDS.pi_adult, 20, "Stage 3 or 4 pressure injuries");
  await seedCondition(SEED_IDS.mal_refeeding, "Refeeding Risk", SEED_IDS.mal_adult, 10, "Patients at high risk for refeeding syndrome");
  await seedCondition(SEED_IDS.obe_stable, "Stable", SEED_IDS.obe_adult, 10, "Weight maintenance/loss parameters");
  await seedCondition(SEED_IDS.preg_t1, "Trimester 1", SEED_IDS.preg_adult, 10, "First trimester");
  await seedCondition(SEED_IDS.preg_t2, "Trimester 2 (+340 kcal)", SEED_IDS.preg_adult, 20, "Second trimester energy/protein scale");
  await seedCondition(SEED_IDS.preg_t3, "Trimester 3 (+452 kcal)", SEED_IDS.preg_adult, 30, "Third trimester energy/protein scale");
  await seedCondition(SEED_IDS.bf_early, "0–6 Months Postpartum", SEED_IDS.bf_adult, 10, "Early postpartum lactation");
  await seedCondition(SEED_IDS.bf_late, "7–12 Months Postpartum", SEED_IDS.bf_adult, 20, "Late postpartum lactation");
  await seedCondition(SEED_IDS.hl_standard, "Standard", SEED_IDS.hl_adult, 10, "Standard general healthy reference");
  await seedCondition(SEED_IDS.crit_ill_peds_std, "Standard", SEED_IDS.crit_ill_peds, 10, "Standard pediatric critical illness parameters");
  await seedCondition(SEED_IDS.aki_peds_nodial, "No Dialysis", SEED_IDS.aki_peds, 10, "Pediatric AKI without dialytic support");
  await seedCondition(SEED_IDS.aki_peds_dial, "Dialysis / CRRT", SEED_IDS.aki_peds, 20, "Pediatric AKI with CRRT or dialysis");
  await seedCondition(SEED_IDS.pancreatitis_peds_std, "Standard", SEED_IDS.pancreatitis_peds, 10, "Standard pediatric pancreatitis parameters");
  await seedCondition(SEED_IDS.burns_peds_child, "Child 1–11y (Galveston)", SEED_IDS.burns_peds, 10, "Galveston formula for children 1-11y");
  await seedCondition(SEED_IDS.burns_peds_adol, "Adolescent 12–16y (Galveston)", SEED_IDS.burns_peds, 20, "Galveston formula for adolescents 12-16y");
  await seedCondition(SEED_IDS.onc_peds_std, "Standard", SEED_IDS.onc_peds, 10, "Standard pediatric oncology parameters");
  await seedCondition(SEED_IDS.onc_peds_undernourished, "Undernourished / Catch-up Growth", SEED_IDS.onc_peds, 20, "Pediatric oncology catch-up growth");
  await seedCondition(SEED_IDS.ckd_peds_3_5_std, "Standard", SEED_IDS.ckd_peds_3_5, 10, "Standard pediatric CKD 3-5 parameters");
  await seedCondition(SEED_IDS.ckd_peds_hd, "Hemodialysis", SEED_IDS.ckd_peds_5d, 10, "Pediatric hemodialysis parameters");
  await seedCondition(SEED_IDS.ckd_peds_pd, "Peritoneal Dialysis", SEED_IDS.ckd_peds_5d, 20, "Pediatric peritoneal dialysis parameters");
  await seedCondition(SEED_IDS.kidney_transplant_peds_acute, "Acute (Post-op)", SEED_IDS.kidney_transplant_peds, 10, "Acute post-op kidney transplant");
  await seedCondition(SEED_IDS.kidney_transplant_peds_chron, "Chronic (Stable)", SEED_IDS.kidney_transplant_peds, 20, "Chronic stable post-transplant");
  await seedCondition(SEED_IDS.cirrhosis_peds_std, "Standard", SEED_IDS.cirrhosis_peds, 10, "Standard pediatric cirrhosis parameters");
  await seedCondition(SEED_IDS.liver_transplant_peds_acute, "Acute (Post-op)", SEED_IDS.liver_transplant_peds, 10, "Acute post-op liver transplant");
  await seedCondition(SEED_IDS.liver_transplant_peds_chron, "Chronic (Stable)", SEED_IDS.liver_transplant_peds, 20, "Chronic stable post-liver-transplant");
  await seedCondition(SEED_IDS.trauma_peds_std, "Standard", SEED_IDS.trauma_peds, 10, "Standard pediatric trauma parameters");
  await seedCondition(SEED_IDS.trauma_peds_open, "Open Abdomen / NPWT", SEED_IDS.trauma_peds, 20, "Pediatric open abdomen trauma");
  await seedCondition(SEED_IDS.masld_mash_peds_std, "Standard", SEED_IDS.masld_mash_peds, 10, "Standard pediatric MASLD parameters");
  await seedCondition(SEED_IDS.copd_peds_std, "Standard", SEED_IDS.copd_peds, 10, "Standard pediatric COPD parameters");
  await seedCondition(SEED_IDS.heart_failure_peds_std, "Standard", SEED_IDS.heart_failure_peds, 10, "Standard pediatric heart failure parameters");
  await seedCondition(SEED_IDS.stroke_peds_std, "Standard", SEED_IDS.stroke_peds, 10, "Standard pediatric stroke parameters");
  await seedCondition(SEED_IDS.pi_peds_stage1_2, "Stage 1–2", SEED_IDS.pi_peds, 10, "Stage 1 or 2 pediatric pressure injury");
  await seedCondition(SEED_IDS.pi_peds_stage3_4, "Stage 3–4", SEED_IDS.pi_peds, 20, "Stage 3 or 4 pediatric pressure injury");
  await seedCondition(SEED_IDS.scd_peds_stable, "Stable", SEED_IDS.scd_peds, 10, "Stable pediatric SCD");
  await seedCondition(SEED_IDS.scd_peds_voc, "VOC / Crisis", SEED_IDS.scd_peds, 20, "Pediatric SCD in vaso-occlusive crisis");
  await seedCondition(SEED_IDS.hsct_peds_infant, "Infants & Young Children (<2y)", SEED_IDS.hsct_peds, 10, "Pediatric HSCT <2y parameters");
  await seedCondition(SEED_IDS.hsct_peds_child, "Children (2–16y)", SEED_IDS.hsct_peds, 20, "Pediatric HSCT 2-16y parameters");
  await seedCondition(SEED_IDS.hsct_peds_older, "Older Adolescent (>16y)", SEED_IDS.hsct_peds, 30, "Pediatric HSCT >16y parameters");
  await seedCondition(SEED_IDS.sbs_peds_pndep, "PN-Dependent", SEED_IDS.sbs_peds, 10, "PN-dependent pediatric SBS");
  await seedCondition(SEED_IDS.sbs_peds_entaut, "Enteral Autonomous / Transitioning", SEED_IDS.sbs_peds, 20, "Enteral autonomous pediatric SBS");
  await seedCondition(SEED_IDS.cf_peds_bedbound, "Bed-bound (PAL 1.3)", SEED_IDS.cf_peds, 10, "CF pediatric bedbound");
  await seedCondition(SEED_IDS.cf_peds_sedentary, "Sedentary (PAL 1.5)", SEED_IDS.cf_peds, 20, "CF pediatric sedentary");
  await seedCondition(SEED_IDS.cf_peds_active, "Active (PAL 1.7)", SEED_IDS.cf_peds, 30, "CF pediatric active");
  await seedCondition(SEED_IDS.hl_peds_normal, "Normal Weight", SEED_IDS.hl_peds, 10, "Normal weight pediatric EER");
  await seedCondition(SEED_IDS.hl_peds_overweight, "Overweight / Obese", SEED_IDS.hl_peds, 20, "Overweight/obese pediatric guidelines");
  await seedCondition(SEED_IDS.mal_peds_catchup, "Catch-up Growth", SEED_IDS.mal_peds, 10, "Pediatric catch-up growth parameters");
  await seedCondition(SEED_IDS.obe_peds_stable, "Stable", SEED_IDS.obe_peds, 10, "Stable pediatric weight management");
  await seedCondition(SEED_IDS.bpd_peds_std, "Standard", SEED_IDS.bpd_peds, 10, "Standard pediatric BPD parameters");
  await seedCondition(SEED_IDS.preg_peds_t1, "Trimester 1", SEED_IDS.preg_peds, 10, "First trimester pregnancy");
  await seedCondition(SEED_IDS.preg_peds_t2, "Trimester 2 (+340 kcal)", SEED_IDS.preg_peds, 20, "Second trimester pregnancy");
  await seedCondition(SEED_IDS.preg_peds_t3, "Trimester 3 (+452 kcal)", SEED_IDS.preg_peds, 30, "Third trimester pregnancy");
  await seedCondition(SEED_IDS.bf_peds_early, "0–6 Months Postpartum", SEED_IDS.bf_peds, 10, "Early postpartum breastfeeding");
  await seedCondition(SEED_IDS.bf_peds_late, "7–12 Months Postpartum", SEED_IDS.bf_peds, 20, "Late postpartum breastfeeding");

  // ─── 2. Equations ────────────────────────────────────────────────────────
  const torontoExpr = "max(-4343 + (10.5 * tbsaBurnedPct) + (0.23 * currentKcalIntake) + (0.84 * hbeBmrKcal) + (114 * coreTempC) - (4.5 * postBurnDay), weightKg * 20)";
  await seedEquation(SEED_IDS.copd_std_kcal_low, SEED_IDS.copd_standard, "energy", "msjReeKcal * 1.15", "kcal/day", "Energy — Lower Bound", 1);
  await seedEquation(SEED_IDS.copd_std_kcal_high, SEED_IDS.copd_standard, "energy", "msjReeKcal * 1.20", "kcal/day", "Energy — Upper Bound", 2);
  await seedEquation(SEED_IDS.copd_std_prot_low, SEED_IDS.copd_standard, "protein", "weightKg * 0.8", "g/day", "Protein — Lower Bound", 3);
  await seedEquation(SEED_IDS.copd_std_prot_high, SEED_IDS.copd_standard, "protein", "weightKg * 1.5", "g/day", "Protein — Upper Bound", 4);

  await seedEquation(SEED_IDS.heart_failure_std_kcal_low, SEED_IDS.heart_failure_standard, "energy", "msjReeKcal * palValue * 0.95", "kcal/day", "Energy — Lower Bound", 1);
  await seedEquation(SEED_IDS.heart_failure_std_kcal_high, SEED_IDS.heart_failure_standard, "energy", "msjReeKcal * palValue * 1.05", "kcal/day", "Energy — Upper Bound", 2);
  await seedEquation(SEED_IDS.heart_failure_std_prot_low, SEED_IDS.heart_failure_standard, "protein", "weightKg * 0.8", "g/day", "Protein — Lower Bound", 3);
  await seedEquation(SEED_IDS.heart_failure_std_prot_high, SEED_IDS.heart_failure_standard, "protein", "weightKg * 1.0", "g/day", "Protein — Upper Bound", 4);

  // Compensated
  await seedEquation(SEED_IDS.cirrhosis_comp_kcal_low, SEED_IDS.cirrhosis_compensated, "energy", "weightKg * 35", "kcal/day", "Energy — Lower Bound", 1);
  await seedEquation(SEED_IDS.cirrhosis_comp_kcal_high, SEED_IDS.cirrhosis_compensated, "energy", "weightKg * 40", "kcal/day", "Energy — Upper Bound", 2);
  await seedEquation(SEED_IDS.cirrhosis_comp_prot_low, SEED_IDS.cirrhosis_compensated, "protein", "weightKg * 1.2", "g/day", "Protein — Lower Bound", 3);
  await seedEquation(SEED_IDS.cirrhosis_comp_prot_high, SEED_IDS.cirrhosis_compensated, "protein", "weightKg * 1.5", "g/day", "Protein — Upper Bound", 4);

  // Decompensated
  await seedEquation(SEED_IDS.cirrhosis_decomp_kcal_low, SEED_IDS.cirrhosis_decompensated, "energy", "weightKg * 35", "kcal/day", "Energy — Lower Bound", 1);
  await seedEquation(SEED_IDS.cirrhosis_decomp_kcal_high, SEED_IDS.cirrhosis_decompensated, "energy", "weightKg * 40", "kcal/day", "Energy — Upper Bound", 2);
  await seedEquation(SEED_IDS.cirrhosis_decomp_prot_low, SEED_IDS.cirrhosis_decompensated, "protein", "weightKg * 1.5", "g/day", "Protein — Lower Bound", 3);
  await seedEquation(SEED_IDS.cirrhosis_decomp_prot_high, SEED_IDS.cirrhosis_decompensated, "protein", "weightKg * 2.0", "g/day", "Protein — Upper Bound", 4);

  // Acute
  await seedEquation(SEED_IDS.liver_transplant_acute_kcal, SEED_IDS.liver_transplant_acute, "energy", "msjReeKcal * 1.3", "kcal/day", "Energy — Target", 1);
  await seedEquation(SEED_IDS.liver_transplant_acute_prot_low, SEED_IDS.liver_transplant_acute, "protein", "weightKg * 1.5", "g/day", "Protein — Lower Bound", 2);
  await seedEquation(SEED_IDS.liver_transplant_acute_prot_high, SEED_IDS.liver_transplant_acute, "protein", "weightKg * 2.0", "g/day", "Protein — Upper Bound", 3);

  // Chronic
  await seedEquation(SEED_IDS.liver_transplant_chronic_kcal_low, SEED_IDS.liver_transplant_chronic, "energy", "msjReeKcal * 1.0", "kcal/day", "Energy — Lower Bound", 1);
  await seedEquation(SEED_IDS.liver_transplant_chronic_kcal_high, SEED_IDS.liver_transplant_chronic, "energy", "msjReeKcal * 1.3", "kcal/day", "Energy — Upper Bound", 2);
  await seedEquation(SEED_IDS.liver_transplant_chronic_prot_low, SEED_IDS.liver_transplant_chronic, "protein", "weightKg * 0.8", "g/day", "Protein — Lower Bound", 3);
  await seedEquation(SEED_IDS.liver_transplant_chronic_prot_high, SEED_IDS.liver_transplant_chronic, "protein", "weightKg * 1.0", "g/day", "Protein — Upper Bound", 4);

  // VLPD
  await seedEquation(SEED_IDS.ckd_vlpd_kcal_low, SEED_IDS.ckd_vlpd, "energy", "weightKg * 25", "kcal/day", "Energy — Lower Bound", 1);
  await seedEquation(SEED_IDS.ckd_vlpd_kcal_high, SEED_IDS.ckd_vlpd, "energy", "weightKg * 35", "kcal/day", "Energy — Upper Bound", 2);
  await seedEquation(SEED_IDS.ckd_vlpd_prot_low, SEED_IDS.ckd_vlpd, "protein", "weightKg * 0.28", "g/day", "Protein — Lower Bound", 3);
  await seedEquation(SEED_IDS.ckd_vlpd_prot_high, SEED_IDS.ckd_vlpd, "protein", "weightKg * 0.43", "g/day", "Protein — Upper Bound", 4);

  // Low-Protein
  await seedEquation(SEED_IDS.ckd_lpd_kcal_low, SEED_IDS.ckd_lpd, "energy", "weightKg * 25", "kcal/day", "Energy — Lower Bound", 1);
  await seedEquation(SEED_IDS.ckd_lpd_kcal_high, SEED_IDS.ckd_lpd, "energy", "weightKg * 35", "kcal/day", "Energy — Upper Bound", 2);
  await seedEquation(SEED_IDS.ckd_lpd_prot_low, SEED_IDS.ckd_lpd, "protein", "weightKg * 0.55", "g/day", "Protein — Lower Bound", 3);
  await seedEquation(SEED_IDS.ckd_lpd_prot_high, SEED_IDS.ckd_lpd, "protein", "weightKg * 0.60", "g/day", "Protein — Upper Bound", 4);

  // Low-Protein + DM
  await seedEquation(SEED_IDS.ckd_lpddm_kcal_low, SEED_IDS.ckd_lpd_dm, "energy", "weightKg * 25", "kcal/day", "Energy — Lower Bound", 1);
  await seedEquation(SEED_IDS.ckd_lpddm_kcal_high, SEED_IDS.ckd_lpd_dm, "energy", "weightKg * 35", "kcal/day", "Energy — Upper Bound", 2);
  await seedEquation(SEED_IDS.ckd_lpddm_prot_low, SEED_IDS.ckd_lpd_dm, "protein", "weightKg * 0.60", "g/day", "Protein — Lower Bound", 3);
  await seedEquation(SEED_IDS.ckd_lpddm_prot_high, SEED_IDS.ckd_lpd_dm, "protein", "weightKg * 0.80", "g/day", "Protein — Upper Bound", 4);

  // HD
  await seedEquation(SEED_IDS.ckd_hd_kcal_low, SEED_IDS.ckd_hd, "energy", "weightKg * 25", "kcal/day", "Energy — Lower Bound", 1);
  await seedEquation(SEED_IDS.ckd_hd_kcal_high, SEED_IDS.ckd_hd, "energy", "weightKg * 35", "kcal/day", "Energy — Upper Bound", 2);
  await seedEquation(SEED_IDS.ckd_hd_prot_low, SEED_IDS.ckd_hd, "protein", "weightKg * 1.2", "g/day", "Protein — Lower Bound", 3);
  await seedEquation(SEED_IDS.ckd_hd_prot_high, SEED_IDS.ckd_hd, "protein", "weightKg * 1.2", "g/day", "Protein — Upper Bound", 4);

  // PD
  await seedEquation(SEED_IDS.ckd_pd_kcal_low, SEED_IDS.ckd_pd, "energy", "weightKg * 25", "kcal/day", "Energy — Lower Bound", 1);
  await seedEquation(SEED_IDS.ckd_pd_kcal_high, SEED_IDS.ckd_pd, "energy", "weightKg * 35", "kcal/day", "Energy — Upper Bound", 2);
  await seedEquation(SEED_IDS.ckd_pd_prot_low, SEED_IDS.ckd_pd, "protein", "weightKg * 1.2", "g/day", "Protein — Lower Bound", 3);
  await seedEquation(SEED_IDS.ckd_pd_prot_high, SEED_IDS.ckd_pd, "protein", "weightKg * 1.3", "g/day", "Protein — Upper Bound", 4);

  // Acute
  await seedEquation(SEED_IDS.kidney_transplant_acute_kcal_low, SEED_IDS.kidney_transplant_acute, "energy", "msjReeKcal * 1.2", "kcal/day", "Energy — Lower Bound", 1);
  await seedEquation(SEED_IDS.kidney_transplant_acute_kcal_high, SEED_IDS.kidney_transplant_acute, "energy", "msjReeKcal * 1.3", "kcal/day", "Energy — Upper Bound", 2);
  await seedEquation(SEED_IDS.kidney_transplant_acute_prot_low, SEED_IDS.kidney_transplant_acute, "protein", "weightKg * 1.2", "g/day", "Protein — Lower Bound", 3);
  await seedEquation(SEED_IDS.kidney_transplant_acute_prot_high, SEED_IDS.kidney_transplant_acute, "protein", "weightKg * 2.0", "g/day", "Protein — Upper Bound", 4);

  // Chronic
  await seedEquation(SEED_IDS.kidney_transplant_chron_kcal_low, SEED_IDS.kidney_transplant_chronic, "energy", "weightKg * 25", "kcal/day", "Energy — Lower Bound", 1);
  await seedEquation(SEED_IDS.kidney_transplant_chron_kcal_high, SEED_IDS.kidney_transplant_chronic, "energy", "weightKg * 30", "kcal/day", "Energy — Upper Bound", 2);
  await seedEquation(SEED_IDS.kidney_transplant_chron_prot_low, SEED_IDS.kidney_transplant_chronic, "protein", "weightKg * 0.6", "g/day", "Protein — Lower Bound", 3);
  await seedEquation(SEED_IDS.kidney_transplant_chron_prot_high, SEED_IDS.kidney_transplant_chronic, "protein", "weightKg * 0.8", "g/day", "Protein — Upper Bound", 4);

  // Chronic + DM
  await seedEquation(SEED_IDS.kidney_transplant_chrondm_kcal_low, SEED_IDS.kidney_transplant_chronic_dm, "energy", "weightKg * 25", "kcal/day", "Energy — Lower Bound", 1);
  await seedEquation(SEED_IDS.kidney_transplant_chrondm_kcal_high, SEED_IDS.kidney_transplant_chronic_dm, "energy", "weightKg * 30", "kcal/day", "Energy — Upper Bound", 2);
  await seedEquation(SEED_IDS.kidney_transplant_chrondm_prot_low, SEED_IDS.kidney_transplant_chronic_dm, "protein", "weightKg * 0.8", "g/day", "Protein — Lower Bound", 3);
  await seedEquation(SEED_IDS.kidney_transplant_chrondm_prot_high, SEED_IDS.kidney_transplant_chronic_dm, "protein", "weightKg * 0.9", "g/day", "Protein — Upper Bound", 4);

  // Standard
  await seedEquation(SEED_IDS.masld_mash_std_kcal_low, SEED_IDS.masld_mash_standard, "energy", "max(msjReeKcal * 1.2 - 800, weightKg * 20)", "kcal/day", "Energy — Lower Bound", 1);
  await seedEquation(SEED_IDS.masld_mash_std_kcal_high, SEED_IDS.masld_mash_standard, "energy", "max(msjReeKcal * 1.2 - 500, weightKg * 22)", "kcal/day", "Energy — Upper Bound", 2);
  await seedEquation(SEED_IDS.masld_mash_std_prot_low, SEED_IDS.masld_mash_standard, "protein", "weightKg * 1.5", "g/day", "Protein — Lower Bound", 3);
  await seedEquation(SEED_IDS.masld_mash_std_prot_high, SEED_IDS.masld_mash_standard, "protein", "weightKg * 1.8", "g/day", "Protein — Upper Bound", 4);

  // Malnourished
  await seedEquation(SEED_IDS.masld_mash_mal_kcal_low, SEED_IDS.masld_mash_malnourished, "energy", "weightKg * 30", "kcal/day", "Energy — Lower Bound", 1);
  await seedEquation(SEED_IDS.masld_mash_mal_kcal_high, SEED_IDS.masld_mash_malnourished, "energy", "weightKg * 35", "kcal/day", "Energy — Upper Bound", 2);
  await seedEquation(SEED_IDS.masld_mash_mal_prot_low, SEED_IDS.masld_mash_malnourished, "protein", "weightKg * 1.5", "g/day", "Protein — Lower Bound", 3);
  await seedEquation(SEED_IDS.masld_mash_mal_prot_high, SEED_IDS.masld_mash_malnourished, "protein", "weightKg * 1.8", "g/day", "Protein — Upper Bound", 4);

  // BMI < 30 equations & notes
  await seedEquation(SEED_IDS.crit_ill_lt30_kcal_low, SEED_IDS.crit_ill_bmi_lt30, "energy", "weightKg * 12", "kcal/day", "Energy — Lower Bound", 1);
  await seedEquation(SEED_IDS.crit_ill_lt30_kcal_high, SEED_IDS.crit_ill_bmi_lt30, "energy", "weightKg * 25", "kcal/day", "Energy — Upper Bound", 2);
  await seedEquation(SEED_IDS.crit_ill_lt30_prot_low, SEED_IDS.crit_ill_bmi_lt30, "protein", "weightKg * 1.2", "g/day", "Protein — Lower Bound", 3);
  await seedEquation(SEED_IDS.crit_ill_lt30_prot_high, SEED_IDS.crit_ill_bmi_lt30, "protein", "weightKg * 2.0", "g/day", "Protein — Upper Bound", 4);

  // BMI 30-50 equations & notes
  await seedEquation(SEED_IDS.crit_ill_30_50_kcal_low, SEED_IDS.crit_ill_bmi_30_50, "energy", "weightKg * 11", "kcal/day", "Energy — Lower Bound", 1);
  await seedEquation(SEED_IDS.crit_ill_30_50_kcal_high, SEED_IDS.crit_ill_bmi_30_50, "energy", "weightKg * 14", "kcal/day", "Energy — Upper Bound", 2);
  await seedEquation(SEED_IDS.crit_ill_30_50_prot_low, SEED_IDS.crit_ill_bmi_30_50, "protein", "ibwKg * 2.0", "g/day", "Protein — Lower Bound", 3);
  await seedEquation(SEED_IDS.crit_ill_30_50_prot_high, SEED_IDS.crit_ill_bmi_30_50, "protein", "ibwKg * 2.0", "g/day", "Protein — Upper Bound", 4);

  // BMI > 50 equations & notes
  await seedEquation(SEED_IDS.crit_ill_gt50_kcal_low, SEED_IDS.crit_ill_bmi_gt50, "energy", "ibwKg * 22", "kcal/day", "Energy — Lower Bound", 1);
  await seedEquation(SEED_IDS.crit_ill_gt50_kcal_high, SEED_IDS.crit_ill_bmi_gt50, "energy", "ibwKg * 25", "kcal/day", "Energy — Upper Bound", 2);
  await seedEquation(SEED_IDS.crit_ill_gt50_prot_low, SEED_IDS.crit_ill_bmi_gt50, "protein", "ibwKg * 2.5", "g/day", "Protein — Lower Bound", 3);
  await seedEquation(SEED_IDS.crit_ill_gt50_prot_high, SEED_IDS.crit_ill_bmi_gt50, "protein", "ibwKg * 2.5", "g/day", "Protein — Upper Bound", 4);

  // No Dialysis equations & notes
  await seedEquation(SEED_IDS.aki_no_dial_kcal_low, SEED_IDS.aki_no_dialysis, "energy", "min(msjReeKcal * 1.0, weightKg * 20)", "kcal/day", "Energy — Lower Bound", 1);
  await seedEquation(SEED_IDS.aki_no_dial_kcal_high, SEED_IDS.aki_no_dialysis, "energy", "max(msjReeKcal * 1.1, weightKg * 25)", "kcal/day", "Energy — Upper Bound", 2);
  await seedEquation(SEED_IDS.aki_no_dial_prot_low, SEED_IDS.aki_no_dialysis, "protein", "weightKg * 0.8", "g/day", "Protein — Lower Bound", 3);
  await seedEquation(SEED_IDS.aki_no_dial_prot_high, SEED_IDS.aki_no_dialysis, "protein", "weightKg * 1.0", "g/day", "Protein — Upper Bound", 4);

  // Hemodialysis equations & notes
  await seedEquation(SEED_IDS.aki_hd_kcal_low, SEED_IDS.aki_hemodialysis, "energy", "msjReeKcal * 1.2", "kcal/day", "Energy — Lower Bound", 1);
  await seedEquation(SEED_IDS.aki_hd_kcal_high, SEED_IDS.aki_hemodialysis, "energy", "msjReeKcal * 1.3", "kcal/day", "Energy — Upper Bound", 2);
  await seedEquation(SEED_IDS.aki_hd_prot_low, SEED_IDS.aki_hemodialysis, "protein", "weightKg * 1.0", "g/day", "Protein — Lower Bound", 3);
  await seedEquation(SEED_IDS.aki_hd_prot_high, SEED_IDS.aki_hemodialysis, "protein", "weightKg * 1.5", "g/day", "Protein — Upper Bound", 4);

  // CRRT equations & notes
  await seedEquation(SEED_IDS.aki_crrt_kcal_low, SEED_IDS.aki_crrt, "energy", "msjReeKcal * 1.2", "kcal/day", "Energy — Lower Bound", 1);
  await seedEquation(SEED_IDS.aki_crrt_kcal_high, SEED_IDS.aki_crrt, "energy", "msjReeKcal * 1.3", "kcal/day", "Energy — Upper Bound", 2);
  await seedEquation(SEED_IDS.aki_crrt_prot_low, SEED_IDS.aki_crrt, "protein", "weightKg * 1.7", "g/day", "Protein — Lower Bound", 3);
  await seedEquation(SEED_IDS.aki_crrt_prot_high, SEED_IDS.aki_crrt, "protein", "weightKg * 2.5", "g/day", "Protein — Upper Bound", 4);

  // Mild–Moderate equations & notes
  await seedEquation(SEED_IDS.pancreatitis_mild_kcal_low, SEED_IDS.pancreatitis_mild_mod, "energy", "msjReeKcal * 1.1", "kcal/day", "Energy — Lower Bound", 1);
  await seedEquation(SEED_IDS.pancreatitis_mild_kcal_high, SEED_IDS.pancreatitis_mild_mod, "energy", "msjReeKcal * 1.2", "kcal/day", "Energy — Upper Bound", 2);
  await seedEquation(SEED_IDS.pancreatitis_mild_prot_low, SEED_IDS.pancreatitis_mild_mod, "protein", "weightKg * 1.2", "g/day", "Protein — Lower Bound", 3);
  await seedEquation(SEED_IDS.pancreatitis_mild_prot_high, SEED_IDS.pancreatitis_mild_mod, "protein", "weightKg * 1.5", "g/day", "Protein — Upper Bound", 4);

  // Severe/Critical equations & notes
  await seedEquation(SEED_IDS.pancreatitis_severe_kcal_low, SEED_IDS.pancreatitis_severe_crit, "energy", "msjReeKcal * 1.2", "kcal/day", "Energy — Lower Bound", 1);
  await seedEquation(SEED_IDS.pancreatitis_severe_kcal_high, SEED_IDS.pancreatitis_severe_crit, "energy", "msjReeKcal * 1.5", "kcal/day", "Energy — Upper Bound", 2);
  await seedEquation(SEED_IDS.pancreatitis_severe_prot_low, SEED_IDS.pancreatitis_severe_crit, "protein", "weightKg * 1.5", "g/day", "Protein — Lower Bound", 3);
  await seedEquation(SEED_IDS.pancreatitis_severe_prot_high, SEED_IDS.pancreatitis_severe_crit, "protein", "weightKg * 2.0", "g/day", "Protein — Upper Bound", 4);

  // Standard Trauma equations & notes
  await seedEquation(SEED_IDS.trauma_std_kcal_low, SEED_IDS.trauma_standard, "energy", "msjReeKcal * 1.3", "kcal/day", "Energy — Lower Bound", 1);
  await seedEquation(SEED_IDS.trauma_std_kcal_high, SEED_IDS.trauma_standard, "energy", "msjReeKcal * 1.4", "kcal/day", "Energy — Upper Bound", 2);
  await seedEquation(SEED_IDS.trauma_std_prot_low, SEED_IDS.trauma_standard, "protein", "weightKg * 1.2", "g/day", "Protein — Lower Bound", 3);
  await seedEquation(SEED_IDS.trauma_std_prot_high, SEED_IDS.trauma_standard, "protein", "weightKg * 2.0", "g/day", "Protein — Upper Bound", 4);

  // Open Abdomen equations & notes
  await seedEquation(SEED_IDS.trauma_open_kcal_low, SEED_IDS.trauma_open_abdomen, "energy", "msjReeKcal * 1.3 + exudateVolumeL * 116", "kcal/day", "Energy — Lower Bound", 1);
  await seedEquation(SEED_IDS.trauma_open_kcal_high, SEED_IDS.trauma_open_abdomen, "energy", "msjReeKcal * 1.4 + exudateVolumeL * 116", "kcal/day", "Energy — Upper Bound", 2);
  await seedEquation(SEED_IDS.trauma_open_prot_low, SEED_IDS.trauma_open_abdomen, "protein", "weightKg * 1.2 + exudateVolumeL * 29", "g/day", "Protein — Lower Bound", 3);
  await seedEquation(SEED_IDS.trauma_open_prot_high, SEED_IDS.trauma_open_abdomen, "protein", "weightKg * 2.0 + exudateVolumeL * 29", "g/day", "Protein — Upper Bound", 4);

  // Toronto equations & notes
  await seedEquation(SEED_IDS.burns_toronto_kcal_low, SEED_IDS.burns_toronto, "energy", `${torontoExpr} * 0.9`, "kcal/day", "Energy — Lower Bound", 1);
  await seedEquation(SEED_IDS.burns_toronto_kcal_high, SEED_IDS.burns_toronto, "energy", `${torontoExpr} * 1.1`, "kcal/day", "Energy — Upper Bound", 2);
  await seedEquation(SEED_IDS.burns_toronto_prot_low, SEED_IDS.burns_toronto, "protein", "ifTrue(tbsaBurnedPct > 40, weightKg * 2.0, weightKg * 1.5)", "g/day", "Protein — Lower Bound", 3);
  await seedEquation(SEED_IDS.burns_toronto_prot_high, SEED_IDS.burns_toronto, "protein", "weightKg * 2.0", "g/day", "Protein — Upper Bound", 4);

  // Ischemic equations & notes
  await seedEquation(SEED_IDS.stroke_isc_kcal_low, SEED_IDS.stroke_ischemic, "energy", "msjReeKcal * 1.1", "kcal/day", "Energy — Lower Bound", 1);
  await seedEquation(SEED_IDS.stroke_isc_kcal_high, SEED_IDS.stroke_ischemic, "energy", "msjReeKcal * 1.2", "kcal/day", "Energy — Upper Bound", 2);
  await seedEquation(SEED_IDS.stroke_isc_prot_low, SEED_IDS.stroke_ischemic, "protein", "weightKg * 1.0", "g/day", "Protein — Lower Bound", 3);
  await seedEquation(SEED_IDS.stroke_isc_prot_high, SEED_IDS.stroke_ischemic, "protein", "weightKg * 1.5", "g/day", "Protein — Upper Bound", 4);

  // Hemorrhagic equations & notes
  await seedEquation(SEED_IDS.stroke_hem_kcal_low, SEED_IDS.stroke_hemorrhagic, "energy", "msjReeKcal * 1.1", "kcal/day", "Energy — Lower Bound", 1);
  await seedEquation(SEED_IDS.stroke_hem_kcal_high, SEED_IDS.stroke_hemorrhagic, "energy", "msjReeKcal * 1.2", "kcal/day", "Energy — Upper Bound", 2);
  await seedEquation(SEED_IDS.stroke_hem_prot_low, SEED_IDS.stroke_hemorrhagic, "protein", "weightKg * 1.5", "g/day", "Protein — Lower Bound", 3);
  await seedEquation(SEED_IDS.stroke_hem_prot_high, SEED_IDS.stroke_hemorrhagic, "protein", "weightKg * 2.5", "g/day", "Protein — Upper Bound", 4);

  // Non-ambulatory
  await seedEquation(SEED_IDS.onc_sed_kcal_low, SEED_IDS.onc_sed, "energy", "weightKg * 25", "kcal/day", "Energy — Lower Bound", 1);
  await seedEquation(SEED_IDS.onc_sed_kcal_high, SEED_IDS.onc_sed, "energy", "weightKg * 30", "kcal/day", "Energy — Upper Bound", 2);
  await seedEquation(SEED_IDS.onc_sed_prot_low, SEED_IDS.onc_sed, "protein", "weightKg * 1.0", "g/day", "Protein — Lower Bound", 3);
  await seedEquation(SEED_IDS.onc_sed_prot_high, SEED_IDS.onc_sed, "protein", "weightKg * 1.2", "g/day", "Protein — Upper Bound", 4);

  // Hypermetabolic
  await seedEquation(SEED_IDS.onc_hyper_kcal_low, SEED_IDS.onc_hyper, "energy", "weightKg * 30", "kcal/day", "Energy — Lower Bound", 1);
  await seedEquation(SEED_IDS.onc_hyper_kcal_high, SEED_IDS.onc_hyper, "energy", "weightKg * 35", "kcal/day", "Energy — Upper Bound", 2);
  await seedEquation(SEED_IDS.onc_hyper_prot_low, SEED_IDS.onc_hyper, "protein", "weightKg * 1.2", "g/day", "Protein — Lower Bound", 3);
  await seedEquation(SEED_IDS.onc_hyper_prot_high, SEED_IDS.onc_hyper, "protein", "weightKg * 1.5", "g/day", "Protein — Upper Bound", 4);

  // Severely Stressed
  await seedEquation(SEED_IDS.onc_stressed_kcal_low, SEED_IDS.onc_stressed, "energy", "weightKg * 35", "kcal/day", "Energy — Lower Bound", 1);
  await seedEquation(SEED_IDS.onc_stressed_kcal_high, SEED_IDS.onc_stressed, "energy", "weightKg * 35", "kcal/day", "Energy — Upper Bound", 2);
  await seedEquation(SEED_IDS.onc_stressed_prot_low, SEED_IDS.onc_stressed, "protein", "weightKg * 1.5", "g/day", "Protein — Lower Bound", 3);
  await seedEquation(SEED_IDS.onc_stressed_prot_high, SEED_IDS.onc_stressed, "protein", "weightKg * 2.0", "g/day", "Protein — Upper Bound", 4);

  // High Protein
  await seedEquation(SEED_IDS.onc_highprot_kcal_low, SEED_IDS.onc_highprot, "energy", "weightKg * 30", "kcal/day", "Energy — Lower Bound", 1);
  await seedEquation(SEED_IDS.onc_highprot_kcal_high, SEED_IDS.onc_highprot, "energy", "weightKg * 35", "kcal/day", "Energy — Upper Bound", 2);
  await seedEquation(SEED_IDS.onc_highprot_prot_low, SEED_IDS.onc_highprot, "protein", "weightKg * 1.5", "g/day", "Protein — Lower Bound", 3);
  await seedEquation(SEED_IDS.onc_highprot_prot_high, SEED_IDS.onc_highprot, "protein", "weightKg * 2.5", "g/day", "Protein — Upper Bound", 4);

  // Active Treatment
  await seedEquation(SEED_IDS.hsct_active_kcal_low, SEED_IDS.hsct_active, "energy", "min(msjReeKcal * 1.3, weightKg * 30)", "kcal/day", "Energy — Lower Bound", 1);
  await seedEquation(SEED_IDS.hsct_active_kcal_high, SEED_IDS.hsct_active, "energy", "max(msjReeKcal * 1.5, weightKg * 35)", "kcal/day", "Energy — Upper Bound", 2);
  await seedEquation(SEED_IDS.hsct_active_prot_low, SEED_IDS.hsct_active, "protein", "weightKg * 1.5", "g/day", "Protein — Target", 3);
  await seedEquation(SEED_IDS.hsct_active_prot_high, SEED_IDS.hsct_active, "protein", "weightKg * 1.5", "g/day", "Protein — Target", 4);

  // Recovery
  await seedEquation(SEED_IDS.hsct_rec_kcal_low, SEED_IDS.hsct_recovery, "energy", "msjReeKcal * 1.3", "kcal/day", "Energy — Target", 1);
  await seedEquation(SEED_IDS.hsct_rec_kcal_high, SEED_IDS.hsct_recovery, "energy", "msjReeKcal * 1.3", "kcal/day", "Energy — Target", 2);
  await seedEquation(SEED_IDS.hsct_rec_prot_low, SEED_IDS.hsct_recovery, "protein", "weightKg * 1.2", "g/day", "Protein — Lower Bound", 3);
  await seedEquation(SEED_IDS.hsct_rec_prot_high, SEED_IDS.hsct_recovery, "protein", "weightKg * 1.5", "g/day", "Protein — Upper Bound", 4);

  await seedEquation(SEED_IDS.sbs_kcal_low, SEED_IDS.sbs_standard, "energy", "msjReeKcal * 1.3 * 1.2", "kcal/day", "Energy — Lower Bound", 1);
  await seedEquation(SEED_IDS.sbs_kcal_high, SEED_IDS.sbs_standard, "energy", "msjReeKcal * 1.3 * 1.5", "kcal/day", "Energy — Upper Bound", 2);
  await seedEquation(SEED_IDS.sbs_prot_low, SEED_IDS.sbs_standard, "protein", "max((msjReeKcal * 1.3 * 1.35) * 0.20 / 4, weightKg * 1.5)", "g/day", "Protein — Lower Bound", 3);
  await seedEquation(SEED_IDS.sbs_prot_high, SEED_IDS.sbs_standard, "protein", "max((msjReeKcal * 1.3 * 1.35) * 0.20 / 4 * 1.1, weightKg * 2.0)", "g/day", "Protein — Upper Bound", 4);

  // Bed-bound
  await seedEquation(SEED_IDS.cf_bb_kcal_low, SEED_IDS.cf_bedbound, "energy", "df = ifTrue(fev1Pct >= 80, 1.0, ifTrue(fev1Pct >= 40, 1.1, 1.5)); msjReeKcal * df * 1.3", "kcal/day", "Energy — Lower Bound", 1);
  await seedEquation(SEED_IDS.cf_bb_kcal_high, SEED_IDS.cf_bedbound, "energy", "df = ifTrue(fev1Pct >= 80, 1.1, ifTrue(fev1Pct >= 40, 1.4, 2.0)); msjReeKcal * df * 1.3", "kcal/day", "Energy — Upper Bound", 2);
  await seedEquation(SEED_IDS.cf_bb_prot_low, SEED_IDS.cf_bedbound, "protein", "weightKg * 0.96", "g/day", "Protein — Lower Bound", 3);
  await seedEquation(SEED_IDS.cf_bb_prot_high, SEED_IDS.cf_bedbound, "protein", "weightKg * 1.6", "g/day", "Protein — Upper Bound", 4);

  // Sedentary
  await seedEquation(SEED_IDS.cf_sed_kcal_low, SEED_IDS.cf_sedentary, "energy", "df = ifTrue(fev1Pct >= 80, 1.0, ifTrue(fev1Pct >= 40, 1.1, 1.5)); msjReeKcal * df * 1.5", "kcal/day", "Energy — Lower Bound", 1);
  await seedEquation(SEED_IDS.cf_sed_kcal_high, SEED_IDS.cf_sedentary, "energy", "df = ifTrue(fev1Pct >= 80, 1.1, ifTrue(fev1Pct >= 40, 1.4, 2.0)); msjReeKcal * df * 1.5", "kcal/day", "Energy — Upper Bound", 2);
  await seedEquation(SEED_IDS.cf_sed_prot_low, SEED_IDS.cf_sedentary, "protein", "weightKg * 0.96", "g/day", "Protein — Lower Bound", 3);
  await seedEquation(SEED_IDS.cf_sed_prot_high, SEED_IDS.cf_sedentary, "protein", "weightKg * 1.6", "g/day", "Protein — Upper Bound", 4);

  // Active
  await seedEquation(SEED_IDS.cf_act_kcal_low, SEED_IDS.cf_active, "energy", "df = ifTrue(fev1Pct >= 80, 1.0, ifTrue(fev1Pct >= 40, 1.1, 1.5)); msjReeKcal * df * 1.7", "kcal/day", "Energy — Lower Bound", 1);
  await seedEquation(SEED_IDS.cf_act_kcal_high, SEED_IDS.cf_active, "energy", "df = ifTrue(fev1Pct >= 80, 1.1, ifTrue(fev1Pct >= 40, 1.4, 2.0)); msjReeKcal * df * 1.7", "kcal/day", "Energy — Upper Bound", 2);
  await seedEquation(SEED_IDS.cf_act_prot_low, SEED_IDS.cf_active, "protein", "weightKg * 0.96", "g/day", "Protein — Lower Bound", 3);
  await seedEquation(SEED_IDS.cf_act_prot_high, SEED_IDS.cf_active, "protein", "weightKg * 1.6", "g/day", "Protein — Upper Bound", 4);

  // Stable
  await seedEquation(SEED_IDS.scd_stable_kcal_low, SEED_IDS.scd_stable, "energy", "msjReeKcal * 1.3", "kcal/day", "Energy — Target", 1);
  await seedEquation(SEED_IDS.scd_stable_kcal_high, SEED_IDS.scd_stable, "energy", "msjReeKcal * 1.3", "kcal/day", "Energy — Target", 2);
  await seedEquation(SEED_IDS.scd_stable_prot_low, SEED_IDS.scd_stable, "protein", "weightKg * 1.0", "g/day", "Protein — Lower Bound", 3);
  await seedEquation(SEED_IDS.scd_stable_prot_high, SEED_IDS.scd_stable, "protein", "weightKg * 1.3", "g/day", "Protein — Upper Bound", 4);

  // VOC
  await seedEquation(SEED_IDS.scd_voc_kcal_low, SEED_IDS.scd_voc, "energy", "msjReeKcal * 1.3", "kcal/day", "Energy — Lower Bound", 1);
  await seedEquation(SEED_IDS.scd_voc_kcal_high, SEED_IDS.scd_voc, "energy", "msjReeKcal * 1.5", "kcal/day", "Energy — Upper Bound", 2);
  await seedEquation(SEED_IDS.scd_voc_prot_low, SEED_IDS.scd_voc, "protein", "weightKg * 1.0", "g/day", "Protein — Lower Bound", 3);
  await seedEquation(SEED_IDS.scd_voc_prot_high, SEED_IDS.scd_voc, "protein", "weightKg * 1.3", "g/day", "Protein — Upper Bound", 4);

  // Stage 1-2
  await seedEquation(SEED_IDS.pi_stage1_2_kcal_low, SEED_IDS.pi_stage1_2, "energy", "msjReeKcal * 1.2", "kcal/day", "Energy — Lower Bound", 1);
  await seedEquation(SEED_IDS.pi_stage1_2_kcal_high, SEED_IDS.pi_stage1_2, "energy", "msjReeKcal * 1.3", "kcal/day", "Energy — Upper Bound", 2);
  await seedEquation(SEED_IDS.pi_stage1_2_prot_low, SEED_IDS.pi_stage1_2, "protein", "weightKg * 1.25", "g/day", "Protein — Lower Bound", 3);
  await seedEquation(SEED_IDS.pi_stage1_2_prot_high, SEED_IDS.pi_stage1_2, "protein", "weightKg * 1.5", "g/day", "Protein — Upper Bound", 4);

  // Stage 3-4
  await seedEquation(SEED_IDS.pi_stage3_4_kcal_low, SEED_IDS.pi_stage3_4, "energy", "msjReeKcal * 1.35", "kcal/day", "Energy — Lower Bound", 1);
  await seedEquation(SEED_IDS.pi_stage3_4_kcal_high, SEED_IDS.pi_stage3_4, "energy", "msjReeKcal * 1.5", "kcal/day", "Energy — Upper Bound", 2);
  await seedEquation(SEED_IDS.pi_stage3_4_prot_low, SEED_IDS.pi_stage3_4, "protein", "weightKg * 1.5", "g/day", "Protein — Lower Bound", 3);
  await seedEquation(SEED_IDS.pi_stage3_4_prot_high, SEED_IDS.pi_stage3_4, "protein", "weightKg * 2.0", "g/day", "Protein — Upper Bound", 4);

  await seedEquation(SEED_IDS.mal_kcal_low, SEED_IDS.mal_refeeding, "energy", "weightKg * 30", "kcal/day", "Energy — Lower Bound", 1);
  await seedEquation(SEED_IDS.mal_kcal_high, SEED_IDS.mal_refeeding, "energy", "weightKg * 35", "kcal/day", "Energy — Upper Bound", 2);
  await seedEquation(SEED_IDS.mal_prot_low, SEED_IDS.mal_refeeding, "protein", "weightKg * 1.2", "g/day", "Protein — Lower Bound", 3);
  await seedEquation(SEED_IDS.mal_prot_high, SEED_IDS.mal_refeeding, "protein", "weightKg * 2.0", "g/day", "Protein — Upper Bound", 4);

  await seedEquation(SEED_IDS.obe_kcal_low, SEED_IDS.obe_stable, "energy", "ibwKg * 20", "kcal/day", "Energy — Lower Bound", 1);
  await seedEquation(SEED_IDS.obe_kcal_high, SEED_IDS.obe_stable, "energy", "ibwKg * 25", "kcal/day", "Energy — Upper Bound", 2);
  await seedEquation(SEED_IDS.obe_prot_low, SEED_IDS.obe_stable, "protein", "weightKg * 0.8", "g/day", "Protein — Lower Bound", 3);
  await seedEquation(SEED_IDS.obe_prot_high, SEED_IDS.obe_stable, "protein", "weightKg * 1.0", "g/day", "Protein — Upper Bound", 4);

  // Trimester 1
  await seedEquation(SEED_IDS.preg_t1_kcal_low, SEED_IDS.preg_t1, "energy", "msjReeKcal * 1.4", "kcal/day", "Energy — Lower Bound", 1);
  await seedEquation(SEED_IDS.preg_t1_kcal_high, SEED_IDS.preg_t1, "energy", "msjReeKcal * 1.4 + 50", "kcal/day", "Energy — Upper Bound", 2);
  await seedEquation(SEED_IDS.preg_t1_prot, SEED_IDS.preg_t1, "protein", "71", "g/day", "Protein — Target", 3);

  // Trimester 2
  await seedEquation(SEED_IDS.preg_t2_kcal_low, SEED_IDS.preg_t2, "energy", "msjReeKcal * 1.4 + 340", "kcal/day", "Energy — Lower Bound", 1);
  await seedEquation(SEED_IDS.preg_t2_kcal_high, SEED_IDS.preg_t2, "energy", "msjReeKcal * 1.4 + 390", "kcal/day", "Energy — Upper Bound", 2);
  await seedEquation(SEED_IDS.preg_t2_prot, SEED_IDS.preg_t2, "protein", "71", "g/day", "Protein — Target", 3);

  // Trimester 3
  await seedEquation(SEED_IDS.preg_t3_kcal_low, SEED_IDS.preg_t3, "energy", "msjReeKcal * 1.4 + 452", "kcal/day", "Energy — Lower Bound", 1);
  await seedEquation(SEED_IDS.preg_t3_kcal_high, SEED_IDS.preg_t3, "energy", "msjReeKcal * 1.4 + 502", "kcal/day", "Energy — Upper Bound", 2);
  await seedEquation(SEED_IDS.preg_t3_prot, SEED_IDS.preg_t3, "protein", "71", "g/day", "Protein — Target", 3);

  // 0-6 Months
  await seedEquation(SEED_IDS.bf_early_kcal_low, SEED_IDS.bf_early, "energy", "msjReeKcal + 380", "kcal/day", "Energy — Lower Bound", 1);
  await seedEquation(SEED_IDS.bf_early_kcal_high, SEED_IDS.bf_early, "energy", "msjReeKcal + 420", "kcal/day", "Energy — Upper Bound", 2);
  await seedEquation(SEED_IDS.bf_early_prot, SEED_IDS.bf_early, "protein", "71", "g/day", "Protein — Target", 3);

  // 7-12 Months
  await seedEquation(SEED_IDS.bf_late_kcal_low, SEED_IDS.bf_late, "energy", "msjReeKcal + 310", "kcal/day", "Energy — Lower Bound", 1);
  await seedEquation(SEED_IDS.bf_late_kcal_high, SEED_IDS.bf_late, "energy", "msjReeKcal + 350", "kcal/day", "Energy — Upper Bound", 2);
  await seedEquation(SEED_IDS.bf_late_prot, SEED_IDS.bf_late, "protein", "71", "g/day", "Protein — Target", 3);

  await seedEquation(SEED_IDS.hl_kcal_low, SEED_IDS.hl_standard, "energy", "msjReeKcal * palValue * 0.925", "kcal/day", "Energy — Lower Bound", 1);
  await seedEquation(SEED_IDS.hl_kcal_high, SEED_IDS.hl_standard, "energy", "msjReeKcal * palValue * 1.075", "kcal/day", "Energy — Upper Bound", 2);
  await seedEquation(SEED_IDS.hl_prot_low, SEED_IDS.hl_standard, "protein", "weightKg * 0.8", "g/day", "Protein — Lower Bound", 3);
  await seedEquation(SEED_IDS.hl_prot_high, SEED_IDS.hl_standard, "protein", "weightKg * 1.2", "g/day", "Protein — Upper Bound", 4);

  await seedEquation(SEED_IDS.crit_ill_peds_kcal_low, SEED_IDS.crit_ill_peds_std, "energy", "schofieldReeKcal * 0.95", "kcal/day", "Energy — Lower Bound", 1);
  await seedEquation(SEED_IDS.crit_ill_peds_kcal_high, SEED_IDS.crit_ill_peds_std, "energy", "schofieldReeKcal * 1.05", "kcal/day", "Energy — Upper Bound", 2);
  await seedEquation(SEED_IDS.crit_ill_peds_prot_low, SEED_IDS.crit_ill_peds_std, "protein", "weightKg * 1.5", "g/day", "Protein — Lower Bound", 3);
  await seedEquation(SEED_IDS.crit_ill_peds_prot_high, SEED_IDS.crit_ill_peds_std, "protein", "weightKg * 2.0", "g/day", "Protein — Upper Bound", 4);

  // No Dialysis
  await seedEquation(SEED_IDS.aki_peds_nodial_kcal_low, SEED_IDS.aki_peds_nodial, "energy", "schofieldReeKcal * 1.3 * 0.95", "kcal/day", "Energy — Lower Bound", 1);
  await seedEquation(SEED_IDS.aki_peds_nodial_kcal_high, SEED_IDS.aki_peds_nodial, "energy", "schofieldReeKcal * 1.3 * 1.05", "kcal/day", "Energy — Upper Bound", 2);
  await seedEquation(SEED_IDS.aki_peds_nodial_prot_low, SEED_IDS.aki_peds_nodial, "protein", "weightKg * 0.8", "g/day", "Protein — Lower Bound", 3);
  await seedEquation(SEED_IDS.aki_peds_nodial_prot_high, SEED_IDS.aki_peds_nodial, "protein", "weightKg * 1.2", "g/day", "Protein — Upper Bound", 4);

  // Dialysis / CRRT
  await seedEquation(SEED_IDS.aki_peds_dial_kcal_low, SEED_IDS.aki_peds_dial, "energy", "schofieldReeKcal * 1.3 * 0.95", "kcal/day", "Energy — Lower Bound", 1);
  await seedEquation(SEED_IDS.aki_peds_dial_kcal_high, SEED_IDS.aki_peds_dial, "energy", "schofieldReeKcal * 1.3 * 1.05", "kcal/day", "Energy — Upper Bound", 2);
  await seedEquation(SEED_IDS.aki_peds_dial_prot_low, SEED_IDS.aki_peds_dial, "protein", "weightKg * 1.0", "g/day", "Protein — Lower Bound", 3);
  await seedEquation(SEED_IDS.aki_peds_dial_prot_high, SEED_IDS.aki_peds_dial, "protein", "weightKg * 2.5", "g/day", "Protein — Upper Bound", 4);

  await seedEquation(SEED_IDS.pancreatitis_peds_kcal_low, SEED_IDS.pancreatitis_peds_std, "energy", "schofieldReeKcal * 1.1", "kcal/day", "Energy — Lower Bound", 1);
  await seedEquation(SEED_IDS.pancreatitis_peds_kcal_high, SEED_IDS.pancreatitis_peds_std, "energy", "schofieldReeKcal * 1.2", "kcal/day", "Energy — Upper Bound", 2);
  await seedEquation(SEED_IDS.pancreatitis_peds_prot_low, SEED_IDS.pancreatitis_peds_std, "protein", "weightKg * 1.2", "g/day", "Protein — Lower Bound", 3);
  await seedEquation(SEED_IDS.pancreatitis_peds_prot_high, SEED_IDS.pancreatitis_peds_std, "protein", "weightKg * 1.5", "g/day", "Protein — Upper Bound", 4);

  // Child 1-11y Galveston
  await seedEquation(SEED_IDS.burns_peds_child_kcal_low, SEED_IDS.burns_peds_child, "energy", "(1800 * bodySurfaceAreaM2 + 1300 * (bodySurfaceAreaM2 * tbsaBurnedPct / 100)) * 0.9", "kcal/day", "Energy — Lower Bound", 1);
  await seedEquation(SEED_IDS.burns_peds_child_kcal_high, SEED_IDS.burns_peds_child, "energy", "(1800 * bodySurfaceAreaM2 + 1300 * (bodySurfaceAreaM2 * tbsaBurnedPct / 100)) * 1.1", "kcal/day", "Energy — Upper Bound", 2);
  await seedEquation(SEED_IDS.burns_peds_child_prot_low, SEED_IDS.burns_peds_child, "protein", "weightKg * 1.5", "g/day", "Protein — Lower Bound", 3);
  await seedEquation(SEED_IDS.burns_peds_child_prot_high, SEED_IDS.burns_peds_child, "protein", "weightKg * 2.5", "g/day", "Protein — Upper Bound", 4);

  // Adolescent 12-16y Galveston
  await seedEquation(SEED_IDS.burns_peds_adol_kcal_low, SEED_IDS.burns_peds_adol, "energy", "(1500 * bodySurfaceAreaM2 + 1500 * (bodySurfaceAreaM2 * tbsaBurnedPct / 100)) * 0.9", "kcal/day", "Energy — Lower Bound", 1);
  await seedEquation(SEED_IDS.burns_peds_adol_kcal_high, SEED_IDS.burns_peds_adol, "energy", "(1500 * bodySurfaceAreaM2 + 1500 * (bodySurfaceAreaM2 * tbsaBurnedPct / 100)) * 1.1", "kcal/day", "Energy — Upper Bound", 2);
  await seedEquation(SEED_IDS.burns_peds_adol_prot_low, SEED_IDS.burns_peds_adol, "protein", "weightKg * 1.5", "g/day", "Protein — Lower Bound", 3);
  await seedEquation(SEED_IDS.burns_peds_adol_prot_high, SEED_IDS.burns_peds_adol, "protein", "weightKg * 2.5", "g/day", "Protein — Upper Bound", 4);

  // Standard
  await seedEquation(SEED_IDS.onc_peds_std_kcal_low, SEED_IDS.onc_peds_std, "energy", "schofieldReeKcal * 1.2", "kcal/day", "Energy — Lower Bound", 1);
  await seedEquation(SEED_IDS.onc_peds_std_kcal_high, SEED_IDS.onc_peds_std, "energy", "schofieldReeKcal * 1.4", "kcal/day", "Energy — Upper Bound", 2);
  await seedEquation(SEED_IDS.onc_peds_std_prot_low, SEED_IDS.onc_peds_std, "protein", "weightKg * 1.0", "g/day", "Protein — Lower Bound", 3);
  await seedEquation(SEED_IDS.onc_peds_std_prot_high, SEED_IDS.onc_peds_std, "protein", "weightKg * 1.5", "g/day", "Protein — Upper Bound", 4);

  // Undernourished
  await seedEquation(SEED_IDS.onc_peds_und_kcal_low, SEED_IDS.onc_peds_undernourished, "energy", "schofieldReeKcal * 1.3", "kcal/day", "Energy — Lower Bound", 1);
  await seedEquation(SEED_IDS.onc_peds_und_kcal_high, SEED_IDS.onc_peds_undernourished, "energy", "schofieldReeKcal * 1.5", "kcal/day", "Energy — Upper Bound", 2);
  await seedEquation(SEED_IDS.onc_peds_und_prot_low, SEED_IDS.onc_peds_undernourished, "protein", "weightKg * 1.5", "g/day", "Protein — Lower Bound", 3);
  await seedEquation(SEED_IDS.onc_peds_und_prot_high, SEED_IDS.onc_peds_undernourished, "protein", "weightKg * 2.5", "g/day", "Protein — Upper Bound", 4);

  await seedEquation(SEED_IDS.ckd_peds_3_5_kcal_low, SEED_IDS.ckd_peds_3_5_std, "energy", "schofieldReeKcal * 0.95", "kcal/day", "Energy — Lower Bound", 1);
  await seedEquation(SEED_IDS.ckd_peds_3_5_kcal_high, SEED_IDS.ckd_peds_3_5_std, "energy", "schofieldReeKcal * 1.05", "kcal/day", "Energy — Upper Bound", 2);
  await seedEquation(SEED_IDS.ckd_peds_3_5_prot_low, SEED_IDS.ckd_peds_3_5_std, "protein", "weightKg * 0.82", "g/day", "Protein — Lower Bound", 3);
  await seedEquation(SEED_IDS.ckd_peds_3_5_prot_high, SEED_IDS.ckd_peds_3_5_std, "protein", "weightKg * 0.91", "g/day", "Protein — Upper Bound", 4);

  // Hemodialysis
  await seedEquation(SEED_IDS.ckd_peds_hd_kcal_low, SEED_IDS.ckd_peds_hd, "energy", "schofieldReeKcal * 0.95", "kcal/day", "Energy — Lower Bound", 1);
  await seedEquation(SEED_IDS.ckd_peds_hd_kcal_high, SEED_IDS.ckd_peds_hd, "energy", "schofieldReeKcal * 1.05", "kcal/day", "Energy — Upper Bound", 2);
  await seedEquation(SEED_IDS.ckd_peds_hd_prot_low, SEED_IDS.ckd_peds_hd, "protein", "weightKg * 0.91", "g/day", "Protein — Lower Bound", 3);
  await seedEquation(SEED_IDS.ckd_peds_hd_prot_high, SEED_IDS.ckd_peds_hd, "protein", "weightKg * 1.11", "g/day", "Protein — Upper Bound", 4);

  // Peritoneal Dialysis
  await seedEquation(SEED_IDS.ckd_peds_pd_kcal_low, SEED_IDS.ckd_peds_pd, "energy", "schofieldReeKcal * 0.95", "kcal/day", "Energy — Lower Bound", 1);
  await seedEquation(SEED_IDS.ckd_peds_pd_kcal_high, SEED_IDS.ckd_peds_pd, "energy", "schofieldReeKcal * 1.05", "kcal/day", "Energy — Upper Bound", 2);
  await seedEquation(SEED_IDS.ckd_peds_pd_prot_low, SEED_IDS.ckd_peds_pd, "protein", "weightKg * 0.91", "g/day", "Protein — Lower Bound", 3);
  await seedEquation(SEED_IDS.ckd_peds_pd_prot_high, SEED_IDS.ckd_peds_pd, "protein", "weightKg * 1.11", "g/day", "Protein — Upper Bound", 4);

  // Acute
  await seedEquation(SEED_IDS.kidney_transplant_peds_acute_kcal_low, SEED_IDS.kidney_transplant_peds_acute, "energy", "schofieldReeKcal * 1.3", "kcal/day", "Energy — Lower Bound", 1);
  await seedEquation(SEED_IDS.kidney_transplant_peds_acute_kcal_high, SEED_IDS.kidney_transplant_peds_acute, "energy", "schofieldReeKcal * 1.5", "kcal/day", "Energy — Upper Bound", 2);
  await seedEquation(SEED_IDS.kidney_transplant_peds_acute_prot_low, SEED_IDS.kidney_transplant_peds_acute, "protein", "weightKg * 1.5", "g/day", "Protein — Lower Bound", 3);
  await seedEquation(SEED_IDS.kidney_transplant_peds_acute_prot_high, SEED_IDS.kidney_transplant_peds_acute, "protein", "weightKg * 2.0", "g/day", "Protein — Upper Bound", 4);

  // Chronic
  await seedEquation(SEED_IDS.kidney_transplant_peds_chron_kcal_low, SEED_IDS.kidney_transplant_peds_chron, "energy", "schofieldReeKcal * 1.0", "kcal/day", "Energy — Lower Bound", 1);
  await seedEquation(SEED_IDS.kidney_transplant_peds_chron_kcal_high, SEED_IDS.kidney_transplant_peds_chron, "energy", "schofieldReeKcal * 1.2", "kcal/day", "Energy — Upper Bound", 2);
  await seedEquation(SEED_IDS.kidney_transplant_peds_chron_prot_low, SEED_IDS.kidney_transplant_peds_chron, "protein", "weightKg * 0.82", "g/day", "Protein — Lower Bound", 3);
  await seedEquation(SEED_IDS.kidney_transplant_peds_chron_prot_high, SEED_IDS.kidney_transplant_peds_chron, "protein", "weightKg * 0.91", "g/day", "Protein — Upper Bound", 4);

  await seedEquation(SEED_IDS.cirrhosis_peds_kcal_low, SEED_IDS.cirrhosis_peds_std, "energy", "schofieldReeKcal * 1.3", "kcal/day", "Energy — Lower Bound", 1);
  await seedEquation(SEED_IDS.cirrhosis_peds_kcal_high, SEED_IDS.cirrhosis_peds_std, "energy", "schofieldReeKcal * 1.5", "kcal/day", "Energy — Upper Bound", 2);
  await seedEquation(SEED_IDS.cirrhosis_peds_prot_low, SEED_IDS.cirrhosis_peds_std, "protein", "weightKg * 2.5", "g/day", "Protein — Lower Bound", 3);
  await seedEquation(SEED_IDS.cirrhosis_peds_prot_high, SEED_IDS.cirrhosis_peds_std, "protein", "weightKg * 3.0", "g/day", "Protein — Upper Bound", 4);

  // Acute
  await seedEquation(SEED_IDS.liver_transplant_peds_acute_kcal_low, SEED_IDS.liver_transplant_peds_acute, "energy", "schofieldReeKcal * 1.4", "kcal/day", "Energy — Lower Bound", 1);
  await seedEquation(SEED_IDS.liver_transplant_peds_acute_kcal_high, SEED_IDS.liver_transplant_peds_acute, "energy", "schofieldReeKcal * 1.5", "kcal/day", "Energy — Upper Bound", 2);
  await seedEquation(SEED_IDS.liver_transplant_peds_acute_prot_low, SEED_IDS.liver_transplant_peds_acute, "protein", "weightKg * 2.0", "g/day", "Protein — Lower Bound", 3);
  await seedEquation(SEED_IDS.liver_transplant_peds_acute_prot_high, SEED_IDS.liver_transplant_peds_acute, "protein", "weightKg * 2.5", "g/day", "Protein — Upper Bound", 4);

  // Chronic
  await seedEquation(SEED_IDS.liver_transplant_peds_chron_kcal_low, SEED_IDS.liver_transplant_peds_chron, "energy", "schofieldReeKcal * 1.2", "kcal/day", "Energy — Lower Bound", 1);
  await seedEquation(SEED_IDS.liver_transplant_peds_chron_kcal_high, SEED_IDS.liver_transplant_peds_chron, "energy", "schofieldReeKcal * 1.3", "kcal/day", "Energy — Upper Bound", 2);
  await seedEquation(SEED_IDS.liver_transplant_peds_chron_prot_low, SEED_IDS.liver_transplant_peds_chron, "protein", "weightKg * 1.5", "g/day", "Protein — Lower Bound", 3);
  await seedEquation(SEED_IDS.liver_transplant_peds_chron_prot_high, SEED_IDS.liver_transplant_peds_chron, "protein", "weightKg * 2.0", "g/day", "Protein — Upper Bound", 4);

  // Standard
  await seedEquation(SEED_IDS.trauma_peds_std_kcal_low, SEED_IDS.trauma_peds_std, "energy", "schofieldReeKcal * 1.3", "kcal/day", "Energy — Lower Bound", 1);
  await seedEquation(SEED_IDS.trauma_peds_std_kcal_high, SEED_IDS.trauma_peds_std, "energy", "schofieldReeKcal * 1.5", "kcal/day", "Energy — Upper Bound", 2);
  await seedEquation(SEED_IDS.trauma_peds_std_prot_low, SEED_IDS.trauma_peds_std, "protein", "weightKg * 1.5", "g/day", "Protein — Lower Bound", 3);
  await seedEquation(SEED_IDS.trauma_peds_std_prot_high, SEED_IDS.trauma_peds_std, "protein", "weightKg * 2.5", "g/day", "Protein — Upper Bound", 4);

  // Open Abdomen
  await seedEquation(SEED_IDS.trauma_peds_open_kcal_low, SEED_IDS.trauma_peds_open, "energy", "schofieldReeKcal * 1.3 + exudateVolumeL * 116", "kcal/day", "Energy — Lower Bound", 1);
  await seedEquation(SEED_IDS.trauma_peds_open_kcal_high, SEED_IDS.trauma_peds_open, "energy", "schofieldReeKcal * 1.5 + exudateVolumeL * 116", "kcal/day", "Energy — Upper Bound", 2);
  await seedEquation(SEED_IDS.trauma_peds_open_prot_low, SEED_IDS.trauma_peds_open, "protein", "weightKg * 1.5 + exudateVolumeL * 29", "g/day", "Protein — Lower Bound", 3);
  await seedEquation(SEED_IDS.trauma_peds_open_prot_high, SEED_IDS.trauma_peds_open, "protein", "weightKg * 2.5 + exudateVolumeL * 29", "g/day", "Protein — Upper Bound", 4);

  await seedEquation(SEED_IDS.masld_mash_peds_kcal_low, SEED_IDS.masld_mash_peds_std, "energy", "schofieldReeKcal * 0.95", "kcal/day", "Energy — Lower Bound", 1);
  await seedEquation(SEED_IDS.masld_mash_peds_kcal_high, SEED_IDS.masld_mash_peds_std, "energy", "schofieldReeKcal * 1.05", "kcal/day", "Energy — Upper Bound", 2);
  await seedEquation(SEED_IDS.masld_mash_peds_prot_low, SEED_IDS.masld_mash_peds_std, "protein", "weightKg * 1.2", "g/day", "Protein — Lower Bound", 3);
  await seedEquation(SEED_IDS.masld_mash_peds_prot_high, SEED_IDS.masld_mash_peds_std, "protein", "weightKg * 1.5", "g/day", "Protein — Upper Bound", 4);

  await seedEquation(SEED_IDS.copd_peds_kcal_low, SEED_IDS.copd_peds_std, "energy", "schofieldReeKcal * 1.3 * 0.9", "kcal/day", "Energy — Lower Bound", 1);
  await seedEquation(SEED_IDS.copd_peds_kcal_high, SEED_IDS.copd_peds_std, "energy", "schofieldReeKcal * 1.3 * 1.1", "kcal/day", "Energy — Upper Bound", 2);
  await seedEquation(SEED_IDS.copd_peds_prot_low, SEED_IDS.copd_peds_std, "protein", "weightKg * 0.8", "g/day", "Protein — Lower Bound", 3);
  await seedEquation(SEED_IDS.copd_peds_prot_high, SEED_IDS.copd_peds_std, "protein", "weightKg * 1.5", "g/day", "Protein — Upper Bound", 4);

  await seedEquation(SEED_IDS.heart_failure_peds_kcal_low, SEED_IDS.heart_failure_peds_std, "energy", "schofieldReeKcal * 1.2", "kcal/day", "Energy — Lower Bound", 1);
  await seedEquation(SEED_IDS.heart_failure_peds_kcal_high, SEED_IDS.heart_failure_peds_std, "energy", "schofieldReeKcal * 1.4", "kcal/day", "Energy — Upper Bound", 2);
  await seedEquation(SEED_IDS.heart_failure_peds_prot_low, SEED_IDS.heart_failure_peds_std, "protein", "weightKg * 1.5", "g/day", "Protein — Lower Bound", 3);
  await seedEquation(SEED_IDS.heart_failure_peds_prot_high, SEED_IDS.heart_failure_peds_std, "protein", "weightKg * 2.0", "g/day", "Protein — Upper Bound", 4);

  await seedEquation(SEED_IDS.stroke_peds_kcal_low, SEED_IDS.stroke_peds_std, "energy", "schofieldReeKcal * 1.2 * 0.95", "kcal/day", "Energy — Lower Bound", 1);
  await seedEquation(SEED_IDS.stroke_peds_kcal_high, SEED_IDS.stroke_peds_std, "energy", "schofieldReeKcal * 1.2 * 1.05", "kcal/day", "Energy — Upper Bound", 2);
  await seedEquation(SEED_IDS.stroke_peds_prot_low, SEED_IDS.stroke_peds_std, "protein", "weightKg * 1.0", "g/day", "Protein — Lower Bound", 3);
  await seedEquation(SEED_IDS.stroke_peds_prot_high, SEED_IDS.stroke_peds_std, "protein", "weightKg * 1.5", "g/day", "Protein — Upper Bound", 4);

  // Stage 1-2
  await seedEquation(SEED_IDS.pi_peds_stage1_2_kcal_low, SEED_IDS.pi_peds_stage1_2, "energy", "schofieldReeKcal * 1.2", "kcal/day", "Energy — Lower Bound", 1);
  await seedEquation(SEED_IDS.pi_peds_stage1_2_kcal_high, SEED_IDS.pi_peds_stage1_2, "energy", "schofieldReeKcal * 1.4", "kcal/day", "Energy — Upper Bound", 2);
  await seedEquation(SEED_IDS.pi_peds_stage1_2_prot_low, SEED_IDS.pi_peds_stage1_2, "protein", "weightKg * 1.25", "g/day", "Protein — Lower Bound", 3);
  await seedEquation(SEED_IDS.pi_peds_stage1_2_prot_high, SEED_IDS.pi_peds_stage1_2, "protein", "weightKg * 2.0", "g/day", "Protein — Upper Bound", 4);

  // Stage 3-4
  await seedEquation(SEED_IDS.pi_peds_stage3_4_kcal_low, SEED_IDS.pi_peds_stage3_4, "energy", "schofieldReeKcal * 1.2", "kcal/day", "Energy — Lower Bound", 1);
  await seedEquation(SEED_IDS.pi_peds_stage3_4_kcal_high, SEED_IDS.pi_peds_stage3_4, "energy", "schofieldReeKcal * 1.4", "kcal/day", "Energy — Upper Bound", 2);
  await seedEquation(SEED_IDS.pi_peds_stage3_4_prot_low, SEED_IDS.pi_peds_stage3_4, "protein", "weightKg * 1.5", "g/day", "Protein — Lower Bound", 3);
  await seedEquation(SEED_IDS.pi_peds_stage3_4_prot_high, SEED_IDS.pi_peds_stage3_4, "protein", "weightKg * 2.5", "g/day", "Protein — Upper Bound", 4);

  // Stable
  await seedEquation(SEED_IDS.scd_peds_stable_kcal, SEED_IDS.scd_peds_stable, "energy", "ifTrue(isMale, (1305 + 18.6 * weightKg - 55.7 * hemoglobin) * palValue, (1100 + 13.3 * weightKg - 30.2 * hemoglobin) * palValue)", "kcal/day", "Energy — Target", 1);
  await seedEquation(SEED_IDS.scd_peds_stable_kcal, SEED_IDS.scd_peds_stable, "energy", "ifTrue(isMale, (1305 + 18.6 * weightKg - 55.7 * hemoglobin) * palValue, (1100 + 13.3 * weightKg - 30.2 * hemoglobin) * palValue)", "kcal/day", "Energy — Target", 2);
  await seedEquation(SEED_IDS.scd_peds_stable_prot_low, SEED_IDS.scd_peds_stable, "protein", "weightKg * 1.0", "g/day", "Protein — Lower Bound", 3);
  await seedEquation(SEED_IDS.scd_peds_stable_prot_high, SEED_IDS.scd_peds_stable, "protein", "weightKg * 1.3", "g/day", "Protein — Upper Bound", 4);

  // VOC
  await seedEquation(SEED_IDS.scd_peds_voc_kcal_low, SEED_IDS.scd_peds_voc, "energy", "schofieldReeKcal * 1.3", "kcal/day", "Energy — Lower Bound", 1);
  await seedEquation(SEED_IDS.scd_peds_voc_kcal_high, SEED_IDS.scd_peds_voc, "energy", "schofieldReeKcal * 1.5", "kcal/day", "Energy — Upper Bound", 2);
  await seedEquation(SEED_IDS.scd_peds_voc_prot_low, SEED_IDS.scd_peds_voc, "protein", "weightKg * 1.0", "g/day", "Protein — Lower Bound", 3);
  await seedEquation(SEED_IDS.scd_peds_voc_prot_high, SEED_IDS.scd_peds_voc, "protein", "weightKg * 1.3", "g/day", "Protein — Upper Bound", 4);

  // Infant
  await seedEquation(SEED_IDS.hsct_peds_infant_kcal_low, SEED_IDS.hsct_peds_infant, "energy", "schofieldReeKcal * 1.6", "kcal/day", "Energy — Lower Bound", 1);
  await seedEquation(SEED_IDS.hsct_peds_infant_kcal_high, SEED_IDS.hsct_peds_infant, "energy", "schofieldReeKcal * 1.8", "kcal/day", "Energy — Upper Bound", 2);
  await seedEquation(SEED_IDS.hsct_peds_infant_prot_low, SEED_IDS.hsct_peds_infant, "protein", "weightKg * 1.5", "g/day", "Protein — Lower Bound", 3);
  await seedEquation(SEED_IDS.hsct_peds_infant_prot_high, SEED_IDS.hsct_peds_infant, "protein", "weightKg * 2.5", "g/day", "Protein — Upper Bound", 4);

  // Child
  await seedEquation(SEED_IDS.hsct_peds_child_kcal_low, SEED_IDS.hsct_peds_child, "energy", "schofieldReeKcal * 1.4", "kcal/day", "Energy — Lower Bound", 1);
  await seedEquation(SEED_IDS.hsct_peds_child_kcal_high, SEED_IDS.hsct_peds_child, "energy", "schofieldReeKcal * 1.6", "kcal/day", "Energy — Upper Bound", 2);
  await seedEquation(SEED_IDS.hsct_peds_child_prot_low, SEED_IDS.hsct_peds_child, "protein", "weightKg * 1.5", "g/day", "Protein — Lower Bound", 3);
  await seedEquation(SEED_IDS.hsct_peds_child_prot_high, SEED_IDS.hsct_peds_child, "protein", "weightKg * 2.5", "g/day", "Protein — Upper Bound", 4);

  // Older Adolescent
  await seedEquation(SEED_IDS.hsct_peds_older_kcal_low, SEED_IDS.hsct_peds_older, "energy", "schofieldReeKcal * 1.4", "kcal/day", "Energy — Lower Bound", 1);
  await seedEquation(SEED_IDS.hsct_peds_older_kcal_high, SEED_IDS.hsct_peds_older, "energy", "schofieldReeKcal * 1.6", "kcal/day", "Energy — Upper Bound", 2);
  await seedEquation(SEED_IDS.hsct_peds_older_prot_low, SEED_IDS.hsct_peds_older, "protein", "weightKg * 1.5", "g/day", "Protein — Lower Bound", 3);
  await seedEquation(SEED_IDS.hsct_peds_older_prot_high, SEED_IDS.hsct_peds_older, "protein", "weightKg * 2.5", "g/day", "Protein — Upper Bound", 4);

  // PN-Dependent
  await seedEquation(SEED_IDS.sbs_peds_pndep_kcal_low, SEED_IDS.sbs_peds_pndep, "energy", "weightKg * 50", "kcal/day", "Energy — Lower Bound", 1);
  await seedEquation(SEED_IDS.sbs_peds_pndep_kcal_high, SEED_IDS.sbs_peds_pndep, "energy", "weightKg * 90", "kcal/day", "Energy — Upper Bound", 2);
  await seedEquation(SEED_IDS.sbs_peds_pndep_prot_low, SEED_IDS.sbs_peds_pndep, "protein", "weightKg * 2.0", "g/day", "Protein — Lower Bound", 3);
  await seedEquation(SEED_IDS.sbs_peds_pndep_prot_high, SEED_IDS.sbs_peds_pndep, "protein", "weightKg * 3.0", "g/day", "Protein — Upper Bound", 4);

  // Enteral Autonomous / Transitioning
  await seedEquation(SEED_IDS.sbs_peds_entaut_kcal_low, SEED_IDS.sbs_peds_entaut, "energy", "weightKg * 80", "kcal/day", "Energy — Lower Bound", 1);
  await seedEquation(SEED_IDS.sbs_peds_entaut_kcal_high, SEED_IDS.sbs_peds_entaut, "energy", "weightKg * 130", "kcal/day", "Energy — Upper Bound", 2);
  await seedEquation(SEED_IDS.sbs_peds_entaut_prot_low, SEED_IDS.sbs_peds_entaut, "protein", "weightKg * 2.0", "g/day", "Protein — Lower Bound", 3);
  await seedEquation(SEED_IDS.sbs_peds_entaut_prot_high, SEED_IDS.sbs_peds_entaut, "protein", "weightKg * 3.0", "g/day", "Protein — Upper Bound", 4);

  // Bedbound
  await seedEquation(SEED_IDS.cf_peds_bb_kcal_low, SEED_IDS.cf_peds_bedbound, "energy", "df = ifTrue(fev1Pct >= 80, 1.0, ifTrue(fev1Pct >= 40, 1.1, 1.5)); schofieldReeKcal * df * 1.3", "kcal/day", "Energy — Lower Bound", 1);
  await seedEquation(SEED_IDS.cf_peds_bb_kcal_high, SEED_IDS.cf_peds_bedbound, "energy", "df = ifTrue(fev1Pct >= 80, 1.1, ifTrue(fev1Pct >= 40, 1.4, 2.0)); schofieldReeKcal * df * 1.3", "kcal/day", "Energy — Upper Bound", 2);
  await seedEquation(SEED_IDS.cf_peds_bb_prot_low, SEED_IDS.cf_peds_bedbound, "protein", "weightKg * 0.96", "g/day", "Protein — Lower Bound", 3);
  await seedEquation(SEED_IDS.cf_peds_bb_prot_high, SEED_IDS.cf_peds_bedbound, "protein", "weightKg * 1.6", "g/day", "Protein — Upper Bound", 4);

  // Sedentary
  await seedEquation(SEED_IDS.cf_peds_sed_kcal_low, SEED_IDS.cf_peds_sedentary, "energy", "df = ifTrue(fev1Pct >= 80, 1.0, ifTrue(fev1Pct >= 40, 1.1, 1.5)); schofieldReeKcal * df * 1.5", "kcal/day", "Energy — Lower Bound", 1);
  await seedEquation(SEED_IDS.cf_peds_sed_kcal_high, SEED_IDS.cf_peds_sedentary, "energy", "df = ifTrue(fev1Pct >= 80, 1.1, ifTrue(fev1Pct >= 40, 1.4, 2.0)); schofieldReeKcal * df * 1.5", "kcal/day", "Energy — Upper Bound", 2);
  await seedEquation(SEED_IDS.cf_peds_sed_prot_low, SEED_IDS.cf_peds_sedentary, "protein", "weightKg * 0.96", "g/day", "Protein — Lower Bound", 3);
  await seedEquation(SEED_IDS.cf_peds_sed_prot_high, SEED_IDS.cf_peds_sedentary, "protein", "weightKg * 1.6", "g/day", "Protein — Upper Bound", 4);

  // Active
  await seedEquation(SEED_IDS.cf_peds_act_kcal_low, SEED_IDS.cf_peds_active, "energy", "df = ifTrue(fev1Pct >= 80, 1.0, ifTrue(fev1Pct >= 40, 1.1, 1.5)); schofieldReeKcal * df * 1.7", "kcal/day", "Energy — Lower Bound", 1);
  await seedEquation(SEED_IDS.cf_peds_act_kcal_high, SEED_IDS.cf_peds_active, "energy", "df = ifTrue(fev1Pct >= 80, 1.1, ifTrue(fev1Pct >= 40, 1.4, 2.0)); schofieldReeKcal * df * 1.7", "kcal/day", "Energy — Upper Bound", 2);
  await seedEquation(SEED_IDS.cf_peds_act_prot_low, SEED_IDS.cf_peds_active, "protein", "weightKg * 0.96", "g/day", "Protein — Lower Bound", 3);
  await seedEquation(SEED_IDS.cf_peds_act_prot_high, SEED_IDS.cf_peds_active, "protein", "weightKg * 1.6", "g/day", "Protein — Upper Bound", 4);

  // Normal Weight
  await seedEquation(SEED_IDS.hl_peds_norm_kcal_low, SEED_IDS.hl_peds_normal, "energy", "schofieldReeKcal * 0.925", "kcal/day", "Energy — Lower Bound", 1);
  await seedEquation(SEED_IDS.hl_peds_norm_kcal_high, SEED_IDS.hl_peds_normal, "energy", "schofieldReeKcal * 1.075", "kcal/day", "Energy — Upper Bound", 2);
  await seedEquation(SEED_IDS.hl_peds_norm_prot_low, SEED_IDS.hl_peds_normal, "protein", "weightKg * 0.85", "g/day", "Protein — Lower Bound", 3);
  await seedEquation(SEED_IDS.hl_peds_norm_prot_high, SEED_IDS.hl_peds_normal, "protein", "weightKg * 1.52", "g/day", "Protein — Upper Bound", 4);

  await seedEquation(SEED_IDS.mal_peds_kcal_low, SEED_IDS.mal_peds_catchup, "energy", "weightKg * 25", "kcal/day", "Energy — Lower Bound", 1);
  await seedEquation(SEED_IDS.mal_peds_kcal_high, SEED_IDS.mal_peds_catchup, "energy", "weightKg * 35", "kcal/day", "Energy — Upper Bound", 2);
  await seedEquation(SEED_IDS.mal_peds_prot_low, SEED_IDS.mal_peds_catchup, "protein", "weightKg * 1.2", "g/day", "Protein — Lower Bound", 3);
  await seedEquation(SEED_IDS.mal_peds_prot_high, SEED_IDS.mal_peds_catchup, "protein", "weightKg * 2.0", "g/day", "Protein — Upper Bound", 4);

  await seedEquation(SEED_IDS.bpd_peds_kcal_low, SEED_IDS.bpd_peds_std, "energy", "weightKg * 120", "kcal/day", "Energy — Lower Bound", 1);
  await seedEquation(SEED_IDS.bpd_peds_kcal_high, SEED_IDS.bpd_peds_std, "energy", "weightKg * 150", "kcal/day", "Energy — Upper Bound", 2);
  await seedEquation(SEED_IDS.bpd_peds_prot_low, SEED_IDS.bpd_peds_std, "protein", "weightKg * 3.5", "g/day", "Protein — Lower Bound", 3);
  await seedEquation(SEED_IDS.bpd_peds_prot_high, SEED_IDS.bpd_peds_std, "protein", "weightKg * 4.5", "g/day", "Protein — Upper Bound", 4);

  // Trimester 1
  await seedEquation(SEED_IDS.preg_peds_t1_kcal_low, SEED_IDS.preg_peds_t1, "energy", "schofieldReeKcal", "kcal/day", "Energy — Lower Bound", 1);
  await seedEquation(SEED_IDS.preg_peds_t1_kcal_high, SEED_IDS.preg_peds_t1, "energy", "schofieldReeKcal + 50", "kcal/day", "Energy — Upper Bound", 2);
  await seedEquation(SEED_IDS.preg_peds_t1_prot, SEED_IDS.preg_peds_t1, "protein", "71", "g/day", "Protein — Target", 3);

  // Trimester 2
  await seedEquation(SEED_IDS.preg_peds_t2_kcal_low, SEED_IDS.preg_peds_t2, "energy", "schofieldReeKcal + 340", "kcal/day", "Energy — Lower Bound", 1);
  await seedEquation(SEED_IDS.preg_peds_t2_kcal_high, SEED_IDS.preg_peds_t2, "energy", "schofieldReeKcal + 390", "kcal/day", "Energy — Upper Bound", 2);
  await seedEquation(SEED_IDS.preg_peds_t2_prot, SEED_IDS.preg_peds_t2, "protein", "71", "g/day", "Protein — Target", 3);

  // Trimester 3
  await seedEquation(SEED_IDS.preg_peds_t3_kcal_low, SEED_IDS.preg_peds_t3, "energy", "schofieldReeKcal + 452", "kcal/day", "Energy — Lower Bound", 1);
  await seedEquation(SEED_IDS.preg_peds_t3_kcal_high, SEED_IDS.preg_peds_t3, "energy", "schofieldReeKcal + 502", "kcal/day", "Energy — Upper Bound", 2);
  await seedEquation(SEED_IDS.preg_peds_t3_prot, SEED_IDS.preg_peds_t3, "protein", "71", "g/day", "Protein — Target", 3);

  // 0-6 Months
  await seedEquation(SEED_IDS.bf_peds_early_kcal_low, SEED_IDS.bf_peds_early, "energy", "schofieldReeKcal + 380", "kcal/day", "Energy — Lower Bound", 1);
  await seedEquation(SEED_IDS.bf_peds_early_kcal_high, SEED_IDS.bf_peds_early, "energy", "schofieldReeKcal + 420", "kcal/day", "Energy — Upper Bound", 2);
  await seedEquation(SEED_IDS.bf_peds_early_prot_low, SEED_IDS.bf_peds_early, "protein", "weightKg * 0.91 + 25", "g/day", "Protein — Lower Bound", 3);
  await seedEquation(SEED_IDS.bf_peds_early_prot_high, SEED_IDS.bf_peds_early, "protein", "weightKg * 0.91 + 25", "g/day", "Protein — Upper Bound", 4);

  // 7-12 Months
  await seedEquation(SEED_IDS.bf_peds_late_kcal_low, SEED_IDS.bf_peds_late, "energy", "schofieldReeKcal + 310", "kcal/day", "Energy — Lower Bound", 1);
  await seedEquation(SEED_IDS.bf_peds_late_kcal_high, SEED_IDS.bf_peds_late, "energy", "schofieldReeKcal + 350", "kcal/day", "Energy — Upper Bound", 2);
  await seedEquation(SEED_IDS.bf_peds_late_prot_low, SEED_IDS.bf_peds_late, "protein", "weightKg * 0.91 + 25", "g/day", "Protein — Lower Bound", 3);
  await seedEquation(SEED_IDS.bf_peds_late_prot_high, SEED_IDS.bf_peds_late, "protein", "weightKg * 0.91 + 25", "g/day", "Protein — Upper Bound", 4);

  // ─── 3. Clinical guidance notes ──────────────────────────────────────────
  await seedNote(SEED_IDS.copd_std_note1, null, SEED_IDS.copd_standard, "Monitor respiratory quotient (RQ): avoid overfeeding-induced hypercapnic respiratory failure (RQ target ≤1.0).", 1);
  await seedNote(SEED_IDS.copd_std_note2, null, SEED_IDS.copd_standard, "COPD with obesity (BMI ≥30): adjust targets; consider impact on respiratory quotient.", 2);
  await seedNote(SEED_IDS.heart_failure_std_note1, null, SEED_IDS.heart_failure_standard, "Cardiac cachexia increases REE, but total energy needs may be lower due to decreased physical activity.", 1);
  await seedNote(SEED_IDS.heart_failure_std_note2, null, SEED_IDS.heart_failure_standard, "Strictly individualized — often fluid restricted. Individualize sodium and fluid restrictions based on volume status and ejection fraction.", 2);
  await seedNote(SEED_IDS.cirrhosis_comp_note1, null, SEED_IDS.cirrhosis_compensated, "Cirrhosis: 35–40 kcal/kg dry weight.", 1);
  await seedNote(SEED_IDS.cirrhosis_comp_note2, null, SEED_IDS.cirrhosis_compensated, "Do NOT restrict protein in cirrhosis — adequate intake prevents sarcopenia.", 2);
  await seedNote(SEED_IDS.cirrhosis_comp_note3, null, SEED_IDS.cirrhosis_compensated, "Provide a late-evening carbohydrate snack (200–400 kcal) to minimize overnight fasting catabolism.", 3);
  await seedNote(SEED_IDS.cirrhosis_comp_note4, null, SEED_IDS.cirrhosis_compensated, "Use dry body weight or ideal weight-for-height; actual weight overestimates needs in ascites/fluid retention.", 4);
  await seedNote(SEED_IDS.cirrhosis_decomp_note1, null, SEED_IDS.cirrhosis_decompensated, "Cirrhosis: 35–40 kcal/kg dry weight.", 1);
  await seedNote(SEED_IDS.cirrhosis_decomp_note2, null, SEED_IDS.cirrhosis_decompensated, "Do NOT restrict protein in cirrhosis — adequate intake prevents sarcopenia.", 2);
  await seedNote(SEED_IDS.cirrhosis_decomp_note3, null, SEED_IDS.cirrhosis_decompensated, "Provide a late-evening carbohydrate snack (200–400 kcal) to minimize overnight fasting catabolism.", 3);
  await seedNote(SEED_IDS.cirrhosis_decomp_note4, null, SEED_IDS.cirrhosis_decompensated, "Use dry body weight or ideal weight-for-height; actual weight overestimates needs in ascites/fluid retention.", 4);
  await seedNote(SEED_IDS.cirrhosis_decomp_note5, null, SEED_IDS.cirrhosis_decompensated, "Decompensated: restrict fluid 25–30 mL/kg dry weight. Strict sodium restriction (<2g/day). Monitor for dilutional hyponatremia.", 5);
  await seedNote(SEED_IDS.liver_transplant_acute_note1, null, SEED_IDS.liver_transplant_acute, "Acute post-op: MSJ × 1.3. Taper to normal maintenance within 6–12 months.", 1);
  await seedNote(SEED_IDS.ckd_vlpd_note1, null, SEED_IDS.ckd_vlpd, "VLPD + keto-analog supplementation: 0.28–0.43 g/kg/day protein.", 1);
  await seedNote(SEED_IDS.ckd_lpd_note1, null, SEED_IDS.ckd_lpd, "Pre-dialysis protein restriction: 0.55–0.60 g/kg/day to balance uremic control with protein-energy wasting risk.", 1);
  await seedNote(SEED_IDS.ckd_lpddm_note1, null, SEED_IDS.ckd_lpd_dm, "Low-protein diet + diabetes: 0.60–0.80 g/kg/day.", 1);
  await seedNote(SEED_IDS.ckd_hd_note1, null, SEED_IDS.ckd_hd, "Hemodialysis: 1.2 g/kg/day protein to offset dialytic losses.", 1);
  await seedNote(SEED_IDS.ckd_pd_note1, null, SEED_IDS.ckd_pd, "Peritoneal dialysis: 1.2–1.3 g/kg/day protein to offset peritoneal amino acid losses.", 1);
  await seedNote(SEED_IDS.kidney_transplant_acute_note1, null, SEED_IDS.kidney_transplant_acute, "Acute post-op: MSJ × 1.2–1.3. Taper rapidly to maintenance EER to prevent obesity in allograft recipients.", 1);
  await seedNote(SEED_IDS.masld_mash_std_note1, null, SEED_IDS.masld_mash_standard, "Target 5–10% total body weight loss to improve hepatic outcomes (EASL-EASD-EASO, 2024).", 1);
  await seedNote(SEED_IDS.masld_mash_std_note2, null, SEED_IDS.masld_mash_standard, "Maintain protein ≥1.5 g/kg/day to preserve lean body mass during caloric restriction.", 2);
  await seedNote(SEED_IDS.masld_mash_mal_note1, null, SEED_IDS.masld_mash_malnourished, "Underweight/malnourished/sarcopenic MASLD: 30–35 kcal/kg. Do NOT apply caloric deficit.", 1);
  await seedNote(SEED_IDS.masld_mash_mal_note2, null, SEED_IDS.masld_mash_malnourished, "Maintain protein ≥1.5 g/kg/day to preserve lean body mass during caloric restriction.", 2);
  await seedNote(SEED_IDS.crit_ill_lt30_note1, null, SEED_IDS.crit_ill_bmi_lt30, "IC is the clinical gold standard. Full feeds typically initiated after day 2–3.", 1);
  await seedNote(SEED_IDS.crit_ill_lt30_note2, null, SEED_IDS.crit_ill_bmi_lt30, "BMI < 30: 12–25 kcal/kg early (hypocaloric). Advance to 25–30 after day 7–10.", 2);
  await seedNote(SEED_IDS.crit_ill_30_50_note1, null, SEED_IDS.crit_ill_bmi_30_50, "IC is the clinical gold standard. Full feeds typically initiated after day 2–3.", 1);
  await seedNote(SEED_IDS.crit_ill_30_50_note2, null, SEED_IDS.crit_ill_bmi_30_50, "Obese CI BMI 30–50: PSU 2003b not validated. Use permissive underfeeding 11–14 kcal/kg actual wt.", 2);
  await seedNote(SEED_IDS.crit_ill_30_50_note3, null, SEED_IDS.crit_ill_bmi_30_50, "Protein: 2.0 g/kg IBW for BMI 30–39.9", 3);
  await seedNote(SEED_IDS.crit_ill_gt50_note1, null, SEED_IDS.crit_ill_bmi_gt50, "IC is the clinical gold standard. Full feeds typically initiated after day 2–3.", 1);
  await seedNote(SEED_IDS.crit_ill_gt50_note2, null, SEED_IDS.crit_ill_bmi_gt50, "Severely obese CI (BMI >50): 22–25 kcal/kg IBW.", 2);
  await seedNote(SEED_IDS.crit_ill_gt50_note3, null, SEED_IDS.crit_ill_bmi_gt50, "Protein: 2.5 g/kg IBW for BMI ≥40", 3);
  await seedNote(SEED_IDS.aki_no_dial_note1, null, SEED_IDS.aki_no_dialysis, "⚠ Do NOT restrict protein in AKI — restriction worsens outcomes.", 1);
  await seedNote(SEED_IDS.aki_no_dial_note2, null, SEED_IDS.aki_no_dialysis, "24h urine output + 500 mL insensible losses. Add +10% per 1°C fever above 37°C.", 2);
  await seedNote(SEED_IDS.aki_hd_note1, null, SEED_IDS.aki_hemodialysis, "⚠ Do NOT restrict protein in AKI — restriction worsens outcomes.", 1);
  await seedNote(SEED_IDS.aki_hd_note2, null, SEED_IDS.aki_hemodialysis, "24h urine output + 500 mL insensible losses. Add +10% per 1°C fever above 37°C.", 2);
  await seedNote(SEED_IDS.aki_crrt_note1, null, SEED_IDS.aki_crrt, "⚠ Do NOT restrict protein in AKI — restriction worsens outcomes.", 1);
  await seedNote(SEED_IDS.aki_crrt_note2, null, SEED_IDS.aki_crrt, "CRRT: increase protein to 1.7–2.5 g/kg/day to compensate for amino acid dialysate losses.", 2);
  await seedNote(SEED_IDS.aki_crrt_note3, null, SEED_IDS.aki_crrt, "Fluid unrestricted during CRRT — prevent dehydration during diuresis.", 3);
  await seedNote(SEED_IDS.pancreatitis_mild_note1, null, SEED_IDS.pancreatitis_mild_mod, "Mild–moderate pancreatitis: MSJ × 1.1–1.2. Reserve higher factors for severe/necrotizing cases.", 1);
  await seedNote(SEED_IDS.pancreatitis_mild_note2, null, SEED_IDS.pancreatitis_mild_mod, "Initiate EN within 72 hours of admission.", 2);
  await seedNote(SEED_IDS.pancreatitis_ic_note, null, SEED_IDS.pancreatitis_mild_mod, "Indirect calorimetry (IC) is preferred for pancreatitis if available — recalculate requirements regularly.", 3);
  await seedNote(SEED_IDS.pancreatitis_severe_note1, null, SEED_IDS.pancreatitis_severe_crit, "Severe/critical pancreatitis: MSJ × 1.2–1.5 stress factor.", 1);
  await seedNote(SEED_IDS.pancreatitis_severe_note2, null, SEED_IDS.pancreatitis_severe_crit, "Initiate EN within 72 hours of admission.", 2);
  await seedNote(SEED_IDS.pancreatitis_ic_note, null, SEED_IDS.pancreatitis_severe_crit, "Indirect calorimetry (IC) is preferred for pancreatitis if available — recalculate requirements regularly.", 3);
  await seedNote(SEED_IDS.trauma_std_note1, null, SEED_IDS.trauma_standard, "MSJ REE × 1.3–1.4 acute phase factor.", 1);
  await seedNote(SEED_IDS.trauma_std_note2, null, SEED_IDS.trauma_standard, "Severe/polytrauma: protein may exceed 2.0 g/kg — individualize. Use IC to track energy expenditure changes.", 2);
  await seedNote(SEED_IDS.trauma_open_note1, null, SEED_IDS.trauma_open_abdomen, "Open abdomen: exudate replacement added — exudateVolumeL × 29g protein = +exudateVolumeL*29g/day; +exudateVolumeL*116 kcal/day energy.", 1);
  await seedNote(SEED_IDS.trauma_open_note2, null, SEED_IDS.trauma_open_abdomen, "Source: Hourigan et al. (2010). Loss of protein, immunoglobulins, and electrolytes in exudates from NPWT. Nutr Clin Pract, 25(5), 510–516. doi:10.1177/0884533610379852", 2);
  await seedNote(SEED_IDS.trauma_open_note3, null, SEED_IDS.trauma_open_abdomen, "Severe/polytrauma: protein may exceed 2.0 g/kg — individualize. Use IC to track energy expenditure changes.", 3);
  await seedNote(SEED_IDS.burns_toronto_note1, null, SEED_IDS.burns_toronto, "Toronto equation preferred: limits glucose to ≤5 mg/kg/min, preventing hepatic steatosis and hypercapnia.", 1);
  await seedNote(SEED_IDS.burns_toronto_note2, null, SEED_IDS.burns_toronto, "Protein target scaled to TBSA: if TBSA > 40% -> 2.0 g/kg/day; else 1.5–2.0 g/kg/day. Limit glucose to ≤5 mg/kg/min.", 2);
  await seedNote(SEED_IDS.burns_toronto_note3, null, SEED_IDS.burns_toronto, "Parkland formula / physiological endpoints — strict I/O monitoring required.", 3);
  await seedNote(SEED_IDS.burns_ic_note, null, SEED_IDS.burns_toronto, "IC strongly recommended for burns — recalculate frequently.", 4);
  await seedNote(SEED_IDS.stroke_isc_note1, null, SEED_IDS.stroke_ischemic, "MSJ REE × 1.1–1.2 stress factor.", 1);
  await seedNote(SEED_IDS.stroke_isc_note2, null, SEED_IDS.stroke_ischemic, "30–40 mL/kg; manage fluid carefully in patients at risk for cerebral edema.", 2);
  await seedNote(SEED_IDS.stroke_hem_note1, null, SEED_IDS.stroke_hemorrhagic, "Hemorrhagic stroke: increase protein up to 2.5 g/kg/day to counter severe neuro-catabolism.", 1);
  await seedNote(SEED_IDS.stroke_hem_note2, null, SEED_IDS.stroke_hemorrhagic, "30–40 mL/kg; manage fluid carefully in patients at risk for cerebral edema.", 2);
  await seedNote(SEED_IDS.onc_sed_note1, null, SEED_IDS.onc_sed, "Use indirect calorimetry (IC) if available to accurately determine energy needs.", 1);
  await seedNote(SEED_IDS.onc_hyper_note1, null, SEED_IDS.onc_hyper, "Use indirect calorimetry (IC) if available to accurately determine energy needs.", 1);
  await seedNote(SEED_IDS.onc_stressed_note1, null, SEED_IDS.onc_stressed, "Use indirect calorimetry (IC) if available to accurately determine energy needs.", 1);
  await seedNote(SEED_IDS.onc_stressed_note2, null, SEED_IDS.onc_stressed, "Severely stressed: avoid exceeding 35 kcal/kg prior to treatment to prevent overfeeding.", 2);
  await seedNote(SEED_IDS.hsct_active_note1, null, SEED_IDS.hsct_active, "Monitor fluid status carefully. Increase fluids for concurrent fever or significant GI losses.", 1);
  await seedNote(SEED_IDS.hsct_active_note2, null, SEED_IDS.hsct_active, "Reassess requirements if Graft-versus-Host Disease (GvHD) develops.", 2);
  await seedNote(SEED_IDS.sbs_note1, null, SEED_IDS.sbs_standard, "Fluid needs are highly individualized. Monitor output closely to adjust targets.", 1);
  await seedNote(SEED_IDS.sbs_note2, null, SEED_IDS.sbs_standard, "Standard ORS sodium replacement should target 80–100 mEq/L.", 2);
  await seedNote(SEED_IDS.sbs_note3, null, SEED_IDS.sbs_standard, "Adjust dietary interventions if colon is preserved (increases fluid/electrolyte absorption).", 3);
  await seedNote(SEED_IDS.sbs_note4, null, SEED_IDS.sbs_standard, "Target approximately 20% of total energy intake from protein.", 4);
  await seedNote(SEED_IDS.sbs_note5, null, SEED_IDS.sbs_standard, "Prescribe a 50% energy absorption buffer (multiply EER by 1.5) to compensate for hypermetabolism and malabsorption.", 5);

  // CF Notes
  await seedNote(SEED_IDS.cf_note1, null, SEED_IDS.cf_active, "CF energy needs scale with FEV1-derived Disease Factor (DF). FEV1 >= 80%: DF 1.0-1.1; 40-79%: DF 1.1-1.4; <40%: DF 1.5-2.0.", 1);
  await seedNote(SEED_IDS.cf_note2, null, SEED_IDS.cf_active, "Pancreatic enzyme replacement therapy (PERT) dose adjustments required based on pancreatic sufficiency status.", 2);
  await seedNote(SEED_IDS.scd_stable_note1, null, SEED_IDS.scd_stable, "Maintain high fluid intake (AI target 3–4 L/day) to prevent sickle crisis and dehydration.", 1);
  await seedNote(SEED_IDS.scd_voc_note1, null, SEED_IDS.scd_voc, "Vaso-occlusive crisis: hypermetabolism increases calorie needs to MSJ × 1.3–1.5.", 1);
  await seedNote(SEED_IDS.pi_stage3_4_note1, null, SEED_IDS.pi_stage3_4, "Fluid: 30 mL/kg/day or 1.0–1.5 mL/kcal prescribed. Increase for wound exudate losses.", 1);
  await seedNote(SEED_IDS.mal_note1, null, SEED_IDS.mal_refeeding, "Refeeding risk: advance calories slowly (start at 10–15 kcal/kg or 50% of target EER) and monitor electrolytes (K, Phos, Mg) daily.", 1);
  await seedNote(SEED_IDS.mal_note2, null, SEED_IDS.mal_refeeding, "Thiamine supplementation (100–300 mg/day) must be initiated prior to introducing carbohydrates.", 2);
  await seedNote(SEED_IDS.obe_note1, null, SEED_IDS.obe_stable, "Indirect calorimetry (IC) preferred. Obesity hypocaloric targets: 20–25 kcal/kg IBW.", 1);
  await seedNote(SEED_IDS.obe_note2, null, SEED_IDS.obe_stable, "Consider adjusted body weight if actual body weight is >125% of ideal body weight.", 2);
  await seedNote(SEED_IDS.preg_t1_note1, null, SEED_IDS.preg_t1, "Fluid: 3 L/day total (beverages + food moisture).", 1);
  await seedNote(SEED_IDS.preg_t2_note1, null, SEED_IDS.preg_t2, "Fluid: 3 L/day total (beverages + food moisture).", 1);
  await seedNote(SEED_IDS.preg_t3_note1, null, SEED_IDS.preg_t3, "Fluid: 3 L/day total (beverages + food moisture).", 1);
  await seedNote(SEED_IDS.bf_early_note1, null, SEED_IDS.bf_early, "AI target 3.8 L/day for breastfeeding.", 1);
  await seedNote(SEED_IDS.bf_early_energy_note, null, SEED_IDS.bf_early, "Lactation energy addition: +400 kcal/day above non-pregnant EER (0–6 months).", 2);
  await seedNote(SEED_IDS.bf_late_note1, null, SEED_IDS.bf_late, "AI target 3.8 L/day for breastfeeding.", 1);
  await seedNote(SEED_IDS.bf_late_energy_note, null, SEED_IDS.bf_late, "Lactation energy addition: +330 kcal/day above non-pregnant EER (7–12 months).", 2);
  await seedNote(SEED_IDS.hl_note1, null, SEED_IDS.hl_standard, "PAL (Physical Activity Level) must be provided as an extra input. Use 1.2 sedentary through 1.9 very active.", 1);
  await seedNote(SEED_IDS.crit_ill_peds_note1, null, SEED_IDS.crit_ill_peds_std, "Energy based on Schofield WH BMR (schofieldReeKcal). Age-appropriate coefficients applied automatically by the scope builder.", 1);
  await seedNote(SEED_IDS.crit_ill_peds_note2, null, SEED_IDS.crit_ill_peds_std, "Protein: <2y: 2.0–3.0 g/kg; 2–12y: 1.5–2.0 g/kg; ≥13y: 1.5 g/kg. Use age-appropriate target.", 2);
  await seedNote(SEED_IDS.crit_ill_peds_note3, null, SEED_IDS.crit_ill_peds_std, "IC is the clinical gold standard. Avoid overfeeding during the acute phase (use permissive underfeeding/trophic feeds as appropriate).", 3);
  await seedNote(SEED_IDS.aki_peds_nodial_note1, null, SEED_IDS.aki_peds_nodial, "Energy based on Schofield WH BMR (schofieldReeKcal). Age-appropriate coefficients applied automatically by the scope builder.", 1);
  await seedNote(SEED_IDS.aki_peds_nodial_note2, null, SEED_IDS.aki_peds_nodial, "Fluid: monitor insensible losses carefully, which scale with body surface area (BSA) in pediatric patients.", 2);
  await seedNote(SEED_IDS.aki_peds_dial_note1, null, SEED_IDS.aki_peds_dial, "Energy based on Schofield WH BMR (schofieldReeKcal). Age-appropriate coefficients applied automatically by the scope builder.", 1);
  await seedNote(SEED_IDS.aki_peds_dial_note2, null, SEED_IDS.aki_peds_dial, "Fluid: monitor insensible losses carefully, which scale with body surface area (BSA) in pediatric patients.", 2);
  await seedNote(SEED_IDS.aki_peds_dial_note3, null, SEED_IDS.aki_peds_dial, "CRRT: high dialytic amino acid clearance requires increased protein replacement up to 2.5 g/kg/day.", 3);
  await seedNote(SEED_IDS.pancreatitis_peds_note1, null, SEED_IDS.pancreatitis_peds_std, "Energy based on Schofield WH BMR (schofieldReeKcal). Age-appropriate coefficients applied automatically by the scope builder.", 1);
  await seedNote(SEED_IDS.pancreatitis_peds_note2, null, SEED_IDS.pancreatitis_peds_std, "Initiate standard enteral nutrition within 72 hours of admission if hemodynamically stable.", 2);
  await seedNote(SEED_IDS.burns_peds_child_note1, null, SEED_IDS.burns_peds_child, "Enter TBSA% for Galveston formula. Parkland formula for fluid — strict I/O monitoring required.", 1);
  await seedNote(SEED_IDS.burns_peds_adol_note1, null, SEED_IDS.burns_peds_adol, "Enter TBSA% for Galveston formula. Parkland formula for fluid — strict I/O monitoring required.", 1);
  await seedNote(SEED_IDS.onc_peds_std_note1, null, SEED_IDS.onc_peds_std, "Energy based on Schofield WH BMR (schofieldReeKcal). Age-appropriate coefficients applied automatically by the scope builder.", 1);
  await seedNote(SEED_IDS.onc_peds_std_note2, null, SEED_IDS.onc_peds_std, "Use indirect calorimetry (IC) if available to accurately determine energy needs.", 2);
  await seedNote(SEED_IDS.onc_peds_std_note3, null, SEED_IDS.onc_peds_std, "Reassess nutritional requirements frequently during different phases of active oncological treatment.", 3);
  await seedNote(SEED_IDS.onc_peds_und_note1, null, SEED_IDS.onc_peds_undernourished, "Energy based on Schofield WH BMR (schofieldReeKcal). Age-appropriate coefficients applied automatically by the scope builder.", 1);
  await seedNote(SEED_IDS.onc_peds_und_note2, null, SEED_IDS.onc_peds_undernourished, "Use indirect calorimetry (IC) if available to accurately determine energy needs.", 2);
  await seedNote(SEED_IDS.onc_peds_und_note3, null, SEED_IDS.onc_peds_undernourished, "Reassess nutritional requirements frequently during different phases of active oncological treatment.", 3);
  await seedNote(SEED_IDS.ckd_peds_3_5_note1, null, SEED_IDS.ckd_peds_3_5_std, "Energy based on Schofield WH BMR (schofieldReeKcal). Age-appropriate coefficients applied automatically by the scope builder.", 1);
  await seedNote(SEED_IDS.ckd_peds_3_5_note2, null, SEED_IDS.ckd_peds_3_5_std, "Do not restrict protein intake below the Suggested Daily Intake (SDI) for age.", 2);
  await seedNote(SEED_IDS.ckd_peds_3_5_note3, null, SEED_IDS.ckd_peds_3_5_std, "Protein restriction below safe targets halts linear growth and causes skeletal muscle wasting in children.", 3);
  await seedNote(SEED_IDS.ckd_peds_hd_note1, null, SEED_IDS.ckd_peds_hd, "Energy based on Schofield WH BMR (schofieldReeKcal). Age-appropriate coefficients applied automatically by the scope builder.", 1);
  await seedNote(SEED_IDS.ckd_peds_hd_note2, null, SEED_IDS.ckd_peds_hd, "Adult protein targets (1.0–1.2 g/kg) are insufficient to cover dialytic losses in pediatric patients.", 2);
  await seedNote(SEED_IDS.ckd_peds_pd_note1, null, SEED_IDS.ckd_peds_pd, "Energy based on Schofield WH BMR (schofieldReeKcal). Age-appropriate coefficients applied automatically by the scope builder.", 1);
  await seedNote(SEED_IDS.ckd_peds_pd_note2, null, SEED_IDS.ckd_peds_pd, "Adult protein targets (1.0–1.2 g/kg) are insufficient to cover dialytic losses in pediatric patients.", 2);
  await seedNote(SEED_IDS.kidney_transplant_peds_acute_note1, null, SEED_IDS.kidney_transplant_peds_acute, "Energy based on Schofield WH BMR (schofieldReeKcal). Age-appropriate coefficients applied automatically by the scope builder.", 1);
  await seedNote(SEED_IDS.kidney_transplant_peds_chron_note1, null, SEED_IDS.kidney_transplant_peds_chron, "Energy based on Schofield WH BMR (schofieldReeKcal). Age-appropriate coefficients applied automatically by the scope builder.", 1);
  await seedNote(SEED_IDS.cirrhosis_peds_note1, null, SEED_IDS.cirrhosis_peds_std, "Energy based on Schofield WH BMR (schofieldReeKcal). Age-appropriate coefficients applied automatically by the scope builder.", 1);
  await seedNote(SEED_IDS.cirrhosis_peds_note2, null, SEED_IDS.cirrhosis_peds_std, "Do not restrict protein in pediatric cirrhosis due to high risk of muscle wasting/malnutrition.", 2);
  await seedNote(SEED_IDS.cirrhosis_peds_note3, null, SEED_IDS.cirrhosis_peds_std, "Mifflin-St Jeor is invalid for pediatric patients. Use Schofield BMR equations instead.", 3);
  await seedNote(SEED_IDS.liver_transplant_peds_acute_note1, null, SEED_IDS.liver_transplant_peds_acute, "Energy based on Schofield WH BMR (schofieldReeKcal). Age-appropriate coefficients applied automatically by the scope builder.", 1);
  await seedNote(SEED_IDS.liver_transplant_peds_acute_note2, null, SEED_IDS.liver_transplant_peds_acute, "Static 30–35 kcal/kg represents a starvation diet for infants and young children.", 2);
  await seedNote(SEED_IDS.liver_transplant_peds_chron_note1, null, SEED_IDS.liver_transplant_peds_chron, "Energy based on Schofield WH BMR (schofieldReeKcal). Age-appropriate coefficients applied automatically by the scope builder.", 1);
  await seedNote(SEED_IDS.trauma_peds_std_note1, null, SEED_IDS.trauma_peds_std, "Energy based on Schofield WH BMR (schofieldReeKcal). Age-appropriate coefficients applied automatically by the scope builder.", 1);
  await seedNote(SEED_IDS.trauma_peds_open_note1, null, SEED_IDS.trauma_peds_open, "Energy based on Schofield WH BMR (schofieldReeKcal). Age-appropriate coefficients applied automatically by the scope builder.", 1);
  await seedNote(SEED_IDS.masld_mash_peds_note1, null, SEED_IDS.masld_mash_peds_std, "Energy based on Schofield WH BMR (schofieldReeKcal). Age-appropriate coefficients applied automatically by the scope builder.", 1);
  await seedNote(SEED_IDS.masld_mash_peds_note2, null, SEED_IDS.masld_mash_peds_std, "Pediatric MASLD: EER based on Schofield WH. Avoid adult kcal/kg targets. Use gradual growth-preserving weight management.", 2);
  await seedNote(SEED_IDS.copd_peds_note1, null, SEED_IDS.copd_peds_std, "Energy based on Schofield WH BMR (schofieldReeKcal). Age-appropriate coefficients applied automatically by the scope builder.", 1);
  await seedNote(SEED_IDS.copd_peds_note2, null, SEED_IDS.copd_peds_std, "Adult Schofield weight brackets are inappropriate for pediatric COPD — age-specific WH table used.", 2);
  await seedNote(SEED_IDS.heart_failure_peds_note1, null, SEED_IDS.heart_failure_peds_std, "Energy based on Schofield WH BMR (schofieldReeKcal). Age-appropriate coefficients applied automatically by the scope builder.", 1);
  await seedNote(SEED_IDS.heart_failure_peds_note2, null, SEED_IDS.heart_failure_peds_std, "Pediatric congenital heart disease: account for hypermetabolism from increased cardiac workload. Fluid restrict to 70–90% Holliday-Segar.", 2);
  await seedNote(SEED_IDS.stroke_peds_note1, null, SEED_IDS.stroke_peds_std, "Energy based on Schofield WH BMR (schofieldReeKcal). Age-appropriate coefficients applied automatically by the scope builder.", 1);
  await seedNote(SEED_IDS.stroke_peds_note2, null, SEED_IDS.stroke_peds_std, "Adult fluid targets (30–40 mL/kg) induce severe dehydration in pediatric patients — Holliday-Segar used instead.", 2);
  await seedNote(SEED_IDS.pi_peds_stage1_2_note1, null, SEED_IDS.pi_peds_stage1_2, "Energy based on Schofield WH BMR (schofieldReeKcal). Age-appropriate coefficients applied automatically by the scope builder.", 1);
  await seedNote(SEED_IDS.pi_peds_stage1_2_note2, null, SEED_IDS.pi_peds_stage1_2, "Applying adult target (35 kcal/kg) to immobile neurologically impaired pediatric patients causes rapid obesity.", 2);
  await seedNote(SEED_IDS.pi_peds_stage3_4_note1, null, SEED_IDS.pi_peds_stage3_4, "Energy based on Schofield WH BMR (schofieldReeKcal). Age-appropriate coefficients applied automatically by the scope builder.", 1);
  await seedNote(SEED_IDS.pi_peds_stage3_4_note2, null, SEED_IDS.pi_peds_stage3_4, "Applying adult target (35 kcal/kg) to immobile neurologically impaired pediatric patients causes rapid obesity.", 2);
  await seedNote(SEED_IDS.scd_peds_stable_note1, null, SEED_IDS.scd_peds_stable, "Energy based on Schofield WH BMR (schofieldReeKcal). Age-appropriate coefficients applied automatically by the scope builder.", 1);
  await seedNote(SEED_IDS.scd_peds_stable_note2, null, SEED_IDS.scd_peds_stable, "Hemoglobin-adjusted sex-specific REE equation. Requires hemoglobin (g/dL) and PAL inputs. Adult MSJ is architecturally invalid for pediatric SCD.", 2);
  await seedNote(SEED_IDS.scd_peds_voc_note1, null, SEED_IDS.scd_peds_voc, "Energy based on Schofield WH BMR (schofieldReeKcal). Age-appropriate coefficients applied automatically by the scope builder.", 1);
  await seedNote(SEED_IDS.hsct_peds_infant_note1, null, SEED_IDS.hsct_peds_infant, "Energy based on Schofield WH BMR (schofieldReeKcal). Age-appropriate coefficients applied automatically by the scope builder.", 1);
  await seedNote(SEED_IDS.hsct_peds_infant_note2, null, SEED_IDS.hsct_peds_infant, "Protein: <2y: 2.5–3.0 g/kg; 2–5y: 2.0–2.5 g/kg; ≥6y: 1.5–2.0 g/kg.", 2);
  await seedNote(SEED_IDS.hsct_peds_child_note1, null, SEED_IDS.hsct_peds_child, "Energy based on Schofield WH BMR (schofieldReeKcal). Age-appropriate coefficients applied automatically by the scope builder.", 1);
  await seedNote(SEED_IDS.hsct_peds_child_note2, null, SEED_IDS.hsct_peds_child, "Protein: <2y: 2.5–3.0 g/kg; 2–5y: 2.0–2.5 g/kg; ≥6y: 1.5–2.0 g/kg.", 2);
  await seedNote(SEED_IDS.hsct_peds_older_note1, null, SEED_IDS.hsct_peds_older, "Energy based on Schofield WH BMR (schofieldReeKcal). Age-appropriate coefficients applied automatically by the scope builder.", 1);
  await seedNote(SEED_IDS.hsct_peds_older_note2, null, SEED_IDS.hsct_peds_older, "Protein: <2y: 2.5–3.0 g/kg; 2–5y: 2.0–2.5 g/kg; ≥6y: 1.5–2.0 g/kg.", 2);
  await seedNote(SEED_IDS.sbs_peds_pndep_note1, null, SEED_IDS.sbs_peds_pndep, "Fluid needs are highly individualized. Monitor output closely to adjust targets.", 1);
  await seedNote(SEED_IDS.sbs_peds_entaut_note1, null, SEED_IDS.sbs_peds_pndep, "Pediatric sodium supplementation: monitor urinary sodium concentration (target >20 mEq/L) to guide replacement.", 2);
  await seedNote(SEED_IDS.sbs_peds_entaut_note2, null, SEED_IDS.sbs_peds_pndep, "Intestinal adaptation continues for up to 2 years post-resection; enteral feeding promotes adaptation.", 3);
  await seedNote(SEED_IDS.sbs_peds_entaut_note3, null, SEED_IDS.sbs_peds_pndep, "Growth monitoring: closely monitor weight, length, and head circumference percentiles.", 4);
  await seedNote(SEED_IDS.sbs_peds_pndep_note1, null, SEED_IDS.sbs_peds_entaut, "Fluid needs are highly individualized. Monitor output closely to adjust targets.", 1);
  await seedNote(SEED_IDS.sbs_peds_entaut_note1, null, SEED_IDS.sbs_peds_entaut, "Pediatric sodium supplementation: monitor urinary sodium concentration (target >20 mEq/L) to guide replacement.", 2);
  await seedNote(SEED_IDS.sbs_peds_entaut_note2, null, SEED_IDS.sbs_peds_entaut, "Intestinal adaptation continues for up to 2 years post-resection; enteral feeding promotes adaptation.", 3);
  await seedNote(SEED_IDS.sbs_peds_entaut_note3, null, SEED_IDS.sbs_peds_entaut, "Growth monitoring: closely monitor weight, length, and head circumference percentiles.", 4);
  await seedNote(SEED_IDS.cf_peds_note1, null, SEED_IDS.cf_peds_bedbound, "Energy based on Schofield WH BMR (schofieldReeKcal). Age-appropriate coefficients applied automatically by the scope builder.", 1);
  await seedNote(SEED_IDS.cf_peds_note2, null, SEED_IDS.cf_peds_bedbound, "CF systems frequently truncate age at 10 — correct pediatric Schofield WH brackets used here.", 2);
  await seedNote(SEED_IDS.cf_peds_note1, null, SEED_IDS.cf_peds_sedentary, "Energy based on Schofield WH BMR (schofieldReeKcal). Age-appropriate coefficients applied automatically by the scope builder.", 1);
  await seedNote(SEED_IDS.cf_peds_note2, null, SEED_IDS.cf_peds_sedentary, "CF systems frequently truncate age at 10 — correct pediatric Schofield WH brackets used here.", 2);
  await seedNote(SEED_IDS.cf_peds_note1, null, SEED_IDS.cf_peds_active, "Energy based on Schofield WH BMR (schofieldReeKcal). Age-appropriate coefficients applied automatically by the scope builder.", 1);
  await seedNote(SEED_IDS.cf_peds_note2, null, SEED_IDS.cf_peds_active, "CF systems frequently truncate age at 10 — correct pediatric Schofield WH brackets used here.", 2);
  await seedNote(SEED_IDS.hl_peds_norm_note1, null, SEED_IDS.hl_peds_normal, "DRI/EER equations apply age and sex-specific coefficients automatically. PAL required (1.0–2.5 slider). For precise DRI/EER, the legacy engine path is preserved until full DRI expression migration.", 1);

  // Overweight / Obese
  await seedNote(SEED_IDS.hl_peds_overweight_note1, null, SEED_IDS.hl_peds_overweight, "For pediatric overweight/obesity, use the DRI/EER overweight/obese calculations to estimate EER. General target is to promote linear growth while stabilizing weight.", 1);
  await seedNote(SEED_IDS.mal_peds_note1, null, SEED_IDS.mal_peds_catchup, "FOLLOW-UP REQUIRED: Pediatric catch-up growth formula [RDA × Ideal Weight / Actual Weight] requires an Ideal Weight for Height input not yet implemented. Start at 50% of energy target and advance over 3–5 days. Monitor phosphorus, magnesium, potassium, and thiamine.", 1);

  await seedNote(SEED_IDS.obe_peds_note1, null, SEED_IDS.obe_peds_stable, "Pediatric obesity energy targets are calculated via the DRI/EER Overweight equations in the Healthy / Preventive → Pediatric → Overweight path. Use that condition instead.", 1);
  await seedNote(SEED_IDS.obe_peds_note2, null, SEED_IDS.obe_peds_stable, "Gradual growth-preserving weight management: target weight stabilization, not active loss, during linear growth phases.", 2);
  await seedNote(SEED_IDS.bpd_peds_note1, null, SEED_IDS.bpd_peds_std, "Fluid: BPD management often requires fluid restriction (e.g. 120–140 mL/kg/day) to prevent pulmonary edema.", 1);
  await seedNote(SEED_IDS.bpd_peds_note2, null, SEED_IDS.bpd_peds_std, "Formula density: high energy needs (120–150 kcal/kg) often necessitate concentrated formulas (24–30 kcal/oz).", 2);
  await seedNote(SEED_IDS.bpd_peds_note3, null, SEED_IDS.bpd_peds_std, "Weekly growth monitoring: target 15–20 g/day weight gain for infants <34 weeks post-menstrual age.", 3);
  await seedNote(SEED_IDS.bpd_peds_note4, null, SEED_IDS.bpd_peds_std, "Source: targets based on Gipson et al. (2025) clinical recommendations.", 4);
  await seedNote(SEED_IDS.preg_peds_note1, null, SEED_IDS.preg_peds_t1, "Standard systems bypass safety blocks for pregnant adolescents (14–17y) by applying adult MSJ — Schofield WH used here instead.", 1);
  await seedNote(SEED_IDS.preg_peds_note1, null, SEED_IDS.preg_peds_t2, "Standard systems bypass safety blocks for pregnant adolescents (14–17y) by applying adult MSJ — Schofield WH used here instead.", 1);
  await seedNote(SEED_IDS.preg_peds_note1, null, SEED_IDS.preg_peds_t3, "Standard systems bypass safety blocks for pregnant adolescents (14–17y) by applying adult MSJ — Schofield WH used here instead.", 1);
  await seedNote(SEED_IDS.bf_peds_early_note1, null, SEED_IDS.bf_peds_early, "Energy based on Schofield WH BMR (schofieldReeKcal). Age-appropriate coefficients applied automatically by the scope builder.", 1);
  await seedNote(SEED_IDS.bf_peds_late_note1, null, SEED_IDS.bf_peds_late, "Energy based on Schofield WH BMR (schofieldReeKcal). Age-appropriate coefficients applied automatically by the scope builder.", 1);

  // ─── Extra Inputs ───
  // Critical Illness Adult
  await seedExtraInput(SEED_IDS.crit_ill_lt30_isMechVent, SEED_IDS.crit_ill_bmi_lt30, "isMechVent", "Mechanically Ventilated", "boolean", null, 1);
  await seedExtraInput(SEED_IDS.crit_ill_lt30_tempMax, SEED_IDS.crit_ill_bmi_lt30, "tempMax", "Max Temp past 24h (°F)", "number", "Required for PSU 2003b / PSU 2010", 2);
  await seedExtraInput(SEED_IDS.crit_ill_lt30_ve, SEED_IDS.crit_ill_bmi_lt30, "ve", "Minute Ventilation Ve (L/min)", "number", "Required for PSU 2003b / PSU 2010", 3);

  await seedExtraInput(SEED_IDS.crit_ill_30_50_isMechVent, SEED_IDS.crit_ill_bmi_30_50, "isMechVent", "Mechanically Ventilated", "boolean", null, 1);
  await seedExtraInput(SEED_IDS.crit_ill_30_50_tempMax, SEED_IDS.crit_ill_bmi_30_50, "tempMax", "Max Temp past 24h (°F)", "number", "Required for PSU 2003b / PSU 2010", 2);
  await seedExtraInput(SEED_IDS.crit_ill_30_50_ve, SEED_IDS.crit_ill_bmi_30_50, "ve", "Minute Ventilation Ve (L/min)", "number", "Required for PSU 2003b / PSU 2010", 3);

  await seedExtraInput(SEED_IDS.crit_ill_gt50_isMechVent, SEED_IDS.crit_ill_bmi_gt50, "isMechVent", "Mechanically Ventilated", "boolean", null, 1);
  await seedExtraInput(SEED_IDS.crit_ill_gt50_tempMax, SEED_IDS.crit_ill_bmi_gt50, "tempMax", "Max Temp past 24h (°F)", "number", "Required for PSU 2003b / PSU 2010", 2);
  await seedExtraInput(SEED_IDS.crit_ill_gt50_ve, SEED_IDS.crit_ill_bmi_gt50, "ve", "Minute Ventilation Ve (L/min)", "number", "Required for PSU 2003b / PSU 2010", 3);

  // Cystic Fibrosis (all 6 leaves)
  const cfLeaves = [
    { leaf: SEED_IDS.cf_bedbound, ids: [SEED_IDS.cf_bb_fev1Pct, SEED_IDS.cf_bb_isPancreaticSufficient, SEED_IDS.cf_bb_cfa] },
    { leaf: SEED_IDS.cf_sedentary, ids: [SEED_IDS.cf_sed_fev1Pct, SEED_IDS.cf_sed_isPancreaticSufficient, SEED_IDS.cf_sed_cfa] },
    { leaf: SEED_IDS.cf_active, ids: [SEED_IDS.cf_act_fev1Pct, SEED_IDS.cf_act_isPancreaticSufficient, SEED_IDS.cf_act_cfa] },
    { leaf: SEED_IDS.cf_peds_bedbound, ids: [SEED_IDS.cf_peds_bb_fev1Pct, SEED_IDS.cf_peds_bb_isPancreaticSufficient, SEED_IDS.cf_peds_bb_cfa] },
    { leaf: SEED_IDS.cf_peds_sedentary, ids: [SEED_IDS.cf_peds_sed_fev1Pct, SEED_IDS.cf_peds_sed_isPancreaticSufficient, SEED_IDS.cf_peds_sed_cfa] },
    { leaf: SEED_IDS.cf_peds_active, ids: [SEED_IDS.cf_peds_act_fev1Pct, SEED_IDS.cf_peds_act_isPancreaticSufficient, SEED_IDS.cf_peds_act_cfa] }
  ];
  for (const cf of cfLeaves) {
    await seedExtraInput(cf.ids[0], cf.leaf, "fev1Pct", "FEV₁ % Predicted", "number", null, 1);
    await seedExtraInput(cf.ids[1], cf.leaf, "isPancreaticSufficient", "Pancreatic Sufficient", "boolean", null, 2);
    await seedExtraInput(cf.ids[2], cf.leaf, "cfa", "Coefficient of Fat Absorption (CFA)", "number", "Default 0.85 if no stool collection", 3);
  }

  // Burns (all 4 leaves)
  const burnsLeaves = [
    { leaf: SEED_IDS.burns_toronto, ids: [SEED_IDS.burns_toronto_tbsaPct, SEED_IDS.burns_toronto_pbd, SEED_IDS.burns_toronto_caloricIntake, SEED_IDS.burns_toronto_coreTemp] },
    { leaf: SEED_IDS.burns_peds_child, ids: [SEED_IDS.burns_peds_child_tbsaPct, SEED_IDS.burns_peds_child_pbd, SEED_IDS.burns_peds_child_caloricIntake, SEED_IDS.burns_peds_child_coreTemp] },
    { leaf: SEED_IDS.burns_peds_adol, ids: [SEED_IDS.burns_peds_adol_tbsaPct, SEED_IDS.burns_peds_adol_pbd, SEED_IDS.burns_peds_adol_caloricIntake, SEED_IDS.burns_peds_adol_coreTemp] }
  ];
  for (const b of burnsLeaves) {
    await seedExtraInput(b.ids[0], b.leaf, "tbsaPct", "TBSA Burned (%)", "number", null, 1);
    await seedExtraInput(b.ids[1], b.leaf, "pbd", "Post-Burn Day (PBD)", "number", "Required for Toronto equation", 2);
    await seedExtraInput(b.ids[2], b.leaf, "caloricIntake", "Current Caloric Intake (kcal/day)", "number", "Required for Toronto equation", 3);
    await seedExtraInput(b.ids[3], b.leaf, "coreTemp", "Core Temperature (°C)", "number", "Required for Toronto equation", 4);
  }

  // Trauma (open abdomen leaves only)
  await seedExtraInput(SEED_IDS.trauma_open_exudateVolumeL, SEED_IDS.trauma_open_abdomen, "exudateVolumeL", "Exudate Volume (L)", "number", "Required for open abdomen adjustment", 1);
  await seedExtraInput(SEED_IDS.trauma_peds_open_exudateVolumeL, SEED_IDS.trauma_peds_open, "exudateVolumeL", "Exudate Volume (L)", "number", "Required for open abdomen adjustment", 1);

  // Sickle Cell Disease (all 4 leaves)
  const scdLeaves = [
    { leaf: SEED_IDS.scd_stable, id: SEED_IDS.scd_stable_hgb },
    { leaf: SEED_IDS.scd_voc, id: SEED_IDS.scd_voc_hgb },
    { leaf: SEED_IDS.scd_peds_stable, id: SEED_IDS.scd_peds_stable_hgb },
    { leaf: SEED_IDS.scd_peds_voc, id: SEED_IDS.scd_peds_voc_hgb }
  ];
  for (const scd of scdLeaves) {
    await seedExtraInput(scd.id, scd.leaf, "hgb", "Hemoglobin (g/dL)", "number", null, 1);
  }

  // Heart Failure (adult leaf only)
  await seedExtraInput(SEED_IDS.heart_failure_pal, SEED_IDS.heart_failure_standard, "pal", "Physical Activity Level (PAL)", "number", "1.2 = sedentary, 1.5 = lightly active", 1);

  // CKD 5D (all 4 leaves)
  const ckd5dLeaves = [
    { leaf: SEED_IDS.ckd_hd, id: SEED_IDS.ckd_hd_urineOutputMlDay },
    { leaf: SEED_IDS.ckd_pd, id: SEED_IDS.ckd_pd_urineOutputMlDay },
    { leaf: SEED_IDS.ckd_peds_hd, id: SEED_IDS.ckd_peds_hd_urineOutputMlDay },
    { leaf: SEED_IDS.ckd_peds_pd, id: SEED_IDS.ckd_peds_pd_urineOutputMlDay }
  ];
  for (const ckd of ckd5dLeaves) {
    await seedExtraInput(ckd.id, ckd.leaf, "urineOutputMlDay", "Urine Output (mL/day)", "number", null, 1);
  }

  // Pressure Injuries (all 4 leaves)
  const piLeaves = [
    { leaf: SEED_IDS.pi_stage1_2, id: SEED_IDS.pi_stage1_2_targetKcal },
    { leaf: SEED_IDS.pi_stage3_4, id: SEED_IDS.pi_stage3_4_targetKcal },
    { leaf: SEED_IDS.pi_peds_stage1_2, id: SEED_IDS.pi_peds_stage1_2_targetKcal },
    { leaf: SEED_IDS.pi_peds_stage3_4, id: SEED_IDS.pi_peds_stage3_4_targetKcal }
  ];
  for (const pi of piLeaves) {
    await seedExtraInput(pi.id, pi.leaf, "targetKcal", "Prescribed kcal/day (for fluid calc)", "number", null, 1);
  }

  // AKI (all 5 leaves)
  const akiLeaves = [
    { leaf: SEED_IDS.aki_no_dialysis, id: SEED_IDS.aki_no_dial_urineOutputMlDay },
    { leaf: SEED_IDS.aki_hemodialysis, id: SEED_IDS.aki_hd_urineOutputMlDay },
    { leaf: SEED_IDS.aki_crrt, id: SEED_IDS.aki_crrt_urineOutputMlDay },
    { leaf: SEED_IDS.aki_peds_nodial, id: SEED_IDS.aki_peds_nodial_urineOutputMlDay },
    { leaf: SEED_IDS.aki_peds_dial, id: SEED_IDS.aki_peds_dial_urineOutputMlDay }
  ];
  for (const aki of akiLeaves) {
    await seedExtraInput(aki.id, aki.leaf, "urineOutputMlDay", "Urine Output (mL/day)", "number", aki.leaf.includes("peds") ? "Required for pediatric fluid calculation" : null, 1);
  }

  // Oncology (pediatric oncology leaves only)
  await seedExtraInput(SEED_IDS.onc_peds_std_isUndernourished, SEED_IDS.onc_peds_std, "isUndernourished", "Undernourished / Catch-up Growth Needed", "boolean", null, 1);
  await seedExtraInput(SEED_IDS.onc_peds_und_isUndernourished, SEED_IDS.onc_peds_undernourished, "isUndernourished", "Undernourished / Catch-up Growth Needed", "boolean", null, 1);

  // Short Bowel Syndrome (all 3 leaves)
  const sbsLeaves = [
    { leaf: SEED_IDS.sbs_standard, ids: [SEED_IDS.sbs_std_hasPreservedColon, SEED_IDS.sbs_std_remainingBowelShort, SEED_IDS.sbs_std_growthSuboptimal] },
    { leaf: SEED_IDS.sbs_peds_pndep, ids: [SEED_IDS.sbs_peds_pndep_hasPreservedColon, SEED_IDS.sbs_peds_pndep_remainingBowelShort, SEED_IDS.sbs_peds_pndep_growthSuboptimal] },
    { leaf: SEED_IDS.sbs_peds_entaut, ids: [SEED_IDS.sbs_peds_entaut_hasPreservedColon, SEED_IDS.sbs_peds_entaut_remainingBowelShort, SEED_IDS.sbs_peds_entaut_growthSuboptimal] }
  ];
  for (const sbs of sbsLeaves) {
    await seedExtraInput(sbs.ids[0], sbs.leaf, "hasPreservedColon", "Preserved Colon (increases water absorption)", "boolean", null, 1);
    await seedExtraInput(sbs.ids[1], sbs.leaf, "remainingBowelShort", "Remaining Bowel < 40 cm or Excessive Output", "boolean", null, 2);
    await seedExtraInput(sbs.ids[2], sbs.leaf, "growthSuboptimal", "Suboptimal Growth Trajectory", "boolean", null, 3);
  }
}

// ─── Local Helpers ────────────────────────────────────────────────────────────
function tryParseJSON(raw: string | null): Record<string, any> {
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

// ─── UUID helper ──────────────────────────────────────────────────────────────
function uuid(): string {
  return crypto.randomUUID();
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  dob: string;
  sex: string;
  mrn: string;
  languages: string;
  created_at: string;
}

/**
 * Phase 7: Encounter (Admission)
 * Represents a single hospital stay.
 */
export interface Encounter {
  id: string;
  patient_id: string;
  admission_date: string;
  discharge_date: string | null;
  created_at: string;
}

export interface Note {
  id: string;
  patient_id: string;
  encounter_id: string; // Phase 7
  note_date: string;
  admission_date: string; // Legacy/redundant but kept for safety
  status: "draft" | "submitted";
  version: number;
  parent_note_id: string | null;
  anthro: string | null;
  labs: string | null;
  clinical: string | null;
  dietary: string | null;
  dexa_scans: string | null;
  // Phase 6 new columns
  diagnosis: string | null;
  intervention: string | null;
  monitor_evaluate: string | null;
  standards: string | null;
  refeeding_screen: string | null;
  patient_history: string | null;
  created_at: string;
  submitted_at: string | null;
}

export interface NoteWithPatient extends Note {
  first_name: string;
  last_name: string;
  dob: string;
  sex: string;
  mrn: string;
}

export interface SubmissionRequirement {
  id: number;
  field_key: string;
  label: string;
  required: boolean;
}

export interface SubmissionCheckResult {
  valid: boolean;
  missingFields: string[];
}

export interface HospitalDiet {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

export interface HospitalDietInput {
  name: string;
  sort_order: number;
}

export interface HospitalDysphagiaMode {
  id: string;
  name: string;
  category: "Food" | "Liquid" | "Other";
  sort_order: number;
  created_at: string;
}

export interface HospitalDysphagiaModInput {
  name: string;
  category: "Food" | "Liquid" | "Other";
  sort_order: number;
}

// ─── Patient commands ─────────────────────────────────────────────────────────

export async function createPatient(payload: {
  first_name: string;
  last_name: string;
  dob: string;
  sex?: string;
  mrn?: string;
  languages?: string;
}): Promise<Patient> {
  const db = await getDb();
  const patient: Patient = {
    id:         uuid(),
    first_name: payload.first_name,
    last_name:  payload.last_name,
    dob:        payload.dob,
    sex:        payload.sex        ?? "",
    mrn:        payload.mrn        ?? "",
    languages:  payload.languages  ?? "",
    created_at: new Date().toISOString(),
  };

  await db.execute(
    `INSERT INTO patients (id, first_name, last_name, dob, sex, mrn, languages, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [patient.id, patient.first_name, patient.last_name, patient.dob,
     patient.sex, patient.mrn, patient.languages, patient.created_at]
  );

  return patient;
}

export async function getAllPatients(): Promise<Patient[]> {
  const db = await getDb();
  return await db.select<Patient[]>(
    `SELECT * FROM patients ORDER BY last_name, first_name`
  );
}

export async function getPatientById(id: string): Promise<Patient | null> {
  const db = await getDb();
  const rows = await db.select<Patient[]>(
    `SELECT * FROM patients WHERE id = ?`,
    [id]
  );
  return rows[0] ?? null;
}

export async function deletePatient(patientId: string): Promise<void> {
  const db = await getDb();
  await db.execute(`DELETE FROM notes WHERE patient_id = ?`, [patientId]);
  await db.execute(`DELETE FROM encounters WHERE patient_id = ?`, [patientId]);
  await db.execute(`DELETE FROM patients WHERE id = ?`, [patientId]);
}

// ─── Note commands ────────────────────────────────────────────────────────────

/**
 * Finds an existing encounter for a patient on a specific date, or creates one.
 */
export async function getOrCreateEncounter(patientId: string, admissionDate: string): Promise<string> {
  const db = await getDb();
  const existing = await db.select<any[]>(
    `SELECT id FROM encounters WHERE patient_id = ? AND admission_date = ?`,
    [patientId, admissionDate]
  );

  if (existing.length > 0) return existing[0].id;

  const eid = uuid();
  await db.execute(
    `INSERT INTO encounters (id, patient_id, admission_date, created_at)
     VALUES (?, ?, ?, ?)`,
    [eid, patientId, admissionDate, new Date().toISOString()]
  );
  return eid;
}

export async function createNote(payload: {
  patient_id: string;
  note_date?: string;
  admission_date?: string;
}): Promise<Note> {
  const db = await getDb();
  const today = getLocalIsoDate();
  const admDate = payload.admission_date ?? today;

  // Phase 7: Ensure encounter exists first
  const eid = await getOrCreateEncounter(payload.patient_id, admDate);

  const note: Note = {
    id:               uuid(),
    patient_id:       payload.patient_id,
    encounter_id:     eid, // Phase 7
    note_date:        payload.note_date      ?? today,
    admission_date:   admDate,
    status:           "draft",
    version:          1,
    parent_note_id:   null,
    anthro:           null,
    labs:             null,
    clinical:         null,
    dietary:          null,
    dexa_scans:       null,
    diagnosis:        null,
    intervention:     null,
    monitor_evaluate: null,
    standards:        null,
    refeeding_screen: null,
    patient_history:  null,
    created_at:       new Date().toISOString(),
    submitted_at:     null,
  };

  await db.execute(
    `INSERT INTO notes
       (id, patient_id, encounter_id, note_date, admission_date, status, version,
        parent_note_id, anthro, labs, clinical, dietary, dexa_scans,
        diagnosis, intervention, monitor_evaluate, standards, patient_history,
        created_at, submitted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      note.id, note.patient_id, note.encounter_id, note.note_date, note.admission_date,
      note.status, note.version, note.parent_note_id,
      note.anthro, note.labs, note.clinical, note.dietary, note.dexa_scans,
      note.diagnosis, note.intervention, note.monitor_evaluate, note.standards, note.patient_history,
      note.created_at, note.submitted_at,
    ]
  );

  return note;
}

/**
 * Auto-save a single domain column for an existing note.
 * Phase 7: admission_date updates also sync to the parent encounter.
 */
export async function autosaveNote(
  noteId: string,
  domain:
    | "anthro" | "labs" | "clinical" | "dietary" | "dexa_scans"
    | "diagnosis" | "intervention" | "monitor_evaluate" | "standards"
    | "refeeding_screen" | "patient_history" | "note_date" | "admission_date",
  data: object | string
): Promise<void> {
  const db = await getDb();

  const jsonDomains = [
    "anthro", "labs", "clinical", "dietary", "dexa_scans",
    "diagnosis", "intervention", "monitor_evaluate", "standards",
    "refeeding_screen", "patient_history"
  ];
  const value = jsonDomains.includes(domain)
    ? JSON.stringify(data)
    : (data as string);

  // If updating admission_date, sync it to the parent encounter record too
  if (domain === "admission_date") {
    const note = await getNoteById(noteId);
    if (note?.encounter_id) {
      await db.execute(
        `UPDATE encounters SET admission_date = ? WHERE id = ?`,
        [value, note.encounter_id]
      );
    }
  }

  await db.execute(
    `UPDATE notes SET ${domain} = ? WHERE id = ?`,
    [value, noteId]
  );
}

/**
 * Fetches the most recent note before the specified one in the same encounter.
 */
export async function getPreviousNoteInEncounter(noteId: string): Promise<Note | null> {
  const currentNote = await getNoteById(noteId);
  if (!currentNote || !currentNote.encounter_id) return null;

  const db = await getDb();
  const rows = await db.select<Note[]>(
    `SELECT * FROM notes 
     WHERE encounter_id = ? 
     AND (note_date < ? OR (note_date = ? AND created_at < ?))
     ORDER BY note_date DESC, created_at DESC
     LIMIT 1`,
    [currentNote.encounter_id, currentNote.note_date, currentNote.note_date, currentNote.created_at]
  );

  return rows[0] ?? null;
}

/**
 * Returns true if the given note is the first one (by date/time) in its encounter.
 */
export async function isFirstEncounterNote(noteId: string): Promise<boolean> {
  const prev = await getPreviousNoteInEncounter(noteId);
  return prev === null;
}

import { validatePES } from "../../features/diagnosis/etiologyData";

// ... (rest of imports)

/**
 * Run submission validation, then mark the note as submitted if it passes.
 */
export async function submitNote(
  noteId: string,
  patientId: string
): Promise<SubmissionCheckResult> {
  const db = await getDb();

  const requirements = await db.select<SubmissionRequirement[]>(
    `SELECT * FROM submission_requirements WHERE required = 1`
  );

  const patient = await getPatientById(patientId);
  const noteRows = await db.select<Note[]>(
    `SELECT * FROM notes WHERE id = ?`,
    [noteId]
  );
  const note = noteRows[0] ?? null;

  if (!patient || !note) {
    return { valid: false, missingFields: ["Patient or note not found"] };
  }

  // Parse all domain JSON blobs
  const clinicalData     = tryParseJSON(note.clinical);
  const dietaryData      = tryParseJSON(note.dietary);
  const anthroData       = tryParseJSON(note.anthro);
  const diagnosisData    = tryParseJSON(note.diagnosis);
  const interventionData = tryParseJSON(note.intervention);
  const meData           = tryParseJSON(note.monitor_evaluate);
  const patientHistoryData = tryParseJSON(note.patient_history);

  const fieldValues: Record<string, any> = {
    // Patient table fields
    first_name:     patient.first_name,
    last_name:      patient.last_name,
    dob:            patient.dob,
    sex:            patient.sex,
    mrn:            patient.mrn,
    languages:      patient.languages,

    // Note table fields
    note_date:      note.note_date,
    admission_date: note.admission_date,

    // Patient History domain (from note.patient_history JSON)
    purposeOfVisit:           (patientHistoryData.purposeOfVisit as string)  ?? null,
    chiefComplaint:           (patientHistoryData.chiefComplaint as string)  ?? null,
    medHx:                    (patientHistoryData.medHx          as string)  ?? null,
    familyHx:                 (patientHistoryData.familyHx       as string)  ?? null,
    socialHx:                 (patientHistoryData.socialHx       as string)  ?? null,

    // Anthro (note.anthro JSON)
    ht:                (anthroData.ht as string)              ?? null,
    wt:                (anthroData.wt as string)              ?? null,
    ubw:               (anthroData.ubw as string)             ?? null,
    ubwDate:           (anthroData.ubwDate as string)         ?? null,
    waist:             (anthroData.waist as string)           ?? null,
    mac:               (anthroData.mac as string)             ?? null,
    calf:              (anthroData.calf as string)            ?? null,
    head:              (anthroData.head as string)            ?? null,
    triceps:           (anthroData.triceps as string)         ?? null,
    subscapular:       (anthroData.subscapular as string)     ?? null,
    suprailiac:        (anthroData.suprailiac as string)      ?? null,
    thigh:             (anthroData.thigh as string)           ?? null,
    edw:               (anthroData.edw as string)             ?? null,
    circUnit:          (anthroData.circUnit as string)        ?? null,
    past_ht:           (anthroData.past_ht as string)         ?? null,
    past_wt:           (anthroData.past_wt as string)         ?? null,
    past_head:         (anthroData.past_head as string)       ?? null,
    past_htDate:       (anthroData.past_htDate as string)     ?? null,
    past_wtDate:       (anthroData.past_wtDate as string)     ?? null,
    past_headDate:     (anthroData.past_headDate as string)   ?? null,
    amputations:       anthroData.amputations                 ?? null,
    ampSegments:       anthroData.ampSegments                 ?? null,
    dexaScans:         anthroData.dexaScans                   ?? null,

    // Clinical domain (from note.clinical JSON)
    allergiesIntolerances:    (clinicalData.allergiesIntolerances as string) ?? null,
    medicalDevices:           (clinicalData.medicalDevices as string)         ?? null,
    medications:              (clinicalData.medications as string)           ?? null,
    temp:                     (clinicalData.temp as string)                  ?? null,
    hr:                       (clinicalData.hr as string)                    ?? null,
    spo2:                     (clinicalData.spo2 as string)                  ?? null,
    bp:                       (clinicalData.bp as string)                    ?? null,
    rr:                       (clinicalData.rr as string)                    ?? null,
    temples:                  (clinicalData.temples as string)               ?? null,
    clavicles:                (clinicalData.clavicles as string)             ?? null,
    shoulders:                (clinicalData.shoulders as string)             ?? null,
    scapula:                  (clinicalData.scapula as string)               ?? null,
    interosseous:             (clinicalData.interosseous as string)          ?? null,
    thighs:                   (clinicalData.thighs as string)                ?? null,
    calves:                   (clinicalData.calves as string)                ?? null,
    orbital:                  (clinicalData.orbital as string)               ?? null,
    cheek:                    (clinicalData.cheek as string)                 ?? null,
    tricepsFat:               (clinicalData.tricepsFat as string)            ?? null,
    midAxillary:              (clinicalData.midAxillary as string)           ?? null,
    pittingEdema:             (clinicalData.pittingEdema as string)          ?? null,
    pedalEdema:               (clinicalData.pedalEdema as string)            ?? null,
    ascites:                  (clinicalData.ascites as string)               ?? null,
    gripStrength:             (clinicalData.gripStrength as string)          ?? null,
    giDistress:               (clinicalData.giDistress as string)            ?? null,
    giSymptoms:               clinicalData.giSymptoms                        ?? null,
    stoolType:                (clinicalData.stoolType as string)             ?? null,
    dentition:                (clinicalData.dentition as string)             ?? null,
    swallowChewConcerns:      clinicalData.swallowChewConcerns               ?? null,
    nicheConditionFlags:      clinicalData.nicheConditionFlags               ?? null,
    imaging_smi:              (clinicalData.imaging_smi as string)           ?? null,
    tempMax:                  (clinicalData.tempMax as string)               ?? null,
    ve:                       (clinicalData.ve as string)                    ?? null,
    fev1:                     (clinicalData.fev1 as string)                  ?? null,
    tbsa:                     (clinicalData.tbsa as string)                  ?? null,
    clinicalNotes:            (clinicalData.clinicalNotes as string)         ?? null,
    screenings:               (clinicalData.screenings as string)            ?? null,
    oralHygiene:              (clinicalData.oralHygiene as string)           ?? null,
    edemaDescription:         (clinicalData.edemaDescription as string)      ?? null,
    imaging_muscleAttenuation: (clinicalData.imaging_muscleAttenuation as string) ?? null,
    imaging_imat:              (clinicalData.imaging_imat as string)          ?? null,
    imaging_vat:               (clinicalData.imaging_vat as string)           ?? null,
    imaging_notes:             (clinicalData.imaging_notes as string)         ?? null,
    hair:                     clinicalData.hair                              ?? null,
    eyes:                     clinicalData.eyes                              ?? null,
    mouthLips:                clinicalData.mouthLips                         ?? null,
    tongue:                   clinicalData.tongue                            ?? null,
    teethGums:                clinicalData.teethGums                         ?? null,
    headNeck:                 clinicalData.headNeck                          ?? null,
    nails:                    clinicalData.nails                             ?? null,
    skin:                     clinicalData.skin                              ?? null,

    // Dietary domain (from note.dietary JSON)
    dietOrder:                Array.isArray(dietaryData.dietOrder)
                                ? (dietaryData.dietOrder as string[]).join(", ")
                                : (dietaryData.dietOrder as string ?? null),
    oralCalories:             (dietaryData.oralCalories as string)           ?? null,
    oralProtein:              (dietaryData.oralProtein as string)            ?? null,
    oralWater:                (dietaryData.oralWater as string)              ?? null,
    fluidIntake:              (dietaryData.fluidIntake as string)            ?? null,
    mealPatterns:             (dietaryData.mealPatterns as string)           ?? null,
    eeiPercent:               (dietaryData.eeiPercent as string)             ?? null,
    eeiTimeframe:             (dietaryData.eeiTimeframe as string)           ?? null,
    herbalCAM:                (dietaryData.herbalCAM as string)              ?? null,
    supplements:              (dietaryData.supplements as string)            ?? null,
    understanding:            (dietaryData.understanding as string)          ?? null,
    readiness:                (dietaryData.readiness as string)              ?? null,
    foodSecurity:             (dietaryData.foodSecurity as string)           ?? null,
    physicalLevel:            (dietaryData.physicalLevel as string)          ?? null,
    adls:                     (dietaryData.adls as string)                   ?? null,
    currentDiets:             (dietaryData.currentDiets as string)           ?? null,
    feedingTasks:             (dietaryData.feedingTasks as string)           ?? null,
    psychTies:                (dietaryData.psychTies as string)              ?? null,
    mealPrep:                 (dietaryData.mealPrep as string)               ?? null,
    eatingOut:                (dietaryData.eatingOut as string)              ?? null,
    bingePurge:               (dietaryData.bingePurge as string)             ?? null,
    foodSupplies:             (dietaryData.foodSupplies as string)           ?? null,
    transport:                (dietaryData.transport as string)              ?? null,
    culturalReligious:        (dietaryData.culturalReligious as string)      ?? null,
    socialDynamics:           (dietaryData.socialDynamics as string)         ?? null,
    eatingEnv:                (dietaryData.eatingEnv as string)              ?? null,
    perception:               (dietaryData.perception as string)             ?? null,
    qolGoals:                 (dietaryData.qolGoals as string)               ?? null,
    enState:                  dietaryData.enState                            ?? null,
    pnState:                  dietaryData.pnState                            ?? null,
    recall:                   dietaryData.recall                             ?? null,
    ivOrders:                 dietaryData.ivOrders                           ?? null,

    // Diagnosis (from note.diagnosis JSON)
    problem:                  (diagnosisData.problem as string)              ?? null,
    etiology:                 (diagnosisData.etiology as string)             ?? null,
    signsSymptoms:            (diagnosisData.signsSymptoms as string)        ?? null,
    nutritionDxNarrative:     (diagnosisData.nutritionDxNarrative as string) ?? null,
    priorityRanking:          (diagnosisData.priorityRanking as string)      ?? null,
    additionalDiagnoses:      diagnosisData.additionalDiagnoses              ?? null,

    // Intervention (from note.intervention JSON)
    goalStatement:            (interventionData.goalStatement as string)     ?? null,
    interventionNotes:        (interventionData.interventionNotes as string) ?? null,
    nd_mealsSnacks:           (interventionData.nd_mealsSnacks as string)    ?? null,
    nd_supplementalFeeding:    (interventionData.nd_supplementalFeeding as string) ?? null,
    ed_purpose:               (interventionData.ed_purpose as string)        ?? null,
    c_theory:                 (interventionData.c_theory as string)          ?? null,
    cc_followUpPlan:          (interventionData.cc_followUpPlan as string)   ?? null,
    npOral_energyKcal:        (interventionData.npOral_energyKcal as string) ?? null,
    npOral_textureModification: (interventionData.npOral_textureModification as string) ?? null,
    npOral_oralSupplements:   (interventionData.npOral_oralSupplements as string) ?? null,
    npOral_isNpo:             (interventionData.npOral_isNpo as string)      ?? null,
    npEnteral_formulaName:    (interventionData.npEnteral_formulaName as string) ?? null,
    npEnteral_adminMethod:    (interventionData.npEnteral_adminMethod as string) ?? null,
    npEnteral_kcalLow:        (interventionData.npEnteral_kcalLow as string) ?? null,
    npEnteral_kcalHigh:       (interventionData.npEnteral_kcalHigh as string) ?? null,
    npParenteral_energyKcal:  (interventionData.npParenteral_energyKcal as string) ?? null,
    npParenteral_solutionType: (interventionData.npParenteral_solutionType as string) ?? null,
    npIvFluid_solution:       (interventionData.npIvFluid_solution as string) ?? null,
    goalTimeframe:            (interventionData.goalTimeframe as string)     ?? null,
    goalMeasurable:           (interventionData.goalMeasurable as string)    ?? null,
    npActiveModes:            interventionData.npActiveModes                 ?? null,
    ndImplementation:         interventionData.ndImplementation              ?? null,

    // Monitor & Evaluate (from note.monitor_evaluate JSON)
    monitorFrequency:         (meData.monitorFrequency as string)            ?? null,
    monitoredBy:              (meData.monitoredBy as string)                 ?? null,
    outcome_progress:         (meData.outcome_progress as string)            ?? null,
    dischargeRecs:            (meData.dischargeRecs as string)               ?? null,
    meNotes:                  (meData.meNotes as string)                     ?? null,
    criteria_anthropo:        (meData.criteria_anthropo as string)           ?? null,
    criteria_labs:            (meData.criteria_labs as string)               ?? null,
    criteria_dietary:         (meData.criteria_dietary as string)            ?? null,
    criteria_clinical:        (meData.criteria_clinical as string)           ?? null,
    criteria_functional:      (meData.criteria_functional as string)         ?? null,
    outcome_nextSteps:        (meData.outcome_nextSteps as string)           ?? null,
    transitionPlan:           (meData.transitionPlan as string)              ?? null,
    monitoredIndicators:      meData.monitoredIndicators                     ?? null,

    // Keep legacy diagnosis key for the special-case handler below
    diagnosis:      note.diagnosis,
  };

  const missingFields: string[] = [];
  
  // 1. Basic field validation
  for (const req of requirements) {
    const val = fieldValues[req.field_key];
    
    // Special handling for the JSON diagnosis field
    if (req.field_key === "diagnosis") {
      try {
        const diagData = val ? JSON.parse(val) : null;
        if (!diagData || !diagData.problem || diagData.problem.trim() === "") {
          missingFields.push(req.label);
          continue;
        }
      } catch (e) {
        missingFields.push(req.label);
        continue;
      }
    } else {
      // General validation for strings, numbers, and arrays
      let isEmpty = false;
      if (val === null || val === undefined) {
        isEmpty = true;
      } else if (typeof val === "string") {
        isEmpty = val.trim() === "";
      } else if (Array.isArray(val)) {
        // Array validation: missing if empty or all items are meaningless
        if (val.length === 0) {
          isEmpty = true;
        } else {
          // Check if at least one item has content
          isEmpty = val.every(item => {
            if (!item) return true;
            if (typeof item === "string") return item.trim() === "";
            if (typeof item === "object") {
              // For objects like RecallMeal or IVOrder, check all string values
              return Object.values(item).every(v => typeof v === "string" ? v.trim() === "" : !v);
            }
            return false;
          });
        }
      } else if (typeof val === "object") {
        // For structured objects like ndImplementation
        const values = Object.values(val);
        isEmpty = values.length === 0 || values.every(v => {
          if (Array.isArray(v)) return v.length === 0;
          if (typeof v === "string") return v.trim() === "";
          return !v;
        });
      }

      if (isEmpty) {
        missingFields.push(req.label);
      }
    }
  }

  // 2. Deep PES / Etiology Domain validation
  // We run this even if diagnosis wasn't explicitly "required" in the loop above,
  // as long as some diagnosis data exists.
  if (note.diagnosis) {
    try {
      const diagData = JSON.parse(note.diagnosis);
      const pesErrors = validatePES(diagData);
      missingFields.push(...pesErrors);
    } catch (e) {
      console.error("Failed to parse diagnosis for validation", e);
    }
  }

  if (missingFields.length > 0) {
    return { valid: false, missingFields };
  }

  await db.execute(
    `UPDATE notes SET status = 'submitted', submitted_at = ? WHERE id = ?`,
    [new Date().toISOString(), noteId]
  );

  return { valid: true, missingFields: [] };
}

export async function getNotesByPatient(patientId: string): Promise<Note[]> {
  const db = await getDb();
  return await db.select<Note[]>(
    `SELECT * FROM notes WHERE patient_id = ? ORDER BY note_date DESC, created_at DESC`,
    [patientId]
  );
}

export async function getEncountersByPatient(patientId: string): Promise<Encounter[]> {
  const db = await getDb();
  return await db.select<Encounter[]>(
    `SELECT * FROM encounters WHERE patient_id = ? ORDER BY admission_date DESC`,
    [patientId]
  );
}

export async function deleteEncounter(encounterId: string): Promise<void> {
  const db = await getDb();
  // Delete all notes belonging to this encounter first, then the encounter itself
  await db.execute(`DELETE FROM notes WHERE encounter_id = ?`, [encounterId]);
  await db.execute(`DELETE FROM encounters WHERE id = ?`, [encounterId]);
}

export async function getAllNotes(): Promise<NoteWithPatient[]> {
  const db = await getDb();
  return await db.select<NoteWithPatient[]>(
    `SELECT
       n.*,
       p.first_name,
       p.last_name,
       p.dob,
       p.sex,
       p.mrn
     FROM notes n
     JOIN patients p ON p.id = n.patient_id
     ORDER BY n.note_date DESC, n.created_at DESC`
  );
}

export async function getNoteById(noteId: string): Promise<Note | null> {
  const db = await getDb();
  const rows = await db.select<Note[]>(
    `SELECT * FROM notes WHERE id = ?`,
    [noteId]
  );
  return rows[0] ?? null;
}

export async function deleteNote(noteId: string): Promise<void> {
  const db = await getDb();
  await db.execute(`DELETE FROM notes WHERE id = ?`, [noteId]);
}

export async function createRevision(originalNoteId: string): Promise<Note | null> {
  const original = await getNoteById(originalNoteId);
  if (!original) return null;

  const db = await getDb();
  const revision: Note = {
    id:               uuid(),
    patient_id:       original.patient_id,
    encounter_id:     original.encounter_id, // Phase 7
    note_date:        original.note_date,
    admission_date:   original.admission_date,
    status:           "draft",
    version:          original.version + 1,
    parent_note_id:   original.id,
    anthro:           original.anthro,
    labs:             original.labs,
    clinical:         original.clinical,
    dietary:          original.dietary,
    dexa_scans:       original.dexa_scans,
    diagnosis:        original.diagnosis,
    intervention:     original.intervention,
    monitor_evaluate: original.monitor_evaluate,
    standards:        original.standards,
    refeeding_screen: original.refeeding_screen,
    patient_history:  original.patient_history,
    created_at:       new Date().toISOString(),
    submitted_at:     null,
  };

  await db.execute(
    `INSERT INTO notes
       (id, patient_id, encounter_id, note_date, admission_date, status, version,
        parent_note_id, anthro, labs, clinical, dietary, dexa_scans,
        diagnosis, intervention, monitor_evaluate, standards,
        refeeding_screen, patient_history, created_at, submitted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      revision.id, revision.patient_id, revision.encounter_id, revision.note_date, revision.admission_date,
      revision.status, revision.version, revision.parent_note_id,
      revision.anthro, revision.labs, revision.clinical, revision.dietary, revision.dexa_scans,
      revision.diagnosis, revision.intervention, revision.monitor_evaluate, revision.standards,
      revision.refeeding_screen, revision.patient_history, revision.created_at, revision.submitted_at,
    ]
  );

  return revision;
}

// ─── Submission requirement commands ─────────────────────────────────────────

export async function getSubmissionRequirements(): Promise<SubmissionRequirement[]> {
  const db = await getDb();
  const rows = await db.select<Array<Omit<SubmissionRequirement, "required"> & { required: number }>>(
    `SELECT * FROM submission_requirements ORDER BY id`
  );
  return rows.map(r => ({ ...r, required: r.required === 1 }));
}

export async function updateSubmissionRequirement(
  fieldKey: string,
  required: boolean
): Promise<void> {
  const db = await getDb();
  await db.execute(
    `UPDATE submission_requirements SET required = ? WHERE field_key = ?`,
    [required ? 1 : 0, fieldKey]
  );
}

/**
 * Phase 6: Add a new submission requirement (for extensibility via Settings UI).
 */
export async function addSubmissionRequirement(
  fieldKey: string,
  label: string
): Promise<void> {
  const db = await getDb();
  await db.execute(
    `INSERT OR IGNORE INTO submission_requirements (field_key, label, required, created_at)
     VALUES (?, ?, 1, ?)`,
    [fieldKey, label, new Date().toISOString()]
  );
  }

  // ─── User Preset commands ─────────────────────────────────────────────────────

  export interface UserPreset {
  id: string;
  name: string;
  /** JSON-serialised string[] of catalog slug keys */
  lab_keys: string;
  created_at: string;
  }

  /**
  * Fetch all saved lab presets, ordered by creation time.
  * Returns a typed array ready for useLabsStore.setUserPresets().
  */
  export async function getLabPresets(): Promise<import("../../types").LabPreset[]> {
  const db = await getDb();
  const rows = await db.select<UserPreset[]>(
    `SELECT * FROM user_presets ORDER BY created_at ASC`
  );
  return rows.map((r) => ({
    id:      r.id,
    name:    r.name,
    labKeys: JSON.parse(r.lab_keys) as string[],
  }));
  }

  /**
  * Persist a new preset.
  * Called immediately after useLabsStore.saveCurrentViewAsPreset() returns
  * so the in-memory and DB states stay in sync.
  */
  export async function insertLabPreset(
  preset: import("../../types").LabPreset
  ): Promise<void> {
  const db = await getDb();
  await db.execute(
    `INSERT INTO user_presets (id, name, lab_keys, created_at)
     VALUES (?, ?, ?, ?)`,
    [
      preset.id,
      preset.name,
      JSON.stringify(preset.labKeys),
      new Date().toISOString(),
    ]
  );
  }

  /**
  * Remove a preset by ID.
  * Called immediately after useLabsStore.deletePreset() so both layers stay
  * in sync without a full re-fetch.
  */
  export async function deleteLabPreset(presetId: string): Promise<void> {
  const db = await getDb();
  await db.execute(`DELETE FROM user_presets WHERE id = ?`, [presetId]);
  }

  /**
  * Rename an existing preset in place.
  * Not currently surfaced in the UI but provided for future Settings page use.
  */
  export async function renameLabPreset(
  presetId: string,
  newName: string
  ): Promise<void> {
  const db = await getDb();
  await db.execute(
    `UPDATE user_presets SET name = ? WHERE id = ?`,
    [newName, presetId]
  );
  }

  // ─── Enteral Formula commands ────────────────────────────────────────────────

  import type { EnteralFormula, EnteralFormulaInput } from "../../types";

  export async function getAllFormulas(): Promise<EnteralFormula[]> {
  const db = await getDb();
  const rows = await db.select<any[]>(
    `SELECT * FROM enteral_formulas ORDER BY name ASC`
  );
  return rows.map(dbRowToFormula);
  }

  export async function createFormula(input: EnteralFormulaInput): Promise<EnteralFormula> {
  const db = await getDb();
  const id = uuid();
  const now = new Date().toISOString();
  await db.execute(
    `INSERT INTO enteral_formulas
      (id, name, manufacturer, kcal_per_ml, protein_g_per_l, fat_g_per_l,
       cho_g_per_l, fiber_total_g_per_l, fiber_soluble_g_per_l,
       fiber_insoluble_g_per_l, free_water_pct, osmolality,
       na_mg_per_l, k_mg_per_l, phos_mg_per_l, mg_mg_per_l,
       route, notes, is_seeded, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
    [id, input.name, input.manufacturer ?? "",
     n(input.kcal_per_ml), n(input.protein_g_per_l), n(input.fat_g_per_l),
     n(input.cho_g_per_l), n(input.fiber_total_g_per_l), n(input.fiber_soluble_g_per_l),
     n(input.fiber_insoluble_g_per_l), n(input.free_water_pct), n(input.osmolality),
     n(input.na_mg_per_l), n(input.k_mg_per_l), n(input.phos_mg_per_l), n(input.mg_mg_per_l),
     input.route ?? "", input.notes ?? "", now]
  );
  return { id, ...input, is_seeded: false, created_at: now } as EnteralFormula;
  }

  export async function updateFormula(
  id: string,
  input: Partial<EnteralFormulaInput>
  ): Promise<void> {
  const db = await getDb();
  const fields = Object.keys(input) as (keyof EnteralFormulaInput)[];
  if (fields.length === 0) return;
  const setClauses = fields.map((f) => `${f} = ?`).join(", ");
  const values = fields.map((f) => {
    const v = input[f];
    return v === undefined ? null : v;
  });
  await db.execute(
    `UPDATE enteral_formulas SET ${setClauses} WHERE id = ?`,
    [...values, id]
  );
  }

  export async function deleteFormula(id: string): Promise<void> {
  const db = await getDb();
  await db.execute(`DELETE FROM enteral_formulas WHERE id = ?`, [id]);
  }

  // Helper: null-safe number coercion
  function n(v: number | null | undefined): number | null {
  if (v === null || v === undefined || isNaN(Number(v))) return null;
  return Number(v);
  }

  // Helper: map DB row → typed EnteralFormula
  function dbRowToFormula(row: any): EnteralFormula {
  return {
    id:                     row.id,
    name:                   row.name,
    manufacturer:           row.manufacturer ?? "",
    kcal_per_ml:            row.kcal_per_ml ?? null,
    protein_g_per_l:        row.protein_g_per_l ?? null,
    fat_g_per_l:            row.fat_g_per_l ?? null,
    cho_g_per_l:            row.cho_g_per_l ?? null,
    fiber_total_g_per_l:    row.fiber_total_g_per_l ?? null,
    fiber_soluble_g_per_l:  row.fiber_soluble_g_per_l ?? null,
    fiber_insoluble_g_per_l: row.fiber_insoluble_g_per_l ?? null,
    free_water_pct:         row.free_water_pct ?? null,
    osmolality:             row.osmolality ?? null,
    na_mg_per_l:            row.na_mg_per_l ?? null,
    k_mg_per_l:             row.k_mg_per_l ?? null,
    phos_mg_per_l:          row.phos_mg_per_l ?? null,
    mg_mg_per_l:            row.mg_mg_per_l ?? null,
    route:                  (row.route ?? "") as EnteralFormula["route"],
    notes:                  row.notes ?? "",
    is_seeded:              row.is_seeded === 1,
    created_at:             row.created_at,
  };
  }

// ─── Hospital Diet commands ───────────────────────────────────────────────────

export async function getAllDiets(): Promise<HospitalDiet[]> {
  const db = await getDb();
  return await db.select<HospitalDiet[]>(
    `SELECT * FROM hospital_diets ORDER BY sort_order ASC, name ASC`
  );
}

export async function createDiet(input: HospitalDietInput): Promise<HospitalDiet> {
  const db = await getDb();
  const id = uuid();
  const now = new Date().toISOString();
  await db.execute(
    `INSERT INTO hospital_diets (id, name, sort_order, created_at)
     VALUES (?, ?, ?, ?)`,
    [id, input.name, input.sort_order, now]
  );
  return { id, ...input, created_at: now };
}

export async function updateDiet(id: string, input: Partial<HospitalDietInput>): Promise<void> {
  const db = await getDb();
  const fields = Object.keys(input) as (keyof HospitalDietInput)[];
  if (fields.length === 0) return;
  const setClauses = fields.map(f => `${f} = ?`).join(", ");
  const values = fields.map(f => input[f]);
  await db.execute(
    `UPDATE hospital_diets SET ${setClauses} WHERE id = ?`,
    [...values, id]
  );
}

export async function deleteDiet(id: string): Promise<void> {
  const db = await getDb();
  await db.execute(`DELETE FROM hospital_diets WHERE id = ?`, [id]);
}

// ─── Dysphagia Modification commands ─────────────────────────────────────────

export async function getAllDysphagiaeMods(): Promise<HospitalDysphagiaMode[]> {
  const db = await getDb();
  const rows = await db.select<any[]>(
    `SELECT * FROM hospital_dysphagia_mods ORDER BY sort_order ASC, name ASC`
  );
  return rows.map(r => ({
    ...r,
    category: (r.category ?? "Food") as "Food" | "Liquid" | "Other",
  }));
}

export async function createDysphagiaeMod(input: HospitalDysphagiaModInput): Promise<HospitalDysphagiaMode> {
  const db = await getDb();
  const id = uuid();
  const now = new Date().toISOString();
  await db.execute(
    `INSERT INTO hospital_dysphagia_mods (id, name, category, sort_order, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [id, input.name, input.category ?? "Food", input.sort_order, now]
  );
  return { id, ...input, created_at: now };
}

export async function updateDysphagiaeMod(id: string, input: Partial<HospitalDysphagiaModInput>): Promise<void> {
  const db = await getDb();
  const fields = Object.keys(input) as (keyof HospitalDysphagiaModInput)[];
  if (fields.length === 0) return;
  const setClauses = fields.map(f => `${f} = ?`).join(", ");
  const values = fields.map(f => input[f]);
  await db.execute(
    `UPDATE hospital_dysphagia_mods SET ${setClauses} WHERE id = ?`,
    [...values, id]
  );
}

export async function deleteDysphagiaeMod(id: string): Promise<void> {
  const db = await getDb();
  await db.execute(`DELETE FROM hospital_dysphagia_mods WHERE id = ?`, [id]);
}