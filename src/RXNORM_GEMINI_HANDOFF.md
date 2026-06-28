# RxNorm Medication Architecture Handoff

## Goal

Redesign medication lookup so the app is dietitian-friendly and clinically accurate. The user should select a fixed RxNorm medication product, then document the clinician's order separately. Do not expose UMLS API keys or technical sync concepts to dietitians.

## Core Model

Separate medication product from medication order.

```ts
interface MedicationProduct {
  rxcui: string;
  displayName: string;
  ingredient: string;
  strengthValue: number | null;
  strengthUnit: string;
  doseForm: string;
  tty: "SCD";
}

interface MedicationOrder {
  product: MedicationProduct;
  doseAmount: number | string;
  doseUnit: string;
  route: string;
  frequency: string;
  notes: string;
}
```

Example:

- Product: `Acetaminophen 500 MG Oral Tablet`
- Order: `Take 2 tablets`, `PO`, `Every 6 hours PRN`

The RxNorm product does not change when dose amount, route, frequency, or notes change.

## Database Target

Replace any legacy `drug_names` usage with `rxnorm_products`.

```sql
CREATE TABLE IF NOT EXISTS rxnorm_products (
  rxcui TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  ingredient TEXT,
  strength_value REAL,
  strength_unit TEXT,
  dose_form TEXT,
  tty TEXT NOT NULL DEFAULT 'SCD'
);

CREATE INDEX IF NOT EXISTS idx_rxnorm_display
ON rxnorm_products(display_name);
```

Use this table as the source for medication autocomplete.

## RxNorm Source

Use the monthly RxNorm release files and import `RXNCONSO.RRF`.

Import behavior:

1. Read `RXNCONSO.RRF` from the monthly release zip.
2. Parse pipe-delimited rows.
3. Filter to `TTY = "SCD"` only for Semantic Clinical Drug products.
4. Insert:
   - `RXCUI` -> `rxcui`
   - `STR` -> `display_name`
   - parsed ingredient -> `ingredient`
   - parsed strength number -> `strength_value`
   - parsed strength unit -> `strength_unit`
   - parsed dose form -> `dose_form`
   - `TTY` -> `tty`

Existing backend file to review: `src-tauri/src/rxnorm.rs`.

## Important Existing Issue

Make sure the Rust importer and frontend SQL plugin use the same SQLite location. The frontend loads:

```ts
Database.load("sqlite:drugs.db")
```

For Tauri SQL, this maps to the app config directory. The Rust backend should write `drugs.db` there too, using `app.path().app_config_dir()`.

## Frontend Lookup

Existing component to review: `src/features/drugs/DrugLookupTool.tsx`.

Desired behavior:

- Search `rxnorm_products` by `display_name`.
- Selecting a result stores a `MedicationProduct`.
- Dose amount, unit, route, frequency, and notes remain editable order fields.
- Manual entry should remain possible if no RxNorm match is found.
- The UI should not block documentation because the drug database is unavailable.

Suggested query:

```sql
SELECT rxcui, display_name, ingredient, strength_value, strength_unit, dose_form, tty
FROM rxnorm_products
WHERE display_name LIKE ?
ORDER BY
  CASE WHEN display_name LIKE ? THEN 0 ELSE 1 END,
  LENGTH(display_name),
  display_name
LIMIT ?
```

## Dietitian-Facing UX

Avoid:

- "UMLS API key"
- "RxNorm not synced"
- "RXNCONSO"
- Any credential/setup language in normal Settings

Use plain language:

- "Medication search is ready"
- "Medication search needs an update"
- "Update medication search"
- "Medication search is unavailable; manual entry is still available"

If an update control exists, it should be an admin/developer or one-click app maintenance action, not a dietitian workflow requiring pasted secrets.

## Acceptance Criteria

- `drug_names` is no longer used for medication lookup.
- `rxnorm_products` exists with the schema above.
- Monthly RxNorm `RXNCONSO.RRF` import populates SCD products.
- Medication selection stores immutable product fields separately from order fields.
- Medication order edits never mutate the selected product.
- Dietitian UI does not ask for UMLS credentials.
- Search still permits manual entry when no RxNorm result is available.
