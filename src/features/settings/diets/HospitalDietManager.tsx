// src/features/settings/diets/HospitalDietManager.tsx
// CRUD UI for the hospital kitchen diet order list.
// Self-contained: all state is local useState. No domain store.

import React, { useEffect, useState } from "react";
import {
  getAllDiets,
  createDiet,
  updateDiet,
  deleteDiet,
} from "../../../shared/api/db";
import type { HospitalDiet, HospitalDietInput } from "../../../shared/api/db";

const EMPTY_FORM: HospitalDietInput = {
  name: "",
  sort_order: 0,
};

// ─── Shared style tokens ──────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  padding: "5px 8px",
  border: "1px solid #e2e8f0",
  borderRadius: 4,
  fontSize: "0.85rem",
  width: "100%",
  boxSizing: "border-box",
  fontFamily: "inherit",
};

const labelStyle: React.CSSProperties = {
  fontSize: "0.65rem",
  fontWeight: 700,
  color: "#64748b",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  display: "block",
  marginBottom: 3,
};

const btnPrimary: React.CSSProperties = {
  background: "#3498db",
  color: "#fff",
  border: "none",
  padding: "6px 16px",
  borderRadius: 8,
  fontSize: "0.82rem",
  fontWeight: 700,
  cursor: "pointer",
};

const btnOutline: React.CSSProperties = {
  background: "transparent",
  color: "#3498db",
  border: "1px solid #3498db",
  padding: "5px 14px",
  borderRadius: 8,
  fontSize: "0.82rem",
  fontWeight: 700,
  cursor: "pointer",
};



// ─── Inline add/edit form ─────────────────────────────────────────────────────

interface DietFormProps {
  initial: HospitalDietInput;
  onSave: (input: HospitalDietInput) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
  mode: "create" | "edit";
}

