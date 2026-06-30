# RD-Tools Project Architecture & AI Guidelines
You are working in a React + TypeScript + Zustand + Tauri application following a modified Feature-Sliced Design (FSD). Your primary goal is to **maintain strict architectural boundaries** and **minimize context window usage** by keeping files small, modular, and isolated.

## 1. State Management (Zustand)
- **Zero Prop Drilling:** NEVER pass domain state down through props. Components must read directly from their respective domain store (e.g., `const { anthro } = useAnthroStore()`).
- **One Store Per Domain:** Every major feature gets its own store in `src/stores/`.
- **Derived State:** Any value calculated from multiple stores (e.g., BMI, Age) MUST be placed in `src/stores/useCalculatedMetrics.ts`. Do not calculate shared metrics inside UI components.

## 2. Adding a New Feature / Domain
When instructed to add a new major feature or domain, do NOT bloat existing files. Execute in this exact order:
1. **Types:** Create `src/types/<newFeature>.ts` and export it from `src/types/index.ts`. No `any` types allowed.
2. **Store:** Create `src/stores/use<NewFeature>Store.ts`. Follow the exact pattern used in `useClinicalStore.ts` (include `registerDomainReset` and `registerDomainGetter`).
3. **Feature Folder:** Create `src/features/<new-feature>/`. 
4. **Container Component:** Create `src/features/<new-feature>/<NewFeature>Domain.tsx`. It must be a pure layout/switch container.
5. **Sub-components:** Split UI logic into sub-components within the feature folder (e.g., `NewFeaturePartOne.tsx`). Sub-components read directly from the new store.
6. **Routing Registration:** Update `src/stores/useUIStore.ts` (if new navigation state is needed), `src/widgets/Sidebar.tsx`, and `src/pages/CreateNotePage.tsx` with a single surgical line addition.

## 3. Modifying Existing Features (Context Window Optimization)
To save tokens and prevent regressions, use the following surgical workflow:
- **Search First:** Use `grep_search` to find the exact sub-component responsible for the UI element. Do NOT read the parent `*Domain.tsx` file unless necessary.
- **Surgical Edits:** Use the `replace` tool for targeted edits rather than rewriting whole files.
- **Component Size Limits:** If your additions will push a component over ~300 lines, you MUST extract the new logic into a sibling sub-component file and import it.
- **Cross-Domain Communication:** If Feature A needs data from Feature B, Feature A must import Feature B's *store* (e.g., `useBiochemicalStore()`). Features must NEVER import UI components from other features.

## 4. Shared UI and Utilities
- Generic, reusable UI components (Buttons, Inputs, Modals, Tooltips) belong in `src/shared/ui/`.
- Project-wide constants belong in `src/shared/constants/`.
- Pure functions (date formatting, math) belong in `src/shared/utils/`.
- ALWAYS search these folders before creating a new utility or UI wrapper to prevent duplication.