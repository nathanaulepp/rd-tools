import React from "react";
import { usePatientHistoryStore } from "../../../stores/usePatientHistoryStore";
import { CollapseHeader } from "../../../shared/ui/CollapseHeader";
import type { PatientHistory } from "../../../types";

export default function PatientHistoryPH1() {
  const { patientHistory, setPatientHistory } = usePatientHistoryStore();
  const [expanded, setExpanded] = React.useState(true);

  const handleUpdate = (field: keyof PatientHistory, val: string) =>
    setPatientHistory({ [field]: val });

  return (
    <div className="card">
      <CollapseHeader
        label="PH1: Patient History"
        expanded={expanded}
        onToggle={() => setExpanded(!expanded)}
      />
      {expanded && (
        <div className="grid-2-col">
          <div className="input-group">
            <label>Purpose of Visit</label>
            <textarea
              style={{ minHeight: "60px" }}
              value={patientHistory.purposeOfVisit}
              onChange={(e) => handleUpdate("purposeOfVisit", e.target.value)}
            />
          </div>
          <div className="input-group">
            <label>Chief Complaint</label>
            <textarea
              style={{ minHeight: "150px" }}
              value={patientHistory.chiefComplaint}
              onChange={(e) => handleUpdate("chiefComplaint", e.target.value)}
            />
          </div>
          <div className="input-group">
            <label>Medical History</label>
            <textarea
              style={{ minHeight: "150px" }}
              value={patientHistory.medHx}
              onChange={(e) => handleUpdate("medHx", e.target.value)}
            />
          </div>
          <div className="input-group">
            <label>Family History</label>
            <textarea
              style={{ minHeight: "150px" }}
              value={patientHistory.familyHx}
              onChange={(e) => handleUpdate("familyHx", e.target.value)}
              placeholder="e.g. mother and father HTN, maternal father cancer..."
            />
          </div>
          <div className="input-group">
            <label>Social History</label>
            <textarea
              style={{ minHeight: "150px" }}
              value={patientHistory.socialHx}
              onChange={(e) => handleUpdate("socialHx", e.target.value)}
              placeholder="e.g. occupation, education, social support, living situation..."
            />
          </div>
        </div>
      )}
    </div>
  );
}
