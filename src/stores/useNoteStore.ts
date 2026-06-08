// src/stores/useNoteStore.ts
// Active session: which patient + note is open, and autosave coordination.
// Owns handleOpenNote, handleExitToStart, and resetNoteState — previously in App.tsx.

import { create } from "zustand";
import type { Patient, Note } from "../shared/api/db";
import type { PatientData } from "../types";
import { autosaveNote, createNote, deleteNote } from "../shared/api/db";
import { getLocalIsoDate } from "../shared/utils/date";

// ── Domain store registration ─────────────────────────────────────────────────
// Each domain store calls registerDomainReset/registerDomainGetter at module
// load time so the note store can drive them without circular imports.

type ResetFn = (raw: string | null) => void;
const _domainResets: Map<string, ResetFn> = new Map();

export function registerDomainReset(key: string, fn: ResetFn) {
  _domainResets.set(key, fn);
}

type GetFn = () => unknown;
const _domainGetters: Map<string, GetFn> = new Map();

export function registerDomainGetter(key: string, fn: GetFn) {
  _domainGetters.set(key, fn);
}

// Autosave column keys that map directly to Note DB columns
export type AutosaveKey =
  | "anthro"
  | "labs"
  | "clinical"
  | "dietary"
  | "dexa_scans"
  | "diagnosis"
  | "refeeding_screen"
  | "intervention"
  | "monitor_evaluate"
  | "standards"
  | "note_date"
  | "admission_date";

// ── State interface ───────────────────────────────────────────────────────────

interface NoteState {
  // Active session identifiers
  patientId: string | null;
  noteId: string | null;
  activePatient: Patient | null;
  activeNote: Note | null;
  noteStatus: "draft" | "submitted";

  // Patient header editable fields (note date, admission date, etc.)
  patientData: PatientData;
  setPatientData: (data: PatientData) => void;

  // Session lifecycle — replaces App.tsx handleOpenNote / handleExitToStart
  handleOpenNote: (
    patientId: string,
    noteId: string,
    patient: Patient,
    note: Note
  ) => void;
  handleExitToStart: (skipConfirm?: boolean) => void;

  // Marks the active note as submitted (called after DB submit succeeds)
  markSubmitted: () => void;

  // Autosave
  isSaving: boolean;
  saveDomain: (dbKey: AutosaveKey, value: unknown) => Promise<boolean>;
  saveAllDomains: () => Promise<boolean>;

  // Internal — resets session to blank
  _clearNote: () => void;
}

// ── Default patient data ──────────────────────────────────────────────────────

const defaultPatientData: PatientData = {
  lastName: "",
  firstName: "",
  dob: "",
  sex: "",
  mrn: "",
  admissionDate: getLocalIsoDate(),
  noteDate: getLocalIsoDate(),
  languages: "",
};

// ── Store ─────────────────────────────────────────────────────────────────────

export const useNoteStore = create<NoteState>((set, get) => ({
  patientId: null,
  noteId: null,
  activePatient: null,
  activeNote: null,
  noteStatus: "draft",
  patientData: defaultPatientData,
  isSaving: false,

  setPatientData: (data) => set({ patientData: data }),

  markSubmitted: () => set({ noteStatus: "submitted" }),

  // ── handleOpenNote ─────────────────────────────────────────────────────────
  // Replaces the scattered activePatient*, resetNoteState logic in old App.tsx.
  // Called by PatientGatePage and NoteListPage when a note is selected.
  handleOpenNote: (patientId, noteId, patient, note) => {
    const patientData: PatientData = {
      lastName:      patient.last_name,
      firstName:     patient.first_name,
      dob:           patient.dob,
      sex:           patient.sex        ?? "",
      mrn:           patient.mrn        ?? "",
      admissionDate: note.admission_date ?? getLocalIsoDate(),
      noteDate:      note.note_date      ?? getLocalIsoDate(),
      languages:     patient.languages   ?? "",
    };

    set({
      patientId,
      noteId,
      activePatient: patient,
      activeNote: note,
      noteStatus: note.status as "draft" | "submitted",
      patientData,
    });

    // Reset every registered domain store with its raw JSON from the note
    const noteRecord = note as Record<string, string | null>;
    _domainResets.forEach((resetFn, key) => {
      resetFn(noteRecord[key] ?? null);
    });

    // Navigate — import lazily to avoid circular dep with RouteRenderer
    import("./useUIStore").then(({ useUIStore }) => {
      const view =
        note.status === "submitted" ? "VIEW_SUMMARY" : "CREATE_NOTE";
      useUIStore.getState().setCurrentView(view);
    });
  },

  // ── handleExitToStart ──────────────────────────────────────────────────────
  // Replaces the handleExitToStart in old App.tsx / CreateNotePage.
  handleExitToStart: (skipConfirm = false) => {
    const { noteStatus } = get();

    if (!skipConfirm && noteStatus !== "submitted") {
      const confirmed = window.confirm(
        "Are you sure you want to exit? Any unsaved changes will be lost."
      );
      if (!confirmed) return;
    }

    get()._clearNote();
    import("./useUIStore").then(({ useUIStore }) => {
      useUIStore.getState().setCurrentView("START");
    });
  },

  _clearNote: () =>
    set({
      patientId: null,
      noteId: null,
      activePatient: null,
      activeNote: null,
      noteStatus: "draft",
      patientData: defaultPatientData,
    }),

  // ── Autosave ───────────────────────────────────────────────────────────────

  saveDomain: async (dbKey, value) => {
    const { noteId } = get();
    if (!noteId) return true;

    set({ isSaving: true });
    try {
      await autosaveNote(noteId, dbKey as Parameters<typeof autosaveNote>[1], value as object);
      return true;
    } catch (e) {
      console.error(`Autosave failed for ${dbKey}:`, e);
      return false;
    } finally {
      set({ isSaving: false });
    }
  },

  saveAllDomains: async () => {
    const { noteId } = get();
    if (!noteId) return true;

    set({ isSaving: true });
    try {
      for (const [key, getFn] of _domainGetters.entries()) {
        await autosaveNote(
          noteId,
          key as Parameters<typeof autosaveNote>[1],
          getFn() as object
        );
      }
      return true;
    } catch (e) {
      console.error("Full save failed:", e);
      return false;
    } finally {
      set({ isSaving: false });
    }
  },
}));