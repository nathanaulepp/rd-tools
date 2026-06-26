import React from "react";
import { DomainHeader } from "../../../shared/ui/DomainHeader";
import PatientHistoryPH1 from "./PatientHistoryPH1";

export default function PatientHistoryDomain() {
  return (
    <div className="fade-in">
      <DomainHeader title="Patient History" />
      <PatientHistoryPH1 />
    </div>
  );
}
