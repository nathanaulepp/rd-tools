# Dev Drift Guard

## What This Does
checkRegistryDrift() runs once at app boot in development mode only.
It compares two lists:
- Every non-locked field key in MASTER_DOMAINS (masterFieldRegistry.ts)
- Every key in the VALIDATED_KEYS hardcoded list (mirrors fieldValues in submitNote in db.commands.ts)

If any key exists in one list but not the other it logs a warning to the browser console.

## When To Update This File
You MUST update the VALIDATED_KEYS array in devDriftGuard.ts whenever you make any of these changes:

1. Add a new field to the fieldValues map in submitNote() in db.commands.ts
2. Remove a field from the fieldValues map in submitNote() in db.commands.ts
3. Add a new field to MASTER_DOMAINS in masterFieldRegistry.ts
4. Remove a field from MASTER_DOMAINS in masterFieldRegistry.ts

## How To Update
Open src/shared/utils/devDriftGuard.ts and update the VALIDATED_KEYS array to match the current set of keys in the fieldValues map inside submitNote() in src/shared/api/db.commands.ts.

## What To Do When The Guard Fires
If you see a [DriftGuard] warning in the console:
- inRegistryNotValidated: these fields can be marked mandatory in Settings but will never block submission — decide if they should be added to the validator
- inValidatorNotRegistry: these fields block submission but cannot be toggled in Settings — decide if they should be added to the registry as locked: true or as regular toggleable fields
