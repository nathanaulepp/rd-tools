// src/shared/api/db.commands.ts
// All exported types, interfaces, and CRUD commands for the application.
// Schema initialisation and seeding live in db.connection.ts and db.seed.* files.

import { getDb } from "./db.connection";
import { getLocalIsoDate } from "../utils/date";
import { validatePES } from "../../features/diagnosis/etiologyData";
import type { EnteralFormula, EnteralFormulaInput, LabPreset } from "../../types";

// ─── Local Helpers ────────────────────────────────────────────────────────────

function tryParseJSON(raw: string | null): Record<string, any> {
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function uuid(): string {
  return crypto.randomUUID();
}

/** Null-safe number coercion for formula fields */
function n(v: number | null | undefined): number | null {
  if (v === null || v === undefined || isNaN(Number(v))) return null;
  return Number(v);
}

/** Map a raw DB row to a typed EnteralFormula */
function dbRowToFormula(row: any): EnteralFormula {
  return {
    id:                      row.id,
    name:                    row.name,
    manufacturer:            row.manufacturer ?? "",
    kcal_per_ml:             row.kcal_per_ml ?? null,
    protein_g_per_l:         row.protein_g_per_l ?? null,
    fat_g_per_l:             row.fat_g_per_l ?? null,
    cho_g_per_l:             row.cho_g_per_l ?? null,
    fiber_total_g_per_l:     row.fiber_total_g_per_l ?? null,
    fiber_soluble_g_per_l:   row.fiber_soluble_g_per_l ?? null,
    fiber_insoluble_g_per_l: row.fiber_insoluble_g_per_l ?? null,
    free_water_pct:          row.free_water_pct ?? null,
    osmolality:              row.osmolality ?? null,
    na_mg_per_l:             row.na_mg_per_l ?? null,
    k_mg_per_l:              row.k_mg_per_l ?? null,
    phos_mg_per_l:           row.phos_mg_per_l ?? null,
    mg_mg_per_l:             row.mg_mg_per_l ?? null,
    route:                   (row.route ?? "") as EnteralFormula["route"],
    notes:                   row.notes ?? "",
    is_seeded:               row.is_seeded === 1,
    created_at:              row.created_at,
  };
}

// ─── Types & Interfaces ───────────────────────────────────────────────────────

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

/** Phase 7: Encounter (Admission) — represents a single hospital stay. */
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
  encounter_id: string;
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

export interface UserPreset {
  id: string;
  name: string;
  /** JSON-serialised string[] of catalog slug keys */
  lab_keys: string;
  created_at: string;
}

// ─── Patient Commands ─────────────────────────────────────────────────────────

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
    sex:        payload.sex       ?? "",
    mrn:        payload.mrn       ?? "",
    languages:  payload.languages ?? "",
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
  return db.select<Patient[]>(
    `SELECT * FROM patients ORDER BY last_name, first_name`
  );
}

export async function getPatientById(id: string): Promise<Patient | null> {
  const db = await getDb();
  const rows = await db.select<Patient[]>(
    `SELECT * FROM patients WHERE id = ?`, [id]
  );
  return rows[0] ?? null;
}

export async function deletePatient(patientId: string): Promise<void> {
  const db = await getDb();
  await db.execute(`DELETE FROM notes WHERE patient_id = ?`, [patientId]);
  await db.execute(`DELETE FROM encounters WHERE patient_id = ?`, [patientId]);
  await db.execute(`DELETE FROM patients WHERE id = ?`, [patientId]);
}

// ─── Encounter Commands ───────────────────────────────────────────────────────

/**
 * Finds an existing encounter for a patient on a specific admission date,
 * or creates one if none exists.
 */
export async function getOrCreateEncounter(
  patientId: string,
  admissionDate: string
): Promise<string> {
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

export async function getEncountersByPatient(patientId: string): Promise<Encounter[]> {
  const db = await getDb();
  return db.select<Encounter[]>(
    `SELECT * FROM encounters WHERE patient_id = ? ORDER BY admission_date DESC`,
    [patientId]
  );
}

export async function deleteEncounter(encounterId: string): Promise<void> {
  const db = await getDb();
  await db.execute(`DELETE FROM notes WHERE encounter_id = ?`, [encounterId]);
  await db.execute(`DELETE FROM encounters WHERE id = ?`, [encounterId]);
}

// ─── Note Commands ────────────────────────────────────────────────────────────

export async function createNote(payload: {
  patient_id: string;
  note_date?: string;
  admission_date?: string;
}): Promise<Note> {
  const db = await getDb();
  const today = getLocalIsoDate();
  const admDate = payload.admission_date ?? today;

  const eid = await getOrCreateEncounter(payload.patient_id, admDate);

  const note: Note = {
    id:               uuid(),
    patient_id:       payload.patient_id,
    encounter_id:     eid,
    note_date:        payload.note_date ?? today,
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
      note.diagnosis, note.intervention, note.monitor_evaluate, note.standards,
      note.patient_history, note.created_at, note.submitted_at,
    ]
  );

  return note;
}

