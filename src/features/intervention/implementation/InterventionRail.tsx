// src/features/intervention/implementation/InterventionRail.tsx
//
// Recursive vertical rail navigator.
// Each depth level renders as a vertical column.
// Clicking a non-leaf opens the next column to the right, closing any deeper
// columns. Clicking a leaf toggles selection in the store.
// A dot indicator appears on any ancestor of a selected leaf (VS Code style).

import React, { useState, useCallback } from "react";
import type { TreeNode } from "../../../shared/constants/interventionTree";
import { useInterventionStore } from "../../../stores/useInterventionStore";

// ── Helpers ───────────────────────────────────────────────────────────────────

function isLeaf(node: TreeNode): boolean {
  return !node.children || node.children.length === 0;
}

/** Returns true if any descendant leaf label is in the selected set. */
function hasSelectedDescendant(node: TreeNode, selected: string[]): boolean {
  if (isLeaf(node)) return selected.includes(node.label);
  return (node.children ?? []).some((child) =>
    hasSelectedDescendant(child, selected)
  );
}

/** Truncate long labels for rail display. Full text shown in tooltip. */
function shortLabel(label: string, maxLen = 52): string {
  return label.length > maxLen ? label.slice(0, maxLen) + "…" : label;
}

// ── Style tokens ──────────────────────────────────────────────────────────────

const COL_W = 220;
const ACCENT = "#3498db";
const SELECTED_BG = "#e6f1fb";
const SELECTED_BORDER = ACCENT;
const ACTIVE_BG = "#f0f7ff";

// ── Single column ─────────────────────────────────────────────────────────────

interface ColumnProps {
  nodes: TreeNode[];
  depth: number;
  activePath: string[];           // label at each depth that is currently open
  selected: string[];             // all selected leaf labels
  onNodeClick: (node: TreeNode, depth: number) => void;
}

function RailColumn({ nodes, depth, activePath, selected, onNodeClick }: ColumnProps) {
  const activeLabel = activePath[depth] ?? null;

  return (
    <div
      style={{
        width: COL_W,
        flexShrink: 0,
        borderRight: "1px solid #e2e8f0",
        overflowY: "auto",
        maxHeight: "100%",
        background: depth % 2 === 0 ? "#fff" : "#fafbfc",
      }}
    >
      {nodes.map((node) => {
        const leaf = isLeaf(node);
        const isActive = activeLabel === node.label;
        const isSelected = leaf && selected.includes(node.label);
        const hasDot = !leaf && hasSelectedDescendant(node, selected);
        const leafSelectedCount = leaf ? 0 :
          countSelectedDescendants(node, selected);

        return (
          <button
            key={node.label}
            title={node.label}
            onClick={() => onNodeClick(node, depth)}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "6px",
              width: "100%",
              textAlign: "left",
              padding: "7px 10px",
              background: isSelected
                ? SELECTED_BG
                : isActive
                ? ACTIVE_BG
                : "transparent",
              border: "none",
              borderLeft: isSelected
                ? `3px solid ${SELECTED_BORDER}`
                : isActive
                ? `3px solid ${ACCENT}80`
                : "3px solid transparent",
              borderBottom: "1px solid #f1f5f9",
              cursor: "pointer",
              fontSize: "0.78rem",
              color: isSelected ? "#0c447c" : "#2c3e50",
              fontWeight: isSelected || isActive ? 600 : 400,
              lineHeight: 1.4,
              transition: "background 0.1s",
            }}
          >
            {/* Selection indicator dot (VS Code style) */}
            <span
              style={{
                flexShrink: 0,
                marginTop: "3px",
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: isSelected
                  ? ACCENT
                  : hasDot
                  ? `${ACCENT}80`
                  : "transparent",
                border: hasDot && !isSelected ? `1px solid ${ACCENT}80` : "none",
              }}
            />

            <span style={{ flex: 1, minWidth: 0 }}>
              {shortLabel(node.label)}
            </span>

            {/* Count badge for branch nodes with selections */}
            {leafSelectedCount > 0 && (
              <span
                style={{
                  flexShrink: 0,
                  fontSize: "0.65rem",
                  background: ACCENT,
                  color: "#fff",
                  borderRadius: "8px",
                  padding: "1px 5px",
                  marginTop: "1px",
                }}
              >
                {leafSelectedCount}
              </span>
            )}

            {/* Chevron for branch nodes */}
            {!leaf && (
              <span
                style={{
                  flexShrink: 0,
                  fontSize: "0.65rem",
                  color: isActive ? ACCENT : "#94a3b8",
                  marginTop: "2px",
                }}
              >
                ›
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function countSelectedDescendants(node: TreeNode, selected: string[]): number {
  if (isLeaf(node)) return selected.includes(node.label) ? 1 : 0;
  return (node.children ?? []).reduce(
    (acc, child) => acc + countSelectedDescendants(child, selected),
    0
  );
}

// ── Main rail ─────────────────────────────────────────────────────────────────

interface InterventionRailProps {
  tree: TreeNode[];
}

export default function InterventionRail({ tree }: InterventionRailProps) {
  const { intervention, toggleLeaf } = useInterventionStore();
  const selected = intervention.ndImplementation.selected;

  // activePath[depth] = label of the node open at that depth
  const [activePath, setActivePath] = useState<string[]>([]);

  const handleNodeClick = useCallback(
    (node: TreeNode, depth: number) => {
      if (isLeaf(node)) {
        toggleLeaf(node.label);
        // Keep the path as-is so the leaf column stays visible
        return;
      }
      // Non-leaf: open this node and truncate any deeper path
      setActivePath((prev) => {
        const next = prev.slice(0, depth);
        next[depth] = node.label;
        return next;
      });
    },
    [toggleLeaf]
  );

  // Build the visible columns based on activePath
  const columns: { nodes: TreeNode[]; depth: number }[] = [
    { nodes: tree, depth: 0 },
  ];

  let currentNodes = tree;
  for (let d = 0; d < activePath.length; d++) {
    const activeLabel = activePath[d];
    const activeNode = currentNodes.find((n) => n.label === activeLabel);
    if (!activeNode || isLeaf(activeNode)) break;
    currentNodes = activeNode.children!;
    columns.push({ nodes: currentNodes, depth: d + 1 });
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        overflowX: "auto",
        border: "1px solid #e2e8f0",
        borderRadius: "8px",
        minHeight: 320,
        maxHeight: 480,
        background: "#fff",
      }}
    >
      {columns.map(({ nodes, depth }) => (
        <RailColumn
          key={depth}
          nodes={nodes}
          depth={depth}
          activePath={activePath}
          selected={selected}
          onNodeClick={handleNodeClick}
        />
      ))}
    </div>
  );
}