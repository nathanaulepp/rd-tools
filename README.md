# rd-tools

**Author:** Nathan Aulepp

## Overview
This project aims to accelerate the completion of clinical dietitian charting work.

### The Problem
Charting is often considered by health administrators as having little-to-zero financial return. Consequently, it consumes valuable time that could be spent on higher-impact clinical tasks.

### The Solution
By reducing time spent on charting, clinicians can expand their scope:
- Increasing face-to-face time with patients.
- Researching complex nutrition edge cases.
- Implementing quality improvement initiatives for their facility.

*Your true (and perceived) value as a dietitian increases as you replace routine charting with more meaningful clinical tasks.*

---

## Roadmap & To-Do List

### RD Workstation
- [x] **add** restructuring informatics, grouping data by unique patient and admission --> encounter/admissionDate/noteDate 
- [x] *patch* legacy FSD violations
- [x] *patch* problem with deletion of patients from records
- [ ] **add** dedicated settings pane on the homepage, and integrate a comparative standards condition editor into it
- [ ] **add** Add keyboard shortcuts (root call is "ctrl + 0")
- [ ] **add** Split panes function

### Assessment
#### Anthro
- [x] pediatric growth chart automated calc for Zscores and %s
- [x] pediatric growth velocity automated calc based on past measures w/ current
- [x] calendar mapping safeguards
- [ ] **add** DEXA scan functionality mapped and coded

#### Biochemical
- [ ] **add** LOINC test lookups and user-designed, hospital-derived template saver. capability to enter lab tests regardless of facility

#### Clinical
- [x] **add** import drug database
- [x] **add** add drug lookup
- [ ] **add** Automated refeeding risk chart
- [ ] **add** Automated drug-nutrient interactions

#### Dietary
- [x] **add** current nutrition rx
- [x] **add** PN macro conc. (unit/vol)
- [x] *patch* formula name submissions for EN
- [x] **add** create functionality for EN modulars (mL/bolus isn't enough)
- [x] *patch* broken autosave for D12 and D13
- [ ] **add** D2.1 automated estimated oral intake, integrating Multiple Pass Dietary Recall
- [ ] **add** Build a modifiable EN formulary database into ./src/shared/api
- [x] **add** GIR check

#### Standards
- [x] **add** automate comparative standards
- [x] **add** automate comparison to current nutrition rx: (kcal, pro, fluid --> low|WNL|high?)
- [x] **add** Improve user flow of UI
- [x] **add** Automate linking patient BMI to comparative standards' clinical context options
- [x] **add** more conditions to consider (now 26)
- [x] **add** bronchopulmonary dysplasia for pediatrics

### Diagnosis
- [x] **add** PES statement builder
- [x] **add** allow for creation of new etiology blocks through saved ADIMEs
- [x] **add** Automated malnutrition chart
- [x] **add** automated pediatric malnutrition chart
- [x] **add** Build skeleton for contextual suggestions for signs & symptoms (s/s) --> use assessment data
- [x] *patch* PES s/s contextual suggestions missing chip selection and dropdowns
- [x] *patch* error of UBW displaying as criterion for pediatric malnutrition for <2 yrs age
- [ ] **add** Differentials to guide continued/ordered assessment

### Intervention
- [ ] **add** Oral/EN/PN calculations
- [ ] **add** Basic renal adjustments

### Dietitian Tools
- [x] **add** Mercury safety calculator 

---

## Development

### Prerequisites
- [Node.js](https://nodejs.org/)
- [Rust](https://www.rust-lang.org/tools/install)
- [Tauri Prerequisites](https://v2.tauri.app/start/prerequisites/)

### Setup
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development environment:
   ```bash
   npm run tauri dev
   ```

### Build
To generate a production bundle:
```bash
npm run tauri build
```
