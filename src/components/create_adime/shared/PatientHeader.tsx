// src/components/create_adime/shared/PatientHeader.tsx
import React, { useState } from 'react';

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dob: string;
  mrn: string;
  sex?: string; 
}

export default function PatientHeader({ patientData, setPatientData }: any) {
  const [selectedPatientId, setSelectedPatientId] = useState<string>('NEW');
  
  const previousPatients: Patient[] = [
    { id: '1', lastName: 'Doe', firstName: 'John', dob: '1980-05-14', sex: 'M', mrn: '9823471' },
    { id: '2', lastName: 'Smith', firstName: 'Jane', dob: '1992-08-22', sex: 'F', mrn: '1029384' }
  ];

  const handleSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedPatientId(val);
    
    // Auto-fill data if a previous patient is selected
    if (val !== 'NEW') {
      const p = previousPatients.find(p => p.id === val);
      if (p) {
        setPatientData({
          ...patientData,
          firstName: p.firstName,
          lastName: p.lastName,
          dob: p.dob,
          sex: p.sex || ''
        });
      }
    } else {
      // Clear fields when switching back to New Patient
      setPatientData({
        ...patientData,
        firstName: '',
        lastName: '',
        dob: '',
        sex: ''
      });
    }
  };
  

  const handleDataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setPatientData({
      ...patientData,
      [e.target.name]: e.target.value
    });
  };

  const selectedPatient = previousPatients.find(p => p.id === selectedPatientId);

  return (
    <section style={{ position: 'sticky', top: 0, zIndex: 50, background: 'var(--bg-color, #f4f7f6)', paddingBottom: '1rem', paddingTop: '1rem' }}>
      <div className="card" style={{ marginBottom: 0 }}>
        
        <h4 className="flex-between" style={{ margin: 0, borderBottom: selectedPatientId === 'NEW' ? '1px solid #e2e8f0' : 'none', paddingBottom: selectedPatientId === 'NEW' ? '10px' : '0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>Patient Record:</span>
            <select 
              value={selectedPatientId} 
              onChange={handleSelectionChange}
              style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
            >
              <option value="" disabled hidden></option>
              <option value="NEW" style={{ fontWeight: 'bold', color: '#2563eb' }}>+ New Patient</option>
              <option disabled>──────────</option>
              {previousPatients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                   {patient.lastName}, {patient.firstName}
                </option>
              ))}
            </select>
          </div>

          {selectedPatientId !== 'NEW' && selectedPatient && (
            <span className="chip active">
              DOB: {selectedPatient.dob} | MRN: {selectedPatient.mrn}
            </span>
          )}
        </h4>

        {selectedPatientId === 'NEW' && (
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '15px' }}>
            <div className="input-group" style={{ flex: '1 1 130px' }}>
              <label>Last Name</label>
              <input
                type="text"
                name="lastName"
                placeholder="Last name"
                value={patientData?.lastName || ''}
                onChange={handleDataChange}
              />
            </div>
            <div className="input-group" style={{ flex: '1 1 130px' }}>
              <label>First Name</label>
              <input
                type="text"
                name="firstName"
                placeholder="First name"
                value={patientData?.firstName || ''}
                onChange={handleDataChange}
              />
            </div>

              <div className="input-group" style={{ flex: '1 1 120px' }}>
                <label>Date of Birth</label>
                <input type="date" name="dob" value={patientData?.dob || ''} onChange={handleDataChange} />
              </div>
              
              <div className="input-group" style={{ flex: '0 1 80px' }}>
                <label>Sex</label>
                <select name="sex" value={patientData?.sex || ''} onChange={handleDataChange}>
                  <option value=""></option>
                  <option value="M">M</option>
                  <option value="F">F</option>
                </select>
              </div>

              <div className="input-group" style={{ flex: '1 1 120px' }}>
                <label>Admission Date</label>
                <input type="date" name="admissionDate" value={patientData?.admissionDate || ''} onChange={handleDataChange} />
              </div>

              <div className="input-group" style={{ flex: '1 1 120px' }}>
                <label>Note Date</label>
                <input type="date" name="noteDate" value={patientData?.noteDate || ''} onChange={handleDataChange} />
              </div>

              <div className="input-group" style={{ flex: '1 1 100px' }}>
                <label>Languages (Opt)</label>
                <input type="text" name="languages" placeholder="e.g. Spanish" value={patientData?.languages || ''} onChange={handleDataChange} />
              </div>
          </div>
        )}
      </div>
    </section>
  );
}