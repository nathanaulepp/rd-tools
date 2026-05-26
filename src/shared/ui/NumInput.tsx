// src/shared/ui/NumInput.tsx
import React, { CSSProperties } from "react";

interface NumInputProps {
  value: string | number;
  onChange: (val: string) => void;
  placeholder?: string;
  style?: CSSProperties;
  disabled?: boolean;
}

export const NumInput = ({ value, onChange, placeholder = "", style = {}, disabled = false }: NumInputProps) => {
  return (
    <input
      type="number"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
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
    />
  );
};
