// src/widgets/Sidebar.tsx
// Phase 5: Reads useUIStore directly for navigation state. No props for routing.
// Actions like onExitRequest and onSubmitClick are still passed from the page shell.

import React from "react";
import { useUIStore }  from "../stores/useUIStore";
import { useNoteStore } from "../stores/useNoteStore";
import { useCalculatedMetrics } from "../stores/useCalculatedMetrics";

import {
  DIETARY_CATEGORIES,
  CLINICAL_CATEGORIES
} from "../shared/constants/adimeSideBarCategories";

export type DomainKey = "A" | "B" | "C" | "D" | "S" | "Dx" | "I" | "ME" | "RF";

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
  const { 
    activeDomain, 
    activeSubDomain, 
    setActiveDomain, 
    setActiveSubDomain, 
    sidebarOpen, 
    setSidebarOpen,
    setCurrentView 
  } = useUIStore();
  const noteStatus = useNoteStore((s) => s.noteStatus);
  const calculatedMetrics = useCalculatedMetrics();

  const isSubmitted = noteStatus === "submitted";

  const isScrollingRef = React.useRef(false);
  const scrollTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    const domainSections = document.querySelectorAll<HTMLElement>("section[id^='domain-']");
    const subSections = document.querySelectorAll<HTMLElement>("div[id^='clinical-'], div[id^='dietary-']");
    if (!domainSections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (isScrollingRef.current) return;  // ignore during programmatic scroll

        const intersecting = entries.filter((e) => e.isIntersecting);
        if (intersecting.length === 0) return;

        // 1. Check top-level domain sections
        const domainEntries = intersecting.filter((e) => e.target.id.startsWith("domain-"));
        if (domainEntries.length > 0) {
          const bestDomain = domainEntries.sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
          const key = bestDomain.target.id.replace("domain-", "") as DomainKey;
          const currentDomain = useUIStore.getState().activeDomain;
          if (currentDomain !== key) {
            setActiveDomain(key);
          }
        }

        // 2. Check sub-domain sections
        const subEntries = intersecting.filter((e) => !e.target.id.startsWith("domain-"));
        if (subEntries.length > 0) {
          const bestSub = subEntries.sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
          const subId = bestSub.target.id;
          
          if (subId.startsWith("clinical-")) {
            const subKey = subId.replace("clinical-", "");
            const state = useUIStore.getState();
            if (state.activeDomain === "C" && state.activeSubDomain !== subKey) {
              setActiveSubDomain(subKey);
            }
          } else if (subId.startsWith("dietary-")) {
            const subKey = subId.replace("dietary-", "");
            const state = useUIStore.getState();
            if (state.activeDomain === "D" && state.activeSubDomain !== subKey) {
              setActiveSubDomain(subKey);
            }
          }
        }
      },
      {
        root: null,          // viewport
        rootMargin: "-20% 0px -60% 0px",  // fire when within top 20% to 40% of viewport
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1.0],
      }
    );

    domainSections.forEach((el) => observer.observe(el));
    subSections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [setActiveDomain, setActiveSubDomain]);

  React.useEffect(() => {
    return () => {
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    };
  }, []);

  const handleDomainClick = (domain: DomainKey) => {
    isScrollingRef.current = true;
    setActiveDomain(domain);
    if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    scrollTimerRef.current = setTimeout(() => {
      isScrollingRef.current = false;
    }, 1200); // clear after scroll animation completes (~800ms + buffer)
    if (window.innerWidth <= 768) setSidebarOpen(false);
  };

  const handleSubDomainClick = (subId: string) => {
    isScrollingRef.current = true;
    setActiveSubDomain(subId);
    if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    scrollTimerRef.current = setTimeout(() => {
      isScrollingRef.current = false;
    }, 1200); // clear after scroll animation completes (~800ms + buffer)
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


        {/* B — Biochemical */}
        <NavItem
          label="B. Biochemical Data"
          active={activeDomain === "B"}
          onClick={() => handleDomainClick("B")}
        />

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
                onClick={() => handleSubDomainClick(cat.id)}
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
                onClick={() => handleSubDomainClick(cat.id)}
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

        {/* Refeeding Screen */}
        <NavItem
          label="Refeeding Screen"
          active={activeDomain === "RF"}
          onClick={() => handleDomainClick("RF")}
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

        {/* Submit / Exit / Settings controls */}
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

          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
            <button
              onClick={() => setCurrentView("SETTINGS")}
              title="App Settings"
              style={{
                flex: 1,
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
              ⚙ Settings
            </button>
            <button
              onClick={onExitRequest}
              title="Exit Note"
              style={{
                flex: 1,
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
              Exit Note
            </button>
          </div>
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