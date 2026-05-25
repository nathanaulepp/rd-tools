import React from "react";
import ReferenceLibrary from "../features/reference-library/ReferenceLibrary";

interface ReferenceLayoutProps {
  handleExitToStart: () => void;
}

export default function ReferenceLayout({ handleExitToStart }: ReferenceLayoutProps) {
  return (
    <div
      className="generic-page"
      style={{
        padding: "1.5rem",
        height: "100vh",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <header
        className="page-header"
        style={{ display: "flex", alignItems: "center", gap: "1.5rem", marginBottom: "1rem" }}
      >
        <button className="btn-outline" onClick={handleExitToStart}>← Back to Home</button>
        <h2 style={{ margin: 0, color: "var(--primary)" }}>Clinical Reference Library Engine</h2>
      </header>
      <div className="page-content" style={{ flex: 1, overflow: "hidden" }}>
        <ReferenceLibrary />
      </div>
    </div>
  );
}