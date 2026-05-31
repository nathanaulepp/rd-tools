// src/features/assessment/assess-biochemical/BiochemicalDomain.tsx
// Phase 5: Reads useLabsStore directly. No props for domain state.

import React from "react";
import { LAB_CATEGORIES } from "../../../shared/constants/labCategories";
import { BIOCHEMICAL_CATEGORIES } from "../../../shared/constants/adimeSideBarCategories";
import { DomainHeader } from "../../../shared/ui/DomainHeader";
import { useLabsStore } from "../../../stores/useLabsStore";
import { useUIStore } from "../../../stores/useUIStore";

export default function BiochemicalDomain() {
  const { labs, updateLabField } = useLabsStore();
  const activeSubDomain = useUIStore((s) => s.activeSubDomain);

  const renderContent = () => {
    // Extract index from B1, B2, etc.
    const categoryIndex = parseInt(activeSubDomain?.replace("B", "") || "1") - 1;
    const category = LAB_CATEGORIES[categoryIndex];

    if (!category) return <div>Select a sub-domain from the sidebar.</div>;

    return (
      <div className="card">
        <h4 className="mb-1">{category.title}</h4>
        <div className="table-container">
          <table className="lab-table">
            <thead>
              <tr>
                <th style={{ width: "40%" }}>Test Name</th>
                <th style={{ width: "30%" }}>Historical Value</th>
                <th style={{ width: "30%" }}>Current Value</th>
              </tr>
            </thead>
            <tbody>
              {category.fields.map((field) => {
                const currentVal = labs[field]?.current || "";
                const historicalVal = labs[field]?.historical || "";
                return (
                  <tr key={field}>
                    <td>
                      <strong>{field}</strong>
                    </td>
                    <td>
                      <input
                        type="text"
                        placeholder="--"
                        value={historicalVal}
                        onChange={(e) =>
                          updateLabField(field, "historical", e.target.value)
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        placeholder="--"
                        value={currentVal}
                        onChange={(e) =>
                          updateLabField(field, "current", e.target.value)
                        }
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="fade-in">
      <DomainHeader
        title={
          BIOCHEMICAL_CATEGORIES.find((c) => c.id === activeSubDomain)?.title ||
          "Biochemical Data"
        }
      />
      {renderContent()}
    </div>
  );
}