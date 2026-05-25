import { useState, FormEvent, CSSProperties } from "react";
import { Field } from "../../shared/ui/Field";
import { FormError } from "../../shared/ui/FormError";

export interface CreatePatientData {
  firstName: string;
  lastName: string;
  dob: string;
  sex: "" | "M" | "F";
  mrn: string;
  languages: string;
}

interface CreatePatientFormProps {
  onSubmit: (data: CreatePatientData) => void;
  onCancel: () => void;
  loading: boolean;
  error?: string;
  initialData?: Partial<CreatePatientData>;
}

export const CreatePatientForm = ({
  onSubmit,
  onCancel,
  loading,
  error,
  initialData,
}: CreatePatientFormProps) => {
  const [form, setForm] = useState<CreatePatientData>({
    firstName: initialData?.firstName || "",
    lastName: initialData?.lastName || "",
    dob: initialData?.dob || "",
    sex: initialData?.sex || "",
    mrn: initialData?.mrn || "",
    languages: initialData?.languages || "",
  });

  const updateField = (field: keyof CreatePatientData, val: string) =>
    setForm((f) => ({ ...f, [field]: val }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div style={styles.formSection}>
      <button style={styles.modeBackBtn} onClick={onCancel}>
        ← Change selection
      </button>
      <h3 style={styles.formTitle}>New Patient Record</h3>

      <form onSubmit={handleSubmit}>
        <div style={styles.grid2}>
          <Field label="Last Name *" id="lastName">
            <input
              id="lastName"
              name="lastName"
              style={styles.input}
              type="text"
              value={form.lastName}
              onChange={(e) => updateField("lastName", e.target.value)}
              placeholder="e.g. Reyes"
              autoFocus
              required
            />
          </Field>
          <Field label="First Name *" id="firstName">
            <input
              id="firstName"
              name="firstName"
              style={styles.input}
              type="text"
              value={form.firstName}
              onChange={(e) => updateField("firstName", e.target.value)}
              placeholder="e.g. Maria"
              required
            />
          </Field>
          <Field label="Date of Birth *" id="dob">
            <input
              id="dob"
              name="dob"
              style={styles.input}
              type="date"
              value={form.dob}
              onChange={(e) => updateField("dob", e.target.value)}
              required
            />
          </Field>
          <Field label="Sex" id="sex">
            <select
              id="sex"
              name="sex"
              style={styles.input}
              value={form.sex}
              onChange={(e) => updateField("sex", e.target.value as "" | "M" | "F")}
            >
              <option value="">—</option>
              <option value="M">M</option>
              <option value="F">F</option>
            </select>
          </Field>
          <Field label="MRN (optional)" id="mrn">
            <input
              id="mrn"
              name="mrn"
              style={styles.input}
              type="text"
              value={form.mrn}
              onChange={(e) => updateField("mrn", e.target.value)}
              placeholder="e.g. 0012345"
            />
          </Field>
          <Field label="Languages (optional)" id="languages">
            <input
              id="languages"
              name="languages"
              style={styles.input}
              type="text"
              value={form.languages}
              onChange={(e) => updateField("languages", e.target.value)}
              placeholder="e.g. Spanish, English"
            />
          </Field>
        </div>

        {error && <FormError message={error} />}

        <div style={styles.actions}>
          <button
            type="submit"
            style={{
              ...styles.btn,
              ...styles.btnPrimary,
              opacity: loading ? 0.7 : 1,
            }}
            disabled={loading}
          >
            {loading ? "Creating…" : "Create Patient & Start Note →"}
          </button>
        </div>
      </form>
    </div>
  );
};

const styles: Record<string, CSSProperties> = {
  formSection: { padding: "1.5rem 2rem 2rem" },
  modeBackBtn: {
    background: "none",
    border: "none",
    color: "#3498db",
    cursor: "pointer",
    fontSize: "0.78rem",
    fontWeight: 600,
    padding: 0,
    marginBottom: "1rem",
    display: "block",
  },
  formTitle: { margin: "0 0 1.25rem", fontSize: "1rem", fontWeight: 700, color: "#2c3e50" },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" },
  input: {
    padding: "0.45rem 0.65rem",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    fontSize: "0.88rem",
    width: "100%",
    boxSizing: "border-box",
    fontFamily: "inherit",
    color: "#1e293b",
    background: "#fff",
  },
  actions: { display: "flex", justifyContent: "flex-end", marginTop: "1.5rem" },
  btn: {
    padding: "0.6rem 1.25rem",
    borderRadius: "8px",
    border: "none",
    fontSize: "0.88rem",
    fontWeight: 700,
    cursor: "pointer",
  },
  btnPrimary: { background: "#3498db", color: "#fff" },
};
