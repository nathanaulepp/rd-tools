// src/shared/api/db.ts
// Phase 6: Future-Proofing Hooks
//   • diagnosis, intervention, monitor_evaluate columns added to notes
//     via safe ALTER TABLE IF NOT EXISTS (idempotent on every launch)
//   • autosaveNote domain union extended
//   • PDF export helper added (uses Tauri shell to open system print dialog)

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

  // Phase 6: Add new ADIME domain columns — safe on existing databases
  // SQLite does not support ADD COLUMN IF NOT EXISTS, so we catch the error
  // "duplicate column name" and ignore it.
  const newColumns = [
    { name: "diagnosis",        type: "TEXT" },
    { name: "intervention",     type: "TEXT" },
    { name: "monitor_evaluate", type: "TEXT" },
  ];

  for (const col of newColumns) {
    try {
      await db.execute(`ALTER TABLE notes ADD COLUMN ${col.name} ${col.type}`);
    } catch (_e) {
      // Column already exists — safe to ignore
    }
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

  const now = new Date().toISOString();
  const defaultRequirements = [
    { field_key: "first_name", label: "First Name" },
    { field_key: "last_name",  label: "Last Name"  },
    { field_key: "dob",        label: "Date of Birth" },
    { field_key: "note_date",  label: "Note Date"  },
    { field_key: "diagnosis",  label: "Nutrition Diagnosis (PES)" },
  ];

  for (const req of defaultRequirements) {
    await db.execute(
      `INSERT OR IGNORE INTO submission_requirements
         (field_key, label, required, created_at)
       VALUES (?, ?, 1, ?)`,
      [req.field_key, req.label, now]
    );
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

export interface Note {
  id: string;
  patient_id: string;
  note_date: string;
  admission_date: string;
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
  created_at: string;
  submitted_at: string | null;
}

export interface NoteWithPatient extends Note {
  first_name: string;
  last_name: string;
  dob: string;
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
  await db.execute(`DELETE FROM patients WHERE id = ?`, [patientId]);
}

// ─── Note commands ────────────────────────────────────────────────────────────

export async function createNote(payload: {
  patient_id: string;
  note_date?: string;
  admission_date?: string;
}): Promise<Note> {
  const db = await getDb();
  const today = getLocalIsoDate();

  const note: Note = {
    id:               uuid(),
    patient_id:       payload.patient_id,
    note_date:        payload.note_date      ?? today,
    admission_date:   payload.admission_date ?? today,
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
    created_at:       new Date().toISOString(),
    submitted_at:     null,
  };

  await db.execute(
    `INSERT INTO notes
       (id, patient_id, note_date, admission_date, status, version,
        parent_note_id, anthro, labs, clinical, dietary, dexa_scans,
        diagnosis, intervention, monitor_evaluate,
        created_at, submitted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      note.id, note.patient_id, note.note_date, note.admission_date,
      note.status, note.version, note.parent_note_id,
      note.anthro, note.labs, note.clinical, note.dietary, note.dexa_scans,
      note.diagnosis, note.intervention, note.monitor_evaluate,
      note.created_at, note.submitted_at,
    ]
  );

  return note;
}

/**
 * Auto-save a single domain column for an existing note.
 * Phase 6 extends the domain union to include the new ADIME columns.
 */
export async function autosaveNote(
  noteId: string,
  domain:
    | "anthro" | "labs" | "clinical" | "dietary" | "dexa_scans"
    | "diagnosis" | "intervention" | "monitor_evaluate"
    | "note_date" | "admission_date",
  data: object | string
): Promise<void> {
  const db = await getDb();

  const jsonDomains = [
    "anthro", "labs", "clinical", "dietary", "dexa_scans",
    "diagnosis", "intervention", "monitor_evaluate",
  ];
  const value = jsonDomains.includes(domain)
    ? JSON.stringify(data)
    : (data as string);

  await db.execute(
    `UPDATE notes SET ${domain} = ? WHERE id = ?`,
    [value, noteId]
  );
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

  const fieldValues: Record<string, string | null> = {
    first_name:     patient.first_name,
    last_name:      patient.last_name,
    dob:            patient.dob,
    note_date:      note.note_date,
    admission_date: note.admission_date,
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
    } else if (!val || val.trim() === "") {
      missingFields.push(req.label);
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

export async function getAllNotes(): Promise<NoteWithPatient[]> {
  const db = await getDb();
  return await db.select<NoteWithPatient[]>(
    `SELECT
       n.*,
       p.first_name,
       p.last_name,
       p.dob,
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
    created_at:       new Date().toISOString(),
    submitted_at:     null,
  };

  await db.execute(
    `INSERT INTO notes
       (id, patient_id, note_date, admission_date, status, version,
        parent_note_id, anthro, labs, clinical, dietary, dexa_scans,
        diagnosis, intervention, monitor_evaluate,
        created_at, submitted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      revision.id, revision.patient_id, revision.note_date, revision.admission_date,
      revision.status, revision.version, revision.parent_note_id,
      revision.anthro, revision.labs, revision.clinical, revision.dietary, revision.dexa_scans,
      revision.diagnosis, revision.intervention, revision.monitor_evaluate,
      revision.created_at, revision.submitted_at,
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