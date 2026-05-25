import React from "react";

interface NoteListPageProps {
  handleExitToStart: () => void;
}

export default function NoteListPage({ handleExitToStart }: NoteListPageProps) {
  return (
    <div className="generic-page">
      <header className="page-header">
        <button className="back-btn" onClick={handleExitToStart}>← Back to Home</button>
        <h2>Past ADIME Notes</h2>
      </header>
      <div className="page-content">
        <p>Select a patient to view their historical ADIME notes...</p>
      </div>
    </div>
  );
}