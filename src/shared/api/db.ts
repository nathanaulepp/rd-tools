// src/shared/api/db.ts
// Phase 7: Encounter (Admission) Domain Layer
//   • encounters table added to group notes by hospital stay
//   • Idempotent migration links legacy notes via patient_id + admission_date
//   • admission_date is now primarily an Encounter attribute

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
    { name: "Low Na (2g)" },
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
      sort_order  INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT NOT NULL
    )
  `);

  const defaultDysphagiaMods = [
    "Food (Level 7 — Regular)",
    "Food (Level 6 — Soft & Bite-Sized)",
    "Food (Level 5 — Minced & Moist)",
    "Food (Level 4 — Pureed)",
    "Food (Level 3 — Liquidized)",
    "Liquid (Level 4 — Extremely Thick)",
    "Liquid (Level 3 — Moderately Thick)",
    "Liquid (Level 2 — Mildly Thick)",
    "Liquid (Level 1 — Slightly Thick)",
    "Liquid (Level 0 — Thin Liquids)",
    "NPO — Dysphagia",
  ];

  const dysphagiaMobCount = await db.select<{ count: number }[]>(
    `SELECT COUNT(*) as count FROM hospital_dysphagia_mods`
  );
  if (dysphagiaMobCount[0].count === 0) {
    for (let i = 0; i < defaultDysphagiaMods.length; i++) {
      await db.execute(
        `INSERT INTO hospital_dysphagia_mods (id, name, sort_order, created_at)
         VALUES (?, ?, ?, ?)`,
        [uuid(), defaultDysphagiaMods[i], i, new Date().toISOString()]
      );
    }
  }

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
  sort_order: number;
  created_at: string;
}

export interface HospitalDysphagiaModInput {
  name: string;
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
    dietOrder:                (dietaryData.dietOrder as string)              ?? null,
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
  return await db.select<HospitalDysphagiaMode[]>(
    `SELECT * FROM hospital_dysphagia_mods ORDER BY sort_order ASC, name ASC`
  );
}

export async function createDysphagiaeMod(input: HospitalDysphagiaModInput): Promise<HospitalDysphagiaMode> {
  const db = await getDb();
  const id = uuid();
  const now = new Date().toISOString();
  await db.execute(
    `INSERT INTO hospital_dysphagia_mods (id, name, sort_order, created_at)
     VALUES (?, ?, ?, ?)`,
    [id, input.name, input.sort_order, now]
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