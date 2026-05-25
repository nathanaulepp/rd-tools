import { ReactNode, CSSProperties } from "react";

interface FieldProps {
  label: string;
  id?: string;
  children: ReactNode;
  style?: CSSProperties;
}

export const Field = ({ label, id, children, style }: FieldProps) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px", ...style }}>
      <label
        htmlFor={id}
        style={{
          fontSize: "0.72rem",
          fontWeight: 700,
          color: "#4a5568",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
};
