import React from "react";
import { usePatientHistoryStore } from "../../stores/usePatientHistoryStore";
import { SummaryCard, SummaryRow } from "./SummaryShared";

export default function SummaryPatientHistoryCard() {
  const { patientHistory } = usePatientHistoryStore();

  return (
    <SummaryCard title="Patient History" color="#16a085">
      <SummaryRow label="Purpose of Visit" value={patientHistory?.purposeOfVisit} />
      <SummaryRow label="Chief Complaint" value={patientHistory?.chiefComplaint} />
      <SummaryRow label="Medical Hx" value={patientHistory?.medHx} />
      <SummaryRow label="Family Hx" value={patientHistory?.familyHx} />
      <SummaryRow label="Social Hx" value={patientHistory?.socialHx} />
    </SummaryCard>
  );
}
