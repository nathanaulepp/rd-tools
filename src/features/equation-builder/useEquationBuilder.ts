import { useState } from "react";

export function useEquationBuilder() {
  const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    setExpandedNodeIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isExpanded = (id: string) => expandedNodeIds.has(id);

  return { expandedNodeIds, toggleExpanded, isExpanded };
}
