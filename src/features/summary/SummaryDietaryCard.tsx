import React from "react";
import { useDietaryStore } from "../../stores/useDietaryStore";
import { SummaryCard, SummaryRow } from "./SummaryShared";

export default function SummaryDietaryCard() {
  const { dietary } = useDietaryStore();

  return (
    <SummaryCard title="D. Dietary Data & Nutrition Support" color="#8e44ad">
      {dietary?.recall && dietary.recall.length > 0 && (
        <div style={{ marginBottom: "1rem" }}>
          <h4 style={styles.subGroup}>24-Hour Dietary Recall</h4>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Meal</th>
                <th style={styles.th}>Description</th>
              </tr>
            </thead>
            <tbody>
              {dietary.recall.map((r, i) => (
                <tr key={i}>
                  <td style={styles.td}><strong>{r.label}</strong></td>
                  <td style={styles.td}>{r.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
        <div>
          <h4 style={styles.subGroup}>Intake Summary</h4>
          <SummaryRow label="Diet Order" value={dietary?.dietOrder} />
          <SummaryRow label="Estimated Calories" value={dietary?.oralCalories} unit="kcal/d" />
          <SummaryRow label="Estimated Protein" value={dietary?.oralProtein} unit="g/d" />
          {dietary?.verifiedRxDiet && (
            <div style={{ color: "#16a34a", fontSize: "0.85rem", marginTop: "0.5rem", display: "flex", alignItems: "center", gap: "0.25rem", fontWeight: 500 }}>
              ✓ Verified receiving current Rx diet and supplements as ordered
            </div>
          )}
        </div>
        <div>
          <h4 style={styles.subGroup}>Behavioral & Access</h4>
          <SummaryRow label="Meal Patterns" value={dietary?.mealPatterns} />
          <SummaryRow label="Fluid Intake" value={dietary?.fluidIntake} />
          <SummaryRow label="Estimated Intake" value={dietary?.eeiPercent} unit="%" />
          <SummaryRow label="Intake Timeframe" value={dietary?.eeiTimeframe} unit="days" />
          <SummaryRow label="Physical Activity" value={dietary?.physicalLevel} />
          <SummaryRow label="ADLs" value={dietary?.adls} />
          <SummaryRow label="Food Security" value={dietary?.foodSecurity} />
          <SummaryRow label="Cultural/Religious" value={dietary?.culturalReligious} />
          <SummaryRow label="Social Dynamics" value={dietary?.socialDynamics} />
          <SummaryRow label="Eating Environment" value={dietary?.eatingEnv} />
          <SummaryRow label="Supplements" value={dietary?.supplements} />
          <SummaryRow label="Herbal/CAM" value={dietary?.herbalCAM} />
          <SummaryRow label="Patient Perception" value={dietary?.perception} />
          <SummaryRow label="QoL Goals" value={dietary?.qolGoals} />
          <SummaryRow label="Readiness to Change" value={dietary?.readiness} unit="/ 10" />
        </div>
      </div>

      {dietary?.ivOrders && dietary.ivOrders.length > 0 && (
        <div style={{ marginTop: "1rem" }}>
          <h4 style={styles.subGroup}>IV Orders</h4>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Solution</th>
                <th style={styles.th}>Volume (mL)</th>
                <th style={styles.th}>Rate (mL/hr)</th>
                <th style={styles.th}>Hrs/Day</th>
              </tr>
            </thead>
            <tbody>
              {dietary.ivOrders.map((iv, i) => (
                <tr key={i}>
                  <td style={styles.td}>{iv.type}</td>
                  <td style={styles.td}>{iv.totalVolumeMl}</td>
                  <td style={styles.td}>{iv.rateMlHr}</td>
                  <td style={styles.td}>{iv.hrsPerDay}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SummaryCard>
  );
}

const styles = {
  subGroup: { fontSize: "0.75rem", fontWeight: 700, margin: "0 0 0.5rem", color: "#475569", textTransform: "uppercase" as any },
  table: { width: "100%", borderCollapse: "collapse" as any, fontSize: "0.85rem", marginBottom: "0.5rem" },
  th: { textAlign: "left" as any, padding: "0.5rem", borderBottom: "1px solid #e2e8f0", color: "#94a3b8", fontWeight: 600 },
  td: { padding: "0.5rem", borderBottom: "1px solid #f1f5f9" },
};
