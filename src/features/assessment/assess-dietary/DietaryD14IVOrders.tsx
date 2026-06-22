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
import { calcIVOrderKcal, calcIVOrderFat } from "./helper";

const IV_ORDER_OPTIONS: IVOrderType[] = [
  "Dextrose 5% (D5W)",
  "Dextrose 10% (D10W)",
  "Dextrose 20% (D20W)",
  "Dextrose 40% (D40W)",
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
  "Dextrose 40% (D40W)":                    "1.36 kcal/mL",
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
    <div className="card" style={{ marginBottom: "1rem", padding: "0.5rem 0.75rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "0.5rem",
          borderBottom: "1px dashed #e2e8f0",
          paddingBottom: "0.35rem",
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
            borderRadius: "4px",
            padding: "4px 10px",
            cursor: "pointer",
            fontSize: "0.78rem",
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}
        >
          + Add IV Order
        </button>
      </div>

      {orders.length === 0 ? (
        <p
          style={{
            fontSize: "0.78rem",
            color: "#94a3b8",
            fontStyle: "italic",
            margin: "0.5rem 0",
          }}
        >
          No IV orders entered. Click "+ Add IV Order" to document a calorie-contributing infusion.
        </p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="lab-table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ width: "35%", fontSize: "0.7rem", padding: "0.35rem 0.5rem" }}>IV Agent / Infusion</th>
                <th style={{ width: "15%", fontSize: "0.7rem", padding: "0.35rem 0.5rem" }}>Vol (mL)</th>
                <th style={{ width: "15%", fontSize: "0.7rem", padding: "0.35rem 0.5rem" }}>Rate (mL/h)</th>
                <th style={{ width: "12%", fontSize: "0.7rem", padding: "0.35rem 0.5rem" }}>Hrs/d</th>
                <th style={{ width: "15%", fontSize: "0.7rem", padding: "0.35rem 0.5rem" }}>Est. Calories</th>
                <th style={{ width: "8%", fontSize: "0.7rem", padding: "0.35rem 0.5rem", textAlign: "center" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, idx) => {
                const displayKcal = calcIVOrderKcal(order);
                const displayFatG = calcIVOrderFat(order);
                const isLipid = IV_LIPID_TYPES.has(order.type as IVOrderType);
                const note = order.type ? IV_KCAL_NOTE[order.type as IVOrderType] : null;

                const derivedVol =
                  !order.totalVolumeMl &&
                  parseFloat(order.rateMlHr) > 0 &&
                  parseFloat(order.hrsPerDay) > 0
                    ? parseFloat(order.rateMlHr) * parseFloat(order.hrsPerDay)
                    : null;

                return (
                  <tr key={order.id}>
                    {/* Agent */}
                    <td style={{ padding: "0.35rem 0.5rem", verticalAlign: "middle" }}>
                      <select
                        value={order.type}
                        onChange={(e) => updateOrder(order.id, { type: e.target.value as IVOrderType })}
                        style={{
                          padding: "3px 6px",
                          border: "1px solid #e2e8f0",
                          borderRadius: "4px",
                          fontSize: "0.78rem",
                          width: "100%",
                        }}
                      >
                        <option value="">— Select agent —</option>
                        {IV_ORDER_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                      {note && (
                        <div style={{ fontSize: "0.62rem", color: "#64748b", fontStyle: "italic", marginTop: "2px" }}>
                          {note}
                        </div>
                      )}
                    </td>

                    {/* Vol */}
                    <td style={{ padding: "0.35rem 0.5rem", verticalAlign: "middle" }}>
                      <NumInput
                        value={order.totalVolumeMl}
                        onChange={(v) => updateOrder(order.id, { totalVolumeMl: v })}
                        placeholder={derivedVol ? `${Math.round(derivedVol)}` : "mL"}
                        style={{ padding: "3px 6px", fontSize: "0.78rem" }}
                      />
                    </td>

                    {/* Rate */}
                    <td style={{ padding: "0.35rem 0.5rem", verticalAlign: "middle" }}>
                      <NumInput
                        value={order.rateMlHr}
                        onChange={(v) => updateOrder(order.id, { rateMlHr: v })}
                        placeholder="mL/h"
                        style={{ padding: "3px 6px", fontSize: "0.78rem" }}
                      />
                    </td>

                    {/* Hours */}
                    <td style={{ padding: "0.35rem 0.5rem", verticalAlign: "middle" }}>
                      <NumInput
                        value={order.hrsPerDay}
                        onChange={(v) => updateOrder(order.id, { hrsPerDay: v })}
                        placeholder="hrs"
                        style={{ padding: "3px 6px", fontSize: "0.78rem" }}
                      />
                    </td>

                    {/* Calories / Lipid Warning */}
                    <td style={{ padding: "0.35rem 0.5rem", verticalAlign: "middle" }}>
                      {displayKcal > 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px", alignItems: "flex-start" }}>
                          <span
                            style={{
                              fontSize: "0.78rem",
                              fontWeight: 700,
                              background: "#e0f2fe",
                              color: "#0369a1",
                              borderRadius: "4px",
                              padding: "1px 6px",
                              border: "1px solid #bae6fd",
                              whiteSpace: "nowrap",
                            }}
                          >
                            ≈ {Math.round(displayKcal)} kcal/d
                          </span>
                          {displayFatG > 0 && (
                            <span
                              style={{
                                fontSize: "0.72rem",
                                fontWeight: 600,
                                color: "#c05621",
                                paddingLeft: "4px",
                              }}
                            >
                              ({Math.round(displayFatG * 10) / 10} g fat/d)
                            </span>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: "#94a3b8", fontSize: "0.72rem" }}>—</span>
                      )}
                      {isLipid && (
                        <div
                          style={{
                            fontSize: "0.58rem",
                            fontWeight: 700,
                            background: "#fffbeb",
                            color: "#92400e",
                            borderRadius: "4px",
                            padding: "1px 6px",
                            border: "1px solid #fde68a",
                            marginTop: "3px",
                            display: "inline-block",
                          }}
                        >
                          ⚠ Lipid warning
                        </div>
                      )}
                    </td>

                    {/* Delete button */}
                    <td style={{ padding: "0.35rem 0.5rem", verticalAlign: "middle", textAlign: "center" }}>
                      <button
                        onClick={() => removeOrder(order.id)}
                        style={{
                          background: "none",
                          border: "1px solid #fecaca",
                          color: "#dc2626",
                          borderRadius: "4px",
                          padding: "2px 6px",
                          cursor: "pointer",
                          fontSize: "0.68rem",
                        }}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
