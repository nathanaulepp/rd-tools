// src/widgets/RouteRenderer.tsx
// Pure rendering switch: maps ViewState → page component.
// All state comes from stores; no props needed from App.tsx.

import React from "react";
import { useUIStore }  from "../stores/useUIStore";
import { useNoteStore } from "../stores/useNoteStore";
import { ErrorBoundary, DevErrorPanel } from "../shared/ui/ErrorBoundary";

import StartPage           from "../pages/StartPage";
import NoteListPage        from "../pages/NoteListPage";
import CreateNotePage      from "../pages/CreateNotePage";
import ClinicalSummaryView from "../pages/ClinicalSummaryView";
import ToolsHomePage       from "../pages/ToolsHomePage";
import PatientGatePage     from "../pages/PatientGatePage";
import SettingsPage        from "../pages/SettingsPage";

// Helper: wrap a page in ErrorBoundary + DevErrorPanel
function wrap(label: string, node: React.ReactNode) {
  return (
    <>
      <ErrorBoundary label={label}>{node}</ErrorBoundary>
      <DevErrorPanel />
    </>
  );
}

export default function RouteRenderer() {
  const currentView = useUIStore((s) => s.currentView);
  const { setCurrentView, theme, setTheme, zoomLevel, setZoomLevel, logout } =
    useUIStore();
  const { activePatient, activeNote, handleOpenNote, handleExitToStart } =
    useNoteStore();

  switch (currentView) {
    case "START":
      return (
        <>
          <StartPage
            setCurrentView={setCurrentView}
            handleLogout={logout}
            zoomLevel={zoomLevel}
            setZoomLevel={setZoomLevel}
            theme={theme}
            setTheme={setTheme}
          />
          <DevErrorPanel />
        </>
      );

    case "PATIENT_GATE":
      return (
        <>
          <PatientGatePage
            onEnterWorkspace={handleOpenNote}
            onCancel={() => setCurrentView("START")}
          />
          <DevErrorPanel />
        </>
      );

    case "VIEW_NOTES":
      return wrap(
        "NoteListPage",
        <NoteListPage
          handleExitToStart={handleExitToStart}
          onOpenNote={handleOpenNote}
        />
      );

    case "CREATE_NOTE":
      return wrap("CreateNotePage", <CreateNotePage />);

    case "VIEW_SUMMARY":
      if (!activePatient || !activeNote) return null;
      return wrap(
        "ClinicalSummaryView",
        <ClinicalSummaryView
          patient={activePatient}
          note={activeNote}
          handleExitToStart={handleExitToStart}
        />
      );

    case "TOOLS":
      return (
        <>
          <ToolsHomePage handleExitToStart={handleExitToStart} />
          <DevErrorPanel />
        </>
      );

    case "SETTINGS":
      return wrap(
        "SettingsPage",
        <SettingsPage handleExitToStart={handleExitToStart} />
      );

    default:
      return (
        <>
          <StartPage
            setCurrentView={setCurrentView}
            handleLogout={logout}
            zoomLevel={zoomLevel}
            setZoomLevel={setZoomLevel}
            theme={theme}
            setTheme={setTheme}
          />
          <DevErrorPanel />
        </>
      );
  }
}