// src/features/settings/diets/DysphagiaModManager.tsx
// CRUD UI for the hospital dysphagia modification list.
// Self-contained: all state is local useState. No domain store.

import React, { useEffect, useState } from "react";
import {
  getAllDysphagiaeMods,
  createDysphagiaeMod,
  updateDysphagiaeMod,
  deleteDysphagiaeMod,
} from "../../../shared/api/db";
import type { HospitalDysphagiaMode, HospitalDysphagiaModInput } from "../../../shared/api/db";

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
  background: "#8e44ad",
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
  color: "#8e44ad",
  border: "1px solid #8e44ad",
  padding: "5px 14px",
  borderRadius: 8,
  fontSize: "0.82rem",
  fontWeight: 700,
  cursor: "pointer",
};

// ─── Inline add/edit form ─────────────────────────────────────────────────────

interface ModFormProps {
  initial: HospitalDysphagiaModInput;
  onSave: (input: HospitalDysphagiaModInput) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
  mode: "create" | "edit";
  /** Pre-select a category when opening the form from a section's Add button */
  inferredCategory?: "Food" | "Liquid" | "Other";
}

type ModCategory = "Food" | "Liquid" | "Other";

const CATEGORY_OPTIONS: { value: ModCategory; label: string; color: string }[] = [
  { value: "Food",   label: "Food Consistency",   color: "#27ae60" },
  { value: "Liquid", label: "Liquid Consistency",  color: "#2980b9" },
  { value: "Other",  label: "Other",               color: "#64748b" },
];

