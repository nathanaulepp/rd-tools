// src/stores/useUIStore.ts
// Phase 5: Added activeDomain / activeSubDomain so CreateNotePage and Sidebar
// no longer need those as local useState. All domain routing is global UI state.

import { create } from "zustand";
import type { DomainKey } from "../widgets/Sidebar";

export type ViewState =
  | "LOGIN"
  | "START"
  | "PATIENT_GATE"
  | "VIEW_NOTES"
  | "CREATE_NOTE"
  | "VIEW_SUMMARY"
  | "TOOLS"
  | "SETTINGS";

interface ToastEntry {
  id: number;
  message: string;
}

interface UIState {
  // ── Auth ────────────────────────────────────────────────────────────────────
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;

  // ── Routing ─────────────────────────────────────────────────────────────────
  currentView: ViewState;
  setCurrentView: (view: ViewState) => void;

  // ── Domain navigation (Phase 5: moved out of CreateNotePage) ─────────────
  activeDomain: DomainKey;
  activeSubDomain: string;
  setActiveDomain: (domain: DomainKey) => void;
  setActiveSubDomain: (sub: string) => void;

  // ── Theme ────────────────────────────────────────────────────────────────────
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;

  // ── Zoom ─────────────────────────────────────────────────────────────────────
  zoomLevel: number;
  setZoomLevel: (zoom: number) => void;

  // ── Sidebar (mobile) ──────────────────────────────────────────────────────────
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;

  // ── Modals (Phase 5) ───────────────────────────────────────────────────────────
  submitModalOpen: boolean;
  setSubmitModalOpen: (open: boolean) => void;
  exitModalOpen: boolean;
  setExitModalOpen: (open: boolean) => void;

  // ── Toast — global notification system ───────────────────────────────────────
  toasts: ToastEntry[];
  showToast: (message: string, durationMs?: number) => void;
  _removeToast: (id: number) => void;
}

let _toastId = 0;

export const useUIStore = create<UIState>((set, get) => ({
  // ── Auth ────────────────────────────────────────────────────────────────────
  isAuthenticated: false,

  login: () => {
    set({ isAuthenticated: true });
    get().setCurrentView("START");
  },

  logout: () => {
    set({ isAuthenticated: false });
    get().setCurrentView("LOGIN");
    import("./useNoteStore").then(({ useNoteStore }) => {
      useNoteStore.getState()._clearNote();
    });
  },

  // ── Routing ─────────────────────────────────────────────────────────────────
  currentView: "LOGIN",
  setCurrentView: (view) => set({ currentView: view }),

  // ── Domain navigation ────────────────────────────────────────────────────────
  activeDomain: "A",
  activeSubDomain: "A1-A7",

  setActiveDomain: (domain) => {
    const defaultSub: Partial<Record<DomainKey, string>> = {
      A: "A1-A7",
      B: "B1",
      C: "C1",
      D: "D1",
    };
    set({
      activeDomain: domain,
      activeSubDomain: defaultSub[domain] ?? "",
    });
  },

  setActiveSubDomain: (sub) => set({ activeSubDomain: sub }),

  // ── Theme — persisted to localStorage ────────────────────────────────────────
  theme: (() => {
    const saved = localStorage.getItem("ui-theme");
    return (saved as "light" | "dark") || "light";
  })(),

  setTheme: (theme) => {
    localStorage.setItem("ui-theme", theme);
    document.body.className = theme === "dark" ? "dark-theme" : "";
    set({ theme });
  },

  // ── Zoom — persisted to localStorage ─────────────────────────────────────────
  zoomLevel: (() => {
    const saved = localStorage.getItem("ui-zoom");
    return saved ? parseFloat(saved) : 1;
  })(),

  setZoomLevel: (zoom) => {
    localStorage.setItem("ui-zoom", zoom.toString());
    document.documentElement.style.fontSize = `${17.6 * zoom}px`;
    set({ zoomLevel: zoom });
  },

  // ── Sidebar ──────────────────────────────────────────────────────────────────
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  // ── Modals ────────────────────────────────────────────────────────────────────
  submitModalOpen: false,
  setSubmitModalOpen: (open) => set({ submitModalOpen: open }),
  exitModalOpen: false,
  setExitModalOpen: (open) => set({ exitModalOpen: open }),

  // ── Toast ─────────────────────────────────────────────────────────────────────
  toasts: [],

  showToast: (message, durationMs = 3000) => {
    const id = ++_toastId;
    set((state) => ({ toasts: [...state.toasts, { id, message }] }));
    setTimeout(() => get()._removeToast(id), durationMs);
  },

  _removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));