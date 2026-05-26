// src/shared/api/db.ts
// Phase 2: Database foundation for RD Workstation
// Uses tauri-plugin-sql v2 with SQLite backend.
// All SQL runs from the frontend via the plugin's Database class.
// lib.rs requires no changes.

import Database from "@tauri-apps/plugin-sql";

// ─── Singleton connection ─────────────────────────────────────────────────────
// We open the database once and reuse the connection throughout the app lifetime.
// The file is stored in Tauri's app data directory automatically.

let _db: Database | null = null;

export async function getDb(): Promise<Database> {
  if (_db) return _db;
  _db = await Database.load("sqlite:rd_workstation.db");
  await initSchema(_db);
  return _db;
}

// ─── Schema initialization ────────────────────────────────────────────────────
// Runs on every app launch. All statements use IF NOT EXISTS so they are safe
// to run repeatedly — they only create tables on the very first launch.

async function initSchema(db: Database): Promise<void> {
  // patients: demographic information that persists across notes
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

  // notes: one row per ADIME note, domains stored as JSON blobs
  // parent_note_id links a revision back to the note it was based on
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

  // submission_requirements: which fields must be present before a note can be
  // submitted. Seeded with initial rules; updatable without code changes later.
  await db.execute(`
    CREATE TABLE IF NOT EXISTS submission_requirements (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      field_key   TEXT NOT NULL UNIQUE,
      label       TEXT NOT NULL,
      required    INTEGER NOT NULL DEFAULT 1,
      created_at  TEXT NOT NULL
    )
  `);

  // Seed default requirements — INSERT OR IGNORE means this only runs once
  const now = new Date().toISOString();
  const defaultRequirements = [
    { field_key: "first_name", label: "First Name" },
    { field_key: "last_name",  label: "Last Name"  },
    { field_key: "dob",        label: "Date of Birth" },
    { field_key: "note_date",  label: "Note Date"  },
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
// crypto.randomUUID() is available in Tauri's WebView context.

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
  anthro: string | null;        // JSON string, parsed by caller
  labs: string | null;
  clinical: string | null;
  dietary: string | null;
  dexa_scans: string | null;
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
  missingFields: string[];  // human-readable labels of missing required fields
}

// ─── Patient commands ─────────────────────────────────────────────────────────

/**
 * Insert a new patient row and return the created patient.
 */
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
    [
      patient.id,
      patient.first_name,
      patient.last_name,
      patient.dob,
      patient.sex,
      patient.mrn,
      patient.languages,
      patient.created_at,
    ]
  );

  return patient;
}

/**
 * Return all patients ordered by last name for dropdowns and list views.
 */
export async function getAllPatients(): Promise<Patient[]> {
  const db = await getDb();
  return await db.select<Patient[]>(
    `SELECT * FROM patients ORDER BY last_name, first_name`
  );
}

/**
 * Return a single patient by id.
 */
export async function getPatientById(id: string): Promise<Patient | null> {
  const db = await getDb();
  const rows = await db.select<Patient[]>(
    `SELECT * FROM patients WHERE id = ?`,
    [id]
  );
  return rows[0] ?? null;
}

/**
 * Delete a patient and all their associated notes.
 * This is a destructive operation used for cleaning up duplicates
 * or removing records for patients who are no longer under care.
 */
export async function deletePatient(patientId: string): Promise<void> {
  const db = await getDb();
  // Delete associated notes first to respect foreign key constraints
  // (though not strictly required if FK enforcement is off, it's good practice)
  await db.execute(`DELETE FROM notes WHERE patient_id = ?`, [patientId]);
  await db.execute(`DELETE FROM patients WHERE id = ?`, [patientId]);
}

// ─── Note commands ────────────────────────────────────────────────────────────

/**
 * Create a blank draft note for a patient and return it.
 * Called immediately after the patient is selected/created in the gate screen.
 */