/**
 * Auto-save a single domain column for an existing note.
 * If `admission_date` is updated, the parent encounter record is synced too.
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
    "refeeding_screen", "patient_history",
  ];
  const value = jsonDomains.includes(domain)
    ? JSON.stringify(data)
    : (data as string);

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

/** Fetches the most recent note before the specified one in the same encounter. */
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

/** Returns true if the given note is the first one (by date/time) in its encounter. */
export async function isFirstEncounterNote(noteId: string): Promise<boolean> {
  const prev = await getPreviousNoteInEncounter(noteId);
  return prev === null;
}

/** Run submission validation, then mark the note as submitted if it passes. */
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
    `SELECT * FROM notes WHERE id = ?`, [noteId]
  );
  const note = noteRows[0] ?? null;

  if (!patient || !note) {
    return { valid: false, missingFields: ["Patient or note not found"] };
  }

  const clinicalData      = tryParseJSON(note.clinical);
  const dietaryData       = tryParseJSON(note.dietary);
  const anthroData        = tryParseJSON(note.anthro);
  const diagnosisData     = tryParseJSON(note.diagnosis);
  const interventionData  = tryParseJSON(note.intervention);
  const meData            = tryParseJSON(note.monitor_evaluate);
  const patientHistoryData= tryParseJSON(note.patient_history);

  const fieldValues: Record<string, any> = {
    // Patient table
    first_name:    patient.first_name,
    last_name:     patient.last_name,
    dob:           patient.dob,
    sex:           patient.sex,
    mrn:           patient.mrn,
    languages:     patient.languages,
    // Note table
    note_date:     note.note_date,
    admission_date:note.admission_date,
    // Patient History
    purposeOfVisit:    patientHistoryData.purposeOfVisit   ?? null,
    chiefComplaint:    patientHistoryData.chiefComplaint   ?? null,
    medHx:             patientHistoryData.medHx            ?? null,
    familyHx:          patientHistoryData.familyHx         ?? null,
    socialHx:          patientHistoryData.socialHx         ?? null,
    // Anthro
    ht:             anthroData.ht             ?? null,
    wt:             anthroData.wt             ?? null,
    ubw:            anthroData.ubw            ?? null,
    ubwDate:        anthroData.ubwDate        ?? null,
    waist:          anthroData.waist          ?? null,
    mac:            anthroData.mac            ?? null,
    calf:           anthroData.calf           ?? null,
    head:           anthroData.head           ?? null,
    triceps:        anthroData.triceps        ?? null,
    subscapular:    anthroData.subscapular    ?? null,
    suprailiac:     anthroData.suprailiac     ?? null,
    thigh:          anthroData.thigh          ?? null,
    edw:            anthroData.edw            ?? null,
    circUnit:       anthroData.circUnit       ?? null,
    past_ht:        anthroData.past_ht        ?? null,
    past_wt:        anthroData.past_wt        ?? null,
    past_head:      anthroData.past_head      ?? null,
    past_htDate:    anthroData.past_htDate    ?? null,
    past_wtDate:    anthroData.past_wtDate    ?? null,
    past_headDate:  anthroData.past_headDate  ?? null,
    amputations:    anthroData.amputations    ?? null,
    ampSegments:    anthroData.ampSegments    ?? null,
    dexaScans:      anthroData.dexaScans      ?? null,
    // Clinical
    allergiesIntolerances:      clinicalData.allergiesIntolerances      ?? null,
    medicalDevices:             clinicalData.medicalDevices              ?? null,
    medications:                clinicalData.medications                 ?? null,
    temp:                       clinicalData.temp                        ?? null,
    hr:                         clinicalData.hr                          ?? null,
    spo2:                       clinicalData.spo2                        ?? null,
    bp:                         clinicalData.bp                          ?? null,
    rr:                         clinicalData.rr                          ?? null,
    temples:                    clinicalData.temples                     ?? null,
    clavicles:                  clinicalData.clavicles                   ?? null,
    shoulders:                  clinicalData.shoulders                   ?? null,
    scapula:                    clinicalData.scapula                     ?? null,
    interosseous:               clinicalData.interosseous                ?? null,
    thighs:                     clinicalData.thighs                      ?? null,
    calves:                     clinicalData.calves                      ?? null,
    orbital:                    clinicalData.orbital                     ?? null,
    cheek:                      clinicalData.cheek                       ?? null,
    tricepsFat:                 clinicalData.tricepsFat                  ?? null,
    midAxillary:                clinicalData.midAxillary                 ?? null,
    pittingEdema:               clinicalData.pittingEdema                ?? null,
    pedalEdema:                 clinicalData.pedalEdema                  ?? null,
    ascites:                    clinicalData.ascites                     ?? null,
    gripStrength:               clinicalData.gripStrength                ?? null,
    giDistress:                 clinicalData.giDistress                  ?? null,
    giSymptoms:                 clinicalData.giSymptoms                  ?? null,
    stoolType:                  clinicalData.stoolType                   ?? null,
    dentition:                  clinicalData.dentition                   ?? null,
    swallowChewConcerns:        clinicalData.swallowChewConcerns         ?? null,
    nicheConditionFlags:        clinicalData.nicheConditionFlags         ?? null,
    imaging_smi:                clinicalData.imaging_smi                 ?? null,
    tempMax:                    clinicalData.tempMax                     ?? null,
    ve:                         clinicalData.ve                          ?? null,
    fev1:                       clinicalData.fev1                        ?? null,
    tbsa:                       clinicalData.tbsa                        ?? null,
    clinicalNotes:              clinicalData.clinicalNotes               ?? null,
    screenings:                 clinicalData.screenings                  ?? null,
    oralHygiene:                clinicalData.oralHygiene                 ?? null,
    edemaDescription:           clinicalData.edemaDescription            ?? null,
    imaging_muscleAttenuation:  clinicalData.imaging_muscleAttenuation   ?? null,
    imaging_imat:               clinicalData.imaging_imat                ?? null,
    imaging_vat:                clinicalData.imaging_vat                 ?? null,
    imaging_notes:              clinicalData.imaging_notes               ?? null,
    hair:                       clinicalData.hair                        ?? null,
    eyes:                       clinicalData.eyes                        ?? null,
    mouthLips:                  clinicalData.mouthLips                   ?? null,
    tongue:                     clinicalData.tongue                      ?? null,
    teethGums:                  clinicalData.teethGums                   ?? null,
    headNeck:                   clinicalData.headNeck                    ?? null,
    nails:                      clinicalData.nails                       ?? null,
    skin:                       clinicalData.skin                        ?? null,
    // Dietary
    dietOrder: Array.isArray(dietaryData.dietOrder)
      ? (dietaryData.dietOrder as string[]).join(", ")
      : (dietaryData.dietOrder ?? null),
    oralCalories:    dietaryData.oralCalories    ?? null,
    oralProtein:     dietaryData.oralProtein     ?? null,
    oralWater:       dietaryData.oralWater       ?? null,
    fluidIntake:     dietaryData.fluidIntake     ?? null,
    mealPatterns:    dietaryData.mealPatterns    ?? null,
    eeiPercent:      dietaryData.eeiPercent      ?? null,
    eeiTimeframe:    dietaryData.eeiTimeframe    ?? null,
    herbalCAM:       dietaryData.herbalCAM       ?? null,
    supplements:     dietaryData.supplements     ?? null,
    understanding:   dietaryData.understanding   ?? null,
    readiness:       dietaryData.readiness       ?? null,
    foodSecurity:    dietaryData.foodSecurity    ?? null,
    physicalLevel:   dietaryData.physicalLevel   ?? null,
    adls:            dietaryData.adls            ?? null,
    currentDiets:    dietaryData.currentDiets    ?? null,
    feedingTasks:    dietaryData.feedingTasks    ?? null,
    psychTies:       dietaryData.psychTies       ?? null,
    mealPrep:        dietaryData.mealPrep        ?? null,
    eatingOut:       dietaryData.eatingOut       ?? null,
    bingePurge:      dietaryData.bingePurge      ?? null,
    foodSupplies:    dietaryData.foodSupplies    ?? null,
    transport:       dietaryData.transport       ?? null,
    culturalReligious: dietaryData.culturalReligious ?? null,
    socialDynamics:  dietaryData.socialDynamics  ?? null,
    eatingEnv:       dietaryData.eatingEnv       ?? null,
    perception:      dietaryData.perception      ?? null,
    qolGoals:        dietaryData.qolGoals        ?? null,
    enState:         dietaryData.enState         ?? null,
    pnState:         dietaryData.pnState         ?? null,
    recall:          dietaryData.recall          ?? null,
    ivOrders:        dietaryData.ivOrders        ?? null,
    // Diagnosis
    problem:              diagnosisData.problem              ?? null,
    etiology:             diagnosisData.etiology             ?? null,
    signsSymptoms:        diagnosisData.signsSymptoms        ?? null,
    nutritionDxNarrative: diagnosisData.nutritionDxNarrative ?? null,
    priorityRanking:      diagnosisData.priorityRanking      ?? null,
    additionalDiagnoses:  diagnosisData.additionalDiagnoses  ?? null,
    // Intervention
    goalStatement:           interventionData.goalStatement              ?? null,
    interventionNotes:       interventionData.interventionNotes          ?? null,
    nd_mealsSnacks:          interventionData.nd_mealsSnacks             ?? null,
    nd_supplementalFeeding:  interventionData.nd_supplementalFeeding     ?? null,
    ed_purpose:              interventionData.ed_purpose                 ?? null,
    c_theory:                interventionData.c_theory                   ?? null,
    cc_followUpPlan:         interventionData.cc_followUpPlan            ?? null,
    npOral_energyKcal:       interventionData.npOral_energyKcal          ?? null,
    npOral_textureModification: interventionData.npOral_textureModification ?? null,
    npOral_oralSupplements:  interventionData.npOral_oralSupplements     ?? null,
    npOral_isNpo:            interventionData.npOral_isNpo               ?? null,
    npEnteral_formulaName:   interventionData.npEnteral_formulaName      ?? null,
    npEnteral_adminMethod:   interventionData.npEnteral_adminMethod      ?? null,
    npEnteral_kcalLow:       interventionData.npEnteral_kcalLow          ?? null,
    npEnteral_kcalHigh:      interventionData.npEnteral_kcalHigh         ?? null,
    npParenteral_energyKcal: interventionData.npParenteral_energyKcal    ?? null,
    npParenteral_solutionType: interventionData.npParenteral_solutionType ?? null,
    npIvFluid_solution:      interventionData.npIvFluid_solution         ?? null,
    goalTimeframe:           interventionData.goalTimeframe              ?? null,
    goalMeasurable:          interventionData.goalMeasurable             ?? null,
    npActiveModes:           interventionData.npActiveModes              ?? null,
    ndImplementation:        interventionData.ndImplementation           ?? null,
    // Monitor & Evaluate
    monitorFrequency:    meData.monitorFrequency   ?? null,
    monitoredBy:         meData.monitoredBy        ?? null,
    outcome_progress:    meData.outcome_progress   ?? null,
    dischargeRecs:       meData.dischargeRecs      ?? null,
    meNotes:             meData.meNotes            ?? null,
    criteria_anthropo:   meData.criteria_anthropo  ?? null,
    criteria_labs:       meData.criteria_labs      ?? null,
    criteria_dietary:    meData.criteria_dietary   ?? null,
    criteria_clinical:   meData.criteria_clinical  ?? null,
    criteria_functional: meData.criteria_functional ?? null,
    outcome_nextSteps:   meData.outcome_nextSteps  ?? null,
    transitionPlan:      meData.transitionPlan     ?? null,
    monitoredIndicators: meData.monitoredIndicators ?? null,
    // Raw diagnosis blob (used for special-case check below)
    diagnosis: note.diagnosis,
  };

  const missingFields: string[] = [];

  // 1. Basic field validation
  for (const req of requirements) {
    const val = fieldValues[req.field_key];

    if (req.field_key === "diagnosis") {
      try {
        const diagData = val ? JSON.parse(val) : null;
        if (!diagData || !diagData.problem || diagData.problem.trim() === "") {
          missingFields.push(req.label);
        }
      } catch {
        missingFields.push(req.label);
      }
      continue;
    }

    let isEmpty = false;
    if (val === null || val === undefined) {
      isEmpty = true;
    } else if (typeof val === "string") {
      isEmpty = val.trim() === "";
    } else if (Array.isArray(val)) {
      isEmpty = val.length === 0 || val.every(item => {
        if (!item) return true;
        if (typeof item === "string") return item.trim() === "";
        if (typeof item === "object") {
          return Object.values(item).every(v =>
            typeof v === "string" ? v.trim() === "" : !v
          );
        }
        return false;
      });
    } else if (typeof val === "object") {
      const values = Object.values(val);
      isEmpty = values.length === 0 || values.every(v => {
        if (Array.isArray(v)) return v.length === 0;
        if (typeof v === "string") return v.trim() === "";
        return !v;
      });
    }

    if (isEmpty) missingFields.push(req.label);
  }

  // 2. Deep PES / Etiology Domain validation
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
  return db.select<Note[]>(
    `SELECT * FROM notes WHERE patient_id = ? ORDER BY note_date DESC, created_at DESC`,
    [patientId]
  );
}

