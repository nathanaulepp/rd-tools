// src/shared/api/db.seed.equations.ts
// Seeds the entire condition/equation/note/extra-input tree.
// Called once during schema initialisation by db.connection.ts.
// All IDs are stable UUIDs defined in SEED_IDS so INSERT OR IGNORE is idempotent.

import type Database from "@tauri-apps/plugin-sql";
import { SEED_IDS } from "./db.seed.equation-ids";

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function seedCondition(
  db: Database,
  nowStr: string,
  id: string,
  name: string,
  parentId: string | null,
  sortOrder: number,
  description?: string
): Promise<void> {
  await db.execute(
    `INSERT OR IGNORE INTO custom_conditions
       (id, name, description, parent_id, sort_order, is_seeded, is_archived, archived_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 1, 0, NULL, ?, ?)`,
    [id, name, description ?? null, parentId, sortOrder, nowStr, nowStr]
  );
}

async function seedEquation(
  db: Database,
  nowStr: string,
  id: string,
  conditionId: string,
  nutrient: string,
  expression: string,
  unit: string,
  displayLabel: string,
  sortOrder: number
): Promise<void> {
  await db.execute(
    `INSERT OR IGNORE INTO custom_equations
       (id, condition_id, nutrient, expression, unit, display_label, sort_order, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, conditionId, nutrient, expression, unit, displayLabel, sortOrder, nowStr]
  );
}

async function seedNote(
  db: Database,
  id: string,
  equationId: string | null,
  conditionId: string | null,
  noteText: string,
  sortOrder: number
): Promise<void> {
  await db.execute(
    `INSERT OR IGNORE INTO custom_equation_notes
       (id, equation_id, condition_id, note_text, sort_order)
     VALUES (?, ?, ?, ?, ?)`,
    [id, equationId, conditionId, noteText, sortOrder]
  );
}

async function seedExtraInput(
  db: Database,
  id: string,
  conditionId: string,
  slug: string,
  displayLabel: string,
  inputType: "number" | "boolean",
  hintText: string | null,
  sortOrder: number
): Promise<void> {
  await db.execute(
    `INSERT OR IGNORE INTO condition_extra_inputs
       (id, condition_id, slug, display_label, input_type, hint_text, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, conditionId, slug, displayLabel, inputType, hintText, sortOrder]
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────

export async function seedEquationEngine(db: Database): Promise<void> {
  const nowStr = new Date().toISOString();

  // Convenience wrappers that close over db / nowStr
  const cond = (id: string, name: string, parentId: string | null, sort: number, desc?: string) =>
    seedCondition(db, nowStr, id, name, parentId, sort, desc);
  const eq = (id: string, condId: string, nutrient: string, expr: string, unit: string, label: string, sort: number) =>
    seedEquation(db, nowStr, id, condId, nutrient, expr, unit, label, sort);
  const note = (id: string, eqId: string | null, condId: string | null, text: string, sort: number) =>
    seedNote(db, id, eqId, condId, text, sort);
  const extra = (id: string, condId: string, slug: string, label: string, type: "number" | "boolean", hint: string | null, sort: number) =>
    seedExtraInput(db, id, condId, slug, label, type, hint, sort);

  // ─── 1. Root conditions ───────────────────────────────────────────────────
  await cond(SEED_IDS.crit_ill_root,         "Critical Illness",                    null, 10,  "Critical care patient standards");
  await cond(SEED_IDS.aki_root,              "AKI",                                 null, 20,  "Acute Kidney Injury");
  await cond(SEED_IDS.pancreatitis_root,     "Acute Pancreatitis",                  null, 30,  "Acute Pancreatitis standards");
  await cond(SEED_IDS.trauma_root,           "Trauma",                              null, 40,  "Polytrauma and surgical standards");
  await cond(SEED_IDS.burns_root,            "Burns",                               null, 50,  "Thermal and chemical burn injury standards");
  await cond(SEED_IDS.stroke_root,           "Stroke",                              null, 60,  "Stroke care standards");
  await cond(SEED_IDS.copd_root,             "COPD",                                null, 70,  "Chronic Obstructive Pulmonary Disease");
  await cond(SEED_IDS.heart_failure_root,    "Heart Failure",                       null, 80,  "Congestive Heart Failure standards");
  await cond(SEED_IDS.cirrhosis_root,        "Cirrhosis",                           null, 90,  "End-stage liver disease and cirrhosis standards");
  await cond(SEED_IDS.liver_transplant_root, "Liver Transplant",                    null, 100, "Liver Transplant patient standards");
  await cond(SEED_IDS.ckd_root,              "CKD",                                 null, 110, "Chronic Kidney Disease standards");
  await cond(SEED_IDS.kidney_transplant_root,"Kidney Transplant",                   null, 120, "Kidney Transplant patient standards");
  await cond(SEED_IDS.masld_mash_root,       "MASLD / MASH",                        null, 130, "Metabolic dysfunction-associated steatotic liver disease");
  await cond(SEED_IDS.onc_root,              "Oncology",                            null, 140, "Oncology patient standards");
  await cond(SEED_IDS.hsct_root,             "HSCT",                                null, 150, "Hematopoietic Stem Cell Transplant standards");
  await cond(SEED_IDS.sbs_root,              "Short Bowel Syndrome",                null, 160, "Short Bowel Syndrome standards");
  await cond(SEED_IDS.cf_root,               "Cystic Fibrosis",                     null, 170, "Cystic Fibrosis standards");
  await cond(SEED_IDS.scd_root,              "Sickle Cell Disease",                 null, 180, "Sickle Cell Disease standards");
  await cond(SEED_IDS.pi_root,               "Pressure Injuries",                   null, 190, "Wound care and pressure injury standards");
  await cond(SEED_IDS.mal_root,              "Severe Malnutrition",                 null, 200, "Severe malnutrition standards");
  await cond(SEED_IDS.obe_root,              "Obesity / Metabolic Syndrome",        null, 210, "Obesity and weight management standards");
  await cond(SEED_IDS.preg_root,             "Pregnancy",                           null, 220, "Maternal pregnancy standards");
  await cond(SEED_IDS.bf_root,               "Breastfeeding",                       null, 230, "Maternal lactation standards");
  await cond(SEED_IDS.hl_root,               "Healthy / Preventive",                null, 240, "General preventative nutrition standards");
  await cond(SEED_IDS.bpd_root,              "Bronchopulmonary Dysplasia (BPD)",    null, 250, "Bronchopulmonary Dysplasia");

  // ─── 2. Adult sub-conditions ──────────────────────────────────────────────
  await cond(SEED_IDS.crit_ill_adult,           "Adult",                SEED_IDS.crit_ill_root,         10, "Adult critical illness guidelines");
  await cond(SEED_IDS.aki_adult,                "Adult",                SEED_IDS.aki_root,               10, "Adult AKI guidelines");
  await cond(SEED_IDS.pancreatitis_adult,       "Adult",                SEED_IDS.pancreatitis_root,      10, "Adult pancreatitis guidelines");
  await cond(SEED_IDS.trauma_adult,             "Adult",                SEED_IDS.trauma_root,            10, "Adult trauma guidelines");
  await cond(SEED_IDS.burns_adult,              "Adult",                SEED_IDS.burns_root,             10, "Adult burn guidelines");
  await cond(SEED_IDS.stroke_adult,             "Adult",                SEED_IDS.stroke_root,            10, "Adult stroke guidelines");
  await cond(SEED_IDS.copd_adult,               "Adult",                SEED_IDS.copd_root,              10, "Adult COPD guidelines");
  await cond(SEED_IDS.heart_failure_adult,      "Adult",                SEED_IDS.heart_failure_root,     10, "Adult Heart Failure guidelines");
  await cond(SEED_IDS.cirrhosis_adult,          "Adult",                SEED_IDS.cirrhosis_root,         10, "Adult cirrhosis guidelines");
  await cond(SEED_IDS.liver_transplant_adult,   "Adult",                SEED_IDS.liver_transplant_root,  10, "Adult liver transplant guidelines");
  await cond(SEED_IDS.ckd_adult_3_5,            "Adult, Stages 3–5",    SEED_IDS.ckd_root,               10, "Non-dialysis CKD");
  await cond(SEED_IDS.ckd_adult_5d,             "Adult, Stage 5D (Dialysis)", SEED_IDS.ckd_root,         20, "Dialysis-dependent CKD");
  await cond(SEED_IDS.kidney_transplant_adult,  "Adult",                SEED_IDS.kidney_transplant_root, 10, "Adult kidney transplant guidelines");
  await cond(SEED_IDS.masld_mash_adult,         "Adult",                SEED_IDS.masld_mash_root,        10, "Adult MASLD/MASH guidelines");
  await cond(SEED_IDS.onc_adult,                "Adult",                SEED_IDS.onc_root,               10, "Adult oncology guidelines");
  await cond(SEED_IDS.hsct_adult,               "Adult",                SEED_IDS.hsct_root,              10, "Adult HSCT guidelines");
  await cond(SEED_IDS.sbs_adult,                "Adult",                SEED_IDS.sbs_root,               10, "Adult SBS guidelines");
  await cond(SEED_IDS.cf_adult,                 "Adult",                SEED_IDS.cf_root,                10, "Adult Cystic Fibrosis guidelines");
  await cond(SEED_IDS.scd_adult,                "Adult",                SEED_IDS.scd_root,               10, "Adult SCD guidelines");
  await cond(SEED_IDS.pi_adult,                 "Adult",                SEED_IDS.pi_root,                10, "Adult pressure injury guidelines");
  await cond(SEED_IDS.mal_adult,                "Adult",                SEED_IDS.mal_root,               10, "Adult severe malnutrition guidelines");
  await cond(SEED_IDS.obe_adult,                "Adult",                SEED_IDS.obe_root,               10, "Adult obesity guidelines");
  await cond(SEED_IDS.preg_adult,               "Adult",                SEED_IDS.preg_root,              10, "Maternal pregnancy guidelines");
  await cond(SEED_IDS.bf_adult,                 "Adult",                SEED_IDS.bf_root,                10, "Maternal lactation guidelines");
  await cond(SEED_IDS.hl_adult,                 "Adult",                SEED_IDS.hl_root,                10, "Adult preventative guidelines");

  // ─── 3. Pediatric sub-conditions ─────────────────────────────────────────
  await cond(SEED_IDS.crit_ill_peds,            "Pediatric",            SEED_IDS.crit_ill_root,          20, "Pediatric critical illness guidelines");
  await cond(SEED_IDS.aki_peds,                 "Pediatric",            SEED_IDS.aki_root,               20, "Pediatric AKI guidelines");
  await cond(SEED_IDS.pancreatitis_peds,        "Pediatric",            SEED_IDS.pancreatitis_root,      20, "Pediatric pancreatitis guidelines");
  await cond(SEED_IDS.burns_peds,               "Pediatric",            SEED_IDS.burns_root,             20, "Pediatric burn care standards");
  await cond(SEED_IDS.onc_peds,                 "Pediatric",            SEED_IDS.onc_root,               20, "Pediatric oncology guidelines");
  await cond(SEED_IDS.ckd_peds_3_5,             "Pediatric, Stages 3–5",SEED_IDS.ckd_root,               20, "Pediatric CKD stages 3-5 guidelines");
  await cond(SEED_IDS.ckd_peds_5d,              "Pediatric, Stage 5D",  SEED_IDS.ckd_root,               30, "Pediatric dialysis guidelines");
  await cond(SEED_IDS.kidney_transplant_peds,   "Pediatric",            SEED_IDS.kidney_transplant_root, 20, "Pediatric kidney transplant guidelines");
  await cond(SEED_IDS.cirrhosis_peds,           "Pediatric",            SEED_IDS.cirrhosis_root,         20, "Pediatric cirrhosis guidelines");
  await cond(SEED_IDS.liver_transplant_peds,    "Pediatric",            SEED_IDS.liver_transplant_root,  20, "Pediatric liver transplant guidelines");
  await cond(SEED_IDS.trauma_peds,              "Pediatric",            SEED_IDS.trauma_root,            20, "Pediatric trauma standards");
  await cond(SEED_IDS.masld_mash_peds,          "Pediatric",            SEED_IDS.masld_mash_root,        20, "Pediatric MASLD guidelines");
  await cond(SEED_IDS.copd_peds,                "Pediatric",            SEED_IDS.copd_root,              20, "Pediatric COPD guidelines");
  await cond(SEED_IDS.heart_failure_peds,       "Pediatric",            SEED_IDS.heart_failure_root,     20, "Pediatric heart failure standards");
  await cond(SEED_IDS.stroke_peds,              "Pediatric",            SEED_IDS.stroke_root,            20, "Pediatric stroke guidelines");
  await cond(SEED_IDS.pi_peds,                  "Pediatric",            SEED_IDS.pi_root,                20, "Pediatric wound care guidelines");
  await cond(SEED_IDS.scd_peds,                 "Pediatric",            SEED_IDS.scd_root,               20, "Pediatric SCD guidelines");
  await cond(SEED_IDS.hsct_peds,                "Pediatric",            SEED_IDS.hsct_root,              20, "Pediatric HSCT guidelines");
  await cond(SEED_IDS.sbs_peds,                 "Pediatric",            SEED_IDS.sbs_root,               20, "Pediatric SBS guidelines");
  await cond(SEED_IDS.cf_peds,                  "Pediatric",            SEED_IDS.cf_root,                20, "Pediatric Cystic Fibrosis guidelines");
  await cond(SEED_IDS.hl_peds,                  "Pediatric",            SEED_IDS.hl_root,                20, "Pediatric healthy guidelines");
  await cond(SEED_IDS.mal_peds,                 "Pediatric",            SEED_IDS.mal_root,               20, "Pediatric malnutrition guidelines");
  await cond(SEED_IDS.obe_peds,                 "Pediatric",            SEED_IDS.obe_root,               20, "Pediatric obesity guidelines");
  await cond(SEED_IDS.bpd_peds,                 "Pediatric",            SEED_IDS.bpd_root,               10, "Pediatric BPD guidelines");
  await cond(SEED_IDS.preg_peds,                "Adolescent (14–17y)",  SEED_IDS.preg_root,              20, "Adolescent pregnancy guidelines");
  await cond(SEED_IDS.bf_peds,                  "Adolescent (14–17y)",  SEED_IDS.bf_root,                20, "Adolescent breastfeeding guidelines");

  // ─── 4. Leaf conditions — Adult ───────────────────────────────────────────
  await cond(SEED_IDS.crit_ill_bmi_lt30,        "BMI < 30",                     SEED_IDS.crit_ill_adult,          10, "Non-obese critical illness");
  await cond(SEED_IDS.crit_ill_bmi_30_50,       "BMI 30–50 (Obese)",            SEED_IDS.crit_ill_adult,          20, "Obese class I/II critical illness");
  await cond(SEED_IDS.crit_ill_bmi_gt50,        "BMI > 50 (Severely Obese)",    SEED_IDS.crit_ill_adult,          30, "Class III or higher extreme obesity");
  await cond(SEED_IDS.aki_no_dialysis,           "No Dialysis",                  SEED_IDS.aki_adult,               10, "Non-dialysis acute kidney injury");
  await cond(SEED_IDS.aki_hemodialysis,          "Hemodialysis / Catabolic",     SEED_IDS.aki_adult,               20, "Intermittent hemodialysis");
  await cond(SEED_IDS.aki_crrt,                  "CRRT",                         SEED_IDS.aki_adult,               30, "Continuous Renal Replacement Therapy");
  await cond(SEED_IDS.pancreatitis_mild_mod,     "Mild–Moderate",                SEED_IDS.pancreatitis_adult,      10, "Mild to moderate pancreatitis");
  await cond(SEED_IDS.pancreatitis_severe_crit,  "Severe / Critical",            SEED_IDS.pancreatitis_adult,      20, "Severe necrotizing or critical pancreatitis");
  await cond(SEED_IDS.trauma_standard,           "Standard / Major Trauma",      SEED_IDS.trauma_adult,            10, "Closed abdomen trauma");
  await cond(SEED_IDS.trauma_open_abdomen,       "Open Abdomen / NPWT",          SEED_IDS.trauma_adult,            20, "NPWT open abdomen trauma");
  await cond(SEED_IDS.burns_toronto,             "Toronto Formula (Preferred)",  SEED_IDS.burns_adult,             20, "Toronto equation variant");
  await cond(SEED_IDS.stroke_ischemic,           "Ischemic / Standard",          SEED_IDS.stroke_adult,            10, "Ischemic stroke variant");
  await cond(SEED_IDS.stroke_hemorrhagic,        "Hemorrhagic",                  SEED_IDS.stroke_adult,            20, "Hemorrhagic stroke variant");
  await cond(SEED_IDS.copd_standard,             "Standard",                     SEED_IDS.copd_adult,              10, "Standard COPD parameters");
  await cond(SEED_IDS.heart_failure_standard,    "Standard",                     SEED_IDS.heart_failure_adult,     10, "Standard Heart Failure parameters");
  await cond(SEED_IDS.cirrhosis_compensated,     "Compensated",                  SEED_IDS.cirrhosis_adult,         10, "Compensated cirrhosis");
  await cond(SEED_IDS.cirrhosis_decompensated,   "Decompensated / Critical",     SEED_IDS.cirrhosis_adult,         20, "Decompensated liver failure");
  await cond(SEED_IDS.liver_transplant_acute,    "Acute (Post-op)",              SEED_IDS.liver_transplant_adult,  10, "Acute post-transplant recovery");
  await cond(SEED_IDS.liver_transplant_chronic,  "Chronic (Stable)",             SEED_IDS.liver_transplant_adult,  20, "Chronic post-transplant maintenance");
  await cond(SEED_IDS.ckd_vlpd,                  "VLPD + Keto Analogs",          SEED_IDS.ckd_adult_3_5,           10, "Very Low Protein Diet variant");
  await cond(SEED_IDS.ckd_lpd,                   "Low-Protein Diet",             SEED_IDS.ckd_adult_3_5,           20, "Standard LPD variant");
  await cond(SEED_IDS.ckd_lpd_dm,                "Low-Protein + Diabetes",       SEED_IDS.ckd_adult_3_5,           30, "LPD with concurrent diabetes");
  await cond(SEED_IDS.ckd_hd,                    "Hemodialysis",                 SEED_IDS.ckd_adult_5d,            10, "Hemodialysis dependent");
  await cond(SEED_IDS.ckd_pd,                    "Peritoneal Dialysis",          SEED_IDS.ckd_adult_5d,            20, "Peritoneal dialysis dependent");
  await cond(SEED_IDS.kidney_transplant_acute,   "Acute (Post-op)",              SEED_IDS.kidney_transplant_adult, 10, "Acute post-transplant recovery");
  await cond(SEED_IDS.kidney_transplant_chronic, "Chronic (Stable)",             SEED_IDS.kidney_transplant_adult, 20, "Chronic post-transplant maintenance");
  await cond(SEED_IDS.kidney_transplant_chronic_dm, "Chronic + Diabetes",        SEED_IDS.kidney_transplant_adult, 30, "Chronic maintenance with concurrent diabetes");
  await cond(SEED_IDS.masld_mash_standard,       "Standard (BMI 18.5–39.9)",     SEED_IDS.masld_mash_adult,        10, "Standard overweight/obese variant");
  await cond(SEED_IDS.masld_mash_malnourished,   "Underweight / Malnourished / Sarcopenic", SEED_IDS.masld_mash_adult, 20, "Lean or sarcopenic liver disease");
  await cond(SEED_IDS.onc_sed,                   "Non-ambulatory / Sedentary",   SEED_IDS.onc_adult,               10, "Oncology: non-ambulatory or sedentary");
  await cond(SEED_IDS.onc_hyper,                 "Hypermetabolic / Treatment",   SEED_IDS.onc_adult,               20, "Oncology: hypermetabolic or undergoing active treatment");
  await cond(SEED_IDS.onc_stressed,              "Severely Stressed / HCT First Month", SEED_IDS.onc_adult,        30, "Oncology: severely stressed or HCT first month");
  await cond(SEED_IDS.onc_highprot,              "High Protein Needs",           SEED_IDS.onc_adult,               40, "Oncology: high protein requirements");
  await cond(SEED_IDS.hsct_active,               "Active Treatment (First Month)",SEED_IDS.hsct_adult,             10, "Active HSCT treatment phase");
  await cond(SEED_IDS.hsct_recovery,             "Post-engraftment / Recovery",  SEED_IDS.hsct_adult,              20, "Post-engraftment recovery phase");
  await cond(SEED_IDS.sbs_standard,              "Intestinal Failure / Standard",SEED_IDS.sbs_adult,               10, "Standard intestinal failure parameters");
  await cond(SEED_IDS.cf_bedbound,               "Bed-bound (PAL 1.3)",          SEED_IDS.cf_adult,                10, "CF bed-bound parameters");
  await cond(SEED_IDS.cf_sedentary,              "Sedentary (PAL 1.5)",          SEED_IDS.cf_adult,                20, "CF sedentary parameters");
  await cond(SEED_IDS.cf_active,                 "Active (PAL 1.7)",             SEED_IDS.cf_adult,                30, "CF active parameters");
  await cond(SEED_IDS.scd_stable,                "Stable",                       SEED_IDS.scd_adult,               10, "Stable SCD parameters");
  await cond(SEED_IDS.scd_voc,                   "Vaso-occlusive Crisis (VOC)",  SEED_IDS.scd_adult,               20, "SCD in vaso-occlusive crisis");
  await cond(SEED_IDS.pi_stage1_2,               "Stage 1–2",                    SEED_IDS.pi_adult,                10, "Stage 1 or 2 pressure injuries");
  await cond(SEED_IDS.pi_stage3_4,               "Stage 3–4",                    SEED_IDS.pi_adult,                20, "Stage 3 or 4 pressure injuries");
  await cond(SEED_IDS.mal_refeeding,             "Refeeding Risk",               SEED_IDS.mal_adult,               10, "Patients at high risk for refeeding syndrome");
  await cond(SEED_IDS.obe_stable,                "Stable",                       SEED_IDS.obe_adult,               10, "Weight maintenance/loss parameters");
  await cond(SEED_IDS.preg_t1,                   "Trimester 1",                  SEED_IDS.preg_adult,              10, "First trimester");
  await cond(SEED_IDS.preg_t2,                   "Trimester 2 (+340 kcal)",      SEED_IDS.preg_adult,              20, "Second trimester energy/protein scale");
  await cond(SEED_IDS.preg_t3,                   "Trimester 3 (+452 kcal)",      SEED_IDS.preg_adult,              30, "Third trimester energy/protein scale");
  await cond(SEED_IDS.bf_early,                  "0–6 Months Postpartum",        SEED_IDS.bf_adult,                10, "Early postpartum lactation");
  await cond(SEED_IDS.bf_late,                   "7–12 Months Postpartum",       SEED_IDS.bf_adult,                20, "Late postpartum lactation");
  await cond(SEED_IDS.hl_standard,               "Standard",                     SEED_IDS.hl_adult,                10, "Standard general healthy reference");

  // ─── 5. Leaf conditions — Pediatric ──────────────────────────────────────
  await cond(SEED_IDS.crit_ill_peds_std,              "Standard",                 SEED_IDS.crit_ill_peds,           10, "Standard pediatric critical illness parameters");
  await cond(SEED_IDS.aki_peds_nodial,                "No Dialysis",              SEED_IDS.aki_peds,                10, "Pediatric AKI without dialytic support");
  await cond(SEED_IDS.aki_peds_dial,                  "Dialysis / CRRT",          SEED_IDS.aki_peds,                20, "Pediatric AKI with CRRT or dialysis");
  await cond(SEED_IDS.pancreatitis_peds_std,          "Standard",                 SEED_IDS.pancreatitis_peds,       10, "Standard pediatric pancreatitis parameters");
  await cond(SEED_IDS.burns_peds_child,               "Child 1–11y (Galveston)",  SEED_IDS.burns_peds,              10, "Galveston formula for children 1-11y");
  await cond(SEED_IDS.burns_peds_adol,                "Adolescent 12–16y (Galveston)", SEED_IDS.burns_peds,         20, "Galveston formula for adolescents 12-16y");
  await cond(SEED_IDS.onc_peds_std,                   "Standard",                 SEED_IDS.onc_peds,                10, "Standard pediatric oncology parameters");
  await cond(SEED_IDS.onc_peds_undernourished,        "Undernourished / Catch-up Growth", SEED_IDS.onc_peds,        20, "Pediatric oncology catch-up growth");
  await cond(SEED_IDS.ckd_peds_3_5_std,               "Standard",                 SEED_IDS.ckd_peds_3_5,           10, "Standard pediatric CKD 3-5 parameters");
  await cond(SEED_IDS.ckd_peds_hd,                    "Hemodialysis",             SEED_IDS.ckd_peds_5d,            10, "Pediatric hemodialysis parameters");
  await cond(SEED_IDS.ckd_peds_pd,                    "Peritoneal Dialysis",      SEED_IDS.ckd_peds_5d,            20, "Pediatric peritoneal dialysis parameters");
  await cond(SEED_IDS.kidney_transplant_peds_acute,   "Acute (Post-op)",          SEED_IDS.kidney_transplant_peds,  10, "Acute post-op kidney transplant");
  await cond(SEED_IDS.kidney_transplant_peds_chron,   "Chronic (Stable)",         SEED_IDS.kidney_transplant_peds,  20, "Chronic stable post-transplant");
  await cond(SEED_IDS.cirrhosis_peds_std,             "Standard",                 SEED_IDS.cirrhosis_peds,          10, "Standard pediatric cirrhosis parameters");
  await cond(SEED_IDS.liver_transplant_peds_acute,    "Acute (Post-op)",          SEED_IDS.liver_transplant_peds,   10, "Acute post-op liver transplant");
  await cond(SEED_IDS.liver_transplant_peds_chron,    "Chronic (Stable)",         SEED_IDS.liver_transplant_peds,   20, "Chronic stable post-liver-transplant");
  await cond(SEED_IDS.trauma_peds_std,                "Standard",                 SEED_IDS.trauma_peds,             10, "Standard pediatric trauma parameters");
  await cond(SEED_IDS.trauma_peds_open,               "Open Abdomen / NPWT",      SEED_IDS.trauma_peds,             20, "Pediatric open abdomen trauma");
  await cond(SEED_IDS.masld_mash_peds_std,            "Standard",                 SEED_IDS.masld_mash_peds,         10, "Standard pediatric MASLD parameters");
  await cond(SEED_IDS.copd_peds_std,                  "Standard",                 SEED_IDS.copd_peds,               10, "Standard pediatric COPD parameters");
  await cond(SEED_IDS.heart_failure_peds_std,         "Standard",                 SEED_IDS.heart_failure_peds,      10, "Standard pediatric heart failure parameters");
  await cond(SEED_IDS.stroke_peds_std,                "Standard",                 SEED_IDS.stroke_peds,             10, "Standard pediatric stroke parameters");
  await cond(SEED_IDS.pi_peds_stage1_2,               "Stage 1–2",                SEED_IDS.pi_peds,                 10, "Stage 1 or 2 pediatric pressure injury");
  await cond(SEED_IDS.pi_peds_stage3_4,               "Stage 3–4",                SEED_IDS.pi_peds,                 20, "Stage 3 or 4 pediatric pressure injury");
  await cond(SEED_IDS.scd_peds_stable,                "Stable",                   SEED_IDS.scd_peds,                10, "Stable pediatric SCD");
  await cond(SEED_IDS.scd_peds_voc,                   "VOC / Crisis",             SEED_IDS.scd_peds,                20, "Pediatric SCD in vaso-occlusive crisis");
  await cond(SEED_IDS.hsct_peds_infant,               "Infants & Young Children (<2y)", SEED_IDS.hsct_peds,        10, "Pediatric HSCT <2y parameters");
  await cond(SEED_IDS.hsct_peds_child,                "Children (2–16y)",         SEED_IDS.hsct_peds,               20, "Pediatric HSCT 2-16y parameters");
  await cond(SEED_IDS.hsct_peds_older,                "Older Adolescent (>16y)",  SEED_IDS.hsct_peds,               30, "Pediatric HSCT >16y parameters");
  await cond(SEED_IDS.sbs_peds_pndep,                 "PN-Dependent",             SEED_IDS.sbs_peds,                10, "PN-dependent pediatric SBS");
  await cond(SEED_IDS.sbs_peds_entaut,                "Enteral Autonomous / Transitioning", SEED_IDS.sbs_peds,      20, "Enteral autonomous pediatric SBS");
  await cond(SEED_IDS.cf_peds_bedbound,               "Bed-bound (PAL 1.3)",      SEED_IDS.cf_peds,                 10, "CF pediatric bedbound");
  await cond(SEED_IDS.cf_peds_sedentary,              "Sedentary (PAL 1.5)",      SEED_IDS.cf_peds,                 20, "CF pediatric sedentary");
  await cond(SEED_IDS.cf_peds_active,                 "Active (PAL 1.7)",         SEED_IDS.cf_peds,                 30, "CF pediatric active");
  await cond(SEED_IDS.hl_peds_normal,                 "Normal Weight",            SEED_IDS.hl_peds,                 10, "Normal weight pediatric EER");
  await cond(SEED_IDS.hl_peds_overweight,             "Overweight / Obese",       SEED_IDS.hl_peds,                 20, "Overweight/obese pediatric guidelines");
  await cond(SEED_IDS.mal_peds_catchup,               "Catch-up Growth",          SEED_IDS.mal_peds,                10, "Pediatric catch-up growth parameters");
  await cond(SEED_IDS.obe_peds_stable,                "Stable",                   SEED_IDS.obe_peds,                10, "Stable pediatric weight management");
  await cond(SEED_IDS.bpd_peds_std,                   "Standard",                 SEED_IDS.bpd_peds,                10, "Standard pediatric BPD parameters");
  await cond(SEED_IDS.preg_peds_t1,                   "Trimester 1",              SEED_IDS.preg_peds,               10, "First trimester pregnancy");
  await cond(SEED_IDS.preg_peds_t2,                   "Trimester 2 (+340 kcal)",  SEED_IDS.preg_peds,               20, "Second trimester pregnancy");
  await cond(SEED_IDS.preg_peds_t3,                   "Trimester 3 (+452 kcal)",  SEED_IDS.preg_peds,               30, "Third trimester pregnancy");
  await cond(SEED_IDS.bf_peds_early,                  "0–6 Months Postpartum",    SEED_IDS.bf_peds,                 10, "Early postpartum breastfeeding");
  await cond(SEED_IDS.bf_peds_late,                   "7–12 Months Postpartum",   SEED_IDS.bf_peds,                 20, "Late postpartum breastfeeding");

  // ─── 6. Equations ─────────────────────────────────────────────────────────
  const torontoExpr = "max(-4343 + (10.5 * tbsaBurnedPct) + (0.23 * currentKcalIntake) + (0.84 * hbeBmrKcal) + (114 * coreTempC) - (4.5 * postBurnDay), weightKg * 20)";

  // COPD
  await eq(SEED_IDS.copd_std_kcal_low,  SEED_IDS.copd_standard, "energy",  "msjReeKcal * 1.15",  "kcal/day", "Energy — Lower Bound", 1);
  await eq(SEED_IDS.copd_std_kcal_high, SEED_IDS.copd_standard, "energy",  "msjReeKcal * 1.20",  "kcal/day", "Energy — Upper Bound", 2);
  await eq(SEED_IDS.copd_std_prot_low,  SEED_IDS.copd_standard, "protein", "weightKg * 0.8",     "g/day",    "Protein — Lower Bound", 3);
  await eq(SEED_IDS.copd_std_prot_high, SEED_IDS.copd_standard, "protein", "weightKg * 1.5",     "g/day",    "Protein — Upper Bound", 4);

  // Heart Failure
  await eq(SEED_IDS.heart_failure_std_kcal_low,  SEED_IDS.heart_failure_standard, "energy",  "msjReeKcal * palValue * 0.95", "kcal/day", "Energy — Lower Bound", 1);
  await eq(SEED_IDS.heart_failure_std_kcal_high, SEED_IDS.heart_failure_standard, "energy",  "msjReeKcal * palValue * 1.05", "kcal/day", "Energy — Upper Bound", 2);
  await eq(SEED_IDS.heart_failure_std_prot_low,  SEED_IDS.heart_failure_standard, "protein", "weightKg * 0.8",               "g/day",    "Protein — Lower Bound", 3);
  await eq(SEED_IDS.heart_failure_std_prot_high, SEED_IDS.heart_failure_standard, "protein", "weightKg * 1.0",               "g/day",    "Protein — Upper Bound", 4);

  // Cirrhosis Compensated
  await eq(SEED_IDS.cirrhosis_comp_kcal_low,  SEED_IDS.cirrhosis_compensated, "energy",  "weightKg * 35",  "kcal/day", "Energy — Lower Bound", 1);
  await eq(SEED_IDS.cirrhosis_comp_kcal_high, SEED_IDS.cirrhosis_compensated, "energy",  "weightKg * 40",  "kcal/day", "Energy — Upper Bound", 2);
  await eq(SEED_IDS.cirrhosis_comp_prot_low,  SEED_IDS.cirrhosis_compensated, "protein", "weightKg * 1.2", "g/day",    "Protein — Lower Bound", 3);
  await eq(SEED_IDS.cirrhosis_comp_prot_high, SEED_IDS.cirrhosis_compensated, "protein", "weightKg * 1.5", "g/day",    "Protein — Upper Bound", 4);

  // Cirrhosis Decompensated
  await eq(SEED_IDS.cirrhosis_decomp_kcal_low,  SEED_IDS.cirrhosis_decompensated, "energy",  "weightKg * 35",  "kcal/day", "Energy — Lower Bound", 1);
  await eq(SEED_IDS.cirrhosis_decomp_kcal_high, SEED_IDS.cirrhosis_decompensated, "energy",  "weightKg * 40",  "kcal/day", "Energy — Upper Bound", 2);
  await eq(SEED_IDS.cirrhosis_decomp_prot_low,  SEED_IDS.cirrhosis_decompensated, "protein", "weightKg * 1.5", "g/day",    "Protein — Lower Bound", 3);
  await eq(SEED_IDS.cirrhosis_decomp_prot_high, SEED_IDS.cirrhosis_decompensated, "protein", "weightKg * 2.0", "g/day",    "Protein — Upper Bound", 4);

  // Liver Transplant Acute
  await eq(SEED_IDS.liver_transplant_acute_kcal,      SEED_IDS.liver_transplant_acute, "energy",  "msjReeKcal * 1.3",  "kcal/day", "Energy — Target",       1);
  await eq(SEED_IDS.liver_transplant_acute_prot_low,  SEED_IDS.liver_transplant_acute, "protein", "weightKg * 1.5",    "g/day",    "Protein — Lower Bound", 2);
  await eq(SEED_IDS.liver_transplant_acute_prot_high, SEED_IDS.liver_transplant_acute, "protein", "weightKg * 2.0",    "g/day",    "Protein — Upper Bound", 3);

  // Liver Transplant Chronic
  await eq(SEED_IDS.liver_transplant_chronic_kcal_low,  SEED_IDS.liver_transplant_chronic, "energy",  "msjReeKcal * 1.0", "kcal/day", "Energy — Lower Bound", 1);
  await eq(SEED_IDS.liver_transplant_chronic_kcal_high, SEED_IDS.liver_transplant_chronic, "energy",  "msjReeKcal * 1.3", "kcal/day", "Energy — Upper Bound", 2);
  await eq(SEED_IDS.liver_transplant_chronic_prot_low,  SEED_IDS.liver_transplant_chronic, "protein", "weightKg * 0.8",   "g/day",    "Protein — Lower Bound", 3);
  await eq(SEED_IDS.liver_transplant_chronic_prot_high, SEED_IDS.liver_transplant_chronic, "protein", "weightKg * 1.0",   "g/day",    "Protein — Upper Bound", 4);

  // CKD
  await eq(SEED_IDS.ckd_vlpd_kcal_low,  SEED_IDS.ckd_vlpd, "energy",  "weightKg * 25",    "kcal/day", "Energy — Lower Bound", 1);
  await eq(SEED_IDS.ckd_vlpd_kcal_high, SEED_IDS.ckd_vlpd, "energy",  "weightKg * 35",    "kcal/day", "Energy — Upper Bound", 2);
  await eq(SEED_IDS.ckd_vlpd_prot_low,  SEED_IDS.ckd_vlpd, "protein", "weightKg * 0.28",  "g/day",    "Protein — Lower Bound", 3);
  await eq(SEED_IDS.ckd_vlpd_prot_high, SEED_IDS.ckd_vlpd, "protein", "weightKg * 0.43",  "g/day",    "Protein — Upper Bound", 4);

  await eq(SEED_IDS.ckd_lpd_kcal_low,  SEED_IDS.ckd_lpd, "energy",  "weightKg * 25",   "kcal/day", "Energy — Lower Bound", 1);
  await eq(SEED_IDS.ckd_lpd_kcal_high, SEED_IDS.ckd_lpd, "energy",  "weightKg * 35",   "kcal/day", "Energy — Upper Bound", 2);
  await eq(SEED_IDS.ckd_lpd_prot_low,  SEED_IDS.ckd_lpd, "protein", "weightKg * 0.55", "g/day",    "Protein — Lower Bound", 3);
  await eq(SEED_IDS.ckd_lpd_prot_high, SEED_IDS.ckd_lpd, "protein", "weightKg * 0.60", "g/day",    "Protein — Upper Bound", 4);

  await eq(SEED_IDS.ckd_lpddm_kcal_low,  SEED_IDS.ckd_lpd_dm, "energy",  "weightKg * 25",   "kcal/day", "Energy — Lower Bound", 1);
  await eq(SEED_IDS.ckd_lpddm_kcal_high, SEED_IDS.ckd_lpd_dm, "energy",  "weightKg * 35",   "kcal/day", "Energy — Upper Bound", 2);
  await eq(SEED_IDS.ckd_lpddm_prot_low,  SEED_IDS.ckd_lpd_dm, "protein", "weightKg * 0.60", "g/day",    "Protein — Lower Bound", 3);
  await eq(SEED_IDS.ckd_lpddm_prot_high, SEED_IDS.ckd_lpd_dm, "protein", "weightKg * 0.80", "g/day",    "Protein — Upper Bound", 4);

  await eq(SEED_IDS.ckd_hd_kcal_low,  SEED_IDS.ckd_hd, "energy",  "weightKg * 25",   "kcal/day", "Energy — Lower Bound", 1);
  await eq(SEED_IDS.ckd_hd_kcal_high, SEED_IDS.ckd_hd, "energy",  "weightKg * 35",   "kcal/day", "Energy — Upper Bound", 2);
  await eq(SEED_IDS.ckd_hd_prot_low,  SEED_IDS.ckd_hd, "protein", "weightKg * 1.2",  "g/day",    "Protein — Lower Bound", 3);
  await eq(SEED_IDS.ckd_hd_prot_high, SEED_IDS.ckd_hd, "protein", "weightKg * 1.2",  "g/day",    "Protein — Upper Bound", 4);

  await eq(SEED_IDS.ckd_pd_kcal_low,  SEED_IDS.ckd_pd, "energy",  "weightKg * 25",   "kcal/day", "Energy — Lower Bound", 1);
  await eq(SEED_IDS.ckd_pd_kcal_high, SEED_IDS.ckd_pd, "energy",  "weightKg * 35",   "kcal/day", "Energy — Upper Bound", 2);
  await eq(SEED_IDS.ckd_pd_prot_low,  SEED_IDS.ckd_pd, "protein", "weightKg * 1.2",  "g/day",    "Protein — Lower Bound", 3);
  await eq(SEED_IDS.ckd_pd_prot_high, SEED_IDS.ckd_pd, "protein", "weightKg * 1.3",  "g/day",    "Protein — Upper Bound", 4);

  // Kidney Transplant
  await eq(SEED_IDS.kidney_transplant_acute_kcal_low,  SEED_IDS.kidney_transplant_acute, "energy",  "msjReeKcal * 1.2", "kcal/day", "Energy — Lower Bound", 1);
  await eq(SEED_IDS.kidney_transplant_acute_kcal_high, SEED_IDS.kidney_transplant_acute, "energy",  "msjReeKcal * 1.3", "kcal/day", "Energy — Upper Bound", 2);
  await eq(SEED_IDS.kidney_transplant_acute_prot_low,  SEED_IDS.kidney_transplant_acute, "protein", "weightKg * 1.2",   "g/day",    "Protein — Lower Bound", 3);
  await eq(SEED_IDS.kidney_transplant_acute_prot_high, SEED_IDS.kidney_transplant_acute, "protein", "weightKg * 2.0",   "g/day",    "Protein — Upper Bound", 4);

  await eq(SEED_IDS.kidney_transplant_chron_kcal_low,  SEED_IDS.kidney_transplant_chronic, "energy",  "weightKg * 25",  "kcal/day", "Energy — Lower Bound", 1);
  await eq(SEED_IDS.kidney_transplant_chron_kcal_high, SEED_IDS.kidney_transplant_chronic, "energy",  "weightKg * 30",  "kcal/day", "Energy — Upper Bound", 2);
  await eq(SEED_IDS.kidney_transplant_chron_prot_low,  SEED_IDS.kidney_transplant_chronic, "protein", "weightKg * 0.6", "g/day",    "Protein — Lower Bound", 3);
  await eq(SEED_IDS.kidney_transplant_chron_prot_high, SEED_IDS.kidney_transplant_chronic, "protein", "weightKg * 0.8", "g/day",    "Protein — Upper Bound", 4);

  await eq(SEED_IDS.kidney_transplant_chrondm_kcal_low,  SEED_IDS.kidney_transplant_chronic_dm, "energy",  "weightKg * 25",  "kcal/day", "Energy — Lower Bound", 1);
  await eq(SEED_IDS.kidney_transplant_chrondm_kcal_high, SEED_IDS.kidney_transplant_chronic_dm, "energy",  "weightKg * 30",  "kcal/day", "Energy — Upper Bound", 2);
  await eq(SEED_IDS.kidney_transplant_chrondm_prot_low,  SEED_IDS.kidney_transplant_chronic_dm, "protein", "weightKg * 0.8", "g/day",    "Protein — Lower Bound", 3);
  await eq(SEED_IDS.kidney_transplant_chrondm_prot_high, SEED_IDS.kidney_transplant_chronic_dm, "protein", "weightKg * 0.9", "g/day",    "Protein — Upper Bound", 4);

  // MASLD / MASH
  await eq(SEED_IDS.masld_mash_std_kcal_low,  SEED_IDS.masld_mash_standard,    "energy",  "max(msjReeKcal * 1.2 - 800, weightKg * 20)", "kcal/day", "Energy — Lower Bound", 1);
  await eq(SEED_IDS.masld_mash_std_kcal_high, SEED_IDS.masld_mash_standard,    "energy",  "max(msjReeKcal * 1.2 - 500, weightKg * 22)", "kcal/day", "Energy — Upper Bound", 2);
  await eq(SEED_IDS.masld_mash_std_prot_low,  SEED_IDS.masld_mash_standard,    "protein", "weightKg * 1.5",                              "g/day",    "Protein — Lower Bound", 3);
  await eq(SEED_IDS.masld_mash_std_prot_high, SEED_IDS.masld_mash_standard,    "protein", "weightKg * 1.8",                              "g/day",    "Protein — Upper Bound", 4);
  await eq(SEED_IDS.masld_mash_mal_kcal_low,  SEED_IDS.masld_mash_malnourished,"energy",  "weightKg * 30",                               "kcal/day", "Energy — Lower Bound", 1);
  await eq(SEED_IDS.masld_mash_mal_kcal_high, SEED_IDS.masld_mash_malnourished,"energy",  "weightKg * 35",                               "kcal/day", "Energy — Upper Bound", 2);
  await eq(SEED_IDS.masld_mash_mal_prot_low,  SEED_IDS.masld_mash_malnourished,"protein", "weightKg * 1.5",                              "g/day",    "Protein — Lower Bound", 3);
  await eq(SEED_IDS.masld_mash_mal_prot_high, SEED_IDS.masld_mash_malnourished,"protein", "weightKg * 1.8",                              "g/day",    "Protein — Upper Bound", 4);

  // Critical Illness Adult
  await eq(SEED_IDS.crit_ill_lt30_kcal_low,  SEED_IDS.crit_ill_bmi_lt30, "energy",  "weightKg * 12",   "kcal/day", "Energy — Lower Bound", 1);
  await eq(SEED_IDS.crit_ill_lt30_kcal_high, SEED_IDS.crit_ill_bmi_lt30, "energy",  "weightKg * 25",   "kcal/day", "Energy — Upper Bound", 2);
  await eq(SEED_IDS.crit_ill_lt30_prot_low,  SEED_IDS.crit_ill_bmi_lt30, "protein", "weightKg * 1.2",  "g/day",    "Protein — Lower Bound", 3);
  await eq(SEED_IDS.crit_ill_lt30_prot_high, SEED_IDS.crit_ill_bmi_lt30, "protein", "weightKg * 2.0",  "g/day",    "Protein — Upper Bound", 4);

  await eq(SEED_IDS.crit_ill_30_50_kcal_low,  SEED_IDS.crit_ill_bmi_30_50, "energy",  "weightKg * 11",  "kcal/day", "Energy — Lower Bound", 1);
  await eq(SEED_IDS.crit_ill_30_50_kcal_high, SEED_IDS.crit_ill_bmi_30_50, "energy",  "weightKg * 14",  "kcal/day", "Energy — Upper Bound", 2);
  await eq(SEED_IDS.crit_ill_30_50_prot_low,  SEED_IDS.crit_ill_bmi_30_50, "protein", "ibwKg * 2.0",    "g/day",    "Protein — Lower Bound", 3);
  await eq(SEED_IDS.crit_ill_30_50_prot_high, SEED_IDS.crit_ill_bmi_30_50, "protein", "ibwKg * 2.0",    "g/day",    "Protein — Upper Bound", 4);

  await eq(SEED_IDS.crit_ill_gt50_kcal_low,  SEED_IDS.crit_ill_bmi_gt50, "energy",  "ibwKg * 22",  "kcal/day", "Energy — Lower Bound", 1);
  await eq(SEED_IDS.crit_ill_gt50_kcal_high, SEED_IDS.crit_ill_bmi_gt50, "energy",  "ibwKg * 25",  "kcal/day", "Energy — Upper Bound", 2);
  await eq(SEED_IDS.crit_ill_gt50_prot_low,  SEED_IDS.crit_ill_bmi_gt50, "protein", "ibwKg * 2.5", "g/day",    "Protein — Lower Bound", 3);
  await eq(SEED_IDS.crit_ill_gt50_prot_high, SEED_IDS.crit_ill_bmi_gt50, "protein", "ibwKg * 2.5", "g/day",    "Protein — Upper Bound", 4);

  // AKI Adult
  await eq(SEED_IDS.aki_no_dial_kcal_low,  SEED_IDS.aki_no_dialysis, "energy",  "min(msjReeKcal * 1.0, weightKg * 20)", "kcal/day", "Energy — Lower Bound", 1);
  await eq(SEED_IDS.aki_no_dial_kcal_high, SEED_IDS.aki_no_dialysis, "energy",  "max(msjReeKcal * 1.1, weightKg * 25)", "kcal/day", "Energy — Upper Bound", 2);
  await eq(SEED_IDS.aki_no_dial_prot_low,  SEED_IDS.aki_no_dialysis, "protein", "weightKg * 0.8",                       "g/day",    "Protein — Lower Bound", 3);
  await eq(SEED_IDS.aki_no_dial_prot_high, SEED_IDS.aki_no_dialysis, "protein", "weightKg * 1.0",                       "g/day",    "Protein — Upper Bound", 4);

  await eq(SEED_IDS.aki_hd_kcal_low,  SEED_IDS.aki_hemodialysis, "energy",  "msjReeKcal * 1.2", "kcal/day", "Energy — Lower Bound", 1);
  await eq(SEED_IDS.aki_hd_kcal_high, SEED_IDS.aki_hemodialysis, "energy",  "msjReeKcal * 1.3", "kcal/day", "Energy — Upper Bound", 2);
  await eq(SEED_IDS.aki_hd_prot_low,  SEED_IDS.aki_hemodialysis, "protein", "weightKg * 1.0",   "g/day",    "Protein — Lower Bound", 3);
  await eq(SEED_IDS.aki_hd_prot_high, SEED_IDS.aki_hemodialysis, "protein", "weightKg * 1.5",   "g/day",    "Protein — Upper Bound", 4);

  await eq(SEED_IDS.aki_crrt_kcal_low,  SEED_IDS.aki_crrt, "energy",  "msjReeKcal * 1.2", "kcal/day", "Energy — Lower Bound", 1);
  await eq(SEED_IDS.aki_crrt_kcal_high, SEED_IDS.aki_crrt, "energy",  "msjReeKcal * 1.3", "kcal/day", "Energy — Upper Bound", 2);
  await eq(SEED_IDS.aki_crrt_prot_low,  SEED_IDS.aki_crrt, "protein", "weightKg * 1.7",   "g/day",    "Protein — Lower Bound", 3);
  await eq(SEED_IDS.aki_crrt_prot_high, SEED_IDS.aki_crrt, "protein", "weightKg * 2.5",   "g/day",    "Protein — Upper Bound", 4);

  // Pancreatitis
  await eq(SEED_IDS.pancreatitis_mild_kcal_low,    SEED_IDS.pancreatitis_mild_mod,    "energy",  "msjReeKcal * 1.1", "kcal/day", "Energy — Lower Bound", 1);
  await eq(SEED_IDS.pancreatitis_mild_kcal_high,   SEED_IDS.pancreatitis_mild_mod,    "energy",  "msjReeKcal * 1.2", "kcal/day", "Energy — Upper Bound", 2);
  await eq(SEED_IDS.pancreatitis_mild_prot_low,    SEED_IDS.pancreatitis_mild_mod,    "protein", "weightKg * 1.2",   "g/day",    "Protein — Lower Bound", 3);
  await eq(SEED_IDS.pancreatitis_mild_prot_high,   SEED_IDS.pancreatitis_mild_mod,    "protein", "weightKg * 1.5",   "g/day",    "Protein — Upper Bound", 4);
  await eq(SEED_IDS.pancreatitis_severe_kcal_low,  SEED_IDS.pancreatitis_severe_crit, "energy",  "msjReeKcal * 1.2", "kcal/day", "Energy — Lower Bound", 1);
  await eq(SEED_IDS.pancreatitis_severe_kcal_high, SEED_IDS.pancreatitis_severe_crit, "energy",  "msjReeKcal * 1.5", "kcal/day", "Energy — Upper Bound", 2);
  await eq(SEED_IDS.pancreatitis_severe_prot_low,  SEED_IDS.pancreatitis_severe_crit, "protein", "weightKg * 1.5",   "g/day",    "Protein — Lower Bound", 3);
  await eq(SEED_IDS.pancreatitis_severe_prot_high, SEED_IDS.pancreatitis_severe_crit, "protein", "weightKg * 2.0",   "g/day",    "Protein — Upper Bound", 4);

  // Trauma
  await eq(SEED_IDS.trauma_std_kcal_low,  SEED_IDS.trauma_standard,    "energy",  "msjReeKcal * 1.3",                              "kcal/day", "Energy — Lower Bound", 1);
  await eq(SEED_IDS.trauma_std_kcal_high, SEED_IDS.trauma_standard,    "energy",  "msjReeKcal * 1.4",                              "kcal/day", "Energy — Upper Bound", 2);
  await eq(SEED_IDS.trauma_std_prot_low,  SEED_IDS.trauma_standard,    "protein", "weightKg * 1.2",                                "g/day",    "Protein — Lower Bound", 3);
  await eq(SEED_IDS.trauma_std_prot_high, SEED_IDS.trauma_standard,    "protein", "weightKg * 2.0",                                "g/day",    "Protein — Upper Bound", 4);
  await eq(SEED_IDS.trauma_open_kcal_low, SEED_IDS.trauma_open_abdomen,"energy",  "msjReeKcal * 1.3 + exudateVolumeL * 116",      "kcal/day", "Energy — Lower Bound", 1);
  await eq(SEED_IDS.trauma_open_kcal_high,SEED_IDS.trauma_open_abdomen,"energy",  "msjReeKcal * 1.4 + exudateVolumeL * 116",      "kcal/day", "Energy — Upper Bound", 2);
  await eq(SEED_IDS.trauma_open_prot_low, SEED_IDS.trauma_open_abdomen,"protein", "weightKg * 1.2 + exudateVolumeL * 29",          "g/day",    "Protein — Lower Bound", 3);
  await eq(SEED_IDS.trauma_open_prot_high,SEED_IDS.trauma_open_abdomen,"protein", "weightKg * 2.0 + exudateVolumeL * 29",          "g/day",    "Protein — Upper Bound", 4);

  // Burns
  await eq(SEED_IDS.burns_toronto_kcal_low,  SEED_IDS.burns_toronto, "energy",  `${torontoExpr} * 0.9`,                                              "kcal/day", "Energy — Lower Bound", 1);
  await eq(SEED_IDS.burns_toronto_kcal_high, SEED_IDS.burns_toronto, "energy",  `${torontoExpr} * 1.1`,                                              "kcal/day", "Energy — Upper Bound", 2);
  await eq(SEED_IDS.burns_toronto_prot_low,  SEED_IDS.burns_toronto, "protein", "ifTrue(tbsaBurnedPct > 40, weightKg * 2.0, weightKg * 1.5)",        "g/day",    "Protein — Lower Bound", 3);
  await eq(SEED_IDS.burns_toronto_prot_high, SEED_IDS.burns_toronto, "protein", "weightKg * 2.0",                                                    "g/day",    "Protein — Upper Bound", 4);

  // Stroke
  await eq(SEED_IDS.stroke_isc_kcal_low,  SEED_IDS.stroke_ischemic,   "energy",  "msjReeKcal * 1.1", "kcal/day", "Energy — Lower Bound", 1);
  await eq(SEED_IDS.stroke_isc_kcal_high, SEED_IDS.stroke_ischemic,   "energy",  "msjReeKcal * 1.2", "kcal/day", "Energy — Upper Bound", 2);
  await eq(SEED_IDS.stroke_isc_prot_low,  SEED_IDS.stroke_ischemic,   "protein", "weightKg * 1.0",   "g/day",    "Protein — Lower Bound", 3);
  await eq(SEED_IDS.stroke_isc_prot_high, SEED_IDS.stroke_ischemic,   "protein", "weightKg * 1.5",   "g/day",    "Protein — Upper Bound", 4);
  await eq(SEED_IDS.stroke_hem_kcal_low,  SEED_IDS.stroke_hemorrhagic,"energy",  "msjReeKcal * 1.1", "kcal/day", "Energy — Lower Bound", 1);
  await eq(SEED_IDS.stroke_hem_kcal_high, SEED_IDS.stroke_hemorrhagic,"energy",  "msjReeKcal * 1.2", "kcal/day", "Energy — Upper Bound", 2);
  await eq(SEED_IDS.stroke_hem_prot_low,  SEED_IDS.stroke_hemorrhagic,"protein", "weightKg * 1.5",   "g/day",    "Protein — Lower Bound", 3);
  await eq(SEED_IDS.stroke_hem_prot_high, SEED_IDS.stroke_hemorrhagic,"protein", "weightKg * 2.5",   "g/day",    "Protein — Upper Bound", 4);

  // Oncology
  await eq(SEED_IDS.onc_sed_kcal_low,      SEED_IDS.onc_sed,      "energy",  "weightKg * 25",  "kcal/day", "Energy — Lower Bound", 1);
  await eq(SEED_IDS.onc_sed_kcal_high,     SEED_IDS.onc_sed,      "energy",  "weightKg * 30",  "kcal/day", "Energy — Upper Bound", 2);
  await eq(SEED_IDS.onc_sed_prot_low,      SEED_IDS.onc_sed,      "protein", "weightKg * 1.0", "g/day",    "Protein — Lower Bound", 3);
  await eq(SEED_IDS.onc_sed_prot_high,     SEED_IDS.onc_sed,      "protein", "weightKg * 1.2", "g/day",    "Protein — Upper Bound", 4);
  await eq(SEED_IDS.onc_hyper_kcal_low,    SEED_IDS.onc_hyper,    "energy",  "weightKg * 30",  "kcal/day", "Energy — Lower Bound", 1);
  await eq(SEED_IDS.onc_hyper_kcal_high,   SEED_IDS.onc_hyper,    "energy",  "weightKg * 35",  "kcal/day", "Energy — Upper Bound", 2);
  await eq(SEED_IDS.onc_hyper_prot_low,    SEED_IDS.onc_hyper,    "protein", "weightKg * 1.2", "g/day",    "Protein — Lower Bound", 3);
  await eq(SEED_IDS.onc_hyper_prot_high,   SEED_IDS.onc_hyper,    "protein", "weightKg * 1.5", "g/day",    "Protein — Upper Bound", 4);
  await eq(SEED_IDS.onc_stressed_kcal_low, SEED_IDS.onc_stressed, "energy",  "weightKg * 35",  "kcal/day", "Energy — Lower Bound", 1);
  await eq(SEED_IDS.onc_stressed_kcal_high,SEED_IDS.onc_stressed, "energy",  "weightKg * 35",  "kcal/day", "Energy — Upper Bound", 2);
  await eq(SEED_IDS.onc_stressed_prot_low, SEED_IDS.onc_stressed, "protein", "weightKg * 1.5", "g/day",    "Protein — Lower Bound", 3);
  await eq(SEED_IDS.onc_stressed_prot_high,SEED_IDS.onc_stressed, "protein", "weightKg * 2.0", "g/day",    "Protein — Upper Bound", 4);
  await eq(SEED_IDS.onc_highprot_kcal_low, SEED_IDS.onc_highprot, "energy",  "weightKg * 30",  "kcal/day", "Energy — Lower Bound", 1);
  await eq(SEED_IDS.onc_highprot_kcal_high,SEED_IDS.onc_highprot, "energy",  "weightKg * 35",  "kcal/day", "Energy — Upper Bound", 2);
  await eq(SEED_IDS.onc_highprot_prot_low, SEED_IDS.onc_highprot, "protein", "weightKg * 1.5", "g/day",    "Protein — Lower Bound", 3);
  await eq(SEED_IDS.onc_highprot_prot_high,SEED_IDS.onc_highprot, "protein", "weightKg * 2.5", "g/day",    "Protein — Upper Bound", 4);

  // HSCT
  await eq(SEED_IDS.hsct_active_kcal_low,  SEED_IDS.hsct_active,   "energy",  "min(msjReeKcal * 1.3, weightKg * 30)",  "kcal/day", "Energy — Lower Bound", 1);
  await eq(SEED_IDS.hsct_active_kcal_high, SEED_IDS.hsct_active,   "energy",  "max(msjReeKcal * 1.5, weightKg * 35)",  "kcal/day", "Energy — Upper Bound", 2);
  await eq(SEED_IDS.hsct_active_prot_low,  SEED_IDS.hsct_active,   "protein", "weightKg * 1.5",                        "g/day",    "Protein — Target",     3);
  await eq(SEED_IDS.hsct_active_prot_high, SEED_IDS.hsct_active,   "protein", "weightKg * 1.5",                        "g/day",    "Protein — Target",     4);
  await eq(SEED_IDS.hsct_rec_kcal_low,     SEED_IDS.hsct_recovery, "energy",  "msjReeKcal * 1.3",                      "kcal/day", "Energy — Target",      1);
  await eq(SEED_IDS.hsct_rec_kcal_high,    SEED_IDS.hsct_recovery, "energy",  "msjReeKcal * 1.3",                      "kcal/day", "Energy — Target",      2);
  await eq(SEED_IDS.hsct_rec_prot_low,     SEED_IDS.hsct_recovery, "protein", "weightKg * 1.2",                        "g/day",    "Protein — Lower Bound",3);
  await eq(SEED_IDS.hsct_rec_prot_high,    SEED_IDS.hsct_recovery, "protein", "weightKg * 1.5",                        "g/day",    "Protein — Upper Bound",4);

  // SBS
  await eq(SEED_IDS.sbs_kcal_low,  SEED_IDS.sbs_standard, "energy",  "msjReeKcal * 1.3 * 1.2",                                                          "kcal/day", "Energy — Lower Bound", 1);
  await eq(SEED_IDS.sbs_kcal_high, SEED_IDS.sbs_standard, "energy",  "msjReeKcal * 1.3 * 1.5",                                                          "kcal/day", "Energy — Upper Bound", 2);
  await eq(SEED_IDS.sbs_prot_low,  SEED_IDS.sbs_standard, "protein", "max((msjReeKcal * 1.3 * 1.35) * 0.20 / 4, weightKg * 1.5)",                       "g/day",    "Protein — Lower Bound", 3);
  await eq(SEED_IDS.sbs_prot_high, SEED_IDS.sbs_standard, "protein", "max((msjReeKcal * 1.3 * 1.35) * 0.20 / 4 * 1.1, weightKg * 2.0)",                 "g/day",    "Protein — Upper Bound", 4);

  // CF Adult
  const cfDfLow  = "df = ifTrue(fev1Pct >= 80, 1.0, ifTrue(fev1Pct >= 40, 1.1, 1.5));";
  const cfDfHigh = "df = ifTrue(fev1Pct >= 80, 1.1, ifTrue(fev1Pct >= 40, 1.4, 2.0));";
  await eq(SEED_IDS.cf_bb_kcal_low,  SEED_IDS.cf_bedbound,  "energy",  `${cfDfLow} msjReeKcal * df * 1.3`,  "kcal/day", "Energy — Lower Bound", 1);
  await eq(SEED_IDS.cf_bb_kcal_high, SEED_IDS.cf_bedbound,  "energy",  `${cfDfHigh} msjReeKcal * df * 1.3`, "kcal/day", "Energy — Upper Bound", 2);
  await eq(SEED_IDS.cf_bb_prot_low,  SEED_IDS.cf_bedbound,  "protein", "weightKg * 0.96",                    "g/day",    "Protein — Lower Bound", 3);
  await eq(SEED_IDS.cf_bb_prot_high, SEED_IDS.cf_bedbound,  "protein", "weightKg * 1.6",                     "g/day",    "Protein — Upper Bound", 4);
  await eq(SEED_IDS.cf_sed_kcal_low, SEED_IDS.cf_sedentary, "energy",  `${cfDfLow} msjReeKcal * df * 1.5`,  "kcal/day", "Energy — Lower Bound", 1);
  await eq(SEED_IDS.cf_sed_kcal_high,SEED_IDS.cf_sedentary, "energy",  `${cfDfHigh} msjReeKcal * df * 1.5`, "kcal/day", "Energy — Upper Bound", 2);
  await eq(SEED_IDS.cf_sed_prot_low, SEED_IDS.cf_sedentary, "protein", "weightKg * 0.96",                    "g/day",    "Protein — Lower Bound", 3);
  await eq(SEED_IDS.cf_sed_prot_high,SEED_IDS.cf_sedentary, "protein", "weightKg * 1.6",                     "g/day",    "Protein — Upper Bound", 4);
  await eq(SEED_IDS.cf_act_kcal_low, SEED_IDS.cf_active,    "energy",  `${cfDfLow} msjReeKcal * df * 1.7`,  "kcal/day", "Energy — Lower Bound", 1);
  await eq(SEED_IDS.cf_act_kcal_high,SEED_IDS.cf_active,    "energy",  `${cfDfHigh} msjReeKcal * df * 1.7`, "kcal/day", "Energy — Upper Bound", 2);
  await eq(SEED_IDS.cf_act_prot_low, SEED_IDS.cf_active,    "protein", "weightKg * 0.96",                    "g/day",    "Protein — Lower Bound", 3);
  await eq(SEED_IDS.cf_act_prot_high,SEED_IDS.cf_active,    "protein", "weightKg * 1.6",                     "g/day",    "Protein — Upper Bound", 4);

  // SCD Adult
  await eq(SEED_IDS.scd_stable_kcal_low,  SEED_IDS.scd_stable, "energy",  "msjReeKcal * 1.3",  "kcal/day", "Energy — Target",      1);
  await eq(SEED_IDS.scd_stable_kcal_high, SEED_IDS.scd_stable, "energy",  "msjReeKcal * 1.3",  "kcal/day", "Energy — Target",      2);
  await eq(SEED_IDS.scd_stable_prot_low,  SEED_IDS.scd_stable, "protein", "weightKg * 1.0",    "g/day",    "Protein — Lower Bound", 3);
  await eq(SEED_IDS.scd_stable_prot_high, SEED_IDS.scd_stable, "protein", "weightKg * 1.3",    "g/day",    "Protein — Upper Bound", 4);
  await eq(SEED_IDS.scd_voc_kcal_low,     SEED_IDS.scd_voc,    "energy",  "msjReeKcal * 1.3",  "kcal/day", "Energy — Lower Bound", 1);
  await eq(SEED_IDS.scd_voc_kcal_high,    SEED_IDS.scd_voc,    "energy",  "msjReeKcal * 1.5",  "kcal/day", "Energy — Upper Bound", 2);
  await eq(SEED_IDS.scd_voc_prot_low,     SEED_IDS.scd_voc,    "protein", "weightKg * 1.0",    "g/day",    "Protein — Lower Bound", 3);
  await eq(SEED_IDS.scd_voc_prot_high,    SEED_IDS.scd_voc,    "protein", "weightKg * 1.3",    "g/day",    "Protein — Upper Bound", 4);

  // Pressure Injuries
  await eq(SEED_IDS.pi_stage1_2_kcal_low,  SEED_IDS.pi_stage1_2, "energy",  "msjReeKcal * 1.2",   "kcal/day", "Energy — Lower Bound", 1);
  await eq(SEED_IDS.pi_stage1_2_kcal_high, SEED_IDS.pi_stage1_2, "energy",  "msjReeKcal * 1.3",   "kcal/day", "Energy — Upper Bound", 2);
  await eq(SEED_IDS.pi_stage1_2_prot_low,  SEED_IDS.pi_stage1_2, "protein", "weightKg * 1.25",    "g/day",    "Protein — Lower Bound", 3);
  await eq(SEED_IDS.pi_stage1_2_prot_high, SEED_IDS.pi_stage1_2, "protein", "weightKg * 1.5",     "g/day",    "Protein — Upper Bound", 4);
  await eq(SEED_IDS.pi_stage3_4_kcal_low,  SEED_IDS.pi_stage3_4, "energy",  "msjReeKcal * 1.35",  "kcal/day", "Energy — Lower Bound", 1);
  await eq(SEED_IDS.pi_stage3_4_kcal_high, SEED_IDS.pi_stage3_4, "energy",  "msjReeKcal * 1.5",   "kcal/day", "Energy — Upper Bound", 2);
  await eq(SEED_IDS.pi_stage3_4_prot_low,  SEED_IDS.pi_stage3_4, "protein", "weightKg * 1.5",     "g/day",    "Protein — Lower Bound", 3);
  await eq(SEED_IDS.pi_stage3_4_prot_high, SEED_IDS.pi_stage3_4, "protein", "weightKg * 2.0",     "g/day",    "Protein — Upper Bound", 4);

  // Malnutrition / Obesity / Pregnancy / Breastfeeding / Healthy
  await eq(SEED_IDS.mal_kcal_low,  SEED_IDS.mal_refeeding, "energy",  "weightKg * 30",          "kcal/day", "Energy — Lower Bound", 1);
  await eq(SEED_IDS.mal_kcal_high, SEED_IDS.mal_refeeding, "energy",  "weightKg * 35",          "kcal/day", "Energy — Upper Bound", 2);
  await eq(SEED_IDS.mal_prot_low,  SEED_IDS.mal_refeeding, "protein", "weightKg * 1.2",         "g/day",    "Protein — Lower Bound", 3);
  await eq(SEED_IDS.mal_prot_high, SEED_IDS.mal_refeeding, "protein", "weightKg * 2.0",         "g/day",    "Protein — Upper Bound", 4);
  await eq(SEED_IDS.obe_kcal_low,  SEED_IDS.obe_stable,    "energy",  "ibwKg * 20",             "kcal/day", "Energy — Lower Bound", 1);
  await eq(SEED_IDS.obe_kcal_high, SEED_IDS.obe_stable,    "energy",  "ibwKg * 25",             "kcal/day", "Energy — Upper Bound", 2);
  await eq(SEED_IDS.obe_prot_low,  SEED_IDS.obe_stable,    "protein", "weightKg * 0.8",         "g/day",    "Protein — Lower Bound", 3);
  await eq(SEED_IDS.obe_prot_high, SEED_IDS.obe_stable,    "protein", "weightKg * 1.0",         "g/day",    "Protein — Upper Bound", 4);

  await eq(SEED_IDS.preg_t1_kcal_low,  SEED_IDS.preg_t1, "energy",  "msjReeKcal * 1.4",        "kcal/day", "Energy — Lower Bound", 1);
  await eq(SEED_IDS.preg_t1_kcal_high, SEED_IDS.preg_t1, "energy",  "msjReeKcal * 1.4 + 50",   "kcal/day", "Energy — Upper Bound", 2);
  await eq(SEED_IDS.preg_t1_prot,      SEED_IDS.preg_t1, "protein", "71",                       "g/day",    "Protein — Target",     3);
  await eq(SEED_IDS.preg_t2_kcal_low,  SEED_IDS.preg_t2, "energy",  "msjReeKcal * 1.4 + 340",  "kcal/day", "Energy — Lower Bound", 1);
  await eq(SEED_IDS.preg_t2_kcal_high, SEED_IDS.preg_t2, "energy",  "msjReeKcal * 1.4 + 390",  "kcal/day", "Energy — Upper Bound", 2);
  await eq(SEED_IDS.preg_t2_prot,      SEED_IDS.preg_t2, "protein", "71",                       "g/day",    "Protein — Target",     3);
  await eq(SEED_IDS.preg_t3_kcal_low,  SEED_IDS.preg_t3, "energy",  "msjReeKcal * 1.4 + 452",  "kcal/day", "Energy — Lower Bound", 1);
  await eq(SEED_IDS.preg_t3_kcal_high, SEED_IDS.preg_t3, "energy",  "msjReeKcal * 1.4 + 502",  "kcal/day", "Energy — Upper Bound", 2);
  await eq(SEED_IDS.preg_t3_prot,      SEED_IDS.preg_t3, "protein", "71",                       "g/day",    "Protein — Target",     3);

  await eq(SEED_IDS.bf_early_kcal_low,  SEED_IDS.bf_early, "energy",  "msjReeKcal + 380",  "kcal/day", "Energy — Lower Bound", 1);
  await eq(SEED_IDS.bf_early_kcal_high, SEED_IDS.bf_early, "energy",  "msjReeKcal + 420",  "kcal/day", "Energy — Upper Bound", 2);
  await eq(SEED_IDS.bf_early_prot,      SEED_IDS.bf_early, "protein", "71",                 "g/day",    "Protein — Target",     3);
  await eq(SEED_IDS.bf_late_kcal_low,   SEED_IDS.bf_late,  "energy",  "msjReeKcal + 310",  "kcal/day", "Energy — Lower Bound", 1);
  await eq(SEED_IDS.bf_late_kcal_high,  SEED_IDS.bf_late,  "energy",  "msjReeKcal + 350",  "kcal/day", "Energy — Upper Bound", 2);
  await eq(SEED_IDS.bf_late_prot,       SEED_IDS.bf_late,  "protein", "71",                 "g/day",    "Protein — Target",     3);

  await eq(SEED_IDS.hl_kcal_low,  SEED_IDS.hl_standard, "energy",  "msjReeKcal * palValue * 0.925", "kcal/day", "Energy — Lower Bound", 1);
  await eq(SEED_IDS.hl_kcal_high, SEED_IDS.hl_standard, "energy",  "msjReeKcal * palValue * 1.075", "kcal/day", "Energy — Upper Bound", 2);
  await eq(SEED_IDS.hl_prot_low,  SEED_IDS.hl_standard, "protein", "weightKg * 0.8",                "g/day",    "Protein — Lower Bound", 3);
  await eq(SEED_IDS.hl_prot_high, SEED_IDS.hl_standard, "protein", "weightKg * 1.2",                "g/day",    "Protein — Upper Bound", 4);

  // ─── Pediatric equations (Schofield-based) ────────────────────────────────
  await eq(SEED_IDS.crit_ill_peds_kcal_low,  SEED_IDS.crit_ill_peds_std, "energy",  "schofieldReeKcal * 0.95",  "kcal/day", "Energy — Lower Bound", 1);
  await eq(SEED_IDS.crit_ill_peds_kcal_high, SEED_IDS.crit_ill_peds_std, "energy",  "schofieldReeKcal * 1.05",  "kcal/day", "Energy — Upper Bound", 2);
  await eq(SEED_IDS.crit_ill_peds_prot_low,  SEED_IDS.crit_ill_peds_std, "protein", "weightKg * 1.5",           "g/day",    "Protein — Lower Bound", 3);
  await eq(SEED_IDS.crit_ill_peds_prot_high, SEED_IDS.crit_ill_peds_std, "protein", "weightKg * 2.0",           "g/day",    "Protein — Upper Bound", 4);

  await eq(SEED_IDS.aki_peds_nodial_kcal_low,  SEED_IDS.aki_peds_nodial, "energy",  "schofieldReeKcal * 1.3 * 0.95", "kcal/day", "Energy — Lower Bound", 1);
  await eq(SEED_IDS.aki_peds_nodial_kcal_high, SEED_IDS.aki_peds_nodial, "energy",  "schofieldReeKcal * 1.3 * 1.05", "kcal/day", "Energy — Upper Bound", 2);
  await eq(SEED_IDS.aki_peds_nodial_prot_low,  SEED_IDS.aki_peds_nodial, "protein", "weightKg * 0.8",                "g/day",    "Protein — Lower Bound", 3);
  await eq(SEED_IDS.aki_peds_nodial_prot_high, SEED_IDS.aki_peds_nodial, "protein", "weightKg * 1.2",                "g/day",    "Protein — Upper Bound", 4);
  await eq(SEED_IDS.aki_peds_dial_kcal_low,    SEED_IDS.aki_peds_dial,   "energy",  "schofieldReeKcal * 1.3 * 0.95", "kcal/day", "Energy — Lower Bound", 1);
  await eq(SEED_IDS.aki_peds_dial_kcal_high,   SEED_IDS.aki_peds_dial,   "energy",  "schofieldReeKcal * 1.3 * 1.05", "kcal/day", "Energy — Upper Bound", 2);
  await eq(SEED_IDS.aki_peds_dial_prot_low,    SEED_IDS.aki_peds_dial,   "protein", "weightKg * 1.0",                "g/day",    "Protein — Lower Bound", 3);
  await eq(SEED_IDS.aki_peds_dial_prot_high,   SEED_IDS.aki_peds_dial,   "protein", "weightKg * 2.5",                "g/day",    "Protein — Upper Bound", 4);

  await eq(SEED_IDS.pancreatitis_peds_kcal_low,  SEED_IDS.pancreatitis_peds_std, "energy",  "schofieldReeKcal * 1.1",  "kcal/day", "Energy — Lower Bound", 1);
  await eq(SEED_IDS.pancreatitis_peds_kcal_high, SEED_IDS.pancreatitis_peds_std, "energy",  "schofieldReeKcal * 1.2",  "kcal/day", "Energy — Upper Bound", 2);
  await eq(SEED_IDS.pancreatitis_peds_prot_low,  SEED_IDS.pancreatitis_peds_std, "protein", "weightKg * 1.2",           "g/day",    "Protein — Lower Bound", 3);
  await eq(SEED_IDS.pancreatitis_peds_prot_high, SEED_IDS.pancreatitis_peds_std, "protein", "weightKg * 1.5",           "g/day",    "Protein — Upper Bound", 4);

  // Burns Pediatric (Galveston)
  await eq(SEED_IDS.burns_peds_child_kcal_low,  SEED_IDS.burns_peds_child, "energy",  "(1800 * bodySurfaceAreaM2 + 1300 * (bodySurfaceAreaM2 * tbsaBurnedPct / 100)) * 0.9", "kcal/day", "Energy — Lower Bound", 1);
  await eq(SEED_IDS.burns_peds_child_kcal_high, SEED_IDS.burns_peds_child, "energy",  "(1800 * bodySurfaceAreaM2 + 1300 * (bodySurfaceAreaM2 * tbsaBurnedPct / 100)) * 1.1", "kcal/day", "Energy — Upper Bound", 2);
  await eq(SEED_IDS.burns_peds_child_prot_low,  SEED_IDS.burns_peds_child, "protein", "weightKg * 1.5",                                                                       "g/day",    "Protein — Lower Bound", 3);
  await eq(SEED_IDS.burns_peds_child_prot_high, SEED_IDS.burns_peds_child, "protein", "weightKg * 2.5",                                                                       "g/day",    "Protein — Upper Bound", 4);
  await eq(SEED_IDS.burns_peds_adol_kcal_low,  SEED_IDS.burns_peds_adol, "energy",   "(1500 * bodySurfaceAreaM2 + 1500 * (bodySurfaceAreaM2 * tbsaBurnedPct / 100)) * 0.9", "kcal/day", "Energy — Lower Bound", 1);
  await eq(SEED_IDS.burns_peds_adol_kcal_high, SEED_IDS.burns_peds_adol, "energy",   "(1500 * bodySurfaceAreaM2 + 1500 * (bodySurfaceAreaM2 * tbsaBurnedPct / 100)) * 1.1", "kcal/day", "Energy — Upper Bound", 2);
  await eq(SEED_IDS.burns_peds_adol_prot_low,  SEED_IDS.burns_peds_adol, "protein",  "weightKg * 1.5",                                                                       "g/day",    "Protein — Lower Bound", 3);
  await eq(SEED_IDS.burns_peds_adol_prot_high, SEED_IDS.burns_peds_adol, "protein",  "weightKg * 2.5",                                                                       "g/day",    "Protein — Upper Bound", 4);

  // Oncology Pediatric
  await eq(SEED_IDS.onc_peds_std_kcal_low,  SEED_IDS.onc_peds_std,         "energy",  "schofieldReeKcal * 1.2",  "kcal/day", "Energy — Lower Bound", 1);
  await eq(SEED_IDS.onc_peds_std_kcal_high, SEED_IDS.onc_peds_std,         "energy",  "schofieldReeKcal * 1.4",  "kcal/day", "Energy — Upper Bound", 2);
  await eq(SEED_IDS.onc_peds_std_prot_low,  SEED_IDS.onc_peds_std,         "protein", "weightKg * 1.0",           "g/day",    "Protein — Lower Bound", 3);
  await eq(SEED_IDS.onc_peds_std_prot_high, SEED_IDS.onc_peds_std,         "protein", "weightKg * 1.5",           "g/day",    "Protein — Upper Bound", 4);
  await eq(SEED_IDS.onc_peds_und_kcal_low,  SEED_IDS.onc_peds_undernourished,"energy","schofieldReeKcal * 1.3",  "kcal/day", "Energy — Lower Bound", 1);
  await eq(SEED_IDS.onc_peds_und_kcal_high, SEED_IDS.onc_peds_undernourished,"energy","schofieldReeKcal * 1.5",  "kcal/day", "Energy — Upper Bound", 2);
  await eq(SEED_IDS.onc_peds_und_prot_low,  SEED_IDS.onc_peds_undernourished,"protein","weightKg * 1.5",          "g/day",    "Protein — Lower Bound", 3);
  await eq(SEED_IDS.onc_peds_und_prot_high, SEED_IDS.onc_peds_undernourished,"protein","weightKg * 2.5",          "g/day",    "Protein — Upper Bound", 4);

  // CKD Pediatric
  await eq(SEED_IDS.ckd_peds_3_5_kcal_low,  SEED_IDS.ckd_peds_3_5_std, "energy",  "schofieldReeKcal * 0.95",  "kcal/day", "Energy — Lower Bound", 1);
  await eq(SEED_IDS.ckd_peds_3_5_kcal_high, SEED_IDS.ckd_peds_3_5_std, "energy",  "schofieldReeKcal * 1.05",  "kcal/day", "Energy — Upper Bound", 2);
  await eq(SEED_IDS.ckd_peds_3_5_prot_low,  SEED_IDS.ckd_peds_3_5_std, "protein", "weightKg * 0.82",           "g/day",    "Protein — Lower Bound", 3);
  await eq(SEED_IDS.ckd_peds_3_5_prot_high, SEED_IDS.ckd_peds_3_5_std, "protein", "weightKg * 0.91",           "g/day",    "Protein — Upper Bound", 4);
  await eq(SEED_IDS.ckd_peds_hd_kcal_low,   SEED_IDS.ckd_peds_hd,      "energy",  "schofieldReeKcal * 0.95",  "kcal/day", "Energy — Lower Bound", 1);
  await eq(SEED_IDS.ckd_peds_hd_kcal_high,  SEED_IDS.ckd_peds_hd,      "energy",  "schofieldReeKcal * 1.05",  "kcal/day", "Energy — Upper Bound", 2);
  await eq(SEED_IDS.ckd_peds_hd_prot_low,   SEED_IDS.ckd_peds_hd,      "protein", "weightKg * 0.91",           "g/day",    "Protein — Lower Bound", 3);
  await eq(SEED_IDS.ckd_peds_hd_prot_high,  SEED_IDS.ckd_peds_hd,      "protein", "weightKg * 1.11",           "g/day",    "Protein — Upper Bound", 4);
  await eq(SEED_IDS.ckd_peds_pd_kcal_low,   SEED_IDS.ckd_peds_pd,      "energy",  "schofieldReeKcal * 0.95",  "kcal/day", "Energy — Lower Bound", 1);
  await eq(SEED_IDS.ckd_peds_pd_kcal_high,  SEED_IDS.ckd_peds_pd,      "energy",  "schofieldReeKcal * 1.05",  "kcal/day", "Energy — Upper Bound", 2);
  await eq(SEED_IDS.ckd_peds_pd_prot_low,   SEED_IDS.ckd_peds_pd,      "protein", "weightKg * 0.91",           "g/day",    "Protein — Lower Bound", 3);
  await eq(SEED_IDS.ckd_peds_pd_prot_high,  SEED_IDS.ckd_peds_pd,      "protein", "weightKg * 1.11",           "g/day",    "Protein — Upper Bound", 4);

  // Kidney Transplant Pediatric
  await eq(SEED_IDS.kidney_transplant_peds_acute_kcal_low,  SEED_IDS.kidney_transplant_peds_acute, "energy",  "schofieldReeKcal * 1.3",  "kcal/day", "Energy — Lower Bound", 1);
  await eq(SEED_IDS.kidney_transplant_peds_acute_kcal_high, SEED_IDS.kidney_transplant_peds_acute, "energy",  "schofieldReeKcal * 1.5",  "kcal/day", "Energy — Upper Bound", 2);
  await eq(SEED_IDS.kidney_transplant_peds_acute_prot_low,  SEED_IDS.kidney_transplant_peds_acute, "protein", "weightKg * 1.5",           "g/day",    "Protein — Lower Bound", 3);
  await eq(SEED_IDS.kidney_transplant_peds_acute_prot_high, SEED_IDS.kidney_transplant_peds_acute, "protein", "weightKg * 2.0",           "g/day",    "Protein — Upper Bound", 4);
  await eq(SEED_IDS.kidney_transplant_peds_chron_kcal_low,  SEED_IDS.kidney_transplant_peds_chron, "energy",  "schofieldReeKcal * 1.0",  "kcal/day", "Energy — Lower Bound", 1);
  await eq(SEED_IDS.kidney_transplant_peds_chron_kcal_high, SEED_IDS.kidney_transplant_peds_chron, "energy",  "schofieldReeKcal * 1.2",  "kcal/day", "Energy — Upper Bound", 2);
  await eq(SEED_IDS.kidney_transplant_peds_chron_prot_low,  SEED_IDS.kidney_transplant_peds_chron, "protein", "weightKg * 0.82",           "g/day",   "Protein — Lower Bound", 3);
  await eq(SEED_IDS.kidney_transplant_peds_chron_prot_high, SEED_IDS.kidney_transplant_peds_chron, "protein", "weightKg * 0.91",           "g/day",   "Protein — Upper Bound", 4);

  // Cirrhosis / Liver Transplant Pediatric
  await eq(SEED_IDS.cirrhosis_peds_kcal_low,  SEED_IDS.cirrhosis_peds_std, "energy",  "schofieldReeKcal * 1.3",  "kcal/day", "Energy — Lower Bound", 1);
  await eq(SEED_IDS.cirrhosis_peds_kcal_high, SEED_IDS.cirrhosis_peds_std, "energy",  "schofieldReeKcal * 1.5",  "kcal/day", "Energy — Upper Bound", 2);
  await eq(SEED_IDS.cirrhosis_peds_prot_low,  SEED_IDS.cirrhosis_peds_std, "protein", "weightKg * 2.5",           "g/day",    "Protein — Lower Bound", 3);
  await eq(SEED_IDS.cirrhosis_peds_prot_high, SEED_IDS.cirrhosis_peds_std, "protein", "weightKg * 3.0",           "g/day",    "Protein — Upper Bound", 4);
  await eq(SEED_IDS.liver_transplant_peds_acute_kcal_low,  SEED_IDS.liver_transplant_peds_acute, "energy",  "schofieldReeKcal * 1.4",  "kcal/day", "Energy — Lower Bound", 1);
  await eq(SEED_IDS.liver_transplant_peds_acute_kcal_high, SEED_IDS.liver_transplant_peds_acute, "energy",  "schofieldReeKcal * 1.5",  "kcal/day", "Energy — Upper Bound", 2);
  await eq(SEED_IDS.liver_transplant_peds_acute_prot_low,  SEED_IDS.liver_transplant_peds_acute, "protein", "weightKg * 2.0",           "g/day",    "Protein — Lower Bound", 3);
  await eq(SEED_IDS.liver_transplant_peds_acute_prot_high, SEED_IDS.liver_transplant_peds_acute, "protein", "weightKg * 2.5",           "g/day",    "Protein — Upper Bound", 4);
  await eq(SEED_IDS.liver_transplant_peds_chron_kcal_low,  SEED_IDS.liver_transplant_peds_chron, "energy",  "schofieldReeKcal * 1.2",  "kcal/day", "Energy — Lower Bound", 1);
  await eq(SEED_IDS.liver_transplant_peds_chron_kcal_high, SEED_IDS.liver_transplant_peds_chron, "energy",  "schofieldReeKcal * 1.3",  "kcal/day", "Energy — Upper Bound", 2);
  await eq(SEED_IDS.liver_transplant_peds_chron_prot_low,  SEED_IDS.liver_transplant_peds_chron, "protein", "weightKg * 1.5",           "g/day",    "Protein — Lower Bound", 3);
  await eq(SEED_IDS.liver_transplant_peds_chron_prot_high, SEED_IDS.liver_transplant_peds_chron, "protein", "weightKg * 2.0",           "g/day",    "Protein — Upper Bound", 4);

  // Trauma Pediatric
  await eq(SEED_IDS.trauma_peds_std_kcal_low,  SEED_IDS.trauma_peds_std,  "energy",  "schofieldReeKcal * 1.3",                        "kcal/day", "Energy — Lower Bound", 1);
  await eq(SEED_IDS.trauma_peds_std_kcal_high, SEED_IDS.trauma_peds_std,  "energy",  "schofieldReeKcal * 1.5",                        "kcal/day", "Energy — Upper Bound", 2);
  await eq(SEED_IDS.trauma_peds_std_prot_low,  SEED_IDS.trauma_peds_std,  "protein", "weightKg * 1.5",                                "g/day",    "Protein — Lower Bound", 3);
  await eq(SEED_IDS.trauma_peds_std_prot_high, SEED_IDS.trauma_peds_std,  "protein", "weightKg * 2.5",                                "g/day",    "Protein — Upper Bound", 4);
  await eq(SEED_IDS.trauma_peds_open_kcal_low, SEED_IDS.trauma_peds_open, "energy",  "schofieldReeKcal * 1.3 + exudateVolumeL * 116", "kcal/day", "Energy — Lower Bound", 1);
  await eq(SEED_IDS.trauma_peds_open_kcal_high,SEED_IDS.trauma_peds_open, "energy",  "schofieldReeKcal * 1.5 + exudateVolumeL * 116", "kcal/day", "Energy — Upper Bound", 2);
  await eq(SEED_IDS.trauma_peds_open_prot_low, SEED_IDS.trauma_peds_open, "protein", "weightKg * 1.5 + exudateVolumeL * 29",          "g/day",    "Protein — Lower Bound", 3);
  await eq(SEED_IDS.trauma_peds_open_prot_high,SEED_IDS.trauma_peds_open, "protein", "weightKg * 2.5 + exudateVolumeL * 29",          "g/day",    "Protein — Upper Bound", 4);

  // Remaining peds (MASLD, COPD, HF, Stroke, PI, SCD, HSCT, SBS, CF, HL, MAL, BPD, Preg/BF Adolescent)
  await eq(SEED_IDS.masld_mash_peds_kcal_low,  SEED_IDS.masld_mash_peds_std, "energy",  "schofieldReeKcal * 0.95", "kcal/day", "Energy — Lower Bound", 1);
  await eq(SEED_IDS.masld_mash_peds_kcal_high, SEED_IDS.masld_mash_peds_std, "energy",  "schofieldReeKcal * 1.05", "kcal/day", "Energy — Upper Bound", 2);
  await eq(SEED_IDS.masld_mash_peds_prot_low,  SEED_IDS.masld_mash_peds_std, "protein", "weightKg * 1.2",           "g/day",    "Protein — Lower Bound", 3);
  await eq(SEED_IDS.masld_mash_peds_prot_high, SEED_IDS.masld_mash_peds_std, "protein", "weightKg * 1.5",           "g/day",    "Protein — Upper Bound", 4);
  await eq(SEED_IDS.copd_peds_kcal_low,        SEED_IDS.copd_peds_std,        "energy",  "schofieldReeKcal * 1.3 * 0.9", "kcal/day", "Energy — Lower Bound", 1);
  await eq(SEED_IDS.copd_peds_kcal_high,       SEED_IDS.copd_peds_std,        "energy",  "schofieldReeKcal * 1.3 * 1.1", "kcal/day", "Energy — Upper Bound", 2);
  await eq(SEED_IDS.copd_peds_prot_low,        SEED_IDS.copd_peds_std,        "protein", "weightKg * 0.8",           "g/day",    "Protein — Lower Bound", 3);
  await eq(SEED_IDS.copd_peds_prot_high,       SEED_IDS.copd_peds_std,        "protein", "weightKg * 1.5",           "g/day",    "Protein — Upper Bound", 4);
  await eq(SEED_IDS.heart_failure_peds_kcal_low,  SEED_IDS.heart_failure_peds_std, "energy",  "schofieldReeKcal * 1.2", "kcal/day", "Energy — Lower Bound", 1);
  await eq(SEED_IDS.heart_failure_peds_kcal_high, SEED_IDS.heart_failure_peds_std, "energy",  "schofieldReeKcal * 1.4", "kcal/day", "Energy — Upper Bound", 2);
  await eq(SEED_IDS.heart_failure_peds_prot_low,  SEED_IDS.heart_failure_peds_std, "protein", "weightKg * 1.5",          "g/day",    "Protein — Lower Bound", 3);
  await eq(SEED_IDS.heart_failure_peds_prot_high, SEED_IDS.heart_failure_peds_std, "protein", "weightKg * 2.0",          "g/day",    "Protein — Upper Bound", 4);
  await eq(SEED_IDS.stroke_peds_kcal_low,  SEED_IDS.stroke_peds_std, "energy",  "schofieldReeKcal * 1.2 * 0.95", "kcal/day", "Energy — Lower Bound", 1);
  await eq(SEED_IDS.stroke_peds_kcal_high, SEED_IDS.stroke_peds_std, "energy",  "schofieldReeKcal * 1.2 * 1.05", "kcal/day", "Energy — Upper Bound", 2);
  await eq(SEED_IDS.stroke_peds_prot_low,  SEED_IDS.stroke_peds_std, "protein", "weightKg * 1.0",                  "g/day",    "Protein — Lower Bound", 3);
  await eq(SEED_IDS.stroke_peds_prot_high, SEED_IDS.stroke_peds_std, "protein", "weightKg * 1.5",                  "g/day",    "Protein — Upper Bound", 4);
  await eq(SEED_IDS.pi_peds_stage1_2_kcal_low,  SEED_IDS.pi_peds_stage1_2, "energy",  "schofieldReeKcal * 1.2", "kcal/day", "Energy — Lower Bound", 1);
  await eq(SEED_IDS.pi_peds_stage1_2_kcal_high, SEED_IDS.pi_peds_stage1_2, "energy",  "schofieldReeKcal * 1.4", "kcal/day", "Energy — Upper Bound", 2);
  await eq(SEED_IDS.pi_peds_stage1_2_prot_low,  SEED_IDS.pi_peds_stage1_2, "protein", "weightKg * 1.25",         "g/day",    "Protein — Lower Bound", 3);
  await eq(SEED_IDS.pi_peds_stage1_2_prot_high, SEED_IDS.pi_peds_stage1_2, "protein", "weightKg * 2.0",          "g/day",    "Protein — Upper Bound", 4);
  await eq(SEED_IDS.pi_peds_stage3_4_kcal_low,  SEED_IDS.pi_peds_stage3_4, "energy",  "schofieldReeKcal * 1.2", "kcal/day", "Energy — Lower Bound", 1);
  await eq(SEED_IDS.pi_peds_stage3_4_kcal_high, SEED_IDS.pi_peds_stage3_4, "energy",  "schofieldReeKcal * 1.4", "kcal/day", "Energy — Upper Bound", 2);
  await eq(SEED_IDS.pi_peds_stage3_4_prot_low,  SEED_IDS.pi_peds_stage3_4, "protein", "weightKg * 1.5",          "g/day",    "Protein — Lower Bound", 3);
  await eq(SEED_IDS.pi_peds_stage3_4_prot_high, SEED_IDS.pi_peds_stage3_4, "protein", "weightKg * 2.5",          "g/day",    "Protein — Upper Bound", 4);
  await eq(SEED_IDS.scd_peds_stable_kcal,      SEED_IDS.scd_peds_stable, "energy",  "ifTrue(isMale, (1305 + 18.6 * weightKg - 55.7 * hemoglobin) * palValue, (1100 + 13.3 * weightKg - 30.2 * hemoglobin) * palValue)", "kcal/day", "Energy — Target", 1);
  await eq(SEED_IDS.scd_peds_stable_kcal,      SEED_IDS.scd_peds_stable, "energy",  "ifTrue(isMale, (1305 + 18.6 * weightKg - 55.7 * hemoglobin) * palValue, (1100 + 13.3 * weightKg - 30.2 * hemoglobin) * palValue)", "kcal/day", "Energy — Target", 2);
  await eq(SEED_IDS.scd_peds_stable_prot_low,  SEED_IDS.scd_peds_stable, "protein", "weightKg * 1.0",  "g/day",    "Protein — Lower Bound", 3);
  await eq(SEED_IDS.scd_peds_stable_prot_high, SEED_IDS.scd_peds_stable, "protein", "weightKg * 1.3",  "g/day",    "Protein — Upper Bound", 4);
  await eq(SEED_IDS.scd_peds_voc_kcal_low,  SEED_IDS.scd_peds_voc, "energy",  "schofieldReeKcal * 1.3",  "kcal/day", "Energy — Lower Bound", 1);
  await eq(SEED_IDS.scd_peds_voc_kcal_high, SEED_IDS.scd_peds_voc, "energy",  "schofieldReeKcal * 1.5",  "kcal/day", "Energy — Upper Bound", 2);
  await eq(SEED_IDS.scd_peds_voc_prot_low,  SEED_IDS.scd_peds_voc, "protein", "weightKg * 1.0",           "g/day",    "Protein — Lower Bound", 3);
  await eq(SEED_IDS.scd_peds_voc_prot_high, SEED_IDS.scd_peds_voc, "protein", "weightKg * 1.3",           "g/day",    "Protein — Upper Bound", 4);
  await eq(SEED_IDS.hsct_peds_infant_kcal_low,  SEED_IDS.hsct_peds_infant, "energy",  "schofieldReeKcal * 1.6",  "kcal/day", "Energy — Lower Bound", 1);
  await eq(SEED_IDS.hsct_peds_infant_kcal_high, SEED_IDS.hsct_peds_infant, "energy",  "schofieldReeKcal * 1.8",  "kcal/day", "Energy — Upper Bound", 2);
  await eq(SEED_IDS.hsct_peds_infant_prot_low,  SEED_IDS.hsct_peds_infant, "protein", "weightKg * 1.5",           "g/day",    "Protein — Lower Bound", 3);
  await eq(SEED_IDS.hsct_peds_infant_prot_high, SEED_IDS.hsct_peds_infant, "protein", "weightKg * 2.5",           "g/day",    "Protein — Upper Bound", 4);
  await eq(SEED_IDS.hsct_peds_child_kcal_low,   SEED_IDS.hsct_peds_child,  "energy",  "schofieldReeKcal * 1.4",  "kcal/day", "Energy — Lower Bound", 1);
  await eq(SEED_IDS.hsct_peds_child_kcal_high,  SEED_IDS.hsct_peds_child,  "energy",  "schofieldReeKcal * 1.6",  "kcal/day", "Energy — Upper Bound", 2);
  await eq(SEED_IDS.hsct_peds_child_prot_low,   SEED_IDS.hsct_peds_child,  "protein", "weightKg * 1.5",           "g/day",    "Protein — Lower Bound", 3);
  await eq(SEED_IDS.hsct_peds_child_prot_high,  SEED_IDS.hsct_peds_child,  "protein", "weightKg * 2.5",           "g/day",    "Protein — Upper Bound", 4);
  await eq(SEED_IDS.hsct_peds_older_kcal_low,   SEED_IDS.hsct_peds_older,  "energy",  "schofieldReeKcal * 1.4",  "kcal/day", "Energy — Lower Bound", 1);
  await eq(SEED_IDS.hsct_peds_older_kcal_high,  SEED_IDS.hsct_peds_older,  "energy",  "schofieldReeKcal * 1.6",  "kcal/day", "Energy — Upper Bound", 2);
  await eq(SEED_IDS.hsct_peds_older_prot_low,   SEED_IDS.hsct_peds_older,  "protein", "weightKg * 1.5",           "g/day",    "Protein — Lower Bound", 3);
  await eq(SEED_IDS.hsct_peds_older_prot_high,  SEED_IDS.hsct_peds_older,  "protein", "weightKg * 2.5",           "g/day",    "Protein — Upper Bound", 4);
  await eq(SEED_IDS.sbs_peds_pndep_kcal_low,   SEED_IDS.sbs_peds_pndep,  "energy",  "weightKg * 50",   "kcal/day", "Energy — Lower Bound", 1);
  await eq(SEED_IDS.sbs_peds_pndep_kcal_high,  SEED_IDS.sbs_peds_pndep,  "energy",  "weightKg * 90",   "kcal/day", "Energy — Upper Bound", 2);
  await eq(SEED_IDS.sbs_peds_pndep_prot_low,   SEED_IDS.sbs_peds_pndep,  "protein", "weightKg * 2.0",  "g/day",    "Protein — Lower Bound", 3);
  await eq(SEED_IDS.sbs_peds_pndep_prot_high,  SEED_IDS.sbs_peds_pndep,  "protein", "weightKg * 3.0",  "g/day",    "Protein — Upper Bound", 4);
  await eq(SEED_IDS.sbs_peds_entaut_kcal_low,  SEED_IDS.sbs_peds_entaut, "energy",  "weightKg * 80",   "kcal/day", "Energy — Lower Bound", 1);
  await eq(SEED_IDS.sbs_peds_entaut_kcal_high, SEED_IDS.sbs_peds_entaut, "energy",  "weightKg * 130",  "kcal/day", "Energy — Upper Bound", 2);
  await eq(SEED_IDS.sbs_peds_entaut_prot_low,  SEED_IDS.sbs_peds_entaut, "protein", "weightKg * 2.0",  "g/day",    "Protein — Lower Bound", 3);
  await eq(SEED_IDS.sbs_peds_entaut_prot_high, SEED_IDS.sbs_peds_entaut, "protein", "weightKg * 3.0",  "g/day",    "Protein — Upper Bound", 4);

  const cfPedsDfLow  = "df = ifTrue(fev1Pct >= 80, 1.0, ifTrue(fev1Pct >= 40, 1.1, 1.5));";
  const cfPedsDfHigh = "df = ifTrue(fev1Pct >= 80, 1.1, ifTrue(fev1Pct >= 40, 1.4, 2.0));";
  await eq(SEED_IDS.cf_peds_bb_kcal_low,  SEED_IDS.cf_peds_bedbound,  "energy",  `${cfPedsDfLow} schofieldReeKcal * df * 1.3`,  "kcal/day", "Energy — Lower Bound", 1);
  await eq(SEED_IDS.cf_peds_bb_kcal_high, SEED_IDS.cf_peds_bedbound,  "energy",  `${cfPedsDfHigh} schofieldReeKcal * df * 1.3`, "kcal/day", "Energy — Upper Bound", 2);
  await eq(SEED_IDS.cf_peds_bb_prot_low,  SEED_IDS.cf_peds_bedbound,  "protein", "weightKg * 0.96",                              "g/day",    "Protein — Lower Bound", 3);
  await eq(SEED_IDS.cf_peds_bb_prot_high, SEED_IDS.cf_peds_bedbound,  "protein", "weightKg * 1.6",                               "g/day",    "Protein — Upper Bound", 4);
  await eq(SEED_IDS.cf_peds_sed_kcal_low, SEED_IDS.cf_peds_sedentary, "energy",  `${cfPedsDfLow} schofieldReeKcal * df * 1.5`,  "kcal/day", "Energy — Lower Bound", 1);
  await eq(SEED_IDS.cf_peds_sed_kcal_high,SEED_IDS.cf_peds_sedentary, "energy",  `${cfPedsDfHigh} schofieldReeKcal * df * 1.5`, "kcal/day", "Energy — Upper Bound", 2);
  await eq(SEED_IDS.cf_peds_sed_prot_low, SEED_IDS.cf_peds_sedentary, "protein", "weightKg * 0.96",                              "g/day",    "Protein — Lower Bound", 3);
  await eq(SEED_IDS.cf_peds_sed_prot_high,SEED_IDS.cf_peds_sedentary, "protein", "weightKg * 1.6",                               "g/day",    "Protein — Upper Bound", 4);
  await eq(SEED_IDS.cf_peds_act_kcal_low, SEED_IDS.cf_peds_active,    "energy",  `${cfPedsDfLow} schofieldReeKcal * df * 1.7`,  "kcal/day", "Energy — Lower Bound", 1);
  await eq(SEED_IDS.cf_peds_act_kcal_high,SEED_IDS.cf_peds_active,    "energy",  `${cfPedsDfHigh} schofieldReeKcal * df * 1.7`, "kcal/day", "Energy — Upper Bound", 2);
  await eq(SEED_IDS.cf_peds_act_prot_low, SEED_IDS.cf_peds_active,    "protein", "weightKg * 0.96",                              "g/day",    "Protein — Lower Bound", 3);
  await eq(SEED_IDS.cf_peds_act_prot_high,SEED_IDS.cf_peds_active,    "protein", "weightKg * 1.6",                               "g/day",    "Protein — Upper Bound", 4);

  await eq(SEED_IDS.hl_peds_norm_kcal_low,  SEED_IDS.hl_peds_normal, "energy",  "schofieldReeKcal * 0.925", "kcal/day", "Energy — Lower Bound", 1);
  await eq(SEED_IDS.hl_peds_norm_kcal_high, SEED_IDS.hl_peds_normal, "energy",  "schofieldReeKcal * 1.075", "kcal/day", "Energy — Upper Bound", 2);
  await eq(SEED_IDS.hl_peds_norm_prot_low,  SEED_IDS.hl_peds_normal, "protein", "weightKg * 0.85",           "g/day",    "Protein — Lower Bound", 3);
  await eq(SEED_IDS.hl_peds_norm_prot_high, SEED_IDS.hl_peds_normal, "protein", "weightKg * 1.52",           "g/day",    "Protein — Upper Bound", 4);

  await eq(SEED_IDS.mal_peds_kcal_low,  SEED_IDS.mal_peds_catchup, "energy",  "weightKg * 25",  "kcal/day", "Energy — Lower Bound", 1);
  await eq(SEED_IDS.mal_peds_kcal_high, SEED_IDS.mal_peds_catchup, "energy",  "weightKg * 35",  "kcal/day", "Energy — Upper Bound", 2);
  await eq(SEED_IDS.mal_peds_prot_low,  SEED_IDS.mal_peds_catchup, "protein", "weightKg * 1.2", "g/day",    "Protein — Lower Bound", 3);
  await eq(SEED_IDS.mal_peds_prot_high, SEED_IDS.mal_peds_catchup, "protein", "weightKg * 2.0", "g/day",    "Protein — Upper Bound", 4);

  await eq(SEED_IDS.bpd_peds_kcal_low,  SEED_IDS.bpd_peds_std, "energy",  "weightKg * 120", "kcal/day", "Energy — Lower Bound", 1);
  await eq(SEED_IDS.bpd_peds_kcal_high, SEED_IDS.bpd_peds_std, "energy",  "weightKg * 150", "kcal/day", "Energy — Upper Bound", 2);
  await eq(SEED_IDS.bpd_peds_prot_low,  SEED_IDS.bpd_peds_std, "protein", "weightKg * 3.5", "g/day",    "Protein — Lower Bound", 3);
  await eq(SEED_IDS.bpd_peds_prot_high, SEED_IDS.bpd_peds_std, "protein", "weightKg * 4.5", "g/day",    "Protein — Upper Bound", 4);

  await eq(SEED_IDS.preg_peds_t1_kcal_low,  SEED_IDS.preg_peds_t1, "energy",  "schofieldReeKcal",        "kcal/day", "Energy — Lower Bound", 1);
  await eq(SEED_IDS.preg_peds_t1_kcal_high, SEED_IDS.preg_peds_t1, "energy",  "schofieldReeKcal + 50",   "kcal/day", "Energy — Upper Bound", 2);
  await eq(SEED_IDS.preg_peds_t1_prot,      SEED_IDS.preg_peds_t1, "protein", "71",                       "g/day",    "Protein — Target",     3);
  await eq(SEED_IDS.preg_peds_t2_kcal_low,  SEED_IDS.preg_peds_t2, "energy",  "schofieldReeKcal + 340",  "kcal/day", "Energy — Lower Bound", 1);
  await eq(SEED_IDS.preg_peds_t2_kcal_high, SEED_IDS.preg_peds_t2, "energy",  "schofieldReeKcal + 390",  "kcal/day", "Energy — Upper Bound", 2);
  await eq(SEED_IDS.preg_peds_t2_prot,      SEED_IDS.preg_peds_t2, "protein", "71",                       "g/day",    "Protein — Target",     3);
  await eq(SEED_IDS.preg_peds_t3_kcal_low,  SEED_IDS.preg_peds_t3, "energy",  "schofieldReeKcal + 452",  "kcal/day", "Energy — Lower Bound", 1);
  await eq(SEED_IDS.preg_peds_t3_kcal_high, SEED_IDS.preg_peds_t3, "energy",  "schofieldReeKcal + 502",  "kcal/day", "Energy — Upper Bound", 2);
  await eq(SEED_IDS.preg_peds_t3_prot,      SEED_IDS.preg_peds_t3, "protein", "71",                       "g/day",    "Protein — Target",     3);

  await eq(SEED_IDS.bf_peds_early_kcal_low,  SEED_IDS.bf_peds_early, "energy",  "schofieldReeKcal + 380",      "kcal/day", "Energy — Lower Bound", 1);
  await eq(SEED_IDS.bf_peds_early_kcal_high, SEED_IDS.bf_peds_early, "energy",  "schofieldReeKcal + 420",      "kcal/day", "Energy — Upper Bound", 2);
  await eq(SEED_IDS.bf_peds_early_prot_low,  SEED_IDS.bf_peds_early, "protein", "weightKg * 0.91 + 25",        "g/day",    "Protein — Lower Bound", 3);
  await eq(SEED_IDS.bf_peds_early_prot_high, SEED_IDS.bf_peds_early, "protein", "weightKg * 0.91 + 25",        "g/day",    "Protein — Upper Bound", 4);
  await eq(SEED_IDS.bf_peds_late_kcal_low,   SEED_IDS.bf_peds_late,  "energy",  "schofieldReeKcal + 310",      "kcal/day", "Energy — Lower Bound", 1);
  await eq(SEED_IDS.bf_peds_late_kcal_high,  SEED_IDS.bf_peds_late,  "energy",  "schofieldReeKcal + 350",      "kcal/day", "Energy — Upper Bound", 2);
  await eq(SEED_IDS.bf_peds_late_prot_low,   SEED_IDS.bf_peds_late,  "protein", "weightKg * 0.91 + 25",        "g/day",    "Protein — Lower Bound", 3);
  await eq(SEED_IDS.bf_peds_late_prot_high,  SEED_IDS.bf_peds_late,  "protein", "weightKg * 0.91 + 25",        "g/day",    "Protein — Upper Bound", 4);

  // ─── 7. Clinical guidance notes ───────────────────────────────────────────
  // (all note calls preserved verbatim from original)
  await note(SEED_IDS.copd_std_note1, null, SEED_IDS.copd_standard, "Monitor respiratory quotient (RQ): avoid overfeeding-induced hypercapnic respiratory failure (RQ target ≤1.0).", 1);
  await note(SEED_IDS.copd_std_note2, null, SEED_IDS.copd_standard, "COPD with obesity (BMI ≥30): adjust targets; consider impact on respiratory quotient.", 2);
  await note(SEED_IDS.heart_failure_std_note1, null, SEED_IDS.heart_failure_standard, "Cardiac cachexia increases REE, but total energy needs may be lower due to decreased physical activity.", 1);
  await note(SEED_IDS.heart_failure_std_note2, null, SEED_IDS.heart_failure_standard, "Strictly individualized — often fluid restricted. Individualize sodium and fluid restrictions based on volume status and ejection fraction.", 2);
  await note(SEED_IDS.cirrhosis_comp_note1, null, SEED_IDS.cirrhosis_compensated, "Cirrhosis: 35–40 kcal/kg dry weight.", 1);
  await note(SEED_IDS.cirrhosis_comp_note2, null, SEED_IDS.cirrhosis_compensated, "Do NOT restrict protein in cirrhosis — adequate intake prevents sarcopenia.", 2);
  await note(SEED_IDS.cirrhosis_comp_note3, null, SEED_IDS.cirrhosis_compensated, "Provide a late-evening carbohydrate snack (200–400 kcal) to minimize overnight fasting catabolism.", 3);
  await note(SEED_IDS.cirrhosis_comp_note4, null, SEED_IDS.cirrhosis_compensated, "Use dry body weight or ideal weight-for-height; actual weight overestimates needs in ascites/fluid retention.", 4);
  await note(SEED_IDS.cirrhosis_decomp_note1, null, SEED_IDS.cirrhosis_decompensated, "Cirrhosis: 35–40 kcal/kg dry weight.", 1);
  await note(SEED_IDS.cirrhosis_decomp_note2, null, SEED_IDS.cirrhosis_decompensated, "Do NOT restrict protein in cirrhosis — adequate intake prevents sarcopenia.", 2);
  await note(SEED_IDS.cirrhosis_decomp_note3, null, SEED_IDS.cirrhosis_decompensated, "Provide a late-evening carbohydrate snack (200–400 kcal) to minimize overnight fasting catabolism.", 3);
  await note(SEED_IDS.cirrhosis_decomp_note4, null, SEED_IDS.cirrhosis_decompensated, "Use dry body weight or ideal weight-for-height; actual weight overestimates needs in ascites/fluid retention.", 4);
  await note(SEED_IDS.cirrhosis_decomp_note5, null, SEED_IDS.cirrhosis_decompensated, "Decompensated: restrict fluid 25–30 mL/kg dry weight. Strict sodium restriction (<2g/day). Monitor for dilutional hyponatremia.", 5);
  await note(SEED_IDS.liver_transplant_acute_note1, null, SEED_IDS.liver_transplant_acute, "Acute post-op: MSJ × 1.3. Taper to normal maintenance within 6–12 months.", 1);
  await note(SEED_IDS.ckd_vlpd_note1, null, SEED_IDS.ckd_vlpd, "VLPD + keto-analog supplementation: 0.28–0.43 g/kg/day protein.", 1);
  await note(SEED_IDS.ckd_lpd_note1, null, SEED_IDS.ckd_lpd, "Pre-dialysis protein restriction: 0.55–0.60 g/kg/day to balance uremic control with protein-energy wasting risk.", 1);
  await note(SEED_IDS.ckd_lpddm_note1, null, SEED_IDS.ckd_lpd_dm, "Low-protein diet + diabetes: 0.60–0.80 g/kg/day.", 1);
  await note(SEED_IDS.ckd_hd_note1, null, SEED_IDS.ckd_hd, "Hemodialysis: 1.2 g/kg/day protein to offset dialytic losses.", 1);
  await note(SEED_IDS.ckd_pd_note1, null, SEED_IDS.ckd_pd, "Peritoneal dialysis: 1.2–1.3 g/kg/day protein to offset peritoneal amino acid losses.", 1);
  await note(SEED_IDS.kidney_transplant_acute_note1, null, SEED_IDS.kidney_transplant_acute, "Acute post-op: MSJ × 1.2–1.3. Taper rapidly to maintenance EER to prevent obesity in allograft recipients.", 1);
  await note(SEED_IDS.masld_mash_std_note1, null, SEED_IDS.masld_mash_standard, "Target 5–10% total body weight loss to improve hepatic outcomes (EASL-EASD-EASO, 2024).", 1);
  await note(SEED_IDS.masld_mash_std_note2, null, SEED_IDS.masld_mash_standard, "Maintain protein ≥1.5 g/kg/day to preserve lean body mass during caloric restriction.", 2);
  await note(SEED_IDS.masld_mash_mal_note1, null, SEED_IDS.masld_mash_malnourished, "Underweight/malnourished/sarcopenic MASLD: 30–35 kcal/kg. Do NOT apply caloric deficit.", 1);
  await note(SEED_IDS.masld_mash_mal_note2, null, SEED_IDS.masld_mash_malnourished, "Maintain protein ≥1.5 g/kg/day to preserve lean body mass during caloric restriction.", 2);
  await note(SEED_IDS.crit_ill_lt30_note1, null, SEED_IDS.crit_ill_bmi_lt30, "IC is the clinical gold standard. Full feeds typically initiated after day 2–3.", 1);
  await note(SEED_IDS.crit_ill_lt30_note2, null, SEED_IDS.crit_ill_bmi_lt30, "BMI < 30: 12–25 kcal/kg early (hypocaloric). Advance to 25–30 after day 7–10.", 2);
  await note(SEED_IDS.crit_ill_30_50_note1, null, SEED_IDS.crit_ill_bmi_30_50, "IC is the clinical gold standard. Full feeds typically initiated after day 2–3.", 1);
  await note(SEED_IDS.crit_ill_30_50_note2, null, SEED_IDS.crit_ill_bmi_30_50, "Obese CI BMI 30–50: PSU 2003b not validated. Use permissive underfeeding 11–14 kcal/kg actual wt.", 2);
  await note(SEED_IDS.crit_ill_30_50_note3, null, SEED_IDS.crit_ill_bmi_30_50, "Protein: 2.0 g/kg IBW for BMI 30–39.9", 3);
  await note(SEED_IDS.crit_ill_gt50_note1, null, SEED_IDS.crit_ill_bmi_gt50, "IC is the clinical gold standard. Full feeds typically initiated after day 2–3.", 1);
  await note(SEED_IDS.crit_ill_gt50_note2, null, SEED_IDS.crit_ill_bmi_gt50, "Severely obese CI (BMI >50): 22–25 kcal/kg IBW.", 2);
  await note(SEED_IDS.crit_ill_gt50_note3, null, SEED_IDS.crit_ill_bmi_gt50, "Protein: 2.5 g/kg IBW for BMI ≥40", 3);
  await note(SEED_IDS.aki_no_dial_note1, null, SEED_IDS.aki_no_dialysis, "⚠ Do NOT restrict protein in AKI — restriction worsens outcomes.", 1);
  await note(SEED_IDS.aki_no_dial_note2, null, SEED_IDS.aki_no_dialysis, "24h urine output + 500 mL insensible losses. Add +10% per 1°C fever above 37°C.", 2);
  await note(SEED_IDS.aki_hd_note1, null, SEED_IDS.aki_hemodialysis, "⚠ Do NOT restrict protein in AKI — restriction worsens outcomes.", 1);
  await note(SEED_IDS.aki_hd_note2, null, SEED_IDS.aki_hemodialysis, "24h urine output + 500 mL insensible losses. Add +10% per 1°C fever above 37°C.", 2);
  await note(SEED_IDS.aki_crrt_note1, null, SEED_IDS.aki_crrt, "⚠ Do NOT restrict protein in AKI — restriction worsens outcomes.", 1);
  await note(SEED_IDS.aki_crrt_note2, null, SEED_IDS.aki_crrt, "CRRT: increase protein to 1.7–2.5 g/kg/day to compensate for amino acid dialysate losses.", 2);
  await note(SEED_IDS.aki_crrt_note3, null, SEED_IDS.aki_crrt, "Fluid unrestricted during CRRT — prevent dehydration during diuresis.", 3);
  await note(SEED_IDS.pancreatitis_mild_note1, null, SEED_IDS.pancreatitis_mild_mod, "Mild–moderate pancreatitis: MSJ × 1.1–1.2. Reserve higher factors for severe/necrotizing cases.", 1);
  await note(SEED_IDS.pancreatitis_mild_note2, null, SEED_IDS.pancreatitis_mild_mod, "Initiate EN within 72 hours of admission.", 2);
  await note(SEED_IDS.pancreatitis_ic_note, null, SEED_IDS.pancreatitis_mild_mod, "Indirect calorimetry (IC) is preferred for pancreatitis if available — recalculate requirements regularly.", 3);
  await note(SEED_IDS.pancreatitis_severe_note1, null, SEED_IDS.pancreatitis_severe_crit, "Severe/critical pancreatitis: MSJ × 1.2–1.5 stress factor.", 1);
  await note(SEED_IDS.pancreatitis_severe_note2, null, SEED_IDS.pancreatitis_severe_crit, "Initiate EN within 72 hours of admission.", 2);
  await note(SEED_IDS.pancreatitis_ic_note, null, SEED_IDS.pancreatitis_severe_crit, "Indirect calorimetry (IC) is preferred for pancreatitis if available — recalculate requirements regularly.", 3);
  await note(SEED_IDS.trauma_std_note1, null, SEED_IDS.trauma_standard, "MSJ REE × 1.3–1.4 acute phase factor.", 1);
  await note(SEED_IDS.trauma_std_note2, null, SEED_IDS.trauma_standard, "Severe/polytrauma: protein may exceed 2.0 g/kg — individualize. Use IC to track energy expenditure changes.", 2);
  await note(SEED_IDS.trauma_open_note1, null, SEED_IDS.trauma_open_abdomen, "Open abdomen: exudate replacement added — exudateVolumeL × 29g protein = +exudateVolumeL*29g/day; +exudateVolumeL*116 kcal/day energy.", 1);
  await note(SEED_IDS.trauma_open_note2, null, SEED_IDS.trauma_open_abdomen, "Source: Hourigan et al. (2010). Loss of protein, immunoglobulins, and electrolytes in exudates from NPWT. Nutr Clin Pract, 25(5), 510–516. doi:10.1177/0884533610379852", 2);
  await note(SEED_IDS.trauma_open_note3, null, SEED_IDS.trauma_open_abdomen, "Severe/polytrauma: protein may exceed 2.0 g/kg — individualize. Use IC to track energy expenditure changes.", 3);
  await note(SEED_IDS.burns_toronto_note1, null, SEED_IDS.burns_toronto, "Toronto equation preferred: limits glucose to ≤5 mg/kg/min, preventing hepatic steatosis and hypercapnia.", 1);
  await note(SEED_IDS.burns_toronto_note2, null, SEED_IDS.burns_toronto, "Protein target scaled to TBSA: if TBSA > 40% -> 2.0 g/kg/day; else 1.5–2.0 g/kg/day. Limit glucose to ≤5 mg/kg/min.", 2);
  await note(SEED_IDS.burns_toronto_note3, null, SEED_IDS.burns_toronto, "Parkland formula / physiological endpoints — strict I/O monitoring required.", 3);
  await note(SEED_IDS.burns_ic_note, null, SEED_IDS.burns_toronto, "IC strongly recommended for burns — recalculate frequently.", 4);
  await note(SEED_IDS.stroke_isc_note1, null, SEED_IDS.stroke_ischemic, "MSJ REE × 1.1–1.2 stress factor.", 1);
  await note(SEED_IDS.stroke_isc_note2, null, SEED_IDS.stroke_ischemic, "30–40 mL/kg; manage fluid carefully in patients at risk for cerebral edema.", 2);
  await note(SEED_IDS.stroke_hem_note1, null, SEED_IDS.stroke_hemorrhagic, "Hemorrhagic stroke: increase protein up to 2.5 g/kg/day to counter severe neuro-catabolism.", 1);
  await note(SEED_IDS.stroke_hem_note2, null, SEED_IDS.stroke_hemorrhagic, "30–40 mL/kg; manage fluid carefully in patients at risk for cerebral edema.", 2);
  await note(SEED_IDS.onc_sed_note1, null, SEED_IDS.onc_sed, "Use indirect calorimetry (IC) if available to accurately determine energy needs.", 1);
  await note(SEED_IDS.onc_hyper_note1, null, SEED_IDS.onc_hyper, "Use indirect calorimetry (IC) if available to accurately determine energy needs.", 1);
  await note(SEED_IDS.onc_stressed_note1, null, SEED_IDS.onc_stressed, "Use indirect calorimetry (IC) if available to accurately determine energy needs.", 1);
  await note(SEED_IDS.onc_stressed_note2, null, SEED_IDS.onc_stressed, "Severely stressed: avoid exceeding 35 kcal/kg prior to treatment to prevent overfeeding.", 2);
  await note(SEED_IDS.hsct_active_note1, null, SEED_IDS.hsct_active, "Monitor fluid status carefully. Increase fluids for concurrent fever or significant GI losses.", 1);
  await note(SEED_IDS.hsct_active_note2, null, SEED_IDS.hsct_active, "Reassess requirements if Graft-versus-Host Disease (GvHD) develops.", 2);
  await note(SEED_IDS.sbs_note1, null, SEED_IDS.sbs_standard, "Fluid needs are highly individualized. Monitor output closely to adjust targets.", 1);
  await note(SEED_IDS.sbs_note2, null, SEED_IDS.sbs_standard, "Standard ORS sodium replacement should target 80–100 mEq/L.", 2);
  await note(SEED_IDS.sbs_note3, null, SEED_IDS.sbs_standard, "Adjust dietary interventions if colon is preserved (increases fluid/electrolyte absorption).", 3);
  await note(SEED_IDS.sbs_note4, null, SEED_IDS.sbs_standard, "Target approximately 20% of total energy intake from protein.", 4);
  await note(SEED_IDS.sbs_note5, null, SEED_IDS.sbs_standard, "Prescribe a 50% energy absorption buffer (multiply EER by 1.5) to compensate for hypermetabolism and malabsorption.", 5);
  await note(SEED_IDS.cf_note1, null, SEED_IDS.cf_active, "CF energy needs scale with FEV1-derived Disease Factor (DF). FEV1 >= 80%: DF 1.0-1.1; 40-79%: DF 1.1-1.4; <40%: DF 1.5-2.0.", 1);
  await note(SEED_IDS.cf_note2, null, SEED_IDS.cf_active, "Pancreatic enzyme replacement therapy (PERT) dose adjustments required based on pancreatic sufficiency status.", 2);
  await note(SEED_IDS.scd_stable_note1, null, SEED_IDS.scd_stable, "Maintain high fluid intake (AI target 3–4 L/day) to prevent sickle crisis and dehydration.", 1);
  await note(SEED_IDS.scd_voc_note1, null, SEED_IDS.scd_voc, "Vaso-occlusive crisis: hypermetabolism increases calorie needs to MSJ × 1.3–1.5.", 1);
  await note(SEED_IDS.pi_stage3_4_note1, null, SEED_IDS.pi_stage3_4, "Fluid: 30 mL/kg/day or 1.0–1.5 mL/kcal prescribed. Increase for wound exudate losses.", 1);
  await note(SEED_IDS.mal_note1, null, SEED_IDS.mal_refeeding, "Refeeding risk: advance calories slowly (start at 10–15 kcal/kg or 50% of target EER) and monitor electrolytes (K, Phos, Mg) daily.", 1);
  await note(SEED_IDS.mal_note2, null, SEED_IDS.mal_refeeding, "Thiamine supplementation (100–300 mg/day) must be initiated prior to introducing carbohydrates.", 2);
  await note(SEED_IDS.obe_note1, null, SEED_IDS.obe_stable, "Indirect calorimetry (IC) preferred. Obesity hypocaloric targets: 20–25 kcal/kg IBW.", 1);
  await note(SEED_IDS.obe_note2, null, SEED_IDS.obe_stable, "Consider adjusted body weight if actual body weight is >125% of ideal body weight.", 2);
  await note(SEED_IDS.preg_t1_note1, null, SEED_IDS.preg_t1, "Fluid: 3 L/day total (beverages + food moisture).", 1);
  await note(SEED_IDS.preg_t2_note1, null, SEED_IDS.preg_t2, "Fluid: 3 L/day total (beverages + food moisture).", 1);
  await note(SEED_IDS.preg_t3_note1, null, SEED_IDS.preg_t3, "Fluid: 3 L/day total (beverages + food moisture).", 1);
  await note(SEED_IDS.bf_early_note1, null, SEED_IDS.bf_early, "AI target 3.8 L/day for breastfeeding.", 1);
  await note(SEED_IDS.bf_early_energy_note, null, SEED_IDS.bf_early, "Lactation energy addition: +400 kcal/day above non-pregnant EER (0–6 months).", 2);
  await note(SEED_IDS.bf_late_note1, null, SEED_IDS.bf_late, "AI target 3.8 L/day for breastfeeding.", 1);
  await note(SEED_IDS.bf_late_energy_note, null, SEED_IDS.bf_late, "Lactation energy addition: +330 kcal/day above non-pregnant EER (7–12 months).", 2);
  await note(SEED_IDS.hl_note1, null, SEED_IDS.hl_standard, "PAL (Physical Activity Level) must be provided as an extra input. Use 1.2 sedentary through 1.9 very active.", 1);
  await note(SEED_IDS.crit_ill_peds_note1, null, SEED_IDS.crit_ill_peds_std, "Energy based on Schofield WH BMR (schofieldReeKcal). Age-appropriate coefficients applied automatically by the scope builder.", 1);
  await note(SEED_IDS.crit_ill_peds_note2, null, SEED_IDS.crit_ill_peds_std, "Protein: <2y: 2.0–3.0 g/kg; 2–12y: 1.5–2.0 g/kg; ≥13y: 1.5 g/kg. Use age-appropriate target.", 2);
  await note(SEED_IDS.crit_ill_peds_note3, null, SEED_IDS.crit_ill_peds_std, "IC is the clinical gold standard. Avoid overfeeding during the acute phase (use permissive underfeeding/trophic feeds as appropriate).", 3);
  await note(SEED_IDS.aki_peds_nodial_note1, null, SEED_IDS.aki_peds_nodial, "Energy based on Schofield WH BMR (schofieldReeKcal). Age-appropriate coefficients applied automatically by the scope builder.", 1);
  await note(SEED_IDS.aki_peds_nodial_note2, null, SEED_IDS.aki_peds_nodial, "Fluid: monitor insensible losses carefully, which scale with body surface area (BSA) in pediatric patients.", 2);
  await note(SEED_IDS.aki_peds_dial_note1, null, SEED_IDS.aki_peds_dial, "Energy based on Schofield WH BMR (schofieldReeKcal). Age-appropriate coefficients applied automatically by the scope builder.", 1);
  await note(SEED_IDS.aki_peds_dial_note2, null, SEED_IDS.aki_peds_dial, "Fluid: monitor insensible losses carefully, which scale with body surface area (BSA) in pediatric patients.", 2);
  await note(SEED_IDS.aki_peds_dial_note3, null, SEED_IDS.aki_peds_dial, "CRRT: high dialytic amino acid clearance requires increased protein replacement up to 2.5 g/kg/day.", 3);
  await note(SEED_IDS.pancreatitis_peds_note1, null, SEED_IDS.pancreatitis_peds_std, "Energy based on Schofield WH BMR (schofieldReeKcal). Age-appropriate coefficients applied automatically by the scope builder.", 1);
  await note(SEED_IDS.pancreatitis_peds_note2, null, SEED_IDS.pancreatitis_peds_std, "Initiate standard enteral nutrition within 72 hours of admission if hemodynamically stable.", 2);
  await note(SEED_IDS.burns_peds_child_note1, null, SEED_IDS.burns_peds_child, "Enter TBSA% for Galveston formula. Parkland formula for fluid — strict I/O monitoring required.", 1);
  await note(SEED_IDS.burns_peds_adol_note1, null, SEED_IDS.burns_peds_adol, "Enter TBSA% for Galveston formula. Parkland formula for fluid — strict I/O monitoring required.", 1);
  await note(SEED_IDS.onc_peds_std_note1, null, SEED_IDS.onc_peds_std, "Energy based on Schofield WH BMR (schofieldReeKcal). Age-appropriate coefficients applied automatically by the scope builder.", 1);
  await note(SEED_IDS.onc_peds_std_note2, null, SEED_IDS.onc_peds_std, "Use indirect calorimetry (IC) if available to accurately determine energy needs.", 2);
  await note(SEED_IDS.onc_peds_std_note3, null, SEED_IDS.onc_peds_std, "Reassess nutritional requirements frequently during different phases of active oncological treatment.", 3);
  await note(SEED_IDS.onc_peds_und_note1, null, SEED_IDS.onc_peds_undernourished, "Energy based on Schofield WH BMR (schofieldReeKcal). Age-appropriate coefficients applied automatically by the scope builder.", 1);
  await note(SEED_IDS.onc_peds_und_note2, null, SEED_IDS.onc_peds_undernourished, "Use indirect calorimetry (IC) if available to accurately determine energy needs.", 2);
  await note(SEED_IDS.onc_peds_und_note3, null, SEED_IDS.onc_peds_undernourished, "Reassess nutritional requirements frequently during different phases of active oncological treatment.", 3);
  await note(SEED_IDS.ckd_peds_3_5_note1, null, SEED_IDS.ckd_peds_3_5_std, "Energy based on Schofield WH BMR (schofieldReeKcal). Age-appropriate coefficients applied automatically by the scope builder.", 1);
  await note(SEED_IDS.ckd_peds_3_5_note2, null, SEED_IDS.ckd_peds_3_5_std, "Do not restrict protein intake below the Suggested Daily Intake (SDI) for age.", 2);
  await note(SEED_IDS.ckd_peds_3_5_note3, null, SEED_IDS.ckd_peds_3_5_std, "Protein restriction below safe targets halts linear growth and causes skeletal muscle wasting in children.", 3);
  await note(SEED_IDS.ckd_peds_hd_note1, null, SEED_IDS.ckd_peds_hd, "Energy based on Schofield WH BMR (schofieldReeKcal). Age-appropriate coefficients applied automatically by the scope builder.", 1);
  await note(SEED_IDS.ckd_peds_hd_note2, null, SEED_IDS.ckd_peds_hd, "Adult protein targets (1.0–1.2 g/kg) are insufficient to cover dialytic losses in pediatric patients.", 2);
  await note(SEED_IDS.ckd_peds_pd_note1, null, SEED_IDS.ckd_peds_pd, "Energy based on Schofield WH BMR (schofieldReeKcal). Age-appropriate coefficients applied automatically by the scope builder.", 1);
  await note(SEED_IDS.ckd_peds_pd_note2, null, SEED_IDS.ckd_peds_pd, "Adult protein targets (1.0–1.2 g/kg) are insufficient to cover dialytic losses in pediatric patients.", 2);
  await note(SEED_IDS.kidney_transplant_peds_acute_note1, null, SEED_IDS.kidney_transplant_peds_acute, "Energy based on Schofield WH BMR (schofieldReeKcal). Age-appropriate coefficients applied automatically by the scope builder.", 1);
  await note(SEED_IDS.kidney_transplant_peds_chron_note1, null, SEED_IDS.kidney_transplant_peds_chron, "Energy based on Schofield WH BMR (schofieldReeKcal). Age-appropriate coefficients applied automatically by the scope builder.", 1);
  await note(SEED_IDS.cirrhosis_peds_note1, null, SEED_IDS.cirrhosis_peds_std, "Energy based on Schofield WH BMR (schofieldReeKcal). Age-appropriate coefficients applied automatically by the scope builder.", 1);
  await note(SEED_IDS.cirrhosis_peds_note2, null, SEED_IDS.cirrhosis_peds_std, "Do not restrict protein in pediatric cirrhosis due to high risk of muscle wasting/malnutrition.", 2);
  await note(SEED_IDS.cirrhosis_peds_note3, null, SEED_IDS.cirrhosis_peds_std, "Mifflin-St Jeor is invalid for pediatric patients. Use Schofield BMR equations instead.", 3);
  await note(SEED_IDS.liver_transplant_peds_acute_note1, null, SEED_IDS.liver_transplant_peds_acute, "Energy based on Schofield WH BMR (schofieldReeKcal). Age-appropriate coefficients applied automatically by the scope builder.", 1);
  await note(SEED_IDS.liver_transplant_peds_acute_note2, null, SEED_IDS.liver_transplant_peds_acute, "Static 30–35 kcal/kg represents a starvation diet for infants and young children.", 2);
  await note(SEED_IDS.liver_transplant_peds_chron_note1, null, SEED_IDS.liver_transplant_peds_chron, "Energy based on Schofield WH BMR (schofieldReeKcal). Age-appropriate coefficients applied automatically by the scope builder.", 1);
  await note(SEED_IDS.trauma_peds_std_note1, null, SEED_IDS.trauma_peds_std, "Energy based on Schofield WH BMR (schofieldReeKcal). Age-appropriate coefficients applied automatically by the scope builder.", 1);
  await note(SEED_IDS.trauma_peds_open_note1, null, SEED_IDS.trauma_peds_open, "Energy based on Schofield WH BMR (schofieldReeKcal). Age-appropriate coefficients applied automatically by the scope builder.", 1);
  await note(SEED_IDS.masld_mash_peds_note1, null, SEED_IDS.masld_mash_peds_std, "Energy based on Schofield WH BMR (schofieldReeKcal). Age-appropriate coefficients applied automatically by the scope builder.", 1);
  await note(SEED_IDS.masld_mash_peds_note2, null, SEED_IDS.masld_mash_peds_std, "Pediatric MASLD: EER based on Schofield WH. Avoid adult kcal/kg targets. Use gradual growth-preserving weight management.", 2);
  await note(SEED_IDS.copd_peds_note1, null, SEED_IDS.copd_peds_std, "Energy based on Schofield WH BMR (schofieldReeKcal). Age-appropriate coefficients applied automatically by the scope builder.", 1);
  await note(SEED_IDS.copd_peds_note2, null, SEED_IDS.copd_peds_std, "Adult Schofield weight brackets are inappropriate for pediatric COPD — age-specific WH table used.", 2);
  await note(SEED_IDS.heart_failure_peds_note1, null, SEED_IDS.heart_failure_peds_std, "Energy based on Schofield WH BMR (schofieldReeKcal). Age-appropriate coefficients applied automatically by the scope builder.", 1);
  await note(SEED_IDS.heart_failure_peds_note2, null, SEED_IDS.heart_failure_peds_std, "Pediatric congenital heart disease: account for hypermetabolism from increased cardiac workload. Fluid restrict to 70–90% Holliday-Segar.", 2);
  await note(SEED_IDS.stroke_peds_note1, null, SEED_IDS.stroke_peds_std, "Energy based on Schofield WH BMR (schofieldReeKcal). Age-appropriate coefficients applied automatically by the scope builder.", 1);
  await note(SEED_IDS.stroke_peds_note2, null, SEED_IDS.stroke_peds_std, "Adult fluid targets (30–40 mL/kg) induce severe dehydration in pediatric patients — Holliday-Segar used instead.", 2);
  await note(SEED_IDS.pi_peds_stage1_2_note1, null, SEED_IDS.pi_peds_stage1_2, "Energy based on Schofield WH BMR (schofieldReeKcal). Age-appropriate coefficients applied automatically by the scope builder.", 1);
  await note(SEED_IDS.pi_peds_stage1_2_note2, null, SEED_IDS.pi_peds_stage1_2, "Applying adult target (35 kcal/kg) to immobile neurologically impaired pediatric patients causes rapid obesity.", 2);
  await note(SEED_IDS.pi_peds_stage3_4_note1, null, SEED_IDS.pi_peds_stage3_4, "Energy based on Schofield WH BMR (schofieldReeKcal). Age-appropriate coefficients applied automatically by the scope builder.", 1);
  await note(SEED_IDS.pi_peds_stage3_4_note2, null, SEED_IDS.pi_peds_stage3_4, "Applying adult target (35 kcal/kg) to immobile neurologically impaired pediatric patients causes rapid obesity.", 2);
  await note(SEED_IDS.scd_peds_stable_note1, null, SEED_IDS.scd_peds_stable, "Energy based on Schofield WH BMR (schofieldReeKcal). Age-appropriate coefficients applied automatically by the scope builder.", 1);
  await note(SEED_IDS.scd_peds_stable_note2, null, SEED_IDS.scd_peds_stable, "Hemoglobin-adjusted sex-specific REE equation. Requires hemoglobin (g/dL) and PAL inputs. Adult MSJ is architecturally invalid for pediatric SCD.", 2);
  await note(SEED_IDS.scd_peds_voc_note1, null, SEED_IDS.scd_peds_voc, "Energy based on Schofield WH BMR (schofieldReeKcal). Age-appropriate coefficients applied automatically by the scope builder.", 1);
  await note(SEED_IDS.hsct_peds_infant_note1, null, SEED_IDS.hsct_peds_infant, "Energy based on Schofield WH BMR (schofieldReeKcal). Age-appropriate coefficients applied automatically by the scope builder.", 1);
  await note(SEED_IDS.hsct_peds_infant_note2, null, SEED_IDS.hsct_peds_infant, "Protein: <2y: 2.5–3.0 g/kg; 2–5y: 2.0–2.5 g/kg; ≥6y: 1.5–2.0 g/kg.", 2);
  await note(SEED_IDS.hsct_peds_child_note1, null, SEED_IDS.hsct_peds_child, "Energy based on Schofield WH BMR (schofieldReeKcal). Age-appropriate coefficients applied automatically by the scope builder.", 1);
  await note(SEED_IDS.hsct_peds_child_note2, null, SEED_IDS.hsct_peds_child, "Protein: <2y: 2.5–3.0 g/kg; 2–5y: 2.0–2.5 g/kg; ≥6y: 1.5–2.0 g/kg.", 2);
  await note(SEED_IDS.hsct_peds_older_note1, null, SEED_IDS.hsct_peds_older, "Energy based on Schofield WH BMR (schofieldReeKcal). Age-appropriate coefficients applied automatically by the scope builder.", 1);
  await note(SEED_IDS.hsct_peds_older_note2, null, SEED_IDS.hsct_peds_older, "Protein: <2y: 2.5–3.0 g/kg; 2–5y: 2.0–2.5 g/kg; ≥6y: 1.5–2.0 g/kg.", 2);
  await note(SEED_IDS.sbs_peds_pndep_note1, null, SEED_IDS.sbs_peds_pndep, "Fluid needs are highly individualized. Monitor output closely to adjust targets.", 1);
  await note(SEED_IDS.sbs_peds_entaut_note1, null, SEED_IDS.sbs_peds_pndep, "Pediatric sodium supplementation: monitor urinary sodium concentration (target >20 mEq/L) to guide replacement.", 2);
  await note(SEED_IDS.sbs_peds_entaut_note2, null, SEED_IDS.sbs_peds_pndep, "Intestinal adaptation continues for up to 2 years post-resection; enteral feeding promotes adaptation.", 3);
  await note(SEED_IDS.sbs_peds_entaut_note3, null, SEED_IDS.sbs_peds_pndep, "Growth monitoring: closely monitor weight, length, and head circumference percentiles.", 4);
  await note(SEED_IDS.sbs_peds_pndep_note1, null, SEED_IDS.sbs_peds_entaut, "Fluid needs are highly individualized. Monitor output closely to adjust targets.", 1);
  await note(SEED_IDS.sbs_peds_entaut_note1, null, SEED_IDS.sbs_peds_entaut, "Pediatric sodium supplementation: monitor urinary sodium concentration (target >20 mEq/L) to guide replacement.", 2);
  await note(SEED_IDS.sbs_peds_entaut_note2, null, SEED_IDS.sbs_peds_entaut, "Intestinal adaptation continues for up to 2 years post-resection; enteral feeding promotes adaptation.", 3);
  await note(SEED_IDS.sbs_peds_entaut_note3, null, SEED_IDS.sbs_peds_entaut, "Growth monitoring: closely monitor weight, length, and head circumference percentiles.", 4);
  await note(SEED_IDS.cf_peds_note1, null, SEED_IDS.cf_peds_bedbound, "Energy based on Schofield WH BMR (schofieldReeKcal). Age-appropriate coefficients applied automatically by the scope builder.", 1);
  await note(SEED_IDS.cf_peds_note2, null, SEED_IDS.cf_peds_bedbound, "CF systems frequently truncate age at 10 — correct pediatric Schofield WH brackets used here.", 2);
  await note(SEED_IDS.cf_peds_note1, null, SEED_IDS.cf_peds_sedentary, "Energy based on Schofield WH BMR (schofieldReeKcal). Age-appropriate coefficients applied automatically by the scope builder.", 1);
  await note(SEED_IDS.cf_peds_note2, null, SEED_IDS.cf_peds_sedentary, "CF systems frequently truncate age at 10 — correct pediatric Schofield WH brackets used here.", 2);
  await note(SEED_IDS.cf_peds_note1, null, SEED_IDS.cf_peds_active, "Energy based on Schofield WH BMR (schofieldReeKcal). Age-appropriate coefficients applied automatically by the scope builder.", 1);
  await note(SEED_IDS.cf_peds_note2, null, SEED_IDS.cf_peds_active, "CF systems frequently truncate age at 10 — correct pediatric Schofield WH brackets used here.", 2);
  await note(SEED_IDS.hl_peds_norm_note1, null, SEED_IDS.hl_peds_normal, "DRI/EER equations apply age and sex-specific coefficients automatically. PAL required (1.0–2.5 slider). For precise DRI/EER, the legacy engine path is preserved until full DRI expression migration.", 1);
  await note(SEED_IDS.hl_peds_overweight_note1, null, SEED_IDS.hl_peds_overweight, "For pediatric overweight/obesity, use the DRI/EER overweight/obese calculations to estimate EER. General target is to promote linear growth while stabilizing weight.", 1);
  await note(SEED_IDS.mal_peds_note1, null, SEED_IDS.mal_peds_catchup, "FOLLOW-UP REQUIRED: Pediatric catch-up growth formula [RDA × Ideal Weight / Actual Weight] requires an Ideal Weight for Height input not yet implemented. Start at 50% of energy target and advance over 3–5 days. Monitor phosphorus, magnesium, potassium, and thiamine.", 1);
  await note(SEED_IDS.obe_peds_note1, null, SEED_IDS.obe_peds_stable, "Pediatric obesity energy targets are calculated via the DRI/EER Overweight equations in the Healthy / Preventive → Pediatric → Overweight path. Use that condition instead.", 1);
  await note(SEED_IDS.obe_peds_note2, null, SEED_IDS.obe_peds_stable, "Gradual growth-preserving weight management: target weight stabilization, not active loss, during linear growth phases.", 2);
  await note(SEED_IDS.bpd_peds_note1, null, SEED_IDS.bpd_peds_std, "Fluid: BPD management often requires fluid restriction (e.g. 120–140 mL/kg/day) to prevent pulmonary edema.", 1);
  await note(SEED_IDS.bpd_peds_note2, null, SEED_IDS.bpd_peds_std, "Formula density: high energy needs (120–150 kcal/kg) often necessitate concentrated formulas (24–30 kcal/oz).", 2);
  await note(SEED_IDS.bpd_peds_note3, null, SEED_IDS.bpd_peds_std, "Weekly growth monitoring: target 15–20 g/day weight gain for infants <34 weeks post-menstrual age.", 3);
  await note(SEED_IDS.bpd_peds_note4, null, SEED_IDS.bpd_peds_std, "Source: targets based on Gipson et al. (2025) clinical recommendations.", 4);
  await note(SEED_IDS.preg_peds_note1, null, SEED_IDS.preg_peds_t1, "Standard systems bypass safety blocks for pregnant adolescents (14–17y) by applying adult MSJ — Schofield WH used here instead.", 1);
  await note(SEED_IDS.preg_peds_note1, null, SEED_IDS.preg_peds_t2, "Standard systems bypass safety blocks for pregnant adolescents (14–17y) by applying adult MSJ — Schofield WH used here instead.", 1);
  await note(SEED_IDS.preg_peds_note1, null, SEED_IDS.preg_peds_t3, "Standard systems bypass safety blocks for pregnant adolescents (14–17y) by applying adult MSJ — Schofield WH used here instead.", 1);
  await note(SEED_IDS.bf_peds_early_note1, null, SEED_IDS.bf_peds_early, "Energy based on Schofield WH BMR (schofieldReeKcal). Age-appropriate coefficients applied automatically by the scope builder.", 1);
  await note(SEED_IDS.bf_peds_late_note1, null, SEED_IDS.bf_peds_late, "Energy based on Schofield WH BMR (schofieldReeKcal). Age-appropriate coefficients applied automatically by the scope builder.", 1);

  // ─── 8. Extra inputs ──────────────────────────────────────────────────────
  // Critical Illness Adult (3 leaves × 3 inputs)
  for (const [leaf, ids] of [
    [SEED_IDS.crit_ill_bmi_lt30,  [SEED_IDS.crit_ill_lt30_isMechVent,  SEED_IDS.crit_ill_lt30_tempMax,  SEED_IDS.crit_ill_lt30_ve]],
    [SEED_IDS.crit_ill_bmi_30_50, [SEED_IDS.crit_ill_30_50_isMechVent, SEED_IDS.crit_ill_30_50_tempMax, SEED_IDS.crit_ill_30_50_ve]],
    [SEED_IDS.crit_ill_bmi_gt50,  [SEED_IDS.crit_ill_gt50_isMechVent,  SEED_IDS.crit_ill_gt50_tempMax,  SEED_IDS.crit_ill_gt50_ve]],
  ] as const) {
    await extra(ids[0], leaf, "isMechVent", "Mechanically Ventilated",        "boolean", null, 1);
    await extra(ids[1], leaf, "tempMax",    "Max Temp past 24h (°F)",          "number",  "Required for PSU 2003b / PSU 2010", 2);
    await extra(ids[2], leaf, "ve",         "Minute Ventilation Ve (L/min)",   "number",  "Required for PSU 2003b / PSU 2010", 3);
  }

  // CF (6 leaves × 3 inputs)
  const cfLeaves = [
    [SEED_IDS.cf_bedbound,       [SEED_IDS.cf_bb_fev1Pct,       SEED_IDS.cf_bb_isPancreaticSufficient,       SEED_IDS.cf_bb_cfa]],
    [SEED_IDS.cf_sedentary,      [SEED_IDS.cf_sed_fev1Pct,      SEED_IDS.cf_sed_isPancreaticSufficient,      SEED_IDS.cf_sed_cfa]],
    [SEED_IDS.cf_active,         [SEED_IDS.cf_act_fev1Pct,      SEED_IDS.cf_act_isPancreaticSufficient,      SEED_IDS.cf_act_cfa]],
    [SEED_IDS.cf_peds_bedbound,  [SEED_IDS.cf_peds_bb_fev1Pct,  SEED_IDS.cf_peds_bb_isPancreaticSufficient,  SEED_IDS.cf_peds_bb_cfa]],
    [SEED_IDS.cf_peds_sedentary, [SEED_IDS.cf_peds_sed_fev1Pct, SEED_IDS.cf_peds_sed_isPancreaticSufficient, SEED_IDS.cf_peds_sed_cfa]],
    [SEED_IDS.cf_peds_active,    [SEED_IDS.cf_peds_act_fev1Pct, SEED_IDS.cf_peds_act_isPancreaticSufficient, SEED_IDS.cf_peds_act_cfa]],
  ] as const;
  for (const [leaf, ids] of cfLeaves) {
    await extra(ids[0], leaf, "fev1Pct",               "FEV₁ % Predicted",                 "number",  null, 1);
    await extra(ids[1], leaf, "isPancreaticSufficient", "Pancreatic Sufficient",             "boolean", null, 2);
    await extra(ids[2], leaf, "cfa",                   "Coefficient of Fat Absorption (CFA)","number",  "Default 0.85 if no stool collection", 3);
  }

  // Burns (3 leaves × 4 inputs each)
  const burnsLeaves = [
    [SEED_IDS.burns_toronto,   [SEED_IDS.burns_toronto_tbsaPct,       SEED_IDS.burns_toronto_pbd,           SEED_IDS.burns_toronto_caloricIntake,      SEED_IDS.burns_toronto_coreTemp]],
    [SEED_IDS.burns_peds_child,[SEED_IDS.burns_peds_child_tbsaPct,    SEED_IDS.burns_peds_child_pbd,        SEED_IDS.burns_peds_child_caloricIntake,   SEED_IDS.burns_peds_child_coreTemp]],
    [SEED_IDS.burns_peds_adol, [SEED_IDS.burns_peds_adol_tbsaPct,     SEED_IDS.burns_peds_adol_pbd,         SEED_IDS.burns_peds_adol_caloricIntake,    SEED_IDS.burns_peds_adol_coreTemp]],
  ] as const;
  for (const [leaf, ids] of burnsLeaves) {
    await extra(ids[0], leaf, "tbsaPct",       "TBSA Burned (%)",                    "number", null, 1);
    await extra(ids[1], leaf, "pbd",           "Post-Burn Day (PBD)",                "number", "Required for Toronto equation", 2);
    await extra(ids[2], leaf, "caloricIntake", "Current Caloric Intake (kcal/day)",  "number", "Required for Toronto equation", 3);
    await extra(ids[3], leaf, "coreTemp",      "Core Temperature (°C)",              "number", "Required for Toronto equation", 4);
  }

  // Trauma open abdomen
  await extra(SEED_IDS.trauma_open_exudateVolumeL,      SEED_IDS.trauma_open_abdomen, "exudateVolumeL", "Exudate Volume (L)", "number", "Required for open abdomen adjustment", 1);
  await extra(SEED_IDS.trauma_peds_open_exudateVolumeL, SEED_IDS.trauma_peds_open,    "exudateVolumeL", "Exudate Volume (L)", "number", "Required for open abdomen adjustment", 1);

  // SCD (4 leaves × 1 input each)
  const scdLeaves = [
    [SEED_IDS.scd_stable,      SEED_IDS.scd_stable_hgb],
    [SEED_IDS.scd_voc,         SEED_IDS.scd_voc_hgb],
    [SEED_IDS.scd_peds_stable, SEED_IDS.scd_peds_stable_hgb],
    [SEED_IDS.scd_peds_voc,    SEED_IDS.scd_peds_voc_hgb],
  ] as const;
  for (const [leaf, id] of scdLeaves) {
    await extra(id, leaf, "hgb", "Hemoglobin (g/dL)", "number", null, 1);
  }

  // Heart Failure PAL
  await extra(SEED_IDS.heart_failure_pal, SEED_IDS.heart_failure_standard, "pal", "Physical Activity Level (PAL)", "number", "1.2 = sedentary, 1.5 = lightly active", 1);

  // CKD 5D urine output (4 leaves)
  const ckd5dLeaves = [
    [SEED_IDS.ckd_hd,       SEED_IDS.ckd_hd_urineOutputMlDay],
    [SEED_IDS.ckd_pd,       SEED_IDS.ckd_pd_urineOutputMlDay],
    [SEED_IDS.ckd_peds_hd,  SEED_IDS.ckd_peds_hd_urineOutputMlDay],
    [SEED_IDS.ckd_peds_pd,  SEED_IDS.ckd_peds_pd_urineOutputMlDay],
  ] as const;
  for (const [leaf, id] of ckd5dLeaves) {
    await extra(id, leaf, "urineOutputMlDay", "Urine Output (mL/day)", "number", null, 1);
  }

  // Pressure Injuries targetKcal (4 leaves)
  const piLeaves = [
    [SEED_IDS.pi_stage1_2,       SEED_IDS.pi_stage1_2_targetKcal],
    [SEED_IDS.pi_stage3_4,       SEED_IDS.pi_stage3_4_targetKcal],
    [SEED_IDS.pi_peds_stage1_2,  SEED_IDS.pi_peds_stage1_2_targetKcal],
    [SEED_IDS.pi_peds_stage3_4,  SEED_IDS.pi_peds_stage3_4_targetKcal],
  ] as const;
  for (const [leaf, id] of piLeaves) {
    await extra(id, leaf, "targetKcal", "Prescribed kcal/day (for fluid calc)", "number", null, 1);
  }

  // AKI urine output (5 leaves)
  const akiLeaves = [
    [SEED_IDS.aki_no_dialysis,   SEED_IDS.aki_no_dial_urineOutputMlDay],
    [SEED_IDS.aki_hemodialysis,  SEED_IDS.aki_hd_urineOutputMlDay],
    [SEED_IDS.aki_crrt,          SEED_IDS.aki_crrt_urineOutputMlDay],
    [SEED_IDS.aki_peds_nodial,   SEED_IDS.aki_peds_nodial_urineOutputMlDay],
    [SEED_IDS.aki_peds_dial,     SEED_IDS.aki_peds_dial_urineOutputMlDay],
  ] as const;
  for (const [leaf, id] of akiLeaves) {
    await extra(id, leaf, "urineOutputMlDay", "Urine Output (mL/day)", "number", null, 1);
  }

  // Oncology peds
  await extra(SEED_IDS.onc_peds_std_isUndernourished, SEED_IDS.onc_peds_std,         "isUndernourished", "Undernourished / Catch-up Growth Needed", "boolean", null, 1);
  await extra(SEED_IDS.onc_peds_und_isUndernourished, SEED_IDS.onc_peds_undernourished,"isUndernourished", "Undernourished / Catch-up Growth Needed", "boolean", null, 1);

  // SBS (3 leaves × 3 boolean inputs)
  const sbsLeaves = [
    [SEED_IDS.sbs_standard,   [SEED_IDS.sbs_std_hasPreservedColon,       SEED_IDS.sbs_std_remainingBowelShort,       SEED_IDS.sbs_std_growthSuboptimal]],
    [SEED_IDS.sbs_peds_pndep, [SEED_IDS.sbs_peds_pndep_hasPreservedColon, SEED_IDS.sbs_peds_pndep_remainingBowelShort, SEED_IDS.sbs_peds_pndep_growthSuboptimal]],
    [SEED_IDS.sbs_peds_entaut,[SEED_IDS.sbs_peds_entaut_hasPreservedColon,SEED_IDS.sbs_peds_entaut_remainingBowelShort,SEED_IDS.sbs_peds_entaut_growthSuboptimal]],
  ] as const;
  for (const [leaf, ids] of sbsLeaves) {
    await extra(ids[0], leaf, "hasPreservedColon",   "Preserved Colon (increases water absorption)", "boolean", null, 1);
    await extra(ids[1], leaf, "remainingBowelShort", "Remaining Bowel < 40 cm or Excessive Output",  "boolean", null, 2);
    await extra(ids[2], leaf, "growthSuboptimal",    "Suboptimal Growth Trajectory",                 "boolean", null, 3);
  }
}