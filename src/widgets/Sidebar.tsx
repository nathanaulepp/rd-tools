// src/widgets/Sidebar.tsx
// Phase 5: Reads useUIStore directly for navigation state. No props for routing.
// Actions like onExitRequest and onSubmitClick are still passed from the page shell.

import React from "react";
import { useUIStore }  from "../stores/useUIStore";
import { useNoteStore } from "../stores/useNoteStore";
import { useCalculatedMetrics } from "../stores/useCalculatedMetrics";

import {
  DIETARY_CATEGORIES,
  ASSESSMENT_CATEGORIES,
  BIOCHEMICAL_CATEGORIES,
  CLINICAL_CATEGORIES,
} from "../shared/constants/adimeSideBarCategories";

export type DomainKey = "A" | "B" | "C" | "D" | "S" | "Dx" | "I" | "ME";

const DOMAIN_LABELS: Record<DomainKey, string> = {
  A:  "Anthropometrics",
  B:  "Biochemical",
  C:  "Clinical",
  D:  "Dietary",
  S:  "Nutrition Standards",
  Dx: "Nutrition Diagnosis",
  I:  "Intervention",
  ME: "Monitor & Evaluate",
};

const SINGLE_DOMAINS: { key: DomainKey; label: string }[] = [
  { key: "Dx", label: "Dx. Nutrition Diagnosis" },
  { key: "I",  label: "I. Intervention" },
  { key: "ME", label: "ME. Monitor & Evaluate" },
];

interface SidebarProps {
  onSubmitClick: () => void;
  onExitRequest: () => void;
}

export default function Sidebar({
  onSubmitClick,
  onExitRequest,
}: SidebarProps) {
  const { activeDomain, activeSubDomain, setActiveDomain, setActiveSubDomain, sidebarOpen, setSidebarOpen } = useUIStore();
  const noteStatus = useNoteStore((s) => s.noteStatus);
  const calculatedMetrics = useCalculatedMetrics();

  const isSubmitted = noteStatus === "submitted";

  // Filter out A6-A7 for adults (ageDays >= 7305)
  const assessmentCategories = ASSESSMENT_CATEGORIES.filter((cat) => {
    if (cat.id === "A6-A7") {
      return (calculatedMetrics.ageDays ?? 0) < 7305;
    }
    return true;
  });

  const handleDomainClick = (domain: DomainKey) => {
    setActiveDomain(domain);
    if (window.innerWidth <= 768) setSidebarOpen(false);
  };

  return (
    <nav className={`sidebar ${sidebarOpen ? "open" : ""}`}>
      <div className="sidebar-header">
        RD Workstation
        <button className="close-sidebar-btn" onClick={() => setSidebarOpen(false)}>
          ×
        </button>
      </div>

      {/* Assessment section label */}
      <SectionLabel>Assessment</SectionLabel>

      <div className="nav-section">
        {/* A — Anthropometrics */}
        <NavItem
          label="A. Anthropometrics"
          active={activeDomain === "A"}
          onClick={() => handleDomainClick("A")}
        />
        {activeDomain === "A" && (
          <div className="sub-nav">
            {assessmentCategories.map((cat) => (
              <SubNavItem
                key={cat.id}
                label={cat.title}
                active={activeSubDomain === cat.id}
                onClick={() => setActiveSubDomain(cat.id)}
              />
            ))}
          </div>
        )}

        {/* B — Biochemical */}
        <NavItem
          label="B. Biochemical Data"
          active={activeDomain === "B"}
          onClick={() => handleDomainClick("B")}
        />
        {activeDomain === "B" && (
          <div className="sub-nav">
            {BIOCHEMICAL_CATEGORIES.map((cat) => (
              <SubNavItem
                key={cat.id}
                label={cat.title}
                active={activeSubDomain === cat.id}
                onClick={() => setActiveSubDomain(cat.id)}
              />
            ))}
          </div>
        )}

        {/* C — Clinical */}
        <NavItem
          label="C. Clinical &amp; NFPE"
          active={activeDomain === "C"}
          onClick={() => handleDomainClick("C")}
        />
        {activeDomain === "C" && (
          <div className="sub-nav">
            {CLINICAL_CATEGORIES.map((cat) => (
              <SubNavItem
                key={cat.id}
                label={cat.title}
                active={activeSubDomain === cat.id}
                onClick={() => setActiveSubDomain(cat.id)}
              />
            ))}
          </div>
        )}

        {/* D — Dietary */}
        <NavItem
          label="D. Dietary Data"
          active={activeDomain === "D"}
          onClick={() => handleDomainClick("D")}
        />
        {activeDomain === "D" && (
          <div className="sub-nav">
            {DIETARY_CATEGORIES.map((cat) => (
              <SubNavItem
                key={cat.id}
                label={cat.title}
                active={activeSubDomain === cat.id}
                onClick={() => setActiveSubDomain(cat.id)}
              />
            ))}
          </div>
        )}

        {/* S — Standards */}
        <NavItem
          label="Comparative Standards"
          active={activeDomain === "S"}
          onClick={() => handleDomainClick("S")}
        />

        {/* Diagnosis & Planning section label */}
        <SectionLabel>Diagnosis &amp; Planning</SectionLabel>

        {SINGLE_DOMAINS.map(({ key, label }) => (
          <NavItem
            key={key}
            label={label}
            active={activeDomain === key}
            onClick={() => handleDomainClick(key)}
          />
        ))}

        {/* Submit / Exit controls */}
        <div
          style={{
            margin: "1rem 0.75rem 0.5rem",
            borderTop: "1px solid rgba(255,255,255,0.1)",
            paddingTop: "0.75rem",
          }}
        >
          {isSubmitted ? (
            <div
              style={{
                background: "rgba(46,204,113,0.15)",
                border: "1px solid rgba(46,204,113,0.4)",
                borderRadius: "8px",
                padding: "0.6rem 0.75rem",
                fontSize: "0.78rem",
                color: "#2ecc71",
                fontWeight: 700,
                textAlign: "center",
              }}
            >
              ✓ Note Submitted
            </div>
          ) : (
            <button
              onClick={onSubmitClick}
              style={{
                width: "100%",
                padding: "0.6rem",
                background: "#e74c3c",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontSize: "0.83rem",
                fontWeight: 700,
                cursor: "pointer",
                letterSpacing: "0.02em",
              }}
            >
              Submit Note
            </button>
          )}

          <button
            onClick={onExitRequest}
            style={{
              width: "100%",
              marginTop: "0.75rem",
              padding: "0.6rem",
              background: "rgba(255,255,255,0.1)",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: "8px",
              fontSize: "0.8rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            ⚙ App Settings
          </button>
        </div>
      </div>
    </nav>
  );
}

// ── Small helpers ─────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        margin: "0.5rem 0.75rem 0.25rem",
        fontSize: "0.62rem",
        fontWeight: 800,
        color: "#64748b",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
      }}
    >
      {children}
    </div>
  );
}

function NavItem({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <div
      className={`nav-item ${active ? "active" : ""}`}
      onClick={onClick}
      dangerouslySetInnerHTML={{ __html: label }}
    />
  );
}

function SubNavItem({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <div
      className={`sub-nav-item ${active ? "active" : ""}`}
      onClick={onClick}
    >
      {label}
    </div>
  );
}