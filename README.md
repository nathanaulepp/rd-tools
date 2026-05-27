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
- [ ] **add** Add keyboard shortcuts (root call is "ctrl + .")
- [ ] **add** Split panes function

### Assessment
#### Anthro
- [x] pediatric growth chart automated calc for Zscores and %s
- [x] pediatric growth velocity automated calc based on past measures w/ current
- [x] calendar mapping safeguards
- [ ] **add** DEXA scan functionality mapped and coded

#### Clinical
- [x] **add** import drug database
- [x] **add** add drug lookup
- [ ] **add** Automated drug-nutrient interactions
- [ ] **add** Automated refeeding risk chart

#### Dietary
- [x] **add** current nutrition rx
- [x] **add** PN macro conc. (unit/vol)
- [x] *patch* formula name submissions for EN
- [x] **add** create functionality for EN modulars (mL/bolus isn't enough)
- [ ] *patch* broken autosave for D12 and D13
- [ ] **add** D3.1 automated estimated oral intake
- [ ] **add** Incorporate a formulary database
- [ ] **add** GIR check (timeline layout with dynamic points for unique intervals from 0:00 to 23:59)

#### Standards
- [x] **add** automate comparative standards
- [x] **add** automate comparison to current nutrition rx: (kcal, pro, fluid --> low|WNL|high?)
- [x] **add** Improve user flow of UI
- [x] **add** Automate linking patient BMI to comparative standards' clinical context options

### Diagnosis
- [x] **add** PES statement builder
- [x] **add** allow for creation of new etiology blocks through saved ADIMEs
- [x] **add** Automated malnutrition chart
- [ ] **add** Build skeleton for quick suggestions for signs & symptoms --> use assessment data
- [ ] **add** Differentials to guide continued/ordered assessment

### Intervention
- [ ] **add** Oral/EN/PN calculations
- [ ] **add** Basic renal adjustments

### Dietitian Tools
- [ ] **METs Calorie Estimator**
  - Goal: Better activity factor to estimate patient calories.
  - Formula: `TDEE = MSJ_RMR * SUM(0-24 hours of (activity * MET / 24))`

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