export async function createNote(payload: {
  patient_id: string;
  note_date?: string;
  admission_date?: string;
}): Promise<Note> {
  const db = await getDb();
  const today = new Date().toISOString().split("T")[0];

  const note: Note = {
    id:             uuid(),
    patient_id:     payload.patient_id,
    note_date:      payload.note_date      ?? today,
    admission_date: payload.admission_date ?? today,
    status:         "draft",
    version:        1,
    parent_note_id: null,
    anthro:         null,
    labs:           null,
    clinical:       null,
    dietary:        null,
    dexa_scans:     null,
    created_at:     new Date().toISOString(),
    submitted_at:   null,
  };

  await db.execute(
    `INSERT INTO notes
       (id, patient_id, note_date, admission_date, status, version,
        parent_note_id, anthro, labs, clinical, dietary, dexa_scans,
        created_at, submitted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      note.id,
      note.patient_id,
      note.note_date,
      note.admission_date,
      note.status,
      note.version,
      note.parent_note_id,
      note.anthro,
      note.labs,
      note.clinical,
      note.dietary,
      note.dexa_scans,
      note.created_at,
      note.submitted_at,
    ]
  );

  return note;
}

/**
 * Auto-save a single domain column for an existing note.
 * domain: "anthro" | "labs" | "clinical" | "dietary" | "dexa_scans"
 *         | "note_date" | "admission_date"
 *
 * For JSON domains (anthro, labs, clinical, dietary, dexa_scans),
 * pass the raw state object — this function will stringify it.
 * For scalar fields (note_date, admission_date), pass the string value directly.
 *
 * Called on every sub-domain switch in CreateNotePage.
 */
export async function autosaveNote(
  noteId: string,
  domain: "anthro" | "labs" | "clinical" | "dietary" | "dexa_scans" | "note_date" | "admission_date",
  data: object | string
): Promise<void> {
  const db = await getDb();

  // JSON domains get stringified; scalar fields are stored as-is
  const jsonDomains = ["anthro", "labs", "clinical", "dietary", "dexa_scans"];
  const value = jsonDomains.includes(domain)
    ? JSON.stringify(data)
    : (data as string);

  // Dynamic column name is safe here because domain is a controlled union type,
  // never user-supplied freeform input.
  await db.execute(
    `UPDATE notes SET ${domain} = ? WHERE id = ?`,
    [value, noteId]
  );
}

/**
 * Run submission validation, then mark the note as submitted if it passes.
 * Returns a SubmissionCheckResult so the UI can show specific missing fields.
 *
 * Checks required fields from submission_requirements table against the
 * current patient row and note row — so requirements are data-driven.
 */
export async function submitNote(
  noteId: string,
  patientId: string
): Promise<SubmissionCheckResult> {
  const db = await getDb();

  // Load current requirements
  const requirements = await db.select<SubmissionRequirement[]>(
    `SELECT * FROM submission_requirements WHERE required = 1`
  );

  // Load patient and note for field checking
  const patient = await getPatientById(patientId);
  const noteRows = await db.select<Note[]>(
    `SELECT * FROM notes WHERE id = ?`,
    [noteId]
  );
  const note = noteRows[0] ?? null;

  if (!patient || !note) {
    return { valid: false, missingFields: ["Patient or note not found"] };
  }

  // Map field_key → actual value from patient or note
  const fieldValues: Record<string, string | null> = {
    first_name:     patient.first_name,
    last_name:      patient.last_name,
    dob:            patient.dob,
    note_date:      note.note_date,
    admission_date: note.admission_date,
  };

  const missingFields: string[] = [];
  for (const req of requirements) {
    const val = fieldValues[req.field_key];
    if (!val || val.trim() === "") {
      missingFields.push(req.label);
    }
  }

  if (missingFields.length > 0) {
    return { valid: false, missingFields };
  }

  // All requirements met — mark submitted
  await db.execute(
    `UPDATE notes SET status = 'submitted', submitted_at = ? WHERE id = ?`,
    [new Date().toISOString(), noteId]
  );

  return { valid: true, missingFields: [] };
}

/**
 * Return all notes for a specific patient, newest first.
 * Used for the NoteListPage "by patient" view.
 */
export async function getNotesByPatient(patientId: string): Promise<Note[]> {
  const db = await getDb();
  return await db.select<Note[]>(
    `SELECT * FROM notes WHERE patient_id = ? ORDER BY note_date DESC, created_at DESC`,
    [patientId]
  );
}

/**
 * Return all notes joined with patient name, newest first.
 * Used for the NoteListPage "by date" view.
 */
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

/**
 * Return a single fully-loaded note by id.
 * JSON domain columns are returned as raw strings — parse them in the caller
 * with JSON.parse() before loading into React state.
 */
export async function getNoteById(noteId: string): Promise<Note | null> {
  const db = await getDb();
  const rows = await db.select<Note[]>(
    `SELECT * FROM notes WHERE id = ?`,
    [noteId]
  );
  return rows[0] ?? null;
}

/**
 * Delete a single note by id.
 */
export async function deleteNote(noteId: string): Promise<void> {
  const db = await getDb();
  await db.execute(`DELETE FROM notes WHERE id = ?`, [noteId]);
}

/**
 * Clone a submitted note into a new draft for revision.
 * The new note has:
 *   - a fresh id and created_at
 *   - status = "draft"
 *   - version = original version + 1
 *   - parent_note_id = original note id
 *   - all domain data copied from the original
 *   - submitted_at = null
 *
 * Returns the new draft note so the UI can open it in the ADIME workspace.
 */
export async function createRevision(originalNoteId: string): Promise<Note | null> {
  const original = await getNoteById(originalNoteId);
  if (!original) return null;

  const db = await getDb();
  const revision: Note = {
    id:             uuid(),
    patient_id:     original.patient_id,
    note_date:      original.note_date,
    admission_date: original.admission_date,
    status:         "draft",
    version:        original.version + 1,
    parent_note_id: original.id,
    anthro:         original.anthro,
    labs:           original.labs,
    clinical:       original.clinical,
    dietary:        original.dietary,
    dexa_scans:     original.dexa_scans,
    created_at:     new Date().toISOString(),
    submitted_at:   null,
  };

  await db.execute(
    `INSERT INTO notes
       (id, patient_id, note_date, admission_date, status, version,
        parent_note_id, anthro, labs, clinical, dietary, dexa_scans,
        created_at, submitted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      revision.id,
      revision.patient_id,
      revision.note_date,
      revision.admission_date,
      revision.status,
      revision.version,
      revision.parent_note_id,
      revision.anthro,
      revision.labs,
      revision.clinical,
      revision.dietary,
      revision.dexa_scans,
      revision.created_at,
      revision.submitted_at,
    ]
  );

  return revision;
}

// ─── Submission requirement commands ─────────────────────────────────────────

/**
 * Return all submission requirements for display in settings or
 * for use during submission validation.
 */
export async function getSubmissionRequirements(): Promise<SubmissionRequirement[]> {
  const db = await getDb();
  const rows = await db.select<Array<Omit<SubmissionRequirement, "required"> & { required: number }>>(
    `SELECT * FROM submission_requirements ORDER BY id`
  );
  // SQLite stores booleans as integers; normalize to boolean
  return rows.map(r => ({ ...r, required: r.required === 1 }));
}

/**
 * Toggle a field's required status.
 * Used in a future settings UI to update submission rules without code changes.
 */
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