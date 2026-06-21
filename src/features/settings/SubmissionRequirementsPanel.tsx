import { useState, useEffect, useCallback, CSSProperties } from "react";
import {
  getSubmissionRequirements,
  updateSubmissionRequirement,
  addSubmissionRequirement,
  SubmissionRequirement,
} from "../../shared/api/db";
import { MASTER_DOMAINS } from "../../shared/constants/masterFieldRegistry";

interface SubmissionRequirementsPanelProps {
  showToast: (msg: string) => void;
}

export default function SubmissionRequirementsPanel({ showToast }: SubmissionRequirementsPanelProps) {
  const [requirements, setRequirements] = useState<SubmissionRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [activeDomainId, setActiveDomainId] = useState<string>("patient");

  const loadRequirements = useCallback(async () => {
    setLoading(true);
    try {
      setRequirements(await getSubmissionRequirements());
    } catch (e) {
      console.error("Failed to load requirements:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequirements();
  }, [loadRequirements]);

  const handleToggle = async (fieldKey: string, label: string, currentlyRequired: boolean) => {
    setSavingKey(fieldKey);
    try {
      await addSubmissionRequirement(fieldKey, label);
      await updateSubmissionRequirement(fieldKey, !currentlyRequired);
      await loadRequirements();
      showToast(`"${label}" updated ✓`);
    } catch (e) {
      console.error("Update failed:", e);
      showToast("⚠ Save failed");
    } finally {
      setSavingKey(null);
    }
  };

  const currentDomain = MASTER_DOMAINS.find(d => d.id === activeDomainId);

  return (
    <section style={s.section}>
      <div style={{ ...s.masterMenuHeader, borderBottom: '1px solid #e2e8f0', marginBottom: '0' }}>
        <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Step 1: Select Domain to Configure
        </span>
        <select 
          value={activeDomainId} 
          onChange={(e) => setActiveDomainId(e.target.value)}
          style={s.domainSelect}
        >
          {MASTER_DOMAINS.map(d => (
            <option key={d.id} value={d.id}>{d.title}</option>
          ))}
        </select>
      </div>

      <div style={s.fieldsList}>
        <div style={{ padding: '1rem 1.5rem 0.5rem', fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>
          Step 2: Toggle Mandatory Inputs
        </div>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Loading logic...</div>
        ) : currentDomain?.fields.map(f => {
          const req = requirements.find(r => r.field_key === f.key);
          const isRequired = req?.required ?? false;
          const isSaving = savingKey === f.key;
          const isLocked = (f as any).locked === true;

          return (
            <div key={f.key} style={s.fieldRow}>
              <div>
                <div style={s.fieldName}>{f.label}</div>
                <div style={s.fieldKey}>field: {f.key}</div>
              </div>
              <button
                onClick={() => !isLocked && handleToggle(f.key, f.label, isRequired)}
                disabled={isSaving || isLocked}
                title={isLocked ? "This field is always required and cannot be disabled" : undefined}
                style={{
                  ...s.toggleBtn,
                  background: isLocked ? "#e2e8f0" : isRequired ? "#27ae60" : "#f1f5f9",
                  color:      isLocked ? "#94a3b8" : isRequired ? "#fff" : "#64748b",
                  border:     isLocked ? "1px solid #cbd5e1" : isRequired ? "none" : "1px solid #cbd5e1",
                  cursor:     isLocked ? "not-allowed" : "pointer",
                }}
              >
                {isLocked ? "🔒 Always Required" : isSaving ? "..." : isRequired ? "Mandatory ✓" : "Optional"}
              </button>
            </div>
          );
        })}
      </div>

      <div style={s.infoBox}>
        <span style={{ fontSize: '1rem' }}>💡</span>
        <p>
          Fields marked as <strong>Mandatory</strong> will be checked during note submission. 
          If left blank, the clinician will be prompted to fix them before the record can be finalized.
        </p>
      </div>
    </section>
  );
}

const s: Record<string, CSSProperties> = {
  section: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "1.5rem", marginBottom: "1.5rem", boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
  masterMenuHeader: {
    padding: '1rem',
    background: '#f8fafc',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '1rem'
  },
  domainSelect: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    background: '#fff',
    fontSize: '0.95rem',
    fontWeight: 700,
    color: '#1e293b',
    outline: 'none',
    cursor: 'pointer'
  },
  fieldsList: { marginTop: '0.5rem' },
  fieldRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.85rem 1.5rem',
    borderBottom: '1px solid #f1f5f9'
  },
  fieldName: { fontWeight: 700, fontSize: '0.92rem', color: '#1e293b' },
  fieldKey: { fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'monospace', marginTop: '1px' },
  toggleBtn: {
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '0.75rem',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.15s',
    minWidth: '105px',
    textAlign: 'center'
  },
  infoBox: { display: "flex", gap: "0.75rem", alignItems: "flex-start", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "8px", padding: "1rem", marginTop: "1rem", fontSize: "0.82rem", lineHeight: 1.6, color: "#1e40af" },
  code: { fontFamily: "monospace", background: "#f1f5f9", padding: "1px 5px", borderRadius: "3px", fontSize: "0.8rem", color: '#2c3e50' },
};