export async function getAllNotes(): Promise<NoteWithPatient[]> {
  const db = await getDb();
  return db.select<NoteWithPatient[]>(
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
    `SELECT * FROM notes WHERE id = ?`, [noteId]
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
    encounter_id:     original.encounter_id,
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
      revision.id, revision.patient_id, revision.encounter_id, revision.note_date,
      revision.admission_date, revision.status, revision.version, revision.parent_note_id,
      revision.anthro, revision.labs, revision.clinical, revision.dietary, revision.dexa_scans,
      revision.diagnosis, revision.intervention, revision.monitor_evaluate, revision.standards,
      revision.refeeding_screen, revision.patient_history, revision.created_at, revision.submitted_at,
    ]
  );

  return revision;
}

// ─── Submission Requirement Commands ─────────────────────────────────────────

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

// ─── Lab Preset Commands ──────────────────────────────────────────────────────

export async function getLabPresets(): Promise<LabPreset[]> {
  const db = await getDb();
  const rows = await db.select<UserPreset[]>(
    `SELECT * FROM user_presets ORDER BY created_at ASC`
  );
  return rows.map(r => ({
    id:      r.id,
    name:    r.name,
    labKeys: JSON.parse(r.lab_keys) as string[],
  }));
}

export async function insertLabPreset(preset: LabPreset): Promise<void> {
  const db = await getDb();
  await db.execute(
    `INSERT INTO user_presets (id, name, lab_keys, created_at)
     VALUES (?, ?, ?, ?)`,
    [preset.id, preset.name, JSON.stringify(preset.labKeys), new Date().toISOString()]
  );
}

