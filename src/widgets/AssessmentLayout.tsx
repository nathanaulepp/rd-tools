// AssessmentLayout.tsx
// NOTE: This file was previously importing DIETARY_CATEGORIES from DietaryDomain (wrong).
// The correct source is the shared constants file.
// This file appears to be a legacy barrel/layout file.
// All assembly now happens in src/pages/CreateNotePage.tsx.

import AnthroDomain from "../features/assessment/assess-anthro/AnthroDomain";
import BiochemicalDomain from "../features/assessment/assess-biochemical/BiochemicalDomain";
import ClinicalDomain from "../features/assessment/assess-clinical/ClinicalDomain";
import DietaryDomain from "../features/assessment/assess-dietary/DietaryDomain";
import { DIETARY_CATEGORIES } from "../shared/constants/adimeSideBarCategories";

export { AnthroDomain, BiochemicalDomain, ClinicalDomain, DietaryDomain, DIETARY_CATEGORIES };