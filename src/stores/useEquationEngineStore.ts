import { create } from "zustand";
import type { CustomCondition, CustomEquation, CustomEquationNote, ConditionId, ConditionExtraInput } from "../types";
import { assertIsConditionId } from "../types";

interface EquationEngineState {
  conditions: CustomCondition[];
  isLoaded: boolean;
  selectedConditionId: ConditionId | null;

  // Actions
  loadConditions: () => Promise<void>;
  setSelectedCondition: (id: ConditionId | null) => void;

  addCondition: (name: string, parentId: ConditionId | null, description?: string) => Promise<void>;
  updateCondition: (id: ConditionId, updates: { name?: string; description?: string; sortOrder?: number }) => Promise<void>;
  archiveCondition: (id: ConditionId) => Promise<void>;
  reorderCondition: (id: ConditionId, newSortOrder: number) => Promise<void>;

  addEquation: (conditionId: ConditionId, nutrient: string, displayLabel: string, expression: string, unit: string) => Promise<void>;
  updateEquation: (equationId: string, updates: { nutrient?: string; displayLabel?: string; expression?: string; unit?: string; sortOrder?: number }) => Promise<void>;
  deleteEquation: (equationId: string) => Promise<void>;

  addEquationNote: (equationId: string, noteText: string) => Promise<void>;
  addConditionNote: (conditionId: ConditionId, noteText: string) => Promise<void>;
  deleteEquationNote: (noteId: string) => Promise<void>;

  addExtraInput: (conditionId: ConditionId, slug: string, displayLabel: string, inputType: "number" | "boolean", hintText?: string) => Promise<void>;
  deleteExtraInput: (extraInputId: string) => Promise<void>;

  invalidate: () => void;
}

