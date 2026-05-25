import React, { useState } from "react";
type ViewState = "START" | "VIEW_NOTES" | "CREATE_NOTE" | "TOOLS" | "RESOURCES";

const [currentView, setCurrentView] = useState<ViewState>("");

export const handleExitToStart = () => {
    // Add warning prompt ONLY if leaving the Create Note screen
    if (currentView === "CREATE_NOTE") {
      const confirmExit = window.confirm("Are you sure you want to exit? Any unsaved changes will be lost.");
      if (!confirmExit) return; // Cancel exit if user clicks 'Cancel'
    }
    setCurrentView("START");
  };