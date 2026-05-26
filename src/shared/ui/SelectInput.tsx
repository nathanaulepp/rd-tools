// src/shared/ui/SelectInput.tsx
import React, { CSSProperties } from "react";

interface SelectInputProps {
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder?: string;
  style?: CSSProperties;
  disabled?: boolean;
}

export const SelectInput = ({
  value,
  onChange,
  options,
  placeholder = "Select...",
  style = {},
  disabled = false
}: SelectInputProps) => {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
      style={{
        padding: "5px 8px",
        border: "1px solid #e2e8f0",
        borderRadius: "4px",
        fontSize: "0.88rem",
        width: "100%",
        boxSizing: "border-box",
        ...style
      }}
    >
      <option value="">{placeholder}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
};
