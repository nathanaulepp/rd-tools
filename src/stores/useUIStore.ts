// src/stores/useUIStore.ts
// Global UI state: routing, auth, theme, zoom, sidebar, toast.
// Replaces the scattered useState calls in App.tsx and CreateNotePage.tsx.

import { create } from "zustand";

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

  // ── Theme ────────────────────────────────────────────────────────────────────
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;

  // ── Zoom ─────────────────────────────────────────────────────────────────────
  zoomLevel: number;
  setZoomLevel: (zoom: number) => void;

  // ── Sidebar (mobile) ──────────────────────────────────────────────────────────
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;

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
    // Clear active note session on logout
    import("./useNoteStore").then(({ useNoteStore }) => {
      useNoteStore.getState()._clearNote();
    });
  },

  // ── Routing ─────────────────────────────────────────────────────────────────
  currentView: "LOGIN",
  setCurrentView: (view) => set({ currentView: view }),

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