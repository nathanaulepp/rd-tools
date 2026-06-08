// src/features/assessment/assess-dietary/DietaryD14IVOrders.tsx
// D14: IV Orders — clinician-entered drip/infusion orders that contribute calories.
// Supported agents: dextrose solutions, propofol, clevidipine, trisodium citrate.
// Calories are summed in D15TotalsSummary inside D1NutritionRx.tsx.

import React from "react";
import { useDietaryStore } from "../../../stores/useDietaryStore";
import type { IVOrder, IVOrderType } from "../../../types/dietary";
import { Field } from "../../../shared/ui/Field";
import { NumInput } from "../../../shared/ui/NumInput";
import { SectionHeader } from "../../../shared/ui/SectionHeader";

const IV_ORDER_OPTIONS: IVOrderType[] = [
  "Dextrose 5% (D5W)",
  "Dextrose 10% (D10W)",
  "Dextrose 20% (D20W)",
  "Dextrose 50% (D50W)",
  "Dextrose 70% (D70W)",
  "Propofol 1% (10mg/mL)",
  "Clevidipine 0.5mg/mL (lipid emulsion)",
  "Trisodium Citrate (4% solution)",
];

// Brief rationale shown as a sub-label beneath each agent type
const IV_KCAL_NOTE: Record<IVOrderType, string> = {
  "Dextrose 5% (D5W)":                     "0.17 kcal/mL (3.4 kcal/g dextrose)",
  "Dextrose 10% (D10W)":                    "0.34 kcal/mL",
  "Dextrose 20% (D20W)":                    "0.68 kcal/mL",
  "Dextrose 50% (D50W)":                    "1.70 kcal/mL",
  "Dextrose 70% (D70W)":                    "2.38 kcal/mL",
  "Propofol 1% (10mg/mL)":                 "1.1 kcal/mL — 10% soybean lipid emulsion",
  "Clevidipine 0.5mg/mL (lipid emulsion)": "1.1 kcal/mL — 20% lipid emulsion vehicle",
  "Trisodium Citrate (4% solution)":        "≈0.08 kcal/mL via Krebs cycle (0.59 kcal/mmol × 0.136 mmol/mL)",
};

const IV_LIPID_TYPES = new Set<IVOrderType>([
  "Propofol 1% (10mg/mL)",
  "Clevidipine 0.5mg/mL (lipid emulsion)",
]);

function makeIVOrder(id: number): IVOrder {
  return { id, type: "", totalVolumeMl: "", rateMlHr: "", hrsPerDay: "" };
}

function calcOrderKcal(order: IVOrder): number | null {
  const vol = parseFloat(order.totalVolumeMl);
  if (!order.type || isNaN(vol) || vol <= 0) return null;

  const kcalMap: Record<IVOrderType, number> = {
    "Dextrose 5% (D5W)":                     0.17,
    "Dextrose 10% (D10W)":                    0.34,
    "Dextrose 20% (D20W)":                    0.68,
    "Dextrose 50% (D50W)":                    1.70,
    "Dextrose 70% (D70W)":                    2.38,
    "Propofol 1% (10mg/mL)":                 1.10,
    "Clevidipine 0.5mg/mL (lipid emulsion)": 1.10,
    "Trisodium Citrate (4% solution)":        0.0803,
  };

  return vol * (kcalMap[order.type] ?? 0);
}

