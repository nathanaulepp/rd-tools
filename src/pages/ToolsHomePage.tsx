import React from "react";

interface ToolsHomePageProps {
  handleExitToStart: () => void;
}

export default function ToolsHomePage({ handleExitToStart }: ToolsHomePageProps) {
  return (
    <div className="generic-page">
      <header className="page-header">
        <button className="back-btn" onClick={handleExitToStart}>← Back to Home</button>
        <h2>Dietitian Tools & Calculators</h2>
      </header>
      <div className="page-content">
        <p>Access standalone calculators, references, and guidelines here...</p>
      </div>
    </div>
  );
}