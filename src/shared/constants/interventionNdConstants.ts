// src/shared/constants/interventionNdConstants.ts
// Pure data — no imports from stores, hooks, or features.
// Consumed by: all Implementation sub-section components (steps 10–19).
// Source taxonomy: encpt_intervention_directory.txt (eNCPT NCP 2024).

// ── Type helper ───────────────────────────────────────────────────────────────
// Used for two-level chip expansion in NdFoodDeliverySection (ND-1).
// Parent label opens an inline child chip panel.

export interface CategorizedOption {
  label: string;
  children?: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// ND-1: Meals and Snacks
// ─────────────────────────────────────────────────────────────────────────────

export const ND1_DIET_TYPES: string[] = [
  "General healthful diet",
  "Vegetarian diet",
  "Pesco vegetarian diet",
  "Lacto ovo vegetarian diet",
  "Lacto vegetarian diet",
  "Ovo vegetarian diet",
  "Vegan diet",
  "Halal diet",
  "Kosher diet",
  "Mediterranean diet",
  "Carbohydrate counting diet",
  "Decreased FODMAP diet",
  "FODMAP reintroduction diet",
  "Customized low FODMAP diet",
  "Low microbial diet",
  "Decreased oxalate diet",
];

// Alias — shared with NP texture options to avoid duplication.
// Components import NP_TEXTURE_OPTIONS from interventionNpConstants for this field.

export const ND1_TEXTURE_OPTIONS = "→ import NP_TEXTURE_OPTIONS from interventionNpConstants";

export const ND1_PROTEIN_MODS: string[] = [
  "Consistent protein diet",
  "Increased protein diet",
  "Decreased protein diet",
  "Decreased casein diet",
  "Decreased gluten diet",
  "Gluten free diet",
];

export const ND1_AMINO_ACID_MODS: CategorizedOption[] = [
  { label: "Arginine",     children: ["Increased arginine diet",     "Decreased arginine diet"] },
  { label: "Glutamine",    children: ["Increased glutamine diet",    "Decreased glutamine diet"] },
  { label: "Histidine",    children: ["Increased histidine diet",    "Decreased histidine diet", "Increased homocysteine diet"] },
  { label: "Isoleucine",   children: ["Increased isoleucine diet",   "Decreased isoleucine diet"] },
  { label: "Leucine",      children: ["Increased leucine diet",      "Decreased leucine diet"] },
  { label: "Lysine",       children: ["Increased lysine diet",       "Decreased lysine diet"] },
  { label: "Methionine",   children: ["Increased methionine diet",   "Decreased methionine diet"] },
  { label: "Phenylalanine",children: ["Increased phenylalanine diet","Decreased phenylalanine diet"] },
  { label: "Threonine",    children: ["Increased threonine diet",    "Decreased threonine diet"] },
  { label: "Tryptophan",   children: ["Increased tryptophan diet",   "Decreased tryptophan diet", "Decreased tyramine diet"] },
  { label: "Tyrosine",     children: ["Increased tyrosine diet",     "Decreased tyrosine diet"] },
  { label: "Valine",       children: ["Increased valine diet",       "Decreased valine diet"] },
];

export const ND1_CARB_MODS: CategorizedOption[] = [
  {
    label: "General carbohydrate",
    children: [
      "Consistent carbohydrate diet",
      "Increased carbohydrate diet",
      "Increased complex carbohydrate diet",
      "Increased simple carbohydrate diet",
      "Decreased carbohydrate diet",
      "Decreased complex carbohydrate diet",
      "Decreased simple carbohydrate diet",
    ],
  },
  { label: "Galactose", children: ["Increased galactose diet", "Decreased galactose diet"] },
  { label: "Lactose",   children: ["Increased lactose diet",   "Decreased lactose diet"] },
  { label: "Fructose",  children: ["Increased fructose diet",  "Decreased fructose diet"] },
];

export const ND1_FAT_MODS: CategorizedOption[] = [
  {
    label: "General fat",
    children: ["Increased fat diet", "Decreased fat diet"],
  },
  {
    label: "Monounsaturated fat",
    children: ["Increased monounsaturated fat diet", "Decreased monounsaturated fat diet"],
  },
  {
    label: "Polyunsaturated fat",
    children: [
      "Increased polyunsaturated fat diet",
      "Increased linoleic acid diet",
      "Decreased polyunsaturated fat diet",
      "Decreased linoleic acid diet",
    ],
  },
  {
    label: "Saturated fat",
    children: ["Decreased saturated fat diet"],
  },
  {
    label: "Trans fat",
    children: ["Decreased trans fat modified diet"],
  },
  {
    label: "Omega-3 fatty acids",
    children: [
      "Increased omega 3 fatty acid diet",
      "Increased alpha linolenic acid diet",
      "Increased eicosapentaenoic acid diet",
      "Increased docosahexaenoic acid",
      "Decreased omega 3 fatty acid diet",
      "Decreased alpha linolenic acid diet",
      "Decreased eicosapentaenoic acid diet",
      "Decreased docosahexaenoic acid",
    ],
  },
  {
    label: "Medium chain triglycerides",
    children: ["Increased medium chain triglyceride diet", "Decreased medium chain triglyceride diet"],
  },
  {
    label: "Cholesterol",
    children: ["Decreased cholesterol diet"],
  },
];

export const ND1_FIBER_MODS: string[] = [
  "Increased fiber diet",
  "Decreased fiber diet",
  "Increased soluble fiber diet",
  "Decreased soluble fiber diet",
  "Increased insoluble fiber diet",
  "Decreased insoluble fiber diet",
];

export const ND1_FLUID_MODS: string[] = [
  "Increased fluid diet",
  "Fluid restricted diet",
  "Clear liquid diet",
  "Full liquid diet",
];

export const ND1_MINERAL_MODS: CategorizedOption[] = [
  { label: "Calcium",    children: ["Increased calcium diet",    "Decreased calcium diet"] },
  { label: "Chloride",   children: ["Increased chloride diet",   "Decreased chloride diet"] },
  { label: "Iron",       children: ["Increased iron diet",       "Decreased iron diet"] },
  { label: "Magnesium",  children: ["Increased magnesium diet",  "Decreased magnesium diet"] },
  { label: "Potassium",  children: ["Increased potassium diet",  "Decreased potassium diet"] },
  { label: "Phosphorus", children: ["Increased phosphorus diet", "Decreased phosphorus diet"] },
  { label: "Sodium",     children: ["Increased sodium diet",     "Decreased sodium diet"] },
  { label: "Zinc",       children: ["Increased zinc diet",       "Decreased zinc diet"] },
  { label: "Sulfur",     children: ["Increased sulfur diet",     "Decreased sulfur diet"] },
  { label: "Copper",     children: ["Increased copper diet",     "Decreased copper diet"] },
  { label: "Iodine",     children: ["Increased iodine diet",     "Decreased iodine diet"] },
  { label: "Selenium",   children: ["Increased selenium diet",   "Decreased selenium diet"] },
  { label: "Manganese",  children: ["Increased manganese diet",  "Decreased manganese diet"] },
  { label: "Chromium",   children: ["Increased chromium diet",   "Decreased chromium diet"] },
  { label: "Molybdenum", children: ["Increased molybdenum diet", "Decreased molybdenum diet"] },
  { label: "Boron",      children: ["Increased boron diet",      "Decreased boron diet"] },
  { label: "Cobalt",     children: ["Increased cobalt diet",     "Decreased cobalt diet"] },
];

export const ND1_VITAMIN_MODS: CategorizedOption[] = [
  { label: "Vitamin A",        children: ["Increased vitamin A diet",        "Decreased vitamin A diet"] },
  { label: "Vitamin C",        children: ["Increased vitamin C diet",        "Decreased vitamin C diet"] },
  { label: "Vitamin D",        children: ["Increased vitamin D diet",        "Decreased vitamin D diet"] },
  { label: "Vitamin E",        children: ["Increased vitamin E diet",        "Decreased vitamin E diet"] },
  { label: "Vitamin K",        children: ["Increased vitamin K diet",        "Decreased vitamin K diet"] },
  { label: "Thiamine",         children: ["Increased thiamine diet",         "Decreased thiamine diet"] },
  { label: "Riboflavin",       children: ["Increased riboflavin diet",       "Decreased riboflavin diet"] },
  { label: "Niacin",           children: ["Increased niacin diet",           "Decreased niacin diet"] },
  { label: "Folic Acid",       children: ["Increased folic acid diet",       "Decreased folic acid diet"] },
  { label: "Vitamin B6",       children: ["Increased vitamin B6 diet",       "Decreased vitamin B6 diet"] },
  { label: "Vitamin B12",      children: ["Increased vitamin B12 diet",      "Decreased vitamin B12 diet"] },
  { label: "Pantothenic Acid", children: ["Increased pantothenic acid diet", "Decreased pantothenic acid diet"] },
  { label: "Biotin",           children: ["Increased biotin diet",           "Decreased biotin diet"] },
];

export const ND1_FOOD_GROUP_MODS: string[] = [
  "Fruit modified diet",
  "Vegetable modified diet",
  "Starchy vegetable modified diet",
  "Bean and pea modified diet",
  "Grain modified diet",
  "Protein food modified diet",
];

export const ND1_SPECIFIC_FOOD_MODS: string[] = [
  "Beef free diet",
  "Caffeine free diet",
  "Cow milk free diet",
  "Raw egg free diet",
  "Egg free diet",
  "Fish free diet",
  "Goat milk free diet",
  "Lupin free diet",
  "Mammalian meat free diet",
  "Mammalian milk free diet",
  "Peanut free diet",
  "Pork free diet",
  "Sesame free diet",
  "Sheep milk free diet",
  "Shellfish free diet",
  "Soy free diet",
  "Tree nut free diet",
  "Wheat free diet",
];

export const ND1_INTAKE_TIMING: string[] = [
  "Advance diet as tolerated",
  "Nil per os (NPO)",
  "Modification of schedule of oral intake",
  "Modification of schedule of intake to limit fasting",
];

export const ND1_OTHER: string[] = [
  "Decreased oxalate diet",
  "Low microbial diet",
];

// ─────────────────────────────────────────────────────────────────────────────
// ND-2: Enteral and Parenteral Nutrition Management
// ─────────────────────────────────────────────────────────────────────────────

export const ND2_EN_ACTIONS: string[] = [
  "Management of composition of enteral nutrition",
  "Management of concentration of enteral nutrition",
  "Management of volume of enteral nutrition",
  "Management of rate of enteral nutrition",
  "Management of schedule of enteral nutrition",
  "Management of route of enteral nutrition",
  "Insert enteral feeding tube",
  "Management of enteral nutrition site care",
  "Management of flushing of feeding tube",
];

export const ND2_PN_ACTIONS: string[] = [
  "Management of composition of parenteral nutrition",
  "Management of concentration of parenteral nutrition",
  "Management of rate of parenteral nutrition",
  "Management of volume of parenteral nutrition",
  "Management of schedule of parenteral nutrition",
  "Management of route of parenteral nutrition",
  "Management of parenteral nutrition site care",
  "Management of IV fluid delivery",
];

// ─────────────────────────────────────────────────────────────────────────────
// ND-3: Nutrition Supplement Therapy
// ─────────────────────────────────────────────────────────────────────────────

export const ND3_MEDICAL_FOOD_ACTIONS: string[] = [
  "Commercial beverage medical food supplement therapy",
  "Commercial food medical food supplement therapy",
  "Modified beverage medical food supplement therapy",
  "Modified food medical food supplement therapy",
];

export const ND3_VITAMIN_SUPPLEMENTS: string[] = [
  "Multivitamin/mineral supplement therapy",
  "Vitamin A supplement therapy",
  "Vitamin C supplement therapy",
  "Vitamin D supplement therapy",
  "Vitamin E supplement therapy",
  "Vitamin K supplement therapy",
  "Thiamin supplement therapy",
  "Riboflavin supplement therapy",
  "Niacin supplement therapy",
  "Folate supplement therapy",
  "Vitamin B6 supplement therapy",
  "Vitamin B12 supplement therapy",
  "Pantothenic acid supplement therapy",
  "Biotin supplement therapy",
];

export const ND3_MINERAL_SUPPLEMENTS: string[] = [
  "Multi-trace element supplement therapy",
  "Calcium supplement therapy",
  "Chloride supplement therapy",
  "Iron supplement therapy",
  "Magnesium supplement therapy",
  "Potassium supplement therapy",
  "Phosphorus supplement therapy",
  "Sodium supplement therapy",
  "Zinc supplement therapy",
  "Sulfate supplement therapy",
  "Fluoride supplement therapy",
  "Copper supplement therapy",
  "Iodine supplement therapy",
  "Selenium supplement therapy",
  "Manganese supplement therapy",
  "Chromium supplement therapy",
  "Molybdenum supplement therapy",
  "Boron supplement therapy",
  "Cobalt supplement therapy",
];

export const ND3_BIOACTIVE_ACTIONS: string[] = [
  "Plant stanol esters management",
  "Plant sterol esters management",
  "Soy protein management",
  "Psyllium management",
  "Beta glucan management",
  "Food additives management",
  "Alcohol management",
  "Caffeine management",
];

// ─────────────────────────────────────────────────────────────────────────────
// ND-4: Feeding Assistance Management
// ─────────────────────────────────────────────────────────────────────────────

export const ND4_FEEDING_ASSISTANCE_ACTIONS: string[] = [
  "Adaptive eating device management",
  "Feeding position management",
  "Meal set up management",
  "Mouth care management",
  "Menu selection assistance",
  "Other feeding assistance",
];

// ─────────────────────────────────────────────────────────────────────────────
// ND-5: Feeding Environment Management
// ─────────────────────────────────────────────────────────────────────────────

export const ND5_ENVIRONMENT_ACTIONS: string[] = [
  "Feeding environment lighting management",
  "Feeding environment odors management",
  "Feeding environment distractions management",
  "Feeding environment table height management",
  "Feeding environment table service management",
  "Feeding environment room temperature management",
  "Feeding environment meal service management",
  "Feeding environment meal location management",
];

// ─────────────────────────────────────────────────────────────────────────────
// ND-6: Nutrition Related Medication Management
// ─────────────────────────────────────────────────────────────────────────────

export const ND6_MED_MANAGEMENT_ACTIONS: string[] = [
  "Management of nutrition related prescription medication",
  "Management of nutrition related over the counter (OTC) medication",
  "Management of nutrition related complementary and alternative medicine",
];

// ─────────────────────────────────────────────────────────────────────────────
// ND-7: Infant Feeding Management
// ─────────────────────────────────────────────────────────────────────────────

export const ND7_BREASTMILK_ACTIONS: string[] = [
  "Management of concentration of breastmilk",
  "Management of human milk fortifier additive in breastmilk",
  "Management of carbohydrate additive in breastmilk",
  "Management of fat additive in breastmilk",
  "Management of protein additive in breastmilk",
  "Management of fiber additive in breastmilk",
  "Management of added infant formula in breastmilk",
  "Management of breastfeeding attempts",
  "Management of volume of breastmilk",
  "Evaluation of breastfeeding plan",
  "Evaluation of breastfeeding",
  "Evaluation of breastfeeding behavior",
  "Promotion of exclusive breastfeeding",
  "Promotion of predominant breastfeeding",
  "Promotion of partial breastfeeding",
];

export const ND7_FORMULA_ACTIONS: string[] = [
  "Management of composition of infant formula",
  "Management of concentration of infant formula",
  "Management of human milk fortifier additive in infant formula",
  "Management of carbohydrate additive in infant formula",
  "Management of fat additive in infant formula",
  "Management of protein additive in infant formula",
  "Management of fiber additive in infant formula",
  "Management of infant formula feeding attempts",
  "Management of volume of infant formula",
  "Evaluation of infant formula feeding plan",
  "Evaluation of infant formula feeding",
  "Evaluation of infant formula feeding behavior",
];

// ─────────────────────────────────────────────────────────────────────────────
// E: Nutrition Education
// ─────────────────────────────────────────────────────────────────────────────

export const E1_CONTENT_ACTIONS: string[] = [
  "Content related nutrition education",
  "Education on nutrition's influence on health",
  "Physical activity guidance",
];

export const E2_APPLICATION_ACTIONS: string[] = [
  "Nutrition related laboratory result interpretation education",
  "Nutrition related skill education",
  "Technical nutrition education",
];

// ─────────────────────────────────────────────────────────────────────────────
// C: Nutrition Counseling
// ─────────────────────────────────────────────────────────────────────────────

export const C1_THEORETICAL_BASIS: string[] = [
  "Cognitive behavioral theory approach",
  "Health belief model",
  "Social learning theory approach",
  "Transtheoretical model / stages of change approach",
];

export const C2_STRATEGIES: string[] = [
  "Motivational interviewing",
  "Goal setting",
  "Self monitoring",
  "Problem solving",
  "Social support",
  "Stress management",
  "Stimulus control",
  "Cognitive restructuring",
  "Relapse prevention",
  "Rewards and contingency management",
];

// ─────────────────────────────────────────────────────────────────────────────
// RC: Coordination of Nutrition Care
// ─────────────────────────────────────────────────────────────────────────────

export const RC1_COLLABORATION_ACTIONS: string[] = [
  "Team meeting involving nutrition professional",
  "Referral to another nutrition professional with different expertise",
  "Collaboration with other nutrition professionals",
  "Collaboration with other providers",
  "Referral to other provider",
  "Referral to community agencies and programs",
];

export const RC2_DISCHARGE_ACTIONS: string[] = [
  "Discharge and transfer of nutrition care to other providers",
  "Discharge and transfer of nutrition care to community agencies and programs",
  "Discharge and transfer of nutrition care to another nutrition professional",
];
