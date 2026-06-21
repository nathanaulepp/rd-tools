import React from "react";
import { useLabsStore, sortColumns } from "../../stores/useLabsStore";
import { GLOBAL_LAB_CATALOG } from "../../shared/data/biochemicalCatalog";
import { SummaryCard } from "./SummaryShared";
import type { LabColumn } from "../../types";

function formatDateLabel(dateStr: string, timeStr: string): string {
  const hasDate = dateStr && dateStr.trim() !== "";
  const hasTime = timeStr && timeStr.trim() !== "";
  if (!hasDate && !hasTime) return "Unscheduled";

  let formattedDate = "";
  if (hasDate) {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) {
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        formattedDate = `${months[d.getMonth()]} ${d.getDate()}`;
      } else {
        formattedDate = dateStr;
      }
    } else {
      formattedDate = dateStr;
    }
  }

  if (hasTime) {
    const timeVal = timeStr.trim();
    if (formattedDate) {
      return `${formattedDate}, ${timeVal}`;
    }
    return timeVal;
  }

  return formattedDate;
}

export default function SummaryBiochemCard() {
  const { labs, columns, activeLabKeys } = useLabsStore();

  if (!activeLabKeys || activeLabKeys.length === 0) {
    return (
      <SummaryCard title="B. Biochemical Data" color="#e74c3c">
        <p style={{ fontSize: "0.85rem", color: "#94a3b8", fontStyle: "italic" }}>No biochemical data recorded.</p>
      </SummaryCard>
    );
  }

  // Filter to keys that have data
  const populatedKeys = activeLabKeys.filter((key: string) => {
    const entry = GLOBAL_LAB_CATALOG[key];
    if (!entry) return false;
    return Object.values(labs[key]?.values ?? {}).some((v) => typeof v === "string" && v.trim() !== "");
  });

  if (populatedKeys.length === 0) {
    return (
      <SummaryCard title="B. Biochemical Data" color="#e74c3c">
        <p style={{ fontSize: "0.85rem", color: "#94a3b8", fontStyle: "italic" }}>No biochemical data recorded.</p>
      </SummaryCard>
    );
  }

  const sortedColumns: LabColumn[] = sortColumns(columns);

  return (
    <SummaryCard title="B. Biochemical Data" color="#e74c3c">
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Lab Test</th>
            {sortedColumns.map((col) => (
              <th key={col.id} style={styles.th}>
                {formatDateLabel(col.date, col.time)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {populatedKeys.map((key) => {
            const entry = GLOBAL_LAB_CATALOG[key];
            const name = entry?.name || key;
            const unit = entry?.defaultUnit || "";

            return (
              <tr key={key}>
                <td style={styles.td}>
                  <div style={{ fontWeight: 600 }}>{name}</div>
                  {unit && (
                    <div style={{ fontSize: "0.68rem", color: "#94a3b8", marginTop: "2px" }}>
                      {unit}
                    </div>
                  )}
                </td>
                {sortedColumns.map((col) => {
                  const val = labs[key]?.values?.[col.id] || "---";
                  return (
                    <td key={col.id} style={styles.td}>
                      {val}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </SummaryCard>
  );
}

const styles = {
  table: { width: "100%", borderCollapse: "collapse" as any, fontSize: "0.85rem", marginBottom: "0.5rem" },
  th: { textAlign: "left" as any, padding: "0.5rem", borderBottom: "1px solid #e2e8f0", color: "#94a3b8", fontWeight: 600 },
  td: { padding: "0.5rem", borderBottom: "1px solid #f1f5f9", verticalAlign: "top" as any },
};