export default function DietaryD14IVOrders() {
  const { dietary, setDietary } = useDietaryStore();
  const orders: IVOrder[] = (dietary as any).ivOrders || [];
  const nextId: number = (dietary as any).ivNextId || 1;

  const updateOrders = (newOrders: IVOrder[], newNextId?: number) => {
    setDietary({
      ivOrders: newOrders,
      ivNextId: newNextId ?? nextId,
    } as any);
  };

  const addOrder = () => {
    updateOrders([...orders, makeIVOrder(nextId)], nextId + 1);
  };

  const removeOrder = (id: number) => {
    updateOrders(orders.filter((o) => o.id !== id));
  };

  const updateOrder = (id: number, patch: Partial<IVOrder>) => {
    updateOrders(orders.map((o) => (o.id === id ? { ...o, ...patch } : o)));
  };

  return (
    <div className="card" style={{ marginBottom: "1rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "0.75rem",
        }}
      >
        <SectionHeader
          title="D14: IV Orders"
          subtitle="Calorie-contributing IV infusions — dextrose, propofol, clevidipine, citrate"
          color="#0891b2"
        />
        <button
          onClick={addOrder}
          style={{
            background: "#0891b2",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            padding: "6px 12px",
            cursor: "pointer",
            fontSize: "0.82rem",
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}
        >
          + Add IV Order
        </button>
      </div>

      {orders.length === 0 && (
        <p
          style={{
            fontSize: "0.8rem",
            color: "#94a3b8",
            fontStyle: "italic",
            margin: "0.5rem 0",
          }}
        >
          No IV orders entered. Click "+ Add IV Order" to document a
          calorie-contributing infusion.
        </p>
      )}

      {orders.map((order, idx) => {
        const kcal = calcOrderKcal(order);
        const isLipid = IV_LIPID_TYPES.has(order.type as IVOrderType);
        const note = order.type ? IV_KCAL_NOTE[order.type as IVOrderType] : null;

        // Auto-derive total volume from rate × hours if vol is blank
        const derivedVol =
          !order.totalVolumeMl &&
          parseFloat(order.rateMlHr) > 0 &&
          parseFloat(order.hrsPerDay) > 0
            ? parseFloat(order.rateMlHr) * parseFloat(order.hrsPerDay)
            : null;

        const displayKcal =
          kcal !== null
            ? kcal
            : derivedVol && order.type
            ? derivedVol *
              ({
                "Dextrose 5% (D5W)":                     0.17,
                "Dextrose 10% (D10W)":                    0.34,
                "Dextrose 20% (D20W)":                    0.68,
                "Dextrose 50% (D50W)":                    1.70,
                "Dextrose 70% (D70W)":                    2.38,
                "Propofol 1% (10mg/mL)":                 1.10,
                "Clevidipine 0.5mg/mL (lipid emulsion)": 1.10,
                "Trisodium Citrate (4% solution)":        0.0803,
              } as Record<string, number>)[order.type] ?? 0
            : null;

        return (
          <div
            key={order.id}
            style={{
              border: "1px solid #cffafe",
              borderLeft: "3px solid #0891b2",
              borderRadius: "6px",
              padding: "0.65rem 0.75rem",
              marginBottom: "0.6rem",
              background: "#fff",
            }}
          >
            {/* Row 1: agent selector */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr 1fr",
                gap: "0.5rem",
                alignItems: "end",
                marginBottom: "0.4rem",
              }}
            >
              <Field label={`IV Order ${idx + 1} — Agent`}>
                <select
                  value={order.type}
                  onChange={(e) =>
                    updateOrder(order.id, {
                      type: e.target.value as IVOrderType,
                    })
                  }
                  style={{
                    padding: "5px 8px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "4px",
                    fontSize: "0.88rem",
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="">— Select agent —</option>
                  {IV_ORDER_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Total Volume (mL)">
                <NumInput
                  value={order.totalVolumeMl}
                  onChange={(v) => updateOrder(order.id, { totalVolumeMl: v })}
                  placeholder={
                    derivedVol ? `${Math.round(derivedVol)} (auto)` : "mL"
                  }
                />
              </Field>

              <Field label="Rate (mL/hr)">
                <NumInput
                  value={order.rateMlHr}
                  onChange={(v) => updateOrder(order.id, { rateMlHr: v })}
                  placeholder="mL/hr"
                />
              </Field>

              <Field label="Hours/day">
                <NumInput
                  value={order.hrsPerDay}
                  onChange={(v) => updateOrder(order.id, { hrsPerDay: v })}
                  placeholder="hrs"
                />
              </Field>
            </div>

            {/* Row 2: calorie result + flags */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              {note && (
                <span
                  style={{
                    fontSize: "0.7rem",
                    color: "#64748b",
                    fontStyle: "italic",
                  }}
                >
                  {note}
                </span>
              )}

              {displayKcal !== null && displayKcal > 0 && (
                <span
                  style={{
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    background: "#e0f2fe",
                    color: "#0369a1",
                    borderRadius: "6px",
                    padding: "2px 10px",
                    border: "1px solid #bae6fd",
                  }}
                >
                  ≈ {Math.round(displayKcal)} kcal/day
                </span>
              )}

              {isLipid && (
                <span
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    background: "#fffbeb",
                    color: "#92400e",
                    borderRadius: "6px",
                    padding: "2px 10px",
                    border: "1px solid #fde68a",
                  }}
                >
                  ⚠ Lipid emulsion — manually review fat &amp; protein macro totals
                </span>
              )}

              <button
                onClick={() => removeOrder(order.id)}
                style={{
                  marginLeft: "auto",
                  background: "none",
                  border: "1px solid #fca5a5",
                  color: "#dc2626",
                  borderRadius: "4px",
                  padding: "2px 8px",
                  cursor: "pointer",
                  fontSize: "0.7rem",
                }}
              >
                Remove
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}