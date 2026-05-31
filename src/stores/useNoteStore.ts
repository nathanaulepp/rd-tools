// src/stores/useNoteStore.ts
// Active session: which patient + note is open, and autosave coordination.
// This replaces the activePatient*, handleOpenNote, resetNoteState, saveAllDomains
// logic that currently lives in App.tsx and CreateNotePage.tsx.

import { create } from "zustand";
import type { Patient, Note } from "../shared/api/db";
import type { PatientData } from "../types";
import { autosaveNote } from "../shared/api/db";
import { getLocalIsoDate } from "../shared/utils/date";

// Domain store reset functions — each domain store registers itself here
// so useNoteStore can call them all when a new note is loaded.
type ResetFn = (raw: string | null) => void;
const _domainResets: Map<string, ResetFn> = new Map();

export function registerDomainReset(key: string, fn: ResetFn) {
  _domainResets.set(key, fn);
}

// Domain store save functions — each domain store registers a "get current value" fn
type GetFn = () => unknown;
const _domainGetters: Map<string, GetFn> = new Map();

export function registerDomainGetter(key: string, fn: GetFn) {
  _domainGetters.set(key, fn);
}

// Autosave column keys that map to Note DB columns
export type AutosaveKey =
  | "anthro"
  | "labs"
  | "clinical"
  | "dietary"
  | "dexa_scans"
  | "diagnosis"
  | "intervention"
  | "monitor_evaluate"
  | "standards"
  | "note_date"
  | "admission_date";

interface NoteState {
  // Active session
  patientId: string | null;
  noteId: string | null;
  patient: Patient | null;
  note: Note | null;
  noteStatus: "draft" | "submitted";

  // Patient header editable fields
  patientData: PatientData;
  setPatientData: (data: PatientData) => void;

  // Session lifecycle
  openNote: (patientId: string, noteId: string, patient: Patient, note: Note) => void;
  clearNote: () => void;

  // Autosave
  isSaving: boolean;
  saveDomain: (dbKey: AutosaveKey, value: unknown) => Promise<boolean>;
  saveAllDomains: () => Promise<boolean>;
}

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

export const useNoteStore = create<NoteState>((set, get) => ({
  patientId: null,
  noteId: null,
  patient: null,
  note: null,
  noteStatus: "draft",
  patientData: defaultPatientData,
  isSaving: false,

  setPatientData: (data) => set({ patientData: data }),

  openNote: (patientId, noteId, patient, note) => {
    // Populate patientData from patient + note
    const patientData: PatientData = {
      lastName: patient.last_name,
      firstName: patient.first_name,
      dob: patient.dob,
      sex: patient.sex ?? "",
      mrn: patient.mrn ?? "",
      admissionDate: note.admission_date ?? getLocalIsoDate(),
      noteDate: note.note_date ?? getLocalIsoDate(),
      languages: patient.languages ?? "",
    };

    set({
      patientId,
      noteId,
      patient,
      note,
      noteStatus: note.status as "draft" | "submitted",
      patientData,
    });

    // Reset every registered domain store with its raw JSON from the note
    const noteRecord = note as Record<string, string | null>;
    _domainResets.forEach((resetFn, key) => {
      resetFn(noteRecord[key] ?? null);
    });
  },

  clearNote: () => {
    set({
      patientId: null,
      noteId: null,
      patient: null,
      note: null,
      noteStatus: "draft",
      patientData: defaultPatientData,
    });
  },

  saveDomain: async (dbKey, value) => {
    const { noteId } = get();
    if (!noteId) return true;

    set({ isSaving: true });
    try {
      await autosaveNote(noteId, dbKey as any, value as any);
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
      const entries = Array.from(_domainGetters.entries());
      for (const [key, getFn] of entries) {
        await autosaveNote(noteId, key as any, getFn() as any);
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