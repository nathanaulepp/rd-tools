# rd-tools

**Author:** Nathan Aulepp

## Overview
This project aims to accelerate the completion of clinical dietitian charting work by integrating automated calculation tools not previously seen inside of the EHR system. The end products:
- A worksheet template you can use as inspiration when advocating for better charting.
- A readable free-text note that you copy into your chart.

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
- [ ] **add** properly wire refeeding risk screen into clinical note view
- [ ] **add** dedicated settings pane on the homepage, and integrate a comparative standards condition editor into it
- [ ] **add** Add keyboard shortcuts (root call is "ctrl + 0")
- [ ] **add** Split panes function

### Assessment
#### Patient Summary
- [x] **add** transfer clinical context pieces into summary at beginning

#### Anthro
- [x] *patch* lbs adjusted body weight for amputees is broken
- [x] *patch* autosave for adj body weight for amputees
- [ ] **add** DEXA scan functionality mapped and coded

#### Biochemical
- [ ] *no changes at this time*

#### Clinical
- [x] **add** appetite to C3
- [x] **add** swallow and chew timeframe
- [ ] **add** Automated drug-nutrient interactions

#### Dietary
- [x] **add** ONS supplements to oral layout: (formula, amount, times per day)
- [ ] **add** D2.1 automated estimated oral intake, integrating Multiple Pass Dietary Recall
- [x] **add** D2 checkbox of verified receiving current rx diet and supplements 
- [x] **add** Build a modifiable EN formulary database into ./src/shared/api

#### Standards
- [ ] *patch* adjusted body weight amputation for calorie calculation

### Diagnosis
- [ ] **add** Differentials to guide continued/ordered assessment

### Intervention
- [ ] **add** Oral/EN/PN calculations
- [ ] **add** Basic renal adjustments

### Monitor-Evaluate
- [x] **add** redesign/reorder interface

### Dietitian Tools
- [ ] *no changes at this time*

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
