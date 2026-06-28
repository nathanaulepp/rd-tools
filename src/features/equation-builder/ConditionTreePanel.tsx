import { useEquationEngineStore } from "../../stores/useEquationEngineStore";
import ConditionTreeNode from "./ConditionTreeNode";

interface ConditionTreePanelProps {
  toggleExpanded: (id: string) => void;
  isExpanded: (id: string) => boolean;
}

export default function ConditionTreePanel({
  toggleExpanded,
  isExpanded,
}: ConditionTreePanelProps) {
  const conditions = useEquationEngineStore(s => s.conditions);

  const roots = conditions
    .filter(c => c.parentId === null)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const handleAddRoot = async () => {
    const name = window.prompt("Enter root condition name:");
    if (name && name.trim()) {
      await useEquationEngineStore.getState().addCondition(name.trim(), null);
    }
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100%",
      boxSizing: "border-box"
    }}>
      {/* Scrollable list area */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        paddingRight: "4px",
        marginBottom: "1rem"
      }}>
        {roots.map(root => (
          <ConditionTreeNode
            key={root.id}
            node={root}
            depth={0}
            isExpanded={isExpanded}
            toggleExpanded={toggleExpanded}
          />
        ))}
        {roots.length === 0 && (
          <div style={{ padding: "1rem", color: "#94a3b8", fontSize: "0.8rem", textAlign: "center" }}>
            No conditions found.
          </div>
        )}
      </div>

      {/* Add root button */}
      <button
        onClick={handleAddRoot}
        style={{
          width: "100%",
          padding: "8px 12px",
          background: "#f1f5f9",
          border: "1px dashed #cbd5e1",
          borderRadius: "6px",
          color: "#475569",
          fontSize: "0.8rem",
          fontWeight: 700,
          cursor: "pointer",
          textAlign: "center",
          transition: "all 0.15s ease",
        }}
        onMouseOver={e => {
          e.currentTarget.style.background = "#e2e8f0";
          e.currentTarget.style.borderStyle = "solid";
        }}
        onMouseOut={e => {
          e.currentTarget.style.background = "#f1f5f9";
          e.currentTarget.style.borderStyle = "dashed";
        }}
      >
        ＋ Add Root Condition
      </button>
    </div>
  );
}
