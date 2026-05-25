import { useState } from 'react';

export const [anthro, setAnthro] = useState({ 
    ht: "", htUnit: "cm", wt: "", wtUnit: "kg", ubw: "", ubwTime_amount1: "", ubwTime_unit1: "", ubwTime_amount2: "", ubwTime_unit2: "",
    waist: "", mac: "", calf: "", head: "", circUnit: "cm",
    triceps: "", subscapular: "", suprailiac: "", thigh: "", skinfoldUnit: "cm",
    past_ht: "cm", past_htUnit: "cm", past_wt: "", past_wtUnit: "kg",  past_head: "", past_headUnit: "cm", 
    past_htDate: "", past_wtDate: "", past_headDate: ""
  });
  const [dexaScans, setDexaScans] = useState<any[]>([]);
  const [labs, setLabs] = useState<Record<string, { current: string, historical: string }>>({});
  const [clinical, setClinical] = useState({
    chiefComplaint: "", medHx: "", temples: "", clavicles: "", shoulders: "", scapula: "", interosseous: "", thighs: "", calves: "",
    orbital: "", cheek: "", tricepsFat: "", midAxillary: "",
    hair: "", eyes: "", mouthLips: "", tongue: "", teethGums: "", headNeck: "", nails: "", skin: "", gripStrength: "",
    giDistress: "", chewing: "", oralHygiene: "", swallowing: "", clinicalNotes: ""
  });
  const [dietary, setDietary] = useState({
    recall: { breakfast: "", lunch: "", dinner: "", snacks: "" },
    macroAdequacy: "", mealPatterns: "", currentDiets: "", fluidIntake: "", eatingEnv: "",
    culturalReligious: "", socialDynamics: "", dietOrder: "Standard Diet, Regular", actualIntake: "", enteralPN: "",
    drugInteractions: "", otcMeds: "", herbalCAM: "", supplements: "",
    understanding: "", readiness: "5", psychTies: "", mealPrep: "", eatingOut: "", bingePurge: "",
    foodSecurity: "", foodSupplies: "", transport: "", physicalLevel: "", adls: "", feedingTasks: "", perception: "", qolGoals: ""
  });

export const [patientData, setPatientData] = useState({
    lastName: '',
    firstName: '',
    dob: '',
    sex: '',
    mrn: '',
    admissionDate: new Date().toISOString().split('T')[0],
    noteDate: new Date().toISOString().split('T')[0],
    languages: ''});