export const useEquationEngineStore = create<EquationEngineState>((set, get) => ({
  conditions: [],
  isLoaded: false,
  selectedConditionId: null,

  setSelectedCondition: (id) => set({ selectedConditionId: id }),

  loadConditions: async () => {
    const { getDb } = await import("../shared/api/db.connection");
    const db = await getDb();

    // 1. Query non-archived conditions
    const rawConditions = await db.select<any[]>(
      "SELECT * FROM custom_conditions WHERE is_archived = 0 ORDER BY sort_order ASC"
    );

    // 2. Query equations
    const rawEquations = await db.select<any[]>(
      "SELECT * FROM custom_equations ORDER BY sort_order ASC"
    );

    // 3. Query notes
    const rawNotes = await db.select<any[]>(
      "SELECT * FROM custom_equation_notes ORDER BY sort_order ASC"
    );

    // 4. Query extra inputs
    const extraInputRows = await db.select<any[]>(
      "SELECT * FROM condition_extra_inputs ORDER BY sort_order ASC"
    );

    // Hydration maps
    const conditionsMap = new Map<string, CustomCondition>();
    const conditionsList: CustomCondition[] = [];

    // Map conditions
    for (const row of rawConditions) {
      assertIsConditionId(row.id);
      const parentId = row.parent_id ? (row.parent_id as ConditionId) : null;
      if (parentId) {
        assertIsConditionId(parentId);
      }

      const cond: CustomCondition = {
        id: row.id as ConditionId,
        name: row.name,
        description: row.description || null,
        parentId,
        sortOrder: row.sort_order,
        isSeeded: row.is_seeded === 1,
        isArchived: row.is_archived === 1,
        archivedAt: row.archived_at || null,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        equations: [],
        children: [],
        extraInputs: [],
      };
      conditionsMap.set(cond.id, cond);
      conditionsList.push(cond);
    }

    // Map equations
    const equationsMap = new Map<string, CustomEquation>();
    for (const row of rawEquations) {
      assertIsConditionId(row.condition_id);
      const eq: CustomEquation = {
        id: row.id,
        conditionId: row.condition_id as ConditionId,
        nutrient: row.nutrient,
        expression: row.expression,
        unit: row.unit,
        displayLabel: row.display_label,
        sortOrder: row.sort_order,
        createdAt: row.created_at,
        notes: [],
      };
      equationsMap.set(eq.id, eq);

      const cond = conditionsMap.get(eq.conditionId);
      if (cond) {
        cond.equations = cond.equations || [];
        cond.equations.push(eq);
      }
    }

    // Map notes
    for (const row of rawNotes) {
      const note: CustomEquationNote = {
        id: row.id,
        equationId: row.equation_id || null,
        conditionId: row.condition_id || null,
        noteText: row.note_text,
        sortOrder: row.sort_order,
      };

      if (note.equationId) {
        const eq = equationsMap.get(note.equationId);
        if (eq) {
          eq.notes = eq.notes || [];
          eq.notes.push(note);
        }
      } else if (note.conditionId) {
        const cond = conditionsMap.get(note.conditionId);
        if (cond) {
          cond.notes = cond.notes || [];
          cond.notes.push(note);
        }
      }
    }

    // Map extra inputs
    for (const cond of conditionsList) {
      cond.extraInputs = extraInputRows
        .filter(r => r.condition_id === cond.id)
        .map((r): ConditionExtraInput => ({
          id: r.id,
          conditionId: r.condition_id,
          slug: r.slug,
          displayLabel: r.display_label,
          inputType: r.input_type as "number" | "boolean",
          hintText: r.hint_text ?? undefined,
          sortOrder: r.sort_order,
        }));
    }

    // Build children tree structures
    for (const cond of conditionsList) {
      if (cond.parentId) {
        const parent = conditionsMap.get(cond.parentId);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(cond);
        }
      }
    }

    set({ conditions: conditionsList, isLoaded: true });
  },

  addCondition: async (name, parentId, description) => {
    const { getDb } = await import("../shared/api/db.connection");
    const db = await getDb();

    // Calculate sort_order based on sibling count
    const siblingCountRes = await db.select<{ count: number }[]>(
      "SELECT COUNT(*) as count FROM custom_conditions WHERE parent_id " +
      (parentId ? "= ?" : "IS NULL") + " AND is_archived = 0",
      parentId ? [parentId] : []
    );
    const siblingCount = siblingCountRes[0]?.count ?? 0;
    const sortOrder = 1000 * (siblingCount + 1);

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await db.execute(
      `INSERT INTO custom_conditions (id, name, description, parent_id, sort_order, is_seeded, is_archived, archived_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 0, 0, NULL, ?, ?)`,
      [id, name, description || null, parentId, sortOrder, now, now]
    );

    await get().loadConditions();
  },

  updateCondition: async (id, updates) => {
    const { getDb } = await import("../shared/api/db.connection");
    const db = await getDb();

    const fields: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) {
      fields.push("name = ?");
      values.push(updates.name);
    }
    if (updates.description !== undefined) {
      fields.push("description = ?");
      values.push(updates.description);
    }
    if (updates.sortOrder !== undefined) {
      fields.push("sort_order = ?");
      values.push(updates.sortOrder);
    }

    if (fields.length > 0) {
      fields.push("updated_at = ?");
      values.push(new Date().toISOString());

      values.push(id);
      await db.execute(
        `UPDATE custom_conditions SET ${fields.join(", ")} WHERE id = ?`,
        values
      );

      await get().loadConditions();
    }
  },

  archiveCondition: async (id) => {
    const { getDb } = await import("../shared/api/db.connection");
    const db = await getDb();
    const now = new Date().toISOString();

    await db.execute(
      "UPDATE custom_conditions SET is_archived = 1, archived_at = ?, updated_at = ? WHERE id = ?",
      [now, now, id]
    );

    await get().loadConditions();
  },

  reorderCondition: async (id, newSortOrder) => {
    const { getDb } = await import("../shared/api/db.connection");
    const db = await getDb();
    const now = new Date().toISOString();

    await db.execute(
      "UPDATE custom_conditions SET sort_order = ?, updated_at = ? WHERE id = ?",
      [newSortOrder, now, id]
    );

    await get().loadConditions();
  },

  addEquation: async (conditionId, nutrient, displayLabel, expression, unit) => {
    const { getDb } = await import("../shared/api/db.connection");
    const db = await getDb();

    const eqCountRes = await db.select<{ count: number }[]>(
      "SELECT COUNT(*) as count FROM custom_equations WHERE condition_id = ?",
      [conditionId]
    );
    const eqCount = eqCountRes[0]?.count ?? 0;
    const sortOrder = eqCount + 1;

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await db.execute(
      `INSERT INTO custom_equations (id, condition_id, nutrient, expression, unit, display_label, sort_order, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, conditionId, nutrient, expression, unit, displayLabel, sortOrder, now]
    );

    await get().loadConditions();
  },

  updateEquation: async (equationId, updates) => {
    const { getDb } = await import("../shared/api/db.connection");
    const db = await getDb();

    const fields: string[] = [];
    const values: any[] = [];

    if (updates.nutrient !== undefined) {
      fields.push("nutrient = ?");
      values.push(updates.nutrient);
    }
    if (updates.displayLabel !== undefined) {
      fields.push("display_label = ?");
      values.push(updates.displayLabel);
    }
    if (updates.expression !== undefined) {
      fields.push("expression = ?");
      values.push(updates.expression);
    }
    if (updates.unit !== undefined) {
      fields.push("unit = ?");
      values.push(updates.unit);
    }
    if (updates.sortOrder !== undefined) {
      fields.push("sort_order = ?");
      values.push(updates.sortOrder);
    }

    if (fields.length > 0) {
      values.push(equationId);
      await db.execute(
        `UPDATE custom_equations SET ${fields.join(", ")} WHERE id = ?`,
        values
      );

      await get().loadConditions();
    }
  },

  deleteEquation: async (equationId) => {
    const { getDb } = await import("../shared/api/db.connection");
    const db = await getDb();

    await db.execute("DELETE FROM custom_equation_notes WHERE equation_id = ?", [equationId]);
    await db.execute("DELETE FROM custom_equations WHERE id = ?", [equationId]);

    await get().loadConditions();
  },

  addEquationNote: async (equationId, noteText) => {
    const { getDb } = await import("../shared/api/db.connection");
    const db = await getDb();

    const noteCountRes = await db.select<{ count: number }[]>(
      "SELECT COUNT(*) as count FROM custom_equation_notes WHERE equation_id = ?",
      [equationId]
    );
    const noteCount = noteCountRes[0]?.count ?? 0;
    const sortOrder = noteCount + 1;

    const id = crypto.randomUUID();

    await db.execute(
      `INSERT INTO custom_equation_notes (id, equation_id, condition_id, note_text, sort_order)
       VALUES (?, ?, NULL, ?, ?)`,
      [id, equationId, noteText, sortOrder]
    );

    await get().loadConditions();
  },

  deleteEquationNote: async (noteId) => {
    const { getDb } = await import("../shared/api/db.connection");
    const db = await getDb();

    await db.execute("DELETE FROM custom_equation_notes WHERE id = ?", [noteId]);

    await get().loadConditions();
  },

  addConditionNote: async (conditionId, noteText) => {
    const { getDb } = await import("../shared/api/db.connection");
    const db = await getDb();

    const noteCountRes = await db.select<{ count: number }[]>(
      "SELECT COUNT(*) as count FROM custom_equation_notes WHERE condition_id = ?",
      [conditionId]
    );
    const noteCount = noteCountRes[0]?.count ?? 0;
    const sortOrder = noteCount + 1;

    const id = crypto.randomUUID();

    await db.execute(
      `INSERT INTO custom_equation_notes (id, equation_id, condition_id, note_text, sort_order)
       VALUES (?, NULL, ?, ?, ?)`,
      [id, conditionId, noteText, sortOrder]
    );

    await get().loadConditions();
  },

  addExtraInput: async (conditionId, slug, displayLabel, inputType, hintText) => {
    const { getDb } = await import("../shared/api/db.connection");
    const db = await getDb();

    const inputCountRes = await db.select<{ count: number }[]>(
      "SELECT COUNT(*) as count FROM condition_extra_inputs WHERE condition_id = ?",
      [conditionId]
    );
    const inputCount = inputCountRes[0]?.count ?? 0;
    const sortOrder = inputCount + 1;

    const id = crypto.randomUUID();

    await db.execute(
      `INSERT INTO condition_extra_inputs (id, condition_id, slug, display_label, input_type, hint_text, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, conditionId, slug, displayLabel, inputType, hintText || null, sortOrder]
    );

    await get().loadConditions();
  },

  deleteExtraInput: async (extraInputId) => {
    const { getDb } = await import("../shared/api/db.connection");
    const db = await getDb();

    await db.execute("DELETE FROM condition_extra_inputs WHERE id = ?", [extraInputId]);

    await get().loadConditions();
  },

  invalidate: () => {
    set({ isLoaded: false, conditions: [] });
  },
}));
