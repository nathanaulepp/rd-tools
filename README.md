# rd-tools

from: Nathan Aulepp

This project aims to accelerate the completion of clinical dietitian charting work. 

Benefit: Many clinicians can expand their scope by reducing work time on charting and increasing their time face-to-face
with patients, researching for nutrition edge cases, or implementing quality improvement for their facility. Charting
is often considered by health administrators as having little-to-zero financial return. 

Therefore, your true (and perceived) value as a dietitian increases as you replace your time charting with more
meaningful tasks.




List of to do:
**RD Workstation**
*assessment*
anthro
pediatric growth chart automated calculations for z scores and percentiles
pediatric growth velocity automated calculations based on past measures with current
calendar mapping safeguards
DEXA scan functionality mapped and coded

*clinical*
import drug database
add drug lookup
automated drug nutrient interactions
automated malnutrition chart
automated refeeding risk chart

*dietary*
add current nutrition prescription
add PN macro concentrations (unit/volume)
FIX FORMULA NAME submissions FOR EN
create functionality for en modulars (right now, only mL/hr or per bolus doesn't cut)
D31 automated estimated oral intake
incorporate a formulary database
GIR check (timeline layout, with a dynamic number of points because a point is assigned to each unique GIR interval from 0:00 to 23:59) 


*standards*
automate comparative standards (een, epn, efn)

--predictive equation dropdown + activity factors (1.2-1.9 options based on condition) for MSJ energy formula
--include indirect calorimetry option for een with different activity factors based on condition

--protein range (g/kg) [dropdown or custom]

compare to current nutrition rx: (kcal, pro, fluid --> low | WNL | high? )

*diagnosis*
differentials to guide continued/ordered assessment
PES statement builder + smart suggestions
allow for creation of new PES blocks and saved ADIMEs automatically parse P,E,Ss into PES dataset

*intervention*
oral/EN/PN calculations
basic renal adjustments




*dietitian tools*
if you want a better activity factor to estimate patient calories:
daily activity METs calorie estimator (sums up all daily activities [with time est.] then calculates average MET) formula is TDEE = MSJ_RMR * SUM of 0_24 hours of (activity * MET / 24)