export async function deleteLabPreset(presetId: string): Promise<void> {
  const db = await getDb();
  await db.execute(`DELETE FROM user_presets WHERE id = ?`, [presetId]);
}

export async function renameLabPreset(presetId: string, newName: string): Promise<void> {
  const db = await getDb();
  await db.execute(
    `UPDATE user_presets SET name = ? WHERE id = ?`,
    [newName, presetId]
  );
}

// ─── Enteral Formula Commands ─────────────────────────────────────────────────

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
    [
      id, input.name, input.manufacturer ?? "",
      n(input.kcal_per_ml), n(input.protein_g_per_l), n(input.fat_g_per_l),
      n(input.cho_g_per_l), n(input.fiber_total_g_per_l), n(input.fiber_soluble_g_per_l),
      n(input.fiber_insoluble_g_per_l), n(input.free_water_pct), n(input.osmolality),
      n(input.na_mg_per_l), n(input.k_mg_per_l), n(input.phos_mg_per_l), n(input.mg_mg_per_l),
      input.route ?? "", input.notes ?? "", now,
    ]
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
  const setClauses = fields.map(f => `${f} = ?`).join(", ");
  const values = fields.map(f => {
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

// ─── Hospital Diet Commands ───────────────────────────────────────────────────

export async function getAllDiets(): Promise<HospitalDiet[]> {
  const db = await getDb();
  return db.select<HospitalDiet[]>(
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

// ─── Dysphagia Modification Commands ─────────────────────────────────────────

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

export async function createDysphagiaeMod(
  input: HospitalDysphagiaModInput
): Promise<HospitalDysphagiaMode> {
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

export async function updateDysphagiaeMod(
  id: string,
  input: Partial<HospitalDysphagiaModInput>
): Promise<void> {
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