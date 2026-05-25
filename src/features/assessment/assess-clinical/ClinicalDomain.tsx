import React from 'react';
import { ChipGroup } from '../../../shared/ui/ChipGroup';

export default function ClinicalDomain({ clinical, setClinical }: any) {
  const handleUpdate = (field: string, val: string | string[]) =>
    setClinical({ ...clinical, [field]: val });

  const nfpeOptions = ["Normal", "Mild", "Moderate", "Severe"];

  const withDefaults = (options: string[]) => ["WNL", ...options, "Other"];
  const micronutrientCategories = [
      { area: "Hair", options: withDefaults(["Alopecia", "Depigmentation", "Flag Sign", "Thinning", "Corkscrew", "Hirsutism"]) },
      { area: "Eyes", options: withDefaults(["Pale Conjunctiva", "Nyctalopia", "Bitot's Spots", "Corneal Xerosis", "Keratomalacia", "Opthalmoplegia", "Kayser-Fleischer Rings", "Corneal Vascularization", "Xanthelasma", "Corneal Arcus"]) },
      { area: "MouthLips", options: withDefaults(["Angular Stomatitis", "Cheilitis", "Sore/Swelling", "Excessive Saliva", "Pale Mucosa"]) },
      { area: "Tongue", options: withDefaults(["Glossitis", "Scorbutic", "Pale", "Magenta", "Beefy Red, Smooth", "Thrush", "Geographic", "Strawberry", "Dysguesia"]) },
      { area: "TeethGums", options: withDefaults(["Gingivitis, Scorbutic", "Dark Spots", "Mottling", "White streaks", "Delayed Tooth Eruption", "Caries", "White or Yellow Bands"]) },
      { area: "HeadNeck", options: withDefaults(["Goiter", "Moon Face", "Sialadenosis"]) },
      { area: "Nails", options: withDefaults(["Koilonychia", "Beau's Lines", "Muehrcke Lines", "Mees Lines", "Splinter Hemorrhage", "Brittle", "Vertical Ridges", "Clubbing", "Leukonychia", "Half and Half", "Terry's Nail", "Pitting"]) },
      { area: "Skin", options: withDefaults(["Delayed Wound Healing", "Bedsore", "Seborrheic Dermatitis", "Reddish-purple Spots", "Bruising", "Pallor", "Follicular Hyperkeratosis", "Hypopigmentation", "Hyperpigmentation", "Pellagra", "Bilateral edema", "Poor Turgor ", "Carotenemia ", "Jaundice ", "Acanthosis Nigricans"]) },
    ];

  const severityMap = {
    "Normal": "success", "None": "success", "Mild": "warning-bg", "Moderate": "warning", "Severe": "danger", "Edema": "danger",
    "+1": "warning-bg", "+2": "warning", "+3": "danger", "+4": "danger"
  };

  return (
    <div className="fade-in">
      <h2 className="section-title">C. Clinical Findings & NFPE</h2>

      <div className="card">
        <h4 className="mb-1">C3: Medical Context</h4>
        <div className="grid-2-col">
          <div className="input-group">
            <label>Chief Complaint</label>
            <textarea value={clinical.chiefComplaint} onChange={e => handleUpdate("chiefComplaint", e.target.value)} />
          </div>
          <div className="input-group">
            <label>Medical History</label>
            <textarea value={clinical.medHx} onChange={e => handleUpdate("medHx", e.target.value)} />
          </div>
        </div>
      </div>

      <div className="card">
        <h4 className="mb-1">C2: GI & Systemic Function</h4>
        <div className="grid-2-col">
          <div className="input-group">
            <label>GI Distress</label>
            <input type="text" value={clinical.giDistress} onChange={e => handleUpdate("giDistress", e.target.value)} placeholder="e.g. nausea, vomiting, diarrhea" />
          </div>
          <div className="input-group">
            <label>Oral/Chewing</label>
            <input type="text" value={clinical.chewing} onChange={e => handleUpdate("chewing", e.target.value)} placeholder="e.g. missing molars/incisors, tongue-tied" />
          </div>
          <div className="input-group">
            <label>Oral Hygiene</label>
            <input type="text" value={clinical.oralHygiene} onChange={e => handleUpdate("oralHygiene", e.target.value)} placeholder="e.g. brushes teeth, no floss" />
          </div>
          <div className="input-group">
            <label>Swallowing</label>
            <input type="text" value={clinical.swallowing} onChange={e => handleUpdate("swallowing", e.target.value)} placeholder="e.g. painful oropharyngeal dysphagia" />
          </div>
        </div>
      </div>

      <div className="grid-2-col">
        <div className="card">
          <h4 className="mb-1">C11: Muscle Mass Wasting</h4>
          {["Temples", "Clavicles", "Shoulders", "Scapula", "Interosseous", "Thighs", "Calves"].map(muscle => {
            const key = muscle.toLowerCase();
            return (
              <div className="input-group" key={muscle}>
                <label className="flex-between">{muscle}</label>
                <ChipGroup
                  multiSelect={false}
                  options={nfpeOptions}
                  value={clinical[key]}
                  onChange={v => handleUpdate(key, v)}
                  severityMap={severityMap}
                />
              </div>
            );
          })}
        </div>

        <div className="card">
          <h4 className="mb-1">C12: Subcutaneous Fat Loss</h4>
          {["Orbital", "Cheek", "TricepsFat", "MidAxillary"].map(fatStr => {
            const key = fatStr.charAt(0).toLowerCase() + fatStr.slice(1);
            return (
              <div className="input-group" key={fatStr}>
                <label>{fatStr.replace("Fat", "")}</label>
                <ChipGroup
                  multiSelect={false}
                  options={nfpeOptions}
                  value={clinical[key]}
                  onChange={v => handleUpdate(key, v)}
                  severityMap={severityMap}
                />
              </div>
            );
          })}

          <h4 className="mb-1 mt-1">C13: Fluid Accumulation</h4>
          <div className="input-group">
            <label>Pitting Edema</label>
            <ChipGroup
              multiSelect={false}
              options={["None", "+1", "+2", "+3", "+4"]}
              value={clinical.pittingEdema}
              onChange={v => handleUpdate("pittingEdema", v)}
              severityMap={severityMap}
            />
          </div>
          <div className="input-group mt-1">
            <label>Edema Description (Optional)</label>
            <input 
              type="text" 
              value={clinical.edemaDescription} 
              onChange={e => handleUpdate("edemaDescription", e.target.value)}
              placeholder="e.g. bilateral legs"
            />
          </div>
          <div className="input-group mt-1">
            <label>Ascites</label>
            <ChipGroup
              multiSelect={false}
              options={["None", "Mild", "Moderate", "Severe"]}
              value={clinical.ascites}
              onChange={v => handleUpdate("ascites", v)}
              severityMap={severityMap}
            />
          </div>

          <h4 className="mb-1 mt-1">C14: Functional Status</h4>
          <div className="input-group">
            <label>Functional Grip Strength</label>
            <ChipGroup
              multiSelect={false}
              options={["WNL", "Measurably Reduced"]}
              value={clinical.gripStrength}
              onChange={v => handleUpdate("gripStrength", v)}
              severityMap={{ "Measurably Reduced": "warning" }}
            />
          </div>
        </div>
      </div>

      <div className="card">
        <h4 className="mb-1">C15: Micronutrient Signs (Physical Exam)</h4>
        <div className="grid-4-col">
          {micronutrientCategories.map(({ area, options }) => {
            const key = area.replace(/^(.)/, (c: string) => c.toLowerCase());
            return (
              <div className="input-group" key={area}>
                <label>{area.replace(/([A-Z])/g, ' $1').trim()}</label>
                <ChipGroup
                  options={options}
                  value={clinical[key] || []}
                  onChange={v => handleUpdate(key, v)}
                  severityMap={severityMap}
                />
              </div>
            );
          })}
        </div>
        <div className="input-group mt-1">
          <label>Clinical Notes (Nuance)</label>
          <textarea
            value={clinical.clinicalNotes}
            onChange={e => handleUpdate("clinicalNotes", e.target.value)}
            placeholder="Add nuance for physical findings..."
          />
        </div>
      </div>
    </div>
  );
}