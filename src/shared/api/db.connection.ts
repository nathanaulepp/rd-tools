// src/shared/api/db.connection.ts
// Singleton DB connection + schema initialisation.
// All seed functions are imported from their dedicated modules to keep this
// file focused on structure, not data.

import Database from "@tauri-apps/plugin-sql";
import { seedEquationEngine } from "./seed/db.seed.equations";
import { seedEnteralFormulas } from "./seed/db.seed.formulas";
import { seedHospitalDiets } from "./seed/db.seed.diets";
import { seedHospitalDysphagiaeMods } from "./seed/db.seed.dysphagia";

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
    { name: "patient_history",  type: "TEXT" },
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

    const existing = await db.select<any[]>(
      `SELECT id FROM encounters WHERE patient_id = ? AND admission_date = ?`,
      [note.patient_id, note.admission_date]
    );

    let eid: string;
    if (existing.length > 0) {
      eid = existing[0].id;
    } else {
      eid = crypto.randomUUID();
      await db.execute(
        `INSERT INTO encounters (id, patient_id, admission_date, created_at)
         VALUES (?, ?, ?, ?)`,
        [eid, note.patient_id, note.admission_date, new Date().toISOString()]
      );
    }

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

  // Hospital diet list
  await db.execute(`
    CREATE TABLE IF NOT EXISTS hospital_diets (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      sort_order  INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT NOT NULL
    )
  `);

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
    await db.execute(
      `UPDATE submission_requirements SET label = ? WHERE field_key = ?`,
      [req.label, req.field_key]
    );
  }

  // Run all seed functions
  await seedEnteralFormulas(db);
  await seedHospitalDiets(db);
  await seedHospitalDysphagiaeMods(db);
  await seedEquationEngine(db);
}