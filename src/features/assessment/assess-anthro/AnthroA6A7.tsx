// src/features/assessment/assess-anthro/AnthroA6A7.tsx
// Phase 5: Reads useAnthroStore directly. No props for domain state.

import React from "react";
import GrowthVelocityTable from "./GrowthVelocityTable";
import GrowthStandardsTable from "./GrowthStandardsTable";
import { MeasurementInput } from "../../../shared/ui/MeasurementInput";
import { useAnthroStore } from "../../../stores/useAnthroStore";
import { useNoteStore } from "../../../stores/useNoteStore";
import { useCalculatedMetrics } from "../../../stores/useCalculatedMetrics";
import type { Anthro } from "../../../types";

export default function AnthroA6A7() {
  const { anthro, setAnthro } = useAnthroStore();
  const patientData = useNoteStore((s) => s.patientData);
  const calculatedMetrics = useCalculatedMetrics();

  const handleUpdate = (field: keyof Anthro, val: any) =>
    setAnthro({ [field]: val });

  return (
    <>
      <div className="card">
        <h4 className="mb-1">A6: Growth Velocity (Pediatrics)</h4>
        <div className="grid-3-col">
          <MeasurementInput
            label="Past Height/Length"
            value={anthro.past_ht}
            onChange={(v) => handleUpdate("past_ht", v)}
            unit={anthro.past_htUnit}
            onUnitChange={(u) => handleUpdate("past_htUnit", u)}
            unitOptions={["cm", "in"]}
            date={anthro.past_htDate}
            onDateChange={(d) => handleUpdate("past_htDate", d)}
            dateLabel="Date Measured"
          />
          <MeasurementInput
            label="Past Weight"
            value={anthro.past_wt}
            onChange={(v) => handleUpdate("past_wt", v)}
            unit={anthro.past_wtUnit}
            onUnitChange={(u) => handleUpdate("past_wtUnit", u)}
            unitOptions={["g", "oz", "kg", "lbs"]}
            date={anthro.past_wtDate}
            onDateChange={(d) => handleUpdate("past_wtDate", d)}
            dateLabel="Date Measured"
          />
          <MeasurementInput
            label="Past Head Circ."
            value={anthro.past_head}
            onChange={(v) => handleUpdate("past_head", v)}
            unit={anthro.past_headUnit}
            onUnitChange={(u) => handleUpdate("past_headUnit", u)}
            unitOptions={["cm", "in"]}
            date={anthro.past_headDate}
            onDateChange={(d) => handleUpdate("past_headDate", d)}
            dateLabel="Date Measured"
          />
        </div>

        <GrowthVelocityTable
          anthro={anthro}
          patientData={patientData}
          calculatedMetrics={calculatedMetrics}
        />
      </div>

      <GrowthStandardsTable
        anthro={anthro}
        patientData={patientData}
        calculatedMetrics={calculatedMetrics}
      />
    </>
  );
}