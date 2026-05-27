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
- [ ] Add keyboard shortcuts

### Assessment
#### Anthro
- [ ] DEXA scan functionality mapped and coded

#### Clinical
- [ ] Automated drug-nutrient interactions
- [ ] Automated malnutrition chart
- [ ] Automated refeeding risk chart

#### Dietary
- [ ] D3.1 automated estimated oral intake
- [ ] Incorporate a formulary database
- [ ] GIR check (timeline layout with dynamic points for unique intervals from 0:00 to 23:59)

#### Standards
- [ ] Improve user flow of UI

### Diagnosis
- [ ] Differentials to guide continued/ordered assessment

### Intervention
- [ ] Oral/EN/PN calculations
- [ ] Basic renal adjustments

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
