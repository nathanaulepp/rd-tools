// src/features/assessment/assess-anthro/AnthroDomain.tsx
// Phase 5: Pure container — all domain state from stores. Zero props required from parent.

import React from "react";
import { DomainHeader } from "../../../shared/ui/DomainHeader";

import AnthroA1A7 from "./AnthroA1A7";
import AnthroA8 from "./AnthroA8";

export default function AnthroDomain() {
  return (
    <div className="fade-in">
      <DomainHeader title="Anthropometrics & DEXA" />
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <AnthroA1A7 />
        <AnthroA8 />
      </div>
    </div>
  );
}