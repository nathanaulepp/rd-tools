import React, { useState } from 'react';

interface Patient {
  id: string;
  name: string;
  dob: string;
  mrn: string;
}

export default function PatientHeader() {
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  
  const [newPatientData, setNewPatientData] = useState({
    name: '',
    dob: '',
    sex: '',
    admissionDate: new Date().toISOString().split('T')[0],
    languages: ''
  });
  
  const previousPatients: Patient[] = [
    { id: '1', name: 'Doe, John', dob: '05/14/1980 (45y)', mrn: '9823471' },
    { id: '2', name: 'Smith, Jane', dob: '08/22/1992 (33y)', mrn: '1029384' }
  ];

  const handleSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPatientId(e.target.value);
  };

  const handleNewPatientChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setNewPatientData({
      ...newPatientData,
      [e.target.name]: e.target.value
    });
  };

  const selectedPatient = previousPatients.find(p => p.id === selectedPatientId);

  return (
    // The sticky wrapper keeps this pinned to the top while scrolling domains
    <section style={{ position: 'sticky', top: 0, zIndex: 50, background: 'var(--bg-color, #f4f7f6)', paddingBottom: '1rem', paddingTop: '1rem' }}>
      
      {/* Utilizing your native .card class for the container */}
      <div className="card" style={{ marginBottom: 0 }}>
        
        {/* Utilizing your native .flex-between for the top row */}
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
                   {patient.name}
                </option>
              ))}
            </select>
          </div>

          {/* Utilizing your native .chip class, just like the BMI indicator */}
          {selectedPatientId !== 'NEW' && selectedPatient && (
            <span className="chip active">
              DOB: {selectedPatient.dob} | MRN: {selectedPatient.mrn}
            </span>
          )}
        </h4>

        {/* Utilizing your native .input-group class for demographics */}
        {selectedPatientId === 'NEW' && (
          // Using a flex row that behaves like your grid-4-col but ensures 5 items fit nicely
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '15px' }}>
              
              <div className="input-group" style={{ flex: '1 1 150px' }}>
                <label>Patient Name</label>
                <input type="text" name="name" placeholder="Last, First" value={newPatientData.name} onChange={handleNewPatientChange} />
              </div>

              <div className="input-group" style={{ flex: '1 1 120px' }}>
                <label>Date of Birth</label>
                <input type="date" name="dob" value={newPatientData.dob} onChange={handleNewPatientChange} />
              </div>
              
              <div className="input-group" style={{ flex: '0 1 80px' }}>
                <label>Sex</label>
                <select name="sex" value={newPatientData.sex} onChange={handleNewPatientChange}>
                  <option value=""></option>
                  <option value="M">M</option>
                  <option value="F">F</option>
                </select>
              </div>

              <div className="input-group" style={{ flex: '1 1 120px' }}>
                <label>Admission Date</label>
                <input type="date" name="admissionDate" value={newPatientData.admissionDate} onChange={handleNewPatientChange} />
              </div>

              <div className="input-group" style={{ flex: '1 1 100px' }}>
                <label>Languages (Opt)</label>
                <input type="text" name="languages" placeholder="e.g. Spanish" value={newPatientData.languages} onChange={handleNewPatientChange} />
              </div>

          </div>
        )}
      </div>
    </section>
  );
}