function DietForm({ initial, onSave, onCancel, isSaving, mode }: DietFormProps) {
  const [form, setForm] = useState<HospitalDietInput>(initial);
  const isValid = form.name.trim().length > 0;

  return (
    <div style={{
      border: "1px solid #e2e8f0",
      borderRadius: 10,
      padding: "1rem 1.25rem",
      background: mode === "create" ? "#f8faff" : "#fffdf5",
      marginBottom: "0.75rem",
    }}>
      <div style={{
        fontWeight: 800, fontSize: "0.85rem", color: "#1e293b",
        marginBottom: "0.85rem", borderLeft: "3px solid #3498db", paddingLeft: 8,
      }}>
        {mode === "create" ? "➕ Add New Diet Order" : "✏️ Edit Diet Order"}
      </div>

      <div style={{ marginBottom: "0.85rem" }}>
        <label style={labelStyle}>Diet Name *</label>
        <input
          type="text"
          value={form.name}
          onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
          placeholder="e.g. Low Sodium (2g)"
          style={inputStyle}
          autoFocus
        />
      </div>

      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
        <button onClick={onCancel} style={btnOutline} disabled={isSaving}>
          Cancel
        </button>
        <button
          onClick={() => onSave(form)}
          disabled={!isValid || isSaving}
          style={{ ...btnPrimary, opacity: !isValid || isSaving ? 0.6 : 1 }}
        >
          {isSaving ? "Saving…" : mode === "create" ? "Save Diet" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

// ─── Single diet row ──────────────────────────────────────────────────────────

interface DietRowProps {
  diet: HospitalDiet;
  isFirst: boolean;
  isLast: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function DietRow({ diet, isFirst, isLast, onEdit, onDelete, onMoveUp, onMoveDown }: DietRowProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
      padding: "0.55rem 0.85rem",
      border: "1px solid #e2e8f0",
      borderRadius: 8,
      marginBottom: "0.4rem",
      background: "#fff",
    }}>
      {/* Reorder arrows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2, flexShrink: 0 }}>
        <button
          onClick={onMoveUp}
          disabled={isFirst}
          title="Move up"
          style={{
            background: "none", border: "none", cursor: isFirst ? "default" : "pointer",
            color: isFirst ? "#cbd5e1" : "#64748b", fontSize: "0.7rem", padding: "1px 3px", lineHeight: 1,
          }}
        >▲</button>
        <button
          onClick={onMoveDown}
          disabled={isLast}
          title="Move down"
          style={{
            background: "none", border: "none", cursor: isLast ? "default" : "pointer",
            color: isLast ? "#cbd5e1" : "#64748b", fontSize: "0.7rem", padding: "1px 3px", lineHeight: 1,
          }}
        >▼</button>
      </div>

      {/* Name */}
      <div style={{ flex: 1, fontWeight: 600, fontSize: "0.88rem", color: "#1e293b" }}>
        {diet.name}
      </div>



      {/* Actions */}
      {!confirmDelete ? (
        <div style={{ display: "flex", gap: "0.4rem", flexShrink: 0 }}>
          <button onClick={onEdit} style={btnOutline}>Edit</button>
          <button
            onClick={() => setConfirmDelete(true)}
            style={{ ...btnOutline, color: "#e74c3c", borderColor: "#e74c3c" }}
          >
            Delete
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexShrink: 0 }}>
          <span style={{ fontSize: "0.75rem", color: "#e74c3c" }}>Delete "{diet.name}"?</span>
          <button onClick={() => setConfirmDelete(false)} style={btnOutline}>Cancel</button>
          <button
            onClick={() => { setConfirmDelete(false); onDelete(); }}
            style={{ ...btnPrimary, background: "#e74c3c" }}
          >
            Yes, Delete
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function HospitalDietManager() {
  const [diets, setDiets] = useState<HospitalDiet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      const rows = await getAllDiets();
      setDiets(rows);
    } catch (e) {
      setError("Failed to load diet list.");
    } finally {
      setIsLoading(false);
    }
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  async function handleCreate(input: HospitalDietInput) {
    setIsSaving(true);
    try {
      const maxOrder = diets.length > 0 ? Math.max(...diets.map(d => d.sort_order)) : -1;
      const created = await createDiet({ ...input, sort_order: maxOrder + 1 });
      setDiets(prev => [...prev, created]);
      setShowCreate(false);
      showToast(`"${created.name}" added ✓`);
    } catch {
      setError("Failed to save diet.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUpdate(id: string, input: HospitalDietInput) {
    setIsSaving(true);
    try {
      await updateDiet(id, input);
      setDiets(prev => prev.map(d => d.id === id ? { ...d, ...input } : d));
      setEditingId(null);
      showToast("Diet updated ✓");
    } catch {
      setError("Failed to update diet.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (diets.length <= 1) {
      showToast("Cannot delete the last diet in the list.");
      return;
    }
    try {
      await deleteDiet(id);
      setDiets(prev => prev.filter(d => d.id !== id));
      showToast(`"${name}" removed`);
    } catch {
      setError("Failed to delete diet.");
    }
  }

  async function handleMove(index: number, direction: "up" | "down") {
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= diets.length) return;

    const updated = [...diets];
    const aOrder = updated[index].sort_order;
    const bOrder = updated[swapIndex].sort_order;

    // Swap sort_order values in DB
    await updateDiet(updated[index].id, { name: updated[index].name, sort_order: bOrder });
    await updateDiet(updated[swapIndex].id, { name: updated[swapIndex].name, sort_order: aOrder });

    // Swap in local state
    updated[index] = { ...updated[index], sort_order: bOrder };
    updated[swapIndex] = { ...updated[swapIndex], sort_order: aOrder };
    updated.sort((a, b) => a.sort_order - b.sort_order);
    setDiets(updated);
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <div style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
          {diets.length} diet order{diets.length !== 1 ? "s" : ""} in list
        </div>
        {!showCreate && (
          <button
            onClick={() => { setShowCreate(true); setEditingId(null); }}
            style={btnPrimary}
          >
            ＋ Add Diet Order
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div style={{
          background: "#fdf2f8", border: "1px solid #e74c3c", color: "#9d174d",
          padding: "0.5rem 0.75rem", borderRadius: 6, fontSize: "0.82rem", marginBottom: "0.75rem",
        }}>
          ⚠ {error}
        </div>
      )}

      {/* Create form */}
      {showCreate && (
        <DietForm
          initial={EMPTY_FORM}
          onSave={handleCreate}
          onCancel={() => setShowCreate(false)}
          isSaving={isSaving}
          mode="create"
        />
      )}

      {/* Loading */}
      {isLoading && (
        <div style={{ textAlign: "center", color: "#94a3b8", padding: "2rem", fontSize: "0.85rem" }}>
          Loading diet list…
        </div>
      )}

      {/* Empty state */}
      {!isLoading && diets.length === 0 && (
        <div style={{
          textAlign: "center", border: "1px dashed #e2e8f0", borderRadius: 10,
          padding: "2.5rem 1rem", color: "#94a3b8",
        }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🍽️</div>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>No diet orders configured.</div>
          <div style={{ fontSize: "0.82rem" }}>Add your facility's orderable diets above.</div>
        </div>
      )}

      {/* Diet list */}
      {!isLoading && diets.map((diet, idx) => (
        editingId === diet.id ? (
          <DietForm
            key={diet.id}
            initial={{ name: diet.name, sort_order: diet.sort_order }}
            onSave={input => handleUpdate(diet.id, input)}
            onCancel={() => setEditingId(null)}
            isSaving={isSaving}
            mode="edit"
          />
        ) : (
          <DietRow
            key={diet.id}
            diet={diet}
            isFirst={idx === 0}
            isLast={idx === diets.length - 1}
            onEdit={() => { setEditingId(diet.id); setShowCreate(false); }}
            onDelete={() => handleDelete(diet.id, diet.name)}
            onMoveUp={() => handleMove(idx, "up")}
            onMoveDown={() => handleMove(idx, "down")}
          />
        )
      ))}

      {/* Toast */}
      <div style={{
        position: "fixed", bottom: "1.5rem", left: "50%",
        transform: `translateX(-50%) translateY(${toast ? "0" : "80px"})`,
        background: "#1e293b", color: "#fff", padding: "0.5rem 1.25rem",
        borderRadius: 30, fontSize: "0.85rem", fontWeight: 600,
        boxShadow: "0 4px 12px rgba(0,0,0,0.2)", transition: "all 0.3s ease",
        zIndex: 2000, opacity: toast ? 1 : 0, pointerEvents: "none",
      }}>
        {toast}
      </div>
    </div>
  );
}
