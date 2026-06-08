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

  const now = new Date().toISOString();
  const defaultRequirements = [
    { field_key: "first_name",     label: "First Name" },
    { field_key: "last_name",      label: "Last Name"  },
    { field_key: "dob",            label: "Date of Birth" },
    { field_key: "sex",            label: "Sex" },
    { field_key: "note_date",      label: "Note Date"  },
    { field_key: "diagnosis",      label: "Nutrition Diagnosis (PES)" },
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
    created_at:       new Date().toISOString(),
    submitted_at:     null,
  };

  await db.execute(
    `INSERT INTO notes
       (id, patient_id, encounter_id, note_date, admission_date, status, version,
        parent_note_id, anthro, labs, clinical, dietary, dexa_scans,
        diagnosis, intervention, monitor_evaluate, standards,
        created_at, submitted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      note.id, note.patient_id, note.encounter_id, note.note_date, note.admission_date,
      note.status, note.version, note.parent_note_id,
      note.anthro, note.labs, note.clinical, note.dietary, note.dexa_scans,
      note.diagnosis, note.intervention, note.monitor_evaluate, note.standards,
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
    | "refeeding_screen" | "note_date" | "admission_date",
  data: object | string
): Promise<void> {
  const db = await getDb();

  const jsonDomains = [
    "anthro", "labs", "clinical", "dietary", "dexa_scans",
    "diagnosis", "intervention", "monitor_evaluate", "standards",
    "refeeding_screen"
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

  const fieldValues: Record<string, string | null> = {
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

    // Clinical domain (from note.clinical JSON)
    chiefComplaint:           (clinicalData.chiefComplaint as string)        ?? null,
    medHx:                    (clinicalData.medHx as string)                 ?? null,
    familyHx:                 (clinicalData.familyHx as string)              ?? null,
    socialHx:                 (clinicalData.socialHx as string)              ?? null,
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
    chewing:                  (clinicalData.chewing as string)               ?? null,
    swallowing:               (clinicalData.swallowing as string)            ?? null,
    imaging_smi:              (clinicalData.imaging_smi as string)           ?? null,
    tempMax:                  (clinicalData.tempMax as string)               ?? null,
    ve:                       (clinicalData.ve as string)                    ?? null,
    fev1:                     (clinicalData.fev1 as string)                  ?? null,
    tbsa:                     (clinicalData.tbsa as string)                  ?? null,
    clinicalNotes:            (clinicalData.clinicalNotes as string)         ?? null,

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

    // Diagnosis (from note.diagnosis JSON)
    problem:                  (diagnosisData.problem as string)              ?? null,
    etiology:                 (diagnosisData.etiology as string)             ?? null,
    signsSymptoms:            (diagnosisData.signsSymptoms as string)        ?? null,
    nutritionDxNarrative:     (diagnosisData.nutritionDxNarrative as string) ?? null,
    priorityRanking:          (diagnosisData.priorityRanking as string)      ?? null,

    // Intervention (from note.intervention JSON)
    goalStatement:            (interventionData.goalStatement as string)     ?? null,
    interventionNotes:        (interventionData.interventionNotes as string) ?? null,

    // Monitor & Evaluate (from note.monitor_evaluate JSON)
    monitorFrequency:         (meData.monitorFrequency as string)            ?? null,
    monitoredBy:              (meData.monitoredBy as string)                 ?? null,
    outcome_progress:         (meData.outcome_progress as string)            ?? null,
    dischargeRecs:            (meData.dischargeRecs as string)               ?? null,
    meNotes:                  (meData.meNotes as string)                     ?? null,

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
    created_at:       new Date().toISOString(),
    submitted_at:     null,
  };

  await db.execute(
    `INSERT INTO notes
       (id, patient_id, encounter_id, note_date, admission_date, status, version,
        parent_note_id, anthro, labs, clinical, dietary, dexa_scans,
        diagnosis, intervention, monitor_evaluate, standards,
        refeeding_screen, created_at, submitted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      revision.id, revision.patient_id, revision.encounter_id, revision.note_date, revision.admission_date,
      revision.status, revision.version, revision.parent_note_id,
      revision.anthro, revision.labs, revision.clinical, revision.dietary, revision.dexa_scans,
      revision.diagnosis, revision.intervention, revision.monitor_evaluate, revision.standards,
      revision.refeeding_screen, revision.created_at, revision.submitted_at,
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