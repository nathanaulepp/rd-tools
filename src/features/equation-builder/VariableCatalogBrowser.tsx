import { useState, useEffect, useRef } from "react";
import { VARIABLE_CATALOG } from "../../shared/utils/equation-engine/variableCatalog";
import type { VariableCatalogEntry } from "../../types/equationEngine";

interface VariableCatalogBrowserProps {
  onInsert: (slug: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const DOMAIN_ORDER = [
  "Anthropometrics",
  "Demographics",
  "Derived Metrics",
  "Clinical",
  "Clinical Assessments",
  "Biochemical",
] as const;

export default function VariableCatalogBrowser({
  onInsert,
  isOpen,
  onClose,
}: VariableCatalogBrowserProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    "Anthropometrics": false,
    "Demographics": false,
    "Derived Metrics": true,
    "Clinical": false,
    "Clinical Assessments": false,
    "Biochemical": false,
  });

  const panelRef = useRef<HTMLDivElement>(null);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;

    function handleMouseDown(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleMouseDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, [isOpen, onClose]);

  const toggleSection = (domain: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [domain]: !prev[domain],
    }));
  };

  const filteredEntries = VARIABLE_CATALOG.filter(entry => {
    const s = searchTerm.toLowerCase();
    return (
      entry.slug.toLowerCase().includes(s) ||
      entry.displayName.toLowerCase().includes(s)
    );
  });

  const isSearching = searchTerm.trim().length > 0;

  // Render a single variable row
  const renderRow = (entry: VariableCatalogEntry, idx: number) => {
    const isEven = idx % 2 === 0;
    return (
      <div
        key={entry.slug}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "6px 8px",
          background: isEven ? "#f8fafc" : "#ffffff",
          borderBottom: "1px solid #f1f5f9",
          fontSize: "0.78rem",
          gap: "8px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{
              fontFamily: "monospace",
              color: "#0f172a",
              fontWeight: 600,
              wordBreak: "break-all"
            }}>
              {entry.slug}
            </span>
            {entry.unit && (
              <span style={{
                background: "#e2e8f0",
                color: "#475569",
                borderRadius: "4px",
                padding: "1px 4px",
                fontSize: "0.62rem",
                fontWeight: 700,
                whiteSpace: "nowrap",
              }}>
                {entry.unit}
              </span>
            )}
          </div>
          <span style={{ color: "#64748b", fontSize: "0.72rem", marginTop: "2px" }}>
            {entry.displayName}
          </span>
        </div>

        <button
          onClick={() => onInsert(entry.slug)}
          title="Insert Slug"
          style={{
            background: "#0ea5e9",
            border: "none",
            borderRadius: "4px",
            color: "#fff",
            fontWeight: 700,
            fontSize: "0.7rem",
            padding: "2px 6px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onMouseOver={e => e.currentTarget.style.background = "#0284c7"}
          onMouseOut={e => e.currentTarget.style.background = "#0ea5e9"}
        >
          [+]
        </button>
      </div>
    );
  };

  return (
    <div
      ref={panelRef}
      style={{
        position: "absolute",
        bottom: "calc(100% + 4px)",
        right: 0,
        width: "320px",
        maxHeight: "400px",
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
        zIndex: 100,
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
      }}
    >
      {/* Search Input Container */}
      <div style={{ padding: "8px", borderBottom: "1px solid #e2e8f0" }}>
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Search variables..."
          style={{
            width: "100%",
            padding: "6px 8px",
            border: "1px solid #cbd5e1",
            borderRadius: "4px",
            fontSize: "0.78rem",
            boxSizing: "border-box",
            outline: "none",
          }}
        />
      </div>

      {/* Variables List */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {isSearching ? (
          // Flat list for search results
          <div>
            {filteredEntries.map((entry, idx) => renderRow(entry, idx))}
            {filteredEntries.length === 0 && (
              <div style={{ padding: "12px", textAlign: "center", color: "#94a3b8", fontSize: "0.78rem" }}>
                No matching variables.
              </div>
            )}
          </div>
        ) : (
          // Grouped by domains
          DOMAIN_ORDER.map(domain => {
            const domainEntries = VARIABLE_CATALOG.filter(e => e.domain === domain);
            if (domainEntries.length === 0) return null;

            const isExpanded = expandedSections[domain] ?? false;

            return (
              <div key={domain} style={{ display: "flex", flexDirection: "column" }}>
                {/* Domain Section Header */}
                <div
                  onClick={() => toggleSection(domain)}
                  style={{
                    padding: "6px 8px",
                    background: "#f1f5f9",
                    borderBottom: "1px solid #e2e8f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                    userSelect: "none",
                  }}
                >
                  <span style={{
                    fontSize: "0.65rem",
                    fontWeight: 800,
                    color: "#475569",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}>
                    {domain} ({domainEntries.length})
                  </span>
                  <span style={{ fontSize: "0.6rem", color: "#64748b" }}>
                    {isExpanded ? "▼" : "▶"}
                  </span>
                </div>

                {/* Domain Rows */}
                {isExpanded && (
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {domainEntries.map((entry, idx) => renderRow(entry, idx))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