function ModForm({ initial, onSave, onCancel, isSaving, mode, inferredCategory }: ModFormProps) {
  const [category, setCategory] = useState<ModCategory>(
    inferredCategory ?? (initial as any).category ?? "Food"
  );
  const [bareName, setBareName] = useState(initial.name);
  const isValid = bareName.trim().length > 0;

  const activeColor = CATEGORY_OPTIONS.find(o => o.value === category)?.color ?? "#8e44ad";

  return (
    <div style={{
      border: `1px solid ${activeColor}40`,
      borderRadius: 10,
      padding: "1rem 1.25rem",
      background: mode === "create" ? "#faf5ff" : "#fffdf5",
      marginBottom: "0.75rem",
    }}>
      <div style={{
        fontWeight: 800, fontSize: "0.85rem", color: "#1e293b",
        marginBottom: "0.85rem", borderLeft: `3px solid ${activeColor}`, paddingLeft: 8,
      }}>
        {mode === "create" ? "➕ Add Modification" : "✏️ Edit Modification"}
      </div>

      {/* Category selector */}
      <div style={{ marginBottom: "0.75rem" }}>
        <label style={labelStyle}>Category *</label>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {CATEGORY_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setCategory(opt.value)}
              style={{
                padding: "5px 14px",
                borderRadius: 20,
                border: `2px solid ${opt.color}`,
                background: category === opt.value ? opt.color : "transparent",
                color: category === opt.value ? "#fff" : opt.color,
                fontWeight: 700,
                fontSize: "0.78rem",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Name input */}
      <div style={{ marginBottom: "0.85rem" }}>
        <label style={labelStyle}>Modification Name *</label>
        <input
          type="text"
          value={bareName}
          onChange={e => setBareName(e.target.value)}
          placeholder={
            category === "Food"   ? "e.g. Mechanical Soft, Level 5 — Minced & Moist" :
            category === "Liquid" ? "e.g. Mildly Thick, Level 2" :
            "e.g. NPO"
          }
          style={inputStyle}
          autoFocus
        />
        {bareName.trim() && (
          <div style={{ fontSize: "0.7rem", color: "#94a3b8", marginTop: 4 }}>
            Will save as: <strong style={{ color: activeColor }}>{bareName.trim()}</strong>
            <span style={{ marginLeft: 6, color: activeColor }}>({category})</span>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
        <button onClick={onCancel} style={btnOutline} disabled={isSaving}>
          Cancel
        </button>
        <button
          onClick={() => onSave({ ...initial, name: bareName.trim(), category })}
          disabled={!isValid || isSaving}
          style={{ ...btnPrimary, background: activeColor, opacity: !isValid || isSaving ? 0.6 : 1 }}
        >
          {isSaving ? "Saving…" : mode === "create" ? "Save" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

// ─── Single row ───────────────────────────────────────────────────────────────

interface ModRowProps {
  mod: HospitalDysphagiaMode;
  isFirst: boolean;
  isLast: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function ModRow({ mod, isFirst, isLast, onEdit, onDelete, onMoveUp, onMoveDown }: ModRowProps) {
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

      <div style={{ flex: 1, fontWeight: 600, fontSize: "0.88rem", color: "#1e293b" }}>
        {mod.name}
      </div>

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
          <span style={{ fontSize: "0.75rem", color: "#e74c3c" }}>Delete "{mod.name}"?</span>
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

export default function DysphagiaModManager() {
  const [mods, setMods] = useState<HospitalDysphagiaMode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createCategory, setCreateCategory] = useState<"Food" | "Liquid" | "Other" | undefined>(undefined);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function fetchMods() {
      setIsLoading(true);
      setError(null);
      try {
        const rows = await getAllDysphagiaeMods();
        if (!cancelled) setMods(rows);
      } catch {
        if (!cancelled) setError("Failed to load dysphagia modifications.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    fetchMods();
    return () => { cancelled = true; };
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  async function handleCreate(input: HospitalDysphagiaModInput) {
    setIsSaving(true);
    try {
      const maxOrder = mods.length > 0 ? Math.max(...mods.map(m => m.sort_order)) : -1;
      const created = await createDysphagiaeMod({ ...input, sort_order: maxOrder + 1 });
      setMods(prev => [...prev, created]);
      setShowCreate(false);
      showToast(`"${created.name}" added ✓`);
    } catch {
      setError("Failed to save modification.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUpdate(id: string, input: HospitalDysphagiaModInput) {
    setIsSaving(true);
    try {
      await updateDysphagiaeMod(id, input);
      setMods(prev => prev.map(m => m.id === id ? { ...m, ...input } : m));
      setEditingId(null);
      showToast("Modification updated ✓");
    } catch {
      setError("Failed to update modification.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (mods.length <= 1) {
      showToast("Cannot delete the last modification in the list.");
      return;
    }
    try {
      await deleteDysphagiaeMod(id);
      setMods(prev => prev.filter(m => m.id !== id));
      showToast(`"${name}" removed`);
    } catch {
      setError("Failed to delete modification.");
    }
  }

  async function handleMove(index: number, direction: "up" | "down") {
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= mods.length) return;
    const updated = [...mods];
    const aOrder = updated[index].sort_order;
    const bOrder = updated[swapIndex].sort_order;
    await updateDysphagiaeMod(updated[index].id, { name: updated[index].name, sort_order: bOrder });
    await updateDysphagiaeMod(updated[swapIndex].id, { name: updated[swapIndex].name, sort_order: aOrder });
    updated[index] = { ...updated[index], sort_order: bOrder };
    updated[swapIndex] = { ...updated[swapIndex], sort_order: aOrder };
    updated.sort((a, b) => a.sort_order - b.sort_order);
    setMods(updated);
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <div style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
          {mods.length} modification{mods.length !== 1 ? "s" : ""} in list
        </div>
        {!showCreate && (
          <button
            onClick={() => { setShowCreate(true); setCreateCategory(undefined); setEditingId(null); }}
            style={btnPrimary}
          >
            ＋ Add Modification
          </button>
        )}
      </div>

      {error && (
        <div style={{
          background: "#fdf2f8", border: "1px solid #e74c3c", color: "#9d174d",
          padding: "0.5rem 0.75rem", borderRadius: 6, fontSize: "0.82rem", marginBottom: "0.75rem",
        }}>
          ⚠ {error}
        </div>
      )}

      {showCreate && (
        <ModForm
          initial={{ name: "", category: createCategory || "Food", sort_order: 0 }}
          onSave={handleCreate}
          onCancel={() => { setShowCreate(false); setCreateCategory(undefined); }}
          isSaving={isSaving}
          mode="create"
          inferredCategory={createCategory}
        />
      )}

      {isLoading && (
        <div style={{ textAlign: "center", color: "#94a3b8", padding: "2rem", fontSize: "0.85rem" }}>
          Loading…
        </div>
      )}

      {!isLoading && mods.length === 0 && (
        <div style={{
          textAlign: "center", border: "1px dashed #e2e8f0", borderRadius: 10,
          padding: "2.5rem 1rem", color: "#94a3b8",
        }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🫁</div>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>No dysphagia modifications configured.</div>
          <div style={{ fontSize: "0.82rem" }}>Add texture and liquid modifications above.</div>
        </div>
      )}

      {!isLoading && (() => {
        const foodMods = mods.filter(m => m.category === "Food");
        const liquidMods = mods.filter(m => m.category === "Liquid");
        const otherMods = mods.filter(m => m.category === "Other");

        const renderSection = (label: string, color: string, subset: HospitalDysphagiaMode[], sectionCategory: "Food" | "Liquid" | "Other") => (
          <div style={{ marginBottom: "1.25rem" }}>
            <div style={{
              display: "flex", alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "0.5rem",
            }}>
              <div style={{
                fontSize: "0.72rem", fontWeight: 800, textTransform: "uppercase",
                letterSpacing: "0.06em", color, borderLeft: `3px solid ${color}`,
                paddingLeft: 8,
              }}>
                {label}
              </div>
              {!showCreate && (
                <button
                  onClick={() => {
                    setCreateCategory(sectionCategory);
                    setShowCreate(true);
                    setEditingId(null);
                  }}
                  style={{
                    background: "transparent", border: `1px solid ${color}`,
                    color, borderRadius: 6, padding: "2px 10px",
                    fontSize: "0.72rem", fontWeight: 700, cursor: "pointer",
                  }}
                >
                  + Add
                </button>
              )}
            </div>
            {subset.length === 0 && (
              <div style={{ fontSize: "0.78rem", color: "#94a3b8", fontStyle: "italic", paddingLeft: 8 }}>
                No entries yet.
              </div>
            )}
            {subset.map((mod) => {
              const idx = mods.indexOf(mod);
              return editingId === mod.id ? (
                <ModForm
                  key={mod.id}
                  initial={{ name: mod.name, category: mod.category, sort_order: mod.sort_order }}
                  onSave={input => handleUpdate(mod.id, input)}
                  onCancel={() => setEditingId(null)}
                  isSaving={isSaving}
                  mode="edit"
                  inferredCategory={mod.category}
                />
              ) : (
                <ModRow
                  key={mod.id}
                  mod={mod}
                  isFirst={idx === 0}
                  isLast={idx === mods.length - 1}
                  onEdit={() => { setEditingId(mod.id); setShowCreate(false); }}
                  onDelete={() => handleDelete(mod.id, mod.name)}
                  onMoveUp={() => handleMove(idx, "up")}
                  onMoveDown={() => handleMove(idx, "down")}
                />
              );
            })}
          </div>
        );

        return (
          <>
            {renderSection("Food Consistency", "#27ae60", foodMods, "Food")}
            {renderSection("Liquid Consistency", "#2980b9", liquidMods, "Liquid")}
            {otherMods.length > 0 && renderSection("Other", "#64748b", otherMods, "Other")}
          </>
        );
      })()}

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
