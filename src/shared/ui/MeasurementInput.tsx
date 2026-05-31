// src/shared/ui/MeasurementInput.tsx
// Reusable label + numeric input + optional unit selector.
// Replaces the repeated input-group + input-group-row pattern across
// AnthroA1A5, AnthroA6A7, ClinicalC3C4, and other domain components.
//
// USAGE — value only:
//   <MeasurementInput label="UBW" value={anthro.ubw} onChange={v => setAnthro({ ubw: v })} />
//
// USAGE — value + unit:
//   <MeasurementInput
//     label="Height"
//     value={anthro.ht}
//     onChange={v => setAnthro({ ht: v })}
//     unit={anthro.htUnit}
//     onUnitChange={u => setAnthro({ htUnit: u })}
//     unitOptions={["cm", "in"]}
//   />
//
// USAGE — value + unit + date:
//   <MeasurementInput
//     label="Past Weight"
//     value={anthro.past_wt}
//     onChange={v => setAnthro({ past_wt: v })}
//     unit={anthro.past_wtUnit}
//     onUnitChange={u => setAnthro({ past_wtUnit: u })}
//     unitOptions={["g", "oz", "kg", "lbs"]}
//     date={anthro.past_wtDate}
//     onDateChange={d => setAnthro({ past_wtDate: d })}
//     dateLabel="Date Measured"
//   />

import React, { CSSProperties } from "react";

interface MeasurementInputProps {
  /** Field label rendered above the input */
  label: string;

  /** Current numeric value */
  value: string | number;
  onChange: (val: string) => void;

  /** Placeholder for the numeric input */
  placeholder?: string;

  /** If provided, renders a unit <select> beside the input */
  unit?: string;
  onUnitChange?: (unit: string) => void;
  unitOptions?: string[];
  /** Width of the unit select. Defaults to "70px". */
  unitWidth?: string;

  /** If provided, renders a date <input> below the row */
  date?: string;
  onDateChange?: (date: string) => void;
  /** Label shown above the date input. Defaults to "Date". */
  dateLabel?: string;

  /** Disables both inputs */
  disabled?: boolean;

  /** Extra styles on the outer wrapper */
  style?: CSSProperties;
}

export const MeasurementInput = ({
  label,
  value,
  onChange,
  placeholder = "",
  unit,
  onUnitChange,
  unitOptions = [],
  unitWidth = "70px",
  date,
  onDateChange,
  dateLabel = "Date",
  disabled = false,
  style,
}: MeasurementInputProps) => {
  const hasUnit = unit !== undefined && onUnitChange && unitOptions.length > 0;
  const hasDate = date !== undefined && onDateChange;

  return (
    <div className="input-group" style={style}>
      <label>{label}</label>

      {/* Numeric input row */}
      <div className={hasUnit ? "input-group-row" : undefined}>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
        />
        {hasUnit && (
          <select
            value={unit}
            onChange={(e) => onUnitChange!(e.target.value)}
            disabled={disabled}
            style={{ width: unitWidth }}
          >
            {unitOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Optional date row */}
      {hasDate && (
        <>
          <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.4rem" }}>
            {dateLabel}
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => onDateChange!(e.target.value)}
            disabled={disabled}
          />
        </>
      )}
    </div>
  );
};