import React, { useState } from "react";
import { useEquationEngineStore } from "../../stores/useEquationEngineStore";
import type { CustomCondition } from "../../types/equationEngine";

interface ConditionTreeNodeProps {
  node: CustomCondition;
  depth: number;
  isExpanded: (id: string) => boolean;
  toggleExpanded: (id: string) => void;
}

export default function ConditionTreeNode({
  node,
  depth,
  isExpanded,
  toggleExpanded,
}: ConditionTreeNodeProps) {
  const conditions = useEquationEngineStore(s => s.conditions);
  const selectedConditionId = useEquationEngineStore(s => s.selectedConditionId);
  const [isHovered, setIsHovered] = useState(false);

  const children = conditions
    .filter(c => c.parentId === node.id)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const isLeaf = children.length === 0;
  const isSelected = selectedConditionId === node.id;
  const expanded = isExpanded(node.id);

  const handleNodeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLeaf) {
      useEquationEngineStore.getState().setSelectedCondition(node.id);
    } else {
      toggleExpanded(node.id);
    }
  };

  const handleChevronClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleExpanded(node.id);
  };

  const handleAddChild = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const name = window.prompt("Enter child condition name:");
    if (name && name.trim()) {
      await useEquationEngineStore.getState().addCondition(name.trim(), node.id);
    }
  };

  const handleRename = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const name = window.prompt("Rename condition:", node.name);
    if (name && name.trim() && name.trim() !== node.name) {
      await useEquationEngineStore.getState().updateCondition(node.id, { name: name.trim() });
    }
  };

  const handleArchive = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const confirm = window.confirm(`Are you sure you want to archive "${node.name}"?`);
    if (confirm) {
      await useEquationEngineStore.getState().archiveCondition(node.id);
      // If the currently selected condition was archived, deselect it
      if (selectedConditionId === node.id) {
        useEquationEngineStore.getState().setSelectedCondition(null);
      }
    }
  };

  const itemStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "6px 8px",
    paddingLeft: `${depth * 12 + 8}px`,
    background: isSelected ? "#e0f2fe" : "transparent",
    borderLeft: isSelected ? "3px solid #0ea5e9" : "3px solid transparent",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "0.83rem",
    transition: "all 0.15s ease",
  };

  const actionBtnStyle: React.CSSProperties = {
    background: "none",
    border: "none",
    color: "#64748b",
    cursor: "pointer",
    padding: "2px 4px",
    fontSize: "0.8rem",
    borderRadius: "3px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {/* Node Row */}
      <div
        style={itemStyle}
        onClick={handleNodeClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flex: 1, minWidth: 0 }}>
          {/* Chevron or Bullet */}
          {!isLeaf ? (
            <span
              onClick={handleChevronClick}
              style={{
                display: "inline-block",
                width: "14px",
                height: "14px",
                textAlign: "center",
                lineHeight: "14px",
                fontSize: "0.6rem",
                color: "#64748b",
                transform: expanded ? "rotate(90deg)" : "none",
                transition: "transform 0.15s ease",
                cursor: "pointer",
              }}
            >
              ▶
            </span>
          ) : (
            <span style={{ display: "inline-block", width: "14px", textAlign: "center", fontSize: "0.5rem", color: "#94a3b8" }}>
              ●
            </span>
          )}

          {/* Label */}
          <span style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            color: isSelected ? "#0369a1" : "#334155",
            fontWeight: isSelected ? 600 : 500
          }}>
            {node.name}
          </span>

          {/* Seeded Badge */}
          {node.isSeeded && (
            <span style={{
              fontSize: "0.6rem",
              background: "#f1f5f9",
              color: "#64748b",
              borderRadius: "3px",
              padding: "1px 4px",
              fontWeight: 600
            }}>
              S
            </span>
          )}
        </div>

        {/* Action Buttons */}
        {isHovered && (
          <div style={{ display: "flex", gap: "4px" }} onClick={e => e.stopPropagation()}>
            <button title="Add Child" style={actionBtnStyle} onClick={handleAddChild}>＋</button>
            <button title="Rename" style={actionBtnStyle} onClick={handleRename}>✎</button>
            <button title="Archive" style={{ ...actionBtnStyle, color: "#ef4444" }} onClick={handleArchive}>✕</button>
          </div>
        )}
      </div>

      {/* Recursive Children */}
      {expanded && children.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {children.map(child => (
            <ConditionTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              isExpanded={isExpanded}
              toggleExpanded={toggleExpanded}
            />
          ))}
        </div>
      )}
    </div>
  );
